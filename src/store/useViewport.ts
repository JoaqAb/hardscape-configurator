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
  left: number
  top: number
  width: number
  height: number
}

type ViewportStore = {
  safeRect: SafeRect
  setSafeRect: (rect: SafeRect) => void
  /**
   * Whether the control card is collapsed to its rail. UI state, so it lives
   * here and not in `useConfigurator`: §12 serialises the wall, and a panel
   * being open is not part of the wall.
   */
  controlCollapsed: boolean
  toggleControlCollapsed: () => void
  /** Transient overlay, so it deliberately does not touch the safe rect. */
  roadmapOpen: boolean
  setRoadmapOpen: (open: boolean) => void
  /** Also a transient overlay: it must not move the camera either. */
  leadFormOpen: boolean
  setLeadFormOpen: (open: boolean) => void
}

export const useViewport = create<ViewportStore>((set) => ({
  /** Zero until the probe reports; the camera treats that as "no panels". */
  safeRect: { left: 0, top: 0, width: 0, height: 0 },

  // Writing only on an actual change keeps a drag-resize from waking every
  // subscriber with the value it already had.
  setSafeRect: (rect) =>
    set((state) =>
      state.safeRect.left === rect.left &&
      state.safeRect.top === rect.top &&
      state.safeRect.width === rect.width &&
      state.safeRect.height === rect.height
        ? state
        : { safeRect: rect },
    ),

  controlCollapsed: false,
  toggleControlCollapsed: () =>
    set((state) => ({ controlCollapsed: !state.controlCollapsed })),

  roadmapOpen: false,
  setRoadmapOpen: (roadmapOpen) => set({ roadmapOpen }),

  leadFormOpen: false,
  setLeadFormOpen: (leadFormOpen) => set({ leadFormOpen }),
}))
