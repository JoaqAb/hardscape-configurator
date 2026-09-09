import { create } from 'zustand'

import { DEFAULT_COLORWAY_ID, DEFAULT_SKU_ID } from '../data/catalog'
import type { WallConfig } from '../model/types'
import { ftToIn } from '../model/units'
import { hydrateConfig } from './urlState'

/** Bounds for the dimension controls, in the units the controls speak. */
export const MIN_RUN_FT = 8
export const MAX_RUN_FT = 80
export const MIN_COURSES = 1
export const MAX_COURSES = 10
export const MIN_RETURN_FT = 8
export const MAX_RETURN_FT = 20

export const DEFAULT_CONFIG: WallConfig = {
  skuId: DEFAULT_SKU_ID,
  colorwayId: DEFAULT_COLORWAY_ID,
  runLengthIn: ftToIn(24),
  courses: 4,
  caps: true,
  returnEnabled: false,
  returnRunFt: 12,
}

/**
 * Presets (SPEC §14), named the way the trade names them.
 *
 * A preset is a config, not a handler, so it lives here as data. It carries
 * dimensions only: material selection is the primary interaction (SPEC §1), and
 * a size shortcut has no business throwing away the colour the customer picked.
 */
export type Preset = {
  id: string
  label: string
  config: Pick<WallConfig, 'runLengthIn' | 'courses' | 'caps'>
}

export const PRESETS: Preset[] = [
  {
    id: 'garden-wall',
    label: "Garden wall — 20' × 3 courses",
    config: { runLengthIn: ftToIn(20), courses: 3, caps: true },
  },
  {
    id: 'backyard-terrace',
    label: "Backyard terrace — 40' × 6 courses",
    config: { runLengthIn: ftToIn(40), courses: 6, caps: true },
  },
  {
    id: 'driveway-edge',
    label: "Driveway edge — 60' × 2 courses",
    config: { runLengthIn: ftToIn(60), courses: 2, caps: true },
  },
]

type ConfiguratorStore = {
  config: WallConfig
  setSkuId: (skuId: string) => void
  setColorwayId: (colorwayId: string) => void
  setRunLengthFt: (feet: number) => void
  setCourses: (courses: number) => void
  setCaps: (caps: boolean) => void
  setReturnEnabled: (returnEnabled: boolean) => void
  setReturnRunFt: (feet: number) => void
  applyPreset: (presetId: string) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

const BOUNDS = {
  minRunFt: MIN_RUN_FT,
  maxRunFt: MAX_RUN_FT,
  minCourses: MIN_COURSES,
  maxCourses: MAX_COURSES,
  minReturnFt: MIN_RETURN_FT,
  maxReturnFt: MAX_RETURN_FT,
}

export const useConfigurator = create<ConfiguratorStore>((set) => ({
  // Hydrated at construction rather than in an effect, so the first render is
  // already the wall the link describes and nothing flashes the default first.
  config: hydrateConfig(window.location.search, DEFAULT_CONFIG, BOUNDS),

  // Style and colorway are independent axes (SPEC §7), so neither setter
  // touches the other. A pairing the new style does not offer is resolved by
  // deriveWall, which means switching away and back keeps the customer's colour.
  setSkuId: (skuId) => set((s) => ({ config: { ...s.config, skuId } })),
  setColorwayId: (colorwayId) =>
    set((s) => ({ config: { ...s.config, colorwayId } })),

  setRunLengthFt: (feet) =>
    set((s) => ({
      config: {
        ...s.config,
        runLengthIn: ftToIn(clamp(feet, MIN_RUN_FT, MAX_RUN_FT)),
      },
    })),
  setCourses: (courses) =>
    set((s) => ({
      config: {
        ...s.config,
        courses: Math.round(clamp(courses, MIN_COURSES, MAX_COURSES)),
      },
    })),
  setCaps: (caps) => set((s) => ({ config: { ...s.config, caps } })),

  setReturnEnabled: (returnEnabled) =>
    set((s) => ({ config: { ...s.config, returnEnabled } })),
  setReturnRunFt: (feet) =>
    set((s) => ({
      config: {
        ...s.config,
        returnRunFt: clamp(feet, MIN_RETURN_FT, MAX_RETURN_FT),
      },
    })),

  applyPreset: (presetId) =>
    set((s) => {
      const preset = PRESETS.find((p) => p.id === presetId)
      return preset ? { config: { ...s.config, ...preset.config } } : s
    }),
}))
