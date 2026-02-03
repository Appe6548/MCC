import { Sparkles } from '@react-three/drei/core/Sparkles'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

export function HoloScene() {
  const group = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    const t = clock.getElapsedTime()
    g.rotation.y = Math.sin(t * 0.08) * 0.15
    g.rotation.x = Math.cos(t * 0.06) * 0.08
  })

  return (
    <>
      <color attach="background" args={['#05060a']} />

      <ambientLight intensity={0.75} />
      <pointLight position={[6, 5, 7]} intensity={32} color="#9ad7ff" />
      <pointLight position={[-6, -2, 6]} intensity={26} color="#d7a6ff" />

      <group ref={group}>
        <mesh rotation={[0, 0, 0]} position={[0, 0, -2]}>
          <planeGeometry args={[16, 10, 1, 1]} />
          <meshBasicMaterial color="#07101a" />
        </mesh>

        <mesh rotation={[0, 0, 0]} position={[0, -2.2, 0]}>
          <planeGeometry args={[12, 6, 1, 1]} />
          <meshStandardMaterial
            color="#0b1a2b"
            roughness={0.65}
            metalness={0.1}
            emissive="#10263d"
            emissiveIntensity={0.9}
            transparent
            opacity={0.42}
          />
        </mesh>
      </group>

      <Sparkles count={90} scale={[12, 7, 10]} size={2.4} speed={0.25} color="#b8ecff" />
    </>
  )
}
