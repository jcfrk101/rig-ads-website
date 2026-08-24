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
import ChatCta, { openDispatchChat } from '../../components/rv/ChatCta'
import { fireCallConversion } from '../../utils/gtag'

function BigCallCta() {
  const phone = usePhone()
  return (
    <div style={{ padding: '18px 22px 26px', textAlign: 'center' }}>
      <button
        className={s.dispatchBtn}
        style={{ display: 'inline-flex', fontSize: 19, padding: '16px 34px' }}
        onClick={openDispatchChat}
        type="button"
      >
        💬 Chat with dispatch now
      </button>
      <div style={{ marginTop: 10, fontSize: 15 }}>
        Rather talk?{' '}
        <a href={phone.tel} onClick={fireCallConversion} style={{ fontWeight: 700 }}>
          ☎ {phone.display}
        </a>
      </div>
    </div>
  )
}

export default function HowItWorksPage() {
  const title = 'How RIG Dispatch Works | Bids From Local Mechanics in Minutes | RIG'
  const description = `Broke down? Start a chat or call RIG dispatch — your breakdown goes to 5–20 local heavy-duty mechanics, who bid back in minutes with hourly rates, call-out fees, and ETAs. 24/7 at ${SEO_PHONE.display}.`

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
          closing — every hour on the shoulder costs you. RIG turns one chat — or one call — into live bids
          from local mechanics, usually within minutes.
        </p>
        <ChatCta />
      </div>

      <div className={s.prose}>
        <HowItWorksSteps />

        <div className={s.hiwCallout}>
          <b>What&apos;s a call-out fee?</b> It&apos;s the industry-standard charge for a mobile mechanic to come
          to you — it typically covers drive time and an initial round of diagnostics. Every bid you get through
          RIG shows the call-out fee and the hourly rate upfront, so there are no surprises when the truck is
          fixed.
        </div>

        <h2>Why this beats calling around</h2>
        <p>
          Stuck on the shoulder, the old way is brutal: search for mobile mechanics, dial them one at a time,
          leave voicemails, sit on hold, describe the problem over and over, and wait for callbacks while your
          load sits. When one finally answers, you&apos;re taking the word of the only shop that picked up —
          and &quot;we can come out&quot; often means &quot;after we finish the job we&apos;re on.&quot;
        </p>
        <p>
          RIG already has the relationships. We run an on-demand network of{' '}
          {NATIONAL_STATS.mechanicsNetwork.toLocaleString()}+ heavy-duty mechanics, so you describe the
          breakdown once — location, symptoms, photos — and we put it in front of 5–20 qualified mechanics
          near you at the same time. The ones who can actually roll right now bid back with their rate,
          call-out fee, and a real ETA. You compare several live options instead of trusting the first
          &quot;yes,&quot; pick, and they&apos;re on the way.
        </p>
        <p>
          It works anywhere in our network: in a city, at a truck stop, or on a rural interstate shoulder at 3
          AM. Nationwide, dispatch averages {NATIONAL_STATS.avgDispatchMin} minutes and mechanics average{' '}
          {NATIONAL_STATS.avgArrivalMin} minutes to arrive.
        </p>

        <h2>{DIESEL_ONLY_HEADING}</h2>
        <p>
          {DIESEL_ONLY_BLURB} If you drive a diesel motorhome or tow with a diesel pickup, the same chat
          works for you — the network isn&apos;t just for commercial trucks. If it doesn&apos;t run on
          diesel, we&apos;ll tell you straight and you&apos;ve lost nothing.
        </p>

        <h2>Most jobs don&apos;t need the tow</h2>
        <p>
          Any pro knows towing is the last resort. Most breakdowns — tires, air lines, electrical, fuel,
          sensors, brakes — get fixed where the truck sits: RIG mechanics&apos; fix rate runs{' '}
          {NATIONAL_STATS.fixRatePct}% of dispatched jobs. And if the job genuinely needs a shop, the mechanic
          tells you straight and you&apos;ve lost nothing.
        </p>

        <h2>What to have ready when you chat or call</h2>
        <p>
          Your location (exit number, mile marker, or a GPS pin), what the truck was doing when it quit, any
          warning lights or codes, and — if it&apos;s safe — a few photos (in chat, you drop them straight into
          the thread). The more the mechanics know, the more
          accurate the bids and the more likely they arrive with the right parts the first time.
        </p>
      </div>

      <DispatchBanner
        heading="Broke down right now?"
        sub={`A chat or a call starts the bidding — avg ${NATIONAL_STATS.avgDispatchMin} min to dispatch, 24/7.`}
      />

      <BigCallCta />
    </DirectoryLayout>
  )
}
