import { useEffect, useState } from 'react'

// Ads-click personalization for directory hub pages.
//
// Campaign final-URL suffixes append Google's ValueTrack location IDs to
// every ad click: ?loc={loc_physical_ms}&int={loc_interest_ms}. This hook
// resolves them to a place name client-side, after hydration, from the
// bucketed geo lookup under /static/go-geo/b/ (id % 100 -> ~8KB file), so
// the hero can say "near Amarillo, TX" and point at that city's page.
//
// Organic visitors and crawlers never have the params, never fetch, and
// see the plain SSR page — no split rendering to reason about beyond
// "did the URL carry a location".
export interface AdPlace {
  name: string
  state: string // lowercase code
  citySlug?: string // set when this place has its own directory city page
}

type GeoBucket = Record<string, [string, string] | [string, string, string]>

export default function useAdPlace(): AdPlace | null {
  const [place, setPlace] = useState<AdPlace | null>(null)
  useEffect(() => {
    let cancelled = false
    try {
      const p = new URLSearchParams(window.location.search)
      // Location of interest (from the query text) beats physical location.
      const ids = [p.get('int'), p.get('loc')].filter((v): v is string => !!v && /^\d+$/.test(v))
      if (!ids.length) return
      Promise.all(
        ids.map((id) =>
          fetch(`/static/go-geo/b/${String(Number(id) % 100).padStart(2, '0')}.json`)
            .then((r) => (r.ok ? (r.json() as Promise<GeoBucket>) : null))
            .then((b) => (b && b[id]) || null)
            .catch(() => null)
        )
      ).then((hits) => {
        if (cancelled) return
        const hit = hits.find((h) => h)
        if (hit) setPlace({ name: hit[0], state: hit[1], citySlug: hit[2] })
      })
    } catch {
      /* no personalization */
    }
    return () => {
      cancelled = true
    }
  }, [])
  return place
}
