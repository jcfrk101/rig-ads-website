import Link from 'next/link'
import { useState } from 'react'
import s from '../styles/Directory.module.scss'
import { MAIN_SITE, SEGMENT } from '../data/directory'
import { RV_SEGMENT } from '../data/rv'
import { usePhone } from './directory/PhoneContext'
import { fireCallConversion } from '../utils/gtag'

const NAV = [
  { label: 'Semi Repair', href: `/${SEGMENT}/` },
  { label: 'RV Repair', href: `/${RV_SEGMENT}/` },
  { label: 'Services', href: `/${SEGMENT}/services/` },
  { label: 'How it Works', href: `/${SEGMENT}/how-it-works/` },
  { label: 'Fleets', href: 'https://fleet.bigrig.app', external: true },
  { label: 'Mechanics', href: 'https://shop.bigrig.app', external: true },
]

// One header for every directory-tree page (semi-truck + RV): same links in
// the same order everywhere. Desktop shows the links + phone CTA; mobile
// swaps the phone pill for a hamburger (phone CTAs live in banners, chat,
// and the footer, but nav access only lives here). Must render inside
// PhoneProvider (reads the page phone).
export default function SiteHeader() {
  const phone = usePhone()
  const [open, setOpen] = useState(false)
  return (
    <>
      <header className={s.nav}>
        <a className={s.logo} href={MAIN_SITE}>
          <img src="/static/icons/logo-full.svg" alt="RIG" />
        </a>
        <nav className={s.navLinks}>
          {NAV.map((n) =>
            n.external ? (
              <a key={n.label} href={n.href}>
                {n.label}
              </a>
            ) : (
              <Link key={n.label} href={n.href}>
                <a>{n.label}</a>
              </Link>
            )
          )}
        </nav>
        <a className={s.navCta} href={phone.tel} onClick={fireCallConversion}>
          ☎ {phone.display}
        </a>
        <button
          className={s.navBurger}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? '✕' : '☰'}
        </button>
      </header>
      {open && (
        <nav className={s.mobileMenu}>
          {NAV.map((n) =>
            n.external ? (
              <a key={n.label} href={n.href}>
                {n.label}
              </a>
            ) : (
              <Link key={n.label} href={n.href}>
                <a onClick={() => setOpen(false)}>{n.label}</a>
              </Link>
            )
          )}
        </nav>
      )}
    </>
  )
}
