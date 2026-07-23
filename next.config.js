/** @type {import("next").NextConfig} */
module.exports = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GTAG_ID: process.env.NEXT_PUBLIC_GTAG_ID,
    NEXT_PUBLIC_GTAG_CALL_CONVERSION: process.env.NEXT_PUBLIC_GTAG_CALL_CONVERSION,
    NEXT_PUBLIC_GTAG_CALL_CONVERSION_TOLLFREE: process.env.NEXT_PUBLIC_GTAG_CALL_CONVERSION_TOLLFREE,
  },

  reactStrictMode: true,

  // This app is served under the /semi-truck-repair path of bigrig.app (behind a
  // Google Cloud load balancer that routes /semi-truck-repair/* to this service).
  // Without this, Next emits asset URLs at the root (/_next/static/...), which the
  // load balancer sends to the marketing backend instead — so styles 404. The
  // prefix makes assets resolve to /semi-truck-repair/_next/... and route here.
  assetPrefix: '/semi-truck-repair',

  // Directory URLs are defined with trailing slashes in the SEO page list
  // (e.g. /semi-truck-repair/tx/dallas/); non-slash requests 301 to the
  // slash version, so existing ad URLs keep working through the migration.
  trailingSlash: true,

  async redirects() {
    return [
      // legacy state landing-page slugs (pre-directory paradigm)
      { source: '/southcarolina', destination: '/south-carolina', permanent: true },
      { source: '/newmexico', destination: '/new-mexico', permanent: true },
    ]
  },

  experimental: {
    outputStandalone: true,
  },
}
