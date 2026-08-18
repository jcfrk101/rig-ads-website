// Public work feed for directory pages — fetched at BUILD time (pages are
// static, rebuilt nightly by the scheduler), so the items are baked into the
// HTML: real, dispatcher-approved content on the pages Google indexes.
// Any fetch problem yields [] and the section simply doesn't render.
export interface FeedItem {
  item_id: string
  type: 'JOB_REQUESTED' | 'JOB_COMPLETED'
  service_type?: string | null
  vehicle?: string | null
  city?: string | null
  state?: string | null
  event_at_epoch?: number | null
  description?: string | null
  photo_urls?: string[] | null
}

const API = process.env.RIG_API_URL || 'https://api.bigrig.app'

export async function fetchFeed(opts: { state?: string; service?: string; limit?: number } = {}): Promise<FeedItem[]> {
  const params = new URLSearchParams()
  if (opts.state) params.set('state', opts.state)
  if (opts.service) params.set('service', opts.service)
  params.set('limit', String(opts.limit ?? 30))
  try {
    const res = await fetch(`${API}/feed/public?${params}`)
    if (!res.ok) return []
    const body = await res.json()
    const data = body && typeof body === 'object' && 'data' in body ? body.data : body
    return Array.isArray(data) ? (data as FeedItem[]) : []
  } catch {
    return []
  }
}

/** State-scoped feed with a network-wide fallback so the section is never empty. */
export async function fetchStateFeed(state: string): Promise<{ items: FeedItem[]; scope: 'state' | 'network' }> {
  const local = await fetchFeed({ state, limit: 30 })
  if (local.length >= 3) return { items: local, scope: 'state' }
  const national = await fetchFeed({ limit: 30 })
  return { items: [...local, ...national.filter((n) => !local.some((l) => l.item_id === n.item_id))], scope: local.length ? 'state' : 'network' }
}

const SERVICE_LABEL: Record<string, string> = { mobile_service: 'Mobile repair', tire_change: 'Tire service', tow_service: 'Towing' }
export const serviceLabel = (s?: string | null) => (s ? SERVICE_LABEL[s] ?? s.replace(/_/g, ' ') : 'Mobile repair')

export function placeOf(i: FeedItem): string {
  const city = i.city && !/^(n\/a|na|none|unknown|null)$/i.test(i.city.trim()) ? i.city.trim() : ''
  return [city, i.state].filter(Boolean).join(', ')
}

/** Baked at build time, so an absolute short date — never "2h ago". */
export const shortDate = (epoch?: number | null) =>
  epoch ? new Date(epoch * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' }) : ''
