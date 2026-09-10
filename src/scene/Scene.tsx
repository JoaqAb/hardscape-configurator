import { OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import { CanvasTexture, MathUtils, SRGBColorSpace, Vector3 } from 'three'
import type { PerspectiveCamera, Scene as ThreeScene, Texture } from 'three'

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
const VIEW_ELEVATION_DEG = 15
const VIEW_AZIMUTH_DEG = 30
/** How much of the safe area the wall should span, per axis (SPEC §13). */
const WALL_WIDTH_FRACTION = 0.68
const WALL_HEIGHT_FRACTION = 0.5
const MIN_CAMERA_DISTANCE_FT = 14

/**
 * Sky (SPEC §13). Two stops, cool neutral, generated once into a CanvasTexture
 * and handed to scene.background: no geometry, no shader, no network, nothing
 * per frame.
 *
 * The horizon stop clears 1.6 times the turf's measured luminance, which is what
 * makes a horizon exist. It is not bound by the wall face: §13's lightest-object
 * rule is about the materials in the scene, and the sky is not one of them.
 */
const SKY_HORIZON = '#b6bbc0'
const SKY_ZENITH = '#8f969d'
/**
 * Where the horizon stop lands down the frame. The background is drawn in screen
 * space, so its own bottom edge sits behind the ground: without this the only
 * band a visitor ever sees is the zenith and the gradient does nothing.
 */
const SKY_HORIZON_STOP = 0.15

function viewDirection(): Vector3 {
  const elevation = MathUtils.degToRad(VIEW_ELEVATION_DEG)
  const azimuth = MathUtils.degToRad(VIEW_AZIMUTH_DEG)
  return new Vector3(
    Math.sin(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.cos(azimuth) * Math.cos(elevation),
  )
}

type Basis = { forward: Vector3; right: Vector3; up: Vector3 }

/**
 * Aims the camera so the wall's centre projects at the safe area's centre, then
 * pulls back to `distance`. Returns the aim point so the orbit target can share
 * it. Module level on purpose: it is arithmetic on a camera, not a closure over
 * hook state.
 */
function placeCamera(
  camera: PerspectiveCamera,
  target: Vector3,
  basis: Basis,
  offset: { x: number; y: number },
  canvasWidth: number,
  halfH: number,
  distance: number,
): Vector3 {
  const worldPerPixel = (2 * distance * Math.tan(halfH)) / canvasWidth
  const aim = target
    .clone()
    .addScaledVector(basis.right, -offset.x * worldPerPixel)
    .addScaledVector(basis.up, offset.y * worldPerPixel)

  camera.position.copy(aim).addScaledVector(basis.forward, distance)
  camera.near = Math.max(distance / 200, 0.1)
  camera.far = distance * 12
  camera.updateProjectionMatrix()
  camera.lookAt(aim)
  camera.updateMatrixWorld()
  return aim
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
  const canvasHeight = useThree((s) => s.size.height)
  const safeWidth = useViewport((s) => s.safeRect.width)
  const safeHeight = useViewport((s) => s.safeRect.height)
  const safeLeft = useViewport((s) => s.safeRect.left)
  const safeTop = useViewport((s) => s.safeRect.top)

  const bounds = derived.boundsFt
  const [minX, minY, minZ] = bounds.min
  const [maxX, maxY, maxZ] = bounds.max

  useLayoutEffect(() => {
    if (!('isPerspectiveCamera' in camera) || !camera.isPerspectiveCamera) return

    // The target is the wall's own box, not the terrain's, and since block 4A
    // that box covers both runs and the caps rather than runA alone.
    const target = new Vector3(
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2,
    )

    // Fit on both axes and take the constraining one (SPEC §13). Width alone
    // passed at 0.69 twice while the picture failed, because a long low wall in
    // a portrait frame satisfies a width metric without filling anything.
    const forward = viewDirection()
    const right = new Vector3()
      .crossVectors(new Vector3(0, 1, 0), forward)
      .normalize()
    const up = new Vector3().crossVectors(forward, right).normalize()

    // Half extents of the wall's box on the screen axes, in feet.
    let halfAcross = 0
    let halfUp = 0
    for (const x of [minX, maxX]) {
      for (const y of [minY, maxY]) {
        for (const z of [minZ, maxZ]) {
          const corner = new Vector3(x, y, z).sub(target)
          halfAcross = Math.max(halfAcross, Math.abs(corner.dot(right)))
          halfUp = Math.max(halfUp, Math.abs(corner.dot(up)))
        }
      }
    }

    const halfV = MathUtils.degToRad(camera.fov) / 2
    const halfH = Math.atan(Math.tan(halfV) * aspect)

    // The canvas is the whole viewport, but the wall has to land inside the
    // safe area (SPEC §13). Safe-area and canvas coordinates are the same
    // space, so each correction is a plain ratio of the two sizes. Zero means
    // no probe has reported: stacked layout, nothing over the scene.
    const safeFractionW =
      safeWidth > 0 && canvasWidth > 0 ? safeWidth / canvasWidth : 1
    const safeFractionH =
      safeHeight > 0 && canvasHeight > 0 ? safeHeight / canvasHeight : 1

    const distanceForWidth =
      halfAcross / (WALL_WIDTH_FRACTION * Math.tan(halfH) * safeFractionW)
    const distanceForHeight =
      halfUp / (WALL_HEIGHT_FRACTION * Math.tan(halfV) * safeFractionH)

    const distance = Math.max(
      distanceForWidth,
      distanceForHeight,
      MIN_CAMERA_DISTANCE_FT,
    )

    // Known false positive: oxlint's react/immutability flags R3F's imperative camera API, and neither oxlint-disable nor eslint-disable suppresses it.
    // The safe area is no longer concentric with the canvas: the control card
    // is on one side and nothing balances it. Fitting alone would centre the
    // wall in the canvas and leave it hard against the card, so the aim point
    // is shifted until the wall's centre projects at the safe area's centre.
    // Pixels are square, so one world-per-pixel scale covers both axes.
    const offsetX = safeLeft + safeWidth / 2 - canvasWidth / 2
    const offsetY = safeTop + safeHeight / 2 - canvasHeight / 2

    const basis = { forward, right, up }
    const offset = { x: offsetX, y: offsetY }

    // Off the camera axis, perspective stretches the near end of a long wall,
    // so the first fit overshoots. One measured correction settles it: project
    // the box, compare against the budget, scale the distance by the overshoot.
    // Twice per layout change, never per frame.
    placeCamera(camera, target, basis, offset, canvasWidth, halfH, distance)

    let minNdcX = Infinity
    let maxNdcX = -Infinity
    let minNdcY = Infinity
    let maxNdcY = -Infinity
    for (const x of [minX, maxX]) {
      for (const y of [minY, maxY]) {
        for (const z of [minZ, maxZ]) {
          const ndc = new Vector3(x, y, z).project(camera)
          minNdcX = Math.min(minNdcX, ndc.x)
          maxNdcX = Math.max(maxNdcX, ndc.x)
          minNdcY = Math.min(minNdcY, ndc.y)
          maxNdcY = Math.max(maxNdcY, ndc.y)
        }
      }
    }
    // Half extents about the box's own projected centre, not about the canvas
    // centre: the wall is deliberately off-axis, and that offset is not size.
    const allowedX = (WALL_WIDTH_FRACTION * safeWidth) / canvasWidth
    const allowedY = (WALL_HEIGHT_FRACTION * safeHeight) / canvasHeight
    const overshoot = Math.max(
      (maxNdcX - minNdcX) / 2 / allowedX,
      (maxNdcY - minNdcY) / 2 / allowedY,
    )

    const aim = placeCamera(
      camera,
      target,
      basis,
      offset,
      canvasWidth,
      halfH,
      Math.max(distance * overshoot, MIN_CAMERA_DISTANCE_FT),
    )

    const orbit = controls as { target: Vector3; update: () => void } | null
    if (orbit?.target) {
      orbit.target.copy(aim)
      orbit.update()
    }
    // Dimensions and the safe rect take the same path: one refit, on change.
  }, [
    camera,
    controls,
    aspect,
    canvasWidth,
    canvasHeight,
    safeWidth,
    safeHeight,
    safeLeft,
    safeTop,
    minX,
    minY,
    minZ,
    maxX,
    maxY,
    maxZ,
  ])

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
  // Placement of the key, unchanged. The light does not move.
  const extent = Math.max(runFt, heightFt) * 0.7 + 10

  // The shadow camera is fitted to the derived bounds instead, the same fix
  // item 0 made for the view camera: a heuristic on runA's length knows nothing
  // about the return. Radius from the light's aim point to the furthest corner
  // of everything drawn covers the wall whatever shape it is.
  const aim = [centreX, heightFt / 2, 0] as const
  const { min, max } = derived.boundsFt
  let shadowRadius = 0
  for (const x of [min[0], max[0]]) {
    for (const y of [min[1], max[1]]) {
      for (const z of [min[2], max[2]]) {
        shadowRadius = Math.max(
          shadowRadius,
          Math.hypot(x - aim[0], y - aim[1], z - aim[2]),
        )
      }
    }
  }
  shadowRadius += 1
  const lightDistance = Math.hypot(
    centreX - runFt * 0.8 - aim[0],
    heightFt + extent * 0.95 - aim[1],
    extent * 0.75 - aim[2],
  )

  return (
    <>
      <ambientLight intensity={0.6} />

      <directionalLight
        castShadow
        position={[centreX - runFt * 0.8, heightFt + extent * 0.95, extent * 0.75]}
        intensity={1.25}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-camera-left={-shadowRadius}
        shadow-camera-right={shadowRadius}
        shadow-camera-top={shadowRadius}
        shadow-camera-bottom={-shadowRadius}
        shadow-camera-near={0.5}
        shadow-camera-far={lightDistance + shadowRadius}
        target-position={[aim[0], aim[1], aim[2]]}
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

/** Module level for the same reason placeCamera is: it is a write to a three
 *  object, not a closure over hook state, and the linter cannot tell them apart. */
function applyBackground(scene: ThreeScene, texture: Texture | null) {
  scene.background = texture
}

function Sky() {
  const scene = useThree((s) => s.scene)

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, SKY_ZENITH)
    gradient.addColorStop(SKY_HORIZON_STOP, SKY_HORIZON)
    gradient.addColorStop(1, SKY_HORIZON)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const map = new CanvasTexture(canvas)
    map.colorSpace = SRGBColorSpace
    return map
  }, [])

  useLayoutEffect(() => {
    if (!texture) return
    applyBackground(scene, texture)
    return () => {
      applyBackground(scene, null)
      texture.dispose()
    }
  }, [scene, texture])

  return null
}

export function Scene({ derived }: { derived: DerivedWall }) {
  const runFt = inToFt(derived.runLengthIn)

  return (
    <Canvas flat shadows dpr={[1, 2]} camera={{ fov: 38, position: [0, 8, 40] }}>
      <Sky />

      <Rig derived={derived} />
      <CameraRig derived={derived} />

      <Wall derived={derived} />
      {/* In front of the wall, on the low ground, a quarter of the way along:
          far enough from the end that there is no doubt which side it is on. */}
      <HumanFigure position={[runFt * 0.25, 0, 5]} />
      <Terrain derived={derived} />

      {/* Deliberately shallow and pushed in front of the wall. The retained
          bank is now large enough to fill a square shadow plane on its own,
          which flattened the pass to a uniform tint and left the wall with no
          contact shadow at all. Bounding it to the strip the wall stands on
          gives the pass something to contrast against. */}
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
