import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import DirectoryLayout from '../../../components/directory/DirectoryLayout'
import DispatchBanner from '../../../components/directory/DispatchBanner'
import s from '../../../styles/Directory.module.scss'
import {
  CITIES,
  SEGMENT,
  SITE_ORIGIN,
  DISPATCH_PHONE_DISPLAY,
  NATIONAL_STATS,
  DirectoryCity,
  isBorough,
  cityPath,
  servicePathCity,
  DIESEL_ONLY_BLURB,
} from '../../../data/directory'
import { hasCityService, isCityCovered } from '../../../data/directory/mechanics'
import { DIRECTORY_SERVICES, DirectoryService, getService, servicePath } from '../../../data/directory/services'

interface Props {
  service: DirectoryService
  topMarkets: (DirectoryCity & { deepLink: boolean })[]
}

export default function ServicePage({ service, topMarkets }: Props) {
  const title = `${service.h1} | 24/7 Dispatch | RIG`
  const description = `${service.short} RIG dispatches the closest qualified mobile mechanic, 24/7 — bids back in minutes with rates and call-out fee upfront. Call ${DISPATCH_PHONE_DISPLAY}.`

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: service.name,
      name: service.h1,
      provider: { '@type': 'Organization', name: 'RIG', url: SITE_ORIGIN, telephone: '+18557442223' },
      areaServed: { '@type': 'Country', name: 'United States' },
      hoursAvailable: 'Mo-Su 00:00-24:00',
    },
  ]

  return (
    <DirectoryLayout
      title={title}
      description={description}
      path={servicePath(service.slug)}
      crumbs={[
        { label: 'Semi Truck Repair', href: `/${SEGMENT}/` },
        { label: 'Services', href: `/${SEGMENT}/services/` },
        { label: service.name },
      ]}
      jsonLd={jsonLd}
      footnote="Service availability varies by mechanic; every bid shows the mechanic's services, rates, and call-out fee upfront."
    >
      <div className={s.pageHero}>
        <div className={s.segTabs}>
          <span className={s.segTabOn}>Semi / Big Truck</span>
        </div>
        <h1>{service.h1}</h1>
        <p className={s.sub}>{service.heroSub}</p>
      </div>

      <DispatchBanner
        heading="Broke down right now?"
        sub={`One call sends your breakdown to local mechanics — avg ${NATIONAL_STATS.avgDispatchMin} min to dispatch, 24/7.`}
      />

      <div className={s.prose}>
        <h2>What the mechanic does on site</h2>
        <p>{service.whatWeDo}</p>
        <div className={s.svc} style={{ marginTop: 10 }}>
          {service.roadsideFixes.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>

        <h2>Roadside or shop?</h2>
        <p>{service.roadsideOrShop}</p>
        <p>{DIESEL_ONLY_BLURB}</p>

        <div className={s.hiwCallout}>
          <b>Pricing is upfront.</b> Every bid shows the mechanic&apos;s hourly rate and call-out fee — the
          industry-standard charge that typically covers drive time and initial diagnostics — before anyone
          rolls.{' '}
          <Link href={`/${SEGMENT}/how-it-works/`}>
            <a style={{ fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>
              See how RIG dispatch works
            </a>
          </Link>
          .
        </div>
      </div>

      <div className={s.hubSection}>
        <div className={s.secTitle}>{service.name} in major markets</div>
        <div className={s.linkGrid}>
          {topMarkets.map((c) => (
            <Link
              key={`${c.state}/${c.citySlug}`}
              href={c.deepLink ? servicePathCity(c.state, c.citySlug, service.slug) : cityPath(c)}
            >
              <a className={s.linkCard}>
                {c.name} <small>{c.state.toUpperCase()}</small>
              </a>
            </Link>
          ))}
        </div>

        <div className={s.secTitle}>Other services</div>
        <div className={s.chipRow}>
          {DIRECTORY_SERVICES.filter((svc) => svc.slug !== service.slug).map((svc) => (
            <Link key={svc.slug} href={servicePath(svc.slug)}>
              <a className={s.chip}>{svc.name}</a>
            </Link>
          ))}
        </div>
      </div>
    </DirectoryLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: DIRECTORY_SERVICES.map((svc) => ({ params: { service: svc.slug } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const service = getService(String(params?.service))
  if (!service) return { notFound: true }

  const topMarkets = CITIES.filter((c) => !isBorough(c) && isCityCovered(c.state, c.citySlug))
    .sort((a, b) => b.population - a.population)
    .slice(0, 24)
    .map((c) => ({ ...c, deepLink: hasCityService(c.state, c.citySlug, service.slug) }))

  return { props: { service, topMarkets } }
}
