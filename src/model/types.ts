/**
 * The contract between config, catalog, scene and takeoff (SPEC §5).
 *
 * Everything dimensional here is in inches unless the field name says
 * otherwise. The only exception is `BlockPlacement`, which is the handoff to
 * the scene and is therefore already in scene units (feet).
 */

/** A colour the SKU is actually sold in, with the name the trade uses. */
export type Colorway = {
  id: string
  name: string
  hex: string
}

/**
 * A wall unit we can actually build with. `locked: false` is not decoration:
 * it is what lets TypeScript guarantee that a locked style can never reach
 * `deriveWall`, because a locked entry has no dimensions to derive from.
 */
export type WallSku = {
  id: string
  /** Descriptive of texture and format, never a real product line (SPEC §7). */
  name: string
  widthIn: number
  depthIn: number
  heightIn: number
  /** Per-course retreat into the slope. */
  setbackIn: number
  pricePerUnit: number
  /** At least three, and never empty: material selection is the point (SPEC §1). */
  colorways: Colorway[]
  locked: false
}

/**
 * A style we show in the grid but cannot build (SPEC §7). We hold name and
 * colour only, because we genuinely do not have the SKU sheet for these.
 */
export type LockedWallSku = {
  id: string
  name: string
  colorHex: string
  locked: true
}

export type CatalogEntry = WallSku | LockedWallSku

/** Derived from its wall SKU, never stored (SPEC §7). */
export type CapSku = {
  id: string
  name: string
  widthIn: number
  depthIn: number
  heightIn: number
  /** How far the cap projects past the front face of the top course. */
  overhangIn: number
}

/**
 * The complete user-facing state of a wall. Style and colorway are independent
 * axes (SPEC §7): changing one never resets the other.
 */
export type WallConfig = {
  skuId: string
  colorwayId: string
  runLengthIn: number
  /** The user picks courses, not a height (SPEC §8.1). */
  courses: number
  caps: boolean
}

/**
 * One instance to draw. Position, rotation and scale are in scene units so the
 * scene can consume them directly without doing any arithmetic of its own.
 */
export type BlockPlacement = {
  /** Feet. Centre of the piece. */
  position: [number, number, number]
  /** Radians about Y. */
  rotationY: number
  /** Feet. Absolute size, applied to a 1x1x1 box geometry. */
  scale: [number, number, number]
  /** 1 for a whole unit, < 1 where the run clipped it. */
  widthFraction: number
  courseIndex: number
  indexInCourse: number
}

export type DerivedWall = {
  sku: WallSku
  /** Already resolved, with the fallback applied. The scene just reads it. */
  colorway: Colorway
  /** Null when caps are switched off. */
  cap: CapSku | null
  courses: number
  runLengthIn: number
  /** Courses only. */
  wallHeightIn: number
  /** Courses plus cap, i.e. what the customer measures. */
  totalHeightIn: number
  /** How far odd courses shift along the run (SPEC §8.3). */
  bondOffsetIn: number
  /** Cumulative retreat at the top course (SPEC §8.4). */
  topSetbackIn: number
  blocks: BlockPlacement[]
  capPieces: BlockPlacement[]
  /** Instances drawn, which is also what the takeoff bills (SPEC §9). */
  blockCount: number
  capCount: number
}
