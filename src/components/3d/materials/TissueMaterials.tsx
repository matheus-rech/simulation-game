import { MeshStandardMaterial, Color } from 'three'

/**
 * TissueMaterials - Comprehensive material library for anatomical tissues
 *
 * Each material is based on surgical visual references and endoscopic
 * imaging characteristics. Properties match observed tissue appearance
 * under surgical lighting conditions.
 */

/**
 * Tissue type enumeration
 */
export enum TissueType {
  MUCOSA = 'mucosa',
  BONE = 'bone',
  DURA = 'dura',
  TUMOR = 'tumor',
  PSEUDOCAPSULE = 'pseudocapsule',
  ICA = 'ica',
  MWCS = 'mwcs',
}

/**
 * Tissue material properties
 */
export interface TissueMaterialProps {
  color: string
  roughness: number
  metalness: number
  emissive?: string
  emissiveIntensity?: number
  opacity?: number
  transparent?: boolean
}

/**
 * Material property definitions for each tissue type
 */
export const TISSUE_MATERIALS: Record<TissueType, TissueMaterialProps> = {
  [TissueType.MUCOSA]: {
    color: '#c56c72', // Pink nasal mucosa
    roughness: 0.55,
    metalness: 0.0,
    opacity: 1.0,
  },

  [TissueType.BONE]: {
    color: '#f3eee4', // Cream bone color
    roughness: 0.75,
    metalness: 0.0,
    opacity: 1.0,
  },

  [TissueType.DURA]: {
    color: '#e8dcc8', // Pearl-gray dura mater
    roughness: 0.4,
    metalness: 0.0,
    opacity: 0.85,
    transparent: true,
  },

  [TissueType.TUMOR]: {
    color: '#d4a5a5', // Pinkish-brown tumor
    roughness: 0.6,
    metalness: 0.0,
    opacity: 1.0,
  },

  [TissueType.PSEUDOCAPSULE]: {
    color: '#c89090', // Compressed tissue
    roughness: 0.45,
    metalness: 0.0,
    opacity: 0.8,
    transparent: true,
  },

  [TissueType.ICA]: {
    color: '#b71c2b', // Arterial red
    roughness: 0.3,
    metalness: 0.0,
    emissive: '#b71c2b',
    emissiveIntensity: 0.4,
    opacity: 1.0,
  },

  [TissueType.MWCS]: {
    color: '#d4c8d8', // Purple-gray membrane
    roughness: 0.4,
    metalness: 0.0,
    opacity: 0.7,
    transparent: true,
  },
}

/**
 * Material cache for pooling and reuse
 * Prevents creating duplicate material instances for the same tissue type
 */
const materialCache = new Map<TissueType, MeshStandardMaterial>()

/**
 * Create a Three.js MeshStandardMaterial from tissue type
 * Uses material pooling to prevent duplication and reduce memory usage
 * @param tissueType Type of tissue
 * @returns Configured MeshStandardMaterial (cached instance)
 */
export function createTissueMaterial(tissueType: TissueType): MeshStandardMaterial {
  // Check cache first
  if (materialCache.has(tissueType)) {
    return materialCache.get(tissueType)!
  }

  // Create new material if not cached
  const props = TISSUE_MATERIALS[tissueType]

  const material = new MeshStandardMaterial({
    color: new Color(props.color),
    roughness: props.roughness,
    metalness: props.metalness,
    opacity: props.opacity ?? 1.0,
    transparent: props.transparent ?? false,
  })

  if (props.emissive) {
    material.emissive = new Color(props.emissive)
    material.emissiveIntensity = props.emissiveIntensity ?? 0.0
  }

  // Cache for future reuse
  materialCache.set(tissueType, material)

  return material
}

/**
 * Clear material cache and dispose all cached materials
 * Call this when cleaning up the scene or resetting the application
 */
export function clearMaterialCache(): void {
  materialCache.forEach((material) => {
    material.dispose()
  })
  materialCache.clear()
}

/**
 * Tissue properties for collision response
 */
export interface TissueProperties {
  /** Display name */
  name: string
  /** Damage per collision */
  scorePenalty: number
  /** Visual effect type */
  visualEffect: 'bleeding' | 'bruising' | 'arterial_bleed' | 'none'
  /** Is this a critical/dangerous structure? */
  critical: boolean
  /** Resistance to endoscope (for haptic feedback in future) */
  resistance: number
}

/**
 * Tissue properties for collision detection and response
 */
export const TISSUE_PROPERTIES: Record<TissueType, TissueProperties> = {
  [TissueType.MUCOSA]: {
    name: 'Nasal Mucosa',
    scorePenalty: 1,
    visualEffect: 'bleeding',
    critical: false,
    resistance: 0.2,
  },

  [TissueType.BONE]: {
    name: 'Sphenoid Bone',
    scorePenalty: 3,
    visualEffect: 'bruising',
    critical: false,
    resistance: 0.8,
  },

  [TissueType.DURA]: {
    name: 'Dura Mater',
    scorePenalty: 5,
    visualEffect: 'bleeding',
    critical: false,
    resistance: 0.4,
  },

  [TissueType.TUMOR]: {
    name: 'Pituitary Adenoma',
    scorePenalty: 2,
    visualEffect: 'bleeding',
    critical: false,
    resistance: 0.3,
  },

  [TissueType.PSEUDOCAPSULE]: {
    name: 'Pseudocapsule',
    scorePenalty: 3,
    visualEffect: 'bleeding',
    critical: false,
    resistance: 0.35,
  },

  [TissueType.ICA]: {
    name: 'Internal Carotid Artery',
    scorePenalty: 100,
    visualEffect: 'arterial_bleed',
    critical: true,
    resistance: 0.5,
  },

  [TissueType.MWCS]: {
    name: 'Cavernous Sinus Wall',
    scorePenalty: 10,
    visualEffect: 'bleeding',
    critical: false,
    resistance: 0.25,
  },
}

/**
 * Get tissue name from type
 */
export function getTissueName(tissueType: TissueType): string {
  return TISSUE_PROPERTIES[tissueType].name
}

/**
 * Check if tissue is critical (requires immediate response)
 */
export function isCriticalTissue(tissueType: TissueType): boolean {
  return TISSUE_PROPERTIES[tissueType].critical
}

/**
 * Get score penalty for tissue collision
 */
export function getScorePenalty(tissueType: TissueType): number {
  return TISSUE_PROPERTIES[tissueType].scorePenalty
}

/**
 * Get visual effect type for tissue collision
 */
export function getVisualEffect(
  tissueType: TissueType
): 'bleeding' | 'bruising' | 'arterial_bleed' | 'none' {
  return TISSUE_PROPERTIES[tissueType].visualEffect
}
