import { useMemo, useRef, useCallback, useState, useEffect } from 'react'
import { Vector3, Object3D, Mesh, Group } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { SphenoidSinus } from './SphenoidSinus'
import { SellaTurcica } from './SellaTurcica'
import { PituitaryAdenoma } from './PituitaryAdenoma'
import { InternalCarotidArtery } from './InternalCarotidArtery'
import { CavernousSinus } from './CavernousSinus'
import { NasalSeptum } from './NasalSeptum'
import { NasalTurbinate } from './NasalTurbinate'
import { SphenoidOstium } from './SphenoidOstium'
import { OpticNerve } from './OpticNerve'

/**
 * AnatomyManager - Orchestrator for all anatomical structures
 *
 * Progressive revelation based on simulation level:
 * - Level 0: Nasal cavity, turbinates
 * - Level 1: Sphenoid ostium visible
 * - Level 2: Sphenoid sinus interior, septations
 * - Level 3: Sellar floor, sella turcica
 * - Level 4: Dura mater, pituitary adenoma
 * - Level 5: ICAs, MWCS structures (critical zone)
 *
 * Performance Optimization (v1.1):
 * Collects all collidable meshes into a targeted array for raycasting.
 * This replaces recursive scene traversal, reducing raycasting from O(n) to O(m)
 * where m is only anatomy meshes (vs n = all scene objects).
 * Expected performance gain: +3-5 FPS by eliminating light/camera checks.
 *
 * LOD (Level of Detail) System (v1.2):
 * - LOD 0 (distance < 5 units): Full detail (32x32 segments)
 * - LOD 1 (distance 5-10 units): Medium detail (24x24 segments, 70% vertices)
 * - LOD 2 (distance > 10 units): Low detail (16x16 segments, 40% vertices)
 * Distance-based geometry simplification with hysteresis to prevent flickering.
 * Expected performance gain: +5-10 FPS when camera is distant from anatomy.
 */

export interface AnatomyManagerProps {
  level: number
  onCollidableMeshesReady?: (meshes: Object3D[]) => void
}

// Anatomical coordinate system (units in cm for medical accuracy)
const ANATOMY_POSITIONS = {
  nasalCavity: new Vector3(0, 0, -3),
  sphenoidOstium: new Vector3(0.2, 0.2, -6.45),
  sphenoidSinus: new Vector3(0, 0.2, -6.8),
  sellarFloor: new Vector3(0, 0.4, -7.2),
  sellaTurcica: new Vector3(0, 0.5, -7.4),
  pituitary: new Vector3(0, 0.6, -7.5),
  icaLeft: new Vector3(-0.9, 0.3, -7.3),
  icaRight: new Vector3(0.9, 0.3, -7.3),
  mwcsLeft: new Vector3(-0.85, 0.3, -7.3),
  mwcsRight: new Vector3(0.85, 0.3, -7.3),
}

export function AnatomyManager({ level, onCollidableMeshesReady }: AnatomyManagerProps) {
  const { camera } = useThree()
  const [lodLevel, setLodLevel] = useState(0)

  // Refs to track collidable meshes for optimized raycasting (deprecated simple geometry)
  const turbinate1Ref = useRef<Mesh>(null)
  const turbinate2Ref = useRef<Mesh>(null)
  const ostiumRef = useRef<Mesh>(null)

  // Group refs for collecting child meshes from anatomical structures
  const nasalSeptumRef = useRef<Group>(null)
  const nasalTurbinateLeftRef = useRef<Group>(null)
  const nasalTurbinateRightRef = useRef<Group>(null)
  const sphenoidOstiumRef = useRef<Group>(null)
  const sphenoidGroupRef = useRef<Group>(null)
  const sellaGroupRef = useRef<Group>(null)
  const pituitaryGroupRef = useRef<Group>(null)
  const icaLeftRef = useRef<Group>(null)
  const icaRightRef = useRef<Group>(null)
  const opticLeftRef = useRef<Group>(null)
  const opticRightRef = useRef<Group>(null)
  const mwcsLeftRef = useRef<Group>(null)
  const mwcsRightRef = useRef<Group>(null)

  // Calculate LOD level based on camera distance from pituitary (reference point)
  useFrame(() => {
    const cameraPos = camera.position
    const pituitaryPos = ANATOMY_POSITIONS.pituitary
    const distance = cameraPos.distanceTo(pituitaryPos)

    // LOD levels with hysteresis to prevent flickering
    // - LOD 0 (distance < 5): Full detail
    // - LOD 1 (distance 5-10): 70% vertices
    // - LOD 2 (distance > 10): 40% vertices
    let newLodLevel = lodLevel

    if (distance < 4.5 && lodLevel !== 0) {
      newLodLevel = 0 // Transition to high detail
    } else if (distance >= 5.5 && distance < 9.5 && lodLevel !== 1) {
      newLodLevel = 1 // Transition to medium detail
    } else if (distance >= 10.5 && lodLevel !== 2) {
      newLodLevel = 2 // Transition to low detail
    }

    if (newLodLevel !== lodLevel) {
      setLodLevel(newLodLevel)
    }
  })

  /**
   * Collect all collidable meshes from anatomical structure groups
   * OPTIMIZATION: This provides targeted raycasting array, reducing complexity
   * from O(n) scene traversal to O(m) anatomy-only checks
   */
  const collectMeshesFromGroup = useCallback((group: Group | null, meshes: Object3D[]) => {
    if (!group) return
    group.traverse((child) => {
      if (child instanceof Mesh && child.userData?.tissueType) {
        meshes.push(child)
      }
    })
  }, [])

  // Callback to update collidable meshes when they mount/unmount
  const registerCollidableMesh = useCallback(() => {
    if (!onCollidableMeshesReady) return

    const meshes: Object3D[] = []

    // Collect all non-null direct mesh refs (deprecated simple geometry)
    if (turbinate1Ref.current) meshes.push(turbinate1Ref.current)
    if (turbinate2Ref.current) meshes.push(turbinate2Ref.current)
    if (ostiumRef.current) meshes.push(ostiumRef.current)

    // OPTIMIZATION: Collect meshes from all anatomical structure groups
    // This ensures raycasting targets ALL anatomy with AI textures
    collectMeshesFromGroup(nasalSeptumRef.current, meshes)
    collectMeshesFromGroup(nasalTurbinateLeftRef.current, meshes)
    collectMeshesFromGroup(nasalTurbinateRightRef.current, meshes)
    collectMeshesFromGroup(sphenoidOstiumRef.current, meshes)
    collectMeshesFromGroup(sphenoidGroupRef.current, meshes)
    collectMeshesFromGroup(sellaGroupRef.current, meshes)
    collectMeshesFromGroup(pituitaryGroupRef.current, meshes)
    collectMeshesFromGroup(icaLeftRef.current, meshes)
    collectMeshesFromGroup(icaRightRef.current, meshes)
    collectMeshesFromGroup(opticLeftRef.current, meshes)
    collectMeshesFromGroup(opticRightRef.current, meshes)
    collectMeshesFromGroup(mwcsLeftRef.current, meshes)
    collectMeshesFromGroup(mwcsRightRef.current, meshes)

    if (meshes.length > 0) {
      onCollidableMeshesReady(meshes)
    }
  }, [onCollidableMeshesReady, collectMeshesFromGroup])

  // Trigger mesh collection after render when refs are populated
  // Re-register when level changes (structures become visible/hidden)
  useEffect(() => {
    // Small delay to ensure all refs are populated after render
    const timeoutId = setTimeout(() => {
      registerCollidableMesh()
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [registerCollidableMesh, level])

  // Determine which structures are visible based on level
  const visibleStructures = useMemo(() => {
    return {
      nasalCavity: level >= 0,
      sphenoidOstium: level >= 1,
      sphenoidSinus: level >= 2,
      sellaTurcica: level >= 3,
      dura: level >= 4,
      pituitary: level >= 4,
      ica: level >= 5,
      mwcs: level >= 5,
    }
  }, [level])

  return (
    <group name="anatomy-manager">
      {/* Phase 1: Foundation Complete ✅ */}

      {/* Phase 2: Core Structures ✅ */}
      {visibleStructures.sphenoidSinus && (
        <group
          ref={sphenoidGroupRef}
          name="sphenoid-sinus-group"
          position={ANATOMY_POSITIONS.sphenoidSinus}
        >
          <SphenoidSinus
            septationCount={2}
            seed={level * 1000}
            showSellarFloor={visibleStructures.sellaTurcica}
          />
        </group>
      )}

      {visibleStructures.sellaTurcica && (
        <group
          ref={sellaGroupRef}
          name="sella-turcica-group"
          position={ANATOMY_POSITIONS.sellaTurcica}
        >
          <SellaTurcica
            showBone={level >= 3}
            showDura={visibleStructures.dura}
            lodLevel={lodLevel}
          />
        </group>
      )}

      {visibleStructures.pituitary && (
        <group
          ref={pituitaryGroupRef}
          name="pituitary-adenoma-group"
          position={ANATOMY_POSITIONS.pituitary}
        >
          <PituitaryAdenoma
            size={1.2}
            seed={level * 2000 + 12345}
            irregularity={0.25}
            showPseudocapsule={true}
            lodLevel={lodLevel}
          />
        </group>
      )}

      {/* Phase 3: Critical Structures with AI Textures (Nano Banana Pro) ✅ */}
      {visibleStructures.ica && (
        <>
          {/* Internal Carotid Arteries (⚠️ CRITICAL - 607KB, 84/100) */}
          <group ref={icaLeftRef}>
            <InternalCarotidArtery
              side="left"
              pulsationRate={72}
              pulsationAmplitude={0.08}
            />
          </group>
          <group ref={icaRightRef}>
            <InternalCarotidArtery
              side="right"
              pulsationRate={72}
              pulsationAmplitude={0.08}
            />
          </group>
        </>
      )}

      {visibleStructures.mwcs && (
        <>
          {/* Medial Wall Cavernous Sinus (⚠️ CRITICAL - 662KB, 84/100) */}
          <group ref={mwcsLeftRef}>
            <CavernousSinus side="left" width={0.3} />
          </group>
          <group ref={mwcsRightRef}>
            <CavernousSinus side="right" width={0.3} />
          </group>

          {/* Optic Nerves (⚠️ CRITICAL - 788KB, 84/100) */}
          <group ref={opticLeftRef}>
            <OpticNerve side="left" visible={true} />
          </group>
          <group ref={opticRightRef}>
            <OpticNerve side="right" visible={true} />
          </group>
        </>
      )}

      {/* Level 0: Nasal Cavity with AI Textures (Nano Banana Pro) ✅ */}
      {visibleStructures.nasalCavity && (
        <group name="nasal-cavity-ai-textured">
          {/* AI-Generated Nasal Septum (midline partition) */}
          <group ref={nasalSeptumRef}>
            <NasalSeptum visible={true} positionZ={-4.0} />
          </group>

          {/* AI-Generated Nasal Turbinates (bilateral, ⭐ Nano Banana Pro SUCCESS) */}
          <group ref={nasalTurbinateLeftRef}>
            <NasalTurbinate side="left" visible={true} seed={67890} />
          </group>
          <group ref={nasalTurbinateRightRef}>
            <NasalTurbinate side="right" visible={true} seed={67891} />
          </group>

          {/* Lighting for nasal cavity */}
          <pointLight position={[0, 0.5, -4]} intensity={0.6} distance={5} color="#f7d9cd" />
          <pointLight position={[0, 0.3, -6]} intensity={0.5} distance={4} color="#f7d9cd" />
        </group>
      )}

      {/* Level 1: AI-Generated Sphenoid Ostium (surgical landmark) ✅ */}
      {visibleStructures.sphenoidOstium && (
        <group ref={sphenoidOstiumRef}>
          <SphenoidOstium visible={true} diameter={0.3} />
        </group>
      )}
    </group>
  )
}
