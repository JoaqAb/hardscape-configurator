import {
  ACTIVE_WALL_SKUS,
  WALL_CATALOG,
  isLockedStyle,
  resolveColorway,
} from '../data/catalog'
import type { DerivedWall } from '../model/types'
import { useConfigurator } from '../store/useConfigurator'
import { LockedControl } from './LockedControl'

/**
 * Material selection: the primary interaction of the whole tool (SPEC §1).
 * Style and colorway are independent axes, so picking a style keeps the colour
 * and picking a colour keeps the style.
 *
 * The active colorway is read from the derived wall rather than from the raw
 * config, so what is highlighted is always what is actually on screen.
 */
export function StyleGrid({ derived }: { derived: DerivedWall }) {
  const setSkuId = useConfigurator((s) => s.setSkuId)
  const setColorwayId = useConfigurator((s) => s.setColorwayId)

  const activeColorwayId = derived.colorway.id

  return (
    <div className="space-y-4">
      <section>
        <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
          Style
        </h2>
        <div className="grid grid-cols-1 gap-2">
          {ACTIVE_WALL_SKUS.map((sku) => {
            const selected = sku.id === derived.sku.id
            // Preview each style in the colour the customer is already looking
            // at, falling back where that style does not offer it.
            const preview = resolveColorway(sku, activeColorwayId)

            return (
              <button
                key={sku.id}
                type="button"
                onClick={() => setSkuId(sku.id)}
                aria-pressed={selected}
                className={`flex items-center gap-2.5 rounded-md border px-2 py-1 text-left transition-colors ${
                  selected
                    ? 'border-accent bg-accent-soft'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <span
                  className="h-8 w-12 shrink-0 rounded border border-black/10"
                  style={{ backgroundColor: preview.hex }}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-stone-800">
                    {sku.name}
                  </span>
                  <span className="block text-xs tabular-nums text-stone-500">
                    {sku.widthIn}" × {sku.depthIn}" × {sku.heightIn}"
                  </span>
                </span>
              </button>
            )
          })}

        </div>

        <div className="mt-1 flex flex-wrap gap-1">
          {WALL_CATALOG.filter(isLockedStyle).map((entry) => (
            <LockedControl
              key={entry.id}
              estimateHours={entry.estimateHours}
              className="rounded border border-stone-200 px-1.5 py-1"
            >
              <span
                className="h-4 w-6 shrink-0 rounded-sm border border-black/10"
                style={{ backgroundColor: entry.colorHex }}
              />
              <span className="text-[11px] leading-none text-stone-600">
                {entry.name}
              </span>
            </LockedControl>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
          Color
        </h2>
        <div className="grid grid-cols-2 gap-1">
          {derived.sku.colorways.map((colorway) => {
            const selected = colorway.id === activeColorwayId

            return (
              <button
                key={colorway.id}
                type="button"
                onClick={() => setColorwayId(colorway.id)}
                aria-pressed={selected}
                className={`flex items-center gap-1.5 rounded border px-1.5 py-1 text-left transition-colors ${
                  selected
                    ? 'border-accent bg-accent-soft'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <span
                  className="h-5 w-5 shrink-0 rounded-sm border border-black/10"
                  style={{ backgroundColor: colorway.hex }}
                />
                <span className="text-[11px] font-medium leading-tight text-stone-700">
                  {colorway.name}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
