// Google Ads tag ID — format: AW-XXXXXXXXXX
export const GTAG_ID = process.env.NEXT_PUBLIC_GTAG_ID ?? ''

// Legacy click-based call conversion (soft tap event). Kept running in parallel with DNI
// for ~2 weeks so Smart Bidding has overlap data; will be removed after.
export const GTAG_CALL_CONVERSION = process.env.NEXT_PUBLIC_GTAG_CALL_CONVERSION ?? ''

// DNI "calls from a website" label for the toll-free number (1-855-744-2223).
// Used on index.tsx and rv.tsx. State pages have their own labels in stateConversionLabels.ts.
export const GTAG_CALL_CONVERSION_TOLLFREE = process.env.NEXT_PUBLIC_GTAG_CALL_CONVERSION_TOLLFREE ?? ''

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

// Registers the page's phone number with Google's DNI so gtag swaps it to a forwarding
// number and tracks completed calls >=60s as conversions.
export function fireDniConfig(label: string, phoneNumber: string) {
  if (typeof window === 'undefined' || !window.gtag || !GTAG_ID || !label || !phoneNumber) return
  window.gtag('config', `${GTAG_ID}/${label}`, {
    phone_conversion_number: phoneNumber,
  })
}
