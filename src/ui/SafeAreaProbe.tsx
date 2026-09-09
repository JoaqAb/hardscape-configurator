import { useEffect, useRef } from 'react'

import { useViewport } from '../store/useViewport'

/**
 * Measures the safe area (SPEC §13) by occupying it.
 *
 * The rect is taken from a real element rather than computed from the panel
 * width constants, so the measurement cannot drift from the layout: if a panel
 * changes width, gains a margin or is hidden at a breakpoint, the probe already
 * reports the truth.
 *
 * Reads are coalesced to one animation frame, so dragging a window edge costs
 * one store write per frame rather than one per pixel.
 */
export function SafeAreaProbe() {
  const setSafeRect = useViewport((s) => s.setSafeRect)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let frame = 0
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setSafeRect({ width, height }))
    })

    observer.observe(element)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [setSafeRect])

  return <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0" />
}
