import s from '../../styles/Directory.module.scss'
import { fireCallConversion } from '../../utils/gtag'
import HowItWorksLink from './HowItWorks'
import { usePhone } from './PhoneContext'
import { openDispatchChat } from '../rv/ChatCta'

interface Props {
  heading: string
  sub: string
}

// Chat leads, phone stays: RIG's pitch is speed + easy, and chat is the
// faster intake (photos, location pin, no hold), so it gets the filled
// button; the number remains one tap away for drivers who'd rather talk.
export default function DispatchBanner({ heading, sub }: Props) {
  const phone = usePhone()
  return (
    <div className={s.dispatchBanner}>
      <div className={s.dispatchText}>
        <b>{heading}</b>
        <span>
          {sub} <HowItWorksLink className={s.hiwLinkOnDark}>How it works →</HowItWorksLink>
        </span>
      </div>
      <div className={s.dispatchCtas}>
        <button className={s.dispatchBtn} onClick={openDispatchChat} type="button">
          💬 Chat with dispatch
        </button>
        <a className={s.dispatchBtnGhost} href={phone.tel} onClick={fireCallConversion}>
          ☎ {phone.display}
        </a>
      </div>
    </div>
  )
}
