/** @type {import("next").NextConfig} */
module.exports = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GTAG_ID: process.env.NEXT_PUBLIC_GTAG_ID,
    NEXT_PUBLIC_GTAG_CALL_CONVERSION: process.env.NEXT_PUBLIC_GTAG_CALL_CONVERSION,
    NEXT_PUBLIC_GTAG_CALL_CONVERSION_TOLLFREE: process.env.NEXT_PUBLIC_GTAG_CALL_CONVERSION_TOLLFREE,
  },

  reactStrictMode: true,

  experimental: {
    outputStandalone: true,
  },
}
