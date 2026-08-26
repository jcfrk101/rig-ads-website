import Link from 'next/link'
import { useMemo, useState } from 'react'
import s from '../../styles/Directory.module.scss'
import { MechanicListing } from '../../data/directory/mechanics'
import { openDispatchChat } from '../rv/ChatCta'
import HowItWorksLink from './HowItWorks'

interface Props {
  mechanics: MechanicListing[]
  placeName: string // "Dallas" or "I-10 in Alabama"
  note: string // the green "how RIG works" banner text (bolded lead handled here)
  noteLead: string
}

export default function ListingSection({ mechanics, placeName, note, noteLead }: Props) {
  const allServices = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of mechanics) for (const svc of m.services) counts.set(svc, (counts.get(svc) || 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [mechanics])

  const [serviceFilter, setServiceFilter] = useState<string[]>([])
  const [rigOnly, setRigOnly] = useState(false)
  const [open247Only, setOpen247Only] = useState(false)
  // on mobile the filter panel collapses behind a toggle so listings stay
  // right under the dispatch banner
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilterCount = serviceFilter.length + Number(rigOnly) + Number(open247Only)

  const shown = mechanics.filter(
    (m) =>
      (!rigOnly || m.rigNetwork) &&
      (!open247Only || m.open247) &&
      (serviceFilter.length === 0 || serviceFilter.some((f) => m.services.includes(f)))
  )

  const toggleService = (svc: string) =>
    setServiceFilter((cur) => (cur.includes(svc) ? cur.filter((x) => x !== svc) : [...cur, svc]))

  return (
    <div className={s.body}>
      <button type="button" className={s.filterToggle} onClick={() => setFiltersOpen(!filtersOpen)}>
        {filtersOpen ? 'Hide filters' : 'Filter'}
        {activeFilterCount > 0 && ` (${activeFilterCount})`} {filtersOpen ? '▴' : '▾'}
      </button>
      <aside className={filtersOpen ? `${s.filters} ${s.filtersOpen}` : s.filters}>
        <h3>Filter</h3>
        <div className={s.fgroup}>
          <div className={s.fgroupLbl}>Service needed</div>
          {allServices.map(([svc, count]) => (
            <label key={svc} className={s.chk}>
              <input type="checkbox" checked={serviceFilter.includes(svc)} onChange={() => toggleService(svc)} />
              {svc} <span className={s.chkCount}>{count}</span>
            </label>
          ))}
        </div>
        <div className={s.fgroup}>
          <div className={s.fgroupLbl}>Network</div>
          <label className={s.chk}>
            <input type="checkbox" checked={rigOnly} onChange={() => setRigOnly(!rigOnly)} />
            RIG mechanics only
            <span className={s.chkCount}>{mechanics.filter((m) => m.rigNetwork).length}</span>
          </label>
        </div>
        <div className={s.fgroup}>
          <div className={s.fgroupLbl}>Availability</div>
          <label className={s.chk}>
            <input type="checkbox" checked={open247Only} onChange={() => setOpen247Only(!open247Only)} />
            Open 24/7
            <span className={s.chkCount}>{mechanics.filter((m) => m.open247).length}</span>
          </label>
        </div>
      </aside>

      <main className={s.listings}>
        <div className={s.listingHead}>
          <div className={s.listingCount}>
            <b>{shown.length}</b> mechanics &amp; shops — {placeName}
          </div>
        </div>

        <div className={s.bannerNote}>
          <span>ⓘ</span>
          <div>
            <b>{noteLead}</b> {note} <HowItWorksLink>See how dispatch works →</HowItWorksLink>
          </div>
        </div>

        {shown.map((m) => (
          <div key={m.id} className={s.cardRow}>
            <div className={m.rigNetwork ? s.thumb : s.thumbListed}>
              {m.avatarUrl ? <img src={m.avatarUrl} alt={m.name} /> : m.initials}
            </div>
            <div className={s.cinfo}>
              <div className={s.cname}>
                {m.name}
                {m.rigNetwork ? (
                  <span className={s.tagRig}>RIG network</span>
                ) : (
                  <span className={s.tagListed}>Listed shop</span>
                )}
                {m.insured && <span className={s.tagVerified}>✓ Insured</span>}
              </div>
              <div className={s.cmeta}>
                {m.ratingCount > 0 ? (
                  <>
                    <span className={s.thumbs}>👍 {m.thumbsUpPct}%</span> ({m.ratingCount}) ·{' '}
                  </>
                ) : null}
                {m.distanceMi} mi · {m.open247 ? 'Open 24/7' : 'Business hours'}
              </div>
              <div className={s.cmetrics}>
                {[
                  m.jobsCompleted > 0 ? `${m.jobsCompleted} jobs` : 'New to RIG',
                  m.ratingCount > 0 && m.fixRatePct > 0 ? `${m.fixRatePct}% fix rate` : null,
                  m.ratingCount > 0 && m.onTimePct > 0 ? `${m.onTimePct}% on time` : null,
                  m.hourlyRate ? `$${m.hourlyRate}/hr` : null,
                  m.avgResponseMin ? `responds ~${m.avgResponseMin} min` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
              <div className={s.svc}>
                {m.services.map((svc) => (
                  <span key={svc}>{svc}</span>
                ))}
              </div>
            </div>
            <div className={s.cactions}>
              {m.rigNetwork ? (
                <>
                  <div className={s.eta}>~{m.etaMin} min ETA</div>
                  <button className={s.btnDispatch} onClick={openDispatchChat} type="button">
                    💬 Request dispatch
                  </button>
                </>
              ) : (
                <>
                  <div className={s.etaMuted}>Not in dispatch</div>
                  <button className={s.btnDispatch} onClick={openDispatchChat} type="button">
                    💬 Find closest instead
                  </button>
                </>
              )}
              {m.profilePath && (
                <Link href={m.profilePath}>
                  <a className={s.btnGhost}>View profile</a>
                </Link>
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
