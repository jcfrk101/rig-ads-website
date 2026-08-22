#!/usr/bin/env python3
"""Daily Google Ads readout for RIG (customer 5579032852 via MCC 3190057243).

Prints, for the last N days vs the prior N:
  * all-in spend / primary conversions / value, by day
  * RSA vs call-ad split (cost, clicks, primary conv, CPA, value)
  * conversion-action counts by day (are the CSV uploads landing?)
  * per-campaign x ad-type table with wind-down candidates flagged
  * disapproved / limited ads

Usage: /usr/bin/python3 scripts/ads/daily-readout.py [--days 7] [--customer 5579032852]
Needs ~/google-ads.yaml (see README.md).
"""
import argparse
import datetime as dt
from collections import defaultdict

from google.ads.googleads.client import GoogleAdsClient

PRIMARY_ACTIONS = {"Calls - Uploads", "Chat Jobs - Uploads"}


def q(client, customer, gaql):
    svc = client.get_service("GoogleAdsService")
    return [r for batch in svc.search_stream(customer_id=customer, query=gaql) for r in batch.results]


def money(m):
    return m / 1e6


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=7)
    ap.add_argument("--customer", default="5579032852")
    a = ap.parse_args()
    client = GoogleAdsClient.load_from_storage(version="v25")
    cust = a.customer

    today = dt.date.today()
    end = today - dt.timedelta(days=1)
    start = end - dt.timedelta(days=a.days - 1)
    pstart = start - dt.timedelta(days=a.days)
    pend = start - dt.timedelta(days=1)
    rng = f"segments.date BETWEEN '{pstart}' AND '{today}'"

    # --- ad-type x day ---------------------------------------------------
    rows = q(client, cust, f"""
        SELECT campaign.name, campaign.id, ad_group_ad.ad.type, segments.date,
               metrics.cost_micros, metrics.clicks, metrics.impressions,
               metrics.conversions, metrics.conversions_value, metrics.all_conversions
        FROM ad_group_ad WHERE {rng} AND metrics.impressions > 0""")
    by_day = defaultdict(lambda: defaultdict(float))
    by_type = defaultdict(lambda: defaultdict(float))
    by_camp = defaultdict(lambda: defaultdict(float))
    for r in rows:
        d = dt.date.fromisoformat(r.segments.date)
        t = "RSA" if r.ad_group_ad.ad.type_.name == "RESPONSIVE_SEARCH_AD" else (
            "CALL" if r.ad_group_ad.ad.type_.name == "CALL_AD" else r.ad_group_ad.ad.type_.name)
        cost, conv, val, clicks = money(r.metrics.cost_micros), r.metrics.conversions, r.metrics.conversions_value, r.metrics.clicks
        for k, v in (("cost", cost), ("conv", conv), ("val", val), ("clicks", clicks)):
            by_day[d][k] += v
            if d > end:
                continue
            win = "cur" if d >= start else "prev"
            by_type[(win, t)][k] += v
            if win == "cur":
                by_camp[(r.campaign.name, t)][k] += v

    print(f"=== RIG Google Ads readout — through {end} (window {a.days}d: {start}..{end}; prior {pstart}..{pend}) ===\n")
    print("By day (all ad types; conversions = primary, attributed to click date):")
    print(f"{'date':<12}{'spend':>9}{'clicks':>8}{'prim conv':>11}{'value':>9}{'CPA':>8}")
    for d in sorted(by_day):
        v = by_day[d]
        cpa = v["cost"] / v["conv"] if v["conv"] else 0
        flag = "  (today, partial)" if d == today else ""
        print(f"{d!s:<12}{v['cost']:>9.0f}{v['clicks']:>8.0f}{v['conv']:>11.1f}{v['val']:>9.0f}{cpa:>8.0f}{flag}")

    print("\nRSA vs call ads:")
    print(f"{'window':<8}{'type':<6}{'spend':>9}{'clicks':>8}{'prim conv':>11}{'CPA':>8}{'value':>9}{'val/$':>7}")
    for win in ("cur", "prev"):
        for t in ("RSA", "CALL"):
            v = by_type[(win, t)]
            cpa = v["cost"] / v["conv"] if v["conv"] else 0
            roas = v["val"] / v["cost"] if v["cost"] else 0
            print(f"{win:<8}{t:<6}{v['cost']:>9.0f}{v['clicks']:>8.0f}{v['conv']:>11.1f}{cpa:>8.0f}{v['val']:>9.0f}{roas:>7.2f}")

    # --- conversion actions x day (uploads landing?) ----------------------
    rows = q(client, cust, f"""
        SELECT segments.date, segments.conversion_action_name, metrics.all_conversions, metrics.all_conversions_value
        FROM campaign WHERE {rng}""")
    act = defaultdict(lambda: defaultdict(float))
    # Collapse the ~30 per-number DNI actions ("Call (+1 (xxx) ...)") into one column.
    def key(n):
        if n.startswith("Call (1-855"): return "DNI 855 national"
        if n.startswith("Call ("): return "DNI state numbers"
        return n
    for r in rows:
        d = dt.date.fromisoformat(r.segments.date)
        act[d][key(r.segments.conversion_action_name)] += r.metrics.all_conversions
    cols = ["Calls - Uploads", "Chat Jobs - Uploads", "Chat Leads - Accepted", "DNI state numbers", "DNI 855 national",
            "Calls from Smart Campaign Ads", "Click to call"]
    print("\nConversion actions by click date (last 10 days) — primary = Calls - Uploads + Chat Jobs - Uploads:")
    print(f"{'date':<12}" + "".join(f"{c[:16]:>18}" for c in cols))
    for d in sorted(act)[-10:]:
        print(f"{d!s:<12}" + "".join(f"{act[d][c]:>18.1f}" for c in cols))

    # --- conversion actions x ad type, current window ---------------------
    rows = q(client, cust, f"""
        SELECT ad_group_ad.ad.type, segments.conversion_action_name, metrics.all_conversions, metrics.all_conversions_value
        FROM ad_group_ad WHERE segments.date BETWEEN '{start}' AND '{end}'""")
    ta = defaultdict(lambda: defaultdict(float))
    for r in rows:
        t = "RSA" if r.ad_group_ad.ad.type_.name == "RESPONSIVE_SEARCH_AD" else "CALL"
        ta[t][r.segments.conversion_action_name] += r.metrics.all_conversions
        ta[t][r.segments.conversion_action_name + " $"] += r.metrics.all_conversions_value
    print(f"\nConversion actions by ad type, {start}..{end}:")
    for t in ("RSA", "CALL"):
        parts = [f"{n}: {ta[t][n]:.1f} (${ta[t][n + ' $']:.0f})" for n in sorted(ta[t]) if not n.endswith(" $") and ta[t][n] and not n.startswith("Call (")]
        dni = sum(v for n, v in ta[t].items() if n.startswith("Call (") and not n.endswith(" $"))
        parts.append(f"DNI calls (all numbers): {dni:.0f}")
        print(f"  {t}: " + "; ".join(parts))

    # --- per campaign x type, current window ------------------------------
    print(f"\nPer campaign x ad type, {start}..{end} (flag: call arm >= $100 with 0 primary conv, or CPA > 2x the RSA arm):")
    print(f"{'campaign':<40}{'type':<6}{'spend':>8}{'clicks':>7}{'conv':>6}{'CPA':>7}{'value':>8}  note")
    camps = sorted({c for c, _ in by_camp})
    for c in camps:
        rsa, call = by_camp.get((c, "RSA"), {}), by_camp.get((c, "CALL"), {})
        for t, v in (("RSA", rsa), ("CALL", call)):
            if not v:
                continue
            cpa = v["cost"] / v["conv"] if v["conv"] else 0
            note = ""
            if t == "CALL" and v["cost"] >= 100 and v["conv"] == 0:
                note = "<< no primary conv"
            elif t == "CALL" and rsa and rsa.get("conv") and v["conv"] and cpa > 2 * (rsa["cost"] / rsa["conv"]):
                note = "<< CPA >2x RSA"
            print(f"{c[:39]:<40}{t:<6}{v['cost']:>8.0f}{v['clicks']:>7.0f}{v['conv']:>6.1f}{cpa:>7.0f}{v['val']:>8.0f}  {note}")

    # --- spend movers: last 2 days vs the 5 before ------------------------
    camp_day = defaultdict(lambda: defaultdict(float))
    for r in q(client, cust, f"""
        SELECT campaign.name, segments.date, metrics.cost_micros FROM campaign
        WHERE segments.date BETWEEN '{end - dt.timedelta(days=6)}' AND '{end}'"""):
        camp_day[r.campaign.name][dt.date.fromisoformat(r.segments.date)] += money(r.metrics.cost_micros)
    movers = []
    for c, days in camp_day.items():
        recent = sum(days.get(end - dt.timedelta(days=i), 0) for i in range(2)) / 2
        base = sum(days.get(end - dt.timedelta(days=i), 0) for i in range(2, 7)) / 5
        movers.append((recent - base, c, recent, base))
    movers.sort(reverse=True)
    print(f"\nSpend movers — avg/day {end - dt.timedelta(days=1)}..{end} vs the 5 days before:")
    for delta, c, recent, base in movers[:8]:
        print(f"  {c[:36]:<37}{recent:>7.0f}/d vs {base:>6.0f}/d  ({delta:+.0f})")

    # --- policy -------------------------------------------------------------
    rows = q(client, cust, """
        SELECT campaign.name, ad_group.name, ad_group_ad.ad.id, ad_group_ad.ad.type,
               ad_group_ad.policy_summary.approval_status, ad_group_ad.status
        FROM ad_group_ad WHERE ad_group_ad.status = 'ENABLED' AND campaign.status = 'ENABLED'
          AND ad_group_ad.policy_summary.approval_status IN ('DISAPPROVED','AREA_OF_INTEREST_ONLY','APPROVED_LIMITED')""")
    print("\nPolicy issues on enabled ads:" if rows else "\nPolicy issues on enabled ads: none")
    for r in rows:
        print(f"  {r.campaign.name} / {r.ad_group.name} / {r.ad_group_ad.ad.type_.name} {r.ad_group_ad.ad.id}: "
              f"{r.ad_group_ad.policy_summary.approval_status.name}")


if __name__ == "__main__":
    main()
