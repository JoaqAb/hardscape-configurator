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
import { degToRad, ftToIn, inToFt } from './units'

/** Cosmetic variation, in inches and degrees (SPEC §8.5). */
const POSITION_JITTER_IN = 0.15
const ROTATION_JITTER_DEG = 0.6
/** A real wall is never a flat colour, but the mean has to stay the colorway. */
const VALUE_JITTER = 0.03

/**
 * Real units are chamfered, so a wall shows a shadow line at every joint. We
 * draw each piece fractionally undersized to get the same reading. This is
 * geometry, not decoration, but it deliberately does not touch the layout: the
 * spans, the counts and therefore the takeoff are all unaffected.
 */
const JOINT_REVEAL_IN = 0.25

/** Keeps cap jitter from mirroring the block jitter underneath it. */
const CAP_SEED_SALT = 0xca9

/**
 * A quarter turn about Y. Local +X (the block's width) maps to world -Z, so the
 * return runs away from the viewer, and local +Z (its outward face) maps to
 * world +X, which is the face the return presents.
 */
const RETURN_ROTATION_RAD = Math.PI / 2
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

/**
 * The 90 degree return (SPEC §8.7).
 *
 * The corner is not a fixed point. Setback retreats each course's face on both
 * runs, so the intersection line of the two face planes walks the 45 degree
 * bisector: one cumulative setback in each axis, per course. Every course clips
 * runA at that line and starts runB from it, offset by runA's depth, so the two
 * runs never occupy the same volume.
 *
 * Because the overlap is never generated there is nothing downstream to
 * subtract: the takeoff stays a count of what was derived.
 */
function cornerVertex(runLengthIn: number, setbackIn: number) {
  return { x: runLengthIn - setbackIn, z: -setbackIn }
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

/** World bounds of a set of placements, turned pieces included. */
function boundsOf(placements: BlockPlacement[]): DerivedWall['boundsFt'] {
  const min: [number, number, number] = [Infinity, Infinity, Infinity]
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]

  for (const piece of placements) {
    const [px, py, pz] = piece.position
    const [sx, sy, sz] = piece.scale
    const cos = Math.cos(piece.rotationY)
    const sin = Math.sin(piece.rotationY)

    for (const dx of [-sx / 2, sx / 2]) {
      for (const dy of [-sy / 2, sy / 2]) {
        for (const dz of [-sz / 2, sz / 2]) {
          const corner: [number, number, number] = [
            px + dx * cos + dz * sin,
            py + dy,
            pz - dx * sin + dz * cos,
          ]
          for (let axis = 0; axis < 3; axis++) {
            min[axis] = Math.min(min[axis], corner[axis])
            max[axis] = Math.max(max[axis], corner[axis])
          }
        }
      }
    }
  }

  // An empty wall still has to hand the camera something finite.
  for (let axis = 0; axis < 3; axis++) {
    if (!Number.isFinite(min[axis])) min[axis] = 0
    if (!Number.isFinite(max[axis])) max[axis] = 0
  }
  return { min, max }
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

  const returnEnabled = config.returnEnabled
  const returnRunLengthIn = returnEnabled
    ? Math.max(0, ftToIn(config.returnRunFt))
    : 0

  // One flat array over both runs, in world coordinates. The scene draws it as
  // it is: no second Instances tree, no group transform.
  const courseBlocks: BlockPlacement[][] = []

  // The PRNG is seeded from a running index over the combined array, so a block
  // keeps its character whichever run it belongs to and the same URL always
  // rebuilds the same wall (SPEC §8.5).
  let seedIndex = 0

  for (let course = 0; course < courses; course++) {
    const rowBlocks: BlockPlacement[] = []
    const courseOffsetIn = course % 2 === 1 ? -bondOffsetIn : 0
    const setbackIn = course * sku.setbackIn
    const centreYIn = course * sku.heightIn + sku.heightIn / 2
    const vertex = cornerVertex(runLengthIn, setbackIn)

    const place = (
      centreXIn: number,
      centreZIn: number,
      widthIn: number,
      fraction: number,
      rotationBaseRad: number,
      indexInCourse: number,
      trueToTheCorner = false,
    ) => {
      const rand = mulberry32(hashSeed(seedIndex))
      seedIndex += 1
      // A corner block is set true. That is how a mason builds one, and it is
      // also what keeps the two runs from crossing: the cosmetic jitter is
      // +/-0.15" on each side, which is more than the clearance the corner has.
      const scale = trueToTheCorner ? 0 : 1
      const alongJitter = jitter(rand, POSITION_JITTER_IN) * scale
      const acrossJitter = jitter(rand, POSITION_JITTER_IN) * scale
      const rotationDeg = jitter(rand, ROTATION_JITTER_DEG) * scale
      // Colour does not affect clearance, so a corner block takes it even
      // though it is laid true for position.
      const rawValue = jitter(rand, VALUE_JITTER)
      const turned = rotationBaseRad !== 0

      rowBlocks.push({
        position: [
          inToFt(centreXIn + (turned ? acrossJitter : alongJitter)),
          inToFt(centreYIn),
          inToFt(centreZIn + (turned ? alongJitter : acrossJitter)),
        ],
        rotationY: rotationBaseRad + degToRad(rotationDeg),
        scale: [
          inToFt(widthIn - JOINT_REVEAL_IN),
          inToFt(sku.heightIn - JOINT_REVEAL_IN),
          inToFt(sku.depthIn),
        ],
        widthFraction: fraction,
        valueScale: 1 + rawValue,
        courseIndex: course,
        indexInCourse,
      })
    }

    // runA. With the return on its usable length ends at the vertex, which is
    // why it shortens by one setback per course.
    const runALengthIn = returnEnabled ? vertex.x : runLengthIn
    layoutRun(runALengthIn, sku.widthIn, courseOffsetIn).forEach((span, i) => {
      // Anything reaching into the band runB occupies is a corner block.
      const atCorner =
        returnEnabled && span.startIn + span.widthIn > vertex.x - sku.depthIn
      place(
        span.startIn + span.widthIn / 2,
        -(sku.depthIn / 2 + setbackIn),
        span.widthIn,
        span.fraction,
        0,
        i,
        atCorner,
      )
    })

    // runB. It turns a quarter, its face is flush with the vertex line, and it
    // starts one runA depth behind that line so the two bodies only ever touch.
    if (returnEnabled) {
      const faceXIn = vertex.x
      const startZIn = vertex.z - sku.depthIn
      const offset = rowBlocks.length
      layoutRun(returnRunLengthIn, sku.widthIn, courseOffsetIn).forEach(
        (span, i) => {
          place(
            faceXIn - sku.depthIn / 2,
            startZIn - (span.startIn + span.widthIn / 2),
            span.widthIn,
            span.fraction,
            RETURN_ROTATION_RAD,
            offset + i,
            span.startIn < sku.depthIn,
          )
        },
      )
    }

    courseBlocks.push(rowBlocks)
  }

  const blocks = courseBlocks.flat()

  // Centre the variation so its mean is exactly 1: the wall a customer sees has
  // to average to the swatch they clicked, not to something near it.
  if (blocks.length > 0) {
    const meanScale =
      blocks.reduce((sum, block) => sum + block.valueScale, 0) / blocks.length
    for (const block of blocks) {
      block.valueScale += 1 - meanScale
    }
  }

  const capPieces: BlockPlacement[] = []
  if (cap) {
    const capFrontZIn = -topSetbackIn + cap.overhangIn
    const centreZIn = capFrontZIn - cap.depthIn / 2
    const centreYIn = wallHeightIn + cap.heightIn / 2
    const vertex = cornerVertex(runLengthIn, topSetbackIn)
    // The cap's own outside line, pushed forward by the same overhang.
    const capFaceXIn = vertex.x + cap.overhangIn
    let capIndex = 0

    const placeCap = (
      centreXIn: number,
      zIn: number,
      widthIn: number,
      fraction: number,
      rotationBaseRad: number,
    ) => {
      const rand = mulberry32(hashSeed(CAP_SEED_SALT, capIndex))
      const alongJitter = jitter(rand, POSITION_JITTER_IN)
      const rotationDeg = jitter(rand, ROTATION_JITTER_DEG)
      const turned = rotationBaseRad !== 0

      capPieces.push({
        position: [
          inToFt(centreXIn + (turned ? 0 : alongJitter)),
          inToFt(centreYIn),
          inToFt(zIn + (turned ? alongJitter : 0)),
        ],
        rotationY: rotationBaseRad + degToRad(rotationDeg),
        scale: [
          inToFt(widthIn - JOINT_REVEAL_IN),
          inToFt(cap.heightIn),
          inToFt(cap.depthIn),
        ],
        widthFraction: fraction,
        valueScale: 1,
        courseIndex: courses,
        indexInCourse: capIndex,
      })
      capIndex += 1
    }

    const capRunAIn = returnEnabled ? capFaceXIn : runLengthIn
    layoutRun(capRunAIn, cap.widthIn, 0).forEach((span) => {
      placeCap(
        span.startIn + span.widthIn / 2,
        centreZIn,
        span.widthIn,
        span.fraction,
        0,
      )
    })

    if (returnEnabled) {
      const capStartZIn = capFrontZIn - cap.depthIn
      layoutRun(returnRunLengthIn, cap.widthIn, 0).forEach((span) => {
        placeCap(
          capFaceXIn - cap.depthIn / 2,
          capStartZIn - (span.startIn + span.widthIn / 2),
          span.widthIn,
          span.fraction,
          RETURN_ROTATION_RAD,
        )
      })
    }
  }

  return {
    sku,
    colorway,
    boundsFt: boundsOf([...blocks, ...capPieces]),
    cap,
    courses,
    runLengthIn,
    returnRunLengthIn,
    totalRunFt: inToFt(runLengthIn + returnRunLengthIn),
    wallHeightIn,
    totalHeightIn: wallHeightIn + (cap ? cap.heightIn : 0),
    bondOffsetIn,
    topSetbackIn,
    cornerVertexIn: returnEnabled
      ? cornerVertex(runLengthIn, topSetbackIn)
      : null,
    blocks,
    courseBlocks,
    capPieces,
    blockCount: blocks.length,
    capCount: capPieces.length,
  }
}
