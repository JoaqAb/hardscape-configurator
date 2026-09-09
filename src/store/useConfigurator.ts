import { create } from 'zustand'

import { DEFAULT_COLORWAY_ID, DEFAULT_SKU_ID } from '../data/catalog'
import type { WallConfig } from '../model/types'
import { ftToIn } from '../model/units'

/** Bounds for the dimension controls, in the units the controls speak. */
export const MIN_RUN_FT = 8
export const MAX_RUN_FT = 80
export const MIN_COURSES = 1
export const MAX_COURSES = 10

export const DEFAULT_CONFIG: WallConfig = {
  skuId: DEFAULT_SKU_ID,
  colorwayId: DEFAULT_COLORWAY_ID,
  runLengthIn: ftToIn(24),
  courses: 4,
  caps: true,
}

type ConfiguratorStore = {
  config: WallConfig
  setSkuId: (skuId: string) => void
  setColorwayId: (colorwayId: string) => void
  setRunLengthFt: (feet: number) => void
  setCourses: (courses: number) => void
  setCaps: (caps: boolean) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export const useConfigurator = create<ConfiguratorStore>((set) => ({
  config: DEFAULT_CONFIG,

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
}))
