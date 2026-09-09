import { useViewport } from '../store/useViewport'

/**
 * The control card collapsed (SPEC §13). A rail at the screen edge, wide enough
 * to be an obvious affordance and narrow enough to give the frame back to the
 * wall. Collapsing is a persistent layout change, so it does move the safe rect
 * and the camera refits.
 */
export function ControlRail() {
  const toggle = useViewport((s) => s.toggleControlCollapsed)

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded="false"
      title="Show the configurator"
      className="pointer-events-auto flex h-40 w-10 shrink-0 flex-col items-center justify-center gap-3 rounded-lg border border-stone-200 bg-white text-stone-600 shadow-xl transition-colors hover:border-stone-300"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
      <span
        className="text-[11px] font-medium uppercase tracking-wider"
        style={{ writingMode: 'vertical-rl' }}
      >
        Configure
      </span>
    </button>
  )
}
