import type { NicheId } from '@/types'

export interface NicheConfig {
  id: NicheId
  label: string
  icon: string
  color: string
  description: string
  looks_for: string[]
  disqualifiers: string[]
  score_prompt: string
  render_prompt: string
  attom_filters: {
    propertyType: 'SFR'
    minHomeValue?: number
    minLotSqft?: number
    maxBuildYear?: number
  }
  avg_job_low: number
  avg_job_high: number
  value_lift: number
  roi_note: string
  postcard_headline: string
  postcard_subheadline: string
  postcard_stat: string
  postcard_cta: string
  landing_hero: string
  landing_benefits: string[]
  crm_default_deal_value: number
  crm_sales_cycle_days: number
}

const LANDSCAPING: NicheConfig = {
  id: 'landscaping',
  label: 'Landscaping',
  icon: '🌿',
  color: '#16A34A',
  description: 'Find homeowners with bare or neglected yards needing landscaping',
  looks_for: [
    'Bare dirt or gravel front yards',
    'Dead or patchy brown grass',
    'Weed-dominated lawns',
    'No foundation plantings or hedges',
  ],
  disqualifiers: [
    'Professional landscaping already installed',
    'Lush maintained green lawn',
    'Established flower beds and mature hedges',
  ],
  score_prompt: `You are a professional landscaping contractor reviewing aerial and
street-level photos of a residential property.
Score the landscaping need from 0 to 100:
90-100 = Completely bare dirt or gravel yard, zero vegetation, obvious eyesore
70-89  = Mostly dead/brown grass, no plants or shrubs, long-term neglect visible
50-69  = Patchy dying lawn, weeds dominant, would benefit greatly from landscaping
0-49   = Well-maintained lawn OR professional landscaping already installed
INSTANT SCORE 0: lush green lawn, professional flower beds, mature hedges, manicured yard.
Return ONLY valid JSON (no markdown): {"score":<0-100>,"reasons":["<specific observation>","<observation>"]}
Reasons must be specific visual facts e.g. "bare dirt covering full front yard"`,
  render_prompt: `Transform this property front yard with professional landscaping.
ADD to the photo — do not change the house itself:
• Thick emerald-green sod lawn from foundation to street curb
• Natural flagstone pathway from driveway to front door
• Colorful seasonal flower beds along foundation (reds and whites)
• Neatly trimmed boxwood hedges 18 inches tall flanking the entrance
• Two ornamental Japanese maple trees 6ft tall flanking the main path
• Fresh cedar wood-chip mulch in all planting beds
KEEP EXACTLY: house architecture, exterior paint, roof, driveway, windows, fence if present.
Style: photorealistic, bright golden-hour sunlight, exact same camera angle, ultra-high resolution.`,
  attom_filters: { propertyType: 'SFR', minHomeValue: 200000, minLotSqft: 4000 },
  avg_job_low: 6000,
  avg_job_high: 15000,
  value_lift: 4.5,
  roi_note: 'Landscaping returns 4.5x its cost in home value at resale',
  postcard_headline: 'What if your yard looked like this?',
  postcard_subheadline: 'Professional landscaping installed in days — not weeks',
  postcard_stat: 'Landscaping adds up to 4.5x its cost in home value',
  postcard_cta: 'Scan for your free design preview',
  landing_hero: 'See your yard transformed with professional landscaping',
  landing_benefits: [
    'Free design consultation included',
    'Installed in 3–5 days',
    'Licensed & fully insured',
  ],
  crm_default_deal_value: 9000,
  crm_sales_cycle_days: 21,
}

const ROOFING: NicheConfig = {
  id: 'roofing',
  label: 'Roofing',
  icon: '🏠',
  color: '#DC2626',
  description: 'Find homes with aged, deteriorating, or damaged roofs needing replacement',
  looks_for: [
    'Missing, broken, or curling shingles',
    'Moss or algae streaking',
    'Visible granule loss and discoloration',
    'Pre-2005 roof construction',
  ],
  disqualifiers: [
    'Solar panels already installed',
    'Metal roofing',
    'Post-2018 new construction',
    'Recently replaced roof',
  ],
  score_prompt: `You are a licensed roofing contractor inspecting a residential roof.
Score replacement urgency 0-100:
90-100 = Severe deterioration — missing/broken shingles, moss/algae, sagging, clearly pre-1995
70-89  = Significant aging — granule loss, algae streaks, curling shingles, pre-2005
50-69  = Moderate wear — discoloration, minor granule loss, aging but functional, pre-2012
0-49   = Newer roof, recently replaced, no visible deterioration
INSTANT SCORE 0: solar panels present, metal roof, new construction post-2018.
Return ONLY valid JSON: {"score":<0-100>,"reasons":["<specific observation>"]}`,
  render_prompt: `Replace this home roof with a premium new system.
REPLACE existing roof with:
• GAF Timberline HDZ architectural shingles in charcoal/dark weathered wood color
• Crisp white aluminum drip edge on all eaves
• New black seamless aluminum gutters with black downspouts
• Clean lead flashing at all roof penetrations and chimney
• Matching charcoal ridge cap shingles
KEEP UNCHANGED: all walls, windows, doors, landscaping, driveway.
Style: photorealistic contractor-quality result, same camera angle, bright professional lighting.`,
  attom_filters: { propertyType: 'SFR', minHomeValue: 150000, maxBuildYear: 2012 },
  avg_job_low: 8000,
  avg_job_high: 25000,
  value_lift: 2.8,
  roi_note: 'New roof recoups 65–80% of cost at resale and prevents interior water damage',
  postcard_headline: 'Your roof is costing you money every day',
  postcard_subheadline: 'Stop leaks, cut energy bills, and protect your home with a premium new roof',
  postcard_stat: 'New roof recoups up to 80% of its cost at resale',
  postcard_cta: 'Scan for your free roof preview',
  landing_hero: 'See your home with a brand-new premium roof',
  landing_benefits: [
    'Free inspection & honest quote',
    'Manufacturer-backed warranty',
    'Licensed, bonded & insured',
  ],
  crm_default_deal_value: 15000,
  crm_sales_cycle_days: 30,
}

const SOLAR: NicheConfig = {
  id: 'solar',
  label: 'Solar',
  icon: '☀️',
  color: '#D97706',
  description: 'Find homes with ideal roofs for solar panel installation',
  looks_for: [
    'Large unobstructed south-facing roof',
    'Minimal tree shading',
    'Good roof pitch and condition',
    'No existing solar',
  ],
  disqualifiers: [
    'Solar panels already installed',
    'Heavy tree shading',
    'North-facing primary roof',
    'Severely damaged roof',
  ],
  score_prompt: `Score this roof for solar installation suitability 0-100:
90-100 = Large unobstructed south-facing roof >700sqft usable, excellent condition, ideal pitch
70-89  = Good south-facing area, minor obstructions, good condition
50-69  = Some shading or sub-optimal orientation but viable
0-49   = North-facing, heavily shaded, small/complex roof, poor condition
INSTANT SCORE 0: solar panels already visible, severely damaged roof.
Return ONLY valid JSON: {"score":<0-100>,"reasons":["<specific observation>"]}`,
  render_prompt: `Install a residential solar system on this property.
ADD to existing photo:
• All-black premium monocrystalline panels (Tesla/SunPower Maxeon aesthetic)
• Clean uniform rows covering 65% of south-facing roof, flush low-profile racking
• No visible conduit on roof surface — all internal
• Compact white SolarEdge inverter on side of house near meter
KEEP: all walls, landscaping, driveway. Same angle. Bright midday lighting.`,
  attom_filters: { propertyType: 'SFR', minHomeValue: 250000, minLotSqft: 5000 },
  avg_job_low: 15000,
  avg_job_high: 35000,
  value_lift: 2.5,
  roi_note: '30% federal tax credit + eliminates electric bill — avg payback 7–9 years',
  postcard_headline: 'Your roof could eliminate your electric bill',
  postcard_subheadline: 'Lock in 25+ years of predictable energy costs with solar',
  postcard_stat: '30% federal tax credit available through 2032',
  postcard_cta: 'Scan for your free solar preview',
  landing_hero: 'See your home powered by the sun',
  landing_benefits: [
    '30% federal tax credit',
    'Eliminate or offset your electric bill',
    '25-year panel performance warranty',
  ],
  crm_default_deal_value: 25000,
  crm_sales_cycle_days: 45,
}

const EXTERIOR_PAINTING: NicheConfig = {
  id: 'exterior_painting',
  label: 'Exterior Painting',
  icon: '🎨',
  color: '#7C3AED',
  description: 'Find homes with faded, peeling, or outdated exterior paint',
  looks_for: [
    'Faded or chalky paint',
    'Visible peeling or chipping',
    'Outdated 80s/90s color palettes (beige, mauve, pastel)',
    'Weathered or mismatched surfaces',
  ],
  disqualifiers: [
    'Freshly painted exterior',
    'Brick or full-stone facade (no paint)',
    'Modern color scheme already applied',
  ],
  score_prompt: `Score this home exterior for repainting need 0-100.
70+: faded/chalky paint, visible peeling/chipping, outdated 80s/90s colors (beige/mauve/pastel),
mismatched surfaces, significant weathering or staining.
0-49: freshly painted modern colors, no visible damage.
Return ONLY valid JSON: {"score":<0-100>,"reasons":[...]}`,
  render_prompt: `Repaint this house exterior with modern premium color scheme.
APPLY: warm greige body (Sherwin-Williams Accessible Beige SW 7036),
bright white trim on all fascia/soffits/window casings (Pure White SW 7005),
bold navy blue front door (Benjamin Moore Hale Navy HC-154),
matte black exterior light fixtures and address numbers. No brush marks, sprayed finish.
KEEP: landscaping, roof, driveway, windows. Same angle.`,
  attom_filters: { propertyType: 'SFR', minHomeValue: 150000, maxBuildYear: 2010 },
  avg_job_low: 3000,
  avg_job_high: 8000,
  value_lift: 5.0,
  roi_note: 'Fresh exterior paint returns up to 5x its cost at resale',
  postcard_headline: 'Your house deserves a fresh coat',
  postcard_subheadline: 'Modern colors, pro sprayed finish, ready in under a week',
  postcard_stat: 'Exterior paint returns up to 5x its cost at resale',
  postcard_cta: 'Scan for your free color preview',
  landing_hero: 'See your home in a modern new color scheme',
  landing_benefits: [
    'Free color consultation',
    'Sprayed pro finish — no brush marks',
    'Licensed & insured with warranty',
  ],
  crm_default_deal_value: 5500,
  crm_sales_cycle_days: 14,
}

const FENCING: NicheConfig = {
  id: 'fencing',
  label: 'Fencing',
  icon: '🪵',
  color: '#92400E',
  description: 'Find homes without fencing or with broken chain-link needing an upgrade',
  looks_for: [
    'Open backyard with no fence',
    'Leaning or broken fence sections',
    'Chain-link on higher-value homes',
    'Incomplete property perimeter',
  ],
  disqualifiers: [
    'Newer wood or vinyl privacy fence already installed',
    'HOA-restricted fencing areas',
  ],
  score_prompt: `Score this property for fencing opportunity 0-100.
70+: open backyard with no fence from satellite view, OR broken/leaning sections, OR chain-link on $200K+ home.
Return ONLY valid JSON: {"score":<0-100>,"reasons":[...]}`,
  render_prompt: `Install premium cedar privacy fence around property.
ADD: 6-foot cedar horizontal-board fence (modern ranch style) along all property lines,
pre-stained natural cedar tone, matching double-wide driveway gate, black post hardware, solar post caps.
KEEP: house, landscaping. Same angle.`,
  attom_filters: { propertyType: 'SFR', minHomeValue: 200000, minLotSqft: 6000 },
  avg_job_low: 3000,
  avg_job_high: 10000,
  value_lift: 3.5,
  roi_note: 'Privacy fencing adds up to 3.5x its cost in perceived home value',
  postcard_headline: 'Turn your yard into a private retreat',
  postcard_subheadline: 'Premium cedar fencing installed in days',
  postcard_stat: 'Privacy fencing adds up to 3.5x its cost in home value',
  postcard_cta: 'Scan for your free fence preview',
  landing_hero: 'See your yard with a premium cedar privacy fence',
  landing_benefits: [
    'Free on-site estimate',
    'Installed in 2–4 days',
    'Licensed & fully insured',
  ],
  crm_default_deal_value: 6000,
  crm_sales_cycle_days: 14,
}

const POOL_INSTALLATION: NicheConfig = {
  id: 'pool_installation',
  label: 'Pool Installation',
  icon: '🏊',
  color: '#0284C7',
  description: 'Find large flat backyards on higher-value homes with no existing pool',
  looks_for: [
    'Large flat open backyard (30x20ft+)',
    'No existing pool',
    'Home value appears above $300K',
    'Few obstructions or heavy tree cover',
  ],
  disqualifiers: [
    'Existing pool already visible',
    'Small or heavily sloped backyard',
    'Extensive tree cover',
    'HOA prohibition',
  ],
  score_prompt: `Score this backyard for pool installation potential 0-100.
90-100: large (30x20ft+) flat open backyard, no pool, home value appears >$300K.
70-89: adequate flat space, no obstructions, mid-to-upper value home.
INSTANT 0: existing pool visible. Return JSON: {"score":<0-100>,"reasons":[...]}`,
  render_prompt: `Install premium in-ground pool in this backyard.
ADD: 16x32ft rectangular pool with dark charcoal pebble finish, raised bond beam with waterfall feature,
48-inch wide travertine pool deck, 4-foot black aluminum pool fence, 4 chaise lounges, blue LED lighting.
KEEP: house, front yard. Same angle.`,
  attom_filters: { propertyType: 'SFR', minHomeValue: 400000, minLotSqft: 8000 },
  avg_job_low: 35000,
  avg_job_high: 80000,
  value_lift: 1.8,
  roi_note: 'Premium in-ground pools deliver lifestyle value and strong resale appeal in warm markets',
  postcard_headline: 'Your backyard is ready for this',
  postcard_subheadline: 'Premium in-ground pools built to last decades',
  postcard_stat: 'Own summer — every year',
  postcard_cta: 'Scan for your free pool preview',
  landing_hero: 'See your backyard with a brand-new pool',
  landing_benefits: [
    'Free 3D design consultation',
    'Financing available',
    'Licensed & fully insured',
  ],
  crm_default_deal_value: 55000,
  crm_sales_cycle_days: 60,
}

const DRIVEWAY_PAVING: NicheConfig = {
  id: 'driveway_paving',
  label: 'Driveway / Paving',
  icon: '🛣️',
  color: '#475569',
  description: 'Find homes with cracked, stained, or gravel driveways needing replacement',
  looks_for: [
    'Heavy cracking or heaving',
    'Large oil stains',
    'Gravel or dirt driveways',
    'Sunken or uneven sections',
  ],
  disqualifiers: [
    'Recently poured concrete driveway',
    'Paver driveway already installed',
  ],
  score_prompt: `Score this driveway for replacement 0-100.
70+: significant cracking/heaving, heavy oil stains, gravel/dirt driveway on $150K+ home.
Return JSON: {"score":<0-100>,"reasons":[...]}`,
  render_prompt: `Replace driveway with premium interlocking concrete pavers.
Belgard Urbana pavers in charcoal/slate blend, herringbone pattern, double soldier course border,
clean crisp steel edging. KEEP: house, landscaping. Same angle.`,
  attom_filters: { propertyType: 'SFR', minHomeValue: 175000 },
  avg_job_low: 4000,
  avg_job_high: 15000,
  value_lift: 4.0,
  roi_note: 'A new driveway returns up to 4x its cost in curb appeal and resale value',
  postcard_headline: 'First impressions start at the driveway',
  postcard_subheadline: 'Premium paver driveways built to last a lifetime',
  postcard_stat: 'New driveways return up to 4x their cost in curb appeal',
  postcard_cta: 'Scan for your free driveway preview',
  landing_hero: 'See your driveway with premium pavers',
  landing_benefits: [
    'Free on-site estimate',
    'Installed in 3–5 days',
    '25-year product warranty',
  ],
  crm_default_deal_value: 8000,
  crm_sales_cycle_days: 14,
}

const PRESSURE_WASHING: NicheConfig = {
  id: 'pressure_washing',
  label: 'Pressure Washing',
  icon: '💧',
  color: '#0369A1',
  description: 'Find homes with algae, mildew, or grime on driveways, siding, and walkways',
  looks_for: [
    'Green or black algae on concrete',
    'Dark driveway staining',
    'Grimy siding or walkways',
    'Mildew on north-facing surfaces',
  ],
  disqualifiers: [
    'Recently cleaned surfaces',
    'All-new construction',
  ],
  score_prompt: `Score this property for pressure washing need 0-100.
70+: green/black algae on driveway/siding, dark concrete staining, grimy exterior surfaces.
Return JSON: {"score":<0-100>,"reasons":[...]}`,
  render_prompt: `Show property after complete professional pressure wash.
TRANSFORM: all dark/algae-stained concrete to bright clean gray/white,
dirty siding to original clean color, remove all algae, moss, staining. Same angle.`,
  attom_filters: { propertyType: 'SFR' },
  avg_job_low: 200,
  avg_job_high: 800,
  value_lift: 15.0,
  roi_note: 'Pressure washing returns up to 15x its cost in curb appeal and resale value',
  postcard_headline: 'Your home is under there somewhere',
  postcard_subheadline: 'Professional pressure washing — done in a single visit',
  postcard_stat: 'Pressure washing returns up to 15x its cost in curb appeal',
  postcard_cta: 'Scan for your free before-and-after preview',
  landing_hero: 'See your home after a professional pressure wash',
  landing_benefits: [
    'Done in a single visit',
    'Eco-safe soft-wash for siding',
    'Fully insured',
  ],
  crm_default_deal_value: 400,
  crm_sales_cycle_days: 7,
}

const HVAC: NicheConfig = {
  id: 'hvac',
  label: 'HVAC',
  icon: '❄️',
  color: '#0891B2',
  description: 'Find homes with aging HVAC systems or window units needing central air',
  looks_for: [
    'Old or rusty condenser unit',
    'Window AC units (no central air)',
    'Pre-2005 home construction',
    'Visibly oversized or undersized equipment',
  ],
  disqualifiers: [
    'Modern clean condenser unit visible',
    'Recently installed HVAC system',
  ],
  score_prompt: `Score this property for HVAC replacement 0-100.
70+: visibly old/rusty condenser unit (10+ years), window AC units visible (no central air), pre-2005 home.
INSTANT 0: modern clean condenser unit visible. Return JSON: {"score":<0-100>,"reasons":[...]}`,
  render_prompt: `Replace HVAC system at this property.
Show brand-new Carrier/Lennox high-efficiency 3-ton condenser, pristine white,
on fresh concrete pad, clean refrigerant lines with PVC conduit, proper clearance.
Remove old rusty unit. KEEP: all surroundings. Same angle.`,
  attom_filters: { propertyType: 'SFR', minHomeValue: 150000, maxBuildYear: 2010 },
  avg_job_low: 5000,
  avg_job_high: 15000,
  value_lift: 3.0,
  roi_note: 'High-efficiency HVAC cuts utility bills and recoups 65% of cost at resale',
  postcard_headline: 'Your old HVAC is costing you every month',
  postcard_subheadline: 'High-efficiency systems installed in a single day',
  postcard_stat: 'New HVAC can cut energy bills by up to 40%',
  postcard_cta: 'Scan for your free HVAC quote',
  landing_hero: 'See your home with a new high-efficiency HVAC',
  landing_benefits: [
    'Free load calculation & quote',
    'Financing available',
    '10-year manufacturer warranty',
  ],
  crm_default_deal_value: 9000,
  crm_sales_cycle_days: 21,
}

export const NICHES: NicheConfig[] = [
  LANDSCAPING,
  ROOFING,
  SOLAR,
  EXTERIOR_PAINTING,
  FENCING,
  POOL_INSTALLATION,
  DRIVEWAY_PAVING,
  PRESSURE_WASHING,
  HVAC,
]

export const LAUNCH_NICHES: NicheId[] = ['landscaping', 'roofing', 'solar']

export function getNiche(id: NicheId): NicheConfig | undefined {
  return NICHES.find((n) => n.id === id)
}

export function getNicheOrThrow(id: string): NicheConfig {
  const n = NICHES.find((n) => n.id === id)
  if (!n) throw new Error(`Unknown niche: ${id}`)
  return n
}

export function calculateROI(
  niche: NicheConfig,
  homeValue: number
): { low: number; high: number; statement: string } {
  void homeValue
  const low = Math.round(niche.avg_job_low * niche.value_lift)
  const high = Math.round(niche.avg_job_high * niche.value_lift)
  const extra = niche.id === 'solar' ? ' (after 30% federal tax credit)' : ''
  return {
    low,
    high,
    statement: `Adds $${(low / 1000).toFixed(0)}K–$${(high / 1000).toFixed(0)}K in home value${extra}`,
  }
}
