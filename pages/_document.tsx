import React from 'react'
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document'
import createEmotionServer from '@emotion/server/create-instance'
import createEmotionCache from '../utils/createEmotionCache'
import { GTAG_ID } from '../utils/gtag'
import { OAIQ_PIXEL_ID } from '../utils/oaiq'

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <meta name="theme-color" content="#323E48" />
          {/* OpenAI Ads measurement pixel — must load early in <head> to register the session. */}
          {!!OAIQ_PIXEL_ID && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function (w, d, s, u) {
                    if (w.oaiq) return;
                    var q = function () { q.q.push(arguments); };
                    q.q = [];
                    w.oaiq = q;
                    var js = d.createElement(s);
                    js.async = true;
                    js.src = u;
                    var f = d.getElementsByTagName(s)[0];
                    f.parentNode.insertBefore(js, f);
                  })(window, document, "script", "https://bzrcdn.openai.com/sdk/oaiq.min.js");
                  oaiq("init", { pixelId: "${OAIQ_PIXEL_ID}" });
                  oaiq("measure", "page_viewed");
                `,
              }}
            />
          )}
          <link rel="icon" href="/favicon.ico" />
          <link rel="icon" type="image/png" sizes="32x32" href="/static/icons/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/static/icons/favicon-16x16.png" />
          {!!GTAG_ID && (
            <>
              <script async src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`} />
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GTAG_ID}');
                  `,
                }}
              />
            </>
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }

  static async getInitialProps(ctx: DocumentContext) {
    const originalRenderPage = ctx.renderPage
    const cache = createEmotionCache()
    const { extractCriticalToChunks } = createEmotionServer(cache)

    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App: any) =>
          function EnhancedApp(props) {
            return <App emotionCache={cache} {...props} />
          },
      })

    const initialProps = await Document.getInitialProps(ctx)
    const emotionStyles = extractCriticalToChunks(initialProps.html)
    const emotionStyleTags = emotionStyles.styles.map((style) => (
      <style
        data-emotion={`${style.key} ${style.ids.join(' ')}`}
        key={style.key}
        dangerouslySetInnerHTML={{ __html: style.css }}
      />
    ))

    return {
      ...initialProps,
      styles: [...React.Children.toArray(initialProps.styles), ...emotionStyleTags],
    }
  }
}
