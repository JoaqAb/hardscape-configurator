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
/**
 * Large enough that the plane's outer edge lands within a degree of the true
 * horizon at the default framing, so it reads as a horizon rather than as the
 * straight cut SPEC §8.8 warns about. It is one quad; the size costs nothing.
 */
const GROUND_HALF_FT = 4000
/**
 * The bank gets the same treatment as the ground plane (SPEC §13): its rear
 * edge and both end faces have to leave the frustum, or the fill reads as a
 * slab on a table. Sized from the run so it scales with the camera distance,
 * which scales with the run.
 */
/**
 * The bank gets the same treatment as the ground plane: it is large enough that
 * its rear edge and both end faces are outside the frustum at every
 * configuration and every camera extreme. A bank sized to the wall always has
 * its ends converging toward the vanishing point somewhere in frame, which is
 * the slab-on-a-table reading §13 rules out.
 *
 * What remains visible is a continuous grade step at the wall line, which is
 * what a retained bank actually is: the wall is one built section of it.
 */
const BANK_DEPTH_FT = 3000
const BANK_OVERRUN_FT = 1500

// Turf is background. It occupies far more pixels than the product does, so it
// is kept dark and low in chroma: the wall face has to be the lightest and
// highest-contrast thing in the frame (SPEC §13).
const GRASS = '#666d5d'
/** Kept a shade under the lawn: the top of the fill is the one part of the job
 *  nobody wants to look at, so it must not be the brightest thing up there. */
const TERRACE = '#565d4d'
/** Only the face the wall hides is a fresh cut; the rest of the bank is turfed. */
const BANK_SIDE = '#525946'
const SOIL = '#6b6152'

export function Terrain({ derived }: { derived: DerivedWall }) {
  const runFt = inToFt(derived.runLengthIn)
  const heightFt = inToFt(derived.wallHeightIn)
  const backOfWallFt = inToFt(derived.sku.depthIn + derived.topSetbackIn)

  const bankDepthFt = BANK_DEPTH_FT
  const bankWidthFt = runFt + BANK_OVERRUN_FT * 2

  // The bank starts at the back of the wall and runs away from the viewer, its
  // top flush with the top course: that is the terrace being held.
  const bankCentreZ = -backOfWallFt - bankDepthFt / 2

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
        <boxGeometry args={[bankWidthFt, heightFt, bankDepthFt]} />
        {/* Face order is +x, -x, +y, -y, +z, -z. */}
        <meshStandardMaterial attach="material-0" color={BANK_SIDE} roughness={1} />
        <meshStandardMaterial attach="material-1" color={BANK_SIDE} roughness={1} />
        <meshStandardMaterial attach="material-2" color={TERRACE} roughness={1} />
        <meshStandardMaterial attach="material-3" color={SOIL} roughness={1} />
        <meshStandardMaterial attach="material-4" color={BANK_SIDE} roughness={1} />
        <meshStandardMaterial attach="material-5" color={BANK_SIDE} roughness={1} />
      </mesh>
    </group>
  )
}
