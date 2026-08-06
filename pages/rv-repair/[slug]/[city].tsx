import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import RvLayout from '../../../components/rv/RvLayout'
import ChatCta from '../../../components/rv/ChatCta'
import StatStrip from '../../../components/directory/StatStrip'
import s from '../../../styles/Directory.module.scss'
import { SITE_ORIGIN, DirectoryCity, CityStats, getCity, getCitiesByState } from '../../../data/directory'
import { isCityCovered } from '../../../data/directory/mechanics'
import { getPhoneForState, SEO_PHONE, PagePhone } from '../../../data/directory/statePhones'
import {
  RV_SEGMENT,
  rvCoveredCities,
  rvProblemPath,
  rvStatePath,
  rvCityPath,
  getCityStats,
} from '../../../data/rv'
import { RV_PROBLEMS } from '../../../data/rv/problems'

// City page: /rv-repair/{state}/{city}/ — the "mobile rv repair {city}" geo
// long-tail. Content + chat, real area stats, no listings pretense.
interface Props {
  city: DirectoryCity
  stats: CityStats
  nearby: DirectoryCity[]
  phone: PagePhone
}

const distSq = (a: DirectoryCity, b: DirectoryCity) => {
  const dx = (a.lng - b.lng) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180))
  const dy = a.lat - b.lat
  return dx * dx + dy * dy
}

export default function RvCityPage({ city, stats, nearby, phone }: Props) {
  const cityState = `${city.name}, ${city.state.toUpperCase()}`
  const title = `Mobile RV Repair in ${cityState} | Fast Dispatch | RIG`
  const description = `RV trouble near ${city.name}? RIG dispatches mobile mechanics to your rig — roadside or campsite. ${stats.mechanicsInArea} mechanics in the ${city.name} area, avg ${stats.avgDispatchMin} min to dispatch. Chat or call ${SEO_PHONE.display}.`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Mobile RV repair',
      provider: { '@type': 'Organization', name: 'RIG', url: SITE_ORIGIN, telephone: SEO_PHONE.tel.replace('tel:', '+') },
      areaServed: { '@type': 'City', name: city.name, address: { '@type': 'PostalAddress', addressRegion: city.state.toUpperCase() } },
      hoursAvailable: 'Mo-Su 00:00-24:00',
    },
  ]

  return (
    <RvLayout
      title={title}
      description={description}
      path={rvCityPath(city.state, city.citySlug)}
      crumbs={[
        { label: 'RV Repair', href: `/${RV_SEGMENT}/` },
        { label: city.stateName, href: rvStatePath(city.state) },
        { label: city.name },
      ]}
      jsonLd={jsonLd}
      phone={phone}
      footnote="Live stats from the RIG network, refreshed regularly. Gas or diesel — coverage and specialties vary by mechanic and area; chat confirms what's available near you before anyone rolls."
    >
      <div className={s.pageHero}>
        <div className={s.segTabs}>
          <span className={s.segTabOn}>RV / Motorhome</span>
        </div>
        <h1>Mobile RV Repair in {cityState}</h1>
        <p className={s.sub}>
          Rig down near {city.name}? Mechanics come to you — highway shoulder, campground, or driveway.
          Describe the problem once and nearby mechanics bid back in minutes with rates and ETAs.
        </p>
        <StatStrip
          stats={[
            { label: 'Mechanics in area', value: String(stats.mechanicsInArea), live: true },
            { label: 'Avg. dispatch', value: `${stats.avgDispatchMin} min` },
            { label: 'Avg. time to arrive', value: `${stats.avgArrivalMin} min` },
            { label: 'Availability', value: '24/7' },
          ]}
        />
        <ChatCta placeholder={`Describe the problem — e.g. "broke down near ${city.name}"`} />
      </div>

      <div className={s.prose}>
        <h2>RV breakdown help in the {city.name} area</h2>
        <p>
          The {city.name} area has {stats.mechanicsInArea} mechanics in the RIG network. Gas or diesel,
          motorhome or towable — the systems that strand RVs are tires and blowouts, brakes, engine and
          cooling problems, batteries and charging, generators, and that&apos;s the daily work of this
          network. Specialties vary by mechanic, so one conversation with dispatch puts your breakdown in
          front of the ones actually available right now — you compare real rates and ETAs instead of
          calling shops from the shoulder. Most problems get fixed where the rig sits, and your trip loses
          hours instead of days.
        </p>
      </div>

      <div className={s.hubSection}>
        <div className={s.secTitle}>What&apos;s wrong with the rig?</div>
        <div className={s.chipRow}>
          {RV_PROBLEMS.map((p) => (
            <Link key={p.slug} href={rvProblemPath(p.slug)}>
              <a className={s.chip}>{p.name}</a>
            </Link>
          ))}
        </div>

        {nearby.length > 0 && (
          <>
            <div className={s.secTitle}>RV repair in nearby cities</div>
            <div className={s.linkGrid}>
              {nearby.map((c) => (
                <Link key={c.citySlug} href={rvCityPath(c.state, c.citySlug)}>
                  <a className={s.linkCard}>{c.name}</a>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </RvLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: rvCoveredCities().map((c) => ({ params: { slug: c.state, city: c.citySlug } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const state = String(params?.slug)
  const citySlug = String(params?.city)
  const city = getCity(state, citySlug)
  if (!city || !isCityCovered(state, citySlug)) return { notFound: true }

  const nearby = getCitiesByState(state)
    .filter((c) => c.citySlug !== citySlug && isCityCovered(c.state, c.citySlug))
    .sort((a, b) => distSq(a, city) - distSq(b, city))
    .slice(0, 8)

  return {
    props: {
      city,
      stats: getCityStats(state, citySlug),
      nearby,
      phone: getPhoneForState(state),
    },
  }
}
