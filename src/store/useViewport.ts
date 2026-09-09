import { create } from 'zustand'

/**
 * The measured safe area: the part of the viewport that is not under a panel
 * (SPEC §13). It is deliberately a separate store from `useConfigurator`.
 *
 * This is a property of the browser window, not of the wall, so it must never
 * reach `urlState`: a link is a description of a project, and it cannot start
 * carrying the sender's window size.
 */
export type SafeRect = {
  width: number
  height: number
}

type ViewportStore = {
  safeRect: SafeRect
  setSafeRect: (rect: SafeRect) => void
}

export const useViewport = create<ViewportStore>((set) => ({
  /** Zero until the probe reports; the camera treats that as "no panels". */
  safeRect: { width: 0, height: 0 },

  // Writing only on an actual change keeps a drag-resize from waking every
  // subscriber with the value it already had.
  setSafeRect: (rect) =>
    set((state) =>
      state.safeRect.width === rect.width &&
      state.safeRect.height === rect.height
        ? state
        : { safeRect: rect },
    ),
}))
