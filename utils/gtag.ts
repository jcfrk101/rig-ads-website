// Google Ads tag ID — format: AW-XXXXXXXXXX
export const GTAG_ID = process.env.NEXT_PUBLIC_GTAG_ID ?? ''

// Conversion label for the call CTA — format: XXXXXXXXXXXX/YYYYYYYYYYYYYYY
export const GTAG_CALL_CONVERSION = process.env.NEXT_PUBLIC_GTAG_CALL_CONVERSION ?? ''

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

export function fireCallConversion() {
  if (typeof window === 'undefined' || !window.gtag || !GTAG_ID || !GTAG_CALL_CONVERSION) return
  window.gtag('event', 'conversion', {
    send_to: `${GTAG_ID}/${GTAG_CALL_CONVERSION}`,
  })
}
