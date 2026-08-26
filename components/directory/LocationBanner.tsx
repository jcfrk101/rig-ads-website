import Link from 'next/link'
import useAdPlace from './useAdPlace'
import s from '../../styles/Directory.module.scss'

// Ad-click city routing: the ?loc/?int ValueTrack params resolve to a place
// (useAdPlace), and when that place has its own directory city page, this
// banner puts the one-tap link front and center. 41% of ad clicks come from
// a city with a page; the rest see nothing (state hub stays the answer).
// Deliberately a link, not a redirect — the crawled final URL stays honest
// and ClickGuard's params stay intact.
export default function LocationBanner() {
  const place = useAdPlace()
  if (!place?.citySlug) return null
  return (
    <div className={s.locBanner}>
      <span aria-hidden>📍</span>
      <span>
        Looks like you&apos;re near <b>{place.name}, {place.state.toUpperCase()}</b>
      </span>
      <Link href={`/semi-truck-repair/${place.state}/${place.citySlug}/`}>
        <a className={s.locBannerLink}>Mechanics in {place.name} →</a>
      </Link>
    </div>
  )
}
