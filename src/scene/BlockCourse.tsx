import { Instance } from '@react-three/drei'

import type { BlockPlacement } from '../model/types'

/**
 * One course of wall units. The <Instances> parent that owns the draw call
 * lives in Wall.tsx; <Instance> finds it through context, so splitting the
 * courses into components costs nothing at render time.
 *
 * This component computes nothing (SPEC §5): every value here was derived by
 * deriveWall and is already in scene units.
 */
export function BlockCourse({ placements }: { placements: BlockPlacement[] }) {
  return (
    <>
      {placements.map((block) => (
        <Instance
          key={block.indexInCourse}
          position={block.position}
          rotation={[0, block.rotationY, 0]}
          scale={block.scale}
        />
      ))}
    </>
  )
}
