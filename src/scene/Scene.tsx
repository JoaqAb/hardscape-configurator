import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { MathUtils, Vector3 } from 'three'

import type { DerivedWall } from '../model/types'
import { inToFt } from '../model/units'
import { useViewport } from '../store/useViewport'
import { HumanFigure } from './HumanFigure'
import { Terrain } from './Terrain'
import { Wall } from './Wall'

/**
 * Default framing (SPEC §13). The wall is the subject: low enough that the
 * visitor is not looking at the top of the retained fill, and turned off the
 * face far enough that the face, one end, the running bond and the setback all
 * read at once. It is how a mason photographs a finished wall.
 */
const VIEW_ELEVATION_DEG = 17
const VIEW_AZIMUTH_DEG = 30
/** How much of the canvas width the wall should span. */
const WALL_WIDTH_FRACTION = 0.68
const MIN_CAMERA_DISTANCE_FT = 14

const BACKGROUND = '#dcdbd7'

function viewDirection(): Vector3 {
  const elevation = MathUtils.degToRad(VIEW_ELEVATION_DEG)
  const azimuth = MathUtils.degToRad(VIEW_AZIMUTH_DEG)
  return new Vector3(
    Math.sin(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.cos(azimuth) * Math.cos(elevation),
  )
}

/**
 * Places the camera from the wall's own bounding box, once per dimension
 * change and never per frame. <Bounds> is not used: SPEC §13 documents that it
 * fights OrbitControls over the target, and it did.
 */
function CameraRig({ derived }: { derived: DerivedWall }) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)
  const aspect = useThree((s) => s.viewport.aspect)
  const canvasWidth = useThree((s) => s.size.width)
  const safeWidth = useViewport((s) => s.safeRect.width)

  const runFt = inToFt(derived.runLengthIn)
  const heightFt = inToFt(derived.totalHeightIn)
  const depthFt = inToFt(derived.sku.depthIn + derived.topSetbackIn)

  useLayoutEffect(() => {
    if (!('isPerspectiveCamera' in camera) || !camera.isPerspectiveCamera) return

    // The target is the wall's box, not the terrain's.
    const target = new Vector3(runFt / 2, heightFt / 2, -depthFt / 2)

    // Turned off the face, the run foreshortens and the end wall starts to
    // show, so the silhouette we actually have to fit is neither one alone.
    const azimuth = MathUtils.degToRad(VIEW_AZIMUTH_DEG)
    const apparentWidthFt =
      runFt * Math.cos(azimuth) + depthFt * Math.sin(azimuth)

    const halfV = MathUtils.degToRad(camera.fov) / 2
    const halfH = Math.atan(Math.tan(halfV) * aspect)

    // The canvas is the whole viewport, but the wall has to land inside the
    // safe area between the panels (SPEC §13). Safe-area and canvas coordinates
    // are the same space, so the correction is the plain ratio of the two
    // widths. Zero means no probe has reported: stacked layout, no panels over
    // the scene, so the canvas is the safe area.
    const safeFraction =
      safeWidth > 0 && canvasWidth > 0 ? safeWidth / canvasWidth : 1

    const distance = Math.max(
      apparentWidthFt / WALL_WIDTH_FRACTION / (2 * Math.tan(halfH)) / safeFraction,
      MIN_CAMERA_DISTANCE_FT,
    )

    // Known false positive: oxlint's react/immutability flags R3F's imperative camera API, and neither oxlint-disable nor eslint-disable suppresses it.
    camera.position.copy(target).addScaledVector(viewDirection(), distance)
    camera.near = Math.max(distance / 200, 0.1)
    camera.far = distance * 12
    camera.updateProjectionMatrix()
    camera.lookAt(target)

    const orbit = controls as { target: Vector3; update: () => void } | null
    if (orbit?.target) {
      orbit.target.copy(target)
      orbit.update()
    }
    // Dimensions and the safe rect take the same path: one refit, on change.
  }, [camera, controls, aspect, canvasWidth, safeWidth, runFt, heightFt, depthFt])

  return null
}

/**
 * Lighting is entirely local (SPEC §13): no <Environment>, no HDRI, nothing
 * fetched from a CDN at runtime.
 *
 * The key is deliberately low and well off to one side. A high key flattens the
 * face; a raking one lets the 0.25" joint reveal cast the shadow line that
 * makes the running bond and the setback legible.
 */
function Rig({ derived }: { derived: DerivedWall }) {
  const runFt = inToFt(derived.runLengthIn)
  const heightFt = inToFt(derived.totalHeightIn)
  const centreX = runFt / 2
  const extent = Math.max(runFt, heightFt) * 0.7 + 10

  return (
    <>
      <ambientLight intensity={0.5} />

      <directionalLight
        castShadow
        position={[centreX - runFt * 0.75, heightFt + extent * 0.35, extent * 0.85]}
        intensity={1.25}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={0.5}
        shadow-camera-far={extent * 6}
        target-position={[centreX, heightFt / 2, 0]}
      />

      {/* Rim light from the opposite side, dim: it separates the wall from the
          bank behind it without casting a second set of shadows. */}
      <directionalLight
        position={[centreX + runFt * 0.7, heightFt + 8, -extent]}
        intensity={0.26}
      />
    </>
  )
}

export function Scene({ derived }: { derived: DerivedWall }) {
  const runFt = inToFt(derived.runLengthIn)

  return (
    <Canvas flat shadows dpr={[1, 2]} camera={{ fov: 38, position: [0, 8, 40] }}>
      <color attach="background" args={[BACKGROUND]} />

      <Rig derived={derived} />
      <CameraRig derived={derived} />

      <Wall derived={derived} />
      {/* In front of the wall, on the low ground, a quarter of the way along:
          far enough from the end that there is no doubt which side it is on. */}
      <HumanFigure position={[runFt * 0.25, 0, 5]} />
      <Terrain derived={derived} />

      <ContactShadows
        position={[runFt / 2, 0.02, 1]}
        scale={Math.max(runFt, 22) * 1.8}
        resolution={1024}
        blur={2.2}
        opacity={0.34}
        far={10}
      />

      <OrbitControls
        makeDefault
        minPolarAngle={MathUtils.degToRad(55)}
        maxPolarAngle={MathUtils.degToRad(88)}
        enablePan={false}
        minDistance={6}
        maxDistance={500}
      />
    </Canvas>
  )
}
