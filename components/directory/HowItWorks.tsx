import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import s from '../../styles/Directory.module.scss'
import { SEGMENT } from '../../data/directory'
import { usePhone } from './PhoneContext'
import { fireCallConversion } from '../../utils/gtag'
import { openDispatchChat } from '../rv/ChatCta'

export const HOW_IT_WORKS_PATH = `/${SEGMENT}/how-it-works/`

export const HOW_IT_WORKS_STEPS = [
  {
    title: 'Chat or call dispatch — 24/7',
    body: 'Describe it once. Tell us where you are (exit, mile marker, or GPS pin), what happened, and what you know. In chat, drop pictures straight into the thread — they help mechanics show up with the right parts.',
  },
  {
    title: 'We send it to 5–20 local mechanics',
    body: 'We already have the relationships: your breakdown goes out instantly to qualified heavy-duty mechanics near your location. No voicemails, no hold, no calling shops one by one.',
  },
  {
    title: 'They bid back in minutes',
    body: 'Mechanics who can actually roll right now reply with their hourly rate, call-out fee, and a real ETA — upfront, before anyone moves. The call-out fee is the industry-standard charge that typically covers drive time and initial diagnostics.',
  },
  {
    title: 'Pick one and get rolling',
    body: 'Compare the bids, pick your mechanic, and they head your way. The easiest and fastest way to get back on the road.',
  },
  {
    title: 'Easy payment through the app',
    body: 'Pay when the work is done — no extra negotiation on the shoulder, no risk. A protected payment flow for credit cards and EFS Payments.',
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
  const phone = usePhone()
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
            <button
              className={s.dispatchBtn}
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={openDispatchChat}
              type="button"
            >
              💬 Chat with dispatch
            </button>
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 14.5 }}>
              Rather talk?{' '}
              <a href={phone.tel} onClick={fireCallConversion} style={{ fontWeight: 700 }}>
                ☎ {phone.display}
              </a>
            </div>
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
