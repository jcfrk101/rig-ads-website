# Corridor geometry verification pipeline

Verifies/regenerates `data/directory/corridor-meta.json` against real OSM
interstate centerlines. Last run: 2026-07-13 (stamped in each entry's
`verified` field). See `data/directory/DATA-NEEDS.md` §3 for what it checks.

Requires Python 3 + numpy (`python3 -m venv venv && venv/bin/pip install numpy`).

```
# 1. Download per-state interstate geometry from Overpass (~160 MB cache in
#    ./osm-cache/, resumable, retries across public mirrors; ~30-60 min)
python3 download_osm.py al ar az ca co ct dc de fl ga ia id il in ks ky la ma \
  md me mi mn mo ms mt nc nd ne nh nj nm nv ny oh ok or pa ri sc sd tn tx ut \
  va vt wa wi wv wy

# 2. Compute diffs (writes report.json next to the scripts; ~1 min)
python3 process.py

# 3. Review report.json, then rewrite data/directory/corridor-meta.json
python3 apply.py --dry   # print flags only
python3 apply.py         # write
```

Judgment calls encoded in the scripts:

- `citiesAlong`: cities within a 10-mile point-to-polyline buffer of the route
  (including I-35W/E and I-69E/W/C branches), ordered along the route by
  gap-healed Dijkstra distance over the OSM way graph. Drafted cities are only
  dropped if >15 mi off-route (`REMOVE_MI`).
- `approxMiles`: sum of dual-carriageway way lengths / 2, rounded to 5 —
  matches FHWA route logs within ~1%. `MILE_OVERRIDES` in `apply.py` pins
  express/local-lane corridors (NJ Turnpike, Chicago, Charlotte) where OSM
  double-counts carriageways, verified against route logs.
- `majorJunctions`: interstates whose geometry comes within 1 km (termini end
  on long ramps), ordered along the route.
- `neighbors`: draft chains kept; `NEIGHBOR_EDITS` in `apply.py` fixes
  asymmetries (I-95 va→dc→md, unfinished I-69 links, I-24 Georgia dip).
- `EXCLUDE` in `process.py` drops OSM future-corridor co-tags (I-27 along
  I-35 at Laredo).
- I-91/NH and I-59/TN: the route never enters the state; cities come from a
  cross-border buffer and drafted mileage is kept.
