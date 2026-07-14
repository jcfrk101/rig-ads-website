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

export interface MechanicListing {
  id: string
  name: string
  initials: string
  rating: number // 4.2 – 4.9
  reviewCount: number
  distanceMi: number
  etaMin: number
  services: string[]
  rigNetwork: boolean // true = dispatchable RIG mechanic; false = listed shop only
  open247: boolean
  availableNow: boolean
}

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
const SERVICES = ['Mobile repair', 'Tire service', 'Air brake', 'DPF / regen', 'Electrical', 'Cooling', 'Trailer', 'Towing', 'Reefer', 'Jump / fuel', 'DOT inspection']

function build(key: string, count: number, localName: string): MechanicListing[] {
  const rnd = seed(key)
  const out: MechanicListing[] = []
  for (let i = 0; i < count; i++) {
    // first listing gets a local flavor name, rest from the generator
    const name =
      i === 0
        ? `${localName} ${NAME_B[Math.floor(rnd() * NAME_B.length)]}`
        : `${NAME_A[Math.floor(rnd() * NAME_A.length)]} ${NAME_B[Math.floor(rnd() * NAME_B.length)]}`
    const words = name.split(' ')
    const svcCount = 2 + Math.floor(rnd() * 3)
    const services: string[] = []
    while (services.length < svcCount) {
      const s = SERVICES[Math.floor(rnd() * SERVICES.length)]
      if (!services.includes(s)) services.push(s)
    }
    const rigNetwork = i < Math.max(2, count - 2) // most are in-network in mock data
    out.push({
      id: `${key}-${i}`,
      name,
      initials: (words[0][0] + (words[1]?.[0] || '')).toUpperCase(),
      rating: Math.round((4.2 + rnd() * 0.7) * 10) / 10,
      reviewCount: 20 + Math.floor(rnd() * 220),
      distanceMi: Math.round((1.5 + rnd() * 9) * 10) / 10,
      etaMin: 20 + Math.floor(rnd() * 35),
      services,
      rigNetwork,
      open247: rnd() > 0.35,
      availableNow: rigNetwork && rnd() > 0.2,
    })
  }
  return out.sort((a, b) => Number(b.rigNetwork) - Number(a.rigNetwork) || a.etaMin - b.etaMin)
}

const real = realJson as { pages: Record<string, MechanicListing[]> }
// Once the export is wired, its ingestion output drives EVERY page (a page
// missing from it renders zero listings rather than mixing in mock data).
const realMode = Object.keys(real.pages).length > 0

export function getMechanicsForCity(state: string, citySlug: string, cityName: string): MechanicListing[] {
  if (realMode) return real.pages[`${state}/${citySlug}`] || []
  const rnd = seed(`${state}/${citySlug}`)
  return build(`${state}/${citySlug}`, 4 + Math.floor(rnd() * 3), cityName)
}

export function getMechanicsForCorridor(route: string, state: string, stateName: string): MechanicListing[] {
  if (realMode) return real.pages[`${route}/${state}`] || []
  const rnd = seed(`${route}/${state}`)
  return build(`${route}/${state}`, 2 + Math.floor(rnd() * 2), stateName)
}
