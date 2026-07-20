# Dual-Run Plan — repair.bigrig.app alongside the new directory

Decision (Josh, 2026-07-14): no hard cutover. The existing ad landing pages
(repair.bigrig.app) keep running untouched while the directory launches on
bigrig.app; ad campaigns migrate state-by-state as the new pages beat
benchmarks; organic builds on the new tree in parallel. Retire the old site
only when traffic has moved.

## Canonical domain

**The canonical host is the apex: `https://bigrig.app` — no www.**
`www.bigrig.app` must 301 to the apex (configured at the LB/domain level,
alongside the path routing). All canonicals, JSON-LD, sitemap URLs, and
outbound main-site links in this repo use the apex.

## Topology

| | Old (ads program) | New (directory) |
|---|---|---|
| Host | repair.bigrig.app | bigrig.app/semi-truck-repair/* |
| Deploys from | `main` (frozen except emergencies) | `seo-directory` branch |
| Cloud Run service | existing service, untouched | NEW second service (same Dockerfile/cloudbuild, different service name) |
| Risk coupling | none — separate deploys, either rolls back alone | |

Note: both page sets live in this one repo, but the old service must stay on
`main` — this branch renamed legacy state slugs and enabled trailingSlash;
deploying it to the old host mid-test would change live ad URLs for no gain.

## Google Ads conversion mechanics (why sharing numbers is safe)

Everything that talks to Google lives in this repo:

1. **Base tag** (`pages/_document.tsx`): gtag.js with the AW- account ID on
   every page, old and new. Pageviews/remarketing only — never conversions.
   Both services must use the SAME `NEXT_PUBLIC_GTAG_ID` so that when ads do
   point at new pages, conversions land in the same Ads account/actions.
2. **DNI call tracking** (`fireDniConfig` — fired per page by
   DirectoryLayout with the state label from `statePhones.ts`, same labels
   as the old landing pages): registering a number only tells Google to swap
   the displayed number with a Google forwarding number **for visitors who
   arrived via an ad click (gclid)**. Organic visitors see and dial the real
   state number — untrackable by Google — so **no ad traffic ⇒ zero call
   conversions from the new pages.** When campaigns move over, calls count
   in the SAME "calls from website" conversion actions ⇒ cost/call and call
   rate are apples-to-apples with the old pages.
3. **Legacy click conversion** (`fireCallConversion` on tel-link taps):
   fires only if `NEXT_PUBLIC_GTAG_CALL_CONVERSION` is set — per the note in
   utils/gtag.ts this was a temporary Smart-Bidding overlap due for removal.
   **Do NOT set that env var on the new directory service** (the calls
   no-op). Remove the calls entirely once the old service retires it.

Optional: order a parallel DNI number set for directory pages if the call
center wants old-vs-new visibility without opening Ads — statePhones.ts
makes that a data swap.

## Why dual-running is SEO-safe

- Directory pages canonical to `https://bigrig.app/...` already.
- Old pages are paid landing pages; new tree targets organic long-tail.
  Before cutover, check Search Console for any organic rankings the old
  state pages hold — those transfer via 301 at retirement.
- New GSC property for bigrig.app; submit /sitemap.xml there on launch.

## Ads A/B mechanics

1. Use Google Ads campaign experiments (50/50) in a few states: trial arm
   final URLs → new pages (state campaigns → /semi-truck-repair/<st>/,
   geo campaigns → city pages); control arm keeps old URLs.
2. Promote per state when the trial beats benchmarks (cost/call, call rate,
   ≥60s call rate); end experiment, update final URLs permanently.

## Retirement (when traffic has moved)

Deploy a 301 map on the old service and leave it up indefinitely:

- repair.bigrig.app/             → bigrig.app/semi-truck-repair/
- repair.bigrig.app/<state-name> → bigrig.app/semi-truck-repair/<code>/
  (texas → tx/ etc.; the mapping is STATE_DATA.slug → STATES.code)
- /rv, /rv-roadside              → RV tree when it exists, else the hub
- /roadside                      → /semi-truck-repair/

Then update GBP/citation links. Redirects are one config file — even
retirement is reversible.

## Launch checklist for the new service (when ready)

- [ ] Cloud Run service `rig-directory` from `seo-directory` branch
- [ ] LB/edge: bigrig.app/semi-truck-repair/* → rig-directory; www → apex
      301; decide /sitemap.xml + robots.txt ownership at the apex
- [ ] Env: same NEXT_PUBLIC_GTAG_ID as old service; do NOT set
      NEXT_PUBLIC_GTAG_CALL_CONVERSION; set MECHANICS_EXPORT_TOKEN
      (Cloud Build secret) for the daily export fetch
- [ ] Real stats export replaces placeholder formulas (stats.json)
- [x] Mechanics export wired — daily pull from
      api.bigrig.app/directory-export/latest on every build; coverage
      gating and profile pages armed with real data
- [ ] GSC property + sitemap submitted
- [ ] Nightly Cloud Build rebuild trigger
- [x] Real logo-full.svg in header/footer, linked to the apex home
