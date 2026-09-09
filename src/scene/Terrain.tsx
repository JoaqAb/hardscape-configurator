import { useMemo } from 'react'
import { BufferAttribute, BufferGeometry } from 'three'

import { deriveSite } from '../model/site'
import type { DerivedWall } from '../model/types'
import { inToFt } from '../model/units'

/**
 * Ground in front, a finite retained landform behind (SPEC §8.8).
 *
 * The ground plane runs to the horizon so its edge is never a visible cut. The
 * retained mass is treated the opposite way: it is finite, fully in frame, and
 * returns to grade on its rear and both ends. Its footprint comes from
 * `deriveSite`; nothing here is computed.
 */

/** Large enough that the plane's edge lands on the horizon at any framing. */
const GROUND_HALF_FT = 4000

// Turf is background. It occupies far more pixels than the product does, so it
// is kept dark and low in chroma: the wall face has to be the lightest and
// highest-contrast thing in the frame (SPEC §13).
const GRASS = '#666d5d'
/** The terrace, kept a shade under the lawn: the top of the fill must never be
 *  the brightest thing up there. */
const TERRACE = '#565d4d'
/** The graded slopes are turfed like the rest of the site. */
const SLOPE = '#525946'
/** Only the face the wall holds is a fresh cut. */
const SOIL = '#6b6152'

const FACE_COLOR = {
  front: SOIL,
  top: TERRACE,
  rear: SLOPE,
  left: SLOPE,
  right: SLOPE,
} as const

export function Terrain({ derived }: { derived: DerivedWall }) {
  const runFt = inToFt(derived.runLengthIn)
  const site = useMemo(() => deriveSite(derived), [derived])

  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(site.positions), 3),
    )
    for (const group of site.faceGroups) {
      geo.addGroup(group.start, group.count, site.faceGroups.indexOf(group))
    }
    geo.computeVertexNormals()
    return geo
  }, [site])

  return (
    <group>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[runFt / 2, 0, 0]}
      >
        <planeGeometry args={[GROUND_HALF_FT * 2, GROUND_HALF_FT * 2]} />
        <meshStandardMaterial color={GRASS} roughness={1} metalness={0} />
      </mesh>

      <mesh receiveShadow geometry={geometry}>
        {site.faceGroups.map((group) => (
          <meshStandardMaterial
            key={group.id}
            attach={`material-${site.faceGroups.indexOf(group)}`}
            color={FACE_COLOR[group.id]}
            roughness={1}
            metalness={0}
          />
        ))}
      </mesh>
    </group>
  )
}
