import Link from 'next/link'
import s from '../../styles/Directory.module.scss'
import { pickPhotos } from '../../data/directory/images'
import { NATIONAL_STATS } from '../../data/directory'
import HowItWorksLink, { HOW_IT_WORKS_PATH } from './HowItWorks'
import { usePhone } from './PhoneContext'
import { fireCallConversion } from '../../utils/gtag'

interface Props {
  pageKey: string // stable key for photo rotation, e.g. "hub", "state/tx", "route/i-10"
  placeName?: string // "Texas", "I-10" — used in the heading when present
}

// Condensed 3-bucket version of the dispatch model — the full 5-step story
// lives on the how-it-works page and popup (linked below), so this stays
// deliberately short.
const EXPLAINER_STEPS = [
  {
    title: 'Call',
    body: 'One call, 24/7. Tell us where you are and what happened — send photos if you can.',
  },
  {
    title: 'We send it out',
    body: 'Your breakdown goes to 5–20 qualified local mechanics at once — no calling around.',
  },
  {
    title: 'Pick one',
    body: 'Bids back in minutes with rates and call-out fee upfront. Pick, and they roll.',
  },
]

// Photo strip + condensed dispatch-model explainer for pages that don't show
// mechanic listings directly (segment hub, state hubs, corridors hub, route
// pages). Photos come from data/directory/images.ts.
export default function DispatchExplainer({ pageKey, placeName }: Props) {
  const phone = usePhone()
  const photos = pickPhotos(pageKey, 3)

  return (
    <section className={s.explainer}>
      <div className={s.photoStrip}>
        {photos.map((p) => (
          <img key={p.src} src={p.src} alt={p.alt} loading="lazy" />
        ))}
      </div>

      <div className={s.secTitle} style={{ marginTop: 18 }}>
        How RIG dispatch works{placeName ? ` in ${placeName}` : ''}
      </div>
      <ol className={s.explainerSteps}>
        {EXPLAINER_STEPS.map((st, i) => (
          <li key={i}>
            <span className={s.hiwNum}>{i + 1}</span>
            <div>
              <b>{st.title}</b>
              <p>{st.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className={s.explainerNote}>
        <b>Don&apos;t call a tow first.</b> Most breakdowns get fixed right where the truck sits — RIG mechanics&apos;
        fix rate runs {NATIONAL_STATS.fixRatePct}% — and a tow adds hours and hundreds of dollars.{' '}
        <HowItWorksLink>See the full process →</HowItWorksLink>
      </p>

      <div className={s.explainerCta}>
        <a className={s.dispatchBtn} href={phone.tel} onClick={fireCallConversion}>
          ☎ {phone.display}
        </a>
        <Link href={HOW_IT_WORKS_PATH}>
          <a className={s.btnGhost}>Read the full explanation →</a>
        </Link>
      </div>
    </section>
  )
}
