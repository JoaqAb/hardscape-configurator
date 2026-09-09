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
    <div className="space-y-5">
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
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
                className={`flex items-center gap-3 rounded-md border p-2 text-left transition-colors ${
                  selected
                    ? 'border-accent bg-accent-soft'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <span
                  className="h-10 w-14 shrink-0 rounded border border-black/10"
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

          {WALL_CATALOG.filter(isLockedStyle).map((entry) => (
            <LockedControl
              key={entry.id}
              estimateHours={entry.estimateHours}
              className="rounded-md border border-stone-200 p-2"
            >
              <span
                className="h-10 w-14 shrink-0 rounded border border-black/10"
                style={{ backgroundColor: entry.colorHex }}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-stone-700">
                  {entry.name}
                </span>
                <span className="block text-xs text-stone-500">
                  Awaiting SKU sheet
                </span>
              </span>
            </LockedControl>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
          Color
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {derived.sku.colorways.map((colorway) => {
            const selected = colorway.id === activeColorwayId

            return (
              <button
                key={colorway.id}
                type="button"
                onClick={() => setColorwayId(colorway.id)}
                aria-pressed={selected}
                className={`flex items-center gap-2 rounded-md border p-1.5 text-left transition-colors ${
                  selected
                    ? 'border-accent bg-accent-soft'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <span
                  className="h-7 w-7 shrink-0 rounded border border-black/10"
                  style={{ backgroundColor: colorway.hex }}
                />
                <span className="min-w-0 truncate text-xs font-medium text-stone-700">
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
