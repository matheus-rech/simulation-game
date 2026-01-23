# Implementation Examples: Phase 1B & 1C

**Code Examples and Patterns for Quick Implementation**

This document provides copy-paste ready code examples for implementing the Technique Scoring System and Curriculum Mode.

---

## Phase 1B: Technique Scoring Implementation

### Example 1: Basic TechniqueScorer Usage

```typescript
// src/components/3d/scoring/TechniqueScorer.ts

import { TissueType } from '../materials/TissueMaterials';
import { Vector3D, CollisionEvent } from '../collision/types';
import { SafetyZone, RiskLevel } from '../safety/SafetyCorridorManager';

export interface TechniqueScore {
  timestamp: number;
  overall: number;
  accuracy: AccuracyScore;
  efficiency: EfficiencyScore;
  safety: SafetyScore;
  method: MethodScore;
  sessionId: string;
  level: number;
  duration: number;
}

export interface AccuracyScore {
  score: number;
  totalCollisions: number;
  criticalCollisions: number;
  nonCriticalCollisions: number;
  cleanDissectionTime: number;
  penaltyScore: number;
}

export interface EfficiencyScore {
  score: number;
  totalDistance: number;
  optimalDistance: number;
  pathEfficiency: number;
  wastedMovements: number;
  averageVelocity: number;
  timeToTarget: number;
}

export interface SafetyScore {
  score: number;
  warningEvents: number;
  dangerEvents: number;
  criticalEvents: number;
  safeTime: number;
  riskyTime: number;
  closestICAApproach: number;
  closestMWCSApproach: number;
}

export interface MethodScore {
  score: number;
  stepsCompleted: number;
  totalSteps: number;
  violations: MethodViolation[];
  systematicRating: 'excellent' | 'good' | 'acceptable' | 'poor';
}

export interface MethodViolation {
  timestamp: number;
  type: 'skipped_step' | 'incorrect_sequence' | 'premature_action' | 'missed_landmark';
  description: string;
  expectedAction: string;
  actualAction: string;
  severity: number;
}

export interface TrajectoryPoint {
  position: Vector3D;
  timestamp: number;
  velocity: Vector3D;
  level: number;
  isBacktracking: boolean;
}

export interface ScoringConfig {
  weights: {
    accuracy: number;
    efficiency: number;
    safety: number;
    method: number;
  };
  accuracy: {
    excellentMaxCollisions: number;
    goodMaxCollisions: number;
    acceptableMaxCollisions: number;
    criticalCollisionPenalty: number;
    nonCriticalCollisionPenalty: number;
  };
  efficiency: {
    excellentPathRatio: number;
    goodPathRatio: number;
    acceptablePathRatio: number;
    backtrackingPenalty: number;
    targetTime: number;
  };
  safety: {
    warningPenalty: number;
    dangerPenalty: number;
    criticalPenalty: number;
    minSafeTimeRatio: number;
  };
  method: {
    minStepsRatio: number;
    violationPenalty: number;
  };
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: {
    accuracy: 0.35,
    efficiency: 0.25,
    safety: 0.30,
    method: 0.10,
  },
  accuracy: {
    excellentMaxCollisions: 3,
    goodMaxCollisions: 8,
    acceptableMaxCollisions: 15,
    criticalCollisionPenalty: 20,
    nonCriticalCollisionPenalty: 2,
  },
  efficiency: {
    excellentPathRatio: 0.85,
    goodPathRatio: 0.70,
    acceptablePathRatio: 0.50,
    backtrackingPenalty: 5,
    targetTime: 120000,
  },
  safety: {
    warningPenalty: 2,
    dangerPenalty: 10,
    criticalPenalty: 25,
    minSafeTimeRatio: 0.80,
  },
  method: {
    minStepsRatio: 0.75,
    violationPenalty: 5,
  },
};

// Helper function to check if tissue is critical
function isCriticalTissue(tissueType: TissueType): boolean {
  return [
    TissueType.ICA,
    TissueType.MWCS,
    TissueType.DURA,
  ].includes(tissueType);
}

export class TechniqueScorer {
  private config: ScoringConfig;
  private sessionId: string;
  private level: number;
  private startTime: number;

  // Data storage
  private collisions: CollisionEvent[] = [];
  private proximityEvents: SafetyZone[] = [];
  private trajectory: TrajectoryPoint[] = [];
  private methodSteps: Map<string, boolean> = new Map();
  private violations: MethodViolation[] = [];

  // Caching
  private lastScore: TechniqueScore | null = null;
  private lastCalculationTime: number = 0;
  private readonly CACHE_DURATION = 500;

  constructor(config: ScoringConfig, sessionId: string, level: number) {
    this.config = config;
    this.sessionId = sessionId;
    this.level = level;
    this.startTime = Date.now();
  }

  /**
   * Calculate comprehensive technique score
   */
  calculateScore(): TechniqueScore {
    // Check cache
    const now = Date.now();
    if (this.lastScore && now - this.lastCalculationTime < this.CACHE_DURATION) {
      return this.lastScore;
    }

    const duration = now - this.startTime;

    // Calculate component scores
    const accuracy = this.calculateAccuracy();
    const efficiency = this.calculateEfficiency(duration);
    const safety = this.calculateSafety(duration);
    const method = this.calculateMethod();

    // Calculate weighted overall score
    const overall =
      accuracy.score * this.config.weights.accuracy +
      efficiency.score * this.config.weights.efficiency +
      safety.score * this.config.weights.safety +
      method.score * this.config.weights.method;

    const score: TechniqueScore = {
      timestamp: now,
      overall: Math.round(overall * 100) / 100,
      accuracy,
      efficiency,
      safety,
      method,
      sessionId: this.sessionId,
      level: this.level,
      duration,
    };

    // Update cache
    this.lastScore = score;
    this.lastCalculationTime = now;

    return score;
  }

  /**
   * Calculate accuracy score
   */
  private calculateAccuracy(): AccuracyScore {
    const critical = this.collisions.filter(c => isCriticalTissue(c.tissueType)).length;
    const nonCritical = this.collisions.length - critical;

    const penaltyScore =
      critical * this.config.accuracy.criticalCollisionPenalty +
      nonCritical * this.config.accuracy.nonCriticalCollisionPenalty;

    const cleanDissectionTime = 0; // TODO: Implement

    let score = 100 - penaltyScore;
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      totalCollisions: this.collisions.length,
      criticalCollisions: critical,
      nonCriticalCollisions: nonCritical,
      cleanDissectionTime,
      penaltyScore,
    };
  }

  /**
   * Calculate efficiency score
   */
  private calculateEfficiency(duration: number): EfficiencyScore {
    if (this.trajectory.length < 2) {
      return {
        score: 100,
        totalDistance: 0,
        optimalDistance: 0,
        pathEfficiency: 1.0,
        wastedMovements: 0,
        averageVelocity: 0,
        timeToTarget: 0,
      };
    }

    const totalDistance = this.calculateTotalDistance();
    const optimalDistance = this.getOptimalDistance(this.level);
    const pathEfficiency = optimalDistance > 0 ? optimalDistance / totalDistance : 1.0;
    const wastedMovements = this.trajectory.filter(p => p.isBacktracking).length;
    const averageVelocity = duration > 0 ? (totalDistance / duration) * 1000 : 0;
    const timeToTarget = duration;

    let score = 100;

    if (pathEfficiency < this.config.efficiency.excellentPathRatio) {
      const inefficiency = 1 - pathEfficiency;
      score -= inefficiency * 40;
    }

    score -= wastedMovements * this.config.efficiency.backtrackingPenalty;

    if (timeToTarget > this.config.efficiency.targetTime) {
      const overtime = timeToTarget - this.config.efficiency.targetTime;
      score -= (overtime / this.config.efficiency.targetTime) * 20;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      totalDistance,
      optimalDistance,
      pathEfficiency,
      wastedMovements,
      averageVelocity,
      timeToTarget,
    };
  }

  /**
   * Calculate safety score
   */
  private calculateSafety(duration: number): SafetyScore {
    const warningEvents = this.proximityEvents.filter(
      z => z.riskLevel === RiskLevel.WARNING
    ).length;
    const dangerEvents = this.proximityEvents.filter(
      z => z.riskLevel === RiskLevel.DANGER
    ).length;
    const criticalEvents = this.proximityEvents.filter(
      z => z.riskLevel === RiskLevel.CRITICAL
    ).length;

    const safeTime = 0; // TODO: Implement
    const riskyTime = duration - safeTime;

    const closestICA = Math.min(
      ...this.proximityEvents
        .filter(z => z.structureName.includes('ICA'))
        .map(z => z.distance),
      Infinity
    );

    const closestMWCS = Math.min(
      ...this.proximityEvents
        .filter(z => z.structureName.includes('MWCS'))
        .map(z => z.distance),
      Infinity
    );

    let score = 100;

    score -= warningEvents * this.config.safety.warningPenalty;
    score -= dangerEvents * this.config.safety.dangerPenalty;
    score -= criticalEvents * this.config.safety.criticalPenalty;

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      warningEvents,
      dangerEvents,
      criticalEvents,
      safeTime,
      riskyTime,
      closestICAApproach: closestICA === Infinity ? -1 : closestICA,
      closestMWCSApproach: closestMWCS === Infinity ? -1 : closestMWCS,
    };
  }

  /**
   * Calculate method adherence score
   */
  private calculateMethod(): MethodScore {
    const totalSteps = this.getExpectedSteps(this.level).length;
    const stepsCompleted = Array.from(this.methodSteps.values()).filter(v => v).length;

    let score = 100;

    const stepRatio = totalSteps > 0 ? stepsCompleted / totalSteps : 1.0;
    if (stepRatio < this.config.method.minStepsRatio) {
      score -= (this.config.method.minStepsRatio - stepRatio) * 50;
    }

    score -= this.violations.length * this.config.method.violationPenalty;
    score = Math.max(0, Math.min(100, score));

    let systematicRating: 'excellent' | 'good' | 'acceptable' | 'poor';
    if (stepRatio >= 0.95 && this.violations.length === 0) {
      systematicRating = 'excellent';
    } else if (stepRatio >= 0.85 && this.violations.length <= 2) {
      systematicRating = 'good';
    } else if (stepRatio >= 0.75) {
      systematicRating = 'acceptable';
    } else {
      systematicRating = 'poor';
    }

    return {
      score,
      stepsCompleted,
      totalSteps,
      violations: this.violations,
      systematicRating,
    };
  }

  /**
   * Record collision event
   */
  recordCollision(event: CollisionEvent): void {
    this.collisions.push(event);
  }

  /**
   * Record position for trajectory tracking
   */
  recordPosition(position: Vector3D, timestamp: number): void {
    const velocity = this.calculateVelocity(position, timestamp);
    const isBacktracking = this.detectBacktracking(position);

    this.trajectory.push({
      position,
      timestamp,
      velocity,
      level: this.level,
      isBacktracking,
    });

    // Keep trajectory bounded (last 1000 points)
    if (this.trajectory.length > 1000) {
      this.trajectory.shift();
    }
  }

  /**
   * Record proximity event
   */
  recordProximityEvent(zone: SafetyZone): void {
    this.proximityEvents.push(zone);
  }

  /**
   * Record method step completion
   */
  recordMethodStep(stepId: string, success: boolean): void {
    this.methodSteps.set(stepId, success);
  }

  /**
   * Reset scoring state
   */
  reset(): void {
    this.startTime = Date.now();
    this.trajectory = [];
    this.collisions = [];
    this.proximityEvents = [];
    this.methodSteps.clear();
    this.violations = [];
    this.lastScore = null;
  }

  // Helper methods

  private calculateTotalDistance(): number {
    let distance = 0;
    for (let i = 1; i < this.trajectory.length; i++) {
      const prev = this.trajectory[i - 1].position;
      const curr = this.trajectory[i].position;
      distance += Math.sqrt(
        Math.pow(curr.x - prev.x, 2) +
        Math.pow(curr.y - prev.y, 2) +
        Math.pow(curr.z - prev.z, 2)
      );
    }
    return distance;
  }

  private getOptimalDistance(level: number): number {
    const OPTIMAL_PATHS: Record<number, number> = {
      1: 5.0,
      2: 3.5,
      3: 2.0,
    };
    return OPTIMAL_PATHS[level] ?? 5.0;
  }

  private calculateVelocity(position: Vector3D, timestamp: number): Vector3D {
    if (this.trajectory.length === 0) {
      return { x: 0, y: 0, z: 0 };
    }

    const lastPoint = this.trajectory[this.trajectory.length - 1];
    const dt = timestamp - lastPoint.timestamp;

    if (dt === 0) {
      return { x: 0, y: 0, z: 0 };
    }

    return {
      x: ((position.x - lastPoint.position.x) / dt) * 1000,
      y: ((position.y - lastPoint.position.y) / dt) * 1000,
      z: ((position.z - lastPoint.position.z) / dt) * 1000,
    };
  }

  private detectBacktracking(position: Vector3D): boolean {
    if (this.trajectory.length < 3) return false;

    const targetZ = -7.5; // Pituitary position
    const prevZ = this.trajectory[this.trajectory.length - 1].position.z;
    const currZ = position.z;

    return currZ > prevZ && prevZ < targetZ;
  }

  private getExpectedSteps(level: number): string[] {
    const PROTOCOL_STEPS: Record<number, string[]> = {
      1: ['identify_sphenoid_ostium', 'visualize_septum', 'confirm_cavity_boundaries'],
      2: ['identify_sella_floor', 'locate_carotid_prominences', 'confirm_midline'],
      3: ['assess_tumor_consistency', 'identify_pseudocapsule', 'plan_debulking_strategy'],
    };
    return PROTOCOL_STEPS[level] ?? [];
  }
}
```

### Example 2: useTechniqueScoring Hook

```typescript
// src/components/3d/scoring/useTechniqueScoring.ts

import { useRef, useCallback, useEffect, useMemo } from 'react';
import { TechniqueScorer, DEFAULT_SCORING_CONFIG, TechniqueScore, ScoringConfig } from './TechniqueScorer';
import { CollisionEvent } from '../collision/types';
import { SafetyZone } from '../safety/SafetyCorridorManager';
import { Vector3D } from '../collision/types';
import { ScoringPersistence } from './ScoringPersistence';

export interface TechniqueScoringProps {
  level: number;
  sessionId?: string;
  onScoreUpdate?: (score: TechniqueScore) => void;
  config?: Partial<ScoringConfig>;
  enablePersistence?: boolean;
  updateInterval?: number;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getEmptyScore(sessionId: string, level: number): TechniqueScore {
  return {
    timestamp: Date.now(),
    overall: 0,
    accuracy: {
      score: 0,
      totalCollisions: 0,
      criticalCollisions: 0,
      nonCriticalCollisions: 0,
      cleanDissectionTime: 0,
      penaltyScore: 0,
    },
    efficiency: {
      score: 0,
      totalDistance: 0,
      optimalDistance: 0,
      pathEfficiency: 0,
      wastedMovements: 0,
      averageVelocity: 0,
      timeToTarget: 0,
    },
    safety: {
      score: 0,
      warningEvents: 0,
      dangerEvents: 0,
      criticalEvents: 0,
      safeTime: 0,
      riskyTime: 0,
      closestICAApproach: -1,
      closestMWCSApproach: -1,
    },
    method: {
      score: 0,
      stepsCompleted: 0,
      totalSteps: 0,
      violations: [],
      systematicRating: 'poor',
    },
    sessionId,
    level,
    duration: 0,
  };
}

export function useTechniqueScoring({
  level,
  sessionId = generateSessionId(),
  onScoreUpdate,
  config: customConfig,
  enablePersistence = true,
  updateInterval = 1000,
}: TechniqueScoringProps) {
  const config = useMemo(
    () => ({ ...DEFAULT_SCORING_CONFIG, ...customConfig }),
    [customConfig]
  );

  const scorerRef = useRef<TechniqueScorer | null>(null);

  useEffect(() => {
    scorerRef.current = new TechniqueScorer(config, sessionId, level);

    return () => {
      if (enablePersistence && scorerRef.current) {
        ScoringPersistence.saveScore(scorerRef.current.calculateScore());
      }
    };
  }, [sessionId, level, config, enablePersistence]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (scorerRef.current && onScoreUpdate) {
        const score = scorerRef.current.calculateScore();
        onScoreUpdate(score);

        if (enablePersistence) {
          ScoringPersistence.autosave(score);
        }
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, onScoreUpdate, enablePersistence]);

  return {
    recordCollision: useCallback((event: CollisionEvent) => {
      scorerRef.current?.recordCollision(event);
    }, []),

    recordPosition: useCallback((position: Vector3D, timestamp: number) => {
      scorerRef.current?.recordPosition(position, timestamp);
    }, []),

    recordProximityEvent: useCallback((zone: SafetyZone) => {
      scorerRef.current?.recordProximityEvent(zone);
    }, []),

    recordMethodStep: useCallback((stepId: string, success: boolean) => {
      scorerRef.current?.recordMethodStep(stepId, success);
    }, []),

    getCurrentScore: useCallback((): TechniqueScore => {
      return scorerRef.current?.calculateScore() ?? getEmptyScore(sessionId, level);
    }, [sessionId, level]),

    reset: useCallback(() => {
      scorerRef.current?.reset();
    }, []),
  };
}
```

### Example 3: ScoringPersistence

```typescript
// src/components/3d/scoring/ScoringPersistence.ts

import { TechniqueScore } from './TechniqueScorer';

export class ScoringPersistence {
  private static readonly STORAGE_KEY = 'neurosim_technique_scores';
  private static readonly AUTOSAVE_KEY = 'neurosim_autosave';
  private static readonly MAX_STORED_SCORES = 50;

  static saveScore(score: TechniqueScore): void {
    try {
      const scores = this.loadAllScores();
      scores.push(score);

      if (scores.length > this.MAX_STORED_SCORES) {
        scores.shift();
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scores));
    } catch (error) {
      console.error('Failed to save technique score:', error);
    }
  }

  static autosave(score: TechniqueScore): void {
    try {
      localStorage.setItem(this.AUTOSAVE_KEY, JSON.stringify(score));
    } catch (error) {
      console.error('Failed to autosave:', error);
    }
  }

  static loadAllScores(): TechniqueScore[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load scores:', error);
      return [];
    }
  }

  static loadAutosave(): TechniqueScore | null {
    try {
      const data = localStorage.getItem(this.AUTOSAVE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load autosave:', error);
      return null;
    }
  }

  static getBestScore(): TechniqueScore | null {
    const scores = this.loadAllScores();
    if (scores.length === 0) return null;

    return scores.reduce((best, current) =>
      current.overall > best.overall ? current : best
    );
  }

  static clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.AUTOSAVE_KEY);
  }
}
```

### Example 4: Integration with App.tsx

```typescript
// In App.tsx

import { useTechniqueScoring } from './components/3d/scoring/useTechniqueScoring';
import { TechniqueScore } from './components/3d/scoring/TechniqueScorer';
import { TechniqueScoreHUD } from './components/ui/TechniqueScoreHUD';

export default function App() {
  const [level, setLevel] = useState(1);
  const [techniqueScore, setTechniqueScore] = useState<TechniqueScore | null>(null);
  const [tipPosition, setTipPosition] = useState<Vector3D>(initialTipPosition);

  // Initialize technique scoring
  const scoring = useTechniqueScoring({
    level,
    onScoreUpdate: setTechniqueScore,
    enablePersistence: true,
  });

  // Update collision handler
  const handleRaycastCollision = useCallback((point: Vector3D, tissueType: TissueType) => {
    setLastCollision(point);
    setCollisionCount((count) => count + 1);
    setScore((prev) => Math.max(prev - 2, 0));

    // Record collision for technique scoring
    scoring.recordCollision({
      position: point,
      tissueType,
      timestamp: Date.now(),
      intensity: 1.0,
    });
  }, [scoring]);

  // Update safety corridor handler
  const handleSafetyChange = useCallback((zones: SafetyZone[]) => {
    setSafetyZones(zones);

    // Record proximity events for safety scoring
    zones.forEach(zone => {
      if (zone.riskLevel !== RiskLevel.SAFE) {
        scoring.recordProximityEvent(zone);
      }
    });
  }, [scoring]);

  // Record position for trajectory tracking
  useEffect(() => {
    const interval = setInterval(() => {
      scoring.recordPosition(tipPosition, Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, [tipPosition, scoring]);

  return (
    <div>
      {/* Existing HUD */}
      <section style={styles.overlay}>
        {/* ... existing stats ... */}
      </section>

      {/* NEW: Technique Score Display */}
      {techniqueScore && (
        <TechniqueScoreHUD score={techniqueScore} />
      )}

      {/* Existing components */}
      <EndoscopeView
        level={level}
        onRaycastCollision={handleRaycastCollision}
        onSafetyChange={handleSafetyChange}
        // ...
      />
    </div>
  );
}
```

### Example 5: TechniqueScoreHUD Component

```typescript
// src/components/ui/TechniqueScoreHUD.tsx

import React, { useState } from 'react';
import { TechniqueScore } from '../3d/scoring/TechniqueScorer';

export interface TechniqueScoreHUDProps {
  score: TechniqueScore;
  expanded?: boolean;
}

const styles = {
  scoreHUD: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    padding: 20,
    background: 'rgba(15, 10, 10, 0.85)',
    borderRadius: 12,
    color: '#f7e5da',
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    zIndex: 10,
    border: '1px solid rgba(247, 229, 218, 0.15)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    minWidth: 280,
  },
  overallScore: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(247, 229, 218, 0.2)',
  },
  scoreLabel: {
    fontSize: '1rem',
    fontWeight: 500,
    opacity: 0.9,
  },
  scoreValue: {
    fontSize: '2rem',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  expandButton: {
    width: '100%',
    padding: '8px 12px',
    background: 'rgba(247, 229, 218, 0.08)',
    border: '1px solid rgba(247, 229, 218, 0.3)',
    borderRadius: 6,
    color: '#f7e5da',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  breakdown: {
    marginTop: 16,
  },
  scoreBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  barContainer: {
    flex: 1,
    height: 8,
    background: 'rgba(247, 229, 218, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  details: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid rgba(247, 229, 218, 0.1)',
    fontSize: '0.85rem',
  },
};

function getScoreColor(value: number): string {
  if (value >= 85) return '#00ff00';
  if (value >= 70) return '#ffff00';
  if (value >= 50) return '#ff8800';
  return '#ff0000';
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.scoreBar}>
      <span style={{ minWidth: 80 }}>{label}</span>
      <div style={styles.barContainer}>
        <div
          style={{
            ...styles.barFill,
            width: `${value}%`,
            backgroundColor: getScoreColor(value),
          }}
        />
      </div>
      <span style={{ minWidth: 35, textAlign: 'right' }}>{value.toFixed(0)}</span>
    </div>
  );
}

export function TechniqueScoreHUD({ score, expanded = false }: TechniqueScoreHUDProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  return (
    <div style={styles.scoreHUD}>
      <div style={styles.overallScore}>
        <span style={styles.scoreLabel}>Technique Score</span>
        <span
          style={{
            ...styles.scoreValue,
            color: getScoreColor(score.overall),
          }}
        >
          {score.overall.toFixed(1)}
        </span>
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={styles.expandButton}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(247, 229, 218, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(247, 229, 218, 0.08)';
        }}
      >
        {isExpanded ? 'Collapse' : 'View Details'}
      </button>

      {isExpanded && (
        <div style={styles.breakdown}>
          <ScoreBar label="Accuracy" value={score.accuracy.score} />
          <ScoreBar label="Efficiency" value={score.efficiency.score} />
          <ScoreBar label="Safety" value={score.safety.score} />
          <ScoreBar label="Method" value={score.method.score} />

          <div style={styles.details}>
            <p style={{ margin: '4px 0' }}>
              Collisions: {score.accuracy.totalCollisions} ({score.accuracy.criticalCollisions} critical)
            </p>
            <p style={{ margin: '4px 0' }}>
              Path Efficiency: {(score.efficiency.pathEfficiency * 100).toFixed(1)}%
            </p>
            <p style={{ margin: '4px 0' }}>
              Proximity Warnings: {score.safety.warningEvents}
            </p>
            <p style={{ margin: '4px 0' }}>
              Protocol Steps: {score.method.stepsCompleted}/{score.method.totalSteps}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Phase 1C: Curriculum Implementation

### Example 6: Curriculum Module Definitions

```typescript
// src/components/curriculum/modules.ts

import { CurriculumModule, SuccessCriteria } from './types';

export const CURRICULUM_MODULES: CurriculumModule[] = [
  {
    id: 'module_1_anatomical_recognition',
    name: 'Module 1: Anatomical Recognition',
    description: 'Identify key anatomical landmarks in the sphenoid sinus',
    level: 1,
    objectives: [
      {
        id: 'obj_1_1',
        description: 'Identify sphenoid ostium',
        type: 'knowledge',
        assessment: 'observation',
        required: true,
      },
      {
        id: 'obj_1_2',
        description: 'Visualize sphenoid septations',
        type: 'knowledge',
        assessment: 'observation',
        required: true,
      },
      {
        id: 'obj_1_3',
        description: 'Confirm cavity boundaries',
        type: 'skill',
        assessment: 'score',
        required: true,
      },
    ],
    successCriteria: {
      minScore: 75,
      maxCollisions: 10,
      maxCriticalCollisions: 0,
      minSafetyScore: 80,
      requiredMethodCompletion: 1.0,
    },
    prerequisites: [],
    estimatedDuration: 10,
    instructions: {
      briefing:
        'In this module, you will learn to identify key anatomical landmarks in the sphenoid sinus.',
      steps: [
        '1. Enter the nasal cavity and locate the sphenoid ostium',
        '2. Advance through the ostium into the sphenoid sinus',
        '3. Visualize the septations dividing the sinus cavity',
        '4. Identify the mucosa (pink tissue) lining the sinus walls',
        '5. Recognize the bone (white) underlying the mucosa',
      ],
      tips: [
        'Move slowly - this module emphasizes accuracy over speed',
        'Use small movements to explore the cavity',
      ],
      commonMistakes: [
        'Colliding with septations during initial entry',
        'Advancing too quickly without surveying the space',
      ],
    },
    assessmentType: 'simulation',
  },
  // ... more modules
];

export function checkSuccessCriteria(
  score: TechniqueScore,
  criteria: SuccessCriteria
): boolean {
  if (score.overall < criteria.minScore) return false;
  if (score.accuracy.totalCollisions > criteria.maxCollisions) return false;
  if (score.accuracy.criticalCollisions > criteria.maxCriticalCollisions) return false;
  if (criteria.minSafetyScore && score.safety.score < criteria.minSafetyScore) return false;
  if (criteria.customValidation && !criteria.customValidation(score)) return false;

  return true;
}
```

### Example 7: useCurriculum Hook

```typescript
// src/components/curriculum/useCurriculum.ts

import { useState, useCallback, useMemo, useEffect } from 'react';
import { TechniqueScore } from '../3d/scoring/TechniqueScorer';
import { CURRICULUM_MODULES, checkSuccessCriteria } from './modules';
import { CurriculumPersistence } from './CurriculumPersistence';
import {
  CurriculumProgress,
  CurriculumState,
  ModuleAttempt,
  ModuleCompletion,
} from './types';

export interface CurriculumProps {
  userId: string;
  level: number;
  techniqueScore: TechniqueScore | null;
  onStateChange?: (state: CurriculumState) => void;
}

export function useCurriculum({
  userId,
  level,
  techniqueScore,
  onStateChange,
}: CurriculumProps) {
  const [progress, setProgress] = useState<CurriculumProgress>(() =>
    CurriculumPersistence.loadProgress(userId)
  );

  const [state, setState] = useState<CurriculumState>(
    progress.currentModuleId ? CurriculumState.BRIEFING : CurriculumState.NOT_ENROLLED
  );

  const currentModule = useMemo(() => {
    if (!progress.currentModuleId) return null;
    return CURRICULUM_MODULES.find(m => m.id === progress.currentModuleId) ?? null;
  }, [progress.currentModuleId]);

  const enroll = useCallback(() => {
    const firstModule = CURRICULUM_MODULES[0];

    const newProgress: CurriculumProgress = {
      userId,
      currentModuleId: firstModule.id,
      completedModules: [],
      currentAttempt: null,
      overallProgress: 0,
      certified: false,
    };

    setProgress(newProgress);
    setState(CurriculumState.BRIEFING);
    if (onStateChange) onStateChange(CurriculumState.BRIEFING);
  }, [userId, onStateChange]);

  const startSimulation = useCallback(() => {
    if (!currentModule) return;

    const attempt: ModuleAttempt = {
      moduleId: currentModule.id,
      attemptNumber: (progress.currentAttempt?.attemptNumber ?? 0) + 1,
      startTime: Date.now(),
      currentScore: null,
      objectivesCompleted: [],
      paused: false,
    };

    setProgress(prev => ({ ...prev, currentAttempt: attempt }));
    setState(CurriculumState.SIMULATING);
    if (onStateChange) onStateChange(CurriculumState.SIMULATING);
  }, [currentModule, progress, onStateChange]);

  const completeSimulation = useCallback(() => {
    if (!currentModule || !techniqueScore) return;
    setState(CurriculumState.REVIEW);
    if (onStateChange) onStateChange(CurriculumState.REVIEW);
  }, [currentModule, techniqueScore, onStateChange]);

  const evaluateAttempt = useCallback(() => {
    if (!currentModule || !techniqueScore) return;

    const passed = checkSuccessCriteria(techniqueScore, currentModule.successCriteria);

    if (passed) {
      const completion: ModuleCompletion = {
        moduleId: currentModule.id,
        completedAt: Date.now(),
        bestScore: techniqueScore,
        attempts: progress.currentAttempt?.attemptNumber ?? 1,
        timeSpent: Date.now() - (progress.currentAttempt?.startTime ?? Date.now()),
      };

      setProgress(prev => ({
        ...prev,
        completedModules: [...prev.completedModules, completion],
        currentAttempt: null,
        overallProgress: (prev.completedModules.length + 1) / CURRICULUM_MODULES.length,
      }));

      setState(CurriculumState.PASSED);
      if (onStateChange) onStateChange(CurriculumState.PASSED);
    } else {
      setState(CurriculumState.FAILED);
      if (onStateChange) onStateChange(CurriculumState.FAILED);
    }
  }, [currentModule, techniqueScore, progress, onStateChange]);

  const retry = useCallback(() => {
    setState(CurriculumState.BRIEFING);
    if (onStateChange) onStateChange(CurriculumState.BRIEFING);
  }, [onStateChange]);

  const nextModule = useCallback(() => {
    const currentIndex = CURRICULUM_MODULES.findIndex(m => m.id === currentModule?.id);

    if (currentIndex < CURRICULUM_MODULES.length - 1) {
      const next = CURRICULUM_MODULES[currentIndex + 1];
      setProgress(prev => ({ ...prev, currentModuleId: next.id }));
      setState(CurriculumState.BRIEFING);
      if (onStateChange) onStateChange(CurriculumState.BRIEFING);
    }
  }, [currentModule, onStateChange]);

  useEffect(() => {
    CurriculumPersistence.saveProgress(progress);
  }, [progress]);

  return {
    state,
    progress,
    currentModule,
    enroll,
    startSimulation,
    completeSimulation,
    evaluateAttempt,
    retry,
    nextModule,
  };
}
```

---

## Testing Examples

### Example 8: Unit Test for TechniqueScorer

```typescript
// src/components/3d/scoring/__tests__/TechniqueScorer.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { TechniqueScorer, DEFAULT_SCORING_CONFIG } from '../TechniqueScorer';
import { TissueType } from '../../materials/TissueMaterials';

describe('TechniqueScorer', () => {
  let scorer: TechniqueScorer;

  beforeEach(() => {
    scorer = new TechniqueScorer(DEFAULT_SCORING_CONFIG, 'test-session', 1);
  });

  describe('Accuracy Scoring', () => {
    it('should start with perfect score', () => {
      const score = scorer.calculateScore();
      expect(score.accuracy.score).toBe(100);
      expect(score.accuracy.totalCollisions).toBe(0);
    });

    it('should penalize critical collisions more than non-critical', () => {
      scorer.recordCollision({
        position: { x: 0, y: 0, z: 0 },
        tissueType: TissueType.ICA,
        timestamp: Date.now(),
        intensity: 1.0,
      });

      const criticalScore = scorer.calculateScore().accuracy.score;

      scorer.reset();

      scorer.recordCollision({
        position: { x: 0, y: 0, z: 0 },
        tissueType: TissueType.MUCOSA,
        timestamp: Date.now(),
        intensity: 1.0,
      });

      const nonCriticalScore = scorer.calculateScore().accuracy.score;

      expect(criticalScore).toBeLessThan(nonCriticalScore);
    });

    it('should track collision counts correctly', () => {
      scorer.recordCollision({
        position: { x: 0, y: 0, z: 0 },
        tissueType: TissueType.ICA,
        timestamp: Date.now(),
        intensity: 1.0,
      });

      scorer.recordCollision({
        position: { x: 1, y: 1, z: 1 },
        tissueType: TissueType.BONE,
        timestamp: Date.now(),
        intensity: 1.0,
      });

      const score = scorer.calculateScore();
      expect(score.accuracy.totalCollisions).toBe(2);
      expect(score.accuracy.criticalCollisions).toBe(1);
      expect(score.accuracy.nonCriticalCollisions).toBe(1);
    });
  });

  describe('Efficiency Scoring', () => {
    it('should start with perfect efficiency', () => {
      const score = scorer.calculateScore();
      expect(score.efficiency.score).toBe(100);
    });

    it('should track trajectory distance', () => {
      scorer.recordPosition({ x: 0, y: 0, z: 0 }, 1000);
      scorer.recordPosition({ x: 1, y: 0, z: 0 }, 2000);
      scorer.recordPosition({ x: 1, y: 1, z: 0 }, 3000);

      const score = scorer.calculateScore();
      expect(score.efficiency.totalDistance).toBeGreaterThan(0);
    });
  });

  describe('Overall Score', () => {
    it('should calculate weighted average', () => {
      // Perfect scores should give 100 overall
      const score = scorer.calculateScore();
      expect(score.overall).toBe(100);
    });

    it('should use configured weights', () => {
      const score = scorer.calculateScore();

      // Overall should be weighted average of components
      const expected =
        score.accuracy.score * 0.35 +
        score.efficiency.score * 0.25 +
        score.safety.score * 0.30 +
        score.method.score * 0.10;

      expect(score.overall).toBeCloseTo(expected, 1);
    });
  });
});
```

---

## Performance Monitoring

### Example 9: Performance Metrics

```typescript
// src/components/3d/scoring/PerformanceMetrics.ts

export class ScoringPerformanceMetrics {
  private static metrics = {
    scoreCalculationTime: 0,
    trajectoryUpdateTime: 0,
    persistenceTime: 0,
    collisionRecordTime: 0,
    proximityRecordTime: 0,
    totalOverhead: 0,
    sampleCount: 0,
  };

  static startMeasure(operation: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;

      switch (operation) {
        case 'scoreCalculation':
          this.metrics.scoreCalculationTime = duration;
          break;
        case 'trajectoryUpdate':
          this.metrics.trajectoryUpdateTime = duration;
          break;
        case 'persistence':
          this.metrics.persistenceTime = duration;
          break;
        case 'collisionRecord':
          this.metrics.collisionRecordTime = duration;
          break;
        case 'proximityRecord':
          this.metrics.proximityRecordTime = duration;
          break;
      }

      this.metrics.totalOverhead =
        this.metrics.scoreCalculationTime +
        this.metrics.trajectoryUpdateTime +
        this.metrics.persistenceTime;

      this.metrics.sampleCount++;
    };
  }

  static getMetrics() {
    return { ...this.metrics };
  }

  static logMetrics() {
    console.table(this.metrics);

    if (this.metrics.scoreCalculationTime > 10) {
      console.warn('⚠️ Score calculation exceeds 10ms threshold');
    }

    if (this.metrics.totalOverhead > 16) {
      console.warn('⚠️ Total overhead exceeds 16ms (risk of frame drops)');
    }
  }

  static reset() {
    this.metrics = {
      scoreCalculationTime: 0,
      trajectoryUpdateTime: 0,
      persistenceTime: 0,
      collisionRecordTime: 0,
      proximityRecordTime: 0,
      totalOverhead: 0,
      sampleCount: 0,
    };
  }
}

// Usage in TechniqueScorer
calculateScore(): TechniqueScore {
  const endMeasure = ScoringPerformanceMetrics.startMeasure('scoreCalculation');

  // ... calculation logic ...

  endMeasure();
  return score;
}
```

---

## Common Patterns

### Pattern 1: Debounced Event Recording

```typescript
// Prevent spam from rapid events
class DebouncedRecorder {
  private lastEventTime = 0;
  private readonly DEBOUNCE_MS = 250;

  record(event: any, callback: (event: any) => void): void {
    const now = Date.now();

    if (now - this.lastEventTime < this.DEBOUNCE_MS) {
      return; // Skip this event
    }

    this.lastEventTime = now;
    callback(event);
  }
}
```

### Pattern 2: Ring Buffer for Trajectory

```typescript
// Fixed-size circular buffer
class RingBuffer<T> {
  private buffer: T[];
  private capacity: number;
  private writeIndex: number = 0;
  private count: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.writeIndex] = item;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    this.count = Math.min(this.count + 1, this.capacity);
  }

  toArray(): T[] {
    if (this.count < this.capacity) {
      return this.buffer.slice(0, this.count);
    }

    return [
      ...this.buffer.slice(this.writeIndex),
      ...this.buffer.slice(0, this.writeIndex),
    ];
  }

  size(): number {
    return this.count;
  }

  clear(): void {
    this.writeIndex = 0;
    this.count = 0;
    this.buffer = new Array(this.capacity);
  }
}
```

### Pattern 3: Cached Calculations

```typescript
// Avoid redundant calculations
class CachedScorer {
  private lastScore: TechniqueScore | null = null;
  private lastCalculationTime: number = 0;
  private readonly CACHE_DURATION = 500; // ms

  calculateScore(): TechniqueScore {
    const now = Date.now();

    if (this.lastScore && now - this.lastCalculationTime < this.CACHE_DURATION) {
      return this.lastScore; // Return cached result
    }

    const score = this.performCalculation();

    this.lastScore = score;
    this.lastCalculationTime = now;

    return score;
  }

  private performCalculation(): TechniqueScore {
    // ... expensive calculation ...
  }
}
```

---

## Next Steps

1. Copy these examples to your project
2. Install any missing type definitions
3. Run TypeScript compiler to catch errors
4. Write tests for each component
5. Integrate with existing codebase

**Need help?** Refer to:
- `ARCHITECTURE_PHASE1BC.md` for detailed specification
- `ARCHITECTURE_DIAGRAMS.md` for visual architecture
- `ARCHITECTURE_SUMMARY.md` for quick reference

---

**Document Version**: 1.0
**Last Updated**: 2026-01-22
