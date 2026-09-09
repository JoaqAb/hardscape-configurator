// Locked feature registry (SPEC §10).
//
// Unlocking a feature is `locked: false` plus its logic. No UI change: every
// surface that renders features reads this list and decides how to present an
// entry from its own `locked` flag, so nothing here is wired to a component.
//
// Wall styles are deliberately absent. They live in catalog.ts, because a style
// is catalog data and not a capability of the tool.

export type FeatureGroup =
  | 'family'
  | 'geometry'
  | 'business'
  | 'platform'
  | 'technical'

export type Feature = {
  id: string
  label: string
  group: FeatureGroup
  locked: boolean
  /** Honest build estimate. Shown to the visitor, so it has to be defensible. */
  estimateHours: number
}

export const FEATURE_GROUP_LABELS: Record<FeatureGroup, string> = {
  family: 'Product family',
  geometry: 'Geometry',
  business: 'Business output',
  platform: 'Platform',
  technical: 'Technical output',
}

export const FEATURES: Feature[] = [
  // Product family — the top tabs. These mirror the client's real product
  // lines and are the evidence that the architecture generalises.
  { id: 'retaining-wall', label: 'Retaining Wall', group: 'family', locked: false, estimateHours: 0 },
  { id: 'patio-pavers', label: 'Patio & Pavers', group: 'family', locked: true, estimateHours: 6 },
  { id: 'steps-landings', label: 'Steps & Landings', group: 'family', locked: true, estimateHours: 5 },
  { id: 'fire-pit', label: 'Fire Pit', group: 'family', locked: true, estimateHours: 3 },
  { id: 'fireplace', label: 'Fireplace', group: 'family', locked: true, estimateHours: 5 },
  { id: 'stone-veneer', label: 'Stone Veneer & Facade', group: 'family', locked: true, estimateHours: 8 },

  { id: 'curved-wall', label: 'Curved wall', group: 'geometry', locked: true, estimateHours: 3 },
  { id: 'terraced', label: 'Terraced / multi-tier', group: 'geometry', locked: true, estimateHours: 4 },
  { id: 'seat-wall', label: 'Seat wall with caps', group: 'geometry', locked: true, estimateHours: 2 },
  { id: 'corner-types', label: 'Corner types (inside / outside / 45°)', group: 'geometry', locked: true, estimateHours: 2 },

  { id: 'export-pdf', label: 'Export PDF quote', group: 'business', locked: true, estimateHours: 2 },
  { id: 'export-csv', label: 'Export takeoff to CSV', group: 'business', locked: true, estimateHours: 1 },
  { id: 'freight-zip', label: 'Delivery freight by ZIP', group: 'business', locked: true, estimateHours: 3 },
  { id: 'metric-units', label: 'Metric units toggle', group: 'business', locked: true, estimateHours: 1 },
  { id: 'save-share', label: 'Save & share project', group: 'business', locked: true, estimateHours: 2 },

  { id: 'white-label', label: 'White-label multi-tenant catalog', group: 'platform', locked: true, estimateHours: 12 },
  { id: 'admin-catalog', label: 'Admin catalog editor', group: 'platform', locked: true, estimateHours: 10 },

  { id: 'layout-sheet', label: 'Printable top-down layout sheet', group: 'technical', locked: true, estimateHours: 3 },
  { id: 'export-dwg', label: 'Export to DWG', group: 'technical', locked: true, estimateHours: 4 },
]

export function featuresIn(group: FeatureGroup): Feature[] {
  return FEATURES.filter((feature) => feature.group === group)
}

/** Groups that render as a roadmap list rather than as their own control. */
export const ROADMAP_GROUPS: FeatureGroup[] = [
  'geometry',
  'business',
  'platform',
  'technical',
]
