// Locked feature registry (SPEC §10).
//
// Unlocking a feature is `locked: false` plus its logic. No UI change: every
// surface that renders features reads this list and decides how to present an
// entry from its own `locked` flag, so nothing here is wired to a component.
//
// Wall styles are deliberately absent. They live in catalog.ts, because a style
// is catalog data and not a capability of the tool.

import { WALL_CATALOG, isLockedStyle } from './catalog'

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
  { id: '90-degree-return', label: '90° return / L-shaped wall', group: 'geometry', locked: false, estimateHours: 2 },
  { id: 'terraced', label: 'Terraced / multi-tier', group: 'geometry', locked: true, estimateHours: 4 },
  { id: 'seat-wall', label: 'Seat wall with caps', group: 'geometry', locked: true, estimateHours: 2 },
  { id: 'corner-types', label: 'Corner types (inside / outside / 45°)', group: 'geometry', locked: true, estimateHours: 2 },

  { id: 'export-pdf', label: 'Export PDF quote', group: 'business', locked: true, estimateHours: 2 },
  { id: 'export-csv', label: 'Export takeoff to CSV', group: 'business', locked: true, estimateHours: 1 },
  { id: 'freight-zip', label: 'Delivery freight by ZIP', group: 'business', locked: true, estimateHours: 3 },
  { id: 'metric-units', label: 'Metric units toggle', group: 'business', locked: true, estimateHours: 1 },
  { id: 'save-share', label: 'Save & share project', group: 'business', locked: true, estimateHours: 2 },

  { id: 'tenant-scoped-catalog', label: 'Tenant-scoped catalog', group: 'platform', locked: true, estimateHours: 12 },
  { id: 'admin-catalog', label: 'Admin catalog editor (no auth)', group: 'platform', locked: true, estimateHours: 10 },

  { id: 'layout-sheet', label: 'Printable top-down layout sheet', group: 'technical', locked: true, estimateHours: 3 },
  { id: 'export-dxf', label: 'Export to DXF', group: 'technical', locked: true, estimateHours: 4 },
]

/**
 * The roadmap header's two numbers (SPEC §10). Derived here, at render time,
 * from the registry plus the locked styles in the catalog. Neither number may
 * ever be typed as a literal: the moment it is, the roadmap starts lying the
 * first time a feature is unlocked.
 */
export function roadmapTotals(): { count: number; hours: number } {
  const lockedFeatures = FEATURES.filter((feature) => feature.locked)
  const lockedStyles = WALL_CATALOG.filter(isLockedStyle)

  return {
    count: lockedFeatures.length + lockedStyles.length,
    hours:
      lockedFeatures.reduce((sum, f) => sum + f.estimateHours, 0) +
      lockedStyles.reduce((sum, s) => sum + s.estimateHours, 0),
  }
}

export type RoadmapSubtotal = { count: number; hours: number }

/**
 * The locked items that render somewhere other than the roadmap card: the
 * product families are the tabs, and the wall styles are in the style grid
 * because §10 keeps styles out of the registry on purpose.
 *
 * The card shows these as two subtotal rows so its column sums to the header.
 * They are subtotals, not second homes: no per-item estimate is repeated.
 */
export function lockedFamilySubtotal(): RoadmapSubtotal {
  const locked = FEATURES.filter((f) => f.group === 'family' && f.locked)
  return {
    count: locked.length,
    hours: locked.reduce((sum, f) => sum + f.estimateHours, 0),
  }
}

export function lockedStyleSubtotal(): RoadmapSubtotal {
  const locked = WALL_CATALOG.filter(isLockedStyle)
  return {
    count: locked.length,
    hours: locked.reduce((sum, s) => sum + s.estimateHours, 0),
  }
}

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
