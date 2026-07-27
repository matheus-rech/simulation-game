import { useEffect, useMemo, useRef } from "react";
import { BackSide, CatmullRomCurve3, Group, Mesh, Object3D, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { BoneMaterial, MucosaMaterial } from "./Materials";
import { TissueType } from "./materials/TissueMaterials";

export interface NasalCavityProps {
  level: number;
  onCollidableMeshesReady?: (meshes: Object3D[]) => void;
}

const turbinateOffsets = [
  new Vector3(0.4, -0.4, -2.2),
  new Vector3(-0.5, -0.1, -3.1),
  new Vector3(0.45, 0.1, -4.0),
];

export function NasalCavity({
  level,
  onCollidableMeshesReady,
}: NasalCavityProps) {
  const groupRef = useRef<Group>(null);
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

  useEffect(() => {
    if (!onCollidableMeshesReady || !groupRef.current) return;

    const meshes: Object3D[] = [];
    groupRef.current.traverse((child) => {
      if (child instanceof Mesh && child.userData?.tissueType) {
        meshes.push(child);
      }
    });
    onCollidableMeshesReady(meshes);
  }, [level, onCollidableMeshesReady]);

  return (
    <group ref={groupRef} name="procedural-nasal-cavity">
      <mesh
        name="nasal-mucosa"
        userData={{ tissueType: TissueType.MUCOSA }}
      >
        <tubeGeometry args={[tunnelCurve, 240, 0.85, 18, false]} />
        <MucosaMaterial side={BackSide} />
      </mesh>

      {turbinateOffsets.map((offset, index) => (
        <mesh
          key={`turbinate-${index}`}
          name={`turbinate-${index + 1}`}
          position={offset}
          rotation={[0, 0.35, 0]}
          userData={{ tissueType: TissueType.MUCOSA }}
        >
          <cylinderGeometry args={[0.22, 0.32, 1.2, 12]} />
          <MucosaMaterial distort={0.08} />
        </mesh>
      ))}

      <mesh
        name="sphenoid-face"
        position={[0, 0.2, -6.6]}
        rotation={[0, 0, 0]}
        userData={{ tissueType: TissueType.BONE }}
      >
        <boxGeometry args={[2.2, 1.6, 0.2]} />
        <BoneMaterial />
      </mesh>

      <mesh
        name="sphenoid-ostium"
        position={[0.2, 0.2, -6.45]}
        rotation={[Math.PI / 2, 0, 0]}
        userData={{ tissueType: TissueType.BONE }}
      >
        <torusGeometry args={[0.22, 0.06, 12, 32]} />
        <meshStandardMaterial color="#cfc7b8" roughness={0.5} />
      </mesh>

      {level >= 2 && (
        <mesh
          ref={carotidRef}
          name="internal-carotid-right"
          position={[0.75, -0.25, -5.4]}
          userData={{ tissueType: TissueType.ICA }}
        >
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#b71c2b" emissive="#6b0b17" />
        </mesh>
      )}
    </group>
  );
}
