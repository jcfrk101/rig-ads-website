import LandingPage from '../components/LandingPage'
import { GTAG_CALL_CONVERSION_TOLLFREE } from '../utils/gtag'

export default function Home() {
  return <LandingPage gtagCallConversionLabel={GTAG_CALL_CONVERSION_TOLLFREE} />
}
