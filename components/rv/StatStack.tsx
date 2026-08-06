import s from '../../styles/Directory.module.scss'
import { StatItem } from '../directory/StatStrip'

// Vertical, right-aligned stat cards — the RV hero's right rail (chat takes
// the left). Wider and tighter than the horizontal StatStrip: compact fonts,
// slim padding, pinned to the top of the hero row.
export default function StatStack({ stats }: { stats: StatItem[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        textAlign: 'right',
        marginLeft: 'auto',
        flex: '0 0 auto',
        minWidth: 270,
      }}
    >
      {stats.map((st) => (
        <div
          key={st.label}
          className={st.live ? s.statLive : undefined}
          style={{ background: '#fff', border: '1px solid #dde3e8', borderRadius: 10, padding: '7px 14px' }}
        >
          <div className={s.statK} style={{ fontSize: 10, marginBottom: 2 }}>
            {st.live && <span className={s.pulse} />}
            {st.label}
          </div>
          <div className={s.statV} style={{ fontSize: 18 }}>
            {st.value}
            {st.note && <small>{st.note}</small>}
          </div>
        </div>
      ))}
    </div>
  )
}
