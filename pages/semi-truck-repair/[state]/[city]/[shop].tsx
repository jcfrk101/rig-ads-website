import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import DirectoryLayout from '../../../../components/directory/DirectoryLayout'
import StatStrip from '../../../../components/directory/StatStrip'
import DispatchBanner from '../../../../components/directory/DispatchBanner'
import s from '../../../../styles/Directory.module.scss'
import {
  SEGMENT,
  SITE_ORIGIN,
  DirectoryCorridor,
  getCity,
  getCorridorsByState,
  getCorridorMeta,
  cityPath,
  statePath,
  corridorPath,
} from '../../../../data/directory'
import {
  getProfile,
  getProfilePaths,
  isCorridorCovered,
  MechanicProfile,
} from '../../../../data/directory/mechanics'
import { getPhoneForState } from '../../../../data/directory/statePhones'

interface Props {
  profile: MechanicProfile
  stateName: string
  corridorsNearby: DirectoryCorridor[]
}

export default function MechanicProfilePage({ profile, stateName, corridorsNearby }: Props) {
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
  // real mode: every profile prerendered (from mechanics.json). Mock mode:
  // none prerendered — fallback renders on demand so ~10k fake pages don't
  // bloat the build; the pages that ship at launch come from real data.
  paths: getProfilePaths().map(({ state, city, shop }) => ({ params: { state, city, shop } })),
  fallback: 'blocking',
})

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const state = String(params?.state)
  const citySlug = String(params?.city)
  const shopSlug = String(params?.shop)
  const profile = getProfile(state, citySlug, shopSlug)
  const city = getCity(state, citySlug)
  if (!profile || !city) return { notFound: true }

  const corridorsNearby = getCorridorsByState(state)
    .filter((c) => isCorridorCovered(c.route, c.state))
    .filter((c) => getCorridorMeta(c.route, c.state)?.citiesAlong.includes(citySlug))

  return { props: { profile, stateName: city.stateName, corridorsNearby } }
}
