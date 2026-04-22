import LandingPage from '../components/LandingPage'
import { GTAG_CALL_CONVERSION_TOLLFREE } from '../utils/gtag'

export default function RVPage() {
  return (
    <LandingPage
      heroTitle="RV Broke Down?"
      vehicleType="rv"
      pageTitle="RIG — RV Repair & Roadside Assistance | Call 1-855-744-2223"
      pageDescription="RV broke down? RIG dispatches a mechanic in 14 min on average, with an avg cost of $465 — 29% less than industry rates. Call 1-855-744-2223 — available 24/7."
      gtagCallConversionLabel={GTAG_CALL_CONVERSION_TOLLFREE}
    />
  )
}
