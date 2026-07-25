import { useMemo, Suspense, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Vector3, Object3D } from "three";
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration, DepthOfField } from "@react-three/postprocessing";
import { Physics } from "@react-three/rapier";
import { AnatomyManager } from "./3d/anatomy/AnatomyManager";
import { EndoscopeRig } from "./3d/EndoscopeRig";
import { BleedingVFX, DustParticles, Vector3D } from "./3d/VFX";
import { CrisisEvent } from "./3d/collision/types";
import { DebugControls, DebugState } from "./3d/debug/DebugControls";
import { WireframeController } from "./3d/debug/WireframeController";
import { PerformanceMonitor } from "./3d/debug/PerformanceMonitor";
import { SafetyCorridorManager, SafetyZone } from "./3d/safety/SafetyCorridorManager";
import { useAdaptiveQuality, QualityTier } from "./3d/utils/AdaptiveQuality";

/**
 * Adaptive Post-Processing Effects
 *
 * Dynamically adjusts post-processing quality based on FPS:
 * - HIGH tier (60+ FPS): All 5 effects enabled
 * - MEDIUM tier (45-60 FPS): DOF and ChromaticAberration disabled
 * - LOW tier (<45 FPS): Only Vignette enabled
 *
 * Expected FPS improvement:
 * - MEDIUM: +5-8 FPS
 * - LOW: +10-15 FPS
 */
function AdaptivePostProcessing({ onTierChange }: { onTierChange?: (tier: QualityTier) => void }) {
  const quality = useAdaptiveQuality(60, 5);

  // Notify parent of tier changes for debugging
  useMemo(() => {
    onTierChange?.(quality.currentTier);
  }, [quality.currentTier, onTierChange]);

  const { currentTier } = quality;

  // Render different effect combinations based on quality tier
  // Using separate returns to satisfy TypeScript's strict typing for EffectComposer children
  if (currentTier === 'low') {
    // LOW tier: Only Vignette (maximum FPS)
    return (
      <EffectComposer>
        <Vignette eskil={false} offset={0.2} darkness={0.75} />
      </EffectComposer>
    );
  }

  if (currentTier === 'medium') {
    // MEDIUM tier: Bloom + Vignette + Noise (DOF disabled for performance)
    return (
      <EffectComposer>
        <Bloom intensity={0.45} luminanceThreshold={0.2} luminanceSmoothing={0.8} />
        <Vignette eskil={false} offset={0.2} darkness={0.75} />
        <Noise opacity={0.15} />
      </EffectComposer>
    );
  }

  // HIGH tier: All effects enabled
  return (
    <EffectComposer>
      <DepthOfField focusDistance={0.02} focalLength={0.04} bokehScale={3.2} />
      <Bloom intensity={0.45} luminanceThreshold={0.2} luminanceSmoothing={0.8} />
      <Vignette eskil={false} offset={0.2} darkness={0.75} />
      <Noise opacity={0.15} />
      <ChromaticAberration offset={[0.0015, 0.001]} />
    </EffectComposer>
  );
}

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
  onSafetyChange?: (zones: SafetyZone[]) => void;
  showSafetySpheres?: boolean;
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
  onSafetyChange,
  showSafetySpheres = false,
}: EndoscopeViewProps) {
  const [debugState, setDebugState] = useState<DebugState>({
    wireframe: false,
    physicsDebug: false,
    stats: false,
    collisionSpheres: false,
    showHelp: false,
  });

  // State to hold collidable meshes for optimized raycasting
  const [collidableMeshes, setCollidableMeshes] = useState<Object3D[]>([]);

  // Anatomical positions for safety corridor monitoring
  const safetyStructures = useMemo(() => ({
    icaLeft: new Vector3(-0.9, 0.3, -7.3),
    icaRight: new Vector3(0.9, 0.3, -7.3),
    mwcsLeft: new Vector3(-0.85, 0.3, -7.3),
    mwcsRight: new Vector3(0.85, 0.3, -7.3),
    dura: new Vector3(0, 0.5, -7.4),
  }), []);

  // Callback to receive collidable meshes from AnatomyManager
  const handleCollidableMeshesReady = useCallback((meshes: Object3D[]) => {
    setCollidableMeshes(meshes);
  }, []);

  const tipVector = useMemo(
    () => new Vector3(tipPosition.x, tipPosition.y, tipPosition.z),
    [tipPosition.x, tipPosition.y, tipPosition.z]
  );

  // TODO: Integrate onCrisis with EndoscopeRig tissue-type collision detection
  // For now, onCrisis is available for future implementation
  void onCrisis;

  return (
    <>
      {/* Debug controls (keyboard shortcuts) - HTML overlay */}
      <DebugControls onStateChange={setDebugState} />

      {/* Performance stats overlay (toggle with S key) - HTML overlay */}
      {debugState.stats && <PerformanceMonitor visible={true} />}

      <Canvas camera={{ position: [0, 0, 1.5], fov: 55 }} shadows>
        <color attach="background" args={["#1a1111"]} />
        <ambientLight intensity={0.4} color={ambientColor} />

        {/* Wireframe controller (must be inside Canvas) */}
        <WireframeController enabled={debugState.wireframe} />

        <Suspense fallback={null}>
          <Physics gravity={[0, 0, 0]} timeStep={1 / 60} interpolate debug={debugState.physicsDebug}>
            {/* Physics debug visualization enabled via debug prop */}

            {/* OPTIMIZATION: Pass callback to collect collidable meshes */}
            <AnatomyManager level={level} onCollidableMeshesReady={handleCollidableMeshesReady} />
            <DustParticles />
            <BleedingVFX collision={collision} />
            {/* OPTIMIZATION: Pass targeted collidable meshes for optimized raycasting */}
            <EndoscopeRig
              tipPosition={tipVector}
              scopeAngle={scopeAngle}
              rotationZ={rotationZ}
              onRaycastCollision={(point) =>
                onRaycastCollision?.({ x: point.x, y: point.y, z: point.z })
              }
              collidableMeshes={collidableMeshes}
            />
            {/* Safety Corridor System - Real-time distance monitoring */}
            {level >= 2 && (
              <SafetyCorridorManager
                scopeTipPosition={tipVector}
                structures={safetyStructures}
                onSafetyChange={onSafetyChange}
                showDebugSpheres={showSafetySpheres || debugState.collisionSpheres}
                enableAudio={true}
              />
            )}
          </Physics>
        </Suspense>
        {/* OPTIMIZATION: Adaptive post-processing based on FPS */}
        <AdaptivePostProcessing />
      </Canvas>
    </>
  );
}
