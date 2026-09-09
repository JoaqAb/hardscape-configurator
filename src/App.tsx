import { useMemo } from 'react'

import { deriveWall } from './model/wall'
import { Scene } from './scene/Scene'
import { useConfigurator } from './store/useConfigurator'
import { ControlPanel } from './ui/ControlPanel'
import { VersionBadge } from './ui/VersionBadge'

export default function App() {
  const config = useConfigurator((s) => s.config)

  // The single derivation. The scene and the panel read the same object, which
  // is what keeps what is drawn and what is reported from ever disagreeing.
  const derived = useMemo(() => deriveWall(config), [config])

  return (
    <div className="flex h-full flex-col bg-stone-100 lg:flex-row">
      <div className="relative h-[45vh] shrink-0 lg:order-2 lg:h-full lg:flex-1">
        <Scene derived={derived} />
        <VersionBadge />
      </div>

      <aside className="min-h-0 flex-1 overflow-y-auto border-stone-200 bg-white lg:order-1 lg:w-80 lg:flex-none lg:border-r">
        <ControlPanel derived={derived} />
      </aside>
    </div>
  )
}
