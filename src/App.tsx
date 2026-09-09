import { useEffect, useMemo } from 'react'

import { deriveWall } from './model/wall'
import { Scene } from './scene/Scene'
import { useConfigurator } from './store/useConfigurator'
import { syncUrl } from './store/urlState'
import { ControlPanel } from './ui/ControlPanel'
import { SafeAreaProbe } from './ui/SafeAreaProbe'
import { TakeoffPanel } from './ui/TakeoffPanel'
import { VersionBadge } from './ui/VersionBadge'

/**
 * Full bleed at desktop (SPEC §13): the canvas is the viewport and the two
 * panels float over it as opaque cards, one at each edge.
 *
 * The panel layer covers the whole viewport, so it is `pointer-events-none` and
 * the cards themselves switch it back on. Without that, an invisible sheet would
 * swallow every orbit drag.
 *
 * Below `lg` this collapses back to the stacked layout: an overlay panel on a
 * 390px screen is the whole screen.
 */
const PANEL =
  'min-h-0 overflow-y-auto bg-white lg:pointer-events-auto lg:w-80 lg:max-h-full lg:self-start lg:rounded-lg lg:border lg:border-stone-200 lg:shadow-xl'

export default function App() {
  const config = useConfigurator((s) => s.config)

  // The single derivation. The scene, the panel and the takeoff read the same
  // object, which is what keeps what is drawn and what is quoted from ever
  // disagreeing.
  const derived = useMemo(() => deriveWall(config), [config])

  // The address bar always describes the wall on screen, via replaceState so
  // that dragging a slider does not bury the back button.
  useEffect(() => {
    syncUrl(config)
  }, [config])

  return (
    <div className="flex h-full flex-col bg-stone-100">
      <div className="relative h-[45vh] shrink-0 lg:fixed lg:inset-0 lg:z-0 lg:h-full">
        <Scene derived={derived} />
        <div className="lg:hidden">
          <VersionBadge />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:pointer-events-none lg:fixed lg:inset-0 lg:z-10 lg:flex-row lg:items-stretch lg:p-6">
        <aside className={PANEL}>
          <ControlPanel derived={derived} />
        </aside>

        {/* The gap between the cards: measured, not assumed, and the only place
            the version badge can sit without covering either panel. */}
        <div className="relative hidden lg:mx-6 lg:flex lg:flex-1 lg:items-end lg:justify-end">
          <SafeAreaProbe />
          <VersionBadge />
        </div>

        <aside className={`${PANEL} border-t border-stone-200 lg:border-t`}>
          <TakeoffPanel derived={derived} />
        </aside>
      </div>
    </div>
  )
}
