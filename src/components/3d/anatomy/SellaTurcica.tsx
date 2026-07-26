import { useMemo, useEffect, useState } from 'react'
import { SphereGeometry, Texture } from 'three'
import { createOffsetGeometry } from './geometry/ProceduralGeometry'
import { TissueType } from '../materials/TissueMaterials'
import { loadAnatomyTexture } from '../materials/TextureLoader'

/**
 * SellaTurcica - Anatomically accurate sella turcica with bone and dura layers
 *
 * The sella turcica ("Turkish saddle") is a saddle-shaped depression in the
 * sphenoid bone that houses the pituitary gland. It consists of:
 * - Bone shell (outer layer)
 * - Dura mater (thick meningeal lining)
 * - Intradural cavity (contains pituitary gland)
 *
 * Surgical relevance:
 * - After opening the sphenoid sinus, the sellar floor must be drilled away
 * - The dura mater is then incised to access the pituitary
 * - Proper dural opening is critical to prevent CSF leak
 *
 * Anatomical dimensions (typical adult):
 * - Anteroposterior diameter: 10-16mm (using 12mm)
 * - Transverse diameter: 12-20mm (using 15mm)
 * - Vertical depth: 8-12mm (using 10mm)
 * - Bone thickness: 0.5-1mm (using 0.8mm)
 * - Dura thickness: 0.3-0.5mm (using 0.4mm)
 */

export interface SellaTurcicaProps {
  /** Show bone layer */
  showBone?: boolean
  /** Show dura mater layer */
  showDura?: boolean
  /** LOD level (0 = high detail, 1 = medium, 2 = low) */
  lodLevel?: number
}

export function SellaTurcica({
  showBone = true,
  showDura = true,
  lodLevel = 0,
}: SellaTurcicaProps) {
  // AI-generated textures from Nano Banana Pro
  const [sellaFloorTexture, setSellaFloorTexture] = useState<Texture | null>(null)
  const [duraTexture, setDuraTexture] = useState<Texture | null>(null)

  // Load AI-generated textures
  useEffect(() => {
    let mounted = true

    // Load sella floor bone texture
    loadAnatomyTexture('sellaFloor').then(texture => {
      if (mounted) setSellaFloorTexture(texture)
    })

    // Load dura mater texture
    loadAnatomyTexture('dura').then(texture => {
      if (mounted) setDuraTexture(texture)
    })

    return () => {
      mounted = false
    }
  }, [])

  // Calculate sphere segments based on LOD level
  const widthSegments = useMemo(() => {
    switch (lodLevel) {
      case 0:
        return 32 // Full detail
      case 1:
        return 24 // Medium detail (70% vertices)
      case 2:
        return 16 // Low detail (40% vertices)
      default:
        return 32
    }
  }, [lodLevel])

  const heightSegments = useMemo(() => {
    switch (lodLevel) {
      case 0:
        return 16 // Full detail
      case 1:
        return 12 // Medium detail
      case 2:
        return 8 // Low detail
      default:
        return 16
    }
  }, [lodLevel])

  // Bone layer geometry (outer shell)
  const boneGeometry = useMemo(() => {
    // Create hemisphere (bowl shape)
    const radius = 1.5 // Base radius 15mm
    const bone = new SphereGeometry(
      radius,
      widthSegments, // LOD-adaptive detail
      heightSegments, // LOD-adaptive detail
      0, // phiStart
      Math.PI * 2, // phiLength (full circle)
      0, // thetaStart
      Math.PI / 2 // thetaLength (hemisphere only)
    )

    // Scale to anatomical proportions
    // Width (x): 15mm
    // Depth (z): 12mm
    // Height (y): 10mm
    bone.scale(1.0, 0.67, 0.8)

    // Rotate to open upward (pituitary sits inside)
    bone.rotateX(Math.PI)

    return bone
  }, [widthSegments, heightSegments])

  // Dura mater layer (offset inward from bone)
  const duraGeometry = useMemo(() => {
    // Create dura by offsetting bone geometry inward
    const boneClone = boneGeometry.clone()
    const duraThickness = -0.04 // -0.4mm (negative = inward)
    const dura = createOffsetGeometry(boneClone, duraThickness)

    return dura
  }, [boneGeometry])

  // Cleanup: Dispose geometries on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      boneGeometry.dispose()
      duraGeometry.dispose()
    }
  }, [boneGeometry, duraGeometry])

  return (
    <group name="sella-turcica">
      {/* Bone shell with AI-generated texture */}
      {showBone && (
        <mesh
          geometry={boneGeometry}
          castShadow
          receiveShadow
          userData={{ tissueType: TissueType.BONE }}
        >
          <meshStandardMaterial
            map={sellaFloorTexture} // AI-generated sella floor bone texture (84/100 quality)
            color={sellaFloorTexture ? '#ffffff' : '#f3eee4'} // White when textured, fallback cream
            roughness={0.75}
            metalness={0.0}
          />
        </mesh>
      )}

      {/* Dura mater lining with AI-generated texture */}
      {showDura && (
        <mesh
          geometry={duraGeometry}
          castShadow
          receiveShadow
          userData={{ tissueType: TissueType.DURA }}
        >
          <meshStandardMaterial
            map={duraTexture} // AI-generated dura mater texture (84/100 quality, 635KB)
            color={duraTexture ? '#ffffff' : '#e8dcc8'} // White when textured, fallback pearl-gray
            roughness={0.4}
            metalness={0.0}
            opacity={0.85}
            transparent
          />
        </mesh>
      )}

      {/* Subtle rim lighting to highlight depth */}
      <pointLight
        position={[0, -0.3, 0]}
        intensity={0.2}
        distance={1.5}
        color="#f7d9cd"
        castShadow={false}
      />
    </group>
  )
}
