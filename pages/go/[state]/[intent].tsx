import Head from 'next/head'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useEffect, useState } from 'react'
import s from '../../../styles/Directory.module.scss'
import { STATES, MAIN_SITE, NATIONAL_STATS, getStateStats, CityStats } from '../../../data/directory'
import { getPhoneForState, PagePhone, TOLLFREE_PHONE } from '../../../data/directory/statePhones'
import { GO_INTENT_SLUGS, getGoIntent, GoIntent } from '../../../data/go/intents'
import { PhoneProvider } from '../../../components/directory/PhoneContext'
import { fireCallConversion, fireDniConfig } from '../../../utils/gtag'
import ChatCta from '../../../components/rv/ChatCta'
import StatStack from '../../../components/rv/StatStack'

// Paid-click landing page: /go/{state}/{intent}/?loc={loc_physical_ms}&int={loc_interest_ms}
//
// Query-specific in two layers: the URL fixes state + intent (keyword-level
// final URLs in Google Ads), and ValueTrack location IDs personalize the
// hero to the searcher's city client-side (per-state lookup JSON under
// /static/go-geo/, fetched only when a location param is present).
//
// Rules of the page: noindex (SEO pages are the directory trees); every
// visitor is an ad click, so the state ads number is the page phone (DNI
// registered) — no organic/ads split here; and nothing on the page lists a
// mechanic's own number, so a paid click can only convert through chat or
// the RIG line, both of which we can attribute back to the click.

interface Props {
  stateCode: string
  stateName: string
  intent: GoIntent
  stats: CityStats
  phone: PagePhone
}

// id -> [name, stateCode]; files bucketed by id % 100 (~8KB each) so any
// page — state or national — resolves a location with one small fetch.
type GeoBucket = Record<string, [string, string]>

function useAdPlace(fallback: string): string {
  const [place, setPlace] = useState(fallback)
  useEffect(() => {
    let cancelled = false
    try {
      const p = new URLSearchParams(window.location.search)
      // Location of interest (from the query, "truck repair amarillo") beats
      // physical location; both are Google geo-target criterion IDs.
      const ids = [p.get('int'), p.get('loc')].filter((v): v is string => !!v && /^\d+$/.test(v))
      if (!ids.length) return
      Promise.all(
        ids.map((id) =>
          fetch(`/static/go-geo/b/${String(Number(id) % 100).padStart(2, '0')}.json`)
            .then((r) => (r.ok ? (r.json() as Promise<GeoBucket>) : null))
            .then((b) => (b && b[id]) || null)
            .catch(() => null)
        )
      ).then((hits) => {
        if (cancelled) return
        const hit = hits.find((h) => h)
        if (hit) setPlace(`${hit[0]}, ${hit[1].toUpperCase()}`)
      })
    } catch {
      /* no personalization */
    }
    return () => {
      cancelled = true
    }
  }, [fallback])
  return place
}

export default function GoLanding({ stateCode, stateName, intent, stats, phone }: Props) {
  const place = useAdPlace(stateCode === 'us' ? 'Your Area' : stateName)
  useEffect(() => {
    if (phone.dniLabel) fireDniConfig(phone.dniLabel, phone.display)
  }, [phone.dniLabel, phone.display])

  const title = stateCode === 'us' ? `${intent.noun} — 24/7 nationwide | RIG Dispatch` : `${intent.noun} in ${stateName} | RIG Dispatch`
  return (
    <PhoneProvider value={phone}>
      <div className={s.page}>
        <Head>
          <title>{title}</title>
          <meta name="robots" content="noindex,nofollow" />
          <meta name="description" content={intent.sub} />
          {process.env.NEXT_PUBLIC_CHAT_EMBED === '1' && (
            <script
              async
              src={`${process.env.NEXT_PUBLIC_CHAT_EMBED_ORIGIN || ''}/chat-embed.js`}
              data-origin={process.env.NEXT_PUBLIC_CHAT_EMBED_ORIGIN || ''}
            />
          )}
        </Head>

        <div className={s.frame}>
          {/* Slim header: logo + phone only. No site nav — nav leads to the
              directory, whose listings carry mechanics' own numbers. */}
          <header className={s.nav}>
            <a className={s.logo} href={MAIN_SITE}>
              <img src="/static/icons/logo-full.svg" alt="RIG" />
            </a>
            <a
              href={phone.tel}
              onClick={fireCallConversion}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                background: '#e0552b',
                color: '#fff',
                padding: '9px 16px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                whiteSpace: 'nowrap',
                textDecoration: 'none',
              }}
            >
              ☎ {phone.display}
            </a>
          </header>

          <div className={s.pageHero}>
            <div className={s.segTabs}>
              <span className={s.segTabOn}>{intent.tab}</span>
            </div>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 360px', minWidth: 300 }}>
                <h1>{intent.h1.replace('{place}', place)}</h1>
                <p className={s.sub}>{intent.sub}</p>
                <ChatCta placeholder={intent.chatPlaceholder} />
              </div>
              <StatStack
                stats={[
                  { label: stateCode === 'us' ? 'Mechanics in network' : `Mechanics in ${stateName}`, value: `${stats.mechanicsInArea.toLocaleString()}+`, live: true },
                  { label: 'Avg. dispatch', value: `${stats.avgDispatchMin} min` },
                  { label: 'Avg. time to arrive', value: `${stats.avgArrivalMin} min` },
                  { label: 'Availability', value: '24/7' },
                ]}
              />
            </div>
          </div>

          <section className={s.hubSection}>
            <h2 className={s.secTitle}>How it works</h2>
            <ol className={`${s.hiwSteps} ${s.hiwStepsCompact}`}>
              <li className={s.hiwStep}>
                <span className={s.hiwNum}>1</span>
                <div>
                  <b>Tell us what happened and where you are</b>
                  <p>Chat or call. Mile markers, exits, and truck-stop names all work — a human dispatcher confirms the details with you.</p>
                </div>
              </li>
              <li className={s.hiwStep}>
                <span className={s.hiwNum}>2</span>
                <div>
                  <b>Nearby mechanics bid in minutes</b>
                  <p>Your request goes to {intent.coverage} mechanics near you. Each answers with a rate and an ETA — you see them side by side.</p>
                </div>
              </li>
              <li className={s.hiwStep}>
                <span className={s.hiwNum}>3</span>
                <div>
                  <b>You pick, they roll</b>
                  <p>Choose the offer you like. Track the mechanic on the way, pay through RIG when the job&apos;s done. No dispatch fee to you.</p>
                </div>
              </li>
            </ol>
          </section>

          <section className={s.hubSection}>
            <h2 className={s.secTitle}>What we handle</h2>
            <div className={s.serviceGrid}>
              {intent.handles.map((h) => (
                <div key={h} className={s.serviceCard}>
                  {h}
                </div>
              ))}
            </div>
            <p className={s.footnote} style={{ marginTop: 14 }}>
              RIG is a nationwide {intent.coverage} network — strong in most metros and along the major corridors,
              thinner in some rural areas. Coverage and specialties vary by mechanic; the chat tells you what&apos;s real
              near you within minutes, and if we can&apos;t help we&apos;ll say so.
            </p>
          </section>

          <section className={s.hubSection}>
            <div className={s.dispatchBanner}>
              <div className={s.dispatchText}>
                <b>Prefer to talk?</b> RIG dispatch answers 24/7 — describe the problem and we&apos;ll get mechanics bidding.
              </div>
              <a className={s.dispatchBtn} href={phone.tel} onClick={fireCallConversion}>
                Call {phone.display}
              </a>
            </div>
          </section>

          <footer style={{ padding: '22px 22px 30px', fontSize: 12.5, color: '#5c6a76', textAlign: 'center' }}>
            © {new Date().getFullYear()} RIG · Mobile mechanic dispatch for trucks, trailers, and RVs ·{' '}
            <a href={`${MAIN_SITE}/`} style={{ color: '#5c6a76' }}>
              bigrig.app
            </a>
          </footer>
        </div>
      </div>
    </PhoneProvider>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [...Object.keys(STATES), 'us'].flatMap((st) =>
    GO_INTENT_SLUGS.map((intent) => ({ params: { state: st.toLowerCase(), intent } }))
  ),
  fallback: false,
})

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const stateCode = String(params?.state || '').toLowerCase()
  const intent = getGoIntent(String(params?.intent || ''))
  if (!intent) return { notFound: true }
  // 'us' serves the national campaigns (Tire / RV / National): toll-free
  // number, network-wide stats, hero personalized from the click's location.
  if (stateCode === 'us') {
    return {
      props: {
        stateCode,
        stateName: 'the U.S.',
        intent,
        stats: {
          mechanicsInArea: NATIONAL_STATS.mechanicsNetwork,
          avgArrivalMin: NATIONAL_STATS.avgArrivalMin,
          avgDispatchMin: NATIONAL_STATS.avgDispatchMin,
          jobsCompleted: 0,
        },
        phone: TOLLFREE_PHONE,
      },
    }
  }
  const state = STATES[stateCode]
  if (!state) return { notFound: true }
  return {
    props: {
      stateCode,
      stateName: state.name,
      intent,
      stats: getStateStats(stateCode),
      phone: getPhoneForState(stateCode),
    },
  }
}
