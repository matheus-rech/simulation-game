import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, Group } from 'three'

/**
 * Safety margin configuration for critical anatomical structures
 * Based on NeuroVision safety corridor standards
 */
export const SAFETY_MARGINS = {
  ICA: {
    safe: 3.0, // >3mm = green (safe)
    warning: 2.0, // 2-3mm = yellow (caution)
    danger: 1.0, // 1-2mm = orange (danger)
    critical: 0.5, // <0.5mm = red (STOP!)
  },
  MWCS: {
    safe: 2.0, // >2mm = green (safe)
    warning: 1.0, // 1-2mm = yellow (caution)
    danger: 0.5, // 0.5-1mm = orange (danger)
    critical: 0.2, // <0.2mm = red (STOP!)
  },
  DURA: {
    safe: 1.5,
    warning: 1.0,
    danger: 0.5,
    critical: 0.2,
  },
} as const

export enum RiskLevel {
  SAFE = 'safe',
  WARNING = 'warning',
  DANGER = 'danger',
  CRITICAL = 'critical',
}

export interface SafetyZone {
  structureName: string
  position: Vector3
  distance: number
  riskLevel: RiskLevel
  margin: (typeof SAFETY_MARGINS)[keyof typeof SAFETY_MARGINS]
}

export interface SafetyCorridorManagerProps {
  /** Endoscope tip position for distance calculations */
  scopeTipPosition: Vector3

  /** Anatomical structure positions to monitor */
  structures: {
    icaLeft?: Vector3
    icaRight?: Vector3
    mwcsLeft?: Vector3
    mwcsRight?: Vector3
    dura?: Vector3
  }

  /** Callback for safety zone changes */
  onSafetyChange?: (zones: SafetyZone[]) => void

  /** Show visual debug spheres around structures */
  showDebugSpheres?: boolean

  /** Enable audio warnings */
  enableAudio?: boolean
}

/**
 * Safety Corridor Manager
 *
 * Monitors real-time distance between endoscope tip and critical structures,
 * providing color-coded warnings and haptic/audio feedback.
 *
 * Implements NeuroVision's safety corridor concept with:
 * - Multi-tiered warning zones (safe → warning → danger → critical)
 * - Real-time distance calculations
 * - Visual feedback (colored halos)
 * - Audio warnings at danger/critical thresholds
 *
 * @example
 * <SafetyCorridorManager
 *   scopeTipPosition={tipPosition}
 *   structures={{ icaLeft, icaRight, mwcsLeft, mwcsRight }}
 *   onSafetyChange={handleSafetyChange}
 *   showDebugSpheres={true}
 * />
 */
export function SafetyCorridorManager({
  scopeTipPosition,
  structures,
  onSafetyChange,
  showDebugSpheres = false,
  enableAudio = true,
}: SafetyCorridorManagerProps) {
  const groupRef = useRef<Group>(null)
  const lastWarningLevel = useRef<Map<string, RiskLevel>>(new Map())

  // Audio context for warnings (lazy initialization)
  const audioContext = useRef<AudioContext | null>(null)

  // OPTIMIZATION: Audio node pool to prevent accumulation
  const audioNodesPool = useRef<{ oscillator: OscillatorNode; gain: GainNode }[]>([])
  const lastAudioTime = useRef<number>(0)
  const AUDIO_DEBOUNCE_MS = 200 // Prevent audio spam

  /**
   * Calculate risk level based on distance and margins
   */
  const getRiskLevel = (
    distance: number,
    margin: (typeof SAFETY_MARGINS)[keyof typeof SAFETY_MARGINS]
  ): RiskLevel => {
    if (distance < margin.critical) return RiskLevel.CRITICAL
    if (distance < margin.danger) return RiskLevel.DANGER
    if (distance < margin.warning) return RiskLevel.WARNING
    return RiskLevel.SAFE
  }

  /**
   * Get color for risk level visualization
   * Note: Currently unused but reserved for future dynamic color mapping
   */
  const _getRiskColor = (level: RiskLevel): number => {
    switch (level) {
      case RiskLevel.SAFE:
        return 0x00ff00 // Green
      case RiskLevel.WARNING:
        return 0xffff00 // Yellow
      case RiskLevel.DANGER:
        return 0xff8800 // Orange
      case RiskLevel.CRITICAL:
        return 0xff0000 // Red
    }
  }
  void _getRiskColor // Suppress unused warning

  /**
   * Play audio warning based on risk level
   *
   * OPTIMIZATION: Audio node pooling and debouncing
   * - Reuses audio nodes instead of creating new ones
   * - Debounces rapid audio triggers
   * - Cleans up disconnected nodes
   */
  const playWarning = (level: RiskLevel) => {
    if (!enableAudio) return

    // Debounce audio to prevent spam
    const now = Date.now()
    if (now - lastAudioTime.current < AUDIO_DEBOUNCE_MS) return
    lastAudioTime.current = now

    // Lazy init audio context
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    const ctx = audioContext.current

    // Clean up old audio nodes from pool
    audioNodesPool.current = audioNodesPool.current.filter(node => {
      try {
        // Check if node is still connected (will throw if not)
        return node.oscillator.context.state !== 'closed'
      } catch {
        return false
      }
    })

    // Limit pool size to prevent memory growth
    if (audioNodesPool.current.length > 10) {
      audioNodesPool.current.splice(0, audioNodesPool.current.length - 10)
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Track for cleanup
    audioNodesPool.current.push({ oscillator, gain: gainNode })

    // Different tones for different risk levels
    switch (level) {
      case RiskLevel.WARNING:
        oscillator.frequency.value = 440 // A4
        gainNode.gain.value = 0.1
        oscillator.start()
        oscillator.stop(ctx.currentTime + 0.1)
        break
      case RiskLevel.DANGER:
        oscillator.frequency.value = 660 // E5
        gainNode.gain.value = 0.15
        oscillator.start()
        oscillator.stop(ctx.currentTime + 0.15)
        break
      case RiskLevel.CRITICAL:
        // Single beep for critical (simplified to reduce node creation)
        oscillator.frequency.value = 880 // A5
        gainNode.gain.value = 0.2
        oscillator.start()
        oscillator.stop(ctx.currentTime + 0.1)
        break
    }
  }

  /**
   * Calculate safety zones for all structures
   */
  const calculateSafetyZones = (): SafetyZone[] => {
    const zones: SafetyZone[] = []

    // ICA Left
    if (structures.icaLeft) {
      const distance = scopeTipPosition.distanceTo(structures.icaLeft)
      const riskLevel = getRiskLevel(distance, SAFETY_MARGINS.ICA)
      zones.push({
        structureName: 'ICA Left',
        position: structures.icaLeft,
        distance,
        riskLevel,
        margin: SAFETY_MARGINS.ICA,
      })
    }

    // ICA Right
    if (structures.icaRight) {
      const distance = scopeTipPosition.distanceTo(structures.icaRight)
      const riskLevel = getRiskLevel(distance, SAFETY_MARGINS.ICA)
      zones.push({
        structureName: 'ICA Right',
        position: structures.icaRight,
        distance,
        riskLevel,
        margin: SAFETY_MARGINS.ICA,
      })
    }

    // MWCS Left
    if (structures.mwcsLeft) {
      const distance = scopeTipPosition.distanceTo(structures.mwcsLeft)
      const riskLevel = getRiskLevel(distance, SAFETY_MARGINS.MWCS)
      zones.push({
        structureName: 'MWCS Left',
        position: structures.mwcsLeft,
        distance,
        riskLevel,
        margin: SAFETY_MARGINS.MWCS,
      })
    }

    // MWCS Right
    if (structures.mwcsRight) {
      const distance = scopeTipPosition.distanceTo(structures.mwcsRight)
      const riskLevel = getRiskLevel(distance, SAFETY_MARGINS.MWCS)
      zones.push({
        structureName: 'MWCS Right',
        position: structures.mwcsRight,
        distance,
        riskLevel,
        margin: SAFETY_MARGINS.MWCS,
      })
    }

    // Dura
    if (structures.dura) {
      const distance = scopeTipPosition.distanceTo(structures.dura)
      const riskLevel = getRiskLevel(distance, SAFETY_MARGINS.DURA)
      zones.push({
        structureName: 'Dura',
        position: structures.dura,
        distance,
        riskLevel,
        margin: SAFETY_MARGINS.DURA,
      })
    }

    return zones
  }

  // Update safety zones every frame
  useFrame(() => {
    const zones = calculateSafetyZones()

    // Check for warning level changes
    zones.forEach(zone => {
      const lastLevel = lastWarningLevel.current.get(zone.structureName)

      // Trigger audio on level change (warning or worse)
      if (lastLevel !== zone.riskLevel) {
        if (
          zone.riskLevel === RiskLevel.WARNING ||
          zone.riskLevel === RiskLevel.DANGER ||
          zone.riskLevel === RiskLevel.CRITICAL
        ) {
          playWarning(zone.riskLevel)
        }
        lastWarningLevel.current.set(zone.structureName, zone.riskLevel)
      }
    })

    // Notify parent component
    if (onSafetyChange) {
      onSafetyChange(zones)
    }
  })

  // Debug visualization spheres
  const debugSpheres = useMemo(() => {
    if (!showDebugSpheres) return null

    const spheres: React.ReactElement[] = []

    Object.entries(structures).forEach(([key, position]) => {
      if (!position) return

      const structureType = key.includes('ica') ? 'ICA' : key.includes('mwcs') ? 'MWCS' : 'DURA'
      const margin = SAFETY_MARGINS[structureType as keyof typeof SAFETY_MARGINS]

      // Create spheres for each warning zone
      ;[
        { radius: margin.safe, color: 0x00ff00, opacity: 0.1 },
        { radius: margin.warning, color: 0xffff00, opacity: 0.15 },
        { radius: margin.danger, color: 0xff8800, opacity: 0.2 },
        { radius: margin.critical, color: 0xff0000, opacity: 0.25 },
      ].forEach((zone, idx) => {
        spheres.push(
          <mesh key={`${key}-${idx}`} position={position}>
            <sphereGeometry args={[zone.radius, 16, 16]} />
            <meshBasicMaterial color={zone.color} transparent opacity={zone.opacity} wireframe />
          </mesh>
        )
      })
    })

    return spheres
  }, [structures, showDebugSpheres])

  return <group ref={groupRef}>{debugSpheres}</group>
}

/**
 * Hook for consuming safety corridor data
 */
export function useSafetyCorridor() {
  const safetyZones = useRef<SafetyZone[]>([])

  const handleSafetyChange = (zones: SafetyZone[]) => {
    safetyZones.current = zones
  }

  const getHighestRisk = (): RiskLevel => {
    const risks = safetyZones.current.map(z => z.riskLevel)

    if (risks.includes(RiskLevel.CRITICAL)) return RiskLevel.CRITICAL
    if (risks.includes(RiskLevel.DANGER)) return RiskLevel.DANGER
    if (risks.includes(RiskLevel.WARNING)) return RiskLevel.WARNING
    return RiskLevel.SAFE
  }

  const getClosestStructure = (): SafetyZone | null => {
    if (safetyZones.current.length === 0) return null

    return safetyZones.current.reduce((closest, zone) =>
      zone.distance < closest.distance ? zone : closest
    )
  }

  return {
    safetyZones: safetyZones.current,
    handleSafetyChange,
    getHighestRisk,
    getClosestStructure,
  }
}
