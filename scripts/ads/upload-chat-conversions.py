#!/usr/bin/env python3
"""Upload web-chat leads to Google Ads as offline click conversions.

The chat client captures the ad click ID (gclid/gbraid/wbraid) on the landing
page and rig-web-services stores it with the submitted conversation. This
script pulls the export endpoint and uploads two tiers, mirroring how phone
calls are tracked:

  - "Chat Leads - Accepted" (secondary, id 7720133259): every completed chat
    intake — the analog of the 60-second call actions. Abandoned/stale-promoted
    chats (partial=true) are NOT conversions and are skipped.
  - "Chat Jobs - Uploads" (primary, id 7720133262): chats whose service request
    captured revenue, valued in real dollars — the analog of "Calls - Uploads".

Idempotent: conversion time is the submit time, and Google dedups identical
(click id, action, time) rows, so re-running over an overlapping window is
safe. Run daily/weekly:

    /usr/bin/python3 scripts/ads/upload-chat-conversions.py [--days 30] [--dry-run]
"""
import argparse
import json
import sys
import urllib.request
from datetime import datetime, timezone

CUSTOMER_ID = "5579032852"
ACCEPTED_ACTION = f"customers/{CUSTOMER_ID}/conversionActions/7720133259"
JOB_ACTION = f"customers/{CUSTOMER_ID}/conversionActions/7720133262"
# Unified conversions export: {"calls": [...], "chats": [...]}. This script
# uploads the chat side; calls still go up via the legacy CSV
# (/ad/conversion.csv) until that flow moves to the API too.
EXPORT_URL = (
    "https://api.bigrig.app/admin/a52d35fa-b696-4a13-93e6-a31f4f98d9a7"
    "/ad/conversion?time_frame={days}"
)


def fetch_rows(days: int) -> list:
    with urllib.request.urlopen(EXPORT_URL.format(days=days), timeout=30) as res:
        body = json.load(res)
    # rig-web-services wraps responses in { data: ... } — unwrap when present.
    data = body.get("data") if isinstance(body, dict) and "data" in body else body
    if isinstance(data, str):  # endpoint returns the JSON as a string payload
        data = json.loads(data)
    if isinstance(data, dict):
        return data.get("chats") or []
    return data or []


def conversion_time(epoch: int) -> str:
    return datetime.fromtimestamp(epoch, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S+00:00")


def build_conversion(client, row, action, value_dollars):
    conv = client.get_type("ClickConversion")
    kind = row.get("click_kind") or "gclid"
    if kind == "gbraid":
        conv.gbraid = row["click_id"]
    elif kind == "wbraid":
        conv.wbraid = row["click_id"]
    else:
        conv.gclid = row["click_id"]
    conv.conversion_action = action
    conv.conversion_date_time = conversion_time(row["submitted_at_epoch"])
    conv.conversion_value = value_dollars
    conv.currency_code = "USD"
    return conv


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=30, help="export window (default 30)")
    ap.add_argument("--dry-run", action="store_true", help="print what would upload, no mutation")
    args = ap.parse_args()

    rows = fetch_rows(args.days)
    accepted = [r for r in rows if not r.get("partial") and r.get("click_id")]
    jobs = [r for r in accepted if (r.get("revenue_cents") or 0) > 0]
    print(f"export rows: {len(rows)} · accepted (uploadable): {len(accepted)} · with revenue: {len(jobs)}")

    if args.dry_run or not accepted:
        for r in accepted:
            rev = (r.get("revenue_cents") or 0) / 100
            print(f"  {r['click_kind']}:{r['click_id'][:24]}…  {conversion_time(r['submitted_at_epoch'])}"
                  f"  {r.get('request_id')}  ${rev:.2f}")
        return 0

    from google.ads.googleads.client import GoogleAdsClient

    client = GoogleAdsClient.load_from_storage()
    svc = client.get_service("ConversionUploadService")
    conversions = [build_conversion(client, r, ACCEPTED_ACTION, 0.0) for r in accepted]
    conversions += [build_conversion(client, r, JOB_ACTION, r["revenue_cents"] / 100) for r in jobs]

    req = client.get_type("UploadClickConversionsRequest")
    req.customer_id = CUSTOMER_ID
    req.conversions.extend(conversions)
    req.partial_failure = True  # duplicates from re-runs must not sink the batch
    resp = svc.upload_click_conversions(request=req)

    ok = sum(1 for r in resp.results if r.conversion_action)
    print(f"uploaded: {ok}/{len(conversions)}")
    if resp.partial_failure_error and resp.partial_failure_error.message:
        # Per-row failures (already-reported duplicates, expired clicks) are
        # expected on overlapping windows — surface them, don't fail the run.
        print("partial failures:", resp.partial_failure_error.message[:500])
    return 0


if __name__ == "__main__":
    sys.exit(main())
