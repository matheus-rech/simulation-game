import React from "react";
import { MeshDistortMaterial } from "@react-three/drei";
import { MeshStandardMaterialProps } from "@react-three/fiber";

export function MucosaMaterial(props: MeshStandardMaterialProps) {
  return (
    <MeshDistortMaterial
      color="#c56c72"
      roughness={0.55}
      metalness={0.05}
      distort={0.18}
      speed={1.2}
      {...props}
    />
  );
}

export function BoneMaterial(props: MeshStandardMaterialProps) {
  return (
    <meshStandardMaterial
      color="#f3eee4"
      roughness={0.75}
      metalness={0.05}
      {...props}
    />
  );
}
