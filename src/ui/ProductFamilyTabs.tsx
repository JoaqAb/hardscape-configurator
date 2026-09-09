import { featuresIn } from '../data/features'
import { LockedControl } from './LockedControl'

/**
 * The product families (SPEC §10). Only Retaining Wall is built; the rest are
 * the roadmap, and they are the clearest evidence that swapping the catalog
 * swaps the product without touching the rendering layer.
 *
 * They wrap as chips rather than stack as rows. Six full-width rows pushed the
 * sizing controls and Copy link below the fold, and the families are secondary
 * evidence: they must not cost the primary controls their place on screen.
 *
 * Nothing here knows which family is active. It reads `locked` off the registry,
 * so unlocking one is a data change.
 */
export function ProductFamilyTabs() {
  return (
    <section>
      <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
        Product family
      </h2>
      <div className="flex flex-wrap gap-1">
        {featuresIn('family').map((family) =>
          family.locked ? (
            <LockedControl
              key={family.id}
              estimateHours={family.estimateHours}
              className="rounded border border-stone-200 px-1.5 py-1"
            >
              <span className="text-[11px] leading-none text-stone-600">
                {family.label}
              </span>
            </LockedControl>
          ) : (
            <button
              key={family.id}
              type="button"
              aria-pressed="true"
              className="rounded border border-accent bg-accent-soft px-1.5 py-1 text-[11px] font-medium leading-none text-stone-800"
            >
              {family.label}
            </button>
          ),
        )}
      </div>
    </section>
  )
}
