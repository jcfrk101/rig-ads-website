import { FeedItem, placeOf, serviceLabel, shortDate } from '../../data/feed'
import s from '../../styles/Directory.module.scss'

// "Recent RIG work" section for directory hubs: completed jobs as cards
// (dispatcher-approved photo + write-up), fresh requests as a compact
// activity list. Baked at build time (nightly rebuild) — see data/feed.
interface Props {
  items: FeedItem[]
  scope: 'state' | 'network'
  placeName: string // "Texas"
  moreHref?: string // public feed page
}

export default function WorkFeedStrip({ items, scope, placeName, moreHref = 'https://bigrig.app/feed/' }: Props) {
  const completed = items.filter((i) => i.type === 'JOB_COMPLETED').slice(0, 4)
  const requested = items.filter((i) => i.type === 'JOB_REQUESTED').slice(0, 6)
  if (!completed.length && !requested.length) return null
  const title = scope === 'state' ? `Recent RIG work in ${placeName}` : `Recent RIG work across the network`
  return (
    <section className={s.hubSection}>
      <div className={s.secTitle}>{title}</div>
      <p style={{ margin: '0 0 12px', fontSize: 13.5, color: '#5c6a76' }}>
        Real jobs dispatched through RIG — details shared only after a dispatcher reviews them.{' '}
        <a href={moreHref} style={{ fontWeight: 600 }}>
          See the full feed →
        </a>
      </p>
      {completed.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 14 }}>
          {completed.map((i) => {
            const photo = i.photo_urls?.[0]
            const place = placeOf(i)
            return (
              <article key={i.item_id} style={{ background: '#fff', border: '1px solid #dde3e8', borderRadius: 12, overflow: 'hidden' }}>
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" loading="lazy" style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                )}
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11.5, marginBottom: 6 }}>
                    <span style={{ background: 'rgba(10,220,106,.15)', color: '#0b7a3f', fontWeight: 700, borderRadius: 999, padding: '2px 8px' }}>✓ Completed</span>
                    <span style={{ color: '#5c6a76' }}>{serviceLabel(i.service_type)}</span>
                    <span style={{ marginLeft: 'auto', color: '#8b8c8c' }}>{shortDate(i.event_at_epoch)}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#222b32', marginBottom: 4 }}>
                    {[i.vehicle, place].filter(Boolean).join(' · ') || place}
                  </div>
                  {i.description && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#4f4f4f' }}>{i.description}</p>}
                </div>
              </article>
            )
          })}
        </div>
      )}
      {requested.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: '2px 14px', background: '#fff', border: '1px solid #dde3e8', borderRadius: 12 }}>
          {requested.map((i) => {
            const place = placeOf(i)
            return (
              <li key={i.item_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #eef1f4', fontSize: 13.5 }}>
                <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: '#0adc6a', flexShrink: 0 }} />
                <span style={{ color: '#323e48' }}>
                  <b>{serviceLabel(i.service_type)}</b> requested{place ? ` in ${place}` : ''} — mechanics bidding
                </span>
                <span style={{ marginLeft: 'auto', color: '#8b8c8c', fontSize: 12, flexShrink: 0 }}>{shortDate(i.event_at_epoch)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
