// Parses data/directory/pages.csv (the master SEO page list) into JSON consumed
// by the directory page templates. Run: node scripts/build-directory-data.mjs
import fs from 'fs'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data', 'directory')
const CSV_PATH = path.join(DATA_DIR, 'pages.csv')

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        inQuotes = false
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((f) => f !== '')) rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    if (row.some((f) => f !== '')) rows.push(row)
  }
  return rows
}

const [header, ...rows] = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'))
const col = Object.fromEntries(header.map((h, i) => [h.trim(), i]))
const get = (row, name) => (row[col[name]] ?? '').trim()

const cities = []
const corridors = []
const seenCityPaths = new Map() // path -> index into cities
const dropped = []

for (const row of rows) {
  const pageType = get(row, 'page_type')
  const slugTemplate = get(row, 'url_slug') // e.g. /{segment}/tx/dallas/
  const relPath = slugTemplate.replace('/{segment}/', '').replace(/\/$/, '')
  const base = {
    state: get(row, 'state').toLowerCase(),
    stateName: get(row, 'state_name'),
    tier: get(row, 'tier'), // Core | Extended
    name: get(row, 'name'),
    includeReason: get(row, 'include_reason'),
  }

  if (pageType === 'city') {
    const city = {
      ...base,
      population: Number(get(row, 'population')) || 0,
      lat: Number(get(row, 'latitude')),
      lng: Number(get(row, 'longitude')),
      citySlug: relPath.split('/')[1],
    }
    const existingIdx = seenCityPaths.get(relPath)
    if (existingIdx !== undefined) {
      // Duplicate slug (e.g. Brentwood the CA city vs. Brentwood the LA
      // neighborhood). Keep the higher-population entry.
      const existing = cities[existingIdx]
      if (city.population > existing.population) {
        dropped.push(existing)
        cities[existingIdx] = city
      } else {
        dropped.push(city)
      }
      continue
    }
    seenCityPaths.set(relPath, cities.length)
    cities.push(city)
  } else if (pageType === 'corridor') {
    // name like "I-10 (Alabama)", slug like corridors/i-10/al
    const parts = relPath.split('/') // [corridors, i-10, al]
    corridors.push({
      ...base,
      route: parts[1], // i-10
      routeDisplay: parts[1].toUpperCase().replace('I-', 'I-'),
      fullCoverage: base.includeReason.includes('full-exit-coverage'),
    })
  }
}

cities.sort((a, b) => a.state.localeCompare(b.state) || b.population - a.population)
corridors.sort(
  (a, b) =>
    a.route.localeCompare(b.route, undefined, { numeric: true }) ||
    a.state.localeCompare(b.state)
)

const states = {}
for (const c of cities) {
  states[c.state] = states[c.state] || {
    code: c.state,
    name: c.stateName,
    cityCount: 0,
    corridorCount: 0,
  }
  states[c.state].cityCount++
}
for (const c of corridors) {
  states[c.state] = states[c.state] || {
    code: c.state,
    name: c.stateName,
    cityCount: 0,
    corridorCount: 0,
  }
  states[c.state].corridorCount++
}

const write = (file, data) =>
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 1) + '\n')

write('cities.json', cities)
write('corridors.json', corridors)
write('states.json', states)

console.log(
  `cities: ${cities.length}, corridors: ${corridors.length}, states: ${Object.keys(states).length}`
)
if (dropped.length) {
  console.log('dropped duplicate-slug rows:')
  for (const d of dropped)
    console.log(`  ${d.stateName} / ${d.name} (pop ${d.population}, ${d.lat},${d.lng})`)
}
