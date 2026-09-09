/**
 * Config <-> query params (SPEC §12).
 *
 * The link is the lead: a customer builds a wall, shares the URL, and that URL
 * has to rebuild the same wall for whoever opens it. So hydration is forgiving
 * by construction — it never throws and never returns a partial config, it
 * falls back field by field to the defaults.
 */

import { ACTIVE_WALL_SKUS, isBuildable, WALL_CATALOG } from '../data/catalog'
import type { WallConfig, WallSku } from '../model/types'
import { ftToIn, inToFt } from '../model/units'

const PARAM = {
  sku: 'sku',
  colorway: 'color',
  runFt: 'len',
  courses: 'courses',
  caps: 'caps',
  returnEnabled: 'ret',
  returnRunFt: 'retlen',
} as const

/**
 * One rule for every number: anything that is not a finite value inside the
 * control's own range is invalid and falls back to the default. Clamping was
 * tempting, but it turns `courses=-99` into a one-course wall and pretends that
 * was the intent. We only ever write in-range values, so the only URLs this
 * rejects are hand-edited ones.
 */
function readNumber(
  raw: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw === null) return fallback
  const value = Number(raw)
  if (!Number.isFinite(value) || value < min || value > max) return fallback
  return value
}

/** Strictly the two values we write. Anything else is not a boolean we sent. */
function readCaps(raw: string | null, fallback: boolean): boolean {
  if (raw === '1') return true
  if (raw === '0') return false
  return fallback
}

function readSku(raw: string | null, fallback: string): WallSku {
  const match = WALL_CATALOG.filter(isBuildable).find((sku) => sku.id === raw)
  return match ?? ACTIVE_WALL_SKUS.find((s) => s.id === fallback) ?? ACTIVE_WALL_SKUS[0]
}

export function hydrateConfig(
  search: string,
  defaults: WallConfig,
  bounds: {
    minRunFt: number
    maxRunFt: number
    minCourses: number
    maxCourses: number
    minReturnFt: number
    maxReturnFt: number
  },
): WallConfig {
  const params = new URLSearchParams(search)

  // The style resolves first, on purpose: the colorway is only meaningful
  // against a style, so validating it against the default SKU rather than the
  // one in the URL is exactly how a shared link loses its colour.
  const sku = readSku(params.get(PARAM.sku), defaults.skuId)

  const requestedColorway = params.get(PARAM.colorway)
  const colorway =
    sku.colorways.find((c) => c.id === requestedColorway) ?? sku.colorways[0]

  return {
    skuId: sku.id,
    colorwayId: colorway.id,
    runLengthIn: ftToIn(
      Math.round(
        readNumber(
          params.get(PARAM.runFt),
          inToFt(defaults.runLengthIn),
          bounds.minRunFt,
          bounds.maxRunFt,
        ),
      ),
    ),
    courses: Math.round(
      readNumber(
        params.get(PARAM.courses),
        defaults.courses,
        bounds.minCourses,
        bounds.maxCourses,
      ),
    ),
    caps: readCaps(params.get(PARAM.caps), defaults.caps),
    returnEnabled: readCaps(
      params.get(PARAM.returnEnabled),
      defaults.returnEnabled,
    ),
    returnRunFt: readNumber(
      params.get(PARAM.returnRunFt),
      defaults.returnRunFt,
      bounds.minReturnFt,
      bounds.maxReturnFt,
    ),
  }
}

export function configToSearch(config: WallConfig): string {
  const params = new URLSearchParams({
    [PARAM.sku]: config.skuId,
    [PARAM.colorway]: config.colorwayId,
    [PARAM.runFt]: String(inToFt(config.runLengthIn)),
    [PARAM.courses]: String(config.courses),
    [PARAM.caps]: config.caps ? '1' : '0',
    [PARAM.returnEnabled]: config.returnEnabled ? '1' : '0',
    [PARAM.returnRunFt]: String(config.returnRunFt),
  })
  return params.toString()
}

/**
 * The shareable link for a config. Built from the config rather than read off
 * the address bar, so `Copy link` and the captured lead cannot drift apart.
 */
export function shareUrlFor(config: WallConfig): string {
  return `${window.location.origin}${window.location.pathname}?${configToSearch(config)}`
}

/** replaceState, never pushState: sizing a wall must not fill the back button. */
export function syncUrl(config: WallConfig): void {
  const url = `${window.location.pathname}?${configToSearch(config)}`
  window.history.replaceState(null, '', url)
}
