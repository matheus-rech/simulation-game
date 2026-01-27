import { useMemo, useEffect, useState } from 'react'
import { TubeGeometry, CatmullRomCurve3, Vector3, Texture } from 'three'
import { TissueType } from '../materials/TissueMaterials'
import { loadAnatomyTexture } from '../materials/TextureLoader'

/**
 * OpticNerve (Cranial Nerve II) - Visual pathway to the brain
 *
 * The optic nerves transmit visual information from the retina to the brain.
 * They run in the optic canals superomedial to the cavernous sinus, passing
 * superior and lateral to the pituitary gland and sella turcica.
 *
 * Anatomical features:
 * - Diameter: 3-4mm
 * - Length: 40-50mm (intraorbital + intracranial portions)
 * - Course: From orbit → optic canal → optic chiasm
 * - Position: Superolateral to sella (1-2mm above lateral edge)
 * - Dural sheath: Continuous with brain meninges
 *
 * Surgical significance:
 * - ⚠️ CRITICAL STRUCTURE - injury causes permanent blindness
 * - Vulnerable during lateral pituitary tumor dissection
 * - Suprasellar tumors can compress optic chiasm (visual field defects)
 * - Must identify and preserve during parasellar approaches
 * - Distance from sella decreases with tumor extension
 *
 * Visual field defects from compression:
 * - Bitemporal hemianopsia (chiasm compression - classic pituitary adenoma sign)
 * - Monocular vision loss (single nerve compression)
 * - Superior/inferior field cuts (tumor position-dependent)
 *
 * Imaging:
 * - MRI: Best for nerve and chiasm visualization
 * - CT: Good for bony optic canal anatomy
 * - Endoscopic view: Not directly visible (lies superior/lateral)
 */

export interface OpticNerveProps {
  /** Side of optic nerve (left or right) */
  side: 'left' | 'right'
  /** Show the nerve */
  visible?: boolean
}

export function OpticNerve({ side, visible = true }: OpticNerveProps) {
  // AI-generated optic nerve texture (Nano Banana Pro - 84/100 quality)
  const [nerveTexture, setNerveTexture] = useState<Texture | null>(null)

  // Load AI-generated texture
  useEffect(() => {
    let mounted = true

    loadAnatomyTexture('opticNerve').then(texture => {
      if (mounted) {
        setNerveTexture(texture)
        console.log(`✅ Loaded optic nerve texture for ${side} side (788KB, 84/100)`)
        console.log('   ⚠️ CRITICAL STRUCTURE - injury causes permanent blindness')
      }
    })

    return () => {
      mounted = false
    }
  }, [side])

  // Create anatomical curve for optic nerve path
  const nerveCurve = useMemo(() => {
    const lateralOffset = side === 'left' ? -1.2 : 1.2 // 12mm lateral to midline
    const superiorOffset = 1.0 // 10mm above sella floor

    // Optic nerve path: anterior (orbit) → posterior (chiasm)
    const points = [
      new Vector3(lateralOffset * 0.8, superiorOffset, -6.5), // Anterior (near sphenoid)
      new Vector3(lateralOffset * 0.9, superiorOffset + 0.1, -7.0), // Mid-course
      new Vector3(lateralOffset * 1.0, superiorOffset + 0.2, -7.3), // Above sella
      new Vector3(lateralOffset * 0.6, superiorOffset + 0.3, -7.6), // Approaching chiasm
      new Vector3(0, superiorOffset + 0.4, -7.8), // Optic chiasm (midline)
    ]

    return new CatmullRomCurve3(points)
  }, [side])

  // Create tube geometry along curve
  const nerveGeometry = useMemo(() => {
    const tubularSegments = 32 // Smooth curve
    const radius = 0.035 // 3.5mm diameter (typical optic nerve)
    const radialSegments = 12 // Circular cross-section

    return new TubeGeometry(nerveCurve, tubularSegments, radius, radialSegments, false)
  }, [nerveCurve])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      nerveGeometry.dispose()
    }
  }, [nerveGeometry])

  if (!visible) return null

  return (
    <group name={`optic-nerve-${side}`}>
      {/* Optic nerve with AI-generated texture (⚠️ CRITICAL) */}
      <mesh
        geometry={nerveGeometry}
        castShadow
        receiveShadow
        userData={{ tissueType: TissueType.NERVE }}
      >
        <meshStandardMaterial
          map={nerveTexture} // AI-generated nerve texture (788KB, 84/100)
          color={nerveTexture ? '#ffffff' : '#f0e8d8'} // White when textured, fallback cream (myelin)
          roughness={0.35}
          metalness={0.0}
          emissive="#ffe8d0" // Subtle glow for critical structure visibility
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Warning indicator light for critical structure */}
      <pointLight
        position={side === 'left' ? [-1.0, 1.0, -7.3] : [1.0, 1.0, -7.3]}
        intensity={0.25}
        distance={0.8}
        color="#ffcc80"
        castShadow={false}
      />
    </group>
  )
}
