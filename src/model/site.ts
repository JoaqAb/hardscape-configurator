/**
 * The retained landform (SPEC §8.8). Pure TypeScript, like the rest of model/:
 * it imports nothing from three, so the site is derived from the config exactly
 * like the wall is, and the same URL always produces the same ground.
 *
 * The mass is finite. It is vertical only where the wall holds it and returns
 * to grade everywhere else, because that slope is what tells a visitor the wall
 * made a terrace rather than that it is holding back the world. Extending it
 * past the frustum was tried in 2E: earth without an end reads as a plateau.
 */

import type { DerivedWall } from './types'
import { inToFt } from './units'

/** How far the terrace runs behind the wall before it starts falling away. */
const TERRACE_DEPTH_MIN_FT = 10
const TERRACE_DEPTH_HEIGHT_MULTIPLE = 3
/** 1.5 horizontal to 1 vertical: the batter unretained soil is graded to. */
const SLOPE_RUN_PER_RISE = 1.5

export type SiteFaceId = 'front' | 'top' | 'rear' | 'left' | 'right'

export type DerivedSite = {
  /** Flush with the top block course, under the caps: that is how it is built. */
  fillHeightFt: number
  terraceDepthFt: number
  slopeRunFt: number
  /** Triangles, flat xyz triples, ready for a BufferGeometry. */
  positions: number[]
  /** One group per face, so each can carry its own material. */
  faceGroups: { id: SiteFaceId; start: number; count: number }[]
}

type Point = [number, number, number]

export function deriveSite(derived: DerivedWall): DerivedSite {
  const runFt = inToFt(derived.runLengthIn)
  const fillHeightFt = inToFt(derived.wallHeightIn)
  const finishedHeightFt = inToFt(derived.totalHeightIn)
  const returning = derived.returnRunLengthIn > 0

  const slopeRunFt = SLOPE_RUN_PER_RISE * fillHeightFt

  // The front face stands at the back of the wall, behind the top course's
  // setback, which is the plane the wall actually retains.
  const frontZ = -inToFt(derived.sku.depthIn + derived.topSetbackIn)

  // With the return active the fill is flush with the end of the return, so its
  // depth is the return's built length plus runA's depth rather than the
  // free-end rule (SPEC §8.8).
  const terraceDepthFt = returning
    ? inToFt(derived.returnRunLengthIn + derived.sku.depthIn) + frontZ
    : Math.max(
        TERRACE_DEPTH_MIN_FT,
        TERRACE_DEPTH_HEIGHT_MULTIPLE * finishedHeightFt,
      )
  const backZ = frontZ - terraceDepthFt
  const toeZ = backZ - slopeRunFt

  const h = fillHeightFt
  const s = slopeRunFt

  // Top rectangle over the wall's run, base polygon spread out behind and to
  // both sides by the slope run. The base keeps the wall's run at the front, so
  // the only vertical surface is the one the wall is holding.
  // Without a return the right side is a ruled end slope like the left. With
  // one, that side is where the retained earth ends against runB, so it becomes
  // vertical: the same five faces, different corner coordinates.
  const rightX = returning ? runFt - inToFt(derived.sku.depthIn + derived.topSetbackIn) : runFt
  const rightToeX = returning ? rightX : runFt + s
  const rightToeZ = returning ? toeZ : toeZ

  const t0: Point = [0, h, frontZ]
  const t1: Point = [rightX, h, frontZ]
  const t2: Point = [rightX, h, backZ]
  const t3: Point = [0, h, backZ]
  const b0: Point = [0, 0, frontZ]
  const b1: Point = [rightX, 0, frontZ]
  const b2: Point = [rightToeX, 0, rightToeZ]
  const b3: Point = [-s, 0, toeZ]

  const positions: number[] = []
  const faceGroups: DerivedSite['faceGroups'] = []

  const quad = (id: SiteFaceId, a: Point, b: Point, c: Point, d: Point) => {
    const start = positions.length / 3
    positions.push(...a, ...b, ...c, ...a, ...c, ...d)
    faceGroups.push({ id, start, count: 6 })
  }

  // Wound counter-clockwise seen from outside, so normals face out.
  quad('front', b0, b1, t1, t0)
  quad('right', b1, b2, t2, t1)
  quad('rear', b2, b3, t3, t2)
  quad('left', b3, b0, t0, t3)
  quad('top', t0, t1, t2, t3)

  return { fillHeightFt, terraceDepthFt, slopeRunFt, positions, faceGroups }
}
