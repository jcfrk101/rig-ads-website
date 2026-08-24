import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import DirectoryLayout from '../../../components/directory/DirectoryLayout'
import StatStack from '../../../components/rv/StatStack'
import ChatCta from '../../../components/rv/ChatCta'
import useAdPlace from '../../../components/directory/useAdPlace'
import WorkFeedStrip from '../../../components/directory/WorkFeedStrip'
import { FeedItem, fetchStateFeed } from '../../../data/feed'
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
import { getPhoneForState, SEO_PHONE } from '../../../data/directory/statePhones'

interface Props {
  state: StateInfo
  cities: DirectoryCity[]
  corridors: DirectoryCorridor[]
  stats: CityStats
  feed: { items: FeedItem[]; scope: 'state' | 'network' }
}

export default function StateHub({ state, cities, corridors, stats, feed }: Props) {
  const phone = getPhoneForState(state.code)
  // Ad clicks carry ValueTrack location IDs (campaign final-URL suffix);
  // resolve to a city and, when the directory covers it, point there.
  const adPlace = useAdPlace()
  const adCity = adPlace ? cities.find((c) => c.name.toLowerCase() === adPlace.name.toLowerCase()) || null : null
  const title = `Mobile Diesel Mechanics in ${state.name} | 24/7 Truck Repair | RIG`
  const description = `Truck down in ${state.name}? RIG dispatches the closest available diesel mechanic — coverage in ${cities.length} ${state.name} cities, avg ${stats.avgDispatchMin} min to dispatch. Call ${SEO_PHONE.display}, 24/7.`

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
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 360px', minWidth: 300 }}>
            <h1>Mobile Truck Repair {adPlace ? `near ${adPlace.name}, ${adPlace.state.toUpperCase()}` : `in ${state.name}`}</h1>
            <p className={s.sub}>
              Broke down or derated? Describe the problem once — nearby diesel mechanics bid back with a rate and
              an ETA in minutes, you pick one, they roll to you. 24/7 across {state.name}.
            </p>
            <ChatCta placeholder={`Describe the problem — e.g. "derated on the interstate, check engine light, can't get above 5 mph"`} />
            {adCity && (
              <p style={{ marginTop: 12, fontSize: 14 }}>
                Your area:{' '}
                <Link href={cityPath(adCity)}>
                  <a style={{ fontWeight: 700 }}>Mechanics in {adCity.name} →</a>
                </Link>
              </p>
            )}
          </div>
          <StatStack
            stats={[
              { label: `Mechanics in ${state.name}`, value: `${stats.mechanicsInArea.toLocaleString()}+`, live: true },
              { label: 'Avg. dispatch', value: `${stats.avgDispatchMin} min` },
              { label: 'Avg. time to arrive', value: `${stats.avgArrivalMin} min` },
              { label: 'Jobs completed', value: `${stats.jobsCompleted.toLocaleString()}+` },
            ]}
          />
        </div>
      </div>

      <DispatchBanner
        heading={`Broke down in ${state.name} right now?`}
        sub={`A chat or a call connects you to the closest available mechanic — avg ${stats.avgDispatchMin} min to dispatch.`}
      />

      <DispatchExplainer pageKey={`state/${state.code}`} placeName={state.name} />

      <WorkFeedStrip items={feed.items} scope={feed.scope} placeName={state.name} />

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
      feed: await fetchStateFeed(code.toUpperCase()),
    },
  }
}
