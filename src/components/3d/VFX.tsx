import { useEffect, useMemo, useRef } from 'react'
import { BufferAttribute, InstancedMesh, Matrix4, Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'

export interface Vector3D {
  x: number
  y: number
  z: number
}

export function DustParticles() {
  const particles = useMemo(() => {
    const positions = new Float32Array(600 * 3)
    for (let i = 0; i < 600; i += 1) {
      const radius = Math.random() * 0.9
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 1.2
      positions[i * 3] = Math.cos(theta) * radius
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = -Math.random() * 7
    }
    return positions
  }, [])
  const positionsRef = useRef<BufferAttribute>(null)

  useFrame(({ clock }, delta) => {
    const shift = Math.sin(clock.elapsedTime * 0.3) * 0.0005
    for (let i = 0; i < particles.length; i += 3) {
      particles[i + 1] += shift * delta * 60
    }
    if (positionsRef.current) {
      positionsRef.current.needsUpdate = true
    }
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particles, 3]} ref={positionsRef} />
      </bufferGeometry>
      <pointsMaterial color="#f7f0e4" size={0.03} sizeAttenuation transparent opacity={0.6} />
    </points>
  )
}

interface BleedParticle {
  id: string
  position: Vector3
  velocity: Vector3
  life: number
}

/**
 * Bleeding VFX with optimized memory management
 *
 * OPTIMIZATION: Particle pool with reused Vector3 instances
 * - Pre-allocated particle pool (max 24 particles)
 * - Reusable Vector3 instances to reduce GC pressure
 * - In-place position updates instead of clone operations
 */
const MAX_BLOOD_PARTICLES = 24
let particleIdCounter = 0

export function BleedingVFX({ collision }: { collision?: Vector3D | null }) {
  const meshRef = useRef<InstancedMesh>(null)
  const particles = useRef<BleedParticle[]>([])
  const matrix = useMemo(() => new Matrix4(), [])

  // Reusable Vector3 instances to prevent allocations in hot loop
  const tempScale = useMemo(() => new Vector3(), [])

  // Pre-allocated particle pool for memory efficiency
  const particlePool = useMemo(() => {
    const pool: BleedParticle[] = []
    for (let i = 0; i < MAX_BLOOD_PARTICLES; i++) {
      pool.push({
        id: '',
        position: new Vector3(),
        velocity: new Vector3(0, -0.2, 0),
        life: 0,
      })
    }
    return pool
  }, [])

  useEffect(() => {
    if (!collision || !meshRef.current) return

    // Find inactive particle in pool
    const inactiveParticle = particlePool.find(p => p.life <= 0)
    if (inactiveParticle) {
      inactiveParticle.id = `p-${particleIdCounter++}`
      inactiveParticle.position.set(collision.x, collision.y, collision.z)
      inactiveParticle.life = 1
      if (!particles.current.includes(inactiveParticle)) {
        particles.current.push(inactiveParticle)
      }
    }
  }, [collision, particlePool])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return

    // Update particles in-place (no allocations)
    let activeCount = 0
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const particle = particles.current[i]

      // Update position in-place
      particle.position.addScaledVector(particle.velocity, delta)

      // Update life
      particle.life -= delta * 0.4

      if (particle.life <= 0) {
        // Remove from active list (particle stays in pool)
        particles.current.splice(i, 1)
      }
    }

    // Update instanced mesh matrices
    particles.current.forEach((particle, index) => {
      matrix.makeTranslation(particle.position.x, particle.position.y, particle.position.z)
      const scale = 0.12 * particle.life
      tempScale.set(scale, scale, scale)
      matrix.scale(tempScale)
      mesh.setMatrixAt(index, matrix)
      activeCount++
    })

    mesh.count = activeCount
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 24]}>
      <sphereGeometry args={[0.1, 12, 12]} />
      <meshStandardMaterial color="#b0122c" roughness={0.4} emissive="#5a0b1f" />
    </instancedMesh>
  )
}
