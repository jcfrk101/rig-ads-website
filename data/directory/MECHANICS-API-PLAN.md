# Mechanics Data Architecture — Directory ↔ Rig Services

**Principle: the directory never calls Rig Services while a driver is on a
page.** All 2,400+ pages are static. Mechanic listings are ingested at build
time from a bulk export; freshness comes from rebuilds, not runtime calls.
This keeps page speed and SEO independent of Rig Services uptime, and it means
the Rig Services side is *one export job*, not a hardened public API.

```
Rig Services (sister repo)                    This repo
┌──────────────────────────┐                 ┌──────────────────────────────┐
│ nightly export job       │   JSON file     │ scripts/                     │
│ (all directory-relevant  │ ──────────────► │  build-directory-mechanics   │
│  mechanics)              │  GCS bucket or  │  → data/directory/           │
│                          │  HTTPS endpoint │    mechanics.json            │
│ optional: Pub/Sub event  │                 │  (per-page listings)         │
│ on mechanic on/offboard  │ ──► Cloud Build │                              │
└──────────────────────────┘     trigger     │ next build (SSG, ~minutes)   │
                                             └──────────────────────────────┘
```

## 1. The export (what Rig Services builds)

**DECIDED (2026-07-20): the Services layer serves a daily export at
`https://api.bigrig.app/directory-export/latest`** — path agreed and wired
into the build, but **the export job behind it is not generating yet**
(endpoint currently 401s; builds fall back to the committed data until
Services ships the job). (Authenticated; the
directory sends `Authorization: Bearer $MECHANICS_EXPORT_TOKEN`). The
ingestion script defaults to this URL — every build, including the nightly
Cloud Build, pulls the latest automatically. Speed is a non-issue: it's read
once per build, not per page view. Even 50k mechanics is a few MB.

### Export schema (v1)

```json
{
  "version": 1,
  "generatedAt": "2026-07-14T02:00:00Z",
  "mechanics": [
    {
      "id": "mech_01HXYZ...",          // stable ID
      "name": "Salazar Diesel",
      "baseLat": 32.7767,               // where they roll from
      "baseLng": -96.8700,
      "serviceRadiusMi": 60,            // how far they'll travel
      "services": ["mobile_service", "tire_change", "tow_service",
                    "maintenance_change"],  // ServiceConstants.RIG_SUPPORTED_SERVICES
      "percentSatisfied": 97,           // MechanicRatingResponse.percentSatisfied, 0-100
      "totalRatings": 212,              // MechanicRatingResponse.totalRatings
      "completedJobs": 540,             // MechanicRatingResponse.completedJobs
      "percentFixed": 94,               // % of ratings with ServiceRating.isFixed
      "percentOnTime": 96,              // % of ratings with ServiceRating.isOnTime
      "open247": true,
      "network": "rig",                 // "rig" = dispatchable | "listed" = directory-only
      "phone": "+12145550148",          // optional; shown only for listed shops
      "profileImageUrl": "https://...", // optional; User.profileImageUrl
      "standardHourlyRate": 155,        // optional; ShopRates.standard_hourly_rate, USD
      "afterHoursHourlyRate": 180,      // optional; ShopRates.after_hours_hourly_rate
      "avgResponseMin": 6,              // optional; avg minutes request→offer (MechanicOffer aggregate)
      "insured": true,                  // optional; Insurance confirmed + validThru in date
      "calloutDetails": {               // optional; Workshop CalloutDetails (call-out fee terms)
        "laborIncluded": true, "mileageIncluded": true,
        "diagnosisIncluded": true, "hoursIncluded": 1
      },
      "makesServiced": ["Freightliner", "Kenworth"],  // optional; top ServiceRating.servicedMake
      "memberSince": 2022               // optional; year of User.createdDate
    }
  ]
}
```

Notes for the Rig Services team:
- `services` slugs are mapped to display labels on our side (see
  `SERVICE_LABELS` in `scripts/build-directory-mechanics.mjs`); add new slugs
  freely, unknown ones are passed through title-cased.
- Field names intentionally match rig-web-services (`ServiceConstants`, `MechanicRatingResponse`, `ServiceRating.isFixed/isOnTime`) so the export job is a thin serializer. Percent fields are 0-100. Google reviews may be layered in later as a separate field set.
- Do NOT include real-time availability here — that's phase 2 (see §4).
- Include *listed* (non-network) shops when the licensed shop universe lands;
  until then the export is just RIG's own mechanics and that's fine.

## 2. Ingestion (this repo — already built)

`scripts/build-directory-mechanics.mjs` reads the export and precomputes
per-page listings into `data/directory/mechanics.json`:

- **City pages**: mechanics whose `baseLat/baseLng` is within
  `min(serviceRadiusMi, 75mi)` of the city, sorted network-first then rating,
  capped at 12. ETA shown is an estimate from distance (drive at ~45 mph +
  10 min wheels-up), clearly a heuristic until dispatch telemetry exists.
- **Corridor pages**: mechanics within reach of any city along the corridor
  (from the geometry-verified `corridor-meta.json`), capped at 10.
- Usage:
  ```
  node scripts/build-directory-mechanics.mjs --from-file export.json   # local file
  MECHANICS_EXPORT_URL=https://... node scripts/build-directory-mechanics.mjs
  ```
- `data/directory/mechanics.ts` uses `mechanics.json` when it's non-empty and
  falls back to the deterministic mock generator while it's empty (`{}`).
  The `MechanicListing` interface is the stable contract; page templates never
  change.

**Launch policy (decided 2026-07-14): coverage gating.** Any city/corridor
with 0 mechanics is not built and not linked; a state hub exists only if it
has ≥1 covered city/corridor; a route page exists only if ≥1 state segment is
covered. Implemented in `mechanics.ts` (`isCityCovered` / `isCorridorCovered`
/ `isStateCovered` / `isRouteCovered`) and applied in every `getStaticPaths`,
all internal link lists, the footer, and `build-sitemap.mjs` (same rule,
duplicated — keep in sync). The gate is inert in mock mode and arms itself
when the real export lands. Launching on RIG-network data only; when licensed
shop listings are added (~3–6 months) coverage expands toward everywhere
under the same rule. Revisit then whether to keep gating at all.

## 3. Rebuild triggers (freshness)

| Trigger | Staleness | Effort |
|---|---|---|
| **Nightly Cloud Build schedule** (start here) | ≤ 24 h | one cron trigger on the existing cloudbuild.yaml |
| **Pub/Sub on mechanic onboard/offboard → Cloud Build** (phase 2) | ~15 min (debounced) | small subscriber + trigger |

Full SSG build is ~minutes for 2,500 pages — a nightly rebuild is effectively
free. Stats (`stats.json`) ride the same rebuild.

**Failure isolation:** on fetch failure the ingestion script falls back to
the last good export (`mechanics-export.last-good.json`, gitignored), then to
the committed `mechanics.json` unchanged — a Rig Services outage, a bad
token, or a malformed file can never blank the directory; worst case
listings are a day stale.

## 4. Real-time layer (phase 2, optional)

The only genuinely live elements are "mechanics active NOW" and availability
badges. Options, in order of preference:

1. **Ship without it** — label the static number honestly ("mechanics
   covering this area") and skip the infrastructure.
2. **Hydrate-enhance** — pages server-render the static value, then one
   client-side fetch per page load hits a single lightweight Rig Services
   endpoint (`GET /directory/live-stats?geo=tx/dallas`), cached ~60 s at the
   edge/Redis. If it's down, the static value silently stays. This is the only
   endpoint that needs to be fast, and it's one cacheable counter.

## What we deliberately avoid

- **Runtime SSR / per-request API calls** — makes page speed hostage to Rig
  Services and kills the static SEO model.
- **ISR on Cloud Run** — Next 12's ISR cache is per-instance; multiple Cloud
  Run instances would serve inconsistent pages and cold starts re-fetch.
  A nightly rebuild is simpler and behaves better.
- **Bidding/dispatch flow in the directory** — the CTA is a phone call; the
  transactional system stays entirely in Rig Services.
