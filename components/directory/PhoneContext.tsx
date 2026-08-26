import { createContext, useContext, useEffect, useState } from 'react'
import { PagePhone, TOLLFREE_PHONE, SEO_PHONE } from '../../data/directory/statePhones'
import { requestDniNumber } from '../../utils/gtag'

// One phone number per page: state-scoped pages provide their local DNI
// number via the layout; every CTA (nav, banner, listing buttons, footer,
// popup) reads it from here so the page never mixes numbers.
const PhoneContext = createContext<PagePhone>(TOLLFREE_PHONE)

export const PhoneProvider = PhoneContext.Provider
export const usePhone = () => useContext(PhoneContext)

// Attribution split: organic visitors (and crawlers — this is what's in the
// SSR HTML) see the national SEO tracking number on every page. Visitors who
// arrived from a Google Ads click (click-id in the URL, remembered for the
// session) get the page's ads number instead, registered with Google DNI so
// ads call conversions keep flowing into the same per-state actions. The SEO
// number is never registered with DNI, so Google forwarding never routes
// through the SEO tracker and the two call pools stay clean.
const ADS_VISITOR_KEY = 'rigAdsClick'
const isAdsVisitor = () => {
  try {
    const p = new URLSearchParams(window.location.search)
    if (p.has('gclid') || p.has('gbraid') || p.has('wbraid')) {
      sessionStorage.setItem(ADS_VISITOR_KEY, '1')
      return true
    }
    return sessionStorage.getItem(ADS_VISITOR_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * SEO number by default; ad-click visitors get the page's ads number
 * immediately, then Google's forwarding number as soon as DNI answers.
 * The forwarding number lives in React state (not a gtag DOM rewrite), so
 * re-renders can't revert it and render order can't lose it — see
 * requestDniNumber for why the callback form matters.
 */
export function usePagePhone(adsPhone: PagePhone): PagePhone {
  const [pagePhone, setPagePhone] = useState<PagePhone>(SEO_PHONE)
  useEffect(() => {
    if (!isAdsVisitor()) return
    // Ads number right away — if Google never answers (blocked tag, no DNI
    // label), the visitor still sees the paid-pool number, never the SEO one.
    setPagePhone(adsPhone)
    if (!adsPhone.dniLabel) return
    let cancelled = false
    requestDniNumber(adsPhone.dniLabel, adsPhone.display, (formattedNumber, mobileNumber) => {
      if (cancelled || !formattedNumber) return
      const telDigits = String(mobileNumber || formattedNumber).replace(/[^0-9+]/g, '')
      if (!telDigits) return
      setPagePhone({ display: formattedNumber, tel: `tel:${telDigits}`, dniLabel: adsPhone.dniLabel })
    })
    return () => {
      // Page navigated away before the callback — don't stamp this page's
      // forwarding number onto the next page's context.
      cancelled = true
    }
  }, [adsPhone.dniLabel, adsPhone.display]) // eslint-disable-line react-hooks/exhaustive-deps
  return pagePhone
}
