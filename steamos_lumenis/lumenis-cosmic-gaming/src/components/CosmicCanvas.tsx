import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface CosmicCanvasProps {
  embedded?: boolean
}

// Starfield component
function Starfield() {
  const points = useRef<THREE.Points>(null)

  const [positions] = useState(() => {
    const positions = new Float32Array(3000 * 3)
    for (let i = 0; i < 3000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60
    }
    return positions
  })

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y += 0.0002
      points.current.rotation.x += 0.0001
    }
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={3000}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffffff"
        sizeAttenuation
        transparent
        opacity={0.8}
      />
    </points>
  )
}

// Core sphere component
function Core() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        color="#00ffff"
        wireframe
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

// Raccoon sprite component
function Raccoon() {
  const spriteRef = useRef<THREE.Sprite>(null)
  const [targetPosition] = useState(() => new THREE.Vector3(2, 0, 0))
  const [mode, setMode] = useState<'orbit' | 'travel'>('orbit')
  const [t, setT] = useState(0)

  useFrame(() => {
    if (!spriteRef.current) return

    setT(prev => prev + 0.01)

    if (mode === 'orbit') {
      spriteRef.current.position.x = Math.cos(t) * 2
      spriteRef.current.position.y = Math.sin(t) * 2
    } else {
      spriteRef.current.position.lerp(targetPosition, 0.05)
      if (spriteRef.current.position.distanceTo(targetPosition) < 0.1) {
        setMode('orbit')
      }
    }
  })

  return (
    <sprite ref={spriteRef} scale={[0.8, 0.8, 0.8]}>
      <spriteMaterial
        map={null} // Would load texture in useEffect
        color="#ffffff"
        transparent
      />
    </sprite>
  )
}

// Holographic panels
function HologramPanel({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
    }
  })

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    color: { value: new THREE.Color('#00ffff') }
  }), [])

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[1.2, 0.7]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float time;
          uniform vec3 color;
          varying vec2 vUv;

          void main() {
            float glow = sin(vUv.y * 20.0 + time * 3.0) * 0.5 + 0.5;
            float edge = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
            edge *= smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);

            vec3 finalColor = color * glow * edge;
            float alpha = glow * 0.4 * edge;

            gl_FragColor = vec4(finalColor, alpha);
          }
        `}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// Connection lines
function ConnectionLines() {
  const corePosition = new THREE.Vector3(0, 0, 0)
  const panelPositions = useMemo(() => [
    new THREE.Vector3(2, 1, 0),
    new THREE.Vector3(-1.5, 0.5, 1),
    new THREE.Vector3(0, -1, 1.5),
  ], [])

  return (
    <group>
      {panelPositions.map((panelPos, i) => {
        const points = [corePosition, panelPos]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)

        return (
          <line key={i}>
            <bufferGeometry {...geometry} />
            <lineBasicMaterial color="#00ffff" transparent opacity={0.3} />
          </line>
        )
      })}
    </group>
  )
}

// Camera controller
function CameraController() {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.z = 6
    camera.position.x = 0
    camera.position.y = 0
  }, [camera])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    camera.position.x = Math.sin(t * 0.1) * 0.5
    camera.position.y = Math.cos(t * 0.15) * 0.3
  })

  return null
}

// Main canvas component
export default function CosmicCanvas({ embedded = false }: CosmicCanvasProps) {
  return (
    <div className={`${embedded ? 'fixed inset-0 z-0' : 'w-full h-screen'} bg-black`}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 10, 50]} />

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />

        <Starfield />
        <Core />
        <Raccoon />
        <HologramPanel position={[2, 1, 0]} />
        <HologramPanel position={[-1.5, 0.5, 1]} />
        <HologramPanel position={[0, -1, 1.5]} />
        <ConnectionLines />
        <CameraController />
      </Canvas>
    </div>
  )
}
