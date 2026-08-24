import Link from 'next/link'
import s from '../../styles/Directory.module.scss'
import { pickPhotos } from '../../data/directory/images'
import { DIESEL_ONLY_HEADING } from '../../data/directory'
import { HOW_IT_WORKS_PATH } from './HowItWorks'
import { usePhone } from './PhoneContext'
import { fireCallConversion } from '../../utils/gtag'
import { openDispatchChat } from '../rv/ChatCta'

interface Props {
  pageKey: string // stable key for photo rotation, e.g. "hub", "state/tx", "route/i-10"
  placeName?: string // "Texas", "I-10" — used in the heading when present
}

// Condensed 3-bucket version of the dispatch model — the full 5-step story
// lives on the how-it-works page and popup (linked below), so this stays
// deliberately short.
const EXPLAINER_STEPS = [
  {
    title: 'Chat or call',
    body: 'Start a chat or call, 24/7. Tell us where you are and what happened once — drop in photos if you can.',
  },
  {
    title: 'We send it out',
    body: 'We already have the relationships: your breakdown goes to 5–20 qualified local mechanics at once. No voicemails, no hold, no callbacks.',
  },
  {
    title: 'Pick from several bids',
    body: 'Mechanics who can actually roll right now bid back in minutes — rate, call-out fee, and a real ETA. Pick, and they roll.',
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

      <div className={s.hiwCallout}>
        <b>{DIESEL_ONLY_HEADING}.</b> Big rigs and semi trucks, diesel RVs and motorhomes, diesel pickups
        and work trucks — every mechanic in the network is a diesel mechanic.
      </div>

      <div className={s.explainerCta}>
        <button className={s.dispatchBtn} onClick={openDispatchChat} type="button">
          💬 Chat with dispatch
        </button>
        <a className={s.btnGhost} href={phone.tel} onClick={fireCallConversion}>
          ☎ {phone.display}
        </a>
        <Link href={HOW_IT_WORKS_PATH}>
          <a className={s.btnGhost}>Read the full explanation →</a>
        </Link>
      </div>
    </section>
  )
}
