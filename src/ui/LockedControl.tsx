import type { ReactNode } from 'react'

/**
 * The wrapper every not-yet-built control renders through (SPEC §10).
 *
 * It is a div and never a button, on purpose: a locked item has no handler to
 * ignore a click with, because there is nothing to click. Reduced opacity, a
 * padlock, `cursor: not-allowed` and the hour estimate alongside are what turn
 * a dead control into a legible roadmap instead of an apparent bug.
 */
function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3 w-3 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="10.5" width="16" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  )
}

export function LockedControl({
  estimateHours,
  className = '',
  children,
}: {
  estimateHours: number
  className?: string
  children: ReactNode
}) {
  return (
    <div
      aria-disabled="true"
      title={`Not built yet — roughly ${estimateHours}h of work`}
      className={`flex cursor-not-allowed select-none items-center gap-2 opacity-55 ${className}`}
    >
      {children}
      <span className="ml-auto flex shrink-0 items-center gap-1 text-[10px] font-medium tabular-nums text-stone-500">
        <LockIcon />
        {estimateHours}h
      </span>
    </div>
  )
}
