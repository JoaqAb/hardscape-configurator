import { Canvas } from '@react-three/fiber'

/**
 * Empty scene. Geometry, lighting and controls arrive in block 1;
 * this exists so the R3F canvas is verified to mount and build.
 */
export function Scene() {
  return (
    <Canvas camera={{ position: [12, 8, 16], fov: 45 }} shadows>
      <color attach="background" args={['#e7e5e4']} />
    </Canvas>
  )
}
