/**
 * Quantities summary (SPEC §9). Pure TypeScript, like the rest of model/: it
 * imports nothing from three and can be checked without a canvas.
 *
 * This is sales-facing, not an estimator's worksheet. It tells a customer
 * roughly what their project needs so the lead arrives qualified.
 */

import type { Pricing } from '../data/pricing'
import type { DerivedWall, TakeoffLine } from './types'
import { cubicInchesToCubicFeet, inToFt } from './units'

/** Formula constants from SPEC §9. Money lives in data/pricing.ts. */
const GRAVEL_TRENCH_MARGIN_IN = 12
const GRAVEL_TRENCH_DEPTH_IN = 6
const FT3_PER_YD3 = 27
const GRAVEL_TONS_PER_YD3 = 1.4
const ADHESIVE_COVERAGE_FT = 20
const CONCRETE_DENSITY_LB_PER_FT3 = 145

/**
 * Money is rounded exactly once, here, when a line total is formed. The
 * estimate is then the sum of those rounded lines, so the column a customer
 * adds up by hand agrees with the total printed underneath it.
 */
function lineTotal(qty: number, unitPrice: number): number {
  return Math.round(qty * unitPrice)
}

export const ENGINEERED_WALL_HEIGHT_IN = 48
export const ENGINEERED_WALL_NOTICE =
  "Walls over 4' typically require an engineered design. We'll flag this for review."

/**
 * Caps are excluded from this height on purpose (SPEC §9): the Backyard terrace
 * preset sits at exactly 48" of block, and a notice that is on by default
 * demonstrates nothing. The seventh course is what turns it on.
 */
export function needsEngineeredDesign(derived: DerivedWall): boolean {
  return derived.wallHeightIn > ENGINEERED_WALL_HEIGHT_IN
}

export function computeTakeoff(
  derived: DerivedWall,
  pricing: Pricing,
): TakeoffLine[] {
  const { sku, cap } = derived
  const runFt = inToFt(derived.runLengthIn)
  const lines: TakeoffLine[] = []

  // 1. Wall face area.
  lines.push({
    label: 'Wall face area',
    qty: runFt * inToFt(derived.wallHeightIn),
    unit: 'sq ft',
    unitPrice: null,
    total: null,
  })

  // 2. Block count. This is the length of the very array the scene draws, not a
  //    parallel recount: a clipped block is still a block the builder buys and
  //    cuts on site, so 84 instances bill as 84 units.
  const blockQty = derived.blockCount
  lines.push({
    label: sku.name,
    qty: blockQty,
    unit: 'ea',
    unitPrice: sku.pricePerUnit,
    total: lineTotal(blockQty, sku.pricePerUnit),
  })

  // 3. Cap count, which layoutRun produces as ceil(runLengthIn / capWidthIn).
  if (cap) {
    const capUnitPrice = sku.pricePerUnit * pricing.capPriceFactor
    lines.push({
      label: cap.name,
      qty: derived.capCount,
      unit: 'ea',
      unitPrice: capUnitPrice,
      total: lineTotal(derived.capCount, capUnitPrice),
    })
  }

  // 4. Base gravel: a trench one block deep plus a foot, 6" of stone.
  const trenchWidthFt = inToFt(sku.depthIn + GRAVEL_TRENCH_MARGIN_IN)
  const gravelFt3 = trenchWidthFt * inToFt(GRAVEL_TRENCH_DEPTH_IN) * runFt
  const gravelTons = (gravelFt3 / FT3_PER_YD3) * GRAVEL_TONS_PER_YD3
  lines.push({
    label: 'Base gravel',
    qty: gravelTons,
    unit: 'tons',
    unitPrice: pricing.gravelPricePerTon,
    total: lineTotal(gravelTons, pricing.gravelPricePerTon),
  })

  // 5. Adhesive: one bead along the top course, and a second under the caps
  //    when there are caps to bed.
  const adhesiveRunFt = runFt + (cap ? runFt : 0)
  const tubes = Math.ceil(adhesiveRunFt / ADHESIVE_COVERAGE_FT)
  lines.push({
    label: 'Construction adhesive',
    qty: tubes,
    unit: 'tubes',
    unitPrice: pricing.adhesivePricePerTube,
    total: lineTotal(tubes, pricing.adhesivePricePerTube),
  })

  // 6. Estimated total: the sum of the rounded lines above, not the rounding of
  //    an unrounded sum. This is a customer-facing document; the arithmetic has
  //    to survive being checked with a pencil.
  const estimate = lines.reduce((sum, line) => sum + (line.total ?? 0), 0)
  lines.push({
    label: 'Estimated total',
    qty: estimate,
    unit: 'USD',
    unitPrice: null,
    total: estimate,
  })

  // 7. Total weight, from the volume of what gets delivered. Never a constant
  //    per SKU: whole units are bought, so whole units are what ships.
  const blockVolumeIn3 = sku.widthIn * sku.depthIn * sku.heightIn * blockQty
  const capVolumeIn3 = cap
    ? cap.widthIn * cap.depthIn * cap.heightIn * derived.capCount
    : 0
  const weightLb =
    cubicInchesToCubicFeet(blockVolumeIn3 + capVolumeIn3) *
    CONCRETE_DENSITY_LB_PER_FT3
  lines.push({
    label: 'Total weight',
    qty: weightLb,
    unit: 'lb',
    unitPrice: null,
    total: null,
  })

  return lines
}
