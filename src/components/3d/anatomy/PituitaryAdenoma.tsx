import { useMemo, useEffect } from 'react'
import { SphereGeometry } from 'three'
import {
  applyNoiseDistortion,
  applyNoiseVertexColors,
  createOffsetGeometry,
  setNoiseSeed,
} from './geometry/ProceduralGeometry'
import { TissueType } from '../materials/TissueMaterials'

/**
 * PituitaryAdenoma - Anatomically accurate pituitary tumor with pseudocapsule
 *
 * Pituitary adenomas are benign tumors arising from the pituitary gland.
 * They are the primary target for endoscopic transsphenoidal surgery.
 *
 * Anatomical characteristics:
 * - Irregular, nodular surface (unlike smooth normal pituitary)
 * - Pseudocapsule: compressed normal gland tissue forming outer layer
 * - Heterogeneous internal structure (variable cell density)
 * - Soft, friable consistency
 * - Easily dissected from normal tissue along pseudocapsule
 *
 * Size classification:
 * - Microadenoma: <10mm
 * - Macroadenoma: ≥10mm
 * - Giant adenoma: >40mm
 *
 * Surgical technique:
 * - Identify pseudocapsule plane
 * - Debulk central tumor
 * - Dissect along capsule to preserve normal gland
 * - Avoid lateral dissection near ICA
 */

export interface PituitaryAdenomaProps {
  /** Tumor diameter in cm (0.8-4.0 = 8mm-40mm) */
  size?: number
  /** Seed for reproducible tumor morphology */
  seed?: number
  /** Irregularity strength (0-1, higher = more irregular) */
  irregularity?: number
  /** Show pseudocapsule layer */
  showPseudocapsule?: boolean
}

export function PituitaryAdenoma({
  size = 1.2, // 12mm (typical macroadenoma)
  seed = 54321,
  irregularity = 0.25, // Moderate irregularity
  showPseudocapsule = true,
}: PituitaryAdenomaProps) {
  // Set noise seed for reproducible tumor morphology
  useMemo(() => {
    setNoiseSeed(seed)
  }, [seed])

  // Tumor core geometry with irregular surface
  const tumorGeometry = useMemo(() => {
    // Base sphere
    const radius = size / 2
    const tumor = new SphereGeometry(
      radius,
      32, // Optimized detail (sufficient for noise distortion)
      32
    )

    // Apply Perlin noise distortion for irregular surface
    applyNoiseDistortion(
      tumor,
      irregularity, // Distortion strength
      2.0, // Frequency (higher = finer details)
      2 // Octaves (optimized for performance, still provides good detail)
    )

    // Apply heterogeneous vertex colors (variable cell density)
    applyNoiseVertexColors(
      tumor,
      0.8, // Base color brightness
      0.3 // Color variation
    )

    return tumor
  }, [size, irregularity])

  // Pseudocapsule geometry (thin compressed layer)
  const pseudocapsuleGeometry = useMemo(() => {
    // Clone tumor geometry and offset slightly outward
    const tumorClone = tumorGeometry.clone()
    const capsuleThickness = 0.02 // 0.2mm (very thin)
    const capsule = createOffsetGeometry(tumorClone, capsuleThickness)

    return capsule
  }, [tumorGeometry])

  // Cleanup: Dispose geometries on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      tumorGeometry.dispose()
      pseudocapsuleGeometry.dispose()
    }
  }, [tumorGeometry, pseudocapsuleGeometry])

  return (
    <group name="pituitary-adenoma">
      {/* Pseudocapsule (outer compressed layer) */}
      {showPseudocapsule && (
        <mesh
          geometry={pseudocapsuleGeometry}
          castShadow
          receiveShadow
          userData={{ tissueType: TissueType.PSEUDOCAPSULE }}
        >
          <meshStandardMaterial
            color="#c89090" // Pseudocapsule color (compressed tissue)
            roughness={0.45}
            metalness={0.0}
            opacity={0.8}
            transparent
          />
        </mesh>
      )}

      {/* Tumor core with heterogeneous coloring */}
      <mesh
        geometry={tumorGeometry}
        castShadow
        receiveShadow
        userData={{ tissueType: TissueType.TUMOR }}
      >
        <meshStandardMaterial
          color="#d4a5a5" // Tumor color (pinkish-brown)
          roughness={0.6}
          metalness={0.0}
          vertexColors // Use vertex colors for heterogeneity
        />
      </mesh>

      {/* Subtle subsurface lighting (soft tissue translucency) */}
      <pointLight
        position={[0, 0, 0]}
        intensity={0.15}
        distance={size * 1.5}
        color="#f0c0c0"
        castShadow={false}
      />
    </group>
  )
}
