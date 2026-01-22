import { useRef, useCallback } from 'react'
import { TissueType, TISSUE_PROPERTIES, isCriticalTissue } from '../materials/TissueMaterials'
import {
  CollisionEvent,
  CollisionResponse,
  CrisisEvent,
  CrisisType,
  Vector3D,
} from './types'

/**
 * CollisionManager - Handles collision detection and response
 *
 * This component orchestrates tissue-specific collision responses,
 * crisis detection, and surgical event tracking.
 *
 * Features:
 * - Tissue-type specific damage and effects
 * - Crisis trigger system (ICA injury, CSF leak)
 * - Collision debouncing (prevent spam)
 * - Event history tracking
 */

export interface CollisionManagerProps {
  /** Callback for score updates */
  onScoreChange?: (delta: number) => void
  /** Callback for collision events */
  onCollision?: (event: CollisionEvent) => void
  /** Callback for crisis events */
  onCrisis?: (event: CrisisEvent) => void
}

export function useCollisionManager({
  onScoreChange,
  onCollision,
  onCrisis,
}: CollisionManagerProps = {}) {
  // Debounce tracking (prevent multiple collisions from same contact)
  const lastCollisionTime = useRef<number>(0)
  const DEBOUNCE_MS = 250

  // Collision history
  const collisionHistory = useRef<CollisionEvent[]>([])
  const crisisHistory = useRef<CrisisEvent[]>([])

  /**
   * Generate collision response based on tissue type
   */
  const getCollisionResponse = useCallback((tissueType: TissueType): CollisionResponse => {
    const props = TISSUE_PROPERTIES[tissueType]
    const isCritical = isCriticalTissue(tissueType)

    // ICA collision triggers crisis
    if (tissueType === TissueType.ICA) {
      return {
        scorePenalty: props.scorePenalty,
        visualEffect: props.visualEffect,
        triggerCrisis: true,
        crisisType: CrisisType.ICA_INJURY,
        message: '⚠️ CRITICAL: Internal Carotid Artery Injury!',
      }
    }

    // Dura collision can trigger CSF leak (random chance)
    if (tissueType === TissueType.DURA && Math.random() < 0.3) {
      return {
        scorePenalty: props.scorePenalty,
        visualEffect: props.visualEffect,
        triggerCrisis: true,
        crisisType: CrisisType.CSF_LEAK,
        message: '⚠️ CSF Leak Detected',
      }
    }

    // Standard collision response
    return {
      scorePenalty: props.scorePenalty,
      visualEffect: props.visualEffect,
      triggerCrisis: false,
      message: isCritical
        ? `Critical Contact: ${props.name}`
        : `Contact: ${props.name}`,
    }
  }, [])

  /**
   * Handle collision event
   */
  const handleCollision = useCallback(
    (position: Vector3D, tissueType: TissueType, intensity: number = 1.0) => {
      const now = Date.now()

      // Debounce check
      if (now - lastCollisionTime.current < DEBOUNCE_MS) {
        return
      }

      lastCollisionTime.current = now

      // Create collision event
      const collision: CollisionEvent = {
        position,
        tissueType,
        timestamp: now,
        intensity,
      }

      // Add to history
      collisionHistory.current.push(collision)

      // Get response configuration
      const response = getCollisionResponse(tissueType)

      // Update score
      if (onScoreChange && response.scorePenalty > 0) {
        onScoreChange(-response.scorePenalty)
      }

      // Notify collision callback
      if (onCollision) {
        onCollision(collision)
      }

      // Check for crisis
      if (response.triggerCrisis && response.crisisType) {
        const crisis: CrisisEvent = {
          type: response.crisisType,
          timestamp: now,
          collision,
          description: response.message,
        }

        crisisHistory.current.push(crisis)

        // Notify crisis callback
        if (onCrisis) {
          onCrisis(crisis)
        }

        console.error(`🚨 CRISIS: ${response.message}`)
      } else {
        console.log(`Collision: ${response.message} (penalty: -${response.scorePenalty})`)
      }
    },
    [getCollisionResponse, onScoreChange, onCollision, onCrisis]
  )

  /**
   * Get collision statistics
   */
  const getStats = useCallback(() => {
    const byTissue: Record<TissueType, number> = {} as Record<TissueType, number>

    // Initialize counts
    Object.values(TissueType).forEach((type) => {
      byTissue[type] = 0
    })

    // Count collisions by tissue type
    collisionHistory.current.forEach((collision) => {
      byTissue[collision.tissueType]++
    })

    const critical = collisionHistory.current.filter((c) =>
      isCriticalTissue(c.tissueType)
    ).length

    return {
      total: collisionHistory.current.length,
      byTissue,
      critical,
      lastCollision:
        collisionHistory.current.length > 0
          ? collisionHistory.current[collisionHistory.current.length - 1]
          : null,
    }
  }, [])

  /**
   * Get active crises
   */
  const getActiveCrises = useCallback(() => {
    return crisisHistory.current
  }, [])

  /**
   * Reset collision tracking
   */
  const reset = useCallback(() => {
    collisionHistory.current = []
    crisisHistory.current = []
    lastCollisionTime.current = 0
  }, [])

  return {
    handleCollision,
    getStats,
    getActiveCrises,
    reset,
  }
}

/**
 * CollisionManager component (stateless wrapper)
 */
export function CollisionManager(_props: CollisionManagerProps) {
  // This is just a provider pattern - the hook does the work
  return null
}
