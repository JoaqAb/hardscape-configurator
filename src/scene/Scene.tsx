import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { MathUtils, Vector3 } from 'three'

import type { DerivedWall } from '../model/types'
import { inToFt } from '../model/units'
import { HumanFigure } from './HumanFigure'
import { Terrain } from './Terrain'
import { Wall } from './Wall'

/** Three-quarter view from slightly above eye level. */
const VIEW_DIRECTION = new Vector3(0.46, 0.27, 0.85).normalize()
/** The scale figure has to stay in frame even when the wall is one course. */
const MIN_FRAMED_HEIGHT_FT = 6.4

/**
 * Framing (SPEC §13). <Bounds fit clip observe> is the spec's first choice, but
 * it fought OrbitControls exactly as §13 warned it might: Bounds wants to own
 * the control target and the explicit target we need for a wall that starts at
 * the origin pulls against it, which tilted the camera off the subject. So we
 * take the documented fallback and place the camera ourselves, once, whenever
 * the dimensions change — never per frame.
 */
function CameraRig({ derived }: { derived: DerivedWall }) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)
  const aspect = useThree((s) => s.viewport.aspect)

  const runFt = inToFt(derived.runLengthIn)
  const heightFt = Math.max(inToFt(derived.totalHeightIn), MIN_FRAMED_HEIGHT_FT)
  const depthFt = inToFt(derived.sku.depthIn + derived.topSetbackIn)

  useLayoutEffect(() => {
    if (!('isPerspectiveCamera' in camera) || !camera.isPerspectiveCamera) return

    // Frame the wall plus a little room for the scale figure beside it.
    const framedWidth = runFt + 5
    const target = new Vector3(runFt / 2, heightFt * 0.42, -depthFt / 2)
    const radius =
      Math.hypot(framedWidth, heightFt, depthFt + 2) / 2 + heightFt * 0.1

    // Fit on whichever axis is tighter, so a long wall does not run off the
    // sides of a wide viewport.
    const halfV = MathUtils.degToRad(camera.fov) / 2
    const halfH = Math.atan(Math.tan(halfV) * aspect)
    const distance = radius / Math.sin(Math.min(halfV, halfH))

    // Placing the camera means mutating it. R3F exposes no declarative way to
    // fit a frustum, so oxlint's react/immutability rule flags this line; the
    // rule does not know about the imperative escape hatch and neither an
    // oxlint- nor an eslint- disable directive suppresses it here.
    camera.position.copy(target).addScaledVector(VIEW_DIRECTION, distance)
    camera.near = Math.max(distance / 200, 0.1)
    camera.far = distance * 8
    camera.updateProjectionMatrix()
    camera.lookAt(target)

    const orbit = controls as { target: Vector3; update: () => void } | null
    if (orbit?.target) {
      orbit.target.copy(target)
      orbit.update()
    }
  }, [camera, controls, aspect, runFt, heightFt, depthFt])

  return null
}

/**
 * Lighting is entirely local (SPEC §13): no <Environment>, no HDRI, nothing
 * fetched from a CDN at runtime. A demo that goes dark because someone else's
 * network hiccuped is not worth the marginal gain on matte concrete.
 */
function Rig({ derived }: { derived: DerivedWall }) {
  const runFt = inToFt(derived.runLengthIn)
  const heightFt = inToFt(derived.totalHeightIn)
  const centreX = runFt / 2

  // The shadow camera is fitted to the wall, so the map's resolution is spent
  // on the subject rather than on empty ground.
  const extent = Math.max(runFt, heightFt) * 0.7 + 10

  return (
    <>
      <ambientLight intensity={0.5} />

      <directionalLight
        castShadow
        position={[centreX - runFt * 0.5, heightFt + extent * 0.8, extent * 0.9]}
        intensity={1.15}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={0.5}
        shadow-camera-far={extent * 5}
        target-position={[centreX, heightFt / 2, 0]}
      />

      {/* Rim light from the opposite side, dim: it separates the wall from the
          fill behind it without casting a second set of shadows. */}
      <directionalLight
        position={[centreX + runFt * 0.7, heightFt + 8, -extent]}
        intensity={0.28}
      />
    </>
  )
}

export function Scene({ derived }: { derived: DerivedWall }) {
  const runFt = inToFt(derived.runLengthIn)

  return (
    <Canvas flat shadows dpr={[1, 2]} camera={{ fov: 38, position: [0, 8, 40] }}>
      <color attach="background" args={['#dcdbd7']} />

      <Rig derived={derived} />
      <CameraRig derived={derived} />

      <Wall derived={derived} />
      <HumanFigure position={[runFt + 2.4, 0, 5.5]} />
      <Terrain derived={derived} />

      <ContactShadows
        position={[runFt / 2, 0.02, 1]}
        scale={Math.max(runFt, 22) * 1.8}
        resolution={1024}
        blur={2.2}
        opacity={0.32}
        far={10}
      />

      <OrbitControls
        makeDefault
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.05}
        enablePan={false}
        minDistance={6}
        maxDistance={400}
      />
    </Canvas>
  )
}
