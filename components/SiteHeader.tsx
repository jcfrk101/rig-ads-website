import Link from 'next/link'
import s from '../styles/Directory.module.scss'
import { MAIN_SITE, SEGMENT } from '../data/directory'
import { RV_SEGMENT } from '../data/rv'
import { usePhone } from './directory/PhoneContext'
import { fireCallConversion } from '../utils/gtag'

// One header for every directory-tree page (semi-truck + RV): same links in
// the same order everywhere — the nav never changes based on which page
// you're on. Must render inside PhoneProvider (reads the page phone).
export default function SiteHeader() {
  const phone = usePhone()
  return (
    <header className={s.nav}>
      <a className={s.logo} href={MAIN_SITE}>
        <img src="/static/icons/logo-full.svg" alt="RIG" />
      </a>
      <nav className={s.navLinks}>
        <Link href={`/${SEGMENT}/`}>
          <a>Semi Truck Repair</a>
        </Link>
        <Link href={`/${RV_SEGMENT}/`}>
          <a>RV Repair</a>
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
      <a className={s.navCta} href={phone.tel} onClick={fireCallConversion}>
        ☎ {phone.display}
      </a>
    </header>
  )
}
