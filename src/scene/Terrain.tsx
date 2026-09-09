import type { DerivedWall } from '../model/types'
import { inToFt } from '../model/units'

/**
 * Ground in front, retained earth behind (SPEC §8.8). Two meshes, no mesh
 * deformation: the terrain is here to explain what the wall is doing, not to be
 * looked at, and every extra piece of landscape earned itself an artefact
 * rather than a better read.
 *
 * The bank carries lawn on top and cut soil on its sides, which is what makes
 * it read as ground being held back rather than as a slab sitting on a field.
 */
const GROUND_HALF_FT = 160
/** Deep enough that its far edge stays out of frame at any wall length. */
const BANK_DEPTH_FT = 30

const GRASS = '#8d9a80'
/** The terrace catches more sun than the lawn below it. */
const TERRACE = '#98a488'
/** Only the face the wall hides is a fresh cut; the rest of the bank is turfed. */
const BANK_SIDE = '#818e75'
const SOIL = '#7a6e58'

export function Terrain({ derived }: { derived: DerivedWall }) {
  const runFt = inToFt(derived.runLengthIn)
  const heightFt = inToFt(derived.wallHeightIn)
  const backOfWallFt = inToFt(derived.sku.depthIn + derived.topSetbackIn)

  // The bank starts at the back of the wall and runs away from the viewer, its
  // top flush with the top course: that is the terrace being held.
  const bankCentreZ = -backOfWallFt - BANK_DEPTH_FT / 2

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

      <mesh receiveShadow position={[runFt / 2, heightFt / 2, bankCentreZ]}>
        <boxGeometry args={[runFt, heightFt, BANK_DEPTH_FT]} />
        {/* Face order is +x, -x, +y, -y, +z, -z. */}
        <meshStandardMaterial attach="material-0" color={BANK_SIDE} roughness={1} />
        <meshStandardMaterial attach="material-1" color={BANK_SIDE} roughness={1} />
        <meshStandardMaterial attach="material-2" color={TERRACE} roughness={1} />
        <meshStandardMaterial attach="material-3" color={SOIL} roughness={1} />
        <meshStandardMaterial attach="material-4" color={SOIL} roughness={1} />
        <meshStandardMaterial attach="material-5" color={BANK_SIDE} roughness={1} />
      </mesh>
    </group>
  )
}
