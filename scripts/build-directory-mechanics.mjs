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
const ETA_MPH = 45
const ETA_PREP_MIN = 10

// Mechanics-DB service taxonomy — keep in sync with SERVICES in
// data/directory/mechanics.ts. VERIFY against the real mechanics DB.
export const SERVICE_LABELS = {
  'tire-change': 'Tire change',
  'tire-repair': 'Tire repair',
  'mobile-repair': 'Mobile repair',
  towing: 'Towing',
  'jump-start': 'Jump start',
  'fuel-delivery': 'Fuel delivery',
  lockout: 'Lockout',
  'air-brakes': 'Air brakes',
  electrical: 'Electrical',
  reefer: 'Reefer repair',
  trailer: 'Trailer repair',
}
const serviceLabel = (slug) =>
  SERVICE_LABELS[slug] || slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())

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

async function loadExport() {
  const fromFile = argVal('--from-file')
  if (fromFile) return JSON.parse(fs.readFileSync(fromFile, 'utf8'))

  const exportUrl = process.env.MECHANICS_EXPORT_URL
  if (!exportUrl) {
    console.error('No --from-file and no MECHANICS_EXPORT_URL set.')
    process.exit(1)
  }
  try {
    const res = await fetch(exportUrl, {
      headers: process.env.MECHANICS_EXPORT_TOKEN
        ? { authorization: `Bearer ${process.env.MECHANICS_EXPORT_TOKEN}` }
        : {},
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    fs.writeFileSync(LAST_GOOD, JSON.stringify(data))
    return data
  } catch (err) {
    console.error(`Export fetch failed (${err.message})`)
    if (fs.existsSync(LAST_GOOD)) {
      console.error('→ falling back to last good export')
      return JSON.parse(fs.readFileSync(LAST_GOOD, 'utf8'))
    }
    console.error('→ no last-good export available, aborting')
    process.exit(1)
  }
}

function validate(exp) {
  if (!exp || exp.version !== 1 || !Array.isArray(exp.mechanics))
    throw new Error('export must be {version: 1, mechanics: [...]}')
  const bad = exp.mechanics.filter(
    (m) =>
      !m.id ||
      !m.name ||
      typeof m.baseLat !== 'number' ||
      typeof m.baseLng !== 'number' ||
      !Array.isArray(m.services) ||
      !['rig', 'listed'].includes(m.network)
  )
  if (bad.length)
    throw new Error(`${bad.length} mechanics missing required fields (first: ${JSON.stringify(bad[0]).slice(0, 120)})`)
}

function toListing(m, distanceMi) {
  const words = m.name.split(' ')
  return {
    id: m.id,
    name: m.name,
    initials: (words[0][0] + (words[1]?.[0] || '')).toUpperCase(),
    thumbsUpPct: m.thumbsUpPct ?? 0,
    ratingCount: m.ratingCount ?? 0,
    jobsCompleted: m.jobsCompleted ?? 0,
    fixRatePct: m.fixRatePct ?? 0,
    onTimePct: m.onTimePct ?? 0,
    distanceMi: Math.round(distanceMi * 10) / 10,
    etaMin: Math.round((distanceMi / ETA_MPH) * 60 + ETA_PREP_MIN),
    services: m.services.map(serviceLabel),
    rigNetwork: m.network === 'rig',
    open247: Boolean(m.open247),
  }
}

function pickForPoint(mechanics, lat, lng, cap) {
  return mechanics
    .map((m) => ({ m, d: haversineMi(lat, lng, m.baseLat, m.baseLng) }))
    .filter(({ m, d }) => d <= Math.min(m.serviceRadiusMi ?? MAX_RADIUS_MI, MAX_RADIUS_MI))
    .sort(
      (a, b) =>
        Number(b.m.network === 'rig') - Number(a.m.network === 'rig') ||
        (b.m.thumbsUpPct ?? 0) - (a.m.thumbsUpPct ?? 0) ||
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

const out = { _generatedAt: exp.generatedAt, _mechanicCount: exp.mechanics.length, pages: {} }
let covered = 0

for (const c of cities) {
  const listings = pickForPoint(exp.mechanics, c.lat, c.lng, CITY_CAP)
  out.pages[`${c.state}/${c.citySlug}`] = listings
  if (listings.length) covered++
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

fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n')
console.log(
  `${OUT}: ${exp.mechanics.length} mechanics → ${Object.keys(out.pages).length} pages (${covered}/${cities.length} cities have ≥1 listing)`
)
