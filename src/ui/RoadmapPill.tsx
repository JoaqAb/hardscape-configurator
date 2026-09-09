import { useEffect, useRef } from 'react'

import { roadmapTotals } from '../data/features'
import { useViewport } from '../store/useViewport'
import { RoadmapList } from './RoadmapList'

/**
 * The roadmap, collapsed to its two derived numbers (SPEC §10).
 *
 * Closed, it is the budget of the next phase stated in a single line. A closed
 * disclosure is neither a dead control nor pretending to be live, so §10's rule
 * about dead controls is untouched by it.
 *
 * Expanding is a transient overlay, so it deliberately does not touch the safe
 * rect and the camera does not move (SPEC §13).
 */
export function RoadmapPill() {
  const open = useViewport((s) => s.roadmapOpen)
  const setOpen = useViewport((s) => s.setRoadmapOpen)
  const container = useRef<HTMLDivElement>(null)
  const { count, hours } = roadmapTotals()

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointer = (e: PointerEvent) => {
      if (!container.current?.contains(e.target as Node)) setOpen(false)
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open, setOpen])

  return (
    <div ref={container} className="pointer-events-auto flex min-h-0 flex-col items-end">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-xl transition-colors hover:border-stone-300"
      >
        Roadmap
        <span className="text-stone-400"> · </span>
        {count} planned
        <span className="text-stone-400"> · </span>
        {hours}h
      </button>

      {open && (
        <div className="mt-2 max-h-[70vh] w-80 overflow-y-auto rounded-lg border border-stone-200 bg-white p-3 shadow-xl">
          <RoadmapList />
        </div>
      )}
    </div>
  )
}
