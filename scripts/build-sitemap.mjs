// Generates public/sitemap.xml for the SEO directory tree.
// Run after data changes: node scripts/build-sitemap.mjs
import fs from 'fs'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data', 'directory')
const ORIGIN = 'https://bigrig.app'
const SEGMENT = 'semi-truck-repair'

const allCities = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cities.json'), 'utf8'))
const allCorridors = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'corridors.json'), 'utf8'))

// Coverage gate — same rule as data/directory/mechanics.ts (keep in sync):
// in real mode (mechanics.json non-empty) pages with 0 mechanics don't exist.
const mech = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'mechanics.json'), 'utf8'))
const realMode = Object.keys(mech.pages || {}).length > 0
const covered = (key) => !realMode || (mech.pages[key] || []).length > 0

const cities = allCities.filter((c) => covered(`${c.state}/${c.citySlug}`))
const corridors = allCorridors.filter((c) => covered(`${c.route}/${c.state}`))
if (realMode)
  console.log(
    `coverage gate ON: ${cities.length}/${allCities.length} cities, ${corridors.length}/${allCorridors.length} corridors`
  )

const SERVICE_SLUGS = ['tire-change', 'mobile-repair', 'towing', 'preventive-maintenance',
  'air-brakes', 'jump-start', 'dpf-regen', 'trailer-repair', 'reefer-repair', 'truck-ac-repair'] // keep in sync with data/directory/services.ts

const urls = [
  { loc: `/${SEGMENT}/`, priority: '1.0' },
  { loc: `/${SEGMENT}/how-it-works/`, priority: '0.9' },
  { loc: `/${SEGMENT}/services/`, priority: '0.8' },
  ...SERVICE_SLUGS.map((s) => ({ loc: `/${SEGMENT}/services/${s}/`, priority: '0.8' })),
  { loc: `/${SEGMENT}/corridors/`, priority: '0.8' },
]

const states = [...new Set([...cities.map((c) => c.state), ...corridors.map((c) => c.state)])].sort()
for (const st of states) urls.push({ loc: `/${SEGMENT}/${st}/`, priority: '0.8' })

const routes = [...new Set(corridors.map((c) => c.route))].sort((a, b) =>
  a.localeCompare(b, undefined, { numeric: true })
)
for (const r of routes) urls.push({ loc: `/${SEGMENT}/corridors/${r}/`, priority: '0.7' })

for (const c of cities)
  urls.push({ loc: `/${SEGMENT}/${c.state}/${c.citySlug}/`, priority: c.tier === 'Core' ? '0.7' : '0.6' })

for (const c of corridors)
  urls.push({ loc: `/${SEGMENT}/corridors/${c.route}/${c.state}/`, priority: c.tier === 'Core' ? '0.7' : '0.6' })

// city x service pages (ingestion-computed program)
for (const key of Object.keys(mech.cityServices || {}))
  urls.push({ loc: `/${SEGMENT}/${key}/`, priority: '0.7' })

// mechanic profile pages exist only in real mode (mock profiles aren't real
// entities and aren't prerendered)
for (const key of Object.keys(mech.profiles || {}))
  urls.push({ loc: `/${SEGMENT}/${key}/`, priority: '0.5' })

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls
    .map((u) => `  <url><loc>${ORIGIN}${u.loc}</loc><priority>${u.priority}</priority></url>`)
    .join('\n') +
  '\n</urlset>\n'

// ---- RV tree sitemap (/rv-repair/*) — content + geo pages, same coverage gate
const RV_SEGMENT = 'rv-repair'
// keep in sync with data/rv/problems.ts
const RV_PROBLEM_SLUGS = ['tire-blowout', 'roof-ac', 'generator', 'electrical', 'overheating', 'brakes', 'slide-out', 'tow-or-fix']
const rvUrls = [
  { loc: `/${RV_SEGMENT}/`, priority: '1.0' },
  ...RV_PROBLEM_SLUGS.map((s) => ({ loc: `/${RV_SEGMENT}/${s}/`, priority: '0.8' })),
  ...states.map((st) => ({ loc: `/${RV_SEGMENT}/${st}/`, priority: '0.7' })),
  ...cities.map((c) => ({ loc: `/${RV_SEGMENT}/${c.state}/${c.citySlug}/`, priority: c.tier === 'Core' ? '0.6' : '0.5' })),
]
const rvXml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  rvUrls.map((u) => `  <url><loc>${ORIGIN}${u.loc}</loc><priority>${u.priority}</priority></url>`).join('\n') +
  '\n</urlset>\n'
const rvDir = path.join(__dirname, '..', 'public', RV_SEGMENT)
fs.mkdirSync(rvDir, { recursive: true })
fs.writeFileSync(path.join(rvDir, 'sitemap.xml'), rvXml)
console.log(`rv sitemap: ${rvUrls.length} URLs (at /${RV_SEGMENT}/sitemap.xml)`)

fs.writeFileSync(path.join(__dirname, '..', 'public', 'sitemap.xml'), xml)
// The bigrig.app LB routes only /semi-truck-repair/* to this service, so the
// root copy is unreachable there — this copy is the one to submit in Search
// Console (all URLs sit under the prefix, so the location is protocol-valid).
const segDir = path.join(__dirname, '..', 'public', SEGMENT)
fs.mkdirSync(segDir, { recursive: true })
fs.writeFileSync(path.join(segDir, 'sitemap.xml'), xml)
console.log(`sitemap.xml: ${urls.length} URLs (also at /${SEGMENT}/sitemap.xml)`)
