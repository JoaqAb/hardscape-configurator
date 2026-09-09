import { useMemo } from 'react'

import { PRICING } from '../data/pricing'
import {
  ENGINEERED_WALL_NOTICE,
  computeTakeoff,
  needsEngineeredDesign,
} from '../model/takeoff'
import type { DerivedWall, TakeoffLine } from '../model/types'
import { formatQuantity, formatUsd } from '../model/units'
import { useViewport } from '../store/useViewport'

/**
 * The desktop takeoff (SPEC §9, §13): the same lines as the mobile panel, laid
 * out across the bottom instead of down a column.
 *
 * Moving it here returns 320px on the axis the wall is measured on, and a row
 * of figures suits a sales summary at least as well as a list. Same
 * `computeTakeoff`, same numbers, no fields of its own.
 */
function isMoneyLine(line: TakeoffLine): boolean {
  return line.unit === 'USD'
}

export function TakeoffBar({ derived }: { derived: DerivedWall }) {
  const lines = useMemo(() => computeTakeoff(derived, PRICING), [derived])
  const engineered = needsEngineeredDesign(derived)
  const openLeadForm = useViewport((s) => s.setLeadFormOpen)

  const figures = lines.filter((line) => !isMoneyLine(line))
  const total = lines.find(isMoneyLine)

  return (
    <div className="pointer-events-auto rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-xl">
      <div className="flex items-stretch gap-4">
        <dl className="flex min-w-0 flex-1 flex-wrap items-start gap-x-6 gap-y-1">
          {figures.map((line) => (
            <div key={line.label} className="min-w-0">
              <dt className="truncate text-[10px] uppercase tracking-wide text-stone-400">
                {line.label}
              </dt>
              <dd className="whitespace-nowrap text-sm font-medium tabular-nums text-stone-800">
                {formatQuantity(line.qty)}
                <span className="ml-1 text-[11px] font-normal text-stone-400">
                  {line.unit}
                </span>
                {line.total !== null && (
                  <span className="ml-2 text-[11px] font-normal text-stone-400">
                    {formatUsd(line.total)}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        {total && (
          <div className="flex shrink-0 items-center gap-4 border-l border-stone-200 pl-4">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wide text-stone-400">
                {total.label}
              </div>
              <div className="text-xl font-semibold tabular-nums text-stone-900">
                {formatUsd(total.qty)}
              </div>
            </div>
            {/* The estimate is the moment the visitor is qualified, so the
                action sits against the number. Not "Request a quote": §9 is
                explicit that this is not one. */}
            <button
              type="button"
              onClick={() => openLeadForm(true)}
              className="rounded bg-accent px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              Send me this estimate
            </button>
          </div>
        )}
      </div>

      {engineered && (
        <p className="mt-2 border-t border-accent/30 pt-2 text-xs font-medium text-accent">
          {ENGINEERED_WALL_NOTICE}
        </p>
      )}

      <p className="mt-1 text-[10px] text-stone-400">
        Placeholder pricing. Quantities are an estimate for planning, not a quote.
      </p>
    </div>
  )
}
