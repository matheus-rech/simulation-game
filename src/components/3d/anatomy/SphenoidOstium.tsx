import { useMemo, useEffect, useState } from 'react'
import { TorusGeometry, Texture } from 'three'
import { TissueType } from '../materials/TissueMaterials'
import { loadAnatomyTexture } from '../materials/TextureLoader'

/**
 * SphenoidOstium - Natural opening into the sphenoid sinus
 *
 * The sphenoid ostium is a small natural opening on the anterior face of the
 * sphenoid bone, providing drainage from the sphenoid sinus into the nasal cavity.
 * It's a critical landmark in the transsphenoidal approach.
 *
 * Anatomical features:
 * - Location: Anterior face of sphenoid, superior-medial to middle turbinate
 * - Size: 2-4mm diameter (variable)
 * - Shape: Oval or round
 * - Lined by respiratory epithelium
 * - Often requires surgical enlargement for pituitary access
 *
 * Surgical relevance:
 * - KEY LANDMARK for identifying sphenoid sinus entry point
 * - Natural ostium enlarged to create wider surgical corridor
 * - Middle turbinate attachment nearby (may require resection)
 * - Orientation helps identify midline and avoid carotid arteries
 *
 * Surgical technique:
 * - Identify ostium endoscopically (may use image guidance)
 * - Enlarge with Kerrison rongeur or drill
 * - Widen to 10-15mm for instrument access
 * - Remove anterior face of sphenoid (rostrum) if needed
 */

export interface SphenoidOstiumProps {
  /** Show the ostium opening */
  visible?: boolean
  /** Diameter in cm (typical 0.2-0.4cm, enlarged to 1.0-1.5cm surgically) */
  diameter?: number
}

export function SphenoidOstium({ visible = true, diameter = 0.3 }: SphenoidOstiumProps) {
  // AI-generated sphenoid ostium texture (Nano Banana Pro - 84/100 quality)
  const [ostiumTexture, setOstiumTexture] = useState<Texture | null>(null)

  // Load AI-generated texture
  useEffect(() => {
    let mounted = true

    loadAnatomyTexture('sphenoidOstium').then(texture => {
      if (mounted) {
        setOstiumTexture(texture)
        console.log('✅ Loaded sphenoid ostium texture (680KB, 84/100 quality)')
      }
    })

    return () => {
      mounted = false
    }
  }, [])

  // Create torus geometry for circular opening
  const ostiumGeometry = useMemo(() => {
    const radius = diameter / 2 // Convert diameter to radius
    const tubeRadius = 0.05 // Thin ring (0.5mm wall thickness)
    const radialSegments = 16
    const tubularSegments = 32

    const geometry = new TorusGeometry(radius, tubeRadius, radialSegments, tubularSegments)

    // Rotate to face forward (opening visible from nasal cavity)
    geometry.rotateY(Math.PI / 2)

    return geometry
  }, [diameter])

  // Position at anterior face of sphenoid (near Level 1)
  const position: [number, number, number] = [0, 0.3, -6.2]

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ostiumGeometry.dispose()
    }
  }, [ostiumGeometry])

  if (!visible) return null

  return (
    <group name="sphenoid-ostium" position={position}>
      {/* Ostium ring with AI-generated texture */}
      <mesh
        geometry={ostiumGeometry}
        castShadow
        receiveShadow
        userData={{ tissueType: TissueType.BONE }}
      >
        <meshStandardMaterial
          map={ostiumTexture} // AI-generated ostium texture (84/100 quality)
          color={ostiumTexture ? '#ffffff' : '#e8dcc8'} // White when textured, fallback bone/mucosa
          roughness={0.6}
          metalness={0.0}
        />
      </mesh>

      {/* Interior glow to highlight opening (surgical landmark) */}
      <pointLight
        position={[0, 0, 0]}
        intensity={0.4}
        distance={1.0}
        color="#f7d9cd"
        castShadow={false}
      />

      {/* Label for educational context (visible in close-up) */}
      <group visible={false}>{/* TODO: Add text label for educational mode */}</group>
    </group>
  )
}
