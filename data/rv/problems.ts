// ============================================================================
// RV PROBLEM PAGES — the content core of the /rv-repair/ tree.
//
// Positioning (deliberate): written for the traveling RVer — camping trips,
// national parks, vacations. Time-first, premium-speed language ("get back
// to your trip"), never bargain language. Roadside chassis work (tires,
// brakes, engine, power) is RIG's wheelhouse; campsite house-system work
// (roof AC, slide-outs) gets honest "some mechanics take these calls — ask
// in chat" framing rather than overpromising.
// ============================================================================

export interface RvProblem {
  slug: string
  name: string // short label for chips/links
  title: string // <=60 chars ideally
  h1: string
  heroSub: string
  intro: string // what's happening, empathetic + expert
  causes: string[] // "what it usually is"
  checks: string[] // safe things to check while you wait
  dispatch: string // why dispatch beats the alternatives, vacation-angle
  campsiteNote?: string // honest scoping for house systems
}

export const RV_PROBLEMS: RvProblem[] = [
  {
    slug: 'tire-blowout',
    name: 'Tire blowout / flat',
    title: 'RV Tire Blowout? Mobile Tire Service Comes to You | RIG',
    h1: 'RV Tire Blowout or Flat — We Come to You',
    heroSub:
      'Blowouts end vacations only if you let them. A mobile tire tech meets you on the shoulder with the right tire — most rigs roll again within a couple of hours.',
    intro:
      "A blowout on a motorhome or towable is violent and scary — and almost always survivable for the rig. What it shouldn't cost you is a day of your trip. RV tires fail more often than truck tires because they age out before they wear out: sidewalls sit in the sun for months, pressures drift, and the first long climb in summer heat finds the weak one.",
    causes: [
      'Aged sidewalls (6+ year tires look fine and fail anyway)',
      'Underinflation on one tire of a dual pair — the survivor overheats next',
      'Overloaded axle after tanks, gear, and toys add up',
      'Road debris punctures that slow-leaked for days',
    ],
    checks: [
      'Get fully off the travel lane; angle wheels away from traffic; reflectors out if you have them',
      "Don't stand on the traffic side while you wait",
      'Find your tire size before chat — sidewall of any matching tire (e.g. 255/80R22.5)',
      'If one dual blew, don\'t drive on the survivor — it\'s been carrying double',
    ],
    dispatch:
      "One chat or call sends your location and tire size to mobile tire techs nearby. They bring the tire to you — no limping to an exit, no unhooking the toad, no waiting for a tow that costs more than the tire. You see the rate and ETA before anyone rolls, pay through the app, and you're back on the road to the campground before check-in closes.",
  },
  {
    slug: 'roof-ac',
    name: 'Roof AC not working',
    title: 'RV Roof AC Not Working? What It Usually Is | RIG',
    h1: 'RV Roof AC Not Cooling',
    heroSub:
      "A dead roof unit in July turns a vacation into an endurance event. Some fixes are simple enough to check yourself — and for the rest, ask dispatch what's available near you.",
    intro:
      "Roof ACs quit in two very different ways: no power (often fixable at the pedestal or breaker in minutes) and no cooling (compressor, capacitor, or refrigerant — a tech job). Before assuming the worst, work through the quick checks below; more than a third of \"dead\" roof units are a tripped breaker or a pedestal problem.",
    causes: [
      'Campground pedestal breaker tripped or weak (very common on hot afternoons)',
      'Failed start/run capacitor — the classic hum-but-no-compressor symptom',
      'Frozen coil from running fan-low in high humidity',
      'Shore power cord or transfer switch fault masquerading as an AC problem',
    ],
    checks: [
      'Check the pedestal breaker AND your rig\'s AC breaker — reset both once',
      'Listen at the roof: fan running but no compressor kick = likely capacitor',
      'Set fan HIGH and temp higher for 2 hours if you suspect a frozen coil',
      'Try the other AC (if you have two) to rule out shore power',
    ],
    campsiteNote:
      "Straight talk: roof-unit repair is campsite work, not roadside work, and it's a specialty. Some RIG mechanics take these calls, many don't. Describe it in chat with your location — dispatch will tell you honestly whether there's a tech in your area or whether a local RV shop is the faster path. Either answer beats sweating a day away wondering.",
    dispatch:
      "If your AC problem turns out to be electrical on the chassis side — batteries, inverter, shore power — that's squarely what RIG's mobile mechanics do, at your site, usually same day.",
  },
  {
    slug: 'generator',
    name: "Generator won't start",
    title: "RV Generator Won't Start or Stay Running | RIG",
    h1: "RV Generator Won't Start (or Won't Stay Running)",
    heroSub:
      'No generator means no AC at the boondocking spot and no coffee at the overlook. Most generator no-starts trace to three things — two of which a mobile mechanic fixes on the spot.',
    intro:
      "Onan and friends are reliable right up until the trip you need them. The classic pattern: it cranks, fires for three seconds, and dies — or won't crank at all after sitting since last season. The good news is that generator problems are overwhelmingly fuel and battery problems, and both are mobile-mechanic territory.",
    causes: [
      'Stale fuel / varnished carb after months parked (gas gensets)',
      'Fuel level below ¼ tank — most RV gensets refuse to run the tank dry on you',
      'Weak house battery: enough to click, not enough to start',
      'Clogged fuel filter or failing fuel pump on diesel units',
    ],
    checks: [
      'Confirm fuel is above ¼ tank (the genset pickup sits high on purpose)',
      'Check the prime: hold prime 30–60s on Onans before cranking',
      'Look at the status light and count the blink code — tell chat the number',
      'If it clicks but won\'t crank, try after 30 min of engine charging',
    ],
    dispatch:
      'A mobile mechanic can diagnose fuel, filters, pumps, and batteries at your site or roadside — gas or diesel genset. Tell dispatch the make, the blink code, and where you are — mechanics bid back with rates and ETAs, and most generator calls end with the genset running the same day. Your boondocking week is salvageable.',
  },
  {
    slug: 'electrical',
    name: 'Battery & electrical',
    title: 'RV Battery & Electrical Problems on the Road | RIG',
    h1: 'RV Battery and Electrical Problems',
    heroSub:
      "Dead chassis battery at a trailhead, house bank that won't hold, inverter fault lights — electrical gremlins are the #1 trip-stopper we see. Most are fixable where the rig sits.",
    intro:
      "RV electrical splits into two systems that fail differently: the chassis side (starts the engine, runs like a truck's) and the house side (batteries, inverter/converter, 12V everything). A no-start at a fuel stop is usually chassis; flickering lights and dead outlets are house. Mobile mechanics handle both far more often than owners expect.",
    causes: [
      'Chassis battery drained by a parasitic draw (or the kids and the TV)',
      'Corroded/loose battery terminals after washboard roads',
      'Converter not charging the house bank — batteries die nightly',
      'Failing alternator or isolator not charging house batteries while driving',
    ],
    checks: [
      'Check terminals first: tight, clean, no green fuzz',
      'Note what died together — everything, or just one circuit',
      'If you have a meter: resting battery under 12.0V is discharged, under 11V is hurt',
      'Kill suspicious loads (inverter, fridge on 12V) and see if the drain stops',
    ],
    dispatch:
      "Jump starts, battery replacement, alternator diagnosis, charging-system faults — this is bread-and-butter mobile mechanic work, and RIG dispatches it 24/7. Describe the symptom in chat, get bids with ETAs, and skip the part where you flag down strangers with cables at a rest area.",
  },
  {
    slug: 'overheating',
    name: 'Engine overheating',
    title: 'RV or Diesel Pusher Overheating on Grades | RIG',
    h1: 'RV Engine Overheating',
    heroSub:
      "Temperature climbing on the long grade to the park entrance? Pull over proud, not broke down. Overheating caught early is usually a cheap roadside fix — ignored, it's a vacation-ending engine.",
    intro:
      'Motorhomes overheat where trucks do: long summer grades, headwinds, towing near max. Diesel pushers add a rear radiator that collects a trip\'s worth of dust and bugs where you never look. The golden rule: an overheat you stop for immediately is almost always minor; the one you push through rarely is.',
    causes: [
      'Clogged or bug-blanketed radiator/CAC (rear radiators especially)',
      'Low coolant from a slow leak — hose clamps, water pump weep',
      'Failed fan clutch or hydraulic fan not engaging on grades',
      'Slipping serpentine belt driving the water pump',
    ],
    checks: [
      'Pull over safely, engine idling (not off) for 2–3 min to circulate, then shut down',
      'NEVER open a hot radiator cap — check the overflow tank level instead',
      'Look under the rig: fresh coolant drips tell the mechanic a lot',
      'Note exactly when it climbs: grades only? AC on? speed-dependent?',
    ],
    dispatch:
      "A mobile mechanic can pressure-test, find the leak, replace hoses and belts, and refill coolant on the shoulder or at your campsite. That's hours — versus a tow to a shop that may not see a motorhome for days in season. Tell dispatch what you saw and where the needle went; you'll have bids before the engine's cool.",
  },
  {
    slug: 'brakes',
    name: 'Brake problems',
    title: 'RV Brake Problems — Do Not Drive It. We Come Out | RIG',
    h1: 'RV Brake Problems',
    heroSub:
      "Soft pedal, grinding, pulling, smoke off a wheel — brakes are the one problem you don't drive another mile on. The right answer comes to you.",
    intro:
      "A 20,000 lb motorhome with compromised brakes on a 6% downgrade is not a story you want to be in. Brake symptoms on RVs escalate fast because the loads are high and the service intervals are long. If something changed about how the rig stops — today, not at the end of the trip — get it looked at where it sits.",
    causes: [
      'Worn pads/shoes finally past the wear line (grinding)',
      'Stuck caliper dragging — one hot, smoking wheel',
      'Air in hydraulic lines or a failing master cylinder (soft pedal)',
      'On air-brake pushers: compressor or dryer faults, slow build times',
    ],
    checks: [
      'Park it. Seriously — brake failures compound; a drag becomes a fire',
      'Feel (don\'t touch) each wheel from a few inches: one radiating heat = the culprit',
      'Note the symptom precisely: soft pedal? pull left/right? noise when?',
      'Air brakes: note build time to cutoff and any leak-down with the engine off',
    ],
    dispatch:
      'RIG mechanics do brake work on heavy rigs every day — motorhome brakes are the same systems. A mobile mechanic can replace pads, free a stuck caliper, or diagnose air systems at your location, and tell you straight if it genuinely needs a shop. Chat the symptom now; keep the rig parked until someone who does this daily has eyes on it.',
  },
  {
    slug: 'slide-out',
    name: 'Slide-out stuck',
    title: 'RV Slide-Out Stuck Out (or In)? Options | RIG',
    h1: 'RV Slide-Out Stuck',
    heroSub:
      "Stuck OUT at checkout time is an emergency; stuck IN is an inconvenience. Either way there's a manual override — and usually a fixable cause.",
    intro:
      "Slide-outs fail at the worst moments because they only move when you're arriving or leaving. The immediate goal is always the same: get the room in so you can travel safely. Nearly every slide system has a manual retract — crank, override switch, or pump valve — and finding yours is step one.",
    causes: [
      'Dead house battery — slides are the first thing owners notice',
      'Blown slide fuse or tripped breaker after the motor strained',
      'Hydraulic pump low on fluid, or a failed solenoid valve',
      'Obstruction or rail misalignment binding the room',
    ],
    checks: [
      'Check house battery voltage and the slide fuse/breaker first — it\'s the cause half the time',
      'Find the manual override in your manual (search "{your model} slide manual retract")',
      'Clear the slide path inside and out; look for anything wedged in the rails',
      'Listen: motor running but no movement means mechanical; silence means electrical',
    ],
    campsiteNote:
      "Honest scoping: slide mechanisms are campsite specialty work. Some RIG mechanics take slide calls — especially when the root cause is electrical (battery, fuse, solenoid), which is often — but not all do. Chat your location and symptom; dispatch tells you what's actually available nearby. If the answer is a mobile RV tech outside our network, you'll know in minutes instead of burning a morning on hold.",
    dispatch:
      "If it's electrical at the root — and it often is — that's dispatchable: battery, charging, fuses, solenoids at your site. Get the room in with the manual override, and let a mechanic chase the cause so it doesn't repeat at the next stop.",
  },
  {
    slug: 'tow-or-fix',
    name: 'Tow or fix?',
    title: 'RV Broke Down: Tow It or Fix It Roadside? | RIG',
    h1: "Tow It or Fix It? For RVs, It's Usually Fix.",
    heroSub:
      'A motorhome tow is slow, expensive, and hard on the rig — and it usually just relocates your problem to a shop with a two-week backlog. Most RV breakdowns are fixable where they happened.',
    intro:
      "Towing a large RV is nothing like towing a car: it needs a heavy wrecker, care with driveshafts and air systems, and often a long deadhead — quoted in many hundreds of dollars and hours of waiting. Worse, in vacation season the shop it tows to may not touch a motorhome for days. That's why dispatch tries roadside first: tires, batteries, belts, hoses, fuel, brakes, and most electrical faults get fixed on the shoulder every single day.",
    causes: [
      'Fixable roadside, usually: tires, batteries/charging, belts and hoses, coolant leaks, fuel issues, brake components, generator faults',
      'Genuinely needs a shop: internal engine or transmission failure, accident damage, frame or suspension breaks',
    ],
    checks: [
      "Describe the symptom in chat before anyone orders a wrecker — diagnosis is free",
      'If a mechanic says it needs a shop, ask for the tow THEN — you\'ve lost nothing trying',
      'Get safe and comfortable: an RV is the one breakdown where you have your house with you',
    ],
    dispatch:
      "One conversation with dispatch gets your breakdown in front of mobile mechanics nearby, with rates and ETAs upfront and payment protected through the app. If it's fixable — and most are — you're rolling the same day and the vacation continues. If it truly isn't, you tow once, to the right place, knowing why.",
  },
]

export const getRvProblem = (slug: string) => RV_PROBLEMS.find((p) => p.slug === slug)
