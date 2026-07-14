import s from '../../styles/Directory.module.scss'
import { fireCallConversion } from '../../utils/gtag'
import HowItWorksLink from './HowItWorks'
import { usePhone } from './PhoneContext'

interface Props {
  heading: string
  sub: string
}

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
      <a className={s.dispatchBtn} href={phone.tel} onClick={fireCallConversion}>
        ☎ {phone.display}
      </a>
    </div>
  )
}
