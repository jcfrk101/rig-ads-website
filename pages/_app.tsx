import React from 'react'
import type { AppProps } from 'next/app'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { CacheProvider } from '@emotion/react'
import type { EmotionCache } from '@emotion/cache'
import theme from '../styles/theme'
import createEmotionCache from '../utils/createEmotionCache'
import '../styles/globals.scss'

const clientSideEmotionCache = createEmotionCache()

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MyApp({ Component, pageProps, emotionCache = clientSideEmotionCache }: MyAppProps): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Page = Component as any
  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Page {...pageProps} />
      </ThemeProvider>
    </CacheProvider>
  )
}
