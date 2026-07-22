import Link from 'next/link'
import s from '../../styles/Directory.module.scss'
import {
  CITIES,
  STATES,
  SEGMENT,
  MAIN_SITE,
  isBorough,
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
const TOP_CITIES = [...CITIES]
  .filter((c) => !isBorough(c) && isCityCovered(c.state, c.citySlug))
  .sort((a, b) => b.population - a.population)
  .slice(0, 8)

export default function DirectoryFooter() {
  const phone = usePhone()
  return (
    <footer className={s.bigFooter}>
      <div className={s.bigFooterGrid}>
        <div className={s.bigFooterBrand}>
          <a className={s.logo} href={MAIN_SITE}>
            <img src="/static/icons/logo-full.svg" alt="RIG" />
          </a>
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
          <Link href={`/${SEGMENT}/services/`}>
            <a>All services</a>
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
          <a href="https://fleet.bigrig.app">For fleets</a>
          <a href="https://shop.bigrig.app">Join as a mechanic</a>
          <a href="mailto:hello@bigrig.app">Contact</a>
          <Link href={HOW_IT_WORKS_PATH}>
            <a>How dispatch works</a>
          </Link>
        </div>
      </div>

      <div className={s.bigFooterLegal}>
        <span>© {new Date().getFullYear()} RIG Technologies</span>
        {/* site-wide Terms of Use is hosted on the app subdomains (identical on
            shop./fleet.); privacy policy exists only as this Termly document */}
        <a href="https://shop.bigrig.app/terms">Terms</a>
        <a href="https://app.termly.io/document/privacy-policy/ac7366a2-9849-41f8-b938-760ab198e47b">Privacy</a>
        <span className={s.bigFooterNote}>
          Listed shops shown for completeness; dispatch routes to the closest available RIG mechanic.
        </span>
      </div>
    </footer>
  )
}
