import { useMemo } from 'react'
import { SafetyZone, RiskLevel } from '../3d/safety/SafetyCorridorManager'

/**
 * Technique Scoring Component (Phase 1B)
 *
 * Real-time 5-dimensional scoring system:
 * - Safety (30%): Proximity events, crisis avoidance
 * - Accuracy (25%): Collision count, tissue damage
 * - Technique (20%): MWCS decision-making, tumor resection method
 * - Efficiency (15%): Path optimization, movement economy
 * - Time (10%): Completion time vs. benchmarks
 *
 * Based on NeuroVision scoring methodology + Backend Architect specifications
 */

export interface TechniqueScoringProps {
  /** Current safety zones from SafetyCorridorManager */
  safetyZones: SafetyZone[]

  /** Total collision count */
  collisionCount: number

  /** Number of crisis events (ICA injury, CSF leak) */
  crisisCount: number

  /** Elapsed time in seconds */
  elapsedTime: number

  /** Current surgical level */
  level: number

  /** Compact mode for smaller display */
  compact?: boolean
}

interface ScoreBreakdown {
  safety: number
  accuracy: number
  technique: number
  efficiency: number
  time: number
  overall: number
}

/**
 * Calculate comprehensive technique score
 */
function calculateTechniqueScore(props: TechniqueScoringProps): ScoreBreakdown {
  // Safety Score (30%) - Based on proximity events and crisis avoidance
  const safetyScore = calculateSafetyScore(props.safetyZones, props.crisisCount)

  // Accuracy Score (25%) - Based on collision count (lower is better)
  const accuracyScore = calculateAccuracyScore(props.collisionCount)

  // Technique Score (20%) - Based on surgical method (to be integrated with tissue-type tracking)
  const techniqueScore = calculateTechniqueScore_method(props.level, props.collisionCount)

  // Efficiency Score (15%) - Path optimization (future: trajectory analysis)
  const efficiencyScore = calculateEfficiencyScore(props.collisionCount, props.elapsedTime)

  // Time Score (10%) - Completion time benchmarks
  const timeScore = calculateTimeScore(props.elapsedTime, props.level)

  // Weighted overall score
  const overall =
    safetyScore * 0.3 +
    accuracyScore * 0.25 +
    techniqueScore * 0.2 +
    efficiencyScore * 0.15 +
    timeScore * 0.1

  return {
    safety: safetyScore,
    accuracy: accuracyScore,
    technique: techniqueScore,
    efficiency: efficiencyScore,
    time: timeScore,
    overall: Math.round(overall),
  }
}

/**
 * Safety Score: Proximity management and crisis avoidance
 *
 * Perfect (100): All structures in SAFE zone, no crises
 * Good (80-99): Occasional WARNING zones, no crises
 * Fair (60-79): Multiple DANGER zones, no crises
 * Poor (<60): CRITICAL zones or crisis events
 */
function calculateSafetyScore(safetyZones: SafetyZone[], crisisCount: number): number {
  // Immediate penalty for crisis events
  if (crisisCount > 0) {
    return Math.max(0, 40 - crisisCount * 20) // -20 points per crisis
  }

  if (safetyZones.length === 0) return 100 // No monitoring yet

  // Calculate proximity penalty based on worst risk level
  const riskLevels = safetyZones.map(z => z.riskLevel)

  const criticalCount = riskLevels.filter(r => r === RiskLevel.CRITICAL).length
  const dangerCount = riskLevels.filter(r => r === RiskLevel.DANGER).length
  const warningCount = riskLevels.filter(r => r === RiskLevel.WARNING).length

  let score = 100

  // Penalties for proximity violations
  score -= criticalCount * 10 // -10 per CRITICAL proximity
  score -= dangerCount * 5 // -5 per DANGER proximity
  score -= warningCount * 2 // -2 per WARNING proximity

  return Math.max(0, Math.min(100, score))
}

/**
 * Accuracy Score: Tissue damage minimization
 *
 * Based on collision count (accumulated tissue contact events)
 * Benchmark: <5 collisions = excellent, 5-10 = good, 10-20 = fair, >20 = poor
 */
function calculateAccuracyScore(collisionCount: number): number {
  if (collisionCount === 0) return 100
  if (collisionCount <= 5) return 95 - collisionCount
  if (collisionCount <= 10) return 90 - (collisionCount - 5) * 3
  if (collisionCount <= 20) return 75 - (collisionCount - 10) * 2
  return Math.max(0, 55 - (collisionCount - 20))
}

/**
 * Technique Score: Surgical method and MWCS decision-making
 *
 * Currently based on level progression and collision patterns.
 * Future: Integrate tissue-type specific scoring (MUCOSA vs BONE vs DURA)
 */
function calculateTechniqueScore_method(level: number, collisionCount: number): number {
  // Base score by level completion
  let score = 60 + level * 10 // 70/80/90 for levels 1/2/3

  // Penalty for excessive collisions (indicates poor technique)
  const collisionPenalty = Math.min(30, collisionCount * 1.5)
  score -= collisionPenalty

  return Math.max(0, Math.min(100, score))
}

/**
 * Efficiency Score: Path optimization and movement economy
 *
 * Based on collision rate over time (lower rate = more efficient)
 * Future: Integrate trajectory analysis from Backend Architect Phase 2A
 */
function calculateEfficiencyScore(collisionCount: number, elapsedTime: number): number {
  if (elapsedTime === 0) return 100

  // Calculate collisions per minute
  const collisionsPerMinute = (collisionCount / elapsedTime) * 60

  if (collisionsPerMinute < 1) return 100
  if (collisionsPerMinute < 2) return 90
  if (collisionsPerMinute < 3) return 75
  if (collisionsPerMinute < 5) return 60
  return Math.max(0, 60 - (collisionsPerMinute - 5) * 10)
}

/**
 * Time Score: Completion time benchmarks
 *
 * Benchmarks (per level):
 * Level 1: <60s = excellent, 60-120s = good, >120s = fair
 * Level 2: <120s = excellent, 120-180s = good, >180s = fair
 * Level 3: <180s = excellent, 180-300s = good, >300s = fair
 */
function calculateTimeScore(elapsedTime: number, level: number): number {
  const benchmarks = {
    1: { excellent: 60, good: 120 },
    2: { excellent: 120, good: 180 },
    3: { excellent: 180, good: 300 },
  }

  const benchmark = benchmarks[level as keyof typeof benchmarks] || benchmarks[1]

  if (elapsedTime < benchmark.excellent) return 100
  if (elapsedTime < benchmark.good) {
    const ratio = (elapsedTime - benchmark.excellent) / (benchmark.good - benchmark.excellent)
    return Math.round(100 - ratio * 20) // 100 → 80
  }

  // Beyond "good" threshold
  const overtime = elapsedTime - benchmark.good
  return Math.max(0, 80 - overtime / 10) // -1 point per 10s overtime
}

/**
 * Get letter grade from numerical score
 */
function getLetterGrade(score: number): string {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 85) return 'A-'
  if (score >= 80) return 'B+'
  if (score >= 75) return 'B'
  if (score >= 70) return 'B-'
  if (score >= 65) return 'C+'
  if (score >= 60) return 'C'
  if (score >= 55) return 'C-'
  if (score >= 50) return 'D'
  return 'F'
}

/**
 * Get color for score visualization
 */
function getScoreColor(score: number): string {
  if (score >= 90) return '#00ff88' // Bright green
  if (score >= 80) return '#88ff00' // Yellow-green
  if (score >= 70) return '#ffaa00' // Orange
  if (score >= 60) return '#ff6600' // Dark orange
  return '#ff3333' // Red
}

export function TechniqueScoring({
  safetyZones,
  collisionCount,
  crisisCount,
  elapsedTime,
  level,
  compact = false,
}: TechniqueScoringProps) {
  const scores = useMemo(
    () =>
      calculateTechniqueScore({
        safetyZones,
        collisionCount,
        crisisCount,
        elapsedTime,
        level,
        compact,
      }),
    [safetyZones, collisionCount, crisisCount, elapsedTime, level, compact]
  )

  const grade = getLetterGrade(scores.overall)
  const gradeColor = getScoreColor(scores.overall)

  if (compact) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 16px',
          background: 'rgba(15, 10, 10, 0.85)',
          borderRadius: '8px',
          color: '#f7e5da',
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          border: `2px solid ${gradeColor}`,
          backdropFilter: 'blur(8px)',
          minWidth: '120px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2rem', fontWeight: 700, color: gradeColor }}>{grade}</div>
        <div style={{ fontSize: '1.2rem', opacity: 0.9 }}>{scores.overall}</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>TECHNIQUE</div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '16px',
        background: 'rgba(15, 10, 10, 0.85)',
        borderRadius: '12px',
        color: '#f7e5da',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        border: `2px solid ${gradeColor}`,
        backdropFilter: 'blur(8px)',
        minWidth: '280px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '12px',
          borderBottom: '1px solid rgba(247, 229, 218, 0.2)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9 }}>TECHNIQUE SCORE</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: gradeColor }}>{grade}</span>
            <span style={{ fontSize: '1.1rem', opacity: 0.8 }}>{scores.overall}</span>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <ScoreBar label="Safety" score={scores.safety} weight={30} />
        <ScoreBar label="Accuracy" score={scores.accuracy} weight={25} />
        <ScoreBar label="Technique" score={scores.technique} weight={20} />
        <ScoreBar label="Efficiency" score={scores.efficiency} weight={15} />
        <ScoreBar label="Time" score={scores.time} weight={10} />
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(247, 229, 218, 0.2)',
          fontSize: '0.7rem',
          opacity: 0.6,
          textAlign: 'center',
        }}
      >
        Phase 1B: Real-time Technique Assessment
      </div>
    </div>
  )
}

/**
 * Score Bar Component
 */
function ScoreBar({ label, score, weight }: { label: string; score: number; weight: number }) {
  const color = getScoreColor(score)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
      <span style={{ width: '70px', opacity: 0.8 }}>{label}</span>
      <div
        style={{
          flex: 1,
          height: '6px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: color,
            transition: 'width 0.3s ease, background 0.3s ease',
          }}
        />
      </div>
      <span style={{ width: '45px', textAlign: 'right', fontWeight: 600, color }}>{score}</span>
      <span style={{ width: '30px', opacity: 0.5, fontSize: '0.7rem' }}>{weight}%</span>
    </div>
  )
}
