import { PRICING } from '../data/pricing'
import {
  ENGINEERED_WALL_NOTICE,
  computeTakeoff,
  needsEngineeredDesign,
} from '../model/takeoff'
import type { DerivedWall, TakeoffLine } from '../model/types'
import { formatQuantity, formatUsd } from '../model/units'
import { useMemo } from 'react'

/**
 * A sales-facing quantities summary (SPEC §9), deliberately quiet. It must not
 * compete with the style and colorway controls for attention, so it is set at
 * small sizes with no card chrome: when in doubt, smaller.
 *
 * Every number here comes out of computeTakeoff. Nothing is calculated in JSX.
 */

/** A line denominated in money has no separate quantity to show. */
function isMoneyLine(line: TakeoffLine): boolean {
  return line.unit === 'USD'
}

export function TakeoffPanel({ derived }: { derived: DerivedWall }) {
  const lines = useMemo(() => computeTakeoff(derived, PRICING), [derived])
  const engineered = needsEngineeredDesign(derived)

  return (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
        Estimate
      </h2>

      <dl className="text-[11px] leading-relaxed">
        {lines.map((line) => (
          <div
            key={line.label}
            className={`grid grid-cols-[1fr_auto] items-baseline gap-x-3 py-0.5 ${
              isMoneyLine(line) ? 'mt-1 border-t border-stone-200 pt-1.5' : ''
            }`}
          >
            <dt
              className={
                isMoneyLine(line)
                  ? 'font-medium text-stone-700'
                  : 'text-stone-500'
              }
            >
              {line.label}
            </dt>
            <dd
              className={`text-right tabular-nums ${
                isMoneyLine(line)
                  ? 'text-sm font-semibold text-stone-900'
                  : 'text-stone-700'
              }`}
            >
              {isMoneyLine(line) ? (
                formatUsd(line.qty)
              ) : (
                <>
                  {formatQuantity(line.qty)}{' '}
                  <span className="text-stone-400">{line.unit}</span>
                  {line.total !== null && (
                    <span className="ml-2 text-stone-400">
                      {formatUsd(line.total)}
                    </span>
                  )}
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {engineered && (
        <p className="rounded border border-amber-300 bg-amber-50 px-2.5 py-2 text-[11px] leading-snug text-amber-900">
          {ENGINEERED_WALL_NOTICE}
        </p>
      )}

      <p className="text-[10px] leading-snug text-stone-400">
        Placeholder pricing. Quantities are an estimate for planning, not a
        quote.
      </p>
    </div>
  )
}
