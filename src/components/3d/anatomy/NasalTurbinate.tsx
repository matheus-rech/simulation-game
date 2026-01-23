import { useMemo, useEffect, useState } from 'react'
import { CylinderGeometry, Texture } from 'three'
import { applyNoiseDistortion, setNoiseSeed } from './geometry/ProceduralGeometry'
import { TissueType } from '../materials/TissueMaterials'
import { loadAnatomyTexture } from '../materials/TextureLoader'

/**
 * NasalTurbinate (Inferior Turbinate) - Scroll-shaped bone on lateral nasal wall
 *
 * The nasal turbinates (conchae) are curved bony shelves covered by highly
 * vascular mucosa that project into the nasal cavity. They increase surface
 * area for warming and humidifying inspired air.
 *
 * Types:
 * - Inferior turbinate (largest, most relevant for surgery)
 * - Middle turbinate (landmark for sphenoid ostium)
 * - Superior turbinate (rarely seen in transsphenoidal approach)
 *
 * Anatomical features:
 * - C-shaped scroll morphology
 * - Highly vascular erectile tissue (can swell/shrink)
 * - Covered by ciliated respiratory epithelium
 * - Lateral attachment to maxillary bone
 *
 * Surgical relevance:
 * - May require partial resection to widen surgical corridor
 * - Bleeding common due to rich vascularity
 * - Landmark for orienting endonasal approach
 * - Medial displacement widens nasal cavity access
 *
 * ⭐ SPECIAL NOTE: This texture succeeded with Nano Banana Pro (84/100)
 * after FAILING multiple times with Gemini 2.5 (hallucinated intestine-like structures)
 */

export interface NasalTurbinateProps {
  /** Side of turbinate (left or right) */
  side: 'left' | 'right'
  /** Show the turbinate */
  visible?: boolean
  /** Seed for reproducible morphology */
  seed?: number
}

export function NasalTurbinate({ side, visible = true, seed = 67890 }: NasalTurbinateProps) {
  // AI-generated nasal turbinate texture (⭐ Nano Banana Pro SUCCESS - 84/100)
  const [turbinateTexture, setTurbinateTexture] = useState<Texture | null>(null)

  // Load AI-generated texture
  useEffect(() => {
    let mounted = true

    loadAnatomyTexture('nasalTurbinate').then((texture) => {
      if (mounted) {
        setTurbinateTexture(texture)
        console.log(`✅ Loaded nasal turbinate texture for ${side} side (653KB, 84/100)`)
        console.log('   ⭐ This texture FAILED with Gemini 2.5 but succeeded with Nano Banana Pro!')
      }
    })

    return () => {
      mounted = false
    }
  }, [side])

  // Set noise seed for reproducible morphology
  useMemo(() => {
    setNoiseSeed(seed)
  }, [seed])

  // Create curved turbinate geometry
  const turbinateGeometry = useMemo(() => {
    // Base cylinder for scroll-like structure
    const radiusTop = 0.3 // Thicker anteriorly
    const radiusBottom = 0.2 // Thinner posteriorly
    const height = 4.0 // 40mm length
    const radialSegments = 16
    const heightSegments = 8

    const geometry = new CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      radialSegments,
      heightSegments
    )

    // Apply slight curvature with noise distortion (C-shaped scroll)
    applyNoiseDistortion(
      geometry,
      0.15, // Mild distortion for scroll morphology
      1.5, // Frequency
      1 // Single octave for smooth curve
    )

    // Rotate to horizontal orientation
    geometry.rotateZ(Math.PI / 2)

    return geometry
  }, [])

  // Position based on side
  const xPosition = side === 'left' ? -1.2 : 1.2 // 12mm lateral to midline
  const zPosition = -4.0 // Mid-nasal cavity depth

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      turbinateGeometry.dispose()
    }
  }, [turbinateGeometry])

  if (!visible) return null

  return (
    <group name={`nasal-turbinate-${side}`} position={[xPosition, 0.5, zPosition]}>
      {/* Turbinate bone/mucosa with AI-generated texture (⭐ NANO BANANA PRO) */}
      <mesh
        geometry={turbinateGeometry}
        castShadow
        receiveShadow
        userData={{ tissueType: TissueType.MUCOSA }}
      >
        <meshStandardMaterial
          map={turbinateTexture} // AI-generated texture (653KB, 84/100) ⭐
          color={turbinateTexture ? '#ffffff' : '#e8c8b8'} // White when textured, fallback pink-tan
          roughness={0.45}
          metalness={0.0}
        />
      </mesh>

      {/* Vascular glow (simulates erectile tissue vascularity) */}
      <pointLight
        position={[0, 0, 0]}
        intensity={0.15}
        distance={1.5}
        color="#f0a090"
        castShadow={false}
      />
    </group>
  )
}
