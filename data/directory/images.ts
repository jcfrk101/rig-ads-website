// ============================================================================
// SERVICE PHOTO COLLECTION — single source of truth for directory imagery.
//
// HOW TO ADD/REFRESH IMAGES: add/remove entries here and redeploy (the
// nightly rebuild picks it up like any code change). Pages pick photos
// deterministically from this list, so ordering only affects which pages get
// which photos — never breaks anything.
//
// ⚠ These URLs are hot-linked from the old Squarespace CDN (same images the
// repair.bigrig.app landing pages use). Before retiring Squarespace, copy
// them into public/static/photos/ (or a GCS bucket) and update the srcs here
// — one file, one deploy. If the collection should grow without deploys
// later, swap this constant for a JSON manifest the nightly build fetches.
// ============================================================================

export interface ServicePhoto {
  src: string
  alt: string
}

// Real job photos from the work feed (prebuild: scripts/build-feed-photos.mjs,
// refreshed by the nightly rebuild, AI-ranked best-first). The static
// Squarespace list below is now the FALLBACK — used only when the feed pool
// is too thin to give pages variety.
// eslint-disable-next-line @typescript-eslint/no-var-requires
import feedPhotosJson from './feed-photos.json'
const FEED_PHOTOS = feedPhotosJson as ServicePhoto[]

export const SERVICE_PHOTOS: ServicePhoto[] = [
  { src: 'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/04cb11a1-9b13-43aa-ba10-8c1a12abdbea/service_image_2.jpg', alt: 'RIG mechanic servicing a semi truck on the roadside' },
  { src: 'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/79b74ef3-0410-4284-b7ac-bbe9781b757e/service_image_10.jpg', alt: 'Mobile diesel mechanic working under a truck' },
  { src: 'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/75552956-8ed6-441e-bfc1-4eabc20d9ac0/service_image_9.jpg', alt: 'Heavy-duty truck repair in progress' },
  { src: 'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/9f2b4605-1145-44f5-8b77-5c67b8b5328f/service_image_8.jpg', alt: 'RIG mechanic with service truck on site' },
  { src: 'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/434f05f0-f011-4e44-ae85-f1fc2ddb4755/serivce_image_3.jpg', alt: 'Semi truck tire change on the shoulder' },
  { src: 'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/55607965-dc03-475b-a828-f3624d0ca4b3/service_image_7.jpg', alt: 'Roadside diesel engine diagnostics' },
  { src: 'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/6cc306b7-c3ca-4e00-b4b1-71a2c7e4ceec/service_image_6.jpg', alt: 'Mobile mechanic repairing a semi truck' },
  { src: 'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/09b1b347-aba9-452e-8760-bea38045c8f6/service_image_5.jpg', alt: 'Truck repair service call at night' },
  { src: 'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/6d77153c-e4c3-4cc6-9450-6afbd97d8cfa/service_image_4.jpg', alt: 'RIG network mechanic on a dispatch job' },
  { src: 'https://images.squarespace-cdn.com/content/v1/66561a788242c8621f3683d9/3584a1c1-93a3-43a4-a5cf-7c5c84fd2a81/service_image_1.jpg', alt: 'Heavy-duty roadside assistance for a semi truck' },
]

// Deterministic per-page photo picker: same page always shows the same
// photos (stable builds), different pages rotate through the collection.
export function pickPhotos(pageKey: string, count: number): ServicePhoto[] {
  const pool = FEED_PHOTOS.length >= 6 ? FEED_PHOTOS : SERVICE_PHOTOS
  let h = 2166136261
  for (let i = 0; i < pageKey.length; i++) {
    h ^= pageKey.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const start = (h >>> 0) % pool.length
  return Array.from({ length: Math.min(count, pool.length) }, (_, i) => pool[(start + i) % pool.length])
}
