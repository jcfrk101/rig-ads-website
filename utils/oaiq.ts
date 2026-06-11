// OpenAI Ads measurement pixel helpers.
// The loader/init snippet lives in pages/_document.tsx; these helpers fire conversion events.
export const OAIQ_PIXEL_ID = process.env.NEXT_PUBLIC_OAIQ_PIXEL_ID ?? ''

declare global {
  interface Window {
    oaiq?: (...args: any[]) => void
  }
}

// Fire an OpenAI Ads conversion event. The loader installs a queueing stub synchronously,
// so events fired before the SDK finishes loading are buffered rather than dropped.
export function fireOaiqEvent(eventName: string, eventData: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || typeof window.oaiq !== 'function') return
  window.oaiq('measure', eventName, eventData)
}

// Phone-call CTA → lead conversion.
export function fireCallLead() {
  fireOaiqEvent('lead_created', { type: 'customer_action' })
}
