#!/usr/bin/env python3
"""Conservative click<->call-job matcher (the DNI backstop).

Joins Google's click log (click_view gclids, RSA only) to our paid call-jobs
(acquisition report, state via the dialed tracking number) under a strict
rule: exactly ONE RSA click and exactly ONE revenue job in the same state on
the same day. Anything ambiguous is skipped — a wrong-click conversion is
worse than a missing one.

Output: gclid-keyed rows ready for a manual Google Ads click-conversions
import under a SECONDARY action ("Call Jobs - Click Matched") so it informs
reporting without steering bidding. Once the ad-click beacon ships, the
state-day heuristic tightens to real click-timestamp windows.

Usage: /usr/bin/python3 scripts/ads/match-call-jobs.py [--days 26] [--out matched.csv]
Needs ~/google-ads.yaml. Call-side data exists from 2026-08-24 (intake recording).
"""
import argparse, csv, datetime as dt, io, urllib.request
from collections import defaultdict
from google.ads.googleads.client import GoogleAdsClient

CUST = "5579032852"
ACQ = "https://api.bigrig.app/admin/a52d35fa-b696-4a13-93e6-a31f4f98d9a7/ad/acquisition.csv?time_frame={days}"
CONVERSION_NAME = "Call Jobs - Click Matched"

STATE_OF_CAMP = {"ALABAMA":"al","ARIZONA":"az","ARKANSAS":"ar","CALIFORNIA":"ca","COLORADO":"co","FLORIDA":"fl",
 "GEORGIA":"ga","ILLINOIS":"il","INDIANA":"in","KENTUCKY":"ky","LOUISIANA":"la","MARYLAND":"md","MASSACHUSSETS":"ma",
 "MICHIGAN":"mi","MISSISSIPPI":"ms","MISSOURI":"mo","MINNESOTA":"mn","NEW MEXICO":"nm","NEW YORK":"ny",
 "NORTH CAROLINA":"nc","OHIO":"oh","OKLAHOMA":"ok","OREGON":"or","PENNSYLVANIA":"pa","SOUTH CAROLINA":"sc",
 "SOUTH DAKOTA":"sd","TENNESSEE":"tn","TEXAS":"tx","VIRGINIA":"va","WASHINGTON":"wa","WISCONSIN":"wi"}
POOL_STATE = {"Atlanta":"ga","Houston":"tx","Dallas":"tx","San Antonio":"tx","Austin":"tx","Amarillo":"tx","El Paso":"tx",
 "Phoenix":"az","Tucson":"az","Denver":"co","Los Angeles":"ca","Sacramento":"ca","Fresno":"ca","San Bernardino":"ca",
 "Bakersfield":"ca","Jacksonville":"fl","Orlando":"fl","Miami":"fl","Tampa":"fl","Chicago":"il","Indianapolis":"in",
 "Louisville":"ky","New Orleans":"la","Baltimore":"md","Boston":"ma","Detroit":"mi","Grand Rapids":"mi","Jackson":"ms",
 "Kansas City":"mo","St. Louis":"mo","Minneapolis":"mn","Albuquerque":"nm","New York":"ny","Buffalo":"ny",
 "Charlotte":"nc","Raleigh":"nc","Columbus":"oh","Cleveland":"oh","Cincinnati":"oh","Oklahoma City":"ok","Tulsa":"ok",
 "Portland":"or","Philadelphia":"pa","Pittsburgh":"pa","Scranton":"pa","Columbia":"sc","Sioux Falls":"sd","Memphis":"tn",
 "Nashville":"tn","Knoxville":"tn","Salt Lake City":"ut","Richmond":"va","Norfolk":"va","Seattle":"wa","Tacoma":"wa",
 "Spokane":"wa","Milwaukee":"wi","Wisconsin":"wi","Alabama":"al","Arkansas":"ar","Birmingham":"al","Little Rock":"ar",
 "Mobile":"al","Springfield":"mo","Fort Wayne":"in","Toledo":"oh","Akron":"oh","Dayton":"oh","Greenville":"sc",
 "Charleston":"sc","Savannah":"ga","Macon":"ga","Augusta":"ga","Shreveport":"la","Baton Rouge":"la","Lubbock":"tx",
 "Corpus Christi":"tx","Laredo":"tx","Odessa":"tx","Waco":"tx","Tyler":"tx"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=26)
    ap.add_argument("--out", default="")
    a = ap.parse_args()
    client = GoogleAdsClient.load_from_storage(version="v25")
    svc = client.get_service("GoogleAdsService")

    rsa_ads = set()
    for b in svc.search_stream(customer_id=CUST, query="""
      SELECT ad_group_ad.resource_name FROM ad_group_ad WHERE ad_group_ad.ad.type='RESPONSIVE_SEARCH_AD'"""):
        for r in b.results:
            rsa_ads.add(r.ad_group_ad.resource_name)

    clicks = []
    d = dt.date.today() - dt.timedelta(days=a.days)
    while d <= dt.date.today():
        for b in svc.search_stream(customer_id=CUST, query=f"""
          SELECT click_view.gclid, campaign.name, click_view.ad_group_ad
          FROM click_view WHERE segments.date = '{d}'"""):
            for r in b.results:
                if r.click_view.ad_group_ad in rsa_ads:
                    st = STATE_OF_CAMP.get(r.campaign.name.replace(" - HD", "").upper())
                    if st:
                        clicks.append({"date": str(d), "state": st, "gclid": r.click_view.gclid})
        d += dt.timedelta(days=1)

    jobs = []
    with urllib.request.urlopen(ACQ.format(days=a.days), timeout=120) as res:
        for row in csv.DictReader(io.TextIOWrapper(res, encoding="utf-8")):
            if row["channel"] != "call" or row["source"] != "PAID_ADS" or row["job"] != "1":
                continue
            if float(row["revenue_dollars"] or 0) <= 0:
                continue
            st = POOL_STATE.get(row["pool"].replace(" ad proxy", "").strip())
            if st:
                jobs.append({"at": row["lead_at"], "date": row["lead_at"][:10], "state": st,
                             "revenue": float(row["revenue_dollars"])})

    click_g, job_g = defaultdict(list), defaultdict(list)
    for cl in clicks:
        click_g[(cl["state"], cl["date"])].append(cl)
    for j in jobs:
        job_g[(j["state"], j["date"])].append(j)

    matches, skipped = [], 0
    for key, js in sorted(job_g.items()):
        cs = click_g.get(key, [])
        if len(js) == 1 and len(cs) == 1:
            matches.append((cs[0], js[0]))
        elif cs:
            skipped += 1
    print(f"RSA clicks: {len(clicks)}; paid call jobs: {len(jobs)}; "
          f"1:1 matches: {len(matches)}; ambiguous state-days skipped: {skipped}")
    for cl, j in matches:
        print(f"  {j['date']} {j['state'].upper()}: {cl['gclid'][:20]}… -> ${j['revenue']:.0f}")
    if a.out and matches:
        with open(a.out, "w", newline="") as f:
            w = csv.writer(f)
            f.write("Parameters:TimeZone=+0000\n")
            w.writerow(["Google Click ID", "Conversion Name", "Conversion Time", "Conversion Value", "Conversion Currency"])
            for cl, j in matches:
                w.writerow([cl["gclid"], CONVERSION_NAME, j["at"] + "+00:00", f"{j['revenue']:.2f}", "USD"])
        print(f"wrote {a.out} — import manually in Google Ads (Conversions from clicks), "
              f"under the SECONDARY action '{CONVERSION_NAME}'")


if __name__ == "__main__":
    main()
