// Generates public/sitemap.xml for the SEO directory tree.
// Run after data changes: node scripts/build-sitemap.mjs
import fs from 'fs'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data', 'directory')
const ORIGIN = 'https://www.bigrig.app'
const SEGMENT = 'semi-truck-repair'

const cities = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cities.json'), 'utf8'))
const corridors = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'corridors.json'), 'utf8'))

const urls = [
  { loc: `/${SEGMENT}/`, priority: '1.0' },
  { loc: `/${SEGMENT}/how-it-works/`, priority: '0.9' },
  { loc: `/${SEGMENT}/corridors/`, priority: '0.8' },
]

const states = [...new Set(cities.map((c) => c.state))].sort()
for (const st of states) urls.push({ loc: `/${SEGMENT}/${st}/`, priority: '0.8' })

const routes = [...new Set(corridors.map((c) => c.route))].sort((a, b) =>
  a.localeCompare(b, undefined, { numeric: true })
)
for (const r of routes) urls.push({ loc: `/${SEGMENT}/corridors/${r}/`, priority: '0.7' })

for (const c of cities)
  urls.push({ loc: `/${SEGMENT}/${c.state}/${c.citySlug}/`, priority: c.tier === 'Core' ? '0.7' : '0.6' })

for (const c of corridors)
  urls.push({ loc: `/${SEGMENT}/corridors/${c.route}/${c.state}/`, priority: c.tier === 'Core' ? '0.7' : '0.6' })

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls
    .map((u) => `  <url><loc>${ORIGIN}${u.loc}</loc><priority>${u.priority}</priority></url>`)
    .join('\n') +
  '\n</urlset>\n'

fs.writeFileSync(path.join(__dirname, '..', 'public', 'sitemap.xml'), xml)
console.log(`sitemap.xml: ${urls.length} URLs`)
