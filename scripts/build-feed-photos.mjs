// Generates data/directory/feed-photos.json — real dispatcher-approved job
// photos from the work feed, replacing the hot-linked Squarespace stock in
// the directory photo strips. Runs in the prebuild data pipeline, so the
// nightly rebuild refreshes the pool as better-ranked photos accumulate
// (the feed AI scores each photo 1–5 at screen time; /feed/photos serves
// best-first).
//
// Fail-open: any fetch problem writes [] and the pages fall back to the
// static photo list in images.ts — a feed hiccup can never blank the strips.
//
// Run: node scripts/build-feed-photos.mjs
import fs from 'fs'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'data', 'directory', 'feed-photos.json')
const API = process.env.RIG_API_URL || 'https://api.bigrig.app'

const label = { mobile_service: 'Mobile repair', tire_change: 'Tire service', tow_service: 'Towing' }
const altFor = (p) => {
  const parts = [label[p.service_type] || 'Mobile repair']
  if (p.vehicle) parts.push(`on a ${p.vehicle}`)
  const place = [p.city, p.state].filter((v) => v && !/^(n\/a|na|none|unknown|null)$/i.test(String(v).trim())).join(', ')
  if (place) parts.push(`in ${place}`)
  return `${parts.join(' ')} — completed mobile repair job photo (RIG)`
}

async function get(u) {
  const res = await fetch(u)
  if (!res.ok) throw new Error(`${res.status} ${u}`)
  const body = await res.json()
  return body && typeof body === 'object' && 'data' in body ? body.data : body
}

let photos = []
try {
  // Preferred: the flattened best-first pool (carries per-photo quality).
  photos = (await get(`${API}/feed/photos?limit=24`)).map((p) => ({ src: p.url, alt: altFor(p) }))
} catch {
  try {
    // Older API: flatten completed items (photo_urls[0] is the item's best shot).
    const items = await get(`${API}/feed/public?type=JOB_COMPLETED&limit=50`)
    photos = items.flatMap((i) => (i.photo_urls || []).map((u) => ({ src: u, alt: altFor(i) })))
  } catch {
    photos = []
  }
}
fs.writeFileSync(OUT, JSON.stringify(photos.slice(0, 24), null, 2) + '\n')
console.log(`feed-photos.json: ${Math.min(photos.length, 24)} photos`)
