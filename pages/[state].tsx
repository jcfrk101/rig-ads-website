import { GetStaticPaths, GetStaticProps } from 'next'
import LandingPage from '../components/LandingPage'
import { STATE_DATA, StatePageData } from '../data/stateData'

interface Props {
  state: StatePageData
}

export default function StatePage({ state }: Props) {
  return (
    <LandingPage
      heroTitle={`Truck Down in ${state.name}?`}
      phoneDisplay={state.phoneDisplay}
      phoneTel={state.phoneTel}
      stateName={state.name}
      stateMechanicsCount={state.mechanicsCount}
      stateSvgPath={state.svgPath}
      stateSvgViewBox={state.svgViewBox}
      pageTitle={`Truck Down in ${state.name}? | Truck Repair & Roadside Assistance | Call ${state.phoneDisplay}`}
      pageDescription={`Truck broke down in ${state.name}? RIG has ${state.mechanicsCount}+ mechanics nearby. Avg dispatch in 14 min, avg cost $465 — 29% less than industry. Call ${state.phoneDisplay} — available 24/7.`}
    />
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: STATE_DATA.map((s) => ({ params: { state: s.slug } })),
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const state = STATE_DATA.find((s) => s.slug === params?.state)
  if (!state) return { notFound: true }
  return { props: { state } }
}
