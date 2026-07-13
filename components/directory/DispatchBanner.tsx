import s from '../../styles/Directory.module.scss'
import { DISPATCH_PHONE_DISPLAY, DISPATCH_PHONE_TEL } from '../../data/directory'
import { fireCallConversion } from '../../utils/gtag'

interface Props {
  heading: string
  sub: string
}

export default function DispatchBanner({ heading, sub }: Props) {
  return (
    <div className={s.dispatchBanner}>
      <div className={s.dispatchText}>
        <b>{heading}</b>
        <span>{sub}</span>
      </div>
      <a className={s.dispatchBtn} href={DISPATCH_PHONE_TEL} onClick={fireCallConversion}>
        ☎ {DISPATCH_PHONE_DISPLAY}
      </a>
    </div>
  )
}
