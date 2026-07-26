import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * AdaptiveQuality - Dynamic post-processing quality adjustment
 *
 * Monitors FPS and adapts post-processing effects to maintain target performance:
 * - HIGH tier (60+ FPS): All 5 effects enabled
 * - MEDIUM tier (45-60 FPS): Disable DOF and ChromaticAberration
 * - LOW tier (<45 FPS): Only Vignette enabled
 *
 * Uses a 60-frame rolling window for stability and hysteresis (5 consecutive frames)
 * to prevent jarring quality transitions.
 *
 * Expected FPS improvement:
 * - MEDIUM: +5-8 FPS (DOF + ChromaticAberration disabled)
 * - LOW: +10-15 FPS (only Vignette enabled)
 */

export type QualityTier = 'high' | 'medium' | 'low'

export interface PostProcessingSettings {
  dof: boolean
  bloom: boolean
  vignette: boolean
  noise: boolean
  chromaticAberration: boolean
}

export interface QualitySettings {
  postProcessing: PostProcessingSettings
  targetFPS: number
  currentTier: QualityTier
  actualFPS: number
}

/**
 * Quality tier definitions with FPS thresholds
 */
const QUALITY_TIERS = {
  high: {
    threshold: 60,
    postProcessing: {
      dof: true,
      bloom: true,
      vignette: true,
      noise: true,
      chromaticAberration: true,
    },
  },
  medium: {
    threshold: 45,
    postProcessing: {
      dof: false,
      bloom: true,
      vignette: true,
      noise: true,
      chromaticAberration: false,
    },
  },
  low: {
    threshold: 0,
    postProcessing: {
      dof: false,
      bloom: false,
      vignette: true,
      noise: false,
      chromaticAberration: false,
    },
  },
}

/**
 * Hook to monitor FPS and adaptively adjust post-processing quality
 *
 * @param targetFPS - Target FPS to maintain (default: 60)
 * @param hysteresisFrames - Number of consecutive frames below threshold before downgrading (default: 5)
 * @returns Quality settings for current tier
 *
 * Usage:
 * ```typescript
 * const quality = useAdaptiveQuality(60)
 * return (
 *   <EffectComposer>
 *     {quality.postProcessing.dof && <DepthOfField ... />}
 *     {quality.postProcessing.bloom && <Bloom ... />}
 *     {quality.postProcessing.vignette && <Vignette ... />}
 *     {quality.postProcessing.noise && <Noise ... />}
 *     {quality.postProcessing.chromaticAberration && <ChromaticAberration ... />}
 *   </EffectComposer>
 * )
 * ```
 */
export function useAdaptiveQuality(
  targetFPS: number = 60,
  hysteresisFrames: number = 5
): QualitySettings {
  // State for quality tier
  const [currentTier, setCurrentTier] = useState<QualityTier>('high')

  // Refs for FPS calculation (avoid re-rendering on every frame)
  const fpsWindowRef = useRef<number[]>([])
  const lastUpdateTimeRef = useRef(performance.now())
  const downgradeCountRef = useRef(0)
  const upgradeCountRef = useRef(0)
  const currentFPSRef = useRef(60)

  useFrame(() => {
    const now = performance.now()

    // Calculate frame time delta
    const frameTimeDelta = now - lastUpdateTimeRef.current
    // Estimate FPS from time since last update
    // On first frame, default to 60
    const fps = frameTimeDelta > 0 ? 1000 / frameTimeDelta : 60
    currentFPSRef.current = fps

    // Add FPS to rolling window (60-frame window)
    fpsWindowRef.current.push(fps)
    if (fpsWindowRef.current.length > 60) {
      fpsWindowRef.current.shift()
    }

    // Update quality tier every 500ms to avoid thrashing
    if (now - lastUpdateTimeRef.current >= 500) {
      // Calculate average FPS from window
      const avgFPS =
        fpsWindowRef.current.length > 0
          ? fpsWindowRef.current.reduce((a, b) => a + b, 0) / fpsWindowRef.current.length
          : 60

      // Determine new tier based on FPS thresholds
      let newTier: QualityTier = 'high'

      if (avgFPS < QUALITY_TIERS.medium.threshold) {
        newTier = 'low'
      } else if (avgFPS < QUALITY_TIERS.high.threshold) {
        newTier = 'medium'
      } else {
        newTier = 'high'
      }

      // Apply hysteresis: require consecutive frames below threshold before changing
      if (newTier !== currentTier) {
        if (newTier === 'low' || (newTier === 'medium' && currentTier === 'high')) {
          // Downgrade
          downgradeCountRef.current++
          upgradeCountRef.current = 0

          if (downgradeCountRef.current >= hysteresisFrames) {
            setCurrentTier(newTier)
            downgradeCountRef.current = 0

            // Debug logging
            if (import.meta.env.DEV) {
              console.debug(
                `[AdaptiveQuality] Downgraded to ${newTier} tier (avg FPS: ${avgFPS.toFixed(1)})`
              )
            }
          }
        } else {
          // Upgrade
          upgradeCountRef.current++
          downgradeCountRef.current = 0

          if (upgradeCountRef.current >= hysteresisFrames * 2) {
            // Require more frames to upgrade (prevent thrashing)
            setCurrentTier(newTier)
            upgradeCountRef.current = 0

            if (import.meta.env.DEV) {
              console.debug(
                `[AdaptiveQuality] Upgraded to ${newTier} tier (avg FPS: ${avgFPS.toFixed(1)})`
              )
            }
          }
        }
      } else {
        // Reset counters when in stable tier
        downgradeCountRef.current = 0
        upgradeCountRef.current = 0
      }

      lastUpdateTimeRef.current = now
    }
  })

  return {
    postProcessing: QUALITY_TIERS[currentTier].postProcessing,
    targetFPS,
    currentTier,
    actualFPS: Math.round(currentFPSRef.current * 10) / 10,
  }
}

/**
 * Get description of quality tier for UI display
 */
export function getQualityTierDescription(tier: QualityTier): string {
  const descriptions: Record<QualityTier, string> = {
    high: 'High Quality (All effects enabled)',
    medium: 'Balanced (DOF disabled)',
    low: 'Low-End Mode (Only vignette)',
  }
  return descriptions[tier]
}

/**
 * Get color indicator for quality tier
 */
export function getQualityTierColor(tier: QualityTier): string {
  const colors: Record<QualityTier, string> = {
    high: '#4ade80', // Green
    medium: '#fbbf24', // Amber
    low: '#ef4444', // Red
  }
  return colors[tier]
}

/**
 * Debug hook: Returns detailed metrics about adaptive quality (for performance monitoring)
 */
export function useAdaptiveQualityMetrics(targetFPS: number = 60) {
  const quality = useAdaptiveQuality(targetFPS)
  const metricsRef = useRef({
    downgrades: 0,
    upgrades: 0,
    tierChanges: [] as Array<{ tier: QualityTier; timestamp: number }>,
  })

  const prevTierRef = useRef<QualityTier>('high')

  useFrame(() => {
    if (quality.currentTier !== prevTierRef.current) {
      if (
        (prevTierRef.current === 'high' && quality.currentTier === 'medium') ||
        (prevTierRef.current === 'high' && quality.currentTier === 'low') ||
        (prevTierRef.current === 'medium' && quality.currentTier === 'low')
      ) {
        metricsRef.current.downgrades++
      } else {
        metricsRef.current.upgrades++
      }

      metricsRef.current.tierChanges.push({
        tier: quality.currentTier,
        timestamp: performance.now(),
      })

      prevTierRef.current = quality.currentTier
    }
  })

  return {
    ...quality,
    metrics: metricsRef.current,
  }
}
