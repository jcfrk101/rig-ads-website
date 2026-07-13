# SEO Directory — Data Needs & Sources

Status of every data element behind the 2,330 semi-truck-repair pages: what's
real, what's placeholder, and where the real version comes from.

## Current state (what ships today)

| Element | Status | File | Source |
|---|---|---|---|
| Page list (2,107 cities + 222 corridor-states) | ✅ real | `pages.csv` → `cities.json` / `corridors.json` | SimpleMaps/Census-derived master CSV |
| City population, lat/lng, tier | ✅ real | `cities.json` | same CSV |
| Corridor metadata (cities along, endpoints, mileage, junctions, description) | ⚠️ **draft** | `corridor-meta.json` | Model-drafted, grounded in our own city list; needs geometry verification (below) |
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

### 2. Real mechanics listings (owner: us — API or export)
`data/directory/mechanics.ts` defines the `MechanicListing` interface the
templates render. Point `getMechanicsForCity` / `getMechanicsForCorridor` at
the real mechanics API (build-time fetch is fine for SSG) and delete the mock
generator.

### 3. Corridor geometry verification (owner: engineering, ~free)
`corridor-meta.json` is drafted from model knowledge grounded in our city list.
Verify + enrich with real geometry:

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
