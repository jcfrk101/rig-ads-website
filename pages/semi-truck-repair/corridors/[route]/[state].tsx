import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import DirectoryLayout from '../../../../components/directory/DirectoryLayout'
import StatStrip from '../../../../components/directory/StatStrip'
import DispatchBanner from '../../../../components/directory/DispatchBanner'
import ListingSection from '../../../../components/directory/ListingSection'
import s from '../../../../styles/Directory.module.scss'
import {
  CORRIDORS,
  SEGMENT,
  SITE_ORIGIN,
  DISPATCH_PHONE_DISPLAY,
  DirectoryCity,
  DirectoryCorridor,
  CorridorStats,
  CorridorMeta,
  getCorridor,
  getCorridorMeta,
  getCorridorsByRoute,
  getCorridorStats,
  getCity,
  cityPath,
  corridorPath,
  routePath,
  statePath,
} from '../../../../data/directory'
import {
  getMechanicsForCorridor,
  isCityCovered,
  isCorridorCovered,
  MechanicListing,
} from '../../../../data/directory/mechanics'

interface Props {
  corridor: DirectoryCorridor
  stats: CorridorStats
  meta: CorridorMeta | null
  mechanics: MechanicListing[]
  citiesAlong: DirectoryCity[]
  otherStates: DirectoryCorridor[]
  prevState: DirectoryCorridor | null
  nextState: DirectoryCorridor | null
}

export default function CorridorStatePage({ corridor, stats, meta, mechanics, citiesAlong, otherStates, prevState, nextState }: Props) {
  const path = corridorPath(corridor.route, corridor.state)
  const rd = corridor.routeDisplay
  const title = `${rd} Truck Breakdown in ${corridor.stateName}? Mobile Repair & Dispatch | RIG`
  const description = `Broke down on ${rd} in ${corridor.stateName}? RIG dispatches the closest available diesel mechanic to your mile marker — ${stats.mechanicsCovering} covering this corridor, avg ${stats.avgReachMin} min reach. Call ${DISPATCH_PHONE_DISPLAY}, 24/7.`

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Mobile semi truck repair — interstate corridor coverage',
      provider: { '@type': 'Organization', name: 'RIG', url: SITE_ORIGIN, telephone: '+18557442223' },
      areaServed: { '@type': 'State', name: corridor.stateName },
      hoursAvailable: 'Mo-Su 00:00-24:00',
    },
  ]

  return (
    <DirectoryLayout
      title={title}
      description={description}
      path={path}
      crumbs={[
        { label: 'Semi Truck Repair', href: `/${SEGMENT}/` },
        { label: 'Corridors', href: `/${SEGMENT}/corridors/` },
        { label: rd, href: routePath(corridor.route) },
        { label: corridor.stateName },
      ]}
      jsonLd={jsonLd}
      footnote={`Corridor coverage along ${rd} in ${corridor.stateName}. Rural response times run longer; RIG routes the nearest available mechanic to your mile marker.`}
    >
      <div className={s.corridorStrip}>
        <span className={s.shield}>{rd}</span>
        <span>
          {corridor.stateName}
          {meta ? ` · ${meta.endpoints}` : ''}
        </span>
        {meta && <span className={s.corridorMuted}>≈{meta.approxMiles} miles</span>}
        <div className={s.corridorNav}>
          {prevState && (
            <Link href={corridorPath(corridor.route, prevState.state)}>
              <a>← {rd} {prevState.state.toUpperCase()}</a>
            </Link>
          )}
          {nextState && (
            <Link href={corridorPath(corridor.route, nextState.state)}>
              <a>{rd} {nextState.state.toUpperCase()} →</a>
            </Link>
          )}
        </div>
      </div>

      <div className={s.pageHero} style={{ borderTop: '1px solid #dfe4e8', marginTop: 16 }}>
        <h1>
          Truck Breakdown on {rd} in {corridor.stateName}?
        </h1>
        <p className={s.sub}>
          Closest mobile mechanic dispatched fast to {rd} anywhere in {corridor.stateName}. Give us your exit or
          mile marker — we route the nearest available RIG mechanic to your location.
        </p>
        <StatStrip
          stats={[
            { label: 'Covering this corridor', value: String(stats.mechanicsCovering), live: true },
            { label: 'Avg. reach time', value: `${stats.avgReachMin} min` },
            { label: 'Cities on this stretch', value: String(citiesAlong.length || '—') },
            { label: 'Availability', value: '24/7' },
          ]}
        />
      </div>

      <DispatchBanner
        heading="Give us your mile marker — we'll find the closest help."
        sub={`${rd} coverage across ${corridor.stateName}. Call and we dispatch the nearest mechanic to your exact location.`}
      />

      <ListingSection
        mechanics={mechanics}
        placeName={`${rd} in ${corridor.stateName}`}
        noteLead="On a corridor, distance is everything."
        note="RIG dispatches the closest available mechanic to your mile marker — there's no faster option on the interstate."
      />

      {meta && (
        <div className={s.prose}>
          <h2>
            About {rd} in {corridor.stateName}
          </h2>
          <p>{meta.description}</p>
          {meta.majorJunctions.length > 0 && <p>Major junctions: {meta.majorJunctions.join(' · ')}</p>}
        </div>
      )}

      <div className={s.hubSection}>
        {citiesAlong.length > 0 && (
          <>
            <div className={s.secTitle}>Truck repair in cities along {rd}</div>
            <div className={s.linkGrid}>
              {citiesAlong.map((c) => (
                <Link key={c.citySlug} href={cityPath(c)}>
                  <a className={s.linkCard}>
                    {c.name} <small>{c.state.toUpperCase()}</small>
                  </a>
                </Link>
              ))}
            </div>
          </>
        )}
        {otherStates.length > 0 && (
          <>
            <div className={s.secTitle}>{rd} in other states</div>
            <div className={s.chipRow}>
              {otherStates.map((c) => (
                <Link key={c.state} href={corridorPath(c.route, c.state)}>
                  <a className={s.chip}>
                    {rd} in {c.stateName}
                  </a>
                </Link>
              ))}
            </div>
          </>
        )}
        <div className={s.secTitle} style={{ marginTop: 20 }}>
          All of {corridor.stateName}
        </div>
        <div className={s.chipRow}>
          <Link href={statePath(corridor.state)}>
            <a className={s.chip}>Semi truck repair in {corridor.stateName} →</a>
          </Link>
        </div>
      </div>
    </DirectoryLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({
  // coverage gate: corridor segments with 0 mechanics don't get pages
  paths: CORRIDORS.filter((c) => isCorridorCovered(c.route, c.state)).map((c) => ({
    params: { route: c.route, state: c.state },
  })),
  fallback: false,
})

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const route = String(params?.route)
  const state = String(params?.state)
  const corridor = getCorridor(route, state)
  if (!corridor || !isCorridorCovered(route, state)) return { notFound: true }

  const meta = getCorridorMeta(route, state)
  const citiesAlong = (meta?.citiesAlong || [])
    .map((slug) => getCity(state, slug))
    .filter((c): c is DirectoryCity => Boolean(c) && isCityCovered(c!.state, c!.citySlug))
  const otherStates = getCorridorsByRoute(route).filter(
    (c) => c.state !== state && isCorridorCovered(c.route, c.state)
  )
  const coveredNeighbor = (code: string | null | undefined) => {
    if (!code || !isCorridorCovered(route, code)) return null
    return getCorridor(route, code) || null
  }
  const prevState = coveredNeighbor(meta?.neighbors.prev)
  const nextState = coveredNeighbor(meta?.neighbors.next)

  return {
    props: {
      corridor,
      stats: getCorridorStats(route, state),
      meta,
      mechanics: getMechanicsForCorridor(route, state, corridor.stateName),
      citiesAlong,
      otherStates,
      prevState,
      nextState,
    },
  }
}
