import { Instance, Instances } from '@react-three/drei'

import type { BlockPlacement } from '../model/types'

/** The cap course. Its own draw call, because it is its own SKU. */
export function CapCourse({
  placements,
  color,
}: {
  placements: BlockPlacement[]
  color: string
}) {
  if (placements.length === 0) return null

  return (
    <Instances limit={256} range={placements.length} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.82} metalness={0} />
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
