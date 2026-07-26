import { TissueType } from '../materials/TissueMaterials'

/**
 * Collision detection types and interfaces
 */

/**
 * Vector3D type (matches VFX.tsx)
 */
export interface Vector3D {
  x: number
  y: number
  z: number
}

/**
 * Collision event data
 */
export interface CollisionEvent {
  /** Collision position in world space */
  position: Vector3D
  /** Type of tissue collided with */
  tissueType: TissueType
  /** Timestamp of collision */
  timestamp: number
  /** Collision force/intensity (0-1) */
  intensity: number
}

/**
 * Crisis types (catastrophic events)
 */
export enum CrisisType {
  /** Internal Carotid Artery injury */
  ICA_INJURY = 'ica_injury',
  /** CSF leak from dural breach */
  CSF_LEAK = 'csf_leak',
  /** Optic nerve injury */
  OPTIC_NERVE_INJURY = 'optic_nerve_injury',
}

/**
 * Crisis event data
 */
export interface CrisisEvent {
  /** Type of crisis */
  type: CrisisType
  /** When it occurred */
  timestamp: number
  /** Collision that triggered it */
  collision: CollisionEvent
  /** Human-readable description */
  description: string
}

/**
 * Collision response configuration
 */
export interface CollisionResponse {
  /** Score penalty */
  scorePenalty: number
  /** Visual effect to spawn */
  visualEffect: 'bleeding' | 'bruising' | 'arterial_bleed' | 'none'
  /** Trigger a crisis? */
  triggerCrisis: boolean
  /** Crisis type if triggered */
  crisisType?: CrisisType
  /** Message to display */
  message: string
}

/**
 * Collision statistics
 */
export interface CollisionStats {
  /** Total collisions */
  total: number
  /** Collisions by tissue type */
  byTissue: Record<TissueType, number>
  /** Critical collisions */
  critical: number
  /** Last collision */
  lastCollision: CollisionEvent | null
}
