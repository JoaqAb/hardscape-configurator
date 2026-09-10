import { Instances } from '@react-three/drei'

import type { DerivedWall } from '../model/types'
import { BlockCourse } from './BlockCourse'
import { CapCourse } from './CapCourse'

/**
 * Every wall unit shares one geometry and one material, so the whole wall is a
 * single <Instances> and therefore a single draw call, however many courses it
 * has (SPEC §8). The per-course components below only group the children.
 */
const INSTANCE_LIMIT = 1024

export function Wall({ derived }: { derived: DerivedWall }) {
  return (
    <group>
      <Instances
        limit={INSTANCE_LIMIT}
        range={derived.blockCount}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        {/* White, because the colorway now arrives per instance: leaving it on
            the material as well multiplies the colour by itself. */}
        <meshStandardMaterial color="#ffffff" roughness={0.88} metalness={0} />
        {derived.courseBlocks.map((placements, course) => (
          <BlockCourse
            key={course}
            placements={placements}
            colorHex={derived.colorway.hex}
          />
        ))}
      </Instances>

      <CapCourse
        placements={derived.capPieces}
        color={derived.colorway.hex}
      />
    </group>
  )
}
