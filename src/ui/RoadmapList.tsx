import {
  FEATURE_GROUP_LABELS,
  ROADMAP_GROUPS,
  featuresIn,
} from '../data/features'
import { LockedControl } from './LockedControl'

/**
 * The locked registry, grouped (SPEC §10). Shared by the desktop roadmap card
 * and the mobile takeoff panel so there is one rendering of the registry, not
 * one per layout.
 */
export function RoadmapList() {
  return (
    <div className="flex flex-col gap-3">
      {ROADMAP_GROUPS.map((group) => (
        <section key={group}>
          <h3 className="mb-1 text-[10px] font-medium uppercase tracking-wide text-stone-400">
            {FEATURE_GROUP_LABELS[group]}
          </h3>
          <div className="flex flex-col gap-0.5">
            {featuresIn(group).map((feature) => (
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
    </div>
  )
}
