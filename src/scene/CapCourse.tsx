import { Instance, Instances } from '@react-three/drei'
import { useMemo } from 'react'
import { Color } from 'three'

import { CAP_VALUE_FACTOR } from '../data/catalog'
import type { BlockPlacement } from '../model/types'

/**
 * The cap course. Its own draw call, because it is its own SKU.
 *
 * It renders a little darker and a little smoother than the body, which is how
 * a cap reads in the field: a different piece with a different finish.
 */
const CAP_ROUGHNESS = 0.78
export function CapCourse({
  placements,
  color,
}: {
  placements: BlockPlacement[]
  color: string
}) {
  const capColor = useMemo(
    () => new Color(color).multiplyScalar(CAP_VALUE_FACTOR),
    [color],
  )

  if (placements.length === 0) return null

  return (
    <Instances limit={256} range={placements.length} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={capColor}
        roughness={CAP_ROUGHNESS}
        metalness={0}
      />
      {placements.map((cap) => (
        <Instance
          key={cap.indexInCourse}
          position={cap.position}
          rotation={[0, cap.rotationY, 0]}
          scale={cap.scale}
        />
      ))}
    </Instances>
  )
}
