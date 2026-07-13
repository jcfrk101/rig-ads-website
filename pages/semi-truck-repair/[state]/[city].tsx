import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import DirectoryLayout from '../../../components/directory/DirectoryLayout'
import StatStrip from '../../../components/directory/StatStrip'
import DispatchBanner from '../../../components/directory/DispatchBanner'
import ListingSection from '../../../components/directory/ListingSection'
import s from '../../../styles/Directory.module.scss'
import {
  CITIES,
  SEGMENT,
  SITE_ORIGIN,
  DISPATCH_PHONE_DISPLAY,
  DirectoryCity,
  DirectoryCorridor,
  CityStats,
  getCity,
  getCitiesByState,
  getCorridorsByState,
  getCityStats,
  getCorridorMeta,
  cityPath,
  statePath,
  corridorPath,
} from '../../../data/directory'
import { getMechanicsForCity, MechanicListing } from '../../../data/directory/mechanics'

interface Props {
  city: DirectoryCity
  stats: CityStats
  mechanics: MechanicListing[]
  corridorsThrough: DirectoryCorridor[] // corridors whose citiesAlong include this city
  corridorsInState: DirectoryCorridor[]
  nearbyCities: DirectoryCity[]
}

export default function CityPage({ city, stats, mechanics, corridorsThrough, corridorsInState, nearbyCities }: Props) {
  const path = cityPath(city)
  const cityState = `${city.name}, ${city.state.toUpperCase()}`
  const corridorNames = corridorsThrough.map((c) => c.routeDisplay)
  const corridorPhrase =
    corridorNames.length > 0
      ? ` and the nearby ${corridorNames.slice(0, 3).join(', ')} ${corridorNames.length > 1 ? 'corridors' : 'corridor'}`
      : ''

  const title = `Mobile Semi Truck Repair in ${cityState} | 24/7 Dispatch | RIG`
  const description = `Truck down in ${city.name}? RIG dispatches the closest available diesel mechanic — ${stats.mechanicsActive} active in the ${city.name} area, avg ${stats.avgDispatchMin} min to dispatch. Call ${DISPATCH_PHONE_DISPLAY}, 24/7.`

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Mobile semi truck repair',
      provider: { '@type': 'Organization', name: 'RIG', url: SITE_ORIGIN, telephone: '+18557442223' },
      areaServed: { '@type': 'City', name: city.name, address: { '@type': 'PostalAddress', addressRegion: city.state.toUpperCase() } },
      availableChannel: { '@type': 'ServiceChannel', servicePhone: '+18557442223' },
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
        { label: city.stateName, href: statePath(city.state) },
        { label: city.name },
      ]}
      jsonLd={jsonLd}
      footnote="Live stats from the RIG network, refreshed regularly. Listed shops shown for completeness; dispatch routes to the closest available RIG mechanic."
    >
      <div className={s.pageHero}>
        <div className={s.segTabs}>
          <span className={s.segTabOn}>Semi / Big Truck</span>
        </div>
        <h1>Mobile Truck Repair in {cityState}</h1>
        <p className={s.sub}>
          24/7 diesel mechanics dispatched to you across the {city.name} area{corridorPhrase}.
        </p>
        <StatStrip
          stats={[
            { label: 'Mechanics active now', value: String(stats.mechanicsActive), live: true },
            { label: 'Avg. time to arrive', value: `${stats.avgArrivalMin} min` },
            { label: 'Avg. dispatch', value: `${stats.avgDispatchMin} min` },
            { label: 'Jobs completed here', value: `${stats.jobsCompleted.toLocaleString()}+` },
          ]}
        />
      </div>

      <DispatchBanner
        heading={`Broke down in ${city.name} right now?`}
        sub={`One call connects you to the closest available mechanic — avg ${stats.avgDispatchMin} min to dispatch.`}
      />

      <ListingSection
        mechanics={mechanics}
        placeName={`${city.name} area`}
        noteLead="How RIG works:"
        note="for a breakdown, we dispatch the closest available mechanic — fastest wins. You can also browse shops below and call any of them directly."
      />

      <div className={s.prose}>
        <h2>Semi truck repair in {city.name}</h2>
        <p>
          RIG covers {city.name} and the surrounding {city.stateName} area with mobile diesel mechanics for
          roadside breakdowns: engine diagnostics, air brakes, tires, electrical, cooling, DPF/regen issues, and
          trailer repair. For a truck that won&apos;t roll, dispatch beats searching — we route the nearest
          available mechanic to your location{corridorNames.length > 0 ? `, including on ${corridorNames.join(' and ')}` : ''}.
        </p>
      </div>

      <div className={s.hubSection}>
        {corridorsInState.length > 0 && (
          <>
            <div className={s.secTitle}>Interstate corridors in {city.stateName}</div>
            <div className={s.chipRow}>
              {corridorsInState.map((c) => (
                <Link key={c.route} href={corridorPath(c.route, c.state)}>
                  <a className={s.chip}>
                    {c.routeDisplay} in {city.stateName}
                  </a>
                </Link>
              ))}
            </div>
          </>
        )}
        {nearbyCities.length > 0 && (
          <>
            <div className={s.secTitle}>Truck repair in nearby cities</div>
            <div className={s.linkGrid}>
              {nearbyCities.map((c) => (
                <Link key={c.citySlug} href={cityPath(c)}>
                  <a className={s.linkCard}>
                    {c.name} <small>{c.state.toUpperCase()}</small>
                  </a>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </DirectoryLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: CITIES.map((c) => ({ params: { state: c.state, city: c.citySlug } })),
  fallback: false,
})

const distSq = (a: DirectoryCity, b: DirectoryCity) => {
  const dx = (a.lng - b.lng) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180))
  const dy = a.lat - b.lat
  return dx * dx + dy * dy
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const state = String(params?.state)
  const citySlug = String(params?.city)
  const city = getCity(state, citySlug)
  if (!city) return { notFound: true }

  const corridorsInState = getCorridorsByState(state)
  const corridorsThrough = corridorsInState.filter((c) =>
    getCorridorMeta(c.route, c.state)?.citiesAlong.includes(citySlug)
  )
  const nearbyCities = getCitiesByState(state)
    .filter((c) => c.citySlug !== citySlug)
    .sort((a, b) => distSq(a, city) - distSq(b, city))
    .slice(0, 8)

  return {
    props: {
      city,
      stats: getCityStats(state, citySlug),
      mechanics: getMechanicsForCity(state, citySlug, city.name),
      corridorsThrough,
      corridorsInState,
      nearbyCities,
    },
  }
}
