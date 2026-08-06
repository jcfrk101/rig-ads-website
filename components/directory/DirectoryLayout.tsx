import Head from 'next/head'
import Link from 'next/link'
import { ReactNode } from 'react'
import s from '../../styles/Directory.module.scss'
import { SITE_ORIGIN, MAIN_SITE, SEGMENT } from '../../data/directory'
import { PagePhone, TOLLFREE_PHONE } from '../../data/directory/statePhones'
import { fireCallConversion } from '../../utils/gtag'
import DirectoryFooter from './DirectoryFooter'
import SiteHeader from '../SiteHeader'
import { PhoneProvider, usePagePhone } from './PhoneContext'

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

export default function DirectoryLayout({ title, description, path, crumbs, jsonLd, children, footnote, phone }: Props) {
  // SEO number by default; ad-click visitors get the state ads number + DNI
  // (see usePagePhone for the attribution-split rationale)
  const pagePhone = usePagePhone(phone || TOLLFREE_PHONE)

  const canonical = `${SITE_ORIGIN}${path}`
  const allCrumbs = [{ label: 'Home', href: MAIN_SITE }, ...crumbs]
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allCrumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: c.href.startsWith('http') ? c.href : `${SITE_ORIGIN}${c.href}` } : {}),
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
        <SiteHeader />

        <div className={s.crumb}>
          {allCrumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && ' › '}
              {c.href ? (
                c.href.startsWith('http') ? (
                  <a href={c.href}>{c.label}</a>
                ) : (
                  <Link href={c.href}>
                    <a>{c.label}</a>
                  </Link>
                )
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
