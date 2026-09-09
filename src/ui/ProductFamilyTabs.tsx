import { featuresIn } from '../data/features'
import { LockedControl } from './LockedControl'

/**
 * The product families (SPEC §10). Only Retaining Wall is built; the rest are
 * the roadmap, and they are the clearest evidence that swapping the catalog
 * swaps the product without touching the rendering layer.
 *
 * Nothing here knows which family is active. It reads `locked` off the registry,
 * so unlocking one is a data change.
 */
export function ProductFamilyTabs() {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
        Product family
      </h2>
      <div className="flex flex-col gap-1">
        {featuresIn('family').map((family) =>
          family.locked ? (
            <LockedControl
              key={family.id}
              estimateHours={family.estimateHours}
              className="rounded-md border border-stone-200 px-2.5 py-1.5"
            >
              <span className="truncate text-xs text-stone-600">
                {family.label}
              </span>
            </LockedControl>
          ) : (
            <button
              key={family.id}
              type="button"
              aria-pressed="true"
              className="flex items-center rounded-md border border-accent bg-accent-soft px-2.5 py-1.5 text-left text-xs font-medium text-stone-800"
            >
              {family.label}
            </button>
          ),
        )}
      </div>
    </section>
  )
}
