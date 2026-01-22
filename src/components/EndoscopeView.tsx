import { useMemo, Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Vector3 } from "three";
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration, DepthOfField } from "@react-three/postprocessing";
import { Physics } from "@react-three/rapier";
import { AnatomyManager } from "./3d/anatomy/AnatomyManager";
import { EndoscopeRig } from "./3d/EndoscopeRig";
import { BleedingVFX, DustParticles, Vector3D } from "./3d/VFX";
import { CrisisEvent } from "./3d/collision/types";
import { DebugControls, DebugState } from "./3d/debug/DebugControls";
import { PerformanceMonitor } from "./3d/debug/PerformanceMonitor";

export interface ScopeAngle {
  pitch: number;
  yaw: number;
}

export interface EndoscopeViewProps {
  tipPosition: Vector3D;
  scopeAngle: ScopeAngle;
  rotationZ?: number;
  collision?: Vector3D | null;
  level: number;
  onRaycastCollision?: (point: Vector3D) => void;
  onCrisis?: (crisis: CrisisEvent) => void;
}

const ambientColor = "#f7d9cd";

export function EndoscopeView({
  tipPosition,
  scopeAngle,
  rotationZ,
  collision,
  level,
  onRaycastCollision,
  onCrisis,
}: EndoscopeViewProps) {
  const [debugState, setDebugState] = useState<DebugState>({
    wireframe: false,
    physicsDebug: false,
    stats: false,
    collisionSpheres: false,
    showHelp: false,
  });

  const tipVector = useMemo(
    () => new Vector3(tipPosition.x, tipPosition.y, tipPosition.z),
    [tipPosition.x, tipPosition.y, tipPosition.z]
  );

  // TODO: Integrate onCrisis with EndoscopeRig tissue-type collision detection
  // For now, onCrisis is available for future implementation
  void onCrisis;

  return (
    <>
      {/* Performance stats overlay (toggle with S key) - HTML overlay */}
      {debugState.stats && <PerformanceMonitor visible={true} />}

      <Canvas camera={{ position: [0, 0, 1.5], fov: 55 }} shadows>
        <DebugControls onStateChange={setDebugState} />
        <color attach="background" args={["#1a1111"]} />
        <ambientLight intensity={0.4} color={ambientColor} />
        <Suspense fallback={null}>
          <Physics gravity={[0, 0, 0]} timeStep={1 / 60} interpolate debug={debugState.physicsDebug}>
            {/* Physics debug visualization enabled via debug prop */}

            <AnatomyManager level={level} />
            <DustParticles />
            <BleedingVFX collision={collision} />
            <EndoscopeRig
              tipPosition={tipVector}
              scopeAngle={scopeAngle}
              rotationZ={rotationZ}
              onRaycastCollision={(point) =>
                onRaycastCollision?.({ x: point.x, y: point.y, z: point.z })
              }
            />
          </Physics>
        </Suspense>
        <EffectComposer>
          <DepthOfField focusDistance={0.02} focalLength={0.04} bokehScale={3.2} />
          <Bloom intensity={0.45} luminanceThreshold={0.2} luminanceSmoothing={0.8} />
          <Vignette eskil={false} offset={0.2} darkness={0.75} />
          <Noise opacity={0.15} />
          <ChromaticAberration offset={[0.0015, 0.001]} />
        </EffectComposer>
      </Canvas>
    </>
  );
}
