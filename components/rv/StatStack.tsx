import s from '../../styles/Directory.module.scss'
import { StatItem } from '../directory/StatStrip'

// Vertical, right-aligned stat cards — the RV hero's right rail (chat takes
// the left). Reuses the StatStrip typography classes so the numbers read the
// same across both trees.
export default function StatStack({ stats }: { stats: StatItem[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        justifyContent: 'center',
        textAlign: 'right',
        marginLeft: 'auto',
        flex: '0 0 auto',
        minWidth: 180,
      }}
    >
      {stats.map((st) => (
        <div
          key={st.label}
          className={st.live ? s.statLive : undefined}
          style={{ background: '#fff', border: '1px solid #dde3e8', borderRadius: 11, padding: '10px 16px' }}
        >
          <div className={s.statK}>
            {st.live && <span className={s.pulse} />}
            {st.label}
          </div>
          <div className={s.statV}>
            {st.value}
            {st.note && <small>{st.note}</small>}
          </div>
        </div>
      ))}
    </div>
  )
}
