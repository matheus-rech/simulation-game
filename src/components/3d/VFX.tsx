import { useEffect, useMemo, useRef } from "react";
import { BufferAttribute, InstancedMesh, Matrix4, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { v4 as uuidv4 } from "uuid";

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export function DustParticles() {
  const particles = useMemo(() => {
    const positions = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i += 1) {
      const radius = Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 1.2;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = -Math.random() * 7;
    }
    return positions;
  }, []);
  const positionsRef = useRef<BufferAttribute>(null);

  useFrame(({ clock }, delta) => {
    const shift = Math.sin(clock.elapsedTime * 0.3) * 0.0005;
    for (let i = 0; i < particles.length; i += 3) {
      particles[i + 1] += shift * delta * 60;
    }
    if (positionsRef.current) {
      positionsRef.current.needsUpdate = true;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles, 3]}
          ref={positionsRef}
        />
      </bufferGeometry>
      <pointsMaterial color="#f7f0e4" size={0.03} sizeAttenuation transparent opacity={0.6} />
    </points>
  );
}

interface BleedParticle {
  id: string;
  position: Vector3;
  life: number;
}

export function BleedingVFX({ collision }: { collision?: Vector3D | null }) {
  const meshRef = useRef<InstancedMesh>(null);
  const particles = useRef<BleedParticle[]>([]);
  const matrix = useMemo(() => new Matrix4(), []);

  useEffect(() => {
    if (!collision || !meshRef.current) return;
    particles.current.push({
      id: uuidv4(),
      position: new Vector3(collision.x, collision.y, collision.z),
      life: 1,
    });
  }, [collision]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const nextParticles = particles.current
      .map((particle) => ({
        ...particle,
        life: particle.life - delta * 0.4,
        position: particle.position.clone().add(new Vector3(0, -delta * 0.2, 0)),
      }))
      .filter((particle) => particle.life > 0);
    particles.current = nextParticles;

    nextParticles.forEach((particle, index) => {
      matrix.makeTranslation(particle.position.x, particle.position.y, particle.position.z);
      const scale = 0.12 * particle.life;
      matrix.scale(new Vector3(scale, scale, scale));
      mesh.setMatrixAt(index, matrix);
    });

    mesh.count = nextParticles.length;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 24]}>
      <sphereGeometry args={[0.1, 12, 12]} />
      <meshStandardMaterial color="#b0122c" roughness={0.4} emissive="#5a0b1f" />
    </instancedMesh>
  );
}
