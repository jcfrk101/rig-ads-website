import Head from 'next/head'
import Link from 'next/link'
import { ReactNode } from 'react'
import s from '../../styles/Directory.module.scss'
import {
  SITE_ORIGIN,
  SEGMENT,
  DISPATCH_PHONE_DISPLAY,
  DISPATCH_PHONE_TEL,
} from '../../data/directory'
import { fireCallConversion } from '../../utils/gtag'
import DirectoryFooter from './DirectoryFooter'

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
}

export default function DirectoryLayout({ title, description, path, crumbs, jsonLd, children, footnote }: Props) {
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
          <Link href={`/${SEGMENT}/`}>
            <a className={s.logo}>
              <span className={s.logoMark}>R</span> RIG
            </a>
          </Link>
          <nav className={s.navLinks}>
            <Link href={`/${SEGMENT}/`}>
              <a>Semi Truck Repair</a>
            </Link>
            <Link href={`/${SEGMENT}/corridors/`}>
              <a>Corridors</a>
            </Link>
            <Link href={`/${SEGMENT}/how-it-works/`}>
              <a>How It Works</a>
            </Link>
            <a href="https://www.bigrig.app/fleets">For Fleets</a>
            <a href="https://www.bigrig.app/join">Join as Mechanic</a>
          </nav>
          <a className={s.navCta} href={DISPATCH_PHONE_TEL} onClick={fireCallConversion}>
            ☎ {DISPATCH_PHONE_DISPLAY}
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
  )
}
