// Typed accessors over the generated directory data
// (cities.json / corridors.json / states.json / stats.json / corridor-meta.json
// are produced by scripts/build-directory-*.mjs from data/directory/pages.csv).
import citiesJson from './cities.json'
import corridorsJson from './corridors.json'
import statesJson from './states.json'
import statsJson from './stats.json'
import corridorMetaJson from './corridor-meta.json'

export const SITE_ORIGIN = 'https://bigrig.app'
export const MAIN_SITE = SITE_ORIGIN // marketing-site root (logos link here)
export const SEGMENT = 'semi-truck-repair'
export const DISPATCH_PHONE_DISPLAY = '1-855-744-2223'
export const DISPATCH_PHONE_TEL = 'tel:18557442223'

export interface DirectoryCity {
  state: string
  stateName: string
  tier: 'Core' | 'Extended'
  name: string
  includeReason: string
  population: number
  lat: number
  lng: number
  citySlug: string
}

export interface DirectoryCorridor {
  state: string
  stateName: string
  tier: 'Core' | 'Extended'
  name: string
  includeReason: string
  route: string // "i-10"
  routeDisplay: string // "I-10"
  fullCoverage: boolean
}

export interface CityStats {
  mechanicsInArea: number
  avgArrivalMin: number
  avgDispatchMin: number
  jobsCompleted: number
}

export interface CorridorStats {
  mechanicsCovering: number
  avgReachMin: number
}

export interface StateInfo {
  code: string
  name: string
  cityCount: number
  corridorCount: number
}

export interface CorridorMeta {
  citiesAlong: string[]
  endpoints: string
  approxMiles: number
  majorJunctions: string[]
  neighbors: { prev: string | null; next: string | null }
  description: string
  verified?: string // geometry-verification stamp, e.g. "osm-2026-07-13"
}

export const CITIES = citiesJson as DirectoryCity[]
export const CORRIDORS = corridorsJson as DirectoryCorridor[]
export const STATES = statesJson as Record<string, StateInfo>
export const CORRIDOR_META = corridorMetaJson as Record<string, CorridorMeta>

const stats = statsJson as unknown as {
  national: {
    mechanicsNetwork: number
    avgDispatchMin: number
    avgArrivalMin: number
    avgCostUsd: number
    costVsIndustryPct: number
    fixRatePct: number
  }
  states: Record<string, CityStats>
  cities: Record<string, CityStats>
  corridors: Record<string, CorridorStats>
}

export const NATIONAL_STATS = stats.national

export const getCity = (state: string, citySlug: string) =>
  CITIES.find((c) => c.state === state && c.citySlug === citySlug)

export const getCitiesByState = (state: string) => CITIES.filter((c) => c.state === state)

export const getCorridor = (route: string, state: string) =>
  CORRIDORS.find((c) => c.route === route && c.state === state)

export const getCorridorsByState = (state: string) => CORRIDORS.filter((c) => c.state === state)

export const getCorridorsByRoute = (route: string) => CORRIDORS.filter((c) => c.route === route)

export const getRoutes = () =>
  [...new Set(CORRIDORS.map((c) => c.route))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  )

export const getCityStats = (state: string, citySlug: string): CityStats =>
  stats.cities[`${state}/${citySlug}`] || {
    mechanicsInArea: 4,
    avgArrivalMin: 50,
    avgDispatchMin: 14,
    jobsCompleted: 40,
  }

export const getStateStats = (state: string): CityStats =>
  stats.states[state] || { mechanicsInArea: 10, avgArrivalMin: 50, avgDispatchMin: 14, jobsCompleted: 100 }

export const getCorridorStats = (route: string, state: string): CorridorStats =>
  stats.corridors[`${route}/${state}`] || { mechanicsCovering: 4, avgReachMin: 55 }

export const getCorridorMeta = (route: string, state: string): CorridorMeta | null =>
  CORRIDOR_META[`${route}/${state}`] || null

// NYC boroughs are separate rows in the city data; "top market" lists
// shouldn't show them next to New York City itself
export const NYC_BOROUGH_SLUGS = new Set(['brooklyn', 'queens', 'manhattan', 'the-bronx', 'staten-island'])
export const isBorough = (c: Pick<DirectoryCity, 'state' | 'citySlug'>) =>
  c.state === 'ny' && NYC_BOROUGH_SLUGS.has(c.citySlug)

export const cityPath = (c: Pick<DirectoryCity, 'state' | 'citySlug'>) =>
  `/${SEGMENT}/${c.state}/${c.citySlug}/`
export const statePath = (state: string) => `/${SEGMENT}/${state}/`
export const corridorPath = (route: string, state: string) =>
  `/${SEGMENT}/corridors/${route}/${state}/`
export const routePath = (route: string) => `/${SEGMENT}/corridors/${route}/`
