import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import DirectoryLayout from '../../../components/directory/DirectoryLayout'
import StatStrip from '../../../components/directory/StatStrip'
import DispatchBanner from '../../../components/directory/DispatchBanner'
import DispatchExplainer from '../../../components/directory/DispatchExplainer'
import s from '../../../styles/Directory.module.scss'
import {
  STATES,
  SEGMENT,
  StateInfo,
  DirectoryCity,
  DirectoryCorridor,
  CityStats,
  getCitiesByState,
  getCorridorsByState,
  getStateStats,
  cityPath,
  corridorPath,
} from '../../../data/directory'
import { isCityCovered, isCorridorCovered, isStateCovered } from '../../../data/directory/mechanics'
import { getPhoneForState } from '../../../data/directory/statePhones'

interface Props {
  state: StateInfo
  cities: DirectoryCity[]
  corridors: DirectoryCorridor[]
  stats: CityStats
}

export default function StateHub({ state, cities, corridors, stats }: Props) {
  const phone = getPhoneForState(state.code)
  const title = `Mobile Diesel Mechanics in ${state.name} | 24/7 Truck Repair | RIG`
  const description = `Truck down in ${state.name}? RIG dispatches the closest available diesel mechanic — coverage in ${cities.length} ${state.name} cities, avg ${stats.avgDispatchMin} min to dispatch. Call ${phone.display}, 24/7.`

  return (
    <DirectoryLayout
      title={title}
      description={description}
      path={`/${SEGMENT}/${state.code}/`}
      crumbs={[{ label: 'Semi Truck Repair', href: `/${SEGMENT}/` }, { label: state.name }]}
      phone={phone}
      footnote="Live stats from the RIG network, refreshed regularly."
    >
      <div className={s.pageHero}>
        <div className={s.segTabs}>
          <span className={s.segTabOn}>Semi / Big Truck</span>
        </div>
        <h1>Mobile Truck Repair in {state.name}</h1>
        <p className={s.sub}>
          24/7 diesel mechanics dispatched across {state.name} — pick your city or corridor, or just call.
        </p>
        <StatStrip
          stats={[
            { label: 'Mechanics in area', value: String(stats.mechanicsInArea), live: true },
            { label: 'Avg. time to arrive', value: `${stats.avgArrivalMin} min` },
            { label: 'Avg. dispatch', value: `${stats.avgDispatchMin} min` },
            { label: 'Jobs completed', value: `${stats.jobsCompleted.toLocaleString()}+` },
          ]}
        />
      </div>

      <DispatchBanner
        heading={`Broke down in ${state.name} right now?`}
        sub={`One call connects you to the closest available mechanic — avg ${stats.avgDispatchMin} min to dispatch.`}
      />

      <DispatchExplainer pageKey={`state/${state.code}`} placeName={state.name} />

      <div className={s.hubSection}>
        {corridors.length > 0 && (
          <>
            <div className={s.secTitle}>Interstate corridors in {state.name}</div>
            <div className={s.chipRow}>
              {corridors.map((c) => (
                <Link key={c.route} href={corridorPath(c.route, c.state)}>
                  <a className={s.chip}>
                    {c.routeDisplay} in {state.name}
                  </a>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className={s.secTitle}>Truck repair by city</div>
        <div className={s.linkGrid}>
          {cities.map((c) => (
            <Link key={c.citySlug} href={cityPath(c)}>
              <a className={s.linkCard}>{c.name}</a>
            </Link>
          ))}
        </div>
      </div>
    </DirectoryLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({
  // coverage gate: a state hub exists only if it has a covered city/corridor
  paths: Object.keys(STATES)
    .filter(isStateCovered)
    .map((code) => ({ params: { state: code } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const code = String(params?.state)
  const state = STATES[code]
  if (!state || !isStateCovered(code)) return { notFound: true }
  return {
    props: {
      state,
      cities: getCitiesByState(code)
        .filter((c) => isCityCovered(c.state, c.citySlug))
        .sort((a, b) => b.population - a.population),
      corridors: getCorridorsByState(code).filter((c) => isCorridorCovered(c.route, c.state)),
      stats: getStateStats(code),
    },
  }
}
