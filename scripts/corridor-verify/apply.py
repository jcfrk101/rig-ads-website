#!/usr/bin/env python3
"""Apply report.json corrections to corridor-meta.json (in place).

Keeps endpoints/description text; updates citiesAlong, approxMiles,
majorJunctions, neighbors; stamps per-entry `verified`. Flags descriptions
and endpoints that reference cities/junctions no longer on the route so they
can be hand-fixed.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "directory")

report = json.load(open(os.path.join(HERE, "report.json")))
cm = json.load(open(os.path.join(DATA, "corridor-meta.json")))
cities_all = json.load(open(os.path.join(DATA, "cities.json")))
name_by_key = {(c["state"], c["citySlug"]): c["name"] for c in cities_all}

VERIFIED = "osm-2026-07-13"
MAX_JUNCTIONS = 12

# sum/2 of the OSM dual carriageway double-counts express/local or C/D lane
# corridors; these values are the FHWA route-log mileage (rounded to 5) used
# as tie-breaker where the two geometric estimates disagreed >5%.
MILE_OVERRIDES = {
    "i-77/nc": 105,  # I-77 Express toll carriageways in Charlotte
    "i-78/nj": 70,   # express/local lanes (official 67.8)
    "i-80/nj": 70,   # express/local lanes (official 68.5)
    "i-84/id": 275,  # official 275.4; OSM sum ran +1.5%
    "i-86/ny": 225,  # OSM tags unsigned/future sections (official 223.4)
    "i-90/il": 125,  # Chicago Skyway untagged in OSM (official 124.4)
    "i-94/il": 75,   # Dan Ryan/Edens express lanes (official 77.4)
    "i-95/nj": 75,   # NJ Turnpike dual-dual carriageways (official 77.6)
    "i-27/tx": 125,  # residual future-corridor co-tagging (official 124.1)
}

# Draft neighbors are kept (geometry is too strict for unfinished routes like
# I-69 and can't express the I-24 Georgia dip). These edits fix the draft's
# asymmetries, confirmed against geometry where it exists.
NEIGHBOR_EDITS = {
    "i-95/va": {"next": "dc"},   # chain is nc -> va -> dc -> md -> de
    "i-24/ga": {"next": None},   # GA dip: route re-enters TN and ends there
    "i-24/tn": {"next": "ga"},
    "i-59/ga": {"next": "tn"},   # terminus at I-24 just south of Chattanooga
    "i-69/in": {"prev": "ky"},   # Ohio River crossing unbuilt; corridor continues
    "i-69/ms": {"next": "tn"},
}

flags = []
dry = "--dry" in sys.argv

for key, r in sorted(report.items()):
    meta = cm[key]
    st = key.split("/")[1]
    if r.get("status") == "cross-border":
        meta["citiesAlong"] = r["new_cities"]
        meta["verified"] = f"{VERIFIED} (route stays out of state; cities from cross-border buffer)"
        continue
    if r.get("status") != "ok":
        meta["verified"] = f"unverified: {r.get('status')}"
        flags.append((key, f"NO GEOMETRY ({r.get('status')})"))
        continue

    old_cities = meta["citiesAlong"]
    meta["citiesAlong"] = r["new_cities"]
    meta["approxMiles"] = MILE_OVERRIDES.get(key, r["new_miles"])

    jn = list(r["junctions_new"])
    # I-235's Wichita terminus reaches I-35 via a ~1.9 km ramp OSM can't see
    if key == "i-35/ks" and "I-235" not in jn and "I-135" in jn:
        jn.insert(jn.index("I-135"), "I-235")
    # signed I-69 through Memphis rides I-40/I-240; OSM barely tags it
    if key == "i-69/tn":
        jn = [j for j in cm[key]["majorJunctions"] if j not in jn] + jn
    if len(jn) > MAX_JUNCTIONS:
        # keep 2-digit (mainline) junctions first, then closest spurs, in order
        two = [j for j in jn if len(re.sub(r"\D", "", j)) <= 2]
        three = [j for j in jn if len(re.sub(r"\D", "", j)) > 2]
        jn = [j for j in r["junctions_new"]
              if j in two or j in three[: MAX_JUNCTIONS - len(two)]]
    meta["majorJunctions"] = jn
    meta["verified"] = VERIFIED

    # flag prose that references dropped cities
    text = meta["description"] + " " + meta["endpoints"]
    for slug in r["removed"]:
        nm = name_by_key.get((st, slug))
        if nm and nm.lower() in text.lower():
            flags.append((key, f"description/endpoints mentions removed city '{nm}' ({r['removed'][slug]} mi away)"))
    # flag endpoints that reference junctions not detected
    for m in re.finditer(r"I-\d+[EW]?", meta["endpoints"]):
        j = m.group(0)
        if j != f"I-{key.split('/')[0].split('-')[1].upper()}" and j not in r["junctions_new"]:
            flags.append((key, f"endpoints mentions {j}, not among detected junctions {r['junctions_new']}"))

for key, edits in NEIGHBOR_EDITS.items():
    cm[key]["neighbors"].update(edits)

if not dry:
    with open(os.path.join(DATA, "corridor-meta.json"), "w") as f:
        json.dump(cm, f, indent=1)
        f.write("\n")
    print("wrote corridor-meta.json")

print(f"\n{len(flags)} flags for manual review:")
for k, msg in flags:
    print(f"  {k}: {msg}")
