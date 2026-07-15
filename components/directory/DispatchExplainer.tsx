import Link from 'next/link'
import s from '../../styles/Directory.module.scss'
import { pickPhotos } from '../../data/directory/images'
import { HOW_IT_WORKS_STEPS, HOW_IT_WORKS_PATH } from './HowItWorks'
import { usePhone } from './PhoneContext'
import { fireCallConversion } from '../../utils/gtag'

interface Props {
  pageKey: string // stable key for photo rotation, e.g. "hub", "state/tx", "route/i-10"
  placeName?: string // "Texas", "I-10" — used in the heading when present
}

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
        {HOW_IT_WORKS_STEPS.map((st, i) => (
          <li key={i}>
            <span className={s.hiwNum}>{i + 1}</span>
            <div>
              <b>{st.title}</b>
              <p>{st.body}</p>
            </div>
          </li>
        ))}
      </ol>
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
