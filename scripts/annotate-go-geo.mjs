// One-off (idempotent): annotate the go-geo lookup buckets with our citySlug
// wherever the geo target's (city, state) matches a directory city page —
// [name, state] becomes [name, state, citySlug]. Lets ad clicks route to the
// exact city page from the ?loc/?int ValueTrack params.
// Run: node scripts/annotate-go-geo.mjs
import fs from 'fs'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const cities = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'directory', 'cities.json'), 'utf8'))
const bySlugKey = new Map(cities.map((c) => [`${c.name.toLowerCase()}|${c.state}`, c.citySlug]))
const dir = path.join(__dirname, '..', 'public', 'static', 'go-geo', 'b')
let annotated = 0, total = 0
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const p = path.join(dir, f)
  const bucket = JSON.parse(fs.readFileSync(p, 'utf8'))
  for (const [id, v] of Object.entries(bucket)) {
    total++
    const slug = bySlugKey.get(`${String(v[0]).toLowerCase()}|${v[1]}`)
    bucket[id] = slug ? [v[0], v[1], slug] : [v[0], v[1]]
    if (slug) annotated++
  }
  fs.writeFileSync(p, JSON.stringify(bucket))
}
console.log(`${annotated}/${total} geo targets annotated with a city page slug`)
