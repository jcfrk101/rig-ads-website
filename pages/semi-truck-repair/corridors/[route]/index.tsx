import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import DirectoryLayout from '../../../../components/directory/DirectoryLayout'
import DispatchBanner from '../../../../components/directory/DispatchBanner'
import s from '../../../../styles/Directory.module.scss'
import {
  SEGMENT,
  DISPATCH_PHONE_DISPLAY,
  DirectoryCorridor,
  getRoutes,
  getCorridorsByRoute,
  getCorridorMeta,
  corridorPath,
} from '../../../../data/directory'

interface Props {
  route: string
  segments: DirectoryCorridor[] // ordered along the route where metadata allows
}

// Order a route's state segments by walking the neighbors chain from the
// segment no other segment points to; falls back to given order if the chain
// is incomplete.
function orderSegments(route: string, segs: DirectoryCorridor[]): DirectoryCorridor[] {
  const byState = new Map(segs.map((c) => [c.state, c]))
  const pointedTo = new Set<string>()
  for (const c of segs) {
    const next = getCorridorMeta(route, c.state)?.neighbors.next
    if (next) pointedTo.add(next)
  }
  let start = segs.find((c) => !pointedTo.has(c.state))
  if (!start) return segs
  const ordered: DirectoryCorridor[] = []
  const seen = new Set<string>()
  let cur: DirectoryCorridor | undefined = start
  while (cur && !seen.has(cur.state)) {
    ordered.push(cur)
    seen.add(cur.state)
    const next: string | null | undefined = getCorridorMeta(route, cur.state)?.neighbors.next
    cur = next ? byState.get(next) : undefined
  }
  for (const c of segs) if (!seen.has(c.state)) ordered.push(c)
  return ordered
}

export default function RoutePage({ route, segments }: Props) {
  const rd = route.toUpperCase()
  const title = `${rd} Truck Breakdown Coverage, State by State | RIG`
  const description = `Broke down on ${rd}? RIG covers the full corridor with 24/7 mobile diesel mechanics dispatched to your mile marker, in every state ${rd} crosses. Call ${DISPATCH_PHONE_DISPLAY}.`

  return (
    <DirectoryLayout
      title={title}
      description={description}
      path={`/${SEGMENT}/corridors/${route}/`}
      crumbs={[
        { label: 'Semi Truck Repair', href: `/${SEGMENT}/` },
        { label: 'Corridors', href: `/${SEGMENT}/corridors/` },
        { label: rd },
      ]}
      footnote={`${rd} corridor coverage, state by state. RIG routes the nearest available mechanic to your mile marker.`}
    >
      <div className={s.corridorStrip}>
        <span className={s.shield}>{rd}</span>
        <span>{segments.length} states covered</span>
      </div>

      <div className={s.pageHero} style={{ borderTop: '1px solid #dfe4e8', marginTop: 16 }}>
        <h1>Truck Breakdown on {rd}?</h1>
        <p className={s.sub}>
          Pick the state you&apos;re in — or just call with your mile marker and we&apos;ll dispatch the closest
          available mechanic on {rd}.
        </p>
      </div>

      <DispatchBanner
        heading={`Stopped on ${rd} right now?`}
        sub="Call with your mile marker — we dispatch the nearest available mechanic to your exact location, 24/7."
      />

      <div className={s.hubSection}>
        <div className={s.secTitle}>{rd} by state</div>
        <div className={s.linkGrid}>
          {segments.map((c) => (
            <Link key={c.state} href={corridorPath(c.route, c.state)}>
              <a className={s.linkCard}>
                {c.stateName} <small>{getCorridorMeta(route, c.state) ? `≈${getCorridorMeta(route, c.state)!.approxMiles} mi` : ''}</small>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </DirectoryLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getRoutes().map((route) => ({ params: { route } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const route = String(params?.route)
  const segments = getCorridorsByRoute(route)
  if (segments.length === 0) return { notFound: true }
  return { props: { route, segments: orderSegments(route, segments) } }
}
