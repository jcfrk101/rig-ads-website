import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import RvLayout from '../../../components/rv/RvLayout'
import ChatCta from '../../../components/rv/ChatCta'
import StatStack from '../../../components/rv/StatStack'
import s from '../../../styles/Directory.module.scss'
import { SITE_ORIGIN, STATES, CityStats, DirectoryCity, isBorough } from '../../../data/directory'
import { getPhoneForState, SEO_PHONE, PagePhone } from '../../../data/directory/statePhones'
import {
  RV_SEGMENT,
  isStateSlug,
  rvCoveredStates,
  rvCoveredCities,
  rvProblemPath,
  rvStatePath,
  rvCityPath,
  getStateStats,
} from '../../../data/rv'
import { RV_PROBLEMS, RvProblem, getRvProblem } from '../../../data/rv/problems'

// Dual-mode route at /rv-repair/{slug}/:
//  - 2-letter slug -> state page ("Mobile RV Repair in Colorado")
//  - anything else -> problem page ("RV Generator Won't Start")
// State slugs are always exactly 2 letters, problem slugs never are.
type Props =
  | { kind: 'problem'; problem: RvProblem; states: { code: string; name: string }[] }
  | { kind: 'state'; code: string; stateName: string; stats: CityStats; topCities: DirectoryCity[]; phone: PagePhone }

function ProblemPage({ problem, states }: Extract<Props, { kind: 'problem' }>) {
  const description = `${problem.heroSub.slice(0, 130)} Chat with RIG dispatch or call ${SEO_PHONE.display}, 24/7.`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: `Mobile RV repair — ${problem.name}`,
      provider: { '@type': 'Organization', name: 'RIG', url: SITE_ORIGIN, telephone: SEO_PHONE.tel.replace('tel:', '+') },
      areaServed: { '@type': 'Country', name: 'United States' },
      hoursAvailable: 'Mo-Su 00:00-24:00',
    },
  ]

  return (
    <RvLayout
      title={problem.title}
      description={description}
      path={rvProblemPath(problem.slug)}
      crumbs={[{ label: 'RV Repair', href: `/${RV_SEGMENT}/` }, { label: problem.name }]}
      jsonLd={jsonLd}
      footnote="Guidance is general — your rig and situation come first. When in doubt, get safe and ask dispatch."
    >
      <div className={s.pageHero}>
        <div className={s.segTabs}>
          <span className={s.segTabOn}>RV / Motorhome</span>
        </div>
        <h1>{problem.h1}</h1>
        <p className={s.sub}>{problem.heroSub}</p>
        <ChatCta placeholder='Describe the problem — dispatch reads it and mechanics bid back' />
      </div>

      <div className={s.prose}>
        <p>{problem.intro}</p>

        <h2>What it usually is</h2>
        <ul>
          {problem.causes.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>

        <h2>While you wait — safe things to check</h2>
        <ul>
          {problem.checks.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>

        {problem.campsiteNote && (
          <div className={s.hiwCallout}>
            <b>Campsite work, honestly.</b> {problem.campsiteNote}
          </div>
        )}

        <h2>Get back to your trip</h2>
        <p>{problem.dispatch}</p>
      </div>

      <div className={s.hubSection}>
        <div className={s.secTitle}>Other common RV problems</div>
        <div className={s.chipRow}>
          {RV_PROBLEMS.filter((p) => p.slug !== problem.slug).map((p) => (
            <Link key={p.slug} href={rvProblemPath(p.slug)}>
              <a className={s.chip}>{p.name}</a>
            </Link>
          ))}
        </div>

        <div className={s.secTitle}>Mobile RV repair by state</div>
        <div className={s.linkGrid}>
          {states.map((st) => (
            <Link key={st.code} href={rvStatePath(st.code)}>
              <a className={s.linkCard}>{st.name}</a>
            </Link>
          ))}
        </div>
      </div>
    </RvLayout>
  )
}

function StatePage({ code, stateName, stats, topCities, phone }: Extract<Props, { kind: 'state' }>) {
  const title = `Mobile RV Repair in ${stateName} | Get Back to Your Trip | RIG`
  const description = `RV broke down in ${stateName}? RIG dispatches mobile mechanics to your rig — roadside or campsite. ${stats.mechanicsInArea} mechanics in the area, avg ${stats.avgDispatchMin} min to dispatch. Chat or call ${SEO_PHONE.display}, 24/7.`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Mobile RV repair',
      provider: { '@type': 'Organization', name: 'RIG', url: SITE_ORIGIN, telephone: SEO_PHONE.tel.replace('tel:', '+') },
      areaServed: { '@type': 'State', name: stateName },
      hoursAvailable: 'Mo-Su 00:00-24:00',
    },
  ]

  return (
    <RvLayout
      title={title}
      description={description}
      path={rvStatePath(code)}
      crumbs={[{ label: 'RV Repair', href: `/${RV_SEGMENT}/` }, { label: stateName }]}
      jsonLd={jsonLd}
      phone={phone}
      footnote="Live stats from the RIG network, refreshed regularly. Gas or diesel — coverage and specialties vary by mechanic and area; chat confirms what's available near you before anyone rolls."
    >
      <div className={s.pageHero}>
        <div className={s.segTabs}>
          <span className={s.segTabOn}>RV / Motorhome</span>
        </div>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 360px', minWidth: 300 }}>
            <h1>Mobile RV Repair in {stateName}</h1>
            <p className={s.sub}>
              Broke down on the way to the campground? Mechanics dispatched to your rig across {stateName} —
              tires, brakes, engine, batteries, generators. Describe it once, get bids in minutes, keep the
              trip.
            </p>
            <ChatCta placeholder={`Describe the problem and where you are in ${stateName}…`} />
          </div>
          <StatStack
            stats={[
              { label: 'Mechanics in area', value: String(stats.mechanicsInArea), live: true },
              { label: 'Avg. dispatch', value: `${stats.avgDispatchMin} min` },
              { label: 'Avg. time to arrive', value: `${stats.avgArrivalMin} min` },
              { label: 'Availability', value: '24/7' },
            ]}
          />
        </div>
      </div>

      <div className={s.prose}>
        <h2>RV breakdown help across {stateName}</h2>
        <p>
          RIG covers {stateName} with mobile mechanics who work on heavy rigs every day — and a motorhome is
          a heavy rig, gas or diesel. Tires, brakes, cooling systems, batteries and charging, generators:
          the roadside systems that end trips are the systems these mechanics fix for a living. Coverage is
          strongest along the interstates and around bigger towns, and specialties vary by mechanic — chat
          tells you what&apos;s genuinely available near you in minutes. Most breakdowns are handled where
          the rig sits, roadside or at your site, without a tow, with each mechanic&apos;s rate, call-out
          fee, and ETA shown before you choose.
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

        {topCities.length > 0 && (
          <>
            <div className={s.secTitle}>RV repair near {stateName} cities</div>
            <div className={s.linkGrid}>
              {topCities.map((c) => (
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

export default function RvSlugPage(props: Props) {
  if (props.kind === 'state') return <StatePage {...props} />
  return <ProblemPage {...props} />
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [
    ...RV_PROBLEMS.map((p) => ({ params: { slug: p.slug } })),
    ...rvCoveredStates().map((st) => ({ params: { slug: st.code } })),
  ],
  fallback: false,
})

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug)
  if (isStateSlug(slug)) {
    const st = STATES[slug]
    const topCities = rvCoveredCities()
      .filter((c) => c.state === slug && !isBorough(c))
      .sort((a, b) => b.population - a.population)
      .slice(0, 16)
    return {
      props: {
        kind: 'state',
        code: slug,
        stateName: st.name,
        stats: getStateStats(slug),
        topCities,
        phone: getPhoneForState(slug),
      },
    }
  }
  const problem = getRvProblem(slug)
  if (!problem) return { notFound: true }
  const states = rvCoveredStates().map((st) => ({ code: st.code, name: st.name }))
  return { props: { kind: 'problem', problem, states } }
}
