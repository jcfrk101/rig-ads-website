import { usePhone } from '../directory/PhoneContext'
import { fireCallConversion } from '../../utils/gtag'
import s from '../../styles/Directory.module.scss'

// Chat-first CTA pair. "Chat with Dispatch" opens the breakdown-chat embed
// (public/chat-embed.js on the marketing service adds a floating launcher
// button; we click it programmatically). When the embed isn't loaded — env
// gate off, script blocked — the button falls back to the phone number, so
// the CTA is never a dead end.
export default function ChatCta({ context }: { context?: string }) {
  const phone = usePhone()

  const openChat = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const launcher = document.querySelector<HTMLButtonElement>('button[aria-label="Chat with Dispatch"]')
    if (launcher) {
      e.preventDefault()
      launcher.click()
    }
    // no launcher -> follow the tel: href fallback
  }

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 18 }}>
      <a className={s.dispatchBtn} href={phone.tel} onClick={openChat} style={{ fontSize: 17, padding: '14px 26px' }}>
        💬 Chat with Dispatch{context ? ` — ${context}` : ''}
      </a>
      <a className={s.btnGhost} href={phone.tel} onClick={fireCallConversion}>
        or call {phone.display}
      </a>
    </div>
  )
}
