/**
 * Wall geometry (SPEC §8). Pure TypeScript: this file, and everything else in
 * model/, must stay importable without a canvas. It knows nothing about three.
 *
 * Coordinate system, in scene units (feet):
 *   +X runs along the wall, with the origin at the start of the run.
 *   +Y is up, with 0 at the base of the first course.
 *   +Z points out of the wall, toward the viewer. The front face of the first
 *      course sits on z = 0, and each course retreats toward -Z.
 */

import {
  DEFAULT_SKU_ID,
  WALL_CATALOG,
  capForWallSku,
  isBuildable,
  resolveColorway,
} from '../data/catalog'
import { hashSeed, jitter, mulberry32 } from './rng'
import type {
  BlockPlacement,
  CatalogEntry,
  DerivedWall,
  WallConfig,
  WallSku,
} from './types'
import { degToRad, inToFt } from './units'

/** Cosmetic variation, in inches and degrees (SPEC §8.5). */
const POSITION_JITTER_IN = 0.15
const ROTATION_JITTER_DEG = 0.6

/**
 * Real units are chamfered, so a wall shows a shadow line at every joint. We
 * draw each piece fractionally undersized to get the same reading. This is
 * geometry, not decoration, but it deliberately does not touch the layout: the
 * spans, the counts and therefore the takeoff are all unaffected.
 */
const JOINT_REVEAL_IN = 0.25

/** Keeps cap jitter from mirroring the block jitter underneath it. */
const CAP_SEED_SALT = 0xca9
const EPSILON = 1e-6

/** One unit of a course, already clipped to the run. */
type Span = {
  startIn: number
  widthIn: number
  /** Of a whole unit. Less than 1 means it was cut on site. */
  fraction: number
}

/**
 * Lays units of `unitWidthIn` along a run, starting at `offsetIn`, and clips
 * whatever hangs off either end (SPEC §8.2, §8.3). Blocks and caps both go
 * through here, which is what keeps the takeoff counts and the scene counts
 * from ever disagreeing.
 */
function layoutRun(
  runLengthIn: number,
  unitWidthIn: number,
  offsetIn: number,
): Span[] {
  const spans: Span[] = []
  if (runLengthIn <= EPSILON || unitWidthIn <= EPSILON) return spans

  for (let i = 0; ; i++) {
    const rawStart = offsetIn + i * unitWidthIn
    if (rawStart >= runLengthIn - EPSILON) break

    const startIn = Math.max(rawStart, 0)
    const endIn = Math.min(rawStart + unitWidthIn, runLengthIn)
    const widthIn = endIn - startIn
    if (widthIn > EPSILON) {
      spans.push({ startIn, widthIn, fraction: widthIn / unitWidthIn })
    }
  }

  return spans
}

/** Falls back to the default rather than throwing, so a bad URL still renders. */
function resolveSku(skuId: string, catalog: CatalogEntry[]): WallSku {
  const buildable = catalog.filter(isBuildable)
  return (
    buildable.find((sku) => sku.id === skuId) ??
    buildable.find((sku) => sku.id === DEFAULT_SKU_ID) ??
    buildable[0]
  )
}

export function deriveWall(
  config: WallConfig,
  catalog: CatalogEntry[] = WALL_CATALOG,
): DerivedWall {
  const sku = resolveSku(config.skuId, catalog)
  const colorway = resolveColorway(sku, config.colorwayId)
  const courses = Math.max(1, Math.floor(config.courses))
  const runLengthIn = Math.max(0, config.runLengthIn)

  const wallHeightIn = courses * sku.heightIn
  const bondOffsetIn = sku.widthIn / 2
  const topSetbackIn = (courses - 1) * sku.setbackIn
  const cap = config.caps ? capForWallSku(sku) : null

  const courseBlocks: BlockPlacement[][] = []
  for (let course = 0; course < courses; course++) {
    const rowBlocks: BlockPlacement[] = []
    // Odd courses start half a unit back, so the head joint of one course
    // lands on the middle of the block below it.
    const courseOffsetIn = course % 2 === 1 ? -bondOffsetIn : 0
    const setbackIn = course * sku.setbackIn
    const centreYIn = course * sku.heightIn + sku.heightIn / 2

    layoutRun(runLengthIn, sku.widthIn, courseOffsetIn).forEach((span, i) => {
      const rand = mulberry32(hashSeed(course, i))
      const offsetXIn = jitter(rand, POSITION_JITTER_IN)
      const offsetZIn = jitter(rand, POSITION_JITTER_IN)
      const rotationDeg = jitter(rand, ROTATION_JITTER_DEG)

      rowBlocks.push({
        position: [
          inToFt(span.startIn + span.widthIn / 2 + offsetXIn),
          inToFt(centreYIn),
          inToFt(-(sku.depthIn / 2 + setbackIn) + offsetZIn),
        ],
        rotationY: degToRad(rotationDeg),
        scale: [
          inToFt(span.widthIn - JOINT_REVEAL_IN),
          inToFt(sku.heightIn - JOINT_REVEAL_IN),
          inToFt(sku.depthIn),
        ],
        widthFraction: span.fraction,
        courseIndex: course,
        indexInCourse: i,
      })
    })

    courseBlocks.push(rowBlocks)
  }

  const blocks = courseBlocks.flat()

  const capPieces: BlockPlacement[] = []
  if (cap) {
    // The cap aligns to the front face of the top course and hangs past it.
    const capFrontZIn = -topSetbackIn + cap.overhangIn
    const centreZIn = capFrontZIn - cap.depthIn / 2
    const centreYIn = wallHeightIn + cap.heightIn / 2

    layoutRun(runLengthIn, cap.widthIn, 0).forEach((span, i) => {
      const rand = mulberry32(hashSeed(CAP_SEED_SALT, i))
      const offsetXIn = jitter(rand, POSITION_JITTER_IN)
      const rotationDeg = jitter(rand, ROTATION_JITTER_DEG)

      capPieces.push({
        position: [
          inToFt(span.startIn + span.widthIn / 2 + offsetXIn),
          inToFt(centreYIn),
          inToFt(centreZIn),
        ],
        rotationY: degToRad(rotationDeg),
        scale: [
          inToFt(span.widthIn - JOINT_REVEAL_IN),
          inToFt(cap.heightIn),
          inToFt(cap.depthIn),
        ],
        widthFraction: span.fraction,
        courseIndex: courses,
        indexInCourse: i,
      })
    })
  }

  return {
    sku,
    colorway,
    cap,
    courses,
    runLengthIn,
    wallHeightIn,
    totalHeightIn: wallHeightIn + (cap ? cap.heightIn : 0),
    bondOffsetIn,
    topSetbackIn,
    blocks,
    courseBlocks,
    capPieces,
    blockCount: blocks.length,
    capCount: capPieces.length,
  }
}
