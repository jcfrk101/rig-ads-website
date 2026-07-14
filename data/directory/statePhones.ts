// State-local phone numbers for directory pages, derived from the existing
// ad-landing-page data (data/stateData.ts) + their DNI conversion labels.
// Pages in a state with a local number show it everywhere (nav, banner,
// listing CTAs, footer) and register it with Google DNI; everything else
// falls back to the toll-free line.
import { STATE_DATA } from '../stateData'
import { STATE_CONVERSION_LABELS } from '../stateConversionLabels'
import { STATES, DISPATCH_PHONE_DISPLAY, DISPATCH_PHONE_TEL } from './index'
import { GTAG_CALL_CONVERSION_TOLLFREE } from '../../utils/gtag'

export interface PagePhone {
  display: string
  tel: string
  dniLabel: string
}

export const TOLLFREE_PHONE: PagePhone = {
  display: DISPATCH_PHONE_DISPLAY,
  tel: DISPATCH_PHONE_TEL,
  dniLabel: GTAG_CALL_CONVERSION_TOLLFREE,
}

// stateData is keyed by full-name slug ("texas"); the directory uses 2-letter
// codes. Match on state name.
const nameToCode = new Map(Object.values(STATES).map((st) => [st.name.toLowerCase(), st.code]))

const byCode = new Map<string, PagePhone>()
for (const s of STATE_DATA) {
  const code = nameToCode.get(s.name.toLowerCase())
  if (!code) continue
  byCode.set(code, {
    display: s.phoneDisplay,
    tel: s.phoneTel,
    dniLabel: STATE_CONVERSION_LABELS[s.slug] || GTAG_CALL_CONVERSION_TOLLFREE,
  })
}

/** Local number for a state, or the toll-free line if we don't have one. */
export const getPhoneForState = (stateCode: string): PagePhone => byCode.get(stateCode) || TOLLFREE_PHONE
