import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import DirectoryLayout from '../../../../components/directory/DirectoryLayout'
import StatStrip from '../../../../components/directory/StatStrip'
import DispatchBanner from '../../../../components/directory/DispatchBanner'
import ListingSection from '../../../../components/directory/ListingSection'
import s from '../../../../styles/Directory.module.scss'
import {
  SEGMENT,
  SITE_ORIGIN,
  DirectoryCity,
  DirectoryCorridor,
  CityStats,
  getCity,
  getCityStats,
  getCorridorsByState,
  getCorridorMeta,
  cityPath,
  statePath,
  corridorPath,
  servicePathCity,
} from '../../../../data/directory'
import {
  getMechanicsForCity,
  getProfile,
  getProfilePaths,
  getCityServiceKeys,
  hasCityService,
  isCorridorCovered,
  MechanicListing,
  MechanicProfile,
} from '../../../../data/directory/mechanics'
import { getPhoneForState } from '../../../../data/directory/statePhones'
import { DirectoryService, getService, servicePath } from '../../../../data/directory/services'

// This route serves TWO page types at /{state}/{city}/{slug}/:
//  - mechanic profiles (slug = name-slug with hash suffix)
//  - city x service pages (slug = a service slug from the ingestion-computed
//    cityServices program, e.g. "tire-change") — the geo+service landing
//    pages the ads data asked for. Service slugs never collide with mechanic
//    slugs (those always carry a hash suffix).
type Props =
  | { kind: 'profile'; profile: MechanicProfile; stateName: string; corridorsNearby: DirectoryCorridor[] }
  | {
      kind: 'cityService'
      service: DirectoryService
      city: DirectoryCity
      stats: CityStats
      mechanics: MechanicListing[]
      siblingServices: string[]
      nearbyWithService: DirectoryCity[]
    }

function CityServicePage({ service, city, stats, mechanics, siblingServices, nearbyWithService }: Extract<Props, { kind: 'cityService' }>) {
  const phone = getPhoneForState(city.state)
  const cityState = `${city.name}, ${city.state.toUpperCase()}`
  const fill = (t: string) => t.replace('{city}', cityState)
  const title = fill(service.cityTitle || `${service.name} in {city} | RIG`)
  const h1 = fill(service.cityH1 || `${service.name} in {city}`)
  const description = `${service.short} ${mechanics.length} mechanics offering ${service.name.toLowerCase()} in the ${city.name} area — dispatched 24/7. Call ${phone.display}.`

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: service.name,
      name: h1,
      provider: { '@type': 'Organization', name: 'RIG', url: SITE_ORIGIN, telephone: phone.tel.replace('tel:', '+') },
      areaServed: { '@type': 'City', name: city.name, address: { '@type': 'PostalAddress', addressRegion: city.state.toUpperCase() } },
      hoursAvailable: 'Mo-Su 00:00-24:00',
    },
  ]

  return (
    <DirectoryLayout
      title={title}
      description={description}
      path={servicePathCity(city.state, city.citySlug, service.slug)}
      crumbs={[
        { label: 'Semi Truck Repair', href: `/${SEGMENT}/` },
        { label: city.stateName, href: statePath(city.state) },
        { label: city.name, href: cityPath(city) },
        { label: service.name },
      ]}
      jsonLd={jsonLd}
      phone={phone}
      footnote="Live stats from the RIG network, refreshed regularly. Dispatch routes to the closest available RIG mechanic."
    >
      <div className={s.pageHero}>
        <div className={s.segTabs}>
          <span className={s.segTabOn}>Semi / Big Truck</span>
        </div>
        <h1>{h1}</h1>
        <p className={s.sub}>{service.heroSub}</p>
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
        heading={`Need ${service.name.toLowerCase()} in ${city.name} right now?`}
        sub={`One call sends your breakdown to local mechanics — avg ${stats.avgDispatchMin} min to dispatch, 24/7.`}
      />

      <ListingSection
        mechanics={mechanics}
        placeName={`${service.name.toLowerCase()} — ${city.name} area`}
        noteLead="How RIG works:"
        note={`for a breakdown, we dispatch the closest available mechanic offering ${service.name.toLowerCase()} — fastest wins.`}
      />

      <div className={s.prose}>
        <h2>What the mechanic does on site</h2>
        <p>{service.whatWeDo}</p>
        <h2>Roadside or shop?</h2>
        <p>{service.roadsideOrShop}</p>
      </div>

      <div className={s.hubSection}>
        <div className={s.secTitle}>More in {city.name}</div>
        <div className={s.chipRow}>
          <Link href={cityPath(city)}>
            <a className={s.chip}>All mechanics in {city.name} →</a>
          </Link>
          {siblingServices.map((slug) => {
            const svc = getService(slug)
            return svc ? (
              <Link key={slug} href={servicePathCity(city.state, city.citySlug, slug)}>
                <a className={s.chip}>{svc.name} in {city.name}</a>
              </Link>
            ) : null
          })}
          <Link href={servicePath(service.slug)}>
            <a className={s.chip}>{service.name} — nationwide</a>
          </Link>
        </div>
        {nearbyWithService.length > 0 && (
          <>
            <div className={s.secTitle}>{service.name} in other markets</div>
            <div className={s.linkGrid}>
              {nearbyWithService.map((c) => (
                <Link key={`${c.state}/${c.citySlug}`} href={servicePathCity(c.state, c.citySlug, service.slug)}>
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

export default function ShopOrCityServicePage(props: Props) {
  if (props.kind === 'cityService') return <CityServicePage {...props} />
  return <MechanicProfilePage {...props} />
}

function MechanicProfilePage({ profile, stateName, corridorsNearby }: Extract<Props, { kind: 'profile' }>) {
  const phone = getPhoneForState(profile.homeState)
  const path = `/${SEGMENT}/${profile.homeState}/${profile.homeCitySlug}/${profile.profilePath!.split('/').filter(Boolean).pop()}/`
  const cityState = `${profile.homeCityName}, ${profile.homeState.toUpperCase()}`
  const title = `${profile.name} — Truck Repair in ${cityState} | RIG`
  const description = `${profile.name}: ${profile.services.join(', ').toLowerCase()} in the ${profile.homeCityName} area.${
    profile.ratingCount > 0
      ? ` 👍 ${profile.thumbsUpPct}% satisfied (${profile.ratingCount} ratings), ${profile.jobsCompleted} jobs completed.`
      : ''
  } ${profile.rigNetwork ? `Dispatch via RIG: ${phone.display}.` : 'Listed shop.'}`

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'AutoRepair',
      name: profile.name,
      areaServed: { '@type': 'City', name: profile.homeCityName, address: { '@type': 'PostalAddress', addressRegion: profile.homeState.toUpperCase() } },
      ...(profile.directPhone ? { telephone: profile.directPhone } : {}),
      ...(profile.open247 ? { openingHours: 'Mo-Su 00:00-24:00' } : {}),
      parentOrganization: profile.rigNetwork ? { '@type': 'Organization', name: 'RIG', url: SITE_ORIGIN } : undefined,
    },
  ]

  return (
    <DirectoryLayout
      title={title}
      description={description}
      path={path}
      crumbs={[
        { label: 'Semi Truck Repair', href: `/${SEGMENT}/` },
        { label: stateName, href: statePath(profile.homeState) },
        { label: profile.homeCityName, href: cityPath({ state: profile.homeState, citySlug: profile.homeCitySlug }) },
        { label: profile.name },
      ]}
      jsonLd={jsonLd}
      phone={phone}
      footnote={
        profile.rigNetwork
          ? 'Stats from completed RIG jobs. For a breakdown, dispatch routes the closest available mechanic — which may be this one.'
          : "Business details shown for completeness, including the shop's own contact line. For a breakdown, dispatch to the closest available mechanic is fastest."
      }
    >
      <div className={s.pageHero}>
        <div className={s.segTabs}>
          {profile.rigNetwork ? <span className={s.tagRig}>RIG network</span> : <span className={s.tagListed}>Listed shop</span>}
          {profile.insured && <span className={s.tagVerified}>✓ Insured</span>}
          {profile.open247 && <span className={s.tagVerified}>Open 24/7</span>}
          {profile.memberSince && <span className={s.tagListed}>On RIG since {profile.memberSince}</span>}
        </div>
        <h1>{profile.name}</h1>
        <p className={s.sub}>
          Heavy-duty truck repair · {cityState} area
          {profile.rigNetwork ? ' · dispatchable through RIG' : ''}
          {profile.avgResponseMin ? ` · responds to dispatch in ~${profile.avgResponseMin} min` : ''}
        </p>
        <StatStrip
          stats={
            profile.ratingCount > 0
              ? [
                  { label: 'Thumbs up', value: `👍 ${profile.thumbsUpPct}%`, note: `${profile.ratingCount} ratings` },
                  { label: 'Jobs completed', value: String(profile.jobsCompleted) },
                  { label: 'Fix rate', value: `${profile.fixRatePct}%` },
                  { label: 'On time', value: `${profile.onTimePct}%` },
                ]
              : [
                  { label: 'Jobs completed', value: profile.jobsCompleted > 0 ? String(profile.jobsCompleted) : 'New to RIG' },
                  { label: 'Ratings', value: 'None yet' },
                  { label: 'Availability', value: profile.open247 ? '24/7' : 'Business hrs' },
                  { label: 'Dispatch', value: 'Via RIG' },
                ]
          }
        />
      </div>

      <DispatchBanner
        heading={profile.rigNetwork ? `Want ${profile.name} on the job?` : 'Broke down now?'}
        sub={
          profile.rigNetwork
            ? 'RIG dispatches the closest available mechanic — call and we route your breakdown, fastest wins.'
            : 'RIG dispatches the closest available mechanic from the network — usually the fastest way back on the road.'
        }
      />

      <div className={s.prose}>
        <h2>Services</h2>
        <div className={s.svc} style={{ marginTop: 8 }}>
          {profile.services.map((svc) => (
            <span key={svc}>{svc}</span>
          ))}
        </div>

        {(profile.hourlyRate || profile.calloutTerms) && (
          <>
            <h2>Rates &amp; call-out</h2>
            {profile.hourlyRate && (
              <p>
                <b>${profile.hourlyRate}/hr</b> standard
                {profile.afterHoursRate ? (
                  <>
                    {' '}
                    · <b>${profile.afterHoursRate}/hr</b> after hours
                  </>
                ) : null}
              </p>
            )}
            {profile.calloutTerms && (
              <div className={s.hiwCallout}>
                <b>Call-out fee includes:</b>{' '}
                {[
                  profile.calloutTerms.diagnosisIncluded && 'diagnosis',
                  profile.calloutTerms.mileageIncluded && 'mileage / drive time',
                  profile.calloutTerms.laborIncluded &&
                    `labor${profile.calloutTerms.hoursIncluded ? ` (first ${profile.calloutTerms.hoursIncluded} hr)` : ''}`,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'terms provided with the bid'}
                . The call-out fee is the industry-standard charge to come to you — every RIG bid shows it upfront.
              </div>
            )}
          </>
        )}

        {profile.makesServiced && profile.makesServiced.length > 0 && (
          <>
            <h2>Previous jobs</h2>
            <div className={s.svc} style={{ marginTop: 8 }}>
              {profile.makesServiced.map((make) => (
                <span key={make}>{make}</span>
              ))}
            </div>
          </>
        )}

        <h2>Details</h2>
        <p>
          Based in the {profile.homeCityName} area · {profile.open247 ? 'Open 24/7' : 'Business hours'}
          {profile.serviceRadiusMi ? ` · serves a ~${profile.serviceRadiusMi} mi radius` : ''}
          {profile.directPhone ? (
            <>
              {' '}
              · direct line:{' '}
              <a href={`tel:${profile.directPhone.replace(/\D/g, '')}`} style={{ fontWeight: 700, textDecoration: 'underline' }}>
                {profile.directPhone}
              </a>
            </>
          ) : null}
        </p>
        <p>
          {profile.rigNetwork
            ? profile.ratingCount > 0
              ? `${profile.name} is part of the RIG network: ${profile.jobsCompleted} completed jobs, ${profile.thumbsUpPct}% thumbs-up across ${profile.ratingCount} ratings, fixing ${profile.fixRatePct}% of jobs on site and arriving on time ${profile.onTimePct}% of the time.`
              : `${profile.name} is part of the RIG network and dispatches through RIG. Ratings and job stats appear here as they complete dispatched work.`
            : `${profile.name} is listed for completeness. For an active breakdown, RIG dispatch finds the closest available network mechanic.`}
        </p>
      </div>

      <div className={s.hubSection}>
        <div className={s.secTitle}>More in the area</div>
        <div className={s.chipRow}>
          <Link href={cityPath({ state: profile.homeState, citySlug: profile.homeCitySlug })}>
            <a className={s.chip}>All mechanics in {profile.homeCityName} →</a>
          </Link>
          {corridorsNearby.map((c) => (
            <Link key={c.route} href={corridorPath(c.route, c.state)}>
              <a className={s.chip}>
                {c.routeDisplay} in {stateName}
              </a>
            </Link>
          ))}
        </div>
      </div>
    </DirectoryLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({
  // real mode: every profile + every city-service page prerendered (from
  // mechanics.json). Mock mode: none prerendered — fallback renders on
  // demand so ~10k fake pages don't bloat the build.
  paths: [
    ...getProfilePaths().map(({ state, city, shop }) => ({ params: { state, city, shop } })),
    ...getCityServiceKeys().map((k) => {
      const [state, city, shop] = k.split('/')
      return { params: { state, city, shop } }
    }),
  ],
  fallback: 'blocking',
})

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const state = String(params?.state)
  const citySlug = String(params?.city)
  const shopSlug = String(params?.shop)
  const city = getCity(state, citySlug)
  if (!city) return { notFound: true }

  // city x service page?
  if (hasCityService(state, citySlug, shopSlug)) {
    const service = getService(shopSlug)
    if (!service) return { notFound: true }
    const label = { tire_change: 'Tire change', tow_service: 'Towing', mobile_service: 'Mobile repair', maintenance_change: 'Maintenance' }[service.dbType]
    const mechanics = getMechanicsForCity(state, citySlug, city.name).filter((m) => m.services.includes(label))
    const siblingServices = getCityServiceKeys()
      .filter((k) => k.startsWith(`${state}/${citySlug}/`))
      .map((k) => k.split('/')[2])
      .filter((slug) => slug !== shopSlug)
    const nearbyWithService = getCityServiceKeys()
      .filter((k) => k.endsWith(`/${shopSlug}`) && !k.startsWith(`${state}/${citySlug}/`))
      .map((k) => {
        const [st, ct] = k.split('/')
        return getCity(st, ct)
      })
      .filter((c): c is DirectoryCity => Boolean(c))
      .slice(0, 12)
    return {
      props: {
        kind: 'cityService' as const,
        service,
        city,
        stats: getCityStats(state, citySlug),
        mechanics,
        siblingServices,
        nearbyWithService,
      },
    }
  }

  const profile = getProfile(state, citySlug, shopSlug)
  if (!profile) return { notFound: true }

  const corridorsNearby = getCorridorsByState(state)
    .filter((c) => isCorridorCovered(c.route, c.state))
    .filter((c) => getCorridorMeta(c.route, c.state)?.citiesAlong.includes(citySlug))

  return { props: { kind: 'profile' as const, profile, stateName: city.stateName, corridorsNearby } }
}
