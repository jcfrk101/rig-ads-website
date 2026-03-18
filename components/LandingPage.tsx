import React, { FunctionComponent, useEffect, useState } from 'react'
import Head from 'next/head'
import { Box, Container, Typography, useMediaQuery } from '@mui/material'
import { fireCallConversion } from '../utils/gtag'

const CAROUSEL_IMAGES = [
  'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/04cb11a1-9b13-43aa-ba10-8c1a12abdbea/service_image_2.jpg',
  'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/79b74ef3-0410-4284-b7ac-bbe9781b757e/service_image_10.jpg',
  'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/75552956-8ed6-441e-bfc1-4eabc20d9ac0/service_image_9.jpg',
  'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/9f2b4605-1145-44f5-8b77-5c67b8b5328f/service_image_8.jpg',
  'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/434f05f0-f011-4e44-ae85-f1fc2ddb4755/serivce_image_3.jpg',
  'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/55607965-dc03-475b-a828-f3624d0ca4b3/service_image_7.jpg',
  'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/6cc306b7-c3ca-4e00-b4b1-71a2c7e4ceec/service_image_6.jpg',
  'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/09b1b347-aba9-452e-8760-bea38045c8f6/service_image_5.jpg',
  'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/6d77153c-e4c3-4cc6-9450-6afbd97d8cfa/service_image_4.jpg',
  'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/3584a1c1-93a3-43a4-a5cf-7c5c84fd2a81/service_image_1.jpg',
]

const INDUSTRY_TIME_TO_DISPATCH = 37
const INDUSTRY_AVG_COST = 650
const INDUSTRY_TIME_TO_ARRIVAL = 60

interface ServiceMetrics {
  avg_time_to_first_offer_minutes: number
  avg_completed_offer_cost: number
  avg_time_to_arrival: number
  total_completed_service_requests: number
  first_service_request_date: string
}

function formatArrivalTime(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

function formatComparison(
  rigValue: number,
  industryValue: number,
  lowerIsBetter: boolean,
  ratioPrecision = 0,
  percentOnly = false,
): string {
  const ratio = lowerIsBetter ? industryValue / rigValue : rigValue / industryValue
  const improvementPct = lowerIsBetter
    ? ((industryValue - rigValue) / rigValue) * 100
    : ((rigValue - industryValue) / industryValue) * 100

  if (improvementPct > 100 && !percentOnly) {
    const factor = Math.pow(10, ratioPrecision)
    return `${Math.round(ratio * factor) / factor}x`
  }

  if (lowerIsBetter) {
    const savePct = Math.floor(((industryValue - rigValue) / industryValue) * 100)
    return percentOnly ? `${savePct}%` : `${savePct}% less`
  }

  return percentOnly ? `${Math.floor(improvementPct)}%` : `${Math.floor(improvementPct)}% more`
}

interface MetricPanelProps {
  label: string
  rigValue: string
  industryLabel: string
  comparison: string
  comparisonSuffix: string
  iconSrc: string
  iconScale?: number
  accentColor: string
  borderRight?: boolean
  borderBottom?: boolean
  isMobile: boolean
}

const MetricPanel: FunctionComponent<MetricPanelProps> = ({
  label,
  rigValue,
  industryLabel,
  comparison,
  comparisonSuffix,
  iconSrc,
  iconScale = 1,
  accentColor,
  borderRight,
  borderBottom,
  isMobile,
}) => (
  <Box
    style={{
      flex: 1,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: isMobile ? '40px 24px' : '48px 32px',
      borderRight: borderRight && !isMobile ? '1px solid rgba(255,255,255,0.08)' : 'none',
      borderBottom: borderBottom && isMobile ? '1px solid rgba(255,255,255,0.08)' : 'none',
      overflow: 'hidden',
      textAlign: 'center',
    }}
  >
    <img
      src={iconSrc}
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: isMobile ? `${220 * iconScale}px` : `${320 * iconScale}px`,
        height: isMobile ? `${220 * iconScale}px` : `${320 * iconScale}px`,
        opacity: 0.04,
        right: '-40px',
        bottom: '20px',
        filter: 'invert(1)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    />
    <Typography
      style={{
        color: 'rgba(255,255,255,0.45)',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: '24px',
      }}
    >
      {label}
    </Typography>
    <Typography
      style={{
        color: accentColor,
        fontSize: isMobile ? '4.5rem' : '6.5rem',
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: '-0.03em',
        marginBottom: '8px',
      }}
    >
      {comparison}
    </Typography>
    <Typography
      style={{
        color: 'rgba(255,255,255,0.55)',
        fontSize: isMobile ? '1.1rem' : '1.4rem',
        fontWeight: 500,
        letterSpacing: '-0.01em',
        marginBottom: '36px',
      }}
    >
      {comparisonSuffix}
    </Typography>
    <Box style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '24px', justifyContent: 'center' }}>
      <Box style={{ textAlign: 'center' }}>
        <Typography
          style={{
            color: '#ffffff',
            fontSize: isMobile ? '1.4rem' : '1.75rem',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {rigValue}
        </Typography>
        <Typography
          style={{ color: '#ffffff', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '4px' }}
        >
          RIG
        </Typography>
      </Box>
      <Box style={{ textAlign: 'center' }}>
        <Typography
          style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: isMobile ? '1.4rem' : '1.75rem',
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {industryLabel}
        </Typography>
        <Typography
          style={{
            color: 'rgba(255,255,255,0.2)',
            fontSize: '0.8rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginTop: '4px',
          }}
        >
          Industry
        </Typography>
      </Box>
    </Box>
  </Box>
)

interface CallButtonProps {
  size?: 'large' | 'hero'
  isMobile?: boolean
  phoneDisplay: string
  phoneTel: string
}

const CallButton: FunctionComponent<CallButtonProps> = ({ size = 'large', isMobile = false, phoneDisplay, phoneTel }) => {
  const isHero = size === 'hero'
  return (
    <Box
      component="a"
      href={phoneTel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: '#0ADC6A',
        color: '#000000',
        borderRadius: '12px',
        padding: isHero ? (isMobile ? '20px 32px' : '24px 48px') : '16px 32px',
        fontFamily: 'inherit',
        fontWeight: 800,
        fontSize: isHero ? (isMobile ? '1.5rem' : '2rem') : '1.25rem',
        letterSpacing: '-0.01em',
        textDecoration: 'none',
        boxShadow: '0 8px 32px rgba(10,220,106,0.35)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        cursor: 'pointer',
      }}
      onClick={fireCallConversion}
      onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(10,220,106,0.45)'
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(10,220,106,0.35)'
      }}
    >
      <img src="/static/icons/phone.svg" alt="" style={{ width: isHero ? '28px' : '22px', height: isHero ? '28px' : '22px', filter: 'brightness(0)' }} />
      {phoneDisplay}
    </Box>
  )
}

export interface LandingPageProps {
  phoneDisplay?: string
  phoneTel?: string
  heroTitle?: string
  stateName?: string
  stateMechanicsCount?: number
  stateSvgPath?: string
  stateSvgViewBox?: string
  pageTitle?: string
  pageDescription?: string
  vehicleType?: 'truck' | 'rv'
}

export default function LandingPage({
  phoneDisplay = '1-855-744-2223',
  phoneTel = 'tel:18557442223',
  heroTitle = 'Truck Broke Down?',
  stateName,
  stateMechanicsCount,
  stateSvgPath,
  stateSvgViewBox,
  pageTitle,
  pageDescription,
  vehicleType = 'truck',
}: LandingPageProps) {
  const isRV = vehicleType === 'rv'
  const isMobile = useMediaQuery('(max-width:768px)')
  const [metrics, setMetrics] = useState<ServiceMetrics | null>(null)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.bigrig.app'
    fetch(`${apiUrl}/admin/a52d35fa-b696-4a13-93e6-a31f4f98d9a7/service/metrics`)
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) setMetrics(json.data)
      })
      .catch(() => {})
  }, [])

  const rigTimeToDispatch = metrics ? Math.round(metrics.avg_time_to_first_offer_minutes * 10) / 10 : 14.1
  const rigAvgCost = metrics ? Math.floor(metrics.avg_completed_offer_cost) : 465
  const rigTimeToArrivalMinutes = metrics ? Math.floor(metrics.avg_time_to_arrival / 60) : 39
  const rigTimeToArrivalDisplay = metrics ? formatArrivalTime(metrics.avg_time_to_arrival) : '39 min'
  const trucksServiced =
    metrics?.total_completed_service_requests != null ? metrics.total_completed_service_requests.toLocaleString() : '2,945'
  const servicingSince = metrics
    ? new Date(metrics.first_service_request_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'August 24, 2022'

  const resolvedTitle = pageTitle ?? 'RIG — Truck Repair & Roadside Assistance | Call 1-855-744-2223'
  const resolvedDescription =
    pageDescription ??
    'Truck broke down? RIG dispatches a mechanic in 14 min on average, with an avg cost of $465 — 29% less than industry rates. Call 1-855-744-2223 — available 24/7.'

  const vehicleLabel = isRV ? 'RV' : 'Truck'
  const mechanicsLabel = stateName && stateMechanicsCount ? `${stateMechanicsCount}+ Mechanics in ${stateName}` : isRV ? '6,000+ RV Mechanics Nationwide' : '6,000+ Mechanics Nationwide'
  const mechanicsDesc =
    stateName && stateMechanicsCount
      ? `Access our network of ${stateMechanicsCount}+ verified mechanics and shops across ${stateName}.`
      : isRV
      ? 'Access our network of verified RV mechanics and service shops across every major route in the US.'
      : 'Access our network of verified mechanics and shops across every major route in the US.'

  const bottomCtaTitle = stateName ? `${vehicleLabel} down in ${stateName}?` : `${vehicleLabel} down on the road?`
  const bottomCtaBody =
    stateName && stateMechanicsCount
      ? `${stateMechanicsCount}+ nearby mechanics in ${stateName} are ready to help right now.`
      : isRV
      ? 'One call connects you to thousands of nearby RV mechanics ready to help right now.'
      : 'One call connects you to thousands of nearby mechanics ready to help right now.'

  return (
    <>
      <Head>
        <title>{resolvedTitle}</title>
        <meta name="description" content={resolvedDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={resolvedTitle} />
        <meta property="og:description" content={resolvedDescription} />
        <meta property="og:type" content="website" />
      </Head>

      <Container disableGutters maxWidth={false}>

        {/* ─── HERO + METRICS (dark background) ─── */}
        <Box style={{ backgroundColor: '#323E48', width: '100%' }}>

          {/* Hero area — silhouette is clipped here, does not bleed into metrics */}
          <Box style={{ position: 'relative', overflow: 'hidden' }}>

            {/* State silhouette */}
            {stateSvgPath && stateSvgViewBox && (
              <svg
                viewBox={stateSvgViewBox}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-30%, -50%)',
                  height: isMobile ? '55%' : '78%',
                  width: 'auto',
                  opacity: 0.07,
                  fill: '#ffffff',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                <path d={stateSvgPath} />
              </svg>
            )}

          {/* Nav bar */}
          <Box
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isMobile ? '20px 20px 0' : '24px 48px 0',
              position: 'relative',
            }}
          >
            <img
              src="/static/icons/logo-full.svg"
              alt="RIG Logo"
              style={{ height: isMobile ? '36px' : '48px', width: 'auto' }}
            />
            <Box
              component="a"
              href={phoneTel}
              onClick={fireCallConversion}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0ADC6A',
                color: '#000000',
                borderRadius: '8px',
                padding: isMobile ? '10px 16px' : '12px 24px',
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <img src="/static/icons/phone.svg" alt="" style={{ width: '16px', height: '16px', filter: 'brightness(0)' }} />
              {isMobile ? 'Call Now' : phoneDisplay}
            </Box>
          </Box>

          {/* Hero content */}
          <Box
            style={{
              textAlign: 'center',
              padding: isMobile ? '56px 24px 24px' : '72px 48px 24px',
              maxWidth: '900px',
              margin: '0 auto',
              position: 'relative',
            }}
          >
            <Typography
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                marginBottom: '20px',
              }}
            >
              {isRV ? 'RV Repair' : 'Truck Repair'} &amp; Roadside Assistance{stateName ? ` in ${stateName}` : ''}
            </Typography>
            <Typography
              component="h1"
              style={{
                color: '#ffffff',
                fontSize: isMobile ? '2.5rem' : '4rem',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                marginBottom: '40px',
              }}
            >
              {heroTitle}
              <br />
              <span style={{ color: '#0ADC6A' }}>Get Help Fast.</span>
            </Typography>
            <Box style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <CallButton size="hero" isMobile={isMobile} phoneDisplay={phoneDisplay} phoneTel={phoneTel} />
            </Box>
            <Box
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Typography style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', letterSpacing: '0.04em' }}>
                Available 24/7
              </Typography>
              <Typography style={{ color: 'rgba(255,255,255,0.85)', fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 600, letterSpacing: '0.04em' }}>
                {trucksServiced} {isRV ? 'Trucks & RVs' : 'trucks'} serviced since {servicingSince}
              </Typography>
            </Box>
          </Box>

          </Box>{/* end hero area */}

          {/* ─── METRICS SECTION ─── */}
          <Box style={{ display: 'flex', flexDirection: 'column' }}>
            <Box
              style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                textAlign: 'center',
                padding: isMobile ? '24px 24px 0' : '28px 48px 0',
              }}
            >
              <Typography
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                }}
              >
                Real Network Data
              </Typography>
            </Box>

            <Box
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                width: '100%',
                marginTop: isMobile ? '8px' : '0',
              }}
            >
              <MetricPanel
                label="Avg. Cost of Road Service"
                rigValue={`$${rigAvgCost}`}
                industryLabel={`$${INDUSTRY_AVG_COST}`}
                comparison={formatComparison(rigAvgCost, INDUSTRY_AVG_COST, true, 0, true)}
                comparisonSuffix="cheaper"
                iconSrc="/static/icons/currency-filled.svg"
                accentColor="#0ADC6A"
                borderRight
                borderBottom
                isMobile={isMobile}
              />
              <MetricPanel
                label="AVG. Time to Arrive"
                rigValue={rigTimeToArrivalDisplay!}
                industryLabel={`${INDUSTRY_TIME_TO_ARRIVAL} min`}
                comparison={formatComparison(rigTimeToArrivalMinutes, INDUSTRY_TIME_TO_ARRIVAL, true, 0, true)}
                comparisonSuffix="faster"
                iconSrc="/static/icons/location-marker-dark.svg"
                accentColor="#0ADC6A"
                borderRight
                borderBottom
                isMobile={isMobile}
              />
              <MetricPanel
                label="AVG. Time to Dispatch"
                rigValue={`${rigTimeToDispatch} min`}
                industryLabel={`${INDUSTRY_TIME_TO_DISPATCH} min`}
                comparison={formatComparison(rigTimeToDispatch, INDUSTRY_TIME_TO_DISPATCH, true, 1)}
                comparisonSuffix="faster"
                iconSrc="/static/icons/clock.svg"
                accentColor="#0ADC6A"
                isMobile={isMobile}
              />
            </Box>

            <Typography
              style={{
                color: 'rgba(255,255,255,0.2)',
                fontSize: '0.7rem',
                textAlign: 'center',
                padding: '16px 24px 32px',
                letterSpacing: '0.02em',
              }}
            >
              Based on live RIG network data. Industry averages sourced from 2025 roadside assistance benchmarks.
            </Typography>
          </Box>
        </Box>

        {/* ─── IMAGE CAROUSEL ─── */}
        <Box style={{ backgroundColor: '#f8f9fa', overflow: 'hidden', padding: '48px 0' }}>
          <Box
            style={{
              display: 'flex',
              width: 'max-content',
              animation: 'carousel-scroll 32s linear infinite',
            }}
          >
            {[...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES].map((src, i) => (
              <Box
                key={i}
                style={{
                  width: isMobile ? '260px' : '360px',
                  height: isMobile ? '180px' : '240px',
                  flexShrink: 0,
                  marginRight: '16px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={src}
                  alt="Truck roadside service"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        {/* ─── WHY RIG ─── */}
        <Box style={{ backgroundColor: '#ffffff', padding: isMobile ? '64px 24px' : '96px 48px' }}>
          <Box style={{ maxWidth: '900px', margin: '0 auto' }}>
            <Typography
              style={{
                color: '#0ADC6A',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                textAlign: 'center',
                marginBottom: '16px',
              }}
            >
              Why RIG
            </Typography>
            <Typography
              component="h2"
              style={{
                color: '#1a1a2e',
                fontSize: isMobile ? '1.75rem' : '2.5rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                textAlign: 'center',
                marginBottom: '56px',
              }}
            >
              Built for drivers and fleets
            </Typography>

            <Box
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                flexWrap: 'wrap',
                gap: '24px',
              }}
            >
              {[
                {
                  icon: '/static/icons/truck.svg',
                  title: mechanicsLabel,
                  desc: mechanicsDesc,
                },
                {
                  icon: '/static/icons/currency-filled.svg',
                  title: 'Competitive Pricing',
                  desc: isRV
                    ? `RIG customers pay ${Math.floor(((INDUSTRY_AVG_COST - rigAvgCost) / INDUSTRY_AVG_COST) * 100)}% less for RV road service than the industry average. Same repair, lower cost.`
                    : `RIG customers pay ${Math.floor(((INDUSTRY_AVG_COST - rigAvgCost) / INDUSTRY_AVG_COST) * 100)}% less for road service than the industry average. Same repair, lower cost.`,
                },
                {
                  icon: '/static/icons/clock.svg',
                  title: 'Fast Response Times',
                  desc: isRV
                    ? 'Receive your first offer in minutes, not hours. Get your RV back on the road sooner.'
                    : 'Receive your first offer in minutes, not hours. Get back on the road sooner.',
                },
                {
                  icon: '/static/icons/location-marker-dark.svg',
                  title: 'Real-Time GPS Tracking',
                  desc: 'Know exactly where your mechanic is and when they will arrive — live updates, no guessing.',
                },
              ].map(({ icon, title, desc }) => (
                <Box
                  key={title}
                  style={{
                    flex: isMobile ? '1 1 100%' : '1 1 calc(50% - 12px)',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box
                    style={{
                      width: '44px',
                      height: '44px',
                      flexShrink: 0,
                      backgroundColor: '#323E48',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img src={icon} alt="" style={{ width: '22px', height: '22px', filter: 'invert(1)' }} />
                  </Box>
                  <Box>
                    <Typography style={{ color: '#1a1a2e', fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>
                      {title}
                    </Typography>
                    <Typography style={{ color: '#4a4a5a', fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* ─── BOTTOM CTA ─── */}
        <Box
          style={{
            backgroundColor: '#323E48',
            padding: isMobile ? '72px 24px' : '96px 48px',
            textAlign: 'center',
          }}
        >
          <Typography
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: '20px',
            }}
          >
            Available 24/7
          </Typography>
          <Typography
            component="h2"
            style={{
              color: '#ffffff',
              fontSize: isMobile ? '2.25rem' : '3.5rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '16px',
            }}
          >
            {bottomCtaTitle}
          </Typography>
          <Typography
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: isMobile ? '1rem' : '1.2rem',
              marginBottom: '40px',
              maxWidth: '480px',
              margin: '0 auto 40px',
              lineHeight: 1.6,
            }}
          >
            {bottomCtaBody}
          </Typography>

          <Box style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <CallButton size="hero" isMobile={isMobile} phoneDisplay={phoneDisplay} phoneTel={phoneTel} />
          </Box>
          <Typography style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            Truck drivers · Fleets · Owner-operators · All commercial vehicles
          </Typography>
        </Box>

        {/* ─── FOOTER ─── */}
        <Box
          style={{
            backgroundColor: '#1e262e',
            padding: isMobile ? '32px 24px' : '40px 48px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/static/icons/logo-full.svg"
              alt="RIG Logo"
              style={{ height: '28px', width: 'auto', opacity: 0.7 }}
            />
            <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
              © {new Date().getFullYear()} RIG. All rights reserved.
            </Typography>
          </Box>
          <Box
            component="a"
            href={phoneTel}
            style={{
              color: '#0ADC6A',
              fontSize: '0.95rem',
              fontWeight: 700,
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
          >
            {phoneDisplay}
          </Box>
        </Box>

      </Container>
    </>
  )
}
