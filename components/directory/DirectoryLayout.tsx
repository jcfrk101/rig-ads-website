import Head from 'next/head'
import Link from 'next/link'
import { ReactNode, useEffect } from 'react'
import s from '../../styles/Directory.module.scss'
import { SITE_ORIGIN, MAIN_SITE, SEGMENT } from '../../data/directory'
import { PagePhone, TOLLFREE_PHONE } from '../../data/directory/statePhones'
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
  phone?: PagePhone // state-local DNI number; defaults to toll-free
}

export default function DirectoryLayout({ title, description, path, crumbs, jsonLd, children, footnote, phone }: Props) {
  const pagePhone = phone || TOLLFREE_PHONE
  // register the page's number with Google DNI (same pattern as LandingPage)
  useEffect(() => {
    if (pagePhone.dniLabel) fireDniConfig(pagePhone.dniLabel, pagePhone.display)
  }, [pagePhone.dniLabel, pagePhone.display])

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
