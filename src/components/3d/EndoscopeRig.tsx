import React, { useMemo, useRef } from "react";
import { Raycaster, Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";

export interface EndoscopeRigProps {
  tipPosition: Vector3;
  scopeAngle: {
    pitch: number;
    yaw: number;
  };
  rotationZ?: number;
  onRaycastCollision?: (point: Vector3) => void;
}

export function EndoscopeRig({ tipPosition, scopeAngle, rotationZ = 0, onRaycastCollision }: EndoscopeRigProps) {
  const { camera, scene } = useThree();
  const raycaster = useMemo(() => new Raycaster(), []);
  const lastCollision = useRef<number>(0);

  useFrame(({ clock }) => {
    camera.position.lerp(tipPosition, 0.4);
    camera.rotation.set(scopeAngle.pitch, scopeAngle.yaw, rotationZ);

    const direction = new Vector3(0, 0, -1).applyEuler(camera.rotation).normalize();
    raycaster.set(camera.position, direction);
    const intersections = raycaster.intersectObjects(scene.children, true);
    if (!intersections.length) return;

    const closest = intersections[0];
    if (closest.distance > 0.4) return;

    if (clock.elapsedTime - lastCollision.current > 0.25) {
      lastCollision.current = clock.elapsedTime;
      onRaycastCollision?.(closest.point.clone());
    }
  });

  return (
    <group>
      <spotLight
        position={[0, 0, 0.4]}
        angle={0.4}
        penumbra={0.8}
        intensity={1.6}
        color="#ffffff"
        castShadow
      />
    </group>
  );
}
