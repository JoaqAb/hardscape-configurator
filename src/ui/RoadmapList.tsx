import {
  FEATURE_GROUP_LABELS,
  ROADMAP_GROUPS,
  featuresIn,
  lockedFamilySubtotal,
  lockedStyleSubtotal,
} from '../data/features'
import { LockedControl } from './LockedControl'

/**
 * The locked registry, grouped (SPEC §10). Shared by the desktop roadmap card
 * and the mobile takeoff panel so there is one rendering of the registry, not
 * one per layout.
 *
 * The header counts every locked item in the product, and two of the groups do
 * not render here: the product families are the tabs and the wall styles are in
 * the style grid. They close the list as subtotals, so the column adds up to the
 * header instead of promising more than it shows (§9).
 */
function Subtotal({
  label,
  where,
  count,
  hours,
}: {
  label: string
  where: string
  count: number
  hours: number
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5">
      <span className="min-w-0">
        <span className="text-[11px] text-stone-600">{label}</span>
        <span className="block text-[10px] leading-tight text-stone-400">
          {where}
        </span>
      </span>
      <span className="shrink-0 text-[10px] font-medium tabular-nums text-stone-500">
        {count} locked · {hours}h
      </span>
    </div>
  )
}
export function RoadmapList() {
  return (
    <div className="flex flex-col gap-3">
      {ROADMAP_GROUPS.map((group) => (
        <section key={group}>
          <h3 className="mb-1 text-[10px] font-medium uppercase tracking-wide text-stone-400">
            {FEATURE_GROUP_LABELS[group]}
          </h3>
          <div className="flex flex-col gap-0.5">
            {featuresIn(group)
              .filter((feature) => feature.locked)
              .map((feature) => (
                <LockedControl
                  key={feature.id}
                  estimateHours={feature.estimateHours}
                  className="py-0.5"
                >
                  <span className="truncate text-[11px] text-stone-600">
                    {feature.label}
                  </span>
                </LockedControl>
              ))}
          </div>
        </section>
      ))}

      <section>
        <h3 className="mb-1 text-[10px] font-medium uppercase tracking-wide text-stone-400">
          Elsewhere in this panel
        </h3>
        <div className="flex flex-col gap-0.5">
          <Subtotal
            label="Product family"
            where="In the tabs at the top of the control card"
            {...lockedFamilySubtotal()}
          />
          <Subtotal
            label="Wall styles"
            where="In the style grid"
            {...lockedStyleSubtotal()}
          />
        </div>
      </section>
    </div>
  )
}
