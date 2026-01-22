import { useMemo } from 'react'
import { Vector3 } from 'three'

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
 */

export interface AnatomyManagerProps {
  level: number
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

export function AnatomyManager({ level }: AnatomyManagerProps) {
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

      {/* Phase 2: Core Structures (To be implemented) */}
      {visibleStructures.sphenoidSinus && (
        <group
          name="sphenoid-sinus-group"
          position={ANATOMY_POSITIONS.sphenoidSinus}
        >
          {/* SphenoidSinus component will go here */}
          {/* TODO: CSG cavity with septations and sellar floor */}
          <mesh>
            <boxGeometry args={[2.0, 1.5, 1.5]} />
            <meshStandardMaterial color="#f3eee4" roughness={0.75} opacity={0.3} transparent />
          </mesh>
        </group>
      )}

      {visibleStructures.sellaTurcica && (
        <group
          name="sella-turcica-group"
          position={ANATOMY_POSITIONS.sellaTurcica}
        >
          {/* SellaTurcica component will go here */}
          {/* TODO: Bone layer + dura layer + intradural cavity */}
          <mesh>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshStandardMaterial color="#f3eee4" roughness={0.75} opacity={0.3} transparent />
          </mesh>
        </group>
      )}

      {visibleStructures.pituitary && (
        <group
          name="pituitary-adenoma-group"
          position={ANATOMY_POSITIONS.pituitary}
        >
          {/* PituitaryAdenoma component will go here */}
          {/* TODO: Perlin-distorted sphere with pseudocapsule */}
          <mesh>
            <sphereGeometry args={[0.8, 64, 64]} />
            <meshStandardMaterial color="#d4a5a5" roughness={0.6} opacity={0.3} transparent />
          </mesh>
        </group>
      )}

      {/* Phase 3: Critical Structures (To be implemented) */}
      {visibleStructures.ica && (
        <>
          <group
            name="ica-left-group"
            position={ANATOMY_POSITIONS.icaLeft}
          >
            {/* InternalCarotidArtery (left) component will go here */}
            {/* TODO: Tube geometry along anatomical curve with pulsation */}
            <mesh>
              <cylinderGeometry args={[0.08, 0.08, 1.5, 16]} />
              <meshStandardMaterial color="#b71c2b" emissive="#b71c2b" emissiveIntensity={0.3} />
            </mesh>
          </group>

          <group
            name="ica-right-group"
            position={ANATOMY_POSITIONS.icaRight}
          >
            {/* InternalCarotidArtery (right) component will go here */}
            <mesh>
              <cylinderGeometry args={[0.08, 0.08, 1.5, 16]} />
              <meshStandardMaterial color="#b71c2b" emissive="#b71c2b" emissiveIntensity={0.3} />
            </mesh>
          </group>
        </>
      )}

      {visibleStructures.mwcs && (
        <>
          <group
            name="mwcs-left-group"
            position={ANATOMY_POSITIONS.mwcsLeft}
          >
            {/* CavernousSinus (left) component will go here */}
            {/* TODO: MWCS membrane following ICA curve */}
            <mesh>
              <planeGeometry args={[0.3, 1.5]} />
              <meshStandardMaterial
                color="#e8dcc8"
                roughness={0.4}
                opacity={0.6}
                transparent
                side={2}
              />
            </mesh>
          </group>

          <group
            name="mwcs-right-group"
            position={ANATOMY_POSITIONS.mwcsRight}
          >
            {/* CavernousSinus (right) component will go here */}
            <mesh>
              <planeGeometry args={[0.3, 1.5]} />
              <meshStandardMaterial
                color="#e8dcc8"
                roughness={0.4}
                opacity={0.6}
                transparent
                side={2}
              />
            </mesh>
          </group>
        </>
      )}

      {/* Temporary simple nasal cavity (will be enhanced in Phase 2) */}
      {visibleStructures.nasalCavity && (
        <group name="nasal-cavity-simple">
          <pointLight position={[0, 0.5, -4]} intensity={0.6} distance={5} color="#f7d9cd" />
          <pointLight position={[0, 0.3, -6]} intensity={0.5} distance={4} color="#f7d9cd" />

          {/* Basic turbinates for navigation reference */}
          <mesh position={[0.5, -0.1, -4.5]} rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.15, 0.2, 3, 16]} />
            <meshStandardMaterial color="#c56c72" roughness={0.55} />
          </mesh>
          <mesh position={[-0.5, -0.1, -4.5]} rotation={[0, 0, -Math.PI / 6]}>
            <cylinderGeometry args={[0.15, 0.2, 3, 16]} />
            <meshStandardMaterial color="#c56c72" roughness={0.55} />
          </mesh>
        </group>
      )}

      {/* Sphenoid ostium marker (anatomical landmark) */}
      {visibleStructures.sphenoidOstium && (
        <mesh
          position={ANATOMY_POSITIONS.sphenoidOstium}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.22, 0.05, 16, 32]} />
          <meshStandardMaterial color="#f3eee4" roughness={0.75} />
        </mesh>
      )}
    </group>
  )
}
