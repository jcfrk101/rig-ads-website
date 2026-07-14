#!/usr/bin/env python3
"""Download interstate motorway/trunk way geometry per state from Overpass.

Caches raw JSON per state in ./osm-cache/<st>.json. Retries across mirrors.
"""
import json, os, sys, time, urllib.request, urllib.error

CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "osm-cache")
os.makedirs(CACHE, exist_ok=True)

MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
    "https://overpass.osm.jp/api/interpreter",
]

STATES = sys.argv[1:]

QUERY = """
[out:json][timeout:600];
area["ISO3166-2"="US-{ST}"][admin_level=4]->.st;
(
  way["highway"~"^(motorway|trunk)$"]["ref"~"I[- ]?[0-9]"](area.st);
);
out tags geom;
"""

def fetch(state, attempt_offset=0):
    q = QUERY.replace("{ST}", state.upper())
    last_err = None
    for i in range(12):
        url = MIRRORS[(i + attempt_offset) % len(MIRRORS)]
        try:
            req = urllib.request.Request(
                url,
                data=("data=" + urllib.parse.quote(q)).encode(),
                headers={"User-Agent": "bigrig-corridor-verify/1.0 (contact: josh@melick.us)"},
            )
            with urllib.request.urlopen(req, timeout=900) as r:
                data = json.load(r)
            if "elements" in data:
                return data
            last_err = "no elements key"
        except Exception as e:
            last_err = f"{type(e).__name__}: {e}"
            sys.stderr.write(f"  {state} attempt {i+1} via {url.split('/')[2]}: {last_err}\n")
            time.sleep(15 * (i + 1))
    raise RuntimeError(f"{state}: all attempts failed: {last_err}")

for idx, st in enumerate(STATES):
    out = os.path.join(CACHE, f"{st}.json")
    if os.path.exists(out) and os.path.getsize(out) > 500:
        print(f"[{idx+1}/{len(STATES)}] {st} cached, skip", flush=True)
        continue
    t0 = time.time()
    data = fetch(st, attempt_offset=idx)
    nways = len(data.get("elements", []))
    tmp = out + f".tmp{os.getpid()}"
    with open(tmp, "w") as f:
        json.dump(data, f)
    os.replace(tmp, out)
    print(f"[{idx+1}/{len(STATES)}] {st}: {nways} ways, {os.path.getsize(out)//1024} KB, {time.time()-t0:.0f}s", flush=True)
    time.sleep(3)
print("DONE")
