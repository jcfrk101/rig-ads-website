import Link from 'next/link'
import DirectoryLayout from '../../../components/directory/DirectoryLayout'
import DispatchBanner from '../../../components/directory/DispatchBanner'
import s from '../../../styles/Directory.module.scss'
import { SEGMENT, DISPATCH_PHONE_DISPLAY, getRoutes, getCorridorsByRoute, routePath, corridorPath } from '../../../data/directory'
import { isCorridorCovered, isRouteCovered } from '../../../data/directory/mechanics'

export default function CorridorsHub() {
  const routes = getRoutes().filter(isRouteCovered)
  const title = 'Interstate Truck Breakdown Coverage by Corridor | RIG'
  const description = `Broke down on the interstate? RIG covers every major US freight corridor with 24/7 mobile diesel mechanics dispatched to your mile marker. Call ${DISPATCH_PHONE_DISPLAY}.`

  return (
    <DirectoryLayout
      title={title}
      description={description}
      path={`/${SEGMENT}/corridors/`}
      crumbs={[{ label: 'Semi Truck Repair', href: `/${SEGMENT}/` }, { label: 'Corridors' }]}
      footnote="Corridor pages cover each interstate state-by-state. RIG routes the nearest available mechanic to your mile marker."
    >
      <div className={s.pageHero}>
        <h1>Truck Breakdown Coverage by Interstate</h1>
        <p className={s.sub}>
          Every major US freight corridor, state by state. Find your interstate — or just call with your mile
          marker and we&apos;ll dispatch the closest available mechanic.
        </p>
      </div>

      <DispatchBanner
        heading="On the shoulder right now?"
        sub="Give us your interstate and mile marker — we dispatch the nearest available mechanic to your exact location."
      />

      <div className={s.hubSection}>
        {routes.map((r) => {
          const segs = getCorridorsByRoute(r).filter((c) => isCorridorCovered(c.route, c.state))
          return (
            <div key={r}>
              <div className={s.secTitle}>
                <Link href={routePath(r)}>
                  <a>{r.toUpperCase()}</a>
                </Link>
              </div>
              <div className={s.chipRow} style={{ marginBottom: 14 }}>
                {segs.map((c) => (
                  <Link key={c.state} href={corridorPath(c.route, c.state)}>
                    <a className={s.chip}>{c.stateName}</a>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </DirectoryLayout>
  )
}
