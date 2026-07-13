/** @type {import("next").NextConfig} */
module.exports = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GTAG_ID: process.env.NEXT_PUBLIC_GTAG_ID,
    NEXT_PUBLIC_GTAG_CALL_CONVERSION: process.env.NEXT_PUBLIC_GTAG_CALL_CONVERSION,
    NEXT_PUBLIC_GTAG_CALL_CONVERSION_TOLLFREE: process.env.NEXT_PUBLIC_GTAG_CALL_CONVERSION_TOLLFREE,
  },

  reactStrictMode: true,

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
