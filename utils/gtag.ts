// Google Ads tag ID — format: AW-XXXXXXXXXX
export const GTAG_ID = process.env.NEXT_PUBLIC_GTAG_ID ?? ''

// Google Analytics 4 property — shared with the marketing site (rig-marketing-website).
export const GA4_ID = 'G-01P3D7LMSG'

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

// Registers the page's phone number with Google's DNI and asks for the forwarding
// number via callback INSTEAD of letting gtag rewrite the DOM. On a React page,
// gtag's own text replacement is a race twice over: it can scan before React has
// committed the ads number (finds nothing, replaces nothing), and any later
// re-render (useAdPlace resolving, banners) rewrites Google's swapped text back.
// With the callback, the forwarding number goes into React state and React
// renders it everywhere itself — nothing to race, nothing to revert.
// Per Google's docs, providing phone_conversion_callback disables automatic
// DOM replacement, so the two mechanisms never fight.
// Legacy DOM-replacement form, used only by the repair.bigrig.app landing pages
// (LandingPage.tsx): there the ads number is in the SSR HTML before gtag runs and
// the page barely re-renders, so gtag's own text replacement is race-free. New
// directory code must use requestDniNumber instead.
export function fireDniConfig(label: string, phoneNumber: string) {
  if (typeof window === 'undefined' || !window.gtag || !GTAG_ID || !label || !phoneNumber) return
  window.gtag('config', `${GTAG_ID}/${label}`, {
    phone_conversion_number: phoneNumber,
  })
}

export function requestDniNumber(
  label: string,
  phoneNumber: string,
  onNumber: (formattedNumber: string, mobileNumber: string) => void,
) {
  if (typeof window === 'undefined' || !window.gtag || !GTAG_ID || !label || !phoneNumber) return
  window.gtag('config', `${GTAG_ID}/${label}`, {
    phone_conversion_number: phoneNumber,
    phone_conversion_callback: onNumber,
  })
}
