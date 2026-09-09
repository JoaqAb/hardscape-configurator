import { useEffect, useMemo } from 'react'

import { deriveWall } from './model/wall'
import { Scene } from './scene/Scene'
import { useConfigurator } from './store/useConfigurator'
import { syncUrl } from './store/urlState'
import { useViewport } from './store/useViewport'
import { ControlPanel } from './ui/ControlPanel'
import { LeadForm } from './ui/LeadForm'
import { ControlRail } from './ui/ControlRail'
import { RoadmapPill } from './ui/RoadmapPill'
import { SafeAreaProbe } from './ui/SafeAreaProbe'
import { TakeoffBar } from './ui/TakeoffBar'
import { TakeoffPanel } from './ui/TakeoffPanel'
import { VersionBadge } from './ui/VersionBadge'

/**
 * Full bleed at desktop (SPEC §13): the canvas is the viewport and three
 * elements float over it — the control card top left, the roadmap pill top
 * right, the takeoff bar along the bottom.
 *
 * The overlay covers the whole viewport, so it is `pointer-events-none` and
 * each floating element switches it back on. Without that, an invisible sheet
 * would swallow every orbit drag.
 *
 * Below `lg` this renders exactly what block 2D rendered: stacked, canvas
 * first. An overlay panel on a 390px screen is the whole screen.
 */
export default function App() {
  const config = useConfigurator((s) => s.config)
  const collapsed = useViewport((s) => s.controlCollapsed)
  const leadFormOpen = useViewport((s) => s.leadFormOpen)

  // The single derivation. The scene, the card and the takeoff read the same
  // object, which is what keeps what is drawn and what is quoted from ever
  // disagreeing.
  const derived = useMemo(() => deriveWall(config), [config])

  // The address bar always describes the wall on screen, via replaceState so
  // that dragging a slider does not bury the back button.
  useEffect(() => {
    syncUrl(config)
  }, [config])

  return (
    <div className="flex min-h-full flex-col bg-stone-100 lg:h-full">
      <div className="relative h-[45vh] shrink-0 lg:fixed lg:inset-0 lg:z-0 lg:h-full">
        <Scene derived={derived} />
        <div className="lg:hidden">
          <VersionBadge />
        </div>
      </div>

      {/* Mobile is normal page flow with no height cap: capping it inherited
          the desktop card's scroll box and collapsed the panel to about one
          row. Below the breakpoint the page scrolls and the canvas keeps its
          fixed height (SPEC §13). */}
      <div className="flex flex-col lg:hidden">
        <aside className="bg-white">
          <ControlPanel derived={derived} />
        </aside>
        <aside className="border-t border-stone-200 bg-white">
          <TakeoffPanel derived={derived} />
        </aside>
        {leadFormOpen && (
          <div className="border-t border-stone-200 bg-stone-100 p-4">
            <LeadForm derived={derived} />
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed inset-0 z-10 hidden flex-col p-6 lg:flex">
        <div className="flex min-h-0 flex-1 gap-6">
          {collapsed ? (
            <ControlRail />
          ) : (
            <aside className="pointer-events-auto max-h-full w-80 shrink-0 self-start overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-xl">
              <ControlPanel derived={derived} />
            </aside>
          )}

          {/* The safe area: measured by the probe that occupies it. The roadmap
              card floats over this region but is not part of it, because it is
              a transient overlay and must not move the camera. */}
          <div className="relative flex flex-1 items-end justify-end">
            <SafeAreaProbe />
            <VersionBadge />
            <div className="absolute right-0 top-0 flex max-h-full flex-col items-end">
              <RoadmapPill />
            </div>
            {/* Transient overlay, like the roadmap: it neither changes the safe
                rect nor refits the camera. */}
            {leadFormOpen && (
              <div className="absolute bottom-0 right-0 flex max-h-full flex-col items-end">
                <LeadForm derived={derived} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 shrink-0">
          <TakeoffBar derived={derived} />
        </div>
      </div>
    </div>
  )
}
