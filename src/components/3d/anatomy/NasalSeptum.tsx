import { useMemo, useEffect, useState } from 'react'
import { PlaneGeometry, Texture } from 'three'
import { TissueType } from '../materials/TissueMaterials'
import { loadAnatomyTexture } from '../materials/TextureLoader'

/**
 * NasalSeptum - Midline partition dividing the nasal cavity
 *
 * The nasal septum is the first anatomical landmark encountered in the
 * transsphenoidal approach to the pituitary gland. It's a composite
 * structure made of cartilage (anteriorly) and bone (posteriorly).
 *
 * Anatomical features:
 * - Anterior: Quadrangular cartilage
 * - Posterior: Perpendicular plate of ethmoid + vomer bone
 * - Covered by respiratory epithelium (ciliated pseudostratified)
 * - Rich vascular supply (Kiesselbach's plexus anteriorly)
 *
 * Surgical relevance:
 * - First structure encountered in endonasal approach
 * - May require partial resection to widen surgical corridor
 * - Bleeding from septal vessels can obscure view
 * - Deviation common (affects instrument trajectory)
 *
 * Dimensions:
 * - Height: 40-50mm (using 45mm)
 * - Depth: 70-80mm (using 75mm)
 * - Thickness: 1-2mm cartilage, 0.5-1mm bone
 */

export interface NasalSeptumProps {
  /** Show the septal wall */
  visible?: boolean
  /** Position offset in Z direction (depth into nasal cavity) */
  positionZ?: number
}

export function NasalSeptum({ visible = true, positionZ = -3.0 }: NasalSeptumProps) {
  // AI-generated nasal septum texture (Nano Banana Pro - 84/100 quality)
  const [septumTexture, setSeptumTexture] = useState<Texture | null>(null)

  // Load AI-generated texture
  useEffect(() => {
    let mounted = true

    loadAnatomyTexture('nasalSeptum').then((texture) => {
      if (mounted) {
        setSeptumTexture(texture)
        console.log('✅ Loaded nasal septum texture (630KB, 84/100 quality)')
      }
    })

    return () => {
      mounted = false
    }
  }, [])

  // Create plane geometry for septal wall (very thin partition ~1mm)
  const septumGeometry = useMemo(() => {
    const height = 4.5 // 45mm vertical extent
    const depth = 7.5 // 75mm anteroposterior depth

    // Create vertical plane
    const geometry = new PlaneGeometry(depth, height)

    // Rotate to face forward (divides left/right nasal fossae)
    geometry.rotateY(Math.PI / 2)

    return geometry
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      septumGeometry.dispose()
    }
  }, [septumGeometry])

  if (!visible) return null

  return (
    <group name="nasal-septum" position={[0, 0, positionZ]}>
      {/* Septal wall with AI-generated texture */}
      <mesh
        geometry={septumGeometry}
        castShadow
        receiveShadow
        userData={{ tissueType: TissueType.MUCOSA }}
      >
        <meshStandardMaterial
          map={septumTexture} // AI-generated septum texture (84/100 quality)
          color={septumTexture ? '#ffffff' : '#f0d5c8'} // White when textured, fallback mucosa pink
          roughness={0.5}
          metalness={0.0}
          side={2} // DoubleSide - visible from both nasal fossae
        />
      </mesh>

      {/* Subtle rim lighting for depth perception */}
      <pointLight
        position={[0, 0, 0]}
        intensity={0.2}
        distance={3.0}
        color="#f7e5da"
        castShadow={false}
      />
    </group>
  )
}
