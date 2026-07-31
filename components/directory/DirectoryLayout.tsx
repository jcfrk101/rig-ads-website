import Head from 'next/head'
import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import s from '../../styles/Directory.module.scss'
import { SITE_ORIGIN, MAIN_SITE, SEGMENT } from '../../data/directory'
import { PagePhone, TOLLFREE_PHONE, SEO_PHONE } from '../../data/directory/statePhones'
import { fireCallConversion, fireDniConfig } from '../../utils/gtag'
import DirectoryFooter from './DirectoryFooter'
import { PhoneProvider } from './PhoneContext'

export interface Crumb {
  label: string
  href?: string
}

interface Props {
  title: string
  description: string
  path: string // canonical path, e.g. /semi-truck-repair/tx/dallas/
  crumbs: Crumb[]
  jsonLd?: object[]
  children: ReactNode
  footnote?: string
  phone?: PagePhone // ads number for this page (state-local DNI); defaults to toll-free
}

// Attribution split: organic visitors (and crawlers — this is what's in the
// SSR HTML) see the national SEO tracking number on every page. Visitors who
// arrived from a Google Ads click (click-id in the URL, remembered for the
// session) get the page's ads number instead, registered with Google DNI so
// ads call conversions keep flowing into the same per-state actions. The SEO
// number is never registered with DNI, so Google forwarding never routes
// through the SEO tracker and the two call pools stay clean.
const ADS_VISITOR_KEY = 'rigAdsClick'
const isAdsVisitor = () => {
  try {
    const p = new URLSearchParams(window.location.search)
    if (p.has('gclid') || p.has('gbraid') || p.has('wbraid')) {
      sessionStorage.setItem(ADS_VISITOR_KEY, '1')
      return true
    }
    return sessionStorage.getItem(ADS_VISITOR_KEY) === '1'
  } catch {
    return false
  }
}

export default function DirectoryLayout({ title, description, path, crumbs, jsonLd, children, footnote, phone }: Props) {
  const adsPhone = phone || TOLLFREE_PHONE
  const [pagePhone, setPagePhone] = useState<PagePhone>(SEO_PHONE)
  useEffect(() => {
    if (isAdsVisitor()) {
      setPagePhone(adsPhone)
      if (adsPhone.dniLabel) fireDniConfig(adsPhone.dniLabel, adsPhone.display)
    }
  }, [adsPhone.dniLabel, adsPhone.display]) // eslint-disable-line react-hooks/exhaustive-deps

  const canonical = `${SITE_ORIGIN}${path}`
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_ORIGIN}${c.href}` } : {}),
    })),
  }

  return (
    <PhoneProvider value={pagePhone}>
    <div className={s.page}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        {[breadcrumbLd, ...(jsonLd || [])].map((obj, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />
        ))}
        {/* Rig breakdown-chat embed (served by the marketing site on the same
            origin). Gated: renders only when NEXT_PUBLIC_CHAT_EMBED=1 is set at
            build time — local dev via .env.local today; production launch means
            passing it through the Docker build args in cloudbuild-directory. */}
        {process.env.NEXT_PUBLIC_CHAT_EMBED === '1' && (
          <script
            async
            src={`${process.env.NEXT_PUBLIC_CHAT_EMBED_ORIGIN || ''}/chat-embed.js`}
            data-origin={process.env.NEXT_PUBLIC_CHAT_EMBED_ORIGIN || ''}
          />
        )}
      </Head>

      <div className={s.frame}>
        <header className={s.nav}>
          <a className={s.logo} href={MAIN_SITE}>
            <img src="/static/icons/logo-full.svg" alt="RIG" />
          </a>
          <nav className={s.navLinks}>
            <Link href={`/${SEGMENT}/`}>
              <a>Semi Truck Repair</a>
            </Link>
            <Link href={`/${SEGMENT}/services/`}>
              <a>Services</a>
            </Link>
            <Link href={`/${SEGMENT}/corridors/`}>
              <a>Corridors</a>
            </Link>
            <Link href={`/${SEGMENT}/how-it-works/`}>
              <a>How It Works</a>
            </Link>
            <a href="https://fleet.bigrig.app">For Fleets</a>
            <a href="https://shop.bigrig.app">Join as Mechanic</a>
          </nav>
          <a className={s.navCta} href={pagePhone.tel} onClick={fireCallConversion}>
            ☎ {pagePhone.display}
          </a>
        </header>

        <div className={s.crumb}>
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && ' › '}
              {c.href ? (
                <Link href={c.href}>
                  <a>{c.label}</a>
                </Link>
              ) : (
                <b>{c.label}</b>
              )}
            </span>
          ))}
        </div>

        {children}

        {footnote && <div className={s.footnote}>{footnote}</div>}
        <DirectoryFooter />
      </div>
    </div>
    </PhoneProvider>
  )
}
