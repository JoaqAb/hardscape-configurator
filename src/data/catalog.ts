// PLACEHOLDER DATA — replace with the real SKU sheet.
// Nothing in the scene or the takeoff is hardcoded to these values.
//
// Naming rule (SPEC §7): style names describe texture and format. No real
// product line from any manufacturer appears here, because we do not know whose
// catalog the client actually sells, and descriptive names make it obvious
// these are placeholders.
//
// Colorway ids are deliberately shared across SKUs where the trade colour is
// the same. That is what lets a customer switch style and keep their colour.

import type { CapSku, CatalogEntry, Colorway, WallSku } from '../model/types'

/** Cap geometry follows the block it sits on (SPEC §7). */
export const CAP_DEPTH_BONUS_IN = 2
export const CAP_HEIGHT_IN = 3
export const CAP_FRONT_OVERHANG_IN = 1

export const WALL_CATALOG: CatalogEntry[] = [
  {
    id: 'large-outcropping',
    name: 'Large Outcropping',
    widthIn: 36,
    depthIn: 18,
    heightIn: 8,
    setbackIn: 1,
    pricePerUnit: 24.5,
    colorways: [
      { id: 'gray-granite', name: 'Gray Granite', hex: '#8e908c' },
      { id: 'charcoal', name: 'Charcoal', hex: '#4c4d50' },
      { id: 'buff-blend', name: 'Buff Blend', hex: '#b3a081' },
    ],
    locked: false,
  },
  {
    id: 'weathered-fieldstone',
    name: 'Weathered Fieldstone',
    widthIn: 24,
    depthIn: 16,
    heightIn: 6,
    setbackIn: 0.75,
    pricePerUnit: 14.75,
    colorways: [
      { id: 'buff-blend', name: 'Buff Blend', hex: '#bda98a' },
      { id: 'autumn-sunset', name: 'Autumn Sunset', hex: '#a3714e' },
      { id: 'charcoal', name: 'Charcoal', hex: '#4f5153' },
      { id: 'slate-blend', name: 'Slate Blend', hex: '#727a7d' },
    ],
    locked: false,
  },
  {
    id: 'linear-ledge',
    name: 'Linear Ledge',
    widthIn: 18,
    depthIn: 12,
    heightIn: 4,
    setbackIn: 0.5,
    pricePerUnit: 7.25,
    colorways: [
      { id: 'charcoal', name: 'Charcoal', hex: '#4a4b4e' },
      { id: 'gray-granite', name: 'Gray Granite', hex: '#96979a' },
      { id: 'sandstone-blend', name: 'Sandstone Blend', hex: '#c0ab86' },
    ],
    locked: false,
  },
  {
    id: 'chiseled-limestone',
    name: 'Chiseled Limestone',
    colorHex: '#c4bda9',
    locked: true,
  },
  { id: 'split-face', name: 'Split Face', colorHex: '#7f8384', locked: true },
  {
    id: 'hand-hewn-stack',
    name: 'Hand-Hewn Stack',
    colorHex: '#9a8b76',
    locked: true,
  },
]

export function isBuildable(entry: CatalogEntry): entry is WallSku {
  return !entry.locked
}

export const ACTIVE_WALL_SKUS: WallSku[] = WALL_CATALOG.filter(isBuildable)

export const DEFAULT_SKU_ID = ACTIVE_WALL_SKUS[0].id
export const DEFAULT_COLORWAY_ID = ACTIVE_WALL_SKUS[0].colorways[0].id

/**
 * Style and colorway are independent axes, so a colorway that the newly chosen
 * style does not offer falls back to that style's first colour instead of
 * throwing (SPEC §7).
 */
export function resolveColorway(sku: WallSku, colorwayId: string): Colorway {
  return sku.colorways.find((c) => c.id === colorwayId) ?? sku.colorways[0]
}

/**
 * The cap is a separate SKU but its geometry is a consequence of the block it
 * caps, so it is derived rather than typed out. It is sold in the same colour
 * as the wall, so it carries no colour of its own. Its price lives in pricing.ts.
 */
export function capForWallSku(sku: WallSku): CapSku {
  return {
    id: `${sku.id}-cap`,
    name: `${sku.name} Cap`,
    widthIn: sku.widthIn,
    depthIn: sku.depthIn + CAP_DEPTH_BONUS_IN,
    heightIn: CAP_HEIGHT_IN,
    overhangIn: CAP_FRONT_OVERHANG_IN,
  }
}
