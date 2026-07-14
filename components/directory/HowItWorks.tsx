import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import s from '../../styles/Directory.module.scss'
import { SEGMENT, DISPATCH_PHONE_DISPLAY, DISPATCH_PHONE_TEL } from '../../data/directory'
import { fireCallConversion } from '../../utils/gtag'

export const HOW_IT_WORKS_PATH = `/${SEGMENT}/how-it-works/`

export const HOW_IT_WORKS_STEPS = [
  {
    title: 'Call dispatch — 24/7',
    body: 'One call. Tell us where you are (exit, mile marker, or GPS pin), what happened, and what you know. Send pictures if you can — they help mechanics show up with the right parts.',
  },
  {
    title: 'We send it to 5–20 local mechanics',
    body: 'Your breakdown goes out instantly to qualified heavy-duty mechanics near your location — no calling shops one by one, no waiting on callbacks.',
  },
  {
    title: 'They bid back in minutes',
    body: 'Each mechanic replies with their hourly rate, call-out fee, ETA, and other details — upfront, before anyone rolls. The call-out fee is the industry-standard charge that typically covers drive time and initial diagnostics.',
  },
  {
    title: 'Pick one and get rolling',
    body: 'Compare the bids, pick your mechanic, and they head your way. The easiest and fastest way to get back on the road.',
  },
]

export function HowItWorksSteps({ compact }: { compact?: boolean }) {
  return (
    <ol className={compact ? `${s.hiwSteps} ${s.hiwStepsCompact}` : s.hiwSteps}>
      {HOW_IT_WORKS_STEPS.map((st, i) => (
        <li key={i} className={s.hiwStep}>
          <span className={s.hiwNum}>{i + 1}</span>
          <div>
            <b>{st.title}</b>
            <p>{st.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

// Inline link/button that opens the condensed how-it-works popup.
export default function HowItWorksLink({ children, className }: { children?: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button type="button" className={className || s.hiwLink} onClick={() => setOpen(true)}>
        {children || 'How it works →'}
      </button>
      {open && (
        <div className={s.hiwOverlay} onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="How RIG dispatch works">
          <div className={s.hiwModal} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={s.hiwClose} onClick={() => setOpen(false)} aria-label="Close">
              ✕
            </button>
            <h2>How RIG dispatch works</h2>
            <p className={s.hiwLead}>
              In trucking, time is money — a reefer load warming up, a bus full of passengers, a pickup window
              closing. Dispatch gets you bids from local mechanics in minutes.
            </p>
            <HowItWorksSteps compact />
            <a className={s.dispatchBtn} style={{ width: '100%', justifyContent: 'center' }} href={DISPATCH_PHONE_TEL} onClick={fireCallConversion}>
              ☎ {DISPATCH_PHONE_DISPLAY}
            </a>
            <div className={s.hiwMore}>
              <Link href={HOW_IT_WORKS_PATH}>
                <a onClick={() => setOpen(false)}>Read the full explanation →</a>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
