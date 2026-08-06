import Link from 'next/link'
import RvLayout from '../../components/rv/RvLayout'
import ChatCta from '../../components/rv/ChatCta'
import StatStrip from '../../components/directory/StatStrip'
import s from '../../styles/Directory.module.scss'
import { SITE_ORIGIN } from '../../data/directory'
import { SEO_PHONE } from '../../data/directory/statePhones'
import {
  RV_SEGMENT,
  NATIONAL_STATS,
  rvCoveredStates,
  rvProblemPath,
  rvStatePath,
} from '../../data/rv'
import { RV_PROBLEMS } from '../../data/rv/problems'

export default function RvHub() {
  const states = rvCoveredStates()
  const title = 'Mobile RV Repair — Get Back to Your Trip | 24/7 Dispatch | RIG'
  const description = `RV broke down on a trip? RIG dispatches mobile mechanics to your rig — roadside or campsite. Tires, brakes, engine, batteries, generators. Avg ${NATIONAL_STATS.avgDispatchMin} min to dispatch, 24/7. Chat or call ${SEO_PHONE.display}.`

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Mobile RV repair',
      provider: { '@type': 'Organization', name: 'RIG', url: SITE_ORIGIN, telephone: SEO_PHONE.tel.replace('tel:', '+') },
      areaServed: { '@type': 'Country', name: 'United States' },
      hoursAvailable: 'Mo-Su 00:00-24:00',
    },
  ]

  return (
    <RvLayout
      title={title}
      description={description}
      path={`/${RV_SEGMENT}/`}
      crumbs={[{ label: 'Home', href: `/${RV_SEGMENT}/` }, { label: 'RV Repair' }]}
      jsonLd={jsonLd}
      footnote="Live stats from the RIG network, refreshed regularly. Availability varies by area — chat tells you what's real near you in minutes."
    >
      <div className={s.pageHero}>
        <div className={s.segTabs}>
          <span className={s.segTabOn}>RV / Motorhome</span>
        </div>
        <h1>RV Trouble Shouldn&apos;t End the Trip</h1>
        <p className={s.sub}>
          Mobile mechanics dispatched to your rig — on the shoulder or at the campsite. Describe the problem
          once; nearby mechanics bid back in minutes with rates and ETAs. You pick, they roll, the vacation
          continues.
        </p>
        <StatStrip
          stats={[
            { label: 'Mechanics in network', value: `${NATIONAL_STATS.mechanicsNetwork.toLocaleString()}+`, live: true },
            { label: 'Avg. dispatch', value: `${NATIONAL_STATS.avgDispatchMin} min` },
            { label: 'Avg. time to arrive', value: `${NATIONAL_STATS.avgArrivalMin} min` },
            { label: 'Availability', value: '24/7' },
          ]}
        />
        <ChatCta context="describe the problem" />
      </div>

      <div className={s.prose}>
        <h2>Built for travelers, not junkyards</h2>
        <p>
          You&apos;re out here to see the country, and every hour on the shoulder is an hour off the itinerary.
          RIG&apos;s dispatch model is built for exactly that math: instead of calling shops one by one from a
          rest area, one chat sends your breakdown to 5–20 qualified mobile mechanics at once. They compete to
          get to you — you see hourly rates, call-out fees, and ETAs before anyone rolls, and payment runs
          protected through the app. No cash-on-the-shoulder negotiations, no mystery invoices. Just the
          fastest competent wrench available, headed your way.
        </p>
        <p>
          Anything diesel is home turf — diesel pushers, Super Cs, diesel tow rigs — and the roadside
          systems every RV shares: tires, brakes, batteries, charging, cooling, generators. Most breakdowns
          get fixed where the rig sits.{' '}
          <Link href={rvProblemPath('tow-or-fix')}>
            <a style={{ fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>
              Why fixing beats towing for RVs →
            </a>
          </Link>
        </p>
      </div>

      <div className={s.hubSection}>
        <div className={s.secTitle}>What&apos;s wrong with the rig?</div>
        <div className={s.serviceGrid}>
          {RV_PROBLEMS.map((p) => (
            <Link key={p.slug} href={rvProblemPath(p.slug)}>
              <a className={s.serviceCard}>
                <b>{p.name}</b>
                <p>{p.heroSub.slice(0, 96)}…</p>
                <span>What to do →</span>
              </a>
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
