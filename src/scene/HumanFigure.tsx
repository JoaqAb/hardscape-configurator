import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import { Shape } from 'three'

/**
 * A 6 ft silhouette for scale (SPEC §8.9). Built from a flat Shape rather than
 * an imported model or a texture, so it costs nothing and depends on nothing.
 *
 * It turns about Y to face the camera and about nothing else, which keeps it
 * upright at every orbit angle. drei's <Billboard> was the obvious choice but
 * it leaned the figure over when the camera rose; a single yaw is both simpler
 * and exactly what a cutout does. This is a facing angle, not a derivation, so
 * it is allowed to live in useFrame.
 */

/** Outline of a standing figure, in feet, soles on the ground at y = 0. */
const OUTLINE: [number, number][] = [
  [0.3, 5.3],
  [0.62, 5.15],
  [0.72, 5.02],
  [0.7, 3.55],
  [0.55, 3.5],
  [0.52, 3.05],
  [0.5, 2.95],
  [0.46, 0.02],
  [0.14, 0.02],
  [0.1, 2.6],
  [0.0, 2.88],
  [-0.1, 2.6],
  [-0.14, 0.02],
  [-0.46, 0.02],
  [-0.5, 2.95],
  [-0.52, 3.05],
  [-0.55, 3.5],
  [-0.7, 3.55],
  [-0.72, 5.02],
  [-0.62, 5.15],
  [-0.3, 5.3],
]

export function HumanFigure({ position }: { position: [number, number, number] }) {
  const group = useRef<Group>(null)

  const shapes = useMemo(() => {
    const body = new Shape()
    OUTLINE.forEach(([x, y], i) => {
      if (i === 0) body.moveTo(x, y)
      else body.lineTo(x, y)
    })
    body.closePath()

    const head = new Shape()
    head.absarc(0, 5.66, 0.36, 0, Math.PI * 2, false)

    return [body, head]
  }, [])

  useFrame(({ camera }) => {
    const figure = group.current
    if (!figure) return
    figure.rotation.y = Math.atan2(
      camera.position.x - figure.position.x,
      camera.position.z - figure.position.z,
    )
  })

  return (
    <group ref={group} position={position}>
      <mesh castShadow>
        <shapeGeometry args={[shapes]} />
        <meshBasicMaterial color="#414750" toneMapped={false} />
      </mesh>
    </group>
  )
}
