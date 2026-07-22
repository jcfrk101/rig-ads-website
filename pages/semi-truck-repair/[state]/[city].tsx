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
  servicePathCity,
  DIESEL_ONLY_BLURB,
} from '../../../data/directory'
import { getPhoneForState } from '../../../data/directory/statePhones'
import {
  getMechanicsForCity,
  cityServicesForCity,
  isCityCovered,
  isCorridorCovered,
  MechanicListing,
} from '../../../data/directory/mechanics'

import { getService } from '../../../data/directory/services'

interface Props {
  city: DirectoryCity
  stats: CityStats
  mechanics: MechanicListing[]
  corridorsThrough: DirectoryCorridor[] // corridors whose citiesAlong include this city
  corridorsInState: DirectoryCorridor[]
  nearbyCities: DirectoryCity[]
  cityServiceSlugs: string[]
}

export default function CityPage({ city, stats, mechanics, corridorsThrough, corridorsInState, nearbyCities, cityServiceSlugs }: Props) {
  const path = cityPath(city)
  const phone = getPhoneForState(city.state)
  const cityState = `${city.name}, ${city.state.toUpperCase()}`
  const corridorNames = corridorsThrough.map((c) => c.routeDisplay)
  const corridorPhrase =
    corridorNames.length > 0
      ? ` and the nearby ${corridorNames.slice(0, 3).join(', ')} ${corridorNames.length > 1 ? 'corridors' : 'corridor'}`
      : ''

  const title = `Mobile Diesel Mechanic in ${cityState} | 24/7 Truck Repair | RIG`
  const description = `Truck down in ${city.name}? RIG dispatches the closest available diesel mechanic — ${stats.mechanicsInArea} in the ${city.name} area, avg ${stats.avgDispatchMin} min to dispatch. Call ${phone.display}, 24/7.`

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Mobile semi truck repair',
      provider: { '@type': 'Organization', name: 'RIG', url: SITE_ORIGIN, telephone: phone.tel.replace('tel:', '+') },
      areaServed: { '@type': 'City', name: city.name, address: { '@type': 'PostalAddress', addressRegion: city.state.toUpperCase() } },
      availableChannel: { '@type': 'ServiceChannel', servicePhone: phone.tel.replace('tel:', '+') },
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
      phone={phone}
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
            { label: 'Mechanics in area', value: String(stats.mechanicsInArea), live: true },
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
          trailer repair. For a truck that won&apos;t roll, dispatch beats searching — one call sends your
          breakdown to local mechanics who bid back in minutes with rates and ETAs
          {corridorNames.length > 0 ? `, including on ${corridorNames.join(' and ')}` : ''}.{' '}
          <Link href={`/${SEGMENT}/how-it-works/`}>
            <a style={{ fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>
              See how RIG dispatch works
            </a>
          </Link>
          .
        </p>
        <p>{DIESEL_ONLY_BLURB}</p>
      </div>

      <div className={s.hubSection}>
        {cityServiceSlugs.length > 0 && (
          <>
            <div className={s.secTitle}>Services in {city.name}</div>
            <div className={s.chipRow}>
              {cityServiceSlugs.map((slug) => {
                const svc = getService(slug)
                return svc ? (
                  <Link key={slug} href={servicePathCity(city.state, city.citySlug, slug)}>
                    <a className={s.chip}>
                      {svc.name} in {city.name}
                    </a>
                  </Link>
                ) : null
              })}
            </div>
          </>
        )}
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
  // coverage gate: cities with 0 mechanics don't get pages
  paths: CITIES.filter((c) => isCityCovered(c.state, c.citySlug)).map((c) => ({
    params: { state: c.state, city: c.citySlug },
  })),
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

  const corridorsInState = getCorridorsByState(state).filter((c) => isCorridorCovered(c.route, c.state))
  const corridorsThrough = corridorsInState.filter((c) =>
    getCorridorMeta(c.route, c.state)?.citiesAlong.includes(citySlug)
  )
  const nearbyCities = getCitiesByState(state)
    .filter((c) => c.citySlug !== citySlug && isCityCovered(c.state, c.citySlug))
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
      cityServiceSlugs: cityServicesForCity(state, citySlug),
    },
  }
}
