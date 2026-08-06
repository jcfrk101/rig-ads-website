import { createContext, useContext, useEffect, useState } from 'react'
import { PagePhone, TOLLFREE_PHONE, SEO_PHONE } from '../../data/directory/statePhones'
import { fireDniConfig } from '../../utils/gtag'

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

/** SEO number by default; swaps to the page's ads number for ad-click visitors. */
export function usePagePhone(adsPhone: PagePhone): PagePhone {
  const [pagePhone, setPagePhone] = useState<PagePhone>(SEO_PHONE)
  useEffect(() => {
    if (isAdsVisitor()) {
      setPagePhone(adsPhone)
      if (adsPhone.dniLabel) fireDniConfig(adsPhone.dniLabel, adsPhone.display)
    }
  }, [adsPhone.dniLabel, adsPhone.display]) // eslint-disable-line react-hooks/exhaustive-deps
  return pagePhone
}
