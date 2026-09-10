import { Instance } from '@react-three/drei'
import { useMemo } from 'react'
import { Color } from 'three'

import type { BlockPlacement } from '../model/types'

/**
 * One course of wall units. The <Instances> parent that owns the draw call
 * lives in Wall.tsx; <Instance> finds it through context, so splitting the
 * courses into components costs nothing at render time.
 *
 * This component computes nothing (SPEC §5): every value here was derived by
 * deriveWall and is already in scene units.
 */
export function BlockCourse({
  placements,
  colorHex,
}: {
  placements: BlockPlacement[]
  colorHex: string
}) {
  // The model decides how far each piece strays from the colorway; turning that
  // scalar into a colour is the only arithmetic here.
  const colors = useMemo(
    () =>
      placements.map((block) =>
        new Color(colorHex).multiplyScalar(block.valueScale),
      ),
    [placements, colorHex],
  )

  return (
    <>
      {placements.map((block, i) => (
        <Instance
          key={block.indexInCourse}
          position={block.position}
          rotation={[0, block.rotationY, 0]}
          scale={block.scale}
          color={colors[i]}
        />
      ))}
    </>
  )
}
