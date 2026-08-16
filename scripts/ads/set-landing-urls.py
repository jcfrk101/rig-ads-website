#!/usr/bin/env python3
"""Point every keyword at its /go/ landing page (keyword-level final URLs).

Why keyword level: it overrides the ad's final URL at click time WITHOUT
touching the RSAs, so no ad re-review (API-created ads sat in review for
days) — and it's cleanly reversible (--revert clears the keyword URLs and
clicks fall back to the ad-level state pages).

Mapping (see data/go/intents.ts):
  campaign "TEXAS - HD"            -> state tx      (national campaigns -> us)
  ad group Mobile/Roadside Trailer -> trailer
  ad group ... Freightliner/Volvo/International -> that brand
  campaign Tire-National           -> tire
  campaign RV-National             -> rv
  everything else                  -> truck

URL: https://bigrig.app/go/{st}/{intent}/?loc={loc_physical_ms}&int={loc_interest_ms}&kw={keyword}
(ValueTrack params are expanded by Google at click time; auto-tagging adds gclid.)

  dry run:   /usr/bin/python3 scripts/ads/set-landing-urls.py
  one state: /usr/bin/python3 scripts/ads/set-landing-urls.py --campaign "TEXAS - HD" --apply
  all:       /usr/bin/python3 scripts/ads/set-landing-urls.py --apply
  revert:    /usr/bin/python3 scripts/ads/set-landing-urls.py --revert --apply
  verify:    /usr/bin/python3 scripts/ads/set-landing-urls.py --check
"""
import argparse
import json
import re
import sys
import warnings
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

warnings.filterwarnings("ignore")
from google.ads.googleads.client import GoogleAdsClient  # noqa: E402

CID = "5579032852"
BASE = "https://bigrig.app/go"
SUFFIX = "?loc={loc_physical_ms}&int={loc_interest_ms}&kw={keyword}"
BATCH = 2000
REPO = Path(__file__).resolve().parents[2]
BACKUP_DIR = Path.home() / "Library/CloudStorage/Dropbox/Work/RigApp/Ads Reports"

STATES = json.load(open(REPO / "data/directory/states.json"))
NAME_TO_CODE = {re.sub(r"[^a-z]", "", v["name"].lower()): k for k, v in STATES.items()}
NAME_TO_CODE["massachussets"] = "ma"  # campaign-name typo


def state_for_campaign(name: str):
    if "National" in name:
        return "us"
    key = re.sub(r"[^a-z]", "", name.split(" - ")[0].lower())
    return NAME_TO_CODE.get(key)


def intent_for(campaign: str, ad_group: str) -> str:
    c, g = campaign.lower(), ad_group.lower()
    if "tire" in c:
        return "tire"
    if c.startswith("rv"):
        return "rv"
    for brand in ("freightliner", "volvo", "international"):
        if brand in g:
            return brand
    if "trailer" in g or "tailer" in g:  # "Mobile Tailer" typo in the account
        return "trailer"
    return "truck"


def target_url(st: str, intent: str) -> str:
    return f"{BASE}/{st}/{intent}/{SUFFIX}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="mutate (default: dry run)")
    ap.add_argument("--campaign", help="only this campaign name (exact)")
    ap.add_argument("--revert", action="store_true", help="clear keyword final URLs instead of setting them")
    ap.add_argument("--check", action="store_true", help="report keywords whose URL differs from the target")
    args = ap.parse_args()

    client = GoogleAdsClient.load_from_storage()
    ga = client.get_service("GoogleAdsService")
    q = """
    SELECT campaign.name, campaign.status, ad_group.name, ad_group.status,
           ad_group_criterion.resource_name, ad_group_criterion.keyword.text,
           ad_group_criterion.final_urls, ad_group_criterion.status
    FROM keyword_view
    WHERE campaign.status = 'ENABLED' AND ad_group.status = 'ENABLED'
      AND ad_group_criterion.status = 'ENABLED'
    """
    if args.campaign:
        q += f" AND campaign.name = '{args.campaign}'"

    plan = []  # (resource_name, campaign, ad_group, current_urls, target_url)
    unmapped = Counter()
    for r in ga.search(customer_id=CID, query=q):
        st = state_for_campaign(r.campaign.name)
        if not st:
            unmapped[r.campaign.name] += 1
            continue
        intent = intent_for(r.campaign.name, r.ad_group.name)
        cur = list(r.ad_group_criterion.final_urls)
        plan.append((r.ad_group_criterion.resource_name, r.campaign.name, r.ad_group.name, cur,
                     "" if args.revert else target_url(st, intent)))

    if unmapped:
        print("UNMAPPED campaigns (no state):", dict(unmapped))

    if args.check:
        bad = [p for p in plan if (p[3][0] if p[3] else "") != p[4]]
        print(f"keywords: {len(plan)} · matching target: {len(plan) - len(bad)} · differing: {len(bad)}")
        for p in bad[:10]:
            print(f"  {p[1]} / {p[2]}: {p[3]} != {p[4]}")
        return 0 if not bad else 1

    by_target = defaultdict(int)
    by_campaign = defaultdict(int)
    for _, camp, _, _, url in plan:
        by_target[url] += 1
        by_campaign[camp] += 1
    print(f"{'REVERT' if args.revert else 'SET'} keyword final URLs — {len(plan)} keywords in {len(by_campaign)} campaigns")
    for url, n in sorted(by_target.items(), key=lambda x: -x[1])[:60]:
        print(f"  {n:>5}  {url or '(clear)'}")
    if len(by_target) > 60:
        print(f"  ... {len(by_target) - 60} more targets")

    if not args.apply:
        print("\nDRY RUN — re-run with --apply to mutate.")
        return 0

    # Backup current URLs for a precise revert.
    stamp = date.today().isoformat()
    backup = BACKUP_DIR / f"keyword-final-urls-backup-{stamp}.json"
    if not backup.exists():
        json.dump({p[0]: p[3] for p in plan}, open(backup, "w"))
        print(f"backup of prior URLs -> {backup.name}")

    svc = client.get_service("AdGroupCriterionService")
    ok = fail = 0
    for i in range(0, len(plan), BATCH):
        ops = []
        for rn, _, _, _, url in plan[i:i + BATCH]:
            op = client.get_type("AdGroupCriterionOperation")
            crit = op.update
            crit.resource_name = rn
            del crit.final_urls[:]
            if url:
                crit.final_urls.append(url)
            client.copy_from(op.update_mask, client.get_type("FieldMask")(paths=["final_urls"]))
            ops.append(op)
        resp = svc.mutate_ad_group_criteria(customer_id=CID, operations=ops, partial_failure=True)
        batch_fail = 0
        if resp.partial_failure_error and resp.partial_failure_error.details:
            for detail in resp.partial_failure_error.details:
                failure = client.get_type("GoogleAdsFailure")
                failure.ParseFromString(detail.value)
                batch_fail += len(failure.errors)
                for e in list(failure.errors)[:3]:
                    print("  error:", e.message)
        ok += len(ops) - batch_fail
        fail += batch_fail
        print(f"batch {i // BATCH + 1}: {len(ops) - batch_fail} ok, {batch_fail} failed")
    print(f"\nDONE — {ok} keywords updated, {fail} failed")
    return 0 if not fail else 1


if __name__ == "__main__":
    sys.exit(main())
