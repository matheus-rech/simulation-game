import { useMemo, useRef } from "react";
import { Mesh, Vector3, CatmullRomCurve3 } from "three";
import { useFrame } from "@react-three/fiber";
import { BoneMaterial, MucosaMaterial } from "./Materials";

export interface NasalCavityProps {
  level: number;
}

const turbinateOffsets = [
  new Vector3(0.4, -0.4, -2.2),
  new Vector3(-0.5, -0.1, -3.1),
  new Vector3(0.45, 0.1, -4.0),
];

export function NasalCavity({ level }: NasalCavityProps) {
  const carotidRef = useRef<Mesh>(null);

  const tunnelCurve = useMemo(() => {
    const points = [
      new Vector3(0, 0, 1.5),
      new Vector3(0.2, -0.2, -0.5),
      new Vector3(-0.1, 0.1, -2.5),
      new Vector3(0.15, 0.3, -4.5),
      new Vector3(0, 0, -6.4),
    ];
    return new CatmullRomCurve3(points, false, "catmullrom", 0.5);
  }, []);

  useFrame(({ clock }) => {
    if (!carotidRef.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.08;
    carotidRef.current.scale.set(pulse, pulse, pulse);
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[tunnelCurve, 240, 0.85, 18, false]} />
        <MucosaMaterial />
      </mesh>

      {turbinateOffsets.map((offset, index) => (
        <mesh key={`turbinate-${index}`} position={offset} rotation={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.22, 0.32, 1.2, 12]} />
          <BoneMaterial />
        </mesh>
      ))}

      <mesh position={[0, 0.2, -6.6]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2.2, 1.6, 0.2]} />
        <BoneMaterial />
      </mesh>

      <mesh position={[0.2, 0.2, -6.45]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.06, 12, 32]} />
        <meshStandardMaterial color="#cfc7b8" roughness={0.5} />
      </mesh>

      {level >= 2 && (
        <mesh ref={carotidRef} position={[0.75, -0.25, -5.4]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#b71c2b" emissive="#6b0b17" />
        </mesh>
      )}
    </group>
  );
}
