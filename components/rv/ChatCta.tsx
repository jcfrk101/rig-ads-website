import { usePhone } from '../directory/PhoneContext'
import { fireCallConversion } from '../../utils/gtag'

// Chat-forward CTA: styled like a chat input already waiting on the page.
// Clicking anywhere on it opens the breakdown-chat widget (chat-embed.js's
// floating launcher, clicked programmatically). If the widget isn't on the
// page — script blocked, env gate off — it opens the real /help chat page
// instead, so the primary action is always chat, never a disguised call.
// Phone is the quiet secondary path underneath.
const CHAT_ORIGIN = process.env.NEXT_PUBLIC_CHAT_EMBED_ORIGIN || ''

export default function ChatCta({ placeholder }: { placeholder?: string }) {
  const phone = usePhone()

  const openChat = () => {
    // Stable data attribute first; legacy aria-labels cover an older
    // chat-embed.js still cached from before the attribute existed.
    const launcher = document.querySelector<HTMLButtonElement>(
      'button[data-rig-chat-launcher], button[aria-label="Need a Mechanic? Chat Now"], button[aria-label="Chat with Dispatch"]'
    )
    if (launcher) {
      launcher.click()
      return
    }
    // Fallback opens /help in a NEW tab, where this tab's sessionStorage (and
    // the ad click ID chat-embed.js captured into rig-journey) doesn't follow —
    // so carry the click ID in the URL for chat-conversion attribution.
    let query = ''
    try {
      const click = JSON.parse(sessionStorage.getItem('rig-journey') || 'null')?.click
      if (click?.kind && click?.id) query = `?${click.kind}=${encodeURIComponent(click.id)}`
    } catch {}
    window.open(`${CHAT_ORIGIN}/help${query}`, '_blank', 'noopener')
  }

  return (
    <div style={{ marginTop: 18, maxWidth: 560 }}>
      <button
        onClick={openChat}
        aria-label="Open dispatch chat"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          background: '#fff',
          border: '2px solid #e0552b',
          borderRadius: 14,
          padding: '14px 16px',
          cursor: 'text',
          boxShadow: '0 6px 24px rgba(50,62,72,.12)',
          textAlign: 'left',
        }}
      >
        <span aria-hidden style={{ fontSize: 20 }}>💬</span>
        <span style={{ flex: 1, font: '400 15.5px/1.4 inherit', color: '#5c6a76' }}>
          {placeholder || 'Describe the problem — e.g. "blowout on I-70 near the Eisenhower Tunnel"'}
        </span>
        <span
          aria-hidden
          style={{
            background: '#e0552b',
            color: '#fff',
            borderRadius: 10,
            padding: '9px 16px',
            fontWeight: 700,
            fontSize: 14.5,
            whiteSpace: 'nowrap',
          }}
        >
          Chat now
        </span>
      </button>
      <div style={{ marginTop: 8, fontSize: 13.5, color: '#5c6a76' }}>
        Live dispatch, 24/7 — usually minutes to first offers. Prefer to talk?{' '}
        <a href={phone.tel} onClick={fireCallConversion} style={{ fontWeight: 600 }}>
          Call {phone.display}
        </a>
      </div>
    </div>
  )
}
