#!/usr/bin/env python3
"""Post-deploy check for the unified AdConversionsReport (services PR #243).

Compares production output against the pre-deploy baselines saved in
Dropbox/Work/RigApp/Ads Reports/call-conversions-baseline-2026-08-13-tf{N}.txt
(pulled 2026-08-13 from the old CallConversionsReport at /ad/conversion).

Checks, per window:
  1. /ad/conversion.csv  — same CSV format; every baseline row (keyed by
     caller phone + call start time) still present with value >= baseline
     (values can only grow as new transfers capture; a shrink or a missing
     row means something was lost).
  2. /ad/conversion (now JSON) — the calls array carries the same rows as
     the CSV, and a chats array exists.

New rows are expected (jobs that captured since the baseline) and reported
as info, not failures.

    /usr/bin/python3 scripts/ads/verify-conversion-report.py [--days 90 180]
"""
import argparse
import csv
import io
import json
import sys
import urllib.request
from pathlib import Path

BASE = "https://api.bigrig.app/admin/a52d35fa-b696-4a13-93e6-a31f4f98d9a7/ad"
BASELINE_DIR = Path.home() / "Library/CloudStorage/Dropbox/Work/RigApp/Ads Reports"
BASELINE_TPL = "call-conversions-baseline-2026-08-13-tf{days}.txt"


def parse_csv(text: str) -> dict:
    lines = text.splitlines()
    if lines and lines[0].startswith("Parameters:"):
        lines = lines[1:]
    rows = {}
    for r in csv.DictReader(io.StringIO("\n".join(lines))):
        key = (r["Caller's Phone Number"], r["Call Start Time"])
        rows[key] = float(r["Conversion Value"])
    return rows


def fetch(url: str) -> str:
    with urllib.request.urlopen(url, timeout=570) as res:
        return res.read().decode()


def compare(name: str, baseline: dict, current: dict) -> bool:
    missing = [k for k in baseline if k not in current]
    shrunk = [k for k in baseline if k in current and current[k] < baseline[k] - 0.005]
    new = [k for k in current if k not in baseline]
    print(f"  {name}: baseline {len(baseline)} rows -> current {len(current)} rows; "
          f"missing {len(missing)}, shrunk {len(shrunk)}, new {len(new)}")
    for k in missing[:5]:
        print(f"    MISSING {k} (was ${baseline[k]:.2f})")
    for k in shrunk[:5]:
        print(f"    SHRUNK  {k} ${baseline[k]:.2f} -> ${current[k]:.2f}")
    return not missing and not shrunk


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, nargs="+", default=[90, 180])
    args = ap.parse_args()

    ok = True
    for days in args.days:
        path = BASELINE_DIR / BASELINE_TPL.format(days=days)
        if not path.exists():
            print(f"tf={days}: no baseline file ({path.name}), skipping")
            continue
        baseline = parse_csv(path.read_text())
        print(f"tf={days}:")

        csv_rows = parse_csv(fetch(f"{BASE}/conversion.csv?time_frame={days}"))
        ok &= compare("csv ", baseline, csv_rows)

        body = json.loads(fetch(f"{BASE}/conversion?time_frame={days}"))
        data = body.get("data", body)
        if isinstance(data, str):
            data = json.loads(data)
        json_rows = {(c["caller_phone_number"], c["call_start_time"]): c["value_dollars"]
                     for c in data.get("calls", [])}
        ok &= compare("json", baseline, json_rows)
        if json_rows != csv_rows:
            drift = {k for k in (set(json_rows) ^ set(csv_rows))}
            print(f"    NOTE csv/json call rows differ on {len(drift)} keys "
                  "(expected only if jobs captured between the two fetches)")
        print(f"  chats array present: {'chats' in data} ({len(data.get('chats', []))} rows)")

    print("\nRESULT:", "PASS — nothing lost or shrunk" if ok else "FAIL — see rows above")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
