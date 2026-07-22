import Link from 'next/link'
import DirectoryLayout from '../../components/directory/DirectoryLayout'
import StatStrip from '../../components/directory/StatStrip'
import DispatchBanner from '../../components/directory/DispatchBanner'
import DispatchExplainer from '../../components/directory/DispatchExplainer'
import s from '../../styles/Directory.module.scss'
import {
  CITIES,
  STATES,
  SEGMENT,
  NATIONAL_STATS,
  DISPATCH_PHONE_DISPLAY,
  getRoutes,
  statePath,
  cityPath,
  routePath,
} from '../../data/directory'
import { isCityCovered, isRouteCovered, isStateCovered } from '../../data/directory/mechanics'
import { DIRECTORY_SERVICES, servicePath } from '../../data/directory/services'

export default function SemiHub() {
  const coveredCities = CITIES.filter((c) => isCityCovered(c.state, c.citySlug))
  const coveredCityCount = new Map<string, number>()
  for (const c of coveredCities) coveredCityCount.set(c.state, (coveredCityCount.get(c.state) || 0) + 1)

  const states = Object.values(STATES)
    .filter((st) => isStateCovered(st.code))
    .sort((a, b) => a.name.localeCompare(b.name))
  const topCities = [...coveredCities].sort((a, b) => b.population - a.population).slice(0, 24)
  const routes = getRoutes().filter(isRouteCovered)

  const title = 'Mobile Diesel Mechanics Near You | 24/7 Semi Truck Repair | RIG'
  const description = `Truck down? RIG dispatches the closest available diesel mechanic anywhere in the US — ${NATIONAL_STATS.mechanicsNetwork.toLocaleString()}+ mechanics, avg ${NATIONAL_STATS.avgDispatchMin} min dispatch, avg $${NATIONAL_STATS.avgCostUsd} per job. Call ${DISPATCH_PHONE_DISPLAY}.`

  return (
    <DirectoryLayout
      title={title}
      description={description}
      path={`/${SEGMENT}/`}
      crumbs={[{ label: 'Home', href: `/${SEGMENT}/` }, { label: 'Semi Truck Repair' }]}
      footnote="RIG dispatches the closest available mechanic from a nationwide network. Stats refreshed regularly."
    >
      <div className={s.pageHero}>
        <div className={s.segTabs}>
          <span className={s.segTabOn}>Semi / Big Truck</span>
        </div>
        <h1>24/7 Mobile Semi Truck Repair, Anywhere in the US</h1>
        <p className={s.sub}>
          Pick your state or interstate corridor — or just call. RIG routes the closest available diesel mechanic
          to your truck, 24 hours a day. Anything diesel — and only diesel: big rigs, diesel RVs, diesel
          pickups.
        </p>
        <StatStrip
          stats={[
            { label: 'Mechanics in network', value: `${NATIONAL_STATS.mechanicsNetwork.toLocaleString()}+`, live: true },
            { label: 'Avg. dispatch', value: `${NATIONAL_STATS.avgDispatchMin} min` },
            { label: 'Avg. time to arrive', value: `${NATIONAL_STATS.avgArrivalMin} min` },
            { label: 'Avg. cost', value: `$${NATIONAL_STATS.avgCostUsd}`, note: `${Math.abs(NATIONAL_STATS.costVsIndustryPct)}% less` },
          ]}
        />
      </div>

      <DispatchBanner
        heading="Broke down right now?"
        sub={`Skip the browsing — one call connects you to the closest available mechanic, avg ${NATIONAL_STATS.avgDispatchMin} min to dispatch.`}
      />

      <DispatchExplainer pageKey="hub" />

      <div className={s.hubSection}>
        <div className={s.secTitle}>Services we dispatch</div>
        <div className={s.chipRow}>
          {DIRECTORY_SERVICES.map((svc) => (
            <Link key={svc.slug} href={servicePath(svc.slug)}>
              <a className={s.chip}>{svc.name}</a>
            </Link>
          ))}
        </div>

        <div className={s.secTitle}>Semi truck repair by state</div>
        <div className={s.linkGrid}>
          {states.map((st) => (
            <Link key={st.code} href={statePath(st.code)}>
              <a className={s.linkCard}>
                {st.name} <small>{coveredCityCount.get(st.code) || 0} cities</small>
              </a>
            </Link>
          ))}
        </div>

        <div className={s.secTitle}>Major freight corridors</div>
        <div className={s.chipRow}>
          {routes.map((r) => (
            <Link key={r} href={routePath(r)}>
              <a className={s.chip}>{r.toUpperCase()}</a>
            </Link>
          ))}
        </div>

        <div className={s.secTitle}>Biggest truck repair markets</div>
        <div className={s.linkGrid}>
          {topCities.map((c) => (
            <Link key={`${c.state}/${c.citySlug}`} href={cityPath(c)}>
              <a className={s.linkCard}>
                {c.name} <small>{c.state.toUpperCase()}</small>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </DirectoryLayout>
  )
}
