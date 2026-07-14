// ============================================================================
// MECHANICS PROVIDER
//
// Real data path: mechanics.json, produced at build time from the Rig
// Services bulk export by scripts/build-directory-mechanics.mjs (see
// data/directory/MECHANICS-API-PLAN.md). While that file is empty, every
// page falls back to the deterministic MOCK generator below (seeded from the
// page key so builds are stable). `MechanicListing` is the stable contract
// the page templates render.
// ============================================================================
import realJson from './mechanics.json'
import { CITIES, CORRIDORS } from './index'

// Ratings model matches the RIG mechanics DB today: thumbs up/down %, jobs
// completed, fix rate, and timeliness. Google reviews may be layered in later.
export interface MechanicListing {
  id: string
  name: string
  initials: string
  thumbsUpPct: number // 0–100, % of thumbs-up ratings
  ratingCount: number // number of ratings behind the %
  jobsCompleted: number
  fixRatePct: number // % of jobs fixed (vs. escalated/towed)
  onTimePct: number // timeliness: % arrivals within promised window
  distanceMi: number
  etaMin: number
  services: string[]
  rigNetwork: boolean // true = dispatchable RIG mechanic; false = listed shop only
  open247: boolean
  profilePath?: string // /semi-truck-repair/<state>/<home-city>/<slug>/
}

// Profile page data: the mechanic-level record behind a listing, anchored to
// their home city (nearest directory city to their base).
export interface MechanicProfile extends MechanicListing {
  homeState: string
  homeCitySlug: string
  homeCityName: string
  directPhone?: string // listed shops only — shown per the all-data-honest model
}

export const slugifyMechanic = (name: string, id: string) =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') +
  '-' +
  // short stable suffix so same-named shops never collide
  (Math.abs([...id].reduce((h, c) => Math.imul(h, 31) + c.charCodeAt(0), 7)) % 10000).toString(36)

function seed(s: string): () => number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h = (h ^= h >>> 16) >>> 0
    return h / 4294967296
  }
}

const NAME_A = ['Interstate', 'Roadside', 'Heavy Haul', 'Premier', 'Allied', 'Summit', 'Ironline', 'Redline', 'Blue Ridge', 'Frontier', 'Cross Country', 'Overland']
const NAME_B = ['Diesel Service', 'Truck Repair', 'Mobile Diesel', 'Fleet Service', 'Truck & Trailer', 'Diesel Repair', 'Mobile Mechanics', 'Heavy Duty Repair']
// Display labels for the RIG service taxonomy — matches
// ServiceConstants.RIG_SUPPORTED_SERVICES in rig-web-services
// (tire_change, tow_service, mobile_service, maintenance_change).
// Keep in sync with SERVICE_LABELS in scripts/build-directory-mechanics.mjs.
const SERVICES = ['Mobile repair', 'Tire change', 'Towing', 'Maintenance']

function build(key: string, count: number, localName: string, profileBase?: string): MechanicListing[] {
  const rnd = seed(key)
  const out: MechanicListing[] = []
  for (let i = 0; i < count; i++) {
    // first listing gets a local flavor name, rest from the generator
    const name =
      i === 0
        ? `${localName} ${NAME_B[Math.floor(rnd() * NAME_B.length)]}`
        : `${NAME_A[Math.floor(rnd() * NAME_A.length)]} ${NAME_B[Math.floor(rnd() * NAME_B.length)]}`
    const words = name.split(' ')
    // nearly all mechanics do mobile repair; the rest varies
    const services: string[] = ['Mobile repair']
    for (const s of SERVICES.slice(1)) if (rnd() > 0.45) services.push(s)
    const rigNetwork = i < Math.max(2, count - 2) // most are in-network in mock data
    const id = `${key}-${i}`
    out.push({
      id,
      name,
      initials: (words[0][0] + (words[1]?.[0] || '')).toUpperCase(),
      // NOTE: key must be omitted (not undefined) — getStaticProps props
      // must be JSON-serializable
      ...(profileBase ? { profilePath: `${profileBase}${slugifyMechanic(name, id)}/` } : {}),
      thumbsUpPct: 88 + Math.floor(rnd() * 12),
      ratingCount: 20 + Math.floor(rnd() * 220),
      jobsCompleted: 30 + Math.floor(rnd() * 400),
      fixRatePct: 85 + Math.floor(rnd() * 14),
      onTimePct: 86 + Math.floor(rnd() * 13),
      distanceMi: Math.round((1.5 + rnd() * 9) * 10) / 10,
      etaMin: 20 + Math.floor(rnd() * 35),
      services,
      rigNetwork,
      open247: rnd() > 0.35,
    })
  }
  return out.sort((a, b) => Number(b.rigNetwork) - Number(a.rigNetwork) || a.etaMin - b.etaMin)
}

const real = realJson as { pages: Record<string, MechanicListing[]> }
// Once the export is wired, its ingestion output drives EVERY page (a page
// missing from it renders zero listings rather than mixing in mock data).
const realMode = Object.keys(real.pages).length > 0

// ---------------------------------------------------------------------------
// Coverage gating (launch policy): pages with 0 mechanics are not built and
// not linked. In mock mode everything counts as covered, so the gate arms
// itself automatically when the real export lands. When licensed shop data
// is added later (fuller coverage), the same rule just hides fewer pages.
// scripts/build-sitemap.mjs applies the identical rule — keep them in sync.
// ---------------------------------------------------------------------------
export const isCityCovered = (state: string, citySlug: string) =>
  !realMode || (real.pages[`${state}/${citySlug}`] || []).length > 0

export const isCorridorCovered = (route: string, state: string) =>
  !realMode || (real.pages[`${route}/${state}`] || []).length > 0

export const isStateCovered = (state: string) =>
  !realMode ||
  CITIES.some((c) => c.state === state && isCityCovered(c.state, c.citySlug)) ||
  CORRIDORS.some((c) => c.state === state && isCorridorCovered(c.route, c.state))

export const isRouteCovered = (route: string) =>
  !realMode || CORRIDORS.some((c) => c.route === route && isCorridorCovered(c.route, c.state))

export function getMechanicsForCity(state: string, citySlug: string, cityName: string): MechanicListing[] {
  if (realMode) return real.pages[`${state}/${citySlug}`] || []
  const rnd = seed(`${state}/${citySlug}`)
  return build(`${state}/${citySlug}`, 4 + Math.floor(rnd() * 3), cityName, `/semi-truck-repair/${state}/${citySlug}/`)
}

export function getMechanicsForCorridor(route: string, state: string, stateName: string): MechanicListing[] {
  if (realMode) return real.pages[`${route}/${state}`] || []
  const rnd = seed(`${route}/${state}`)
  // mock corridor entities are page-scoped with no home city → no profile link
  return build(`${route}/${state}`, 2 + Math.floor(rnd() * 2), stateName)
}

// ---------------------------------------------------------------------------
// Mechanic profile pages
// Real mode: ingestion writes a `profiles` map (one entry per mechanic at
// their home city) and every path is prerendered. Mock mode: profile pages
// are NOT prerendered (fallback:'blocking' serves them on demand in dev) so
// ~10k fake pages don't bloat the build; getProfile resolves from the same
// deterministic generator the listing links came from.
// ---------------------------------------------------------------------------
const realProfiles = (realJson as { profiles?: Record<string, MechanicProfile> }).profiles || {}

export function getProfilePaths(): { state: string; city: string; shop: string }[] {
  if (!realMode) return []
  return Object.keys(realProfiles).map((key) => {
    const [state, city, shop] = key.split('/')
    return { state, city, shop }
  })
}

export function getProfile(state: string, citySlug: string, shopSlug: string): MechanicProfile | null {
  if (realMode) return realProfiles[`${state}/${citySlug}/${shopSlug}`] || null
  const city = CITIES.find((c) => c.state === state && c.citySlug === citySlug)
  if (!city) return null
  const listing = getMechanicsForCity(state, citySlug, city.name).find((m) =>
    m.profilePath?.endsWith(`/${shopSlug}/`)
  )
  if (!listing) return null
  return { ...listing, homeState: state, homeCitySlug: citySlug, homeCityName: city.name }
}
