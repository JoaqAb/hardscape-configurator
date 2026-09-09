import { useMemo } from 'react'

import { deriveWall } from './model/wall'
import { Scene } from './scene/Scene'
import { useConfigurator } from './store/useConfigurator'
import { ControlPanel } from './ui/ControlPanel'
import { TakeoffPanel } from './ui/TakeoffPanel'
import { VersionBadge } from './ui/VersionBadge'

export default function App() {
  const config = useConfigurator((s) => s.config)

  // The single derivation. The scene, the panel and the takeoff read the same
  // object, which is what keeps what is drawn and what is quoted from ever
  // disagreeing.
  const derived = useMemo(() => deriveWall(config), [config])

  return (
    <div className="flex h-full flex-col bg-stone-100 lg:flex-row">
      <div className="relative h-[45vh] shrink-0 lg:order-2 lg:h-full lg:flex-1">
        <Scene derived={derived} />
        <VersionBadge />
      </div>

      <aside className="min-h-0 overflow-y-auto bg-white lg:order-1 lg:w-80 lg:shrink-0 lg:border-r lg:border-stone-200">
        <ControlPanel derived={derived} />
      </aside>

      <aside className="min-h-0 overflow-y-auto border-t border-stone-200 bg-white lg:order-3 lg:w-80 lg:shrink-0 lg:border-l lg:border-t-0">
        <TakeoffPanel derived={derived} />
      </aside>
    </div>
  )
}
