// Merges the per-group corridor metadata drafts (scratchpad output from the
// drafting agents) into data/directory/corridor-meta.json, validating that
// every citiesAlong slug exists in cities.json for the right state.
// Usage: node scripts/merge-corridor-meta.mjs <group-file...>
import fs from 'fs'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data', 'directory')
const cities = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cities.json'), 'utf8'))
const corridors = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'corridors.json'), 'utf8'))

const validSlugs = new Set(cities.map((c) => `${c.state}/${c.citySlug}`))
const validKeys = new Set(corridors.map((c) => `${c.route}/${c.state}`))

const merged = {}
let badCity = 0
for (const file of process.argv.slice(2)) {
  const group = JSON.parse(fs.readFileSync(file, 'utf8'))
  for (const [key, entry] of Object.entries(group)) {
    if (!validKeys.has(key)) {
      console.warn(`SKIP unknown corridor key: ${key} (${file})`)
      continue
    }
    const state = key.split('/').pop()
    const cleaned = (entry.citiesAlong || []).filter((slug) => {
      const ok = validSlugs.has(`${state}/${slug}`)
      if (!ok) {
        console.warn(`  drop citiesAlong "${slug}" on ${key} — not in city list for ${state}`)
        badCity++
      }
      return ok
    })
    merged[key] = { ...entry, citiesAlong: cleaned }
  }
}

const missing = [...validKeys].filter((k) => !merged[k])
fs.writeFileSync(path.join(DATA_DIR, 'corridor-meta.json'), JSON.stringify(merged, null, 1) + '\n')
console.log(`corridor-meta.json: ${Object.keys(merged).length}/${validKeys.size} corridors, ${badCity} invalid city refs dropped`)
if (missing.length) console.log('missing:', missing.join(', '))
