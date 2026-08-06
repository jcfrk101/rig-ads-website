import Head from 'next/head'
import Link from 'next/link'
import { ReactNode } from 'react'
import s from '../../styles/Directory.module.scss'
import { SITE_ORIGIN } from '../../data/directory'
import { RV_SEGMENT } from '../../data/rv'
import { PagePhone, TOLLFREE_PHONE } from '../../data/directory/statePhones'
import { fireCallConversion } from '../../utils/gtag'
import DirectoryFooter from '../directory/DirectoryFooter'
import SiteHeader from '../SiteHeader'
import { PhoneProvider, usePagePhone } from '../directory/PhoneContext'

export interface Crumb {
  label: string
  href?: string
}

interface Props {
  title: string
  description: string
  path: string
  crumbs: Crumb[]
  jsonLd?: object[]
  children: ReactNode
  footnote?: string
  phone?: PagePhone // ads number when a campaign points here; defaults to toll-free
}

// RV-tree chrome: same machinery as DirectoryLayout (SEO/ads phone split,
// chat embed gate, footer) with RV-facing navigation. Kept separate rather
// than parameterized — the two trees' navs and voices will keep diverging.
export default function RvLayout({ title, description, path, crumbs, jsonLd, children, footnote, phone }: Props) {
  const pagePhone = usePagePhone(phone || TOLLFREE_PHONE)
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
