// National service pages (/semi-truck-repair/services/<slug>/) — the SEO
// layer over the RIG service taxonomy. `dbType` maps each page to the
// underlying rig-web-services request type (ServiceConstants); several pages
// are high-volume subcategories that all dispatch as mobile_service.

export interface DirectoryService {
  slug: string
  name: string // display name, e.g. "Tire change & repair"
  h1: string // page H1, query-shaped
  short: string // one-line blurb for cards
  dbType: 'tire_change' | 'tow_service' | 'mobile_service' | 'maintenance_change'
  heroSub: string
  whatWeDo: string // paragraph: what the mechanic does on site
  roadsideFixes: string[] // bullets: typical roadside fixes
  roadsideOrShop: string // paragraph: honest roadside-vs-shop/tow framing
}

export const DIRECTORY_SERVICES: DirectoryService[] = [
  {
    slug: 'tire-change',
    name: 'Tire change & repair',
    h1: 'Mobile Semi Truck Tire Change & Repair',
    short: 'Blowouts, flats, and mounted spares — fixed on the shoulder, any position.',
    dbType: 'tire_change',
    heroSub:
      'Tires are the #1 roadside breakdown. RIG dispatches a tire-equipped mobile mechanic to your location — steer, drive, or trailer position — 24/7.',
    whatWeDo:
      'The mechanic arrives with the tools to dismount, mount, and torque heavy truck tires on site. If you carry a mounted spare, swapping it is fast; if not, tell dispatch your size (most common sizes like 295/75R22.5 and 11R22.5 are usually sourceable) and the mechanic brings one. Repairable punctures can often be patched to get you rolling.',
    roadsideFixes: [
      'Blowout replacement on steer, drive, or trailer positions',
      'Mounted spare swaps and flat swaps',
      'Puncture repair where the casing is sound',
      'Valve stem and slow-leak fixes',
      'New tire sourcing and delivery with the service call',
    ],
    roadsideOrShop:
      'Nearly all single-tire events are handled entirely roadside. A shop visit only makes sense for multiple destroyed tires with rim damage or full position re-tiring — and your mechanic will tell you straight if that is the case.',
  },
  {
    slug: 'mobile-repair',
    name: 'Mobile truck repair',
    h1: 'Mobile Semi Truck Repair — Diagnostics & Roadside Fixes',
    short: 'Diagnostics, electrical, fuel, cooling, sensors — the general fix-it-where-it-sits service.',
    dbType: 'mobile_service',
    heroSub:
      'A truck that cranks but will not run, warning lights, leaks, electrical gremlins — a mobile diesel mechanic diagnoses and fixes most of it right where the truck sits.',
    whatWeDo:
      'Mobile mechanics run computer diagnostics on the truck, read fault codes, and carry the common failure parts: belts, hoses, fittings, sensors, fuses, relays, filters. You describe the symptoms once to dispatch (photos help) so the mechanic shows up with the right parts the first time.',
    roadsideFixes: [
      'Computer diagnostics and fault-code reading',
      'Electrical faults, wiring, fuses, and relays',
      'Fuel system issues — filters, lines, priming after runout',
      'Coolant leaks, hoses, belts, and overheating',
      'Sensors, air leaks, and derate conditions',
    ],
    roadsideOrShop:
      'RIG mechanics fix the large majority of these calls on site. Internal engine or transmission failures are the main exceptions — and if it is one of those, you will know before spending on a tow to the wrong place.',
  },
  {
    slug: 'towing',
    name: 'Heavy-duty towing',
    h1: 'Heavy-Duty Semi Truck Towing',
    short: 'When it truly cannot be fixed where it sits — the right wrecker, dispatched fast.',
    dbType: 'tow_service',
    heroSub:
      'Some jobs genuinely need a tow. RIG dispatches heavy wreckers sized for loaded tractor-trailers and coordinates where the truck goes.',
    whatWeDo:
      'Dispatch matches the wrecker to your situation — bobtail, loaded trailer, off-shoulder recovery — and routes the truck to the shop you choose. Because the same dispatch network runs mobile repair, you will not pay for a tow that a roadside fix would have solved.',
    roadsideFixes: [
      'Heavy wrecker dispatch sized for tractor-trailers',
      'Tow to the shop of your choice',
      'Recovery for off-shoulder and no-start situations',
      'Coordination with a repair shop on arrival',
    ],
    roadsideOrShop:
      'Our advice is always the same: call dispatch before calling a tow. Most breakdowns are fixed on the shoulder for a fraction of the cost — the tow is the backup plan, not the default.',
  },
  {
    slug: 'preventive-maintenance',
    name: 'Maintenance',
    h1: 'Mobile Truck Maintenance — PM Service Where the Truck Parks',
    short: 'PM services, oil and filters, grease, DOT prep — done at your yard or drop lot.',
    dbType: 'maintenance_change',
    heroSub:
      'Scheduled maintenance does not need a shop visit. RIG mechanics run PM services wherever the truck parks — your yard, a drop lot, or home base.',
    whatWeDo:
      'Book a window and the mechanic comes to the truck with oil, filters, and grease. Ideal for owner-operators who lose a day driving to a shop, and for small fleets that want PM compliance without pulling trucks off routes.',
    roadsideFixes: [
      'Full PM service: oil, fuel, and air filters',
      'Chassis lube and grease',
      'Brake adjustment and inspection',
      'DOT annual inspection prep',
      'Fleet PM scheduling across multiple trucks',
    ],
    roadsideOrShop:
      'Maintenance is planned work, so this is the least urgent service RIG dispatches — and the easiest place to save a day of downtime by having the work come to you.',
  },
  {
    slug: 'air-brakes',
    name: 'Air brake repair',
    h1: 'Mobile Air Brake Repair for Semi Trucks',
    short: 'Leaks, chambers, slack adjusters, glad hands — brake trucks made roll-safe roadside.',
    dbType: 'mobile_service',
    heroSub:
      'Air brake problems park a truck by design. A mobile mechanic finds the leak or failed component and gets the system holding pressure again — safely.',
    whatWeDo:
      'The mechanic traces air leaks, replaces failed chambers, valves, glad hands, and lines, and adjusts or replaces slack adjusters. Brake work is safety-critical: it gets done to spec, on site, and the truck does not move until the system holds.',
    roadsideFixes: [
      'Air leak tracing and line repair',
      'Brake chamber and spring brake replacement',
      'Slack adjuster adjustment and replacement',
      'Glad hands, valves, and fittings',
      'Compressor and governor issues',
    ],
    roadsideOrShop:
      'The common failures — chambers, lines, valves, adjusters — are all roadside-repairable. Full axle brake jobs and drum/rotor work belong in a shop, and your mechanic will say so if that is what the truck needs.',
  },
  {
    slug: 'jump-start',
    name: 'Jump starts & batteries',
    h1: 'Semi Truck Jump Start & Battery Service',
    short: 'Dead batteries, no-crank, charging problems — power restored on site.',
    dbType: 'mobile_service',
    heroSub:
      'A truck that will not crank is often the fastest roadside fix there is. RIG dispatches a mechanic with heavy-duty jump equipment and replacement batteries.',
    whatWeDo:
      'Beyond the jump itself, the mechanic tests the batteries and charging system so you do not end up stranded again at the next stop — and replaces batteries on site if they are done.',
    roadsideFixes: [
      'Heavy-duty jump starts (24V-capable equipment)',
      'Battery testing and on-site replacement',
      'Alternator and charging system diagnosis',
      'Corroded terminals, cables, and battery disconnects',
      'Parasitic draw checks for repeat offenders',
    ],
    roadsideOrShop:
      'Almost always a complete roadside fix. If the alternator itself has failed, many can still be replaced on site depending on the engine — dispatch will set expectations before anyone rolls.',
  },
  {
    slug: 'dpf-regen',
    name: 'DPF & regen problems',
    h1: 'DPF, Regen & Derate Problems — Mobile Diesel Emissions Service',
    short: 'Stuck in derate, failed regens, DEF system faults — cleared where the truck sits.',
    dbType: 'mobile_service',
    heroSub:
      'A truck stuck in derate limping at 5 mph is a breakdown in slow motion. Mobile mechanics run forced regens and diagnose the emissions faults behind them.',
    whatWeDo:
      'With dealer-level diagnostic tools, the mechanic reads the aftertreatment fault codes, runs a forced/parked regen where the system allows it, and diagnoses the underlying cause — DEF quality and dosing, sensors, or a DPF that genuinely needs cleaning.',
    roadsideFixes: [
      'Forced (parked) regens to clear derate',
      'Aftertreatment fault-code diagnosis',
      'DEF system checks — dosing, quality, heater faults',
      'NOx and pressure sensor replacement',
      'Honest guidance when a DPF needs off-truck cleaning',
    ],
    roadsideOrShop:
      'Most derate events clear on site with a forced regen plus fixing the fault that caused it. A fully plugged DPF needing bake-off cleaning is shop work — but you will know that from a diagnosis on the shoulder, not after a tow.',
  },
  {
    slug: 'trailer-repair',
    name: 'Trailer repair',
    h1: 'Mobile Trailer Repair — Lights, Air, Doors & Landing Gear',
    short: 'Lights and ABS faults, air leaks, landing gear, doors — fixed at the trailer.',
    dbType: 'mobile_service',
    heroSub:
      'A dead trailer strands a load just as hard as a dead tractor. Mobile mechanics handle the trailer-side failures that put you out of service.',
    whatWeDo:
      'The mechanic sorts the failures that fail DOT inspections and stop dispatches: lighting circuits and seven-way cords, ABS faults, air leaks at the trailer, landing gear, and door hardware.',
    roadsideFixes: [
      'Lighting, wiring, and seven-way cord repair',
      'Trailer ABS fault diagnosis',
      'Air leaks — lines, valves, chambers on the trailer',
      'Landing gear repair and replacement',
      'Roll-up and swing door hardware',
    ],
    roadsideOrShop:
      'Trailer electrical and air work is classic roadside territory. Structural repairs — floors, crossmembers, major door frames — need a trailer shop, and the mechanic will tell you which side of the line your problem is on.',
  },
  {
    slug: 'reefer-repair',
    name: 'Reefer repair',
    h1: 'Mobile Reefer Repair — Protect the Load',
    short: 'Reefer down with a cold load? Highest-urgency dispatch there is.',
    dbType: 'mobile_service',
    heroSub:
      'A failed reefer puts the whole load on a clock. RIG treats reefer calls as the most time-critical dispatches in the network.',
    whatWeDo:
      'Reefer-qualified mechanics diagnose the unit where it sits: fuel supply, alarm codes, temperature control, and electrical faults. The first goal is always the same — get the unit holding temperature before the load is at risk, then fix the root cause.',
    roadsideFixes: [
      'Reefer no-start and shutdown diagnosis',
      'Alarm code reading (Thermo King and Carrier)',
      'Fuel system issues on the reefer unit',
      'Temperature control and sensor faults',
      'Electrical and battery problems on the unit',
    ],
    roadsideOrShop:
      'Most reefer failures that strand a load — fuel, sensors, electrical, codes — are roadside-fixable. Compressor and refrigerant-circuit failures need a reefer shop; with a cold load that usually means dispatch also helps you think through load rescue options fast.',
  },
]

export const getService = (slug: string) => DIRECTORY_SERVICES.find((s) => s.slug === slug)

export const servicePath = (slug: string) => `/semi-truck-repair/services/${slug}/`
