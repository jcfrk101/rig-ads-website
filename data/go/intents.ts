// Ads landing intents for /go/{state}/{intent}/ — one per ad-group theme.
// These pages exist for paid clicks only (noindex): the copy is
// conversion-shaped, not directory-shaped, and nothing on them lists a
// mechanic's own number — every path is chat or the RIG dispatch line, so
// the click stays measurable end to end.
//
// Keyword-level final URLs in Google Ads map ad groups here:
//   Mobile/Roadside Truck, Mobile/Roadside Mechanic, "Ad group 1" -> truck
//   Mobile/Roadside Trailer                                        -> trailer
//   Tire-National                                                  -> tire
//   RV-National                                                    -> rv
//   Mobile Freightliner / Volvo / International (+ Mechanic)       -> brand slugs

export interface GoIntent {
  slug: string
  /** Short noun the hero builds around: "Mobile truck repair" */
  noun: string
  /** Hero H1 template; {place} is replaced with "Amarillo, TX" | "Texas" */
  h1: string
  sub: string
  chatPlaceholder: string
  /** What we handle — the bullet list under the hero */
  handles: string[]
  /** Segment tab label */
  tab: string
  /** Vehicle-class flavor for the honest-coverage line */
  coverage: string
}

const TRUCK_HANDLES = [
  'No-start, dead batteries, jump starts',
  'Air leaks, brakes, and DOT-stop fixes',
  'Coolant, belts, hoses, and overheating',
  'Fuel, DEF, and regen / derate issues',
  'Electrical, lights, and sensor faults',
  'Roadside tire changes and repairs',
]

export const GO_INTENTS: GoIntent[] = [
  {
    slug: 'truck',
    noun: 'Mobile truck repair',
    tab: 'Semi / Heavy Duty',
    h1: 'Mobile Truck Repair in {place} — Dispatched in Minutes',
    sub: 'Broke down or derated? Describe the problem once. Nearby heavy-duty mechanics bid back with a rate and an ETA; you pick one, they roll to you. No shop visit, no phone tree.',
    chatPlaceholder: 'Describe the problem — e.g. "derated on I-40, check engine light, can\'t get above 5 mph"',
    handles: TRUCK_HANDLES,
    coverage: 'heavy-duty diesel',
  },
  {
    slug: 'trailer',
    noun: 'Mobile trailer repair',
    tab: 'Trailer',
    h1: 'Mobile Trailer Repair in {place} — Lights, Brakes, Tires, Doors',
    sub: 'Trailer problems don\'t need a shop. Tell us what\'s wrong and where you\'re parked; trailer-capable mechanics near you send rates and ETAs within minutes, and you choose who rolls.',
    chatPlaceholder: 'Describe the problem — e.g. "trailer ABS light on, right-rear brakes dragging, at the Pilot off exit 74"',
    handles: [
      'Trailer lights, wiring, and 7-way plugs',
      'Air brakes, ABS faults, and slack adjusters',
      'Trailer tire blowouts and repairs',
      'Landing gear, doors, and roll-up door fixes',
      'Mud flaps, DOT bumper, and reflector repairs',
      'Reefer unit no-start and alarms',
    ],
    coverage: 'trailer and reefer',
  },
  {
    slug: 'tire',
    noun: 'Mobile tire service',
    tab: 'Tires',
    h1: 'Truck Tire Repair in {place} — Roadside, 24/7',
    sub: 'Blowout or flat? Tell us your tire size and where you are; nearby mobile tire techs bid back with price and ETA. Most carry common commercial sizes on the truck.',
    chatPlaceholder: 'Describe the problem — e.g. "blowout, outer drive tire, 295/75R22.5, on I-10 mm 512"',
    handles: [
      'Roadside blowouts and flat repairs',
      'Steer, drive, and trailer tire replacement',
      'New and used commercial tires on the truck',
      'Valve stems, patches, and re-torque',
      'Dual mismatch and inner-dual changes',
      'Trailer and RV tires too',
    ],
    coverage: 'commercial tire',
  },
  {
    slug: 'rv',
    noun: 'Mobile RV repair',
    tab: 'RV / Motorhome',
    h1: 'Mobile RV Repair in {place} — Get Back to the Trip',
    sub: 'Motorhome or towable, gas or diesel: describe the problem and where you\'re parked — roadside or campsite. RV-capable mechanics near you send rates and ETAs; you pick, they roll.',
    chatPlaceholder: 'Describe the problem — e.g. "Class A won\'t start, batteries dead, at a KOA outside Flagstaff"',
    handles: [
      'No-start, batteries, and alternators',
      'Roof A/C, generator, and electrical',
      'RV tire blowouts and replacements',
      'Overheating, belts, and coolant leaks',
      'Brakes and slide-out mechanical issues',
      'Tow-or-fix guidance when it\'s not roadside-fixable',
    ],
    coverage: 'RV (gas and diesel)',
  },
  {
    slug: 'freightliner',
    noun: 'Mobile Freightliner repair',
    tab: 'Freightliner',
    h1: 'Mobile Freightliner Repair in {place} — Independent Diesel Mechanics',
    sub: 'Cascadia, Columbia, M2 — describe the fault and where you\'re parked. Independent heavy-duty mechanics who work on Freightliners every day bid back with rates and ETAs. Faster and cheaper than the dealer line.',
    chatPlaceholder: 'Describe the problem — e.g. "2019 Cascadia, DD15, derate 5 mph, DEF light, near Amarillo"',
    handles: TRUCK_HANDLES,
    coverage: 'heavy-duty diesel',
  },
  {
    slug: 'volvo',
    noun: 'Mobile Volvo truck repair',
    tab: 'Volvo',
    h1: 'Mobile Volvo Truck Repair in {place} — Independent Diesel Mechanics',
    sub: 'VNL, VNR, VHD — describe the fault and where you\'re parked. Independent heavy-duty mechanics who know Volvo/D13 systems bid back with rates and ETAs. No dealer wait.',
    chatPlaceholder: 'Describe the problem — e.g. "Volvo VNL 760, D13, coolant temp climbing, pulled over on I-80"',
    handles: TRUCK_HANDLES,
    coverage: 'heavy-duty diesel',
  },
  {
    slug: 'international',
    noun: 'Mobile International truck repair',
    tab: 'International',
    h1: 'Mobile International Truck Repair in {place} — Independent Diesel Mechanics',
    sub: 'LT, LoneStar, ProStar, MV — describe the fault and where you\'re parked. Independent heavy-duty mechanics who work on Internationals bid back with rates and ETAs, usually within minutes.',
    chatPlaceholder: 'Describe the problem — e.g. "International LT, A26, won\'t regen, check engine, at the TA in Ozona"',
    handles: TRUCK_HANDLES,
    coverage: 'heavy-duty diesel',
  },
]

export const GO_INTENT_SLUGS = GO_INTENTS.map((i) => i.slug)
export const getGoIntent = (slug: string) => GO_INTENTS.find((i) => i.slug === slug) || null
