import s from '../../styles/Directory.module.scss'

export interface StatItem {
  label: string
  value: string
  note?: string
  live?: boolean
}

export default function StatStrip({ stats }: { stats: StatItem[] }) {
  return (
    <div className={s.statstrip}>
      {stats.map((st) => (
        <div key={st.label} className={st.live ? `${s.stat} ${s.statLive}` : s.stat}>
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
