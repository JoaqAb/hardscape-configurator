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

  const runFt = inToFt(config.runLengthIn)

  return (
    <div className="flex flex-col gap-6 p-4">
      <header>
        <h1 className="text-base font-semibold text-stone-900">
          Retaining Wall Configurator
        </h1>
        <p className="mt-0.5 text-xs text-stone-500">
          Choose a style and color, then size the wall.
        </p>
      </header>

      <ProductFamilyTabs />

      <StyleGrid derived={derived} />

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
          Presets
        </h2>
        <div className="flex flex-col gap-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="rounded-md border border-stone-200 px-2.5 py-1.5 text-left text-xs text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-4 border-t border-stone-200 pt-5">
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

      {/* Counts live in the takeoff panel; repeating them here would only give
          the same number two homes. */}
      <dl className="grid grid-cols-2 gap-y-1.5 border-t border-stone-200 pt-4 text-xs">
        <dt className="text-stone-500">Finished height</dt>
        <dd className="text-right font-medium tabular-nums text-stone-800">
          {formatFeetInches(derived.totalHeightIn)}
        </dd>
      </dl>

      <CopyLinkButton />
    </div>
  )
}
