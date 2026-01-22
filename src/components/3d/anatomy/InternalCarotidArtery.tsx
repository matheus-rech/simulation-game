import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, TubeGeometry } from 'three'
import { createLeftICAcurve, createRightICAcurve } from './geometry/AnatomicalCurves'
import { TissueType } from '../materials/TissueMaterials'

/**
 * InternalCarotidArtery - Anatomically accurate ICA with pulsation
 *
 * The Internal Carotid Artery (ICA) is the most critical structure in
 * transsphenoidal surgery. It carries blood to the brain and injury can
 * be catastrophic (massive hemorrhage, stroke, death).
 *
 * Anatomical features:
 * - Diameter: 3.5-5mm (using 4mm = 0.4cm)
 * - Position: 8-12mm lateral to midline
 * - Distance from sella: 2-5mm
 * - Pulsatile (60-80 BPM, using 72 BPM = 1.2 Hz)
 *
 * Surgical significance:
 * - Most common cause of operative mortality
 * - Lateral dissection must be avoided
 * - Bleeding is difficult to control
 * - Requires vascular neurosurgery expertise
 *
 * Visual cues for trainees:
 * - Red color with emissive glow
 * - Visible pulsation (scale variation)
 * - Tubular structure along lateral wall
 */

export interface InternalCarotidArteryProps {
  /** Side of ICA (left or right) */
  side: 'left' | 'right'
  /** Pulsation rate in beats per minute (default 72 BPM) */
  pulsationRate?: number
  /** Pulsation amplitude (scale variation, default 0.08 = 8%) */
  pulsationAmplitude?: number
}

export function InternalCarotidArtery({
  side,
  pulsationRate = 72, // Normal resting heart rate
  pulsationAmplitude = 0.08,
}: InternalCarotidArteryProps) {
  const meshRef = useRef<Mesh>(null)

  // Create anatomical curve based on side
  const curve = useMemo(() => {
    return side === 'left' ? createLeftICAcurve() : createRightICAcurve()
  }, [side])

  // Create tube geometry along curve
  const geometry = useMemo(() => {
    const tubularSegments = 64 // Smooth curve
    const radius = 0.04 // 4mm diameter = 0.04cm radius
    const radialSegments = 16 // Circular cross-section

    return new TubeGeometry(curve, tubularSegments, radius, radialSegments, false)
  }, [curve])

  // Pulsation animation
  useFrame(({ clock }) => {
    if (!meshRef.current) return

    // Calculate pulsation phase
    const frequency = pulsationRate / 60 // Convert BPM to Hz
    const phase = clock.elapsedTime * frequency * Math.PI * 2

    // Sinusoidal pulsation (systole/diastole cycle)
    const pulsation = Math.sin(phase) * pulsationAmplitude

    // Apply scale variation (radial pulsation)
    const scale = 1.0 + pulsation
    meshRef.current.scale.set(scale, scale, scale)
  })

  return (
    <group name={`ica-${side}`}>
      {/* ICA vessel */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        castShadow
        receiveShadow
        userData={{ tissueType: TissueType.ICA }}
      >
        <meshStandardMaterial
          color="#b71c2b" // Arterial blood color (bright red)
          roughness={0.3} // Slightly glossy (blood vessel wall)
          metalness={0.0}
          emissive="#b71c2b" // Self-illumination
          emissiveIntensity={0.4} // Visible glow
        />
      </mesh>

      {/* Pulsation indicator light (follows vessel) */}
      <pointLight
        position={side === 'left' ? [-0.88, 0.2, -7.3] : [0.88, 0.2, -7.3]}
        intensity={0.3}
        distance={0.6}
        color="#ff4444"
        castShadow={false}
      />
    </group>
  )
}
