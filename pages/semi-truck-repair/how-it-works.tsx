import DirectoryLayout from '../../components/directory/DirectoryLayout'
import DispatchBanner from '../../components/directory/DispatchBanner'
import { HowItWorksSteps, HOW_IT_WORKS_STEPS } from '../../components/directory/HowItWorks'
import s from '../../styles/Directory.module.scss'
import {
  SEGMENT,
  SITE_ORIGIN,
  NATIONAL_STATS,
  DIESEL_ONLY_HEADING,
  DIESEL_ONLY_BLURB,
} from '../../data/directory'
import { SEO_PHONE } from '../../data/directory/statePhones'
import { usePhone } from '../../components/directory/PhoneContext'
import { fireCallConversion } from '../../utils/gtag'

function BigCallCta() {
  const phone = usePhone()
  return (
    <div style={{ padding: '18px 22px 26px', textAlign: 'center' }}>
      <a
        className={s.dispatchBtn}
        style={{ display: 'inline-flex', fontSize: 19, padding: '16px 34px' }}
        href={phone.tel}
        onClick={fireCallConversion}
      >
        ☎ Call dispatch: {phone.display}
      </a>
    </div>
  )
}

export default function HowItWorksPage() {
  const title = 'How RIG Dispatch Works | Bids From Local Mechanics in Minutes | RIG'
  const description = `Broke down? One call to RIG dispatch sends your breakdown to 5–20 local heavy-duty mechanics, who bid back in minutes with hourly rates, call-out fees, and ETAs. Call ${SEO_PHONE.display}, 24/7.`

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How RIG truck breakdown dispatch works',
      description,
      step: HOW_IT_WORKS_STEPS.map((st, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: st.title,
        text: st.body,
      })),
    },
  ]

  return (
    <DirectoryLayout
      title={title}
      description={description}
      path={`/${SEGMENT}/how-it-works/`}
      crumbs={[{ label: 'Semi Truck Repair', href: `/${SEGMENT}/` }, { label: 'How It Works' }]}
      jsonLd={jsonLd}
      footnote="RIG dispatch is available 24/7. Bids come directly from local mechanics; rates and call-out fees are set by each mechanic and shown to you before anyone rolls."
    >
      <div className={s.pageHero}>
        <h1>How RIG Dispatch Works</h1>
        <p className={s.sub}>
          In trucking, time is money. A reefer load warming up, a bus full of passengers, a pickup window
          closing — every hour on the shoulder costs you. RIG turns one phone call into competing bids from
          local mechanics, usually within minutes.
        </p>
      </div>

      <div className={s.prose}>
        <HowItWorksSteps />

        <div className={s.hiwCallout}>
          <b>What&apos;s a call-out fee?</b> It&apos;s the industry-standard charge for a mobile mechanic to come
          to you — it typically covers drive time and an initial round of diagnostics. Every bid you get through
          RIG shows the call-out fee and the hourly rate upfront, so there are no surprises when the truck is
          fixed.
        </div>

        <h2>{DIESEL_ONLY_HEADING}</h2>
        <p>
          {DIESEL_ONLY_BLURB} If you drive a diesel motorhome or tow with a diesel pickup, the same call
          works for you — the network isn&apos;t just for commercial trucks. If it doesn&apos;t run on
          diesel, we&apos;ll tell you straight and you&apos;ve lost nothing.
        </p>

        <h2>Why this beats calling around</h2>
        <p>
          The old way: search for shops, call them one at a time, describe the problem over and over, wait for
          callbacks, and hope the first &quot;yes&quot; isn&apos;t overpriced — while your load sits. With RIG,
          you describe the breakdown once. We package your location, the symptoms, and your photos, and put it
          in front of 5–20 qualified heavy-duty mechanics near you at the same time. They compete to win the
          job, and you see real numbers — rate, call-out fee, ETA — before choosing.
        </p>
        <p>
          It works anywhere in our network: in a city, at a truck stop, or on a rural interstate shoulder at 3
          AM. Nationwide, dispatch averages {NATIONAL_STATS.avgDispatchMin} minutes and mechanics average{' '}
          {NATIONAL_STATS.avgArrivalMin} minutes to arrive.
        </p>

        <h2>Don&apos;t tow it — fix it where it sits</h2>
        <p>
          A tow should be the last resort, not the first call. Most breakdowns — tires, air lines, electrical,
          fuel, sensors, brakes — get fixed right on the shoulder: RIG mechanics&apos; fix rate runs{' '}
          {NATIONAL_STATS.fixRatePct}% of dispatched jobs. A tow adds hours of waiting, hundreds of dollars, and
          you still pay a shop on the other end. Call dispatch first; if the job genuinely needs a shop, the
          mechanic tells you straight and you&apos;ve lost nothing.
        </p>

        <h2>What to have ready when you call</h2>
        <p>
          Your location (exit number, mile marker, or a GPS pin), what the truck was doing when it quit, any
          warning lights or codes, and — if it&apos;s safe — a few photos. The more the mechanics know, the more
          accurate the bids and the more likely they arrive with the right parts the first time.
        </p>
      </div>

      <DispatchBanner
        heading="Broke down right now?"
        sub={`One call starts the bidding — avg ${NATIONAL_STATS.avgDispatchMin} min to dispatch, 24/7.`}
      />

      <BigCallCta />
    </DirectoryLayout>
  )
}
