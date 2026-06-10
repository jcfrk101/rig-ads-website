import React, { FunctionComponent, ReactNode } from 'react'
import Head from 'next/head'
import { Box, Typography, useMediaQuery } from '@mui/material'

interface MarketingPageShellProps {
  pageTitle: string
  pageDescription: string
  children: ReactNode
}

const MarketingPageShell: FunctionComponent<MarketingPageShellProps> = ({ pageTitle, pageDescription, children }) => {
  const isMobile = useMediaQuery('(max-width:768px)')

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Marketing utility pages should stay out of search results */}
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Box
        style={{
          minHeight: '100vh',
          backgroundColor: '#323E48',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Nav bar */}
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '24px 20px' : '28px 48px',
          }}
        >
          <Box component="a" href="https://www.bigrig.app" style={{ display: 'inline-flex' }}>
            <img
              src="/static/icons/logo-full.svg"
              alt="RIG Logo"
              style={{ height: isMobile ? '36px' : '44px', width: 'auto' }}
            />
          </Box>
        </Box>

        {/* Centered content */}
        <Box
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '24px 20px 64px' : '32px 48px 96px',
          }}
        >
          <Box
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: isMobile ? '32px 24px' : '48px 40px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
            }}
          >
            {children}
          </Box>
        </Box>

        {/* Footer */}
        <Box
          style={{
            padding: isMobile ? '24px 20px 32px' : '24px 48px 32px',
            textAlign: 'center',
          }}
        >
          <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} RIG. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </>
  )
}

export default MarketingPageShell
