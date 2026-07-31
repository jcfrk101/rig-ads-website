import Link from 'next/link'
import DirectoryLayout from '../../../components/directory/DirectoryLayout'
import DispatchBanner from '../../../components/directory/DispatchBanner'
import s from '../../../styles/Directory.module.scss'
import { SEGMENT } from '../../../data/directory'
import { SEO_PHONE } from '../../../data/directory/statePhones'
import { DIRECTORY_SERVICES, servicePath } from '../../../data/directory/services'

export default function ServicesHub() {
  const title = 'Mobile Truck Repair Services — Tires, Brakes, Regen, Towing & More | RIG'
  const description = `Every roadside service RIG dispatches, 24/7: tire change, mobile repair, air brakes, DPF/regen, jump starts, trailer and reefer repair, towing, and maintenance. Call ${SEO_PHONE.display}.`

  return (
    <DirectoryLayout
      title={title}
      description={description}
      path={`/${SEGMENT}/services/`}
      crumbs={[{ label: 'Semi Truck Repair', href: `/${SEGMENT}/` }, { label: 'Services' }]}
      footnote="Service availability varies by mechanic; every bid shows the mechanic's services, rates, and call-out fee upfront."
    >
      <div className={s.pageHero}>
        <h1>Mobile Truck Repair Services</h1>
        <p className={s.sub}>
          Whatever put the truck on the shoulder, one call covers it — RIG dispatches the closest qualified
          mechanic for the job. Most of these are fixed right where the truck sits. Anything diesel — and
          only diesel: big rigs, diesel RVs, diesel pickups.
        </p>
      </div>

      <DispatchBanner
        heading="Not sure which service you need?"
        sub="Describe what happened — dispatch figures out the rest and sends mechanics with the right parts."
      />

      <div className={s.hubSection}>
        <div className={s.serviceGrid}>
          {DIRECTORY_SERVICES.map((svc) => (
            <Link key={svc.slug} href={servicePath(svc.slug)}>
              <a className={s.serviceCard}>
                <b>{svc.name}</b>
                <p>{svc.short}</p>
                <span>Learn more →</span>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </DirectoryLayout>
  )
}
