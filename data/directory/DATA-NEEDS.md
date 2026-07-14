# SEO Directory — Data Needs & Sources

Status of every data element behind the 2,330 semi-truck-repair pages: what's
real, what's placeholder, and where the real version comes from.

## Current state (what ships today)

| Element | Status | File | Source |
|---|---|---|---|
| Page list (2,107 cities + 222 corridor-states) | ✅ real | `pages.csv` → `cities.json` / `corridors.json` | SimpleMaps/Census-derived master CSV |
| City population, lat/lng, tier | ✅ real | `cities.json` | same CSV |
| Corridor metadata (cities along, endpoints, mileage, junctions, description) | ✅ **geometry-verified** | `corridor-meta.json` | OSM centerline verification 2026-07-13 (see §3); each entry carries a `verified` stamp |
| Dispatch stats (mechanics active, avg dispatch/arrival, jobs) | ⚠️ **placeholder** | `stats.json` | Population-seeded formulas in `scripts/build-directory-stats.mjs` |
| Mechanic listings on pages | ⚠️ **mock** | `mechanics.ts` | Deterministic generator; swap for mechanics API |
| Sitemap | ✅ generated | `public/sitemap.xml` | `scripts/build-sitemap.mjs` |

## To replace before launch

### 1. Real dispatch stats (owner: us — data export)
Replace the formulas in `scripts/build-directory-stats.mjs` with an export from
the dispatch DB, keeping the same JSON shape (`national` / `states` / `cities`
keyed `tx/dallas` / `corridors` keyed `i-10/al`). Refresh daily or weekly via
cron; pages pick it up on next build. Cities with no real coverage should get
honest low numbers or trigger removing the "active now" strip (decide policy).

### 2. Real mechanics listings (owner: Rig Services — one export job)
Architecture, export schema, rebuild triggers, and failure handling are all in
**`MECHANICS-API-PLAN.md`**. Directory-side ingestion is already built:
`scripts/build-directory-mechanics.mjs` (tested against
`scripts/sample-mechanics-export.json`) writes `mechanics.json`, which
`mechanics.ts` prefers over the mock generator the moment it's non-empty.
What's left: Rig Services ships the nightly export (GCS file or endpoint),
plus a scheduled Cloud Build trigger for the rebuild.

### 3. Corridor geometry verification — ✅ DONE 2026-07-13
`corridor-meta.json` is now verified against OSM interstate centerlines
(Overpass, `highway=motorway|trunk` ways with `I xx` refs, per state):

- **citiesAlong**: every city in `cities.json` point-to-polyline tested against
  a 10-mile buffer of the route (incl. I-35W/E and I-69E/W/C branches); cities
  ordered by distance along the route (gap-healed Dijkstra over the way graph).
  ~1,800 cities added; drafted cities kept unless >15 mi off-route.
- **approxMiles**: dual-carriageway length / 2, rounded to 5 — matches FHWA
  route logs within ~1% on spot checks. Express/local corridors (NJ Turnpike,
  Chicago, Charlotte) hand-pinned to route-log values.
- **majorJunctions**: all interstates whose OSM geometry comes within 1 km,
  ordered along the route. Caught real omissions (I-430, I-165) and removed
  draft errors (I-40/I-55 never meet in TN; Iowa's I-680 is now I-880).
- **neighbors**: draft chains kept; geometry confirmed adjacency and fixed the
  I-95 va→dc→md chain plus symmetry on unfinished I-69 links.
- Each entry has a `verified` stamp. Special cases: I-91/NH and I-59/TN never
  enter the state (cities from cross-border buffer); I-69/TN kept drafted
  miles/junctions (OSM barely tags the unsigned Memphis concurrency).
- Pipeline (rerunnable): `download_osm.py` + `process.py` + `apply.py` — ask
  engineering; state OSM extracts cache locally, full run ~1 h.

Original plan/source notes:

- **FHWA National Highway System** shapefiles (free, public domain):
  https://www.fhwa.dot.gov/planning/national_highway_system/nhs_maps/
  Gives authoritative interstate centerlines + state mileage.
- **OpenStreetMap via Overpass API** (free, ODbL attribution): per-route
  relations give geometry; `highway=motorway_junction` nodes give every exit
  (number, name) for future exit pages. Example Overpass query for I-10 exits
  in Alabama:
  ```
  [out:json][timeout:120];
  area["ISO3166-2"="US-AL"]->.st;
  relation["route"="road"]["ref"="I 10"](area.st);
  way(r)->.rw;
  node(w.rw)["highway"="motorway_junction"];
  out body;
  ```
- Verification plan: buffer each route polyline by 10 mi, point-in-buffer test
  every city in `cities.json`, diff against `citiesAlong`, fix; compute real
  per-state mileage; store verified data in the same `corridor-meta.json` shape.

### 4. Shop universe (owner: business — LICENSING GATE, per spec v2)
Needed for "listed shop" cards at scale + future shop detail pages
(`/semi-truck-repair/tx/dallas/<shop>/`). Licensed backbone: **Foursquare
Places** or **SafeGraph** (bulk license, we keep the data) or **Data Axle**
(NAICS-filtered). **OSM** free for gap-fill. **Google Places may NOT be stored**
as the backbone (ToS) — validation only. Legal review before ingesting.

## Later (not blocking launch)

- **Exit-level pages**: OSM exit nodes + services (truck stops, fuel) — spec
  says only build exits with services or high truck AADT.
- **Truck AADT / FHWA Freight Analysis Framework**: rank corridors by real
  freight volume; refine Tier 1/2 assignments.
- **Truck stop POIs** along corridors (OSM `amenity=fuel` + `hgv=yes`).
- **RV tree** (`/rv-diesel-repair/`): same geo engine; gate each city on
  chassis-qualified mechanic coverage (needs coverage data first).
- **Consumer tree** (`/diesel-truck-repair/`): unknown timeline.

## Regenerating everything

```
npm run directory:data   # CSV → JSON, stats, sitemap (also runs on prebuild)
node scripts/merge-corridor-meta.mjs <group-files...>  # merge corridor drafts
```
