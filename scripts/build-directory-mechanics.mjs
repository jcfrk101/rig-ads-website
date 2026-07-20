// Ingests the Rig Services mechanics export into per-page listings.
// See data/directory/MECHANICS-API-PLAN.md for the export schema and the
// overall architecture (build-time ingestion, nightly rebuilds).
//
// Usage:
//   node scripts/build-directory-mechanics.mjs --from-file <export.json>
//   MECHANICS_EXPORT_URL=https://... node scripts/build-directory-mechanics.mjs
//   ... --out <path>   (default: data/directory/mechanics.json)
//
// Falls back to the last good export (mechanics-export.last-good.json,
// gitignored) if the fetch fails, so an API outage never blanks the build.
import fs from 'fs'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data', 'directory')
const LAST_GOOD = path.join(DATA_DIR, 'mechanics-export.last-good.json')

const args = process.argv.slice(2)
const argVal = (flag) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : undefined
}
const OUT = argVal('--out') || path.join(DATA_DIR, 'mechanics.json')

const CITY_CAP = 12
const CORRIDOR_CAP = 10
const MAX_RADIUS_MI = 75 // cap a mechanic's own serviceRadiusMi for matching

// Launch policy (Josh, 2026-07-18): lower 48 + DC only. AK/HI have a handful
// of signups (4 AK, 3 HI in the first export) — too thin to promise coverage.
// Remove a state here to reinstate it; the coverage gate does the rest.
const EXCLUDED_STATES = new Set(['ak', 'hi'])
const ETA_MPH = 45
const ETA_PREP_MIN = 10

// RIG service taxonomy — matches ServiceConstants.RIG_SUPPORTED_SERVICES in
// rig-web-services. Keep in sync with SERVICES in data/directory/mechanics.ts.
export const SERVICE_LABELS = {
  mobile_service: 'Mobile repair',
  tire_change: 'Tire change',
  tow_service: 'Towing',
  maintenance_change: 'Maintenance',
}
const serviceLabel = (slug) =>
  SERVICE_LABELS[slug] || slug.replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase())

const saneRate = (r) => typeof r === 'number' && r >= 50 && r <= 500

// mirror of slugifyMechanic in data/directory/mechanics.ts — keep in sync
const slugifyMechanic = (name, id) =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') +
  '-' +
  (Math.abs([...id].reduce((h, c) => Math.imul(h, 31) + c.charCodeAt(0), 7)) % 10000).toString(36)

function haversineMi(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// The Services layer drops a daily export behind this endpoint (auth
// required — set MECHANICS_EXPORT_TOKEN locally and as a Cloud Build
// secret). Override with MECHANICS_EXPORT_URL or --from-file for testing.
const DEFAULT_EXPORT_URL = 'https://api.bigrig.app/directory-export/latest'

// Failure chain — a fetch problem must never break a build:
// live endpoint → last-good cache (gitignored) → keep the committed
// mechanics.json unchanged → abort only when there is no data at all.
async function loadExport() {
  const fromFile = argVal('--from-file')
  if (fromFile) return JSON.parse(fs.readFileSync(fromFile, 'utf8'))

  const exportUrl = process.env.MECHANICS_EXPORT_URL || DEFAULT_EXPORT_URL
  try {
    const res = await fetch(exportUrl, {
      headers: process.env.MECHANICS_EXPORT_TOKEN
        ? { authorization: `Bearer ${process.env.MECHANICS_EXPORT_TOKEN}` }
        : {},
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    fs.writeFileSync(LAST_GOOD, JSON.stringify(data))
    console.log(`fetched export from ${exportUrl} (generatedAt ${data.generatedAt || 'unknown'})`)
    return data
  } catch (err) {
    console.error(`Export fetch failed from ${exportUrl} (${err.message})`)
    if (fs.existsSync(LAST_GOOD)) {
      console.error('→ falling back to last good export')
      return JSON.parse(fs.readFileSync(LAST_GOOD, 'utf8'))
    }
    try {
      const existing = JSON.parse(fs.readFileSync(OUT, 'utf8'))
      if (existing && existing.pages && Object.keys(existing.pages).length > 0) {
        console.error('→ no last-good cache; keeping existing mechanics.json unchanged')
        process.exit(0)
      }
    } catch {}
    console.error('→ no usable data at all, aborting')
    process.exit(1)
  }
}

// A handful of bad rows must not kill the nightly build: invalid mechanics
// are skipped with a report, and we only abort if the file shape is wrong or
// nearly everything is invalid.
function validate(exp) {
  if (!exp || exp.version !== 1 || !Array.isArray(exp.mechanics))
    throw new Error('export must be {version: 1, mechanics: [...]}')

  const reasons = new Map()
  const skip = (m, reason) => {
    reasons.set(reason, (reasons.get(reason) || 0) + 1)
    return false
  }
  const ok = exp.mechanics.filter((m) => {
    if (!m.id) return skip(m, 'missing id')
    if (!m.name || !String(m.name).trim()) return skip(m, 'empty name')
    if (typeof m.baseLat !== 'number' || typeof m.baseLng !== 'number') return skip(m, 'missing coords')
    if (Math.abs(m.baseLat) < 0.5 && Math.abs(m.baseLng) < 0.5) return skip(m, 'null-island coords')
    if (!Array.isArray(m.services)) return skip(m, 'missing services')
    if (!['rig', 'listed'].includes(m.network)) return skip(m, 'bad network')
    return true
  })

  const skipped = exp.mechanics.length - ok.length
  if (skipped)
    console.warn(
      `skipped ${skipped}/${exp.mechanics.length} invalid mechanics: ${[...reasons.entries()].map(([r, n]) => `${r}=${n}`).join(', ')}`
    )
  if (ok.length < exp.mechanics.length * 0.5)
    throw new Error(`more than half the export is invalid (${skipped}/${exp.mechanics.length}) — refusing to build from it`)
  exp.mechanics = ok.map((m) => ({ ...m, name: String(m.name).trim() }))
}

function toListing(m, distanceMi) {
  const words = m.name.split(' ')
  return {
    id: m.id,
    name: m.name,
    initials: (words[0][0] + (words[1]?.[0] || '')).toUpperCase(),
    // export uses rig-web-services vocabulary (MechanicRatingResponse /
    // ServiceRating aggregates); listing uses directory display names.
    // Percent fields clamped 0-100 — the 2026-07-17 test export had 31
    // mechanics with percentSatisfied up to 200 (reported upstream).
    thumbsUpPct: Math.min(100, Math.max(0, Math.round(m.percentSatisfied ?? 0))),
    ratingCount: m.totalRatings ?? 0,
    jobsCompleted: m.completedJobs ?? 0,
    fixRatePct: Math.min(100, Math.max(0, Math.round(m.percentFixed ?? 0))),
    onTimePct: Math.min(100, Math.max(0, Math.round(m.percentOnTime ?? 0))),
    distanceMi: Math.round(distanceMi * 10) / 10,
    etaMin: Math.round((distanceMi / ETA_MPH) * 60 + ETA_PREP_MIN),
    services: m.services.map(serviceLabel),
    rigNetwork: m.network === 'rig',
    open247: Boolean(m.open247),
    // optional enrichments (see MECHANICS-API-PLAN.md schema for provenance).
    // Rates outside a sane display band are omitted, not shown — the first
    // real export had 13 outliers from \$1/hr to \$15,000/hr.
    ...(m.profileImageUrl ? { avatarUrl: m.profileImageUrl } : {}),
    ...(saneRate(m.standardHourlyRate) ? { hourlyRate: m.standardHourlyRate } : {}),
    ...(m.avgResponseMin ? { avgResponseMin: Math.round(m.avgResponseMin) } : {}),
    ...(m.insured != null ? { insured: Boolean(m.insured) } : {}),
  }
}

function pickForPoint(mechanics, lat, lng, cap) {
  return mechanics
    .map((m) => ({ m, d: haversineMi(lat, lng, m.baseLat, m.baseLng) }))
    .filter(({ m, d }) => d <= Math.min(m.serviceRadiusMi ?? MAX_RADIUS_MI, MAX_RADIUS_MI))
    .sort(
      (a, b) =>
        Number(b.m.network === 'rig') - Number(a.m.network === 'rig') ||
        (b.m.percentSatisfied ?? 0) - (a.m.percentSatisfied ?? 0) ||
        a.d - b.d
    )
    .slice(0, cap)
    .map(({ m, d }) => toListing(m, d))
}

const exp = await loadExport()
validate(exp)

const cities = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cities.json'), 'utf8'))
const corridorMeta = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'corridor-meta.json'), 'utf8'))
const cityByKey = new Map(cities.map((c) => [`${c.state}/${c.citySlug}`, c]))

const out = { _generatedAt: exp.generatedAt, _mechanicCount: exp.mechanics.length, pages: {}, profiles: {} }
let covered = 0

// home city per mechanic: the closest city page that actually lists them
const homeCandidate = new Map() // mechanicId -> {city, distanceMi}

for (const c of cities) {
  if (EXCLUDED_STATES.has(c.state)) continue
  const listings = pickForPoint(exp.mechanics, c.lat, c.lng, CITY_CAP)
  out.pages[`${c.state}/${c.citySlug}`] = listings
  if (listings.length) covered++
  for (const l of listings) {
    const cur = homeCandidate.get(l.id)
    if (!cur || l.distanceMi < cur.distanceMi) homeCandidate.set(l.id, { city: c, distanceMi: l.distanceMi })
  }
}

// Corridor pages: match against a rough polyline through the cities along the
// route (chords between consecutive cities catch rural mid-route mechanics
// that no city-radius test would find). Interstates are direct enough between
// cities for chords + a wide buffer; swap in real OSM polylines (see
// scripts/corridor-verify/) if this proves too coarse.
const CORRIDOR_BUFFER_MI = 30

function distToSegmentMi(pLat, pLng, aLat, aLng, bLat, bLng) {
  // planar approximation, fine at these scales
  const kx = Math.cos(((aLat + bLat) / 2) * (Math.PI / 180)) * 69.17
  const ky = 68.97
  const ax = aLng * kx, ay = aLat * ky
  const bx = bLng * kx, by = bLat * ky
  const px = pLng * kx, py = pLat * ky
  const dx = bx - ax, dy = by - ay
  const lenSq = dx * dx + dy * dy
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  const cx = ax + t * dx, cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

for (const [key, meta] of Object.entries(corridorMeta)) {
  const state = key.split('/').pop()
  if (EXCLUDED_STATES.has(state)) continue
  const waypoints = (meta.citiesAlong || [])
    .map((slug) => cityByKey.get(`${state}/${slug}`))
    .filter(Boolean)

  const seen = new Map()
  // near a city on the route
  for (const city of waypoints)
    for (const l of pickForPoint(exp.mechanics, city.lat, city.lng, CORRIDOR_CAP))
      if (!seen.has(l.id) || seen.get(l.id).distanceMi > l.distanceMi) seen.set(l.id, l)
  // near the route line between cities
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i], b = waypoints[i + 1]
    for (const m of exp.mechanics) {
      const d = distToSegmentMi(m.baseLat, m.baseLng, a.lat, a.lng, b.lat, b.lng)
      if (d <= CORRIDOR_BUFFER_MI && (!seen.has(m.id) || seen.get(m.id).distanceMi > d))
        seen.set(m.id, toListing(m, d))
    }
  }

  // on a corridor, distance is everything — sort by it within network tier
  out.pages[key] = [...seen.values()]
    .sort((a, b) => Number(b.rigNetwork) - Number(a.rigNetwork) || a.distanceMi - b.distanceMi)
    .slice(0, CORRIDOR_CAP)
}

// ---------------------------------------------------------------------------
// Mechanic profile pages: one per mechanic, anchored at their home city
// (closest city page listing them). Stamp profilePath onto every listing
// occurrence so cards can link to the profile.
// ---------------------------------------------------------------------------
const profilePathById = new Map()
for (const m of exp.mechanics) {
  const home = homeCandidate.get(m.id)
  if (!home) continue // appears on no city page (corridor-only reach) → no profile
  const slug = slugifyMechanic(m.name, m.id)
  const key = `${home.city.state}/${home.city.citySlug}/${slug}`
  const profilePath = `/semi-truck-repair/${key}/`
  profilePathById.set(m.id, profilePath)
  out.profiles[key] = {
    ...toListing(m, home.distanceMi),
    profilePath,
    homeState: home.city.state,
    homeCitySlug: home.city.citySlug,
    homeCityName: home.city.name,
    // the honest-data model: listed shops show their own line; RIG-network
    // mechanics are reached through dispatch only
    ...(m.network === 'listed' && m.phone ? { directPhone: m.phone } : {}),
    // profile-only enrichments
    ...(saneRate(m.afterHoursHourlyRate) ? { afterHoursRate: m.afterHoursHourlyRate } : {}),
    ...(m.calloutDetails ? { calloutTerms: m.calloutDetails } : {}),
    ...(m.serviceRadiusMi ? { serviceRadiusMi: m.serviceRadiusMi } : {}),
    ...(Array.isArray(m.makesServiced) && m.makesServiced.length ? { makesServiced: m.makesServiced } : {}),
    ...(m.memberSince ? { memberSince: m.memberSince } : {}),
  }
}
for (const listings of Object.values(out.pages))
  for (const l of listings) {
    const p = profilePathById.get(l.id)
    if (p) l.profilePath = p
  }

// compact — this file is large (thousands of mechanics) and regenerated often
fs.writeFileSync(OUT, JSON.stringify(out) + '\n')
console.log(
  `${OUT}: ${exp.mechanics.length} mechanics → ${Object.keys(out.pages).length} pages (${covered}/${cities.length} cities have ≥1 listing), ${Object.keys(out.profiles).length} profiles`
)
