// PLACEHOLDER DATA — replace with the real SKU sheet.
// Nothing in the scene or the takeoff is hardcoded to these values.

import type { CapSku, CatalogEntry, WallSku } from '../model/types'

/** Cap geometry follows the block it sits on (SPEC §7). */
export const CAP_DEPTH_BONUS_IN = 2
export const CAP_HEIGHT_IN = 3
export const CAP_FRONT_OVERHANG_IN = 1

export const WALL_CATALOG: CatalogEntry[] = [
  {
    id: 'ashlar-ledge',
    name: 'Ashlar Ledge',
    widthIn: 36,
    depthIn: 18,
    heightIn: 8,
    colorHex: '#9c948a',
    setbackIn: 1,
    pricePerUnit: 24.5,
    locked: false,
  },
  {
    id: 'highland-face',
    name: 'Highland Face',
    widthIn: 24,
    depthIn: 16,
    heightIn: 6,
    colorHex: '#8b8b86',
    setbackIn: 0.75,
    pricePerUnit: 14.75,
    locked: false,
  },
  {
    id: 'quarry-split',
    name: 'Quarry Split',
    widthIn: 18,
    depthIn: 12,
    heightIn: 4,
    colorHex: '#a8a096',
    setbackIn: 0.5,
    pricePerUnit: 7.25,
    locked: false,
  },
  { id: 'belvedere', name: 'Belvedere', colorHex: '#b0a898', locked: true },
  { id: 'outcropping', name: 'Outcropping', colorHex: '#7d7a74', locked: true },
  { id: 'heartwood', name: 'Heartwood', colorHex: '#9d8b78', locked: true },
  { id: 'grand-ledge', name: 'Grand Ledge', colorHex: '#8e9490', locked: true },
  { id: 'claremont', name: 'Claremont', colorHex: '#a49a8e', locked: true },
]

export function isBuildable(entry: CatalogEntry): entry is WallSku {
  return !entry.locked
}

export const ACTIVE_WALL_SKUS: WallSku[] = WALL_CATALOG.filter(isBuildable)

export const DEFAULT_SKU_ID = ACTIVE_WALL_SKUS[0].id

/**
 * The cap is a separate SKU but its geometry is a consequence of the block it
 * caps, so it is derived rather than typed out. Its price lives in pricing.ts.
 */
export function capForWallSku(sku: WallSku): CapSku {
  return {
    id: `${sku.id}-cap`,
    name: `${sku.name} Cap`,
    widthIn: sku.widthIn,
    depthIn: sku.depthIn + CAP_DEPTH_BONUS_IN,
    heightIn: CAP_HEIGHT_IN,
    overhangIn: CAP_FRONT_OVERHANG_IN,
    colorHex: sku.colorHex,
  }
}
