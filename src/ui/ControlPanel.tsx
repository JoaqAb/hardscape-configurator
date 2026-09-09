import { useState } from 'react'

import type { DerivedWall } from '../model/types'
import { formatFeetInches, inToFt } from '../model/units'
import {
  MAX_COURSES,
  MAX_RUN_FT,
  MIN_COURSES,
  MIN_RUN_FT,
  PRESETS,
  useConfigurator,
} from '../store/useConfigurator'
import { useViewport } from '../store/useViewport'
import { ProductFamilyTabs } from './ProductFamilyTabs'
import { StyleGrid } from './StyleGrid'

/**
 * The link is the lead (SPEC §12), so copying it is a first-class action and
 * has to tell the truth when the clipboard is unavailable rather than claim a
 * success that did not happen.
 */
function CopyLinkButton() {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setState('copied')
    } catch {
      setState('failed')
    }
    setTimeout(() => setState('idle'), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
    >
      {state === 'copied'
        ? 'Link copied'
        : state === 'failed'
          ? 'Copy failed — select the address bar'
          : 'Copy link'}
    </button>
  )
}

function Field({
  label,
  value,
  children,
}: {
  label: string
  value: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          {label}
        </span>
        <span className="text-sm font-medium tabular-nums text-stone-800">
          {value}
        </span>
      </span>
      {children}
    </label>
  )
}

/**
 * Material selection sits at the top because it is the main action (SPEC §1).
 * Dimensions are secondary and read as a smaller, quieter group below it.
 */
export function ControlPanel({ derived }: { derived: DerivedWall }) {
  const config = useConfigurator((s) => s.config)
  const setRunLengthFt = useConfigurator((s) => s.setRunLengthFt)
  const setCourses = useConfigurator((s) => s.setCourses)
  const setCaps = useConfigurator((s) => s.setCaps)
  const applyPreset = useConfigurator((s) => s.applyPreset)
  const collapse = useViewport((s) => s.toggleControlCollapsed)

  const runFt = inToFt(config.runLengthIn)

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-sm font-semibold text-stone-900">
            Retaining Wall Configurator
          </h1>
          <button
            type="button"
            onClick={collapse}
            aria-expanded="true"
            title="Collapse the configurator"
            className="hidden shrink-0 rounded border border-stone-200 p-1 text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-700 lg:block"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>

        <ProductFamilyTabs />

        <StyleGrid derived={derived} />

        <section>
          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
            Presets
          </h2>
          <div className="flex flex-col gap-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="rounded border border-stone-200 px-2.5 py-1 text-left text-xs text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50"
            >
              {preset.label}
            </button>
          ))}
          </div>
        </section>

        <div className="space-y-3 border-t border-stone-200 pt-3">
        <Field label="Wall length" value={formatFeetInches(config.runLengthIn)}>
          <input
            type="range"
            min={MIN_RUN_FT}
            max={MAX_RUN_FT}
            step={1}
            value={runFt}
            onChange={(e) => setRunLengthFt(Number(e.target.value))}
            className="mt-1.5 w-full accent-accent"
          />
        </Field>

        <Field
          label="Courses"
          value={`${config.courses} · ${formatFeetInches(derived.wallHeightIn)}`}
        >
          <input
            type="range"
            min={MIN_COURSES}
            max={MAX_COURSES}
            step={1}
            value={config.courses}
            onChange={(e) => setCourses(Number(e.target.value))}
            className="mt-1.5 w-full accent-accent"
          />
        </Field>

        <label className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Cap course
          </span>
          <input
            type="checkbox"
            checked={config.caps}
            onChange={(e) => setCaps(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
        </label>
      </div>

      </div>

      {/* Pinned to the foot of the column, outside the scroll. §12 calls this
          the bridge to lead capture; whether it is reachable must not depend on
          where the scroll happens to be, now or after anything else is added. */}
      <div className="sticky bottom-0 mt-auto space-y-2 border-t border-stone-200 bg-white p-3">
        {/* Counts live in the takeoff panel; the finished dimension belongs
            with the action, because it is what the customer is about to share. */}
        <dl className="grid grid-cols-2 text-xs">
          <dt className="text-stone-500">Finished height</dt>
          <dd className="text-right font-medium tabular-nums text-stone-800">
            {formatFeetInches(derived.totalHeightIn)}
          </dd>
        </dl>
        <CopyLinkButton />
      </div>
    </div>
  )
}
