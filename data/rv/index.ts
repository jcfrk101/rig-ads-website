// RV tree accessors — the geo layer borrows the truck directory's data and
// coverage machinery wholesale (cities.json, stats, coverage gate). Josh's
// estimate: ~30% of the network realistically serves RV chassis work (tires,
// brakes, engine, electrical), so truck coverage ≈ RV coverage.
import { CITIES, STATES, getCityStats, getStateStats, NATIONAL_STATS } from '../directory'
import { isCityCovered, isStateCovered } from '../directory/mechanics'

export const RV_SEGMENT = 'rv-repair'

export const rvHubPath = () => `/${RV_SEGMENT}/`
export const rvProblemPath = (slug: string) => `/${RV_SEGMENT}/${slug}/`
export const rvStatePath = (state: string) => `/${RV_SEGMENT}/${state}/`
export const rvCityPath = (state: string, citySlug: string) => `/${RV_SEGMENT}/${state}/${citySlug}/`

export const rvCoveredStates = () =>
  Object.values(STATES)
    .filter((st) => isStateCovered(st.code))
    .sort((a, b) => a.name.localeCompare(b.name))

export const rvCoveredCities = () => CITIES.filter((c) => isCityCovered(c.state, c.citySlug))

// A state slug is always exactly 2 letters; problem slugs never are. This is
// what lets /rv-repair/[slug]/ serve both page types without collision.
export const isStateSlug = (slug: string) => /^[a-z]{2}$/.test(slug) && Boolean(STATES[slug])

export { getCityStats, getStateStats, NATIONAL_STATS }
