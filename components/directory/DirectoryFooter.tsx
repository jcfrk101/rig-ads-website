import Link from 'next/link'
import s from '../../styles/Directory.module.scss'
import {
  CITIES,
  STATES,
  SEGMENT,
  statePath,
  cityPath,
  routePath,
} from '../../data/directory'
import { HOW_IT_WORKS_PATH } from './HowItWorks'
import { fireCallConversion } from '../../utils/gtag'
import { usePhone } from './PhoneContext'
import { isCityCovered, isRouteCovered, isStateCovered } from '../../data/directory/mechanics'

// Curated, small on purpose: the footer is on ~2,500 pages, so it links the
// hubs and a handful of top markets, not everything.
const TOP_STATE_CODES = ['tx', 'ca', 'fl', 'il', 'ny', 'pa', 'ga', 'oh'].filter(isStateCovered)
const TOP_ROUTES = ['i-95', 'i-80', 'i-10', 'i-40', 'i-70', 'i-75'].filter(isRouteCovered)
// NYC boroughs are separate rows in the city data; the footer shouldn't list
// them next to New York City itself
const BOROUGHS = new Set(['brooklyn', 'queens', 'bronx', 'manhattan', 'staten-island'])
const TOP_CITIES = [...CITIES]
  .filter((c) => !(c.state === 'ny' && BOROUGHS.has(c.citySlug)) && isCityCovered(c.state, c.citySlug))
  .sort((a, b) => b.population - a.population)
  .slice(0, 8)

const MAIN_SITE = 'https://bigrig.app'

export default function DirectoryFooter() {
  const phone = usePhone()
  return (
    <footer className={s.bigFooter}>
      <div className={s.bigFooterGrid}>
        <div className={s.bigFooterBrand}>
          <div className={s.logo}>
            <span className={s.logoMark}>R</span> RIG
          </div>
          <p>
            24/7 mobile semi truck repair, dispatched nationwide. One call sends your breakdown to local
            mechanics who bid back in minutes.
          </p>
          <a className={s.navCta} href={phone.tel} onClick={fireCallConversion}>
            ☎ {phone.display}
          </a>
        </div>

        <div>
          <div className={s.bigFooterHead}>Directory</div>
          <Link href={`/${SEGMENT}/`}>
            <a>All states</a>
          </Link>
          {TOP_STATE_CODES.filter((c) => STATES[c]).map((c) => (
            <Link key={c} href={statePath(c)}>
              <a>{STATES[c].name}</a>
            </Link>
          ))}
        </div>

        <div>
          <div className={s.bigFooterHead}>Corridors</div>
          <Link href={`/${SEGMENT}/corridors/`}>
            <a>All corridors</a>
          </Link>
          {TOP_ROUTES.map((r) => (
            <Link key={r} href={routePath(r)}>
              <a>{r.toUpperCase()} truck repair</a>
            </Link>
          ))}
        </div>

        <div>
          <div className={s.bigFooterHead}>Top markets</div>
          {TOP_CITIES.map((c) => (
            <Link key={`${c.state}/${c.citySlug}`} href={cityPath(c)}>
              <a>
                {c.name}, {c.state.toUpperCase()}
              </a>
            </Link>
          ))}
        </div>

        <div>
          <div className={s.bigFooterHead}>Company</div>
          <a href={MAIN_SITE}>RIG home</a>
          <a href={`${MAIN_SITE}/fleets`}>For fleets</a>
          <a href={`${MAIN_SITE}/join`}>Join as a mechanic</a>
          <a href={`${MAIN_SITE}/contact`}>Contact</a>
          <Link href={HOW_IT_WORKS_PATH}>
            <a>How dispatch works</a>
          </Link>
        </div>
      </div>

      <div className={s.bigFooterLegal}>
        <span>© {new Date().getFullYear()} RIG Technologies</span>
        <a href={`${MAIN_SITE}/terms`}>Terms</a>
        <a href={`${MAIN_SITE}/privacy`}>Privacy</a>
        <span className={s.bigFooterNote}>
          Listed shops shown for completeness; dispatch routes to the closest available RIG mechanic.
        </span>
      </div>
    </footer>
  )
}
