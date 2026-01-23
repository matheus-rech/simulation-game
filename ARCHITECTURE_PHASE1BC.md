# Architecture Design: Phase 1B & 1C

**Document Version**: 1.0
**Date**: 2026-01-22
**Target**: NeuroSim Medical Training Simulator

---

## Executive Summary

This document defines the architecture for **Phase 1B (Technique Scoring System)** and **Phase 1C (Curriculum Mode)** of the NeuroSim training simulator. The design follows React best practices, maintains the existing three-tier architecture, and prepares for Phase 2/3 AI integration.

### Key Design Principles

1. **Separation of Concerns**: Scoring logic isolated from rendering and simulation layers
2. **Testability**: All new systems have dedicated test coverage
3. **Performance**: Target maintained at 60 FPS with <10ms scoring overhead
4. **Extensibility**: Designed for future AI integration and multi-user scenarios
5. **Type Safety**: Full TypeScript coverage with strict mode

---

## Phase 1B: Technique Scoring System

### 1. Architecture Overview

The scoring system operates as a **cross-cutting concern** that observes simulation state without blocking the render loop.

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │  Game State      │  │  Scoring State                 │  │
│  │  - level         │  │  - techniqueScore              │  │
│  │  - score         │  │  - accuracyMetrics             │  │
│  │  - collisions    │  │  - efficiencyMetrics           │  │
│  └──────────────────┘  │  - safetyMetrics               │  │
│                        │  - methodMetrics               │  │
│                        └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              useTechniqueScoring Hook                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Scoring Engine (TechniqueScorer)                   │   │
│  │  - Real-time metric calculation                     │   │
│  │  - Trajectory history tracking (ring buffer)        │   │
│  │  - Efficiency analysis (path optimization)          │   │
│  │  - Safety proximity tracking                        │   │
│  │  - Method protocol validation                       │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Persistence Layer (ScoringPersistence)             │   │
│  │  - localStorage for local sessions                  │   │
│  │  - JSON serialization/deserialization               │   │
│  │  - Future: Backend API adapter                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│           Integration with Existing Systems                  │
│  ┌─────────────────┐  ┌──────────────────────────────┐    │
│  │ CollisionMgr    │  │ SafetyCorridorMgr            │    │
│  │ - Provides      │  │ - Provides                   │    │
│  │   collision     │  │   proximity                  │    │
│  │   events        │  │   events                     │    │
│  └─────────────────┘  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2. Data Structures

#### 2.1 Technique Score Model

```typescript
/**
 * Comprehensive technique scoring metrics
 * Aligned with NeuroVision standards
 */
export interface TechniqueScore {
  /** Timestamp of score calculation */
  timestamp: number;

  /** Overall composite score (0-100) */
  overall: number;

  /** Component scores */
  accuracy: AccuracyScore;
  efficiency: EfficiencyScore;
  safety: SafetyScore;
  method: MethodScore;

  /** Session metadata */
  sessionId: string;
  level: number;
  duration: number; // milliseconds
}

/**
 * Accuracy metrics - based on collision quality
 */
export interface AccuracyScore {
  /** Accuracy score (0-100) */
  score: number;

  /** Total collision count */
  totalCollisions: number;

  /** Critical collisions (ICA, MWCS, Dura) */
  criticalCollisions: number;

  /** Non-critical collisions (Mucosa, Bone) */
  nonCriticalCollisions: number;

  /** Collision-free duration (ms) */
  cleanDissectionTime: number;

  /** Weighted penalty accumulation */
  penaltyScore: number;
}

/**
 * Efficiency metrics - based on trajectory optimization
 */
export interface EfficiencyScore {
  /** Efficiency score (0-100) */
  score: number;

  /** Total trajectory length traveled (mm) */
  totalDistance: number;

  /** Optimal path length (theoretical minimum) */
  optimalDistance: number;

  /** Path efficiency ratio (optimal / actual) */
  pathEfficiency: number;

  /** Number of unnecessary movements (backtracking) */
  wastedMovements: number;

  /** Average velocity (mm/s) */
  averageVelocity: number;

  /** Time to target (ms) */
  timeToTarget: number;
}

/**
 * Safety metrics - based on proximity to critical structures
 */
export interface SafetyScore {
  /** Safety score (0-100) */
  score: number;

  /** Total proximity warnings triggered */
  warningEvents: number;

  /** Danger zone entries */
  dangerEvents: number;

  /** Critical zone entries (STOP!) */
  criticalEvents: number;

  /** Time spent in safe zone (ms) */
  safeTime: number;

  /** Time spent in warning/danger zones (ms) */
  riskyTime: number;

  /** Closest approach to ICA (mm) */
  closestICAApproach: number;

  /** Closest approach to MWCS (mm) */
  closestMWCSApproach: number;
}

/**
 * Method adherence - protocol-based validation
 */
export interface MethodScore {
  /** Method score (0-100) */
  score: number;

  /** Protocol steps completed correctly */
  stepsCompleted: number;

  /** Total steps required */
  totalSteps: number;

  /** Protocol violations */
  violations: MethodViolation[];

  /** Systematic approach rating */
  systematicRating: 'excellent' | 'good' | 'acceptable' | 'poor';
}

/**
 * Protocol violation event
 */
export interface MethodViolation {
  /** When violation occurred */
  timestamp: number;

  /** Type of violation */
  type: 'skipped_step' | 'incorrect_sequence' | 'premature_action' | 'missed_landmark';

  /** Description of violation */
  description: string;

  /** Expected action */
  expectedAction: string;

  /** Actual action */
  actualAction: string;

  /** Severity (0-10) */
  severity: number;
}

/**
 * Trajectory history point (for efficiency calculation)
 */
export interface TrajectoryPoint {
  /** 3D position */
  position: Vector3D;

  /** Timestamp */
  timestamp: number;

  /** Velocity vector (mm/s) */
  velocity: Vector3D;

  /** Current level (surgical depth) */
  level: number;

  /** Is this point considered "wasted movement"? */
  isBacktracking: boolean;
}
```

#### 2.2 Scoring Configuration

```typescript
/**
 * Configurable scoring weights and thresholds
 */
export interface ScoringConfig {
  /** Component weights (must sum to 1.0) */
  weights: {
    accuracy: number;    // Default: 0.35
    efficiency: number;  // Default: 0.25
    safety: number;      // Default: 0.30
    method: number;      // Default: 0.10
  };

  /** Accuracy thresholds */
  accuracy: {
    excellentMaxCollisions: number;  // Default: 3
    goodMaxCollisions: number;       // Default: 8
    acceptableMaxCollisions: number; // Default: 15
    criticalCollisionPenalty: number; // Default: 20 points
    nonCriticalCollisionPenalty: number; // Default: 2 points
  };

  /** Efficiency thresholds */
  efficiency: {
    excellentPathRatio: number;  // Default: 0.85 (85% optimal)
    goodPathRatio: number;       // Default: 0.70
    acceptablePathRatio: number; // Default: 0.50
    backtrackingPenalty: number; // Default: 5 points per incident
    targetTime: number;          // Default: 120000ms (2 min)
  };

  /** Safety thresholds */
  safety: {
    warningPenalty: number;   // Default: 2 points
    dangerPenalty: number;    // Default: 10 points
    criticalPenalty: number;  // Default: 25 points
    minSafeTimeRatio: number; // Default: 0.80 (80% in safe zone)
  };

  /** Method thresholds */
  method: {
    minStepsRatio: number; // Default: 0.75 (75% steps completed)
    violationPenalty: number; // Default: 5 points per violation
  };
}

/** Default scoring configuration */
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
```

### 3. Component Architecture

#### 3.1 useTechniqueScoring Hook

```typescript
/**
 * Primary scoring system hook
 *
 * Usage in App.tsx:
 * const scoring = useTechniqueScoring({
 *   level,
 *   onScoreUpdate: handleScoreUpdate,
 *   config: customConfig,
 * });
 *
 * // In collision handler:
 * scoring.recordCollision(event);
 *
 * // In trajectory update:
 * scoring.recordPosition(tipPosition, timestamp);
 *
 * // In safety corridor:
 * scoring.recordProximityEvent(event);
 */
export interface TechniqueScoringProps {
  /** Current surgical level */
  level: number;

  /** Session identifier */
  sessionId?: string;

  /** Callback for score updates */
  onScoreUpdate?: (score: TechniqueScore) => void;

  /** Custom scoring configuration */
  config?: Partial<ScoringConfig>;

  /** Enable automatic persistence */
  enablePersistence?: boolean;

  /** Scoring calculation frequency (ms) */
  updateInterval?: number; // Default: 1000ms
}

export function useTechniqueScoring({
  level,
  sessionId = generateSessionId(),
  onScoreUpdate,
  config: customConfig,
  enablePersistence = true,
  updateInterval = 1000,
}: TechniqueScoringProps) {
  // Merge custom config with defaults
  const config = useMemo(
    () => ({ ...DEFAULT_SCORING_CONFIG, ...customConfig }),
    [customConfig]
  );

  // Core scoring engine (singleton per session)
  const scorerRef = useRef<TechniqueScorer | null>(null);

  // Initialize scorer
  useEffect(() => {
    scorerRef.current = new TechniqueScorer(config, sessionId, level);

    return () => {
      // Cleanup: persist final score
      if (enablePersistence && scorerRef.current) {
        ScoringPersistence.saveScore(scorerRef.current.getFinalScore());
      }
    };
  }, [sessionId, level, config, enablePersistence]);

  // Periodic score calculation (avoid blocking render)
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

  // Public API
  return {
    /** Record collision event */
    recordCollision: useCallback((event: CollisionEvent) => {
      scorerRef.current?.recordCollision(event);
    }, []),

    /** Record position for trajectory tracking */
    recordPosition: useCallback((position: Vector3D, timestamp: number) => {
      scorerRef.current?.recordPosition(position, timestamp);
    }, []),

    /** Record proximity event from safety corridor */
    recordProximityEvent: useCallback((zone: SafetyZone) => {
      scorerRef.current?.recordProximityEvent(zone);
    }, []),

    /** Record method step completion */
    recordMethodStep: useCallback((stepId: string, success: boolean) => {
      scorerRef.current?.recordMethodStep(stepId, success);
    }, []),

    /** Get current score (synchronous) */
    getCurrentScore: useCallback((): TechniqueScore => {
      return scorerRef.current?.calculateScore() ?? getEmptyScore(sessionId, level);
    }, [sessionId, level]),

    /** Reset scoring for new session */
    reset: useCallback(() => {
      scorerRef.current?.reset();
    }, []),

    /** Get trajectory history for visualization */
    getTrajectoryHistory: useCallback((): TrajectoryPoint[] => {
      return scorerRef.current?.getTrajectory() ?? [];
    }, []),
  };
}
```

#### 3.2 TechniqueScorer Class

```typescript
/**
 * Core scoring calculation engine
 * Isolated class for testability and performance
 */
export class TechniqueScorer {
  private config: ScoringConfig;
  private sessionId: string;
  private level: number;
  private startTime: number;

  // Trajectory tracking (ring buffer for memory efficiency)
  private trajectory: RingBuffer<TrajectoryPoint>;
  private readonly MAX_TRAJECTORY_POINTS = 1000;

  // Collision tracking
  private collisions: CollisionEvent[] = [];

  // Proximity tracking
  private proximityEvents: SafetyZone[] = [];

  // Method tracking
  private methodSteps: Map<string, boolean> = new Map();
  private violations: MethodViolation[] = [];

  // Cached calculations
  private lastScore: TechniqueScore | null = null;
  private lastCalculationTime: number = 0;
  private readonly CACHE_DURATION = 500; // ms

  constructor(config: ScoringConfig, sessionId: string, level: number) {
    this.config = config;
    this.sessionId = sessionId;
    this.level = level;
    this.startTime = Date.now();
    this.trajectory = new RingBuffer<TrajectoryPoint>(this.MAX_TRAJECTORY_POINTS);
  }

  /**
   * Calculate comprehensive technique score
   */
  calculateScore(): TechniqueScore {
    // Check cache
    const now = Date.now();
    if (
      this.lastScore &&
      now - this.lastCalculationTime < this.CACHE_DURATION
    ) {
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
   * Calculate accuracy score based on collisions
   */
  private calculateAccuracy(): AccuracyScore {
    const critical = this.collisions.filter(c =>
      isCriticalTissue(c.tissueType)
    ).length;

    const nonCritical = this.collisions.length - critical;

    // Calculate penalty
    const penaltyScore =
      critical * this.config.accuracy.criticalCollisionPenalty +
      nonCritical * this.config.accuracy.nonCriticalCollisionPenalty;

    // Calculate collision-free time
    const cleanDissectionTime = this.calculateCleanDissectionTime();

    // Score calculation: start at 100, subtract penalties
    let score = 100 - penaltyScore;

    // Bonus for clean dissection time (up to +10 points)
    const cleanBonus = Math.min(
      10,
      (cleanDissectionTime / (Date.now() - this.startTime)) * 10
    );
    score += cleanBonus;

    // Clamp to [0, 100]
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
   * Calculate efficiency score based on trajectory
   */
  private calculateEfficiency(duration: number): EfficiencyScore {
    if (this.trajectory.size() < 2) {
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

    // Calculate total distance traveled
    const totalDistance = this.calculateTotalDistance();

    // Calculate optimal path (level-based waypoints)
    const optimalDistance = this.calculateOptimalDistance();

    // Path efficiency ratio
    const pathEfficiency =
      optimalDistance > 0 ? optimalDistance / totalDistance : 1.0;

    // Count backtracking (wasted movements)
    const wastedMovements = this.trajectory
      .toArray()
      .filter(p => p.isBacktracking).length;

    // Average velocity
    const averageVelocity =
      duration > 0 ? (totalDistance / duration) * 1000 : 0; // mm/s

    // Time to target (first time reaching level 3)
    const timeToTarget = this.calculateTimeToTarget();

    // Score calculation
    let score = 100;

    // Penalty for inefficient path
    if (pathEfficiency < this.config.efficiency.excellentPathRatio) {
      const inefficiency = 1 - pathEfficiency;
      score -= inefficiency * 40; // Up to -40 points
    }

    // Penalty for wasted movements
    score -= wastedMovements * this.config.efficiency.backtrackingPenalty;

    // Penalty for slow completion
    if (timeToTarget > this.config.efficiency.targetTime) {
      const overtime = timeToTarget - this.config.efficiency.targetTime;
      score -= (overtime / this.config.efficiency.targetTime) * 20; // Up to -20 points
    }

    // Clamp to [0, 100]
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
   * Calculate safety score based on proximity events
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

    // Calculate time in safe zone
    const safeTime = this.calculateSafeTime();
    const riskyTime = duration - safeTime;

    // Find closest approaches
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

    // Score calculation
    let score = 100;

    score -= warningEvents * this.config.safety.warningPenalty;
    score -= dangerEvents * this.config.safety.dangerPenalty;
    score -= criticalEvents * this.config.safety.criticalPenalty;

    // Penalty for excessive risky time
    const safeTimeRatio = duration > 0 ? safeTime / duration : 1.0;
    if (safeTimeRatio < this.config.safety.minSafeTimeRatio) {
      score -= (this.config.safety.minSafeTimeRatio - safeTimeRatio) * 50;
    }

    // Clamp to [0, 100]
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
    const stepsCompleted = Array.from(this.methodSteps.values()).filter(
      v => v
    ).length;

    // Score calculation
    let score = 100;

    // Penalty for incomplete steps
    const stepRatio = totalSteps > 0 ? stepsCompleted / totalSteps : 1.0;
    if (stepRatio < this.config.method.minStepsRatio) {
      score -= (this.config.method.minStepsRatio - stepRatio) * 50;
    }

    // Penalty for violations
    score -= this.violations.length * this.config.method.violationPenalty;

    // Clamp to [0, 100]
    score = Math.max(0, Math.min(100, score));

    // Determine systematic rating
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
    this.trajectory.clear();
    this.collisions = [];
    this.proximityEvents = [];
    this.methodSteps.clear();
    this.violations = [];
    this.lastScore = null;
  }

  /**
   * Get trajectory for visualization
   */
  getTrajectory(): TrajectoryPoint[] {
    return this.trajectory.toArray();
  }

  /**
   * Get final score (for persistence)
   */
  getFinalScore(): TechniqueScore {
    return this.calculateScore();
  }

  // Helper methods

  private calculateCleanDissectionTime(): number {
    // Implementation omitted for brevity
    return 0;
  }

  private calculateTotalDistance(): number {
    const points = this.trajectory.toArray();
    let distance = 0;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1].position;
      const curr = points[i].position;
      distance += Math.sqrt(
        Math.pow(curr.x - prev.x, 2) +
        Math.pow(curr.y - prev.y, 2) +
        Math.pow(curr.z - prev.z, 2)
      );
    }

    return distance;
  }

  private calculateOptimalDistance(): number {
    // Level-based optimal waypoint distances
    const OPTIMAL_PATHS: Record<number, number> = {
      1: 5.0,   // Sphenoid ostium to sinus
      2: 3.5,   // Sinus to sella floor
      3: 2.0,   // Sella to tumor
    };

    return OPTIMAL_PATHS[this.level] ?? 5.0;
  }

  private calculateTimeToTarget(): number {
    // Find first trajectory point at target level
    const points = this.trajectory.toArray();
    const targetPoint = points.find(p => p.level === 3);

    return targetPoint
      ? targetPoint.timestamp - this.startTime
      : Date.now() - this.startTime;
  }

  private calculateVelocity(
    position: Vector3D,
    timestamp: number
  ): Vector3D {
    const points = this.trajectory.toArray();
    if (points.length === 0) {
      return { x: 0, y: 0, z: 0 };
    }

    const lastPoint = points[points.length - 1];
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
    const points = this.trajectory.toArray();
    if (points.length < 3) return false;

    // Check if moving away from target (Level 3 position)
    const targetZ = -7.5; // Pituitary position
    const prevZ = points[points.length - 1].position.z;
    const currZ = position.z;

    // Moving backward if Z is increasing (away from target)
    return currZ > prevZ && prevZ < targetZ;
  }

  private calculateSafeTime(): number {
    // Implementation omitted for brevity
    return 0;
  }

  private getExpectedSteps(level: number): string[] {
    // Level-based protocol steps
    const PROTOCOL_STEPS: Record<number, string[]> = {
      1: [
        'identify_sphenoid_ostium',
        'visualize_septum',
        'confirm_cavity_boundaries',
      ],
      2: [
        'identify_sella_floor',
        'locate_carotid_prominences',
        'confirm_midline',
      ],
      3: [
        'assess_tumor_consistency',
        'identify_pseudocapsule',
        'plan_debulking_strategy',
      ],
    };

    return PROTOCOL_STEPS[level] ?? [];
  }
}
```

#### 3.3 RingBuffer Utility

```typescript
/**
 * Ring buffer for efficient trajectory storage
 * Prevents unbounded memory growth
 */
export class RingBuffer<T> {
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

    // Buffer is full, return in chronological order
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

#### 3.4 Persistence Layer

```typescript
/**
 * Scoring persistence using localStorage
 * Designed for easy migration to backend API
 */
export class ScoringPersistence {
  private static readonly STORAGE_KEY = 'neurosim_technique_scores';
  private static readonly AUTOSAVE_KEY = 'neurosim_autosave';
  private static readonly MAX_STORED_SCORES = 50;

  /**
   * Save technique score to localStorage
   */
  static saveScore(score: TechniqueScore): void {
    try {
      const scores = this.loadAllScores();
      scores.push(score);

      // Keep only recent scores
      if (scores.length > this.MAX_STORED_SCORES) {
        scores.shift();
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scores));
    } catch (error) {
      console.error('Failed to save technique score:', error);
    }
  }

  /**
   * Autosave current score (overwrites previous autosave)
   */
  static autosave(score: TechniqueScore): void {
    try {
      localStorage.setItem(this.AUTOSAVE_KEY, JSON.stringify(score));
    } catch (error) {
      console.error('Failed to autosave:', error);
    }
  }

  /**
   * Load all saved scores
   */
  static loadAllScores(): TechniqueScore[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load scores:', error);
      return [];
    }
  }

  /**
   * Load autosaved score
   */
  static loadAutosave(): TechniqueScore | null {
    try {
      const data = localStorage.getItem(this.AUTOSAVE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load autosave:', error);
      return null;
    }
  }

  /**
   * Get scores by session ID
   */
  static getScoresBySession(sessionId: string): TechniqueScore[] {
    return this.loadAllScores().filter(s => s.sessionId === sessionId);
  }

  /**
   * Get scores by level
   */
  static getScoresByLevel(level: number): TechniqueScore[] {
    return this.loadAllScores().filter(s => s.level === level);
  }

  /**
   * Get best score (highest overall)
   */
  static getBestScore(): TechniqueScore | null {
    const scores = this.loadAllScores();
    if (scores.length === 0) return null;

    return scores.reduce((best, current) =>
      current.overall > best.overall ? current : best
    );
  }

  /**
   * Clear all stored scores
   */
  static clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.AUTOSAVE_KEY);
  }

  /**
   * Export scores to JSON file
   */
  static exportToFile(scores: TechniqueScore[]): void {
    const blob = new Blob([JSON.stringify(scores, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neurosim_scores_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Future: Backend API adapter
 */
export class ScoringAPI {
  private static readonly API_BASE = '/api/v1/scores';

  /**
   * Save score to backend (future implementation)
   */
  static async saveScore(score: TechniqueScore): Promise<void> {
    // Implementation for backend API
    // const response = await fetch(`${this.API_BASE}`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(score),
    // });
    throw new Error('Backend API not implemented yet');
  }

  /**
   * Load scores from backend (future implementation)
   */
  static async loadScores(userId: string): Promise<TechniqueScore[]> {
    // Implementation for backend API
    throw new Error('Backend API not implemented yet');
  }
}
```

### 4. Integration with Existing Systems

#### 4.1 App.tsx Integration

```typescript
// In App.tsx

export default function App() {
  // Existing state
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(100); // Legacy score (will be deprecated)
  const [collisionCount, setCollisionCount] = useState(0);
  const [activeCrisis, setActiveCrisis] = useState<CrisisEvent | null>(null);
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([]);

  // NEW: Technique scoring system
  const [techniqueScore, setTechniqueScore] = useState<TechniqueScore | null>(null);

  const scoring = useTechniqueScoring({
    level,
    onScoreUpdate: setTechniqueScore,
    enablePersistence: true,
  });

  // Update collision handler to include scoring
  const handleRaycastCollision = useCallback((point: Vector3D, tissueType: TissueType) => {
    setLastCollision(point);
    setCollisionCount((count) => count + 1);
    setScore((prev) => Math.max(prev - 2, 0)); // Legacy

    // NEW: Record collision for technique scoring
    scoring.recordCollision({
      position: point,
      tissueType,
      timestamp: Date.now(),
      intensity: 1.0,
    });
  }, [scoring]);

  // Update position tracking
  useEffect(() => {
    // Record position every 100ms for trajectory tracking
    const interval = setInterval(() => {
      scoring.recordPosition(tipPosition, Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, [tipPosition, scoring]);

  // Update safety zone handler
  const handleSafetyChange = useCallback((zones: SafetyZone[]) => {
    setSafetyZones(zones);

    // NEW: Record proximity events for safety scoring
    zones.forEach(zone => {
      if (zone.riskLevel !== RiskLevel.SAFE) {
        scoring.recordProximityEvent(zone);
      }
    });
  }, [scoring]);

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

#### 4.2 TechniqueScoreHUD Component

```typescript
/**
 * HUD component for technique score display
 */
export interface TechniqueScoreHUDProps {
  score: TechniqueScore;
  expanded?: boolean;
}

export function TechniqueScoreHUD({ score, expanded = false }: TechniqueScoreHUDProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const getScoreColor = (value: number): string => {
    if (value >= 85) return '#00ff00'; // Green
    if (value >= 70) return '#ffff00'; // Yellow
    if (value >= 50) return '#ff8800'; // Orange
    return '#ff0000'; // Red
  };

  return (
    <div style={styles.scoreHUD}>
      {/* Overall Score */}
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

      {/* Expand/Collapse Button */}
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Collapse' : 'Details'}
      </button>

      {/* Detailed Breakdown (collapsed by default) */}
      {isExpanded && (
        <div style={styles.breakdown}>
          <ScoreBar label="Accuracy" value={score.accuracy.score} />
          <ScoreBar label="Efficiency" value={score.efficiency.score} />
          <ScoreBar label="Safety" value={score.safety.score} />
          <ScoreBar label="Method" value={score.method.score} />

          {/* Detailed Metrics */}
          <div style={styles.details}>
            <p>Collisions: {score.accuracy.totalCollisions}</p>
            <p>Path Efficiency: {(score.efficiency.pathEfficiency * 100).toFixed(1)}%</p>
            <p>Proximity Warnings: {score.safety.warningEvents}</p>
            <p>Protocol Steps: {score.method.stepsCompleted}/{score.method.totalSteps}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const getBarColor = (v: number): string => {
    if (v >= 85) return '#00ff00';
    if (v >= 70) return '#ffff00';
    if (v >= 50) return '#ff8800';
    return '#ff0000';
  };

  return (
    <div style={styles.scoreBar}>
      <span>{label}</span>
      <div style={styles.barContainer}>
        <div
          style={{
            ...styles.barFill,
            width: `${value}%`,
            backgroundColor: getBarColor(value),
          }}
        />
      </div>
      <span>{value.toFixed(0)}</span>
    </div>
  );
}
```

### 5. State Management Strategy

**Decision: Centralized State in App.tsx**

**Rationale:**
- Current codebase uses centralized state in App.tsx (no Redux/Zustand)
- Scoring system is relatively simple (single user, single session)
- Avoids introducing new dependencies
- Easy to migrate to Context API or state library later if needed

**Alternative Considered: React Context**
- Pros: Better separation of concerns, easier testing
- Cons: Adds boilerplate, overkill for current complexity
- **Decision: Defer to Phase 2** when multi-user features are added

### 6. Performance Considerations

**Target: <10ms scoring overhead per frame**

**Optimization Strategies:**

1. **Lazy Calculation**: Score updates every 1 second, not every frame
2. **Caching**: Cache score calculation for 500ms to avoid redundant work
3. **Ring Buffer**: Limit trajectory history to 1000 points (4KB memory)
4. **Debouncing**: Collision events already debounced at 250ms
5. **Web Worker (Future)**: Move scoring calculation to worker thread if needed

**Memory Budget:**
- Trajectory buffer: ~4KB (1000 points × 4 bytes per float)
- Collision history: ~2KB (100 events × 20 bytes)
- Proximity history: ~2KB
- **Total: <10KB per session**

### 7. Testing Strategy

#### 7.1 Unit Tests

```typescript
// __tests__/TechniqueScorer.test.ts

describe('TechniqueScorer', () => {
  let scorer: TechniqueScorer;

  beforeEach(() => {
    scorer = new TechniqueScorer(DEFAULT_SCORING_CONFIG, 'test-session', 1);
  });

  describe('Accuracy Scoring', () => {
    it('should start with perfect score', () => {
      const score = scorer.calculateScore();
      expect(score.accuracy.score).toBe(100);
    });

    it('should penalize critical collisions more than non-critical', () => {
      scorer.recordCollision({
        position: { x: 0, y: 0, z: 0 },
        tissueType: TissueType.ICA, // Critical
        timestamp: Date.now(),
        intensity: 1.0,
      });

      const criticalScore = scorer.calculateScore().accuracy.score;

      scorer.reset();

      scorer.recordCollision({
        position: { x: 0, y: 0, z: 0 },
        tissueType: TissueType.MUCOSA, // Non-critical
        timestamp: Date.now(),
        intensity: 1.0,
      });

      const nonCriticalScore = scorer.calculateScore().accuracy.score;

      expect(criticalScore).toBeLessThan(nonCriticalScore);
    });
  });

  describe('Efficiency Scoring', () => {
    it('should reward optimal path', () => {
      // Record straight path to target
      scorer.recordPosition({ x: 0, y: 0, z: 0 }, 1000);
      scorer.recordPosition({ x: 0, y: 0, z: -1 }, 2000);
      scorer.recordPosition({ x: 0, y: 0, z: -2 }, 3000);

      const score = scorer.calculateScore();
      expect(score.efficiency.pathEfficiency).toBeGreaterThan(0.8);
    });

    it('should detect backtracking', () => {
      // Record path with backtracking
      scorer.recordPosition({ x: 0, y: 0, z: 0 }, 1000);
      scorer.recordPosition({ x: 0, y: 0, z: -1 }, 2000);
      scorer.recordPosition({ x: 0, y: 0, z: 0 }, 3000); // Backtrack
      scorer.recordPosition({ x: 0, y: 0, z: -1 }, 4000);

      const score = scorer.calculateScore();
      expect(score.efficiency.wastedMovements).toBeGreaterThan(0);
    });
  });

  describe('Safety Scoring', () => {
    it('should penalize danger zone entries', () => {
      const zone: SafetyZone = {
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 0.8,
        riskLevel: RiskLevel.DANGER,
        margin: SAFETY_MARGINS.ICA,
      };

      scorer.recordProximityEvent(zone);

      const score = scorer.calculateScore();
      expect(score.safety.dangerEvents).toBe(1);
      expect(score.safety.score).toBeLessThan(100);
    });
  });

  describe('Method Scoring', () => {
    it('should track step completion', () => {
      scorer.recordMethodStep('identify_sphenoid_ostium', true);
      scorer.recordMethodStep('visualize_septum', true);

      const score = scorer.calculateScore();
      expect(score.method.stepsCompleted).toBe(2);
    });
  });

  describe('Overall Scoring', () => {
    it('should calculate weighted overall score', () => {
      // Perfect accuracy, bad efficiency
      scorer.recordPosition({ x: 0, y: 0, z: 0 }, 1000);
      scorer.recordPosition({ x: 1, y: 1, z: 1 }, 2000);
      scorer.recordPosition({ x: 0, y: 0, z: 0 }, 3000); // Backtrack
      scorer.recordPosition({ x: 0, y: 0, z: -5 }, 4000);

      const score = scorer.calculateScore();

      // Overall should be weighted average
      expect(score.overall).toBeCloseTo(
        score.accuracy.score * 0.35 +
        score.efficiency.score * 0.25 +
        score.safety.score * 0.30 +
        score.method.score * 0.10,
        1
      );
    });
  });
});
```

#### 7.2 Integration Tests

```typescript
// __tests__/TechniqueScoring.integration.test.tsx

describe('useTechniqueScoring Integration', () => {
  it('should integrate with collision system', () => {
    const { result } = renderHook(() =>
      useTechniqueScoring({ level: 1 })
    );

    act(() => {
      result.current.recordCollision({
        position: { x: 0, y: 0, z: 0 },
        tissueType: TissueType.BONE,
        timestamp: Date.now(),
        intensity: 1.0,
      });
    });

    const score = result.current.getCurrentScore();
    expect(score.accuracy.totalCollisions).toBe(1);
  });

  it('should integrate with safety corridor system', () => {
    const { result } = renderHook(() =>
      useTechniqueScoring({ level: 2 })
    );

    act(() => {
      result.current.recordProximityEvent({
        structureName: 'ICA Left',
        position: new Vector3(0, 0, 0),
        distance: 0.5,
        riskLevel: RiskLevel.DANGER,
        margin: SAFETY_MARGINS.ICA,
      });
    });

    const score = result.current.getCurrentScore();
    expect(score.safety.dangerEvents).toBe(1);
  });
});
```

### 8. Future Enhancements (Phase 2/3)

#### 8.1 AI Integration Points

```typescript
/**
 * Future: Claude Vision API integration for surgical coaching
 */
export interface AICoachingInput {
  /** Current technique score */
  techniqueScore: TechniqueScore;

  /** Recent trajectory points */
  recentTrajectory: TrajectoryPoint[];

  /** Screenshot of current view */
  screenshot?: string; // Base64-encoded image

  /** User question (optional) */
  userQuery?: string;
}

export interface AICoachingResponse {
  /** Coaching feedback */
  feedback: string;

  /** Specific recommendations */
  recommendations: string[];

  /** Risk assessment */
  riskLevel: 'low' | 'medium' | 'high';

  /** Suggested next action */
  nextAction?: string;
}

/**
 * Future: AI coaching API
 */
export class AICoachingAPI {
  private static readonly API_BASE = '/api/v1/coaching';

  static async getCoaching(input: AICoachingInput): Promise<AICoachingResponse> {
    // Implementation with Claude Vision API
    throw new Error('Not implemented yet');
  }
}
```

#### 8.2 Trajectory Prediction

```typescript
/**
 * Future: Predict trajectory and show risk heatmap
 */
export interface TrajectoryPrediction {
  /** Predicted path points */
  predictedPath: Vector3D[];

  /** Risk score per point (0-1) */
  riskScores: number[];

  /** Estimated collision probability */
  collisionProbability: number;

  /** Recommended path adjustment */
  adjustment?: Vector3D;
}

export class TrajectoryPredictor {
  /**
   * Predict endoscope trajectory based on current velocity
   */
  static predict(
    currentPosition: Vector3D,
    currentVelocity: Vector3D,
    structures: AnatomicalStructure[]
  ): TrajectoryPrediction {
    // Implementation: Physics-based prediction + ML model
    throw new Error('Not implemented yet');
  }
}
```

---

## Phase 1C: Curriculum Mode

### 1. Architecture Overview

Curriculum Mode is a **structured learning pathway** overlaid on the existing simulation. It operates as a state machine with progression gates.

```
┌─────────────────────────────────────────────────────────────┐
│                      Curriculum State Machine                │
│                                                               │
│   ┌───────────────┐    ┌───────────────┐    ┌────────────┐ │
│   │  Module 1     │───>│  Module 2     │───>│  Module 3  │ │
│   │  Anatomical   │    │  Tumor        │    │  MWCS      │ │
│   │  Recognition  │    │  Debulking    │    │  Decision  │ │
│   └───────────────┘    └───────────────┘    └────────────┘ │
│         ▲                     ▲                    ▲         │
│         │                     │                    │         │
│      Success                Success             Success      │
│      Criteria               Criteria            Criteria     │
│         │                     │                    │         │
└─────────┼─────────────────────┼────────────────────┼─────────┘
          │                     │                    │
          ▼                     ▼                    ▼
    ┌──────────┐          ┌──────────┐        ┌──────────┐
    │  Score   │          │  Score   │        │  Score   │
    │  ≥ 75    │          │  ≥ 75    │        │  ≥ 80    │
    │  No ICA  │          │  No ICA  │        │  No ICA  │
    │  Max 10  │          │  Max 8   │        │  Max 5   │
    │  Coll.   │          │  Coll.   │        │  Coll.   │
    └──────────┘          └──────────┘        └──────────┘
```

### 2. Data Structures

#### 2.1 Curriculum Module Definition

```typescript
/**
 * Curriculum module definition
 */
export interface CurriculumModule {
  /** Unique module identifier */
  id: string;

  /** Display name */
  name: string;

  /** Detailed description */
  description: string;

  /** Associated surgical level (1-3) */
  level: number;

  /** Learning objectives */
  objectives: LearningObjective[];

  /** Success criteria to pass module */
  successCriteria: SuccessCriteria;

  /** Optional prerequisite modules */
  prerequisites: string[];

  /** Estimated completion time (minutes) */
  estimatedDuration: number;

  /** Instructional content */
  instructions: ModuleInstructions;

  /** Assessment type */
  assessmentType: 'simulation' | 'quiz' | 'hybrid';
}

/**
 * Learning objective
 */
export interface LearningObjective {
  /** Unique objective ID */
  id: string;

  /** Objective description */
  description: string;

  /** Type of objective */
  type: 'knowledge' | 'skill' | 'judgment';

  /** Assessment method */
  assessment: 'observation' | 'score' | 'quiz';

  /** Required for module completion? */
  required: boolean;
}

/**
 * Success criteria for module completion
 */
export interface SuccessCriteria {
  /** Minimum overall technique score (0-100) */
  minScore: number;

  /** Maximum allowed collisions */
  maxCollisions: number;

  /** Maximum critical collisions (0 for critical modules) */
  maxCriticalCollisions: number;

  /** Minimum safety score (0-100) */
  minSafetyScore?: number;

  /** Required method steps completed (fraction 0-1) */
  requiredMethodCompletion?: number;

  /** Maximum allowed time (ms) */
  maxTime?: number;

  /** Custom validation function */
  customValidation?: (score: TechniqueScore) => boolean;
}

/**
 * Module instructions and educational content
 */
export interface ModuleInstructions {
  /** Pre-simulation briefing */
  briefing: string;

  /** Step-by-step guidance */
  steps: string[];

  /** Tips and warnings */
  tips: string[];

  /** Common mistakes to avoid */
  commonMistakes: string[];

  /** Reference images/videos */
  media?: MediaReference[];
}

/**
 * Media reference
 */
export interface MediaReference {
  /** Media type */
  type: 'image' | 'video' | 'diagram';

  /** URL to media asset */
  url: string;

  /** Caption */
  caption: string;

  /** Anatomical labels (for images) */
  labels?: AnatomicalLabel[];
}

/**
 * Anatomical label for images
 */
export interface AnatomicalLabel {
  /** Label text */
  text: string;

  /** Position on image (0-1 normalized) */
  position: { x: number; y: number };

  /** Structure ID */
  structureId: string;
}
```

#### 2.2 Curriculum Progress Tracking

```typescript
/**
 * User progress through curriculum
 */
export interface CurriculumProgress {
  /** User identifier */
  userId: string;

  /** Current module ID */
  currentModuleId: string | null;

  /** Completed modules */
  completedModules: ModuleCompletion[];

  /** In-progress module attempts */
  currentAttempt: ModuleAttempt | null;

  /** Overall progress (0-1) */
  overallProgress: number;

  /** Certification earned? */
  certified: boolean;

  /** Certification date */
  certificationDate?: number;
}

/**
 * Completed module record
 */
export interface ModuleCompletion {
  /** Module ID */
  moduleId: string;

  /** Completion timestamp */
  completedAt: number;

  /** Best technique score achieved */
  bestScore: TechniqueScore;

  /** Number of attempts */
  attempts: number;

  /** Time spent (ms) */
  timeSpent: number;
}

/**
 * Current module attempt
 */
export interface ModuleAttempt {
  /** Module ID */
  moduleId: string;

  /** Attempt number (1-indexed) */
  attemptNumber: number;

  /** Start time */
  startTime: number;

  /** Current technique score */
  currentScore: TechniqueScore | null;

  /** Objectives completed */
  objectivesCompleted: string[];

  /** Pause/resume tracking */
  paused: boolean;
  pauseTime?: number;
}
```

#### 2.3 Certification System

```typescript
/**
 * Certification record
 */
export interface Certification {
  /** Certification ID */
  id: string;

  /** User identifier */
  userId: string;

  /** Certification type */
  type: 'basic' | 'intermediate' | 'advanced';

  /** Issue date */
  issuedAt: number;

  /** Expiration date (optional) */
  expiresAt?: number;

  /** Overall performance score */
  overallScore: number;

  /** Module completion records */
  moduleCompletions: ModuleCompletion[];

  /** Digital signature (future: blockchain verification) */
  signature?: string;
}
```

### 3. Curriculum Definition

#### 3.1 Module Definitions

```typescript
/**
 * Predefined curriculum modules
 */
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
      {
        id: 'obj_1_4',
        description: 'Recognize mucosa vs. bone',
        type: 'knowledge',
        assessment: 'quiz',
        required: false,
      },
    ],
    successCriteria: {
      minScore: 75,
      maxCollisions: 10,
      maxCriticalCollisions: 0,
      minSafetyScore: 80,
      requiredMethodCompletion: 1.0, // All steps required
    },
    prerequisites: [],
    estimatedDuration: 10,
    instructions: {
      briefing:
        'In this module, you will learn to identify key anatomical landmarks in the sphenoid sinus. Navigate slowly and systematically to build spatial awareness.',
      steps: [
        '1. Enter the nasal cavity and locate the sphenoid ostium',
        '2. Advance through the ostium into the sphenoid sinus',
        '3. Visualize the septations dividing the sinus cavity',
        '4. Identify the mucosa (pink tissue) lining the sinus walls',
        '5. Recognize the bone (white) underlying the mucosa',
        '6. Confirm you can see all sinus boundaries',
      ],
      tips: [
        'Move slowly - this module emphasizes accuracy over speed',
        'Use small movements to explore the cavity',
        'The septations may be off-center',
      ],
      commonMistakes: [
        'Colliding with septations during initial entry',
        'Advancing too quickly without surveying the space',
        'Missing lateral boundaries',
      ],
      media: [
        {
          type: 'diagram',
          url: '/assets/module1_anatomy.png',
          caption: 'Sphenoid sinus anatomy diagram',
          labels: [
            {
              text: 'Sphenoid Ostium',
              position: { x: 0.5, y: 0.3 },
              structureId: 'sphenoid_ostium',
            },
            {
              text: 'Septations',
              position: { x: 0.5, y: 0.5 },
              structureId: 'septations',
            },
          ],
        },
      ],
    },
    assessmentType: 'simulation',
  },

  {
    id: 'module_2_tumor_debulking',
    name: 'Module 2: Tumor Debulking (Non-Invasive)',
    description: 'Safely remove non-invasive pituitary adenoma tissue',
    level: 2,
    objectives: [
      {
        id: 'obj_2_1',
        description: 'Identify sella floor and open dura',
        type: 'skill',
        assessment: 'score',
        required: true,
      },
      {
        id: 'obj_2_2',
        description: 'Recognize tumor boundaries',
        type: 'judgment',
        assessment: 'observation',
        required: true,
      },
      {
        id: 'obj_2_3',
        description: 'Perform systematic tumor debulking',
        type: 'skill',
        assessment: 'score',
        required: true,
      },
      {
        id: 'obj_2_4',
        description: 'Avoid carotid prominences',
        type: 'skill',
        assessment: 'score',
        required: true,
      },
    ],
    successCriteria: {
      minScore: 75,
      maxCollisions: 8,
      maxCriticalCollisions: 0, // No ICA/MWCS collisions allowed
      minSafetyScore: 75,
      requiredMethodCompletion: 0.9,
    },
    prerequisites: ['module_1_anatomical_recognition'],
    estimatedDuration: 15,
    instructions: {
      briefing:
        'This module focuses on safe tumor debulking for non-invasive adenomas. You will learn to identify the tumor, understand its boundaries, and remove it systematically without injuring critical structures.',
      steps: [
        '1. Navigate to the sella floor',
        '2. Identify carotid prominences bilaterally',
        '3. Open the dura in the midline',
        '4. Visualize the tumor and pseudocapsule',
        '5. Begin debulking from the center (avoid capsule initially)',
        '6. Work systematically from center to periphery',
        '7. Respect carotid artery positions at all times',
      ],
      tips: [
        'Always know where the carotid arteries are',
        'Debulk from center first (lowest risk)',
        'The tumor is softer than surrounding structures',
        'Watch the safety corridor HUD for proximity warnings',
      ],
      commonMistakes: [
        'Lateral dissection without identifying carotids first',
        'Aggressive pseudocapsule manipulation',
        'Ignoring proximity warnings',
      ],
    },
    assessmentType: 'simulation',
  },

  {
    id: 'module_3_mwcs_decision_making',
    name: 'Module 3: MWCS Decision Making (Invasive Tumors)',
    description: 'Evaluate and manage medial wall cavernous sinus involvement',
    level: 3,
    objectives: [
      {
        id: 'obj_3_1',
        description: 'Identify MWCS and ICA relationship',
        type: 'knowledge',
        assessment: 'observation',
        required: true,
      },
      {
        id: 'obj_3_2',
        description: 'Assess tumor invasion into MWCS',
        type: 'judgment',
        assessment: 'quiz',
        required: true,
      },
      {
        id: 'obj_3_3',
        description: 'Determine safe dissection plane',
        type: 'judgment',
        assessment: 'score',
        required: true,
      },
      {
        id: 'obj_3_4',
        description: 'Execute safe MWCS dissection (if indicated)',
        type: 'skill',
        assessment: 'score',
        required: true,
      },
    ],
    successCriteria: {
      minScore: 80, // Higher threshold for advanced module
      maxCollisions: 5,
      maxCriticalCollisions: 0,
      minSafetyScore: 85,
      requiredMethodCompletion: 0.95,
      customValidation: (score) => {
        // Custom: No ICA proximity events within 0.5mm
        return score.safety.closestICAApproach > 0.5;
      },
    },
    prerequisites: [
      'module_1_anatomical_recognition',
      'module_2_tumor_debulking',
    ],
    estimatedDuration: 20,
    instructions: {
      briefing:
        'This advanced module addresses invasive adenomas with MWCS involvement. You will learn to evaluate the degree of invasion, determine the safe dissection plane, and execute careful dissection when indicated. This is the most challenging module requiring excellent judgment and technique.',
      steps: [
        '1. Complete tumor debulking as in Module 2',
        '2. Identify MWCS bilaterally',
        '3. Assess tumor adherence to MWCS',
        '4. Determine if tumor is: displacing, adherent, or invasive',
        '5. If displacing: continue gentle dissection',
        '6. If adherent: identify safe plane, proceed cautiously',
        '7. If invasive: STOP - do not attempt MWCS dissection',
        '8. Maintain constant awareness of ICA position',
      ],
      tips: [
        'When in doubt, STOP and reassess',
        'MWCS dissection is HIGH RISK - only if truly indicated',
        'ICA injury is catastrophic - absolute respect for safety corridor',
        'Tumor left behind is preferable to ICA injury',
        'Document decision-making (future: voice notes)',
      ],
      commonMistakes: [
        'Overly aggressive dissection with invasion present',
        'Ignoring critical proximity warnings',
        'Failure to reassess after each maneuver',
        'Continuing despite difficulty (know when to stop)',
      ],
    },
    assessmentType: 'hybrid', // Simulation + decision-making quiz
  },
];
```

#### 3.2 Curriculum State Machine

```typescript
/**
 * Curriculum state machine
 */
export enum CurriculumState {
  /** Not enrolled in curriculum */
  NOT_ENROLLED = 'not_enrolled',

  /** Viewing module briefing */
  BRIEFING = 'briefing',

  /** Active simulation in progress */
  SIMULATING = 'simulating',

  /** Simulation paused */
  PAUSED = 'paused',

  /** Reviewing results after attempt */
  REVIEW = 'review',

  /** Module failed - show feedback */
  FAILED = 'failed',

  /** Module passed - show celebration */
  PASSED = 'passed',

  /** All modules complete - certification */
  CERTIFIED = 'certified',
}

/**
 * State machine transitions
 */
export interface CurriculumStateTransition {
  from: CurriculumState;
  to: CurriculumState;
  trigger: string;
  guard?: () => boolean;
}

export const CURRICULUM_TRANSITIONS: CurriculumStateTransition[] = [
  { from: CurriculumState.NOT_ENROLLED, to: CurriculumState.BRIEFING, trigger: 'enroll' },
  { from: CurriculumState.BRIEFING, to: CurriculumState.SIMULATING, trigger: 'start' },
  { from: CurriculumState.SIMULATING, to: CurriculumState.PAUSED, trigger: 'pause' },
  { from: CurriculumState.PAUSED, to: CurriculumState.SIMULATING, trigger: 'resume' },
  { from: CurriculumState.SIMULATING, to: CurriculumState.REVIEW, trigger: 'complete' },
  {
    from: CurriculumState.REVIEW,
    to: CurriculumState.PASSED,
    trigger: 'evaluate',
    guard: () => {
      // Check success criteria
      return true;
    },
  },
  {
    from: CurriculumState.REVIEW,
    to: CurriculumState.FAILED,
    trigger: 'evaluate',
    guard: () => {
      // Check failure
      return false;
    },
  },
  { from: CurriculumState.FAILED, to: CurriculumState.BRIEFING, trigger: 'retry' },
  { from: CurriculumState.PASSED, to: CurriculumState.BRIEFING, trigger: 'next_module' },
  { from: CurriculumState.PASSED, to: CurriculumState.CERTIFIED, trigger: 'certify' },
];
```

### 4. Component Architecture

#### 4.1 useCurriculum Hook

```typescript
/**
 * Primary curriculum management hook
 */
export interface CurriculumProps {
  /** User identifier */
  userId: string;

  /** Current surgical level */
  level: number;

  /** Current technique score */
  techniqueScore: TechniqueScore | null;

  /** Callback for state changes */
  onStateChange?: (state: CurriculumState) => void;

  /** Enable automatic progression */
  autoProgress?: boolean;
}

export function useCurriculum({
  userId,
  level,
  techniqueScore,
  onStateChange,
  autoProgress = false,
}: CurriculumProps) {
  // Curriculum progress state
  const [progress, setProgress] = useState<CurriculumProgress>(() =>
    CurriculumPersistence.loadProgress(userId)
  );

  // Current state machine state
  const [state, setState] = useState<CurriculumState>(
    progress.currentModuleId ? CurriculumState.BRIEFING : CurriculumState.NOT_ENROLLED
  );

  // Current module
  const currentModule = useMemo(() => {
    if (!progress.currentModuleId) return null;
    return CURRICULUM_MODULES.find(m => m.id === progress.currentModuleId) ?? null;
  }, [progress.currentModuleId]);

  /**
   * Enroll in curriculum
   */
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
    CurriculumPersistence.saveProgress(newProgress);

    if (onStateChange) onStateChange(CurriculumState.BRIEFING);
  }, [userId, onStateChange]);

  /**
   * Start simulation for current module
   */
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

  /**
   * Complete current simulation
   */
  const completeSimulation = useCallback(() => {
    if (!currentModule || !techniqueScore) return;

    setState(CurriculumState.REVIEW);

    if (onStateChange) onStateChange(CurriculumState.REVIEW);
  }, [currentModule, techniqueScore, onStateChange]);

  /**
   * Evaluate attempt against success criteria
   */
  const evaluateAttempt = useCallback(() => {
    if (!currentModule || !techniqueScore) return;

    const passed = checkSuccessCriteria(techniqueScore, currentModule.successCriteria);

    if (passed) {
      // Record completion
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
        overallProgress:
          (prev.completedModules.length + 1) / CURRICULUM_MODULES.length,
      }));

      setState(CurriculumState.PASSED);
      if (onStateChange) onStateChange(CurriculumState.PASSED);

      // Check for certification
      if (progress.completedModules.length + 1 === CURRICULUM_MODULES.length) {
        setTimeout(() => {
          setState(CurriculumState.CERTIFIED);
          if (onStateChange) onStateChange(CurriculumState.CERTIFIED);

          // Generate certification
          const cert = generateCertification(userId, progress);
          CurriculumPersistence.saveCertification(cert);
        }, 2000);
      }
    } else {
      setState(CurriculumState.FAILED);
      if (onStateChange) onStateChange(CurriculumState.FAILED);
    }
  }, [currentModule, techniqueScore, progress, userId, onStateChange]);

  /**
   * Retry failed module
   */
  const retry = useCallback(() => {
    setState(CurriculumState.BRIEFING);
    if (onStateChange) onStateChange(CurriculumState.BRIEFING);
  }, [onStateChange]);

  /**
   * Advance to next module
   */
  const nextModule = useCallback(() => {
    const currentIndex = CURRICULUM_MODULES.findIndex(
      m => m.id === currentModule?.id
    );

    if (currentIndex < CURRICULUM_MODULES.length - 1) {
      const next = CURRICULUM_MODULES[currentIndex + 1];
      setProgress(prev => ({ ...prev, currentModuleId: next.id }));
      setState(CurriculumState.BRIEFING);
      if (onStateChange) onStateChange(CurriculumState.BRIEFING);
    }
  }, [currentModule, onStateChange]);

  /**
   * Pause simulation
   */
  const pause = useCallback(() => {
    setState(CurriculumState.PAUSED);
    if (onStateChange) onStateChange(CurriculumState.PAUSED);
  }, [onStateChange]);

  /**
   * Resume simulation
   */
  const resume = useCallback(() => {
    setState(CurriculumState.SIMULATING);
    if (onStateChange) onStateChange(CurriculumState.SIMULATING);
  }, [onStateChange]);

  // Auto-persist progress
  useEffect(() => {
    CurriculumPersistence.saveProgress(progress);
  }, [progress]);

  return {
    // State
    state,
    progress,
    currentModule,

    // Actions
    enroll,
    startSimulation,
    completeSimulation,
    evaluateAttempt,
    retry,
    nextModule,
    pause,
    resume,

    // Computed
    canAdvance: () => {
      return (
        state === CurriculumState.PASSED &&
        progress.completedModules.length < CURRICULUM_MODULES.length
      );
    },
    isComplete: () => {
      return state === CurriculumState.CERTIFIED;
    },
  };
}

/**
 * Check if technique score meets success criteria
 */
function checkSuccessCriteria(
  score: TechniqueScore,
  criteria: SuccessCriteria
): boolean {
  // Check overall score
  if (score.overall < criteria.minScore) {
    return false;
  }

  // Check collision limits
  if (score.accuracy.totalCollisions > criteria.maxCollisions) {
    return false;
  }

  // Check critical collisions
  if (score.accuracy.criticalCollisions > criteria.maxCriticalCollisions) {
    return false;
  }

  // Check safety score
  if (criteria.minSafetyScore && score.safety.score < criteria.minSafetyScore) {
    return false;
  }

  // Check method completion
  if (criteria.requiredMethodCompletion) {
    const methodRatio = score.method.stepsCompleted / score.method.totalSteps;
    if (methodRatio < criteria.requiredMethodCompletion) {
      return false;
    }
  }

  // Check time limit
  if (criteria.maxTime && score.duration > criteria.maxTime) {
    return false;
  }

  // Check custom validation
  if (criteria.customValidation && !criteria.customValidation(score)) {
    return false;
  }

  return true;
}

/**
 * Generate certification
 */
function generateCertification(
  userId: string,
  progress: CurriculumProgress
): Certification {
  const overallScore =
    progress.completedModules.reduce((sum, m) => sum + m.bestScore.overall, 0) /
    progress.completedModules.length;

  return {
    id: `cert_${userId}_${Date.now()}`,
    userId,
    type: 'basic',
    issuedAt: Date.now(),
    overallScore,
    moduleCompletions: progress.completedModules,
  };
}
```

#### 4.2 Curriculum UI Components

```typescript
/**
 * Curriculum Mode Screen
 */
export function CurriculumScreen() {
  const { userId } = useAuth(); // Hypothetical auth hook
  const [level, setLevel] = useState(1);
  const [techniqueScore, setTechniqueScore] = useState<TechniqueScore | null>(null);

  const curriculum = useCurriculum({
    userId,
    level,
    techniqueScore,
  });

  // Render based on state
  switch (curriculum.state) {
    case CurriculumState.NOT_ENROLLED:
      return <EnrollmentScreen onEnroll={curriculum.enroll} />;

    case CurriculumState.BRIEFING:
      return (
        <ModuleBriefingScreen
          module={curriculum.currentModule!}
          onStart={curriculum.startSimulation}
        />
      );

    case CurriculumState.SIMULATING:
      return (
        <SimulationScreen
          module={curriculum.currentModule!}
          level={level}
          onComplete={curriculum.completeSimulation}
          onPause={curriculum.pause}
        />
      );

    case CurriculumState.REVIEW:
      return (
        <ReviewScreen
          module={curriculum.currentModule!}
          score={techniqueScore!}
          onEvaluate={curriculum.evaluateAttempt}
        />
      );

    case CurriculumState.PASSED:
      return (
        <SuccessScreen
          module={curriculum.currentModule!}
          score={techniqueScore!}
          onNext={curriculum.nextModule}
        />
      );

    case CurriculumState.FAILED:
      return (
        <FailureScreen
          module={curriculum.currentModule!}
          score={techniqueScore!}
          criteria={curriculum.currentModule!.successCriteria}
          onRetry={curriculum.retry}
        />
      );

    case CurriculumState.CERTIFIED:
      return <CertificationScreen progress={curriculum.progress} />;

    default:
      return null;
  }
}

/**
 * Module Briefing Screen
 */
function ModuleBriefingScreen({
  module,
  onStart,
}: {
  module: CurriculumModule;
  onStart: () => void;
}) {
  return (
    <div style={styles.briefingContainer}>
      <h1>{module.name}</h1>
      <p>{module.description}</p>

      <section>
        <h2>Learning Objectives</h2>
        <ul>
          {module.objectives.map(obj => (
            <li key={obj.id}>
              {obj.description}
              {obj.required && <span> (Required)</span>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Instructions</h2>
        <p>{module.instructions.briefing}</p>
        <ol>
          {module.instructions.steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2>Tips</h2>
        <ul>
          {module.instructions.tips.map((tip, idx) => (
            <li key={idx}>{tip}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Success Criteria</h2>
        <ul>
          <li>Minimum Score: {module.successCriteria.minScore}</li>
          <li>Max Collisions: {module.successCriteria.maxCollisions}</li>
          <li>Max Critical Collisions: {module.successCriteria.maxCriticalCollisions}</li>
        </ul>
      </section>

      <button onClick={onStart} style={styles.startButton}>
        Start Module
      </button>
    </div>
  );
}

/**
 * Simulation Screen (wraps existing App)
 */
function SimulationScreen({
  module,
  level,
  onComplete,
  onPause,
}: {
  module: CurriculumModule;
  level: number;
  onComplete: () => void;
  onPause: () => void;
}) {
  return (
    <div>
      {/* Curriculum HUD overlay */}
      <div style={styles.curriculumHUD}>
        <h3>{module.name}</h3>
        <button onClick={onPause}>Pause</button>
        <button onClick={onComplete}>Complete</button>
      </div>

      {/* Existing simulation (App.tsx content) */}
      <EndoscopeView level={level} {/* ... */} />
    </div>
  );
}

/**
 * Review Screen
 */
function ReviewScreen({
  module,
  score,
  onEvaluate,
}: {
  module: CurriculumModule;
  score: TechniqueScore;
  onEvaluate: () => void;
}) {
  return (
    <div style={styles.reviewContainer}>
      <h1>Module Complete</h1>
      <h2>{module.name}</h2>

      <TechniqueScoreHUD score={score} expanded={true} />

      <section>
        <h3>Performance Summary</h3>
        <ul>
          <li>Overall Score: {score.overall.toFixed(1)}</li>
          <li>Total Collisions: {score.accuracy.totalCollisions}</li>
          <li>Critical Collisions: {score.accuracy.criticalCollisions}</li>
          <li>Safety Events: {score.safety.warningEvents}</li>
        </ul>
      </section>

      <button onClick={onEvaluate} style={styles.evaluateButton}>
        Evaluate Results
      </button>
    </div>
  );
}

/**
 * Success Screen
 */
function SuccessScreen({
  module,
  score,
  onNext,
}: {
  module: CurriculumModule;
  score: TechniqueScore;
  onNext: () => void;
}) {
  return (
    <div style={styles.successContainer}>
      <h1>✅ Module Passed!</h1>
      <h2>{module.name}</h2>

      <div style={styles.celebration}>
        <p>Congratulations! You successfully completed this module.</p>
        <p>Final Score: {score.overall.toFixed(1)}</p>
      </div>

      <button onClick={onNext} style={styles.nextButton}>
        Continue to Next Module
      </button>
    </div>
  );
}

/**
 * Failure Screen
 */
function FailureScreen({
  module,
  score,
  criteria,
  onRetry,
}: {
  module: CurriculumModule;
  score: TechniqueScore;
  criteria: SuccessCriteria;
  onRetry: () => void;
}) {
  // Determine failure reasons
  const failureReasons: string[] = [];

  if (score.overall < criteria.minScore) {
    failureReasons.push(
      `Overall score (${score.overall.toFixed(1)}) below required ${criteria.minScore}`
    );
  }

  if (score.accuracy.totalCollisions > criteria.maxCollisions) {
    failureReasons.push(
      `Too many collisions (${score.accuracy.totalCollisions} > ${criteria.maxCollisions})`
    );
  }

  if (score.accuracy.criticalCollisions > criteria.maxCriticalCollisions) {
    failureReasons.push(
      `Critical collisions not allowed (${score.accuracy.criticalCollisions} occurred)`
    );
  }

  return (
    <div style={styles.failureContainer}>
      <h1>❌ Module Not Passed</h1>
      <h2>{module.name}</h2>

      <section>
        <h3>Failure Reasons</h3>
        <ul>
          {failureReasons.map((reason, idx) => (
            <li key={idx}>{reason}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Feedback</h3>
        <p>Review the module instructions and try again.</p>
        <ul>
          {module.instructions.commonMistakes.map((mistake, idx) => (
            <li key={idx}>{mistake}</li>
          ))}
        </ul>
      </section>

      <button onClick={onRetry} style={styles.retryButton}>
        Retry Module
      </button>
    </div>
  );
}

/**
 * Certification Screen
 */
function CertificationScreen({ progress }: { progress: CurriculumProgress }) {
  const cert = CurriculumPersistence.loadCertification(progress.userId);

  if (!cert) return null;

  return (
    <div style={styles.certificationContainer}>
      <h1>🎓 Certification Earned!</h1>

      <div style={styles.certificate}>
        <p>This certifies that</p>
        <h2>{progress.userId}</h2>
        <p>has successfully completed</p>
        <h3>NeuroSim Basic Training Curriculum</h3>
        <p>Overall Score: {cert.overallScore.toFixed(1)}</p>
        <p>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</p>
      </div>

      <button onClick={() => CurriculumPersistence.exportCertification(cert)}>
        Download Certificate
      </button>
    </div>
  );
}
```

### 5. Persistence Layer

```typescript
/**
 * Curriculum persistence using localStorage
 */
export class CurriculumPersistence {
  private static readonly PROGRESS_KEY = 'neurosim_curriculum_progress';
  private static readonly CERT_KEY = 'neurosim_certifications';

  /**
   * Save curriculum progress
   */
  static saveProgress(progress: CurriculumProgress): void {
    try {
      localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save curriculum progress:', error);
    }
  }

  /**
   * Load curriculum progress
   */
  static loadProgress(userId: string): CurriculumProgress {
    try {
      const data = localStorage.getItem(this.PROGRESS_KEY);
      if (data) {
        const progress = JSON.parse(data);
        if (progress.userId === userId) {
          return progress;
        }
      }
    } catch (error) {
      console.error('Failed to load curriculum progress:', error);
    }

    // Return empty progress
    return {
      userId,
      currentModuleId: null,
      completedModules: [],
      currentAttempt: null,
      overallProgress: 0,
      certified: false,
    };
  }

  /**
   * Save certification
   */
  static saveCertification(cert: Certification): void {
    try {
      const certs = this.loadAllCertifications();
      certs.push(cert);
      localStorage.setItem(this.CERT_KEY, JSON.stringify(certs));
    } catch (error) {
      console.error('Failed to save certification:', error);
    }
  }

  /**
   * Load certification
   */
  static loadCertification(userId: string): Certification | null {
    const certs = this.loadAllCertifications();
    return certs.find(c => c.userId === userId) ?? null;
  }

  /**
   * Load all certifications
   */
  static loadAllCertifications(): Certification[] {
    try {
      const data = localStorage.getItem(this.CERT_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load certifications:', error);
      return [];
    }
  }

  /**
   * Export certification to file
   */
  static exportCertification(cert: Certification): void {
    const blob = new Blob([JSON.stringify(cert, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neurosim_cert_${cert.userId}_${cert.issuedAt}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
```

### 6. Integration with App.tsx

```typescript
// In App.tsx

export default function App() {
  // Mode selection
  const [mode, setMode] = useState<'free_practice' | 'curriculum'>('free_practice');

  // Existing state
  const [level, setLevel] = useState(1);
  const [techniqueScore, setTechniqueScore] = useState<TechniqueScore | null>(null);

  // Curriculum hook
  const curriculum = useCurriculum({
    userId: 'test_user', // Replace with real auth
    level,
    techniqueScore,
    onStateChange: (state) => {
      console.log('Curriculum state:', state);
    },
  });

  return (
    <div>
      {/* Mode selector */}
      <div style={styles.modeSelector}>
        <button onClick={() => setMode('free_practice')}>
          Free Practice
        </button>
        <button onClick={() => setMode('curriculum')}>
          Curriculum Mode
        </button>
      </div>

      {/* Render appropriate mode */}
      {mode === 'free_practice' ? (
        // Existing free practice mode
        <FreePracticeMode level={level} setLevel={setLevel} />
      ) : (
        // Curriculum mode
        <CurriculumScreen />
      )}
    </div>
  );
}
```

---

## Phase 2/3 Future-Proofing

### 1. AI Integration Preparation

**Data Pipeline for AI Coaching:**

```typescript
/**
 * Telemetry collector for AI training data
 */
export class TelemetryCollector {
  /**
   * Collect anonymized session data for AI model training
   */
  static collectSessionTelemetry(
    score: TechniqueScore,
    trajectory: TrajectoryPoint[],
    collisions: CollisionEvent[],
    proximityEvents: SafetyZone[]
  ): AITrainingData {
    return {
      sessionId: score.sessionId,
      level: score.level,
      duration: score.duration,
      techniqueScore: score,
      trajectoryFeatures: extractTrajectoryFeatures(trajectory),
      collisionFeatures: extractCollisionFeatures(collisions),
      proximityFeatures: extractProximityFeatures(proximityEvents),
      timestamp: Date.now(),
    };
  }
}

/**
 * Extract features from trajectory for ML
 */
function extractTrajectoryFeatures(trajectory: TrajectoryPoint[]) {
  return {
    totalDistance: calculateTotalDistance(trajectory),
    avgVelocity: calculateAvgVelocity(trajectory),
    smoothness: calculateSmoothness(trajectory),
    backtrackCount: trajectory.filter(p => p.isBacktracking).length,
    spatialDistribution: calculateSpatialDistribution(trajectory),
  };
}
```

**API Design for Claude Vision Backend:**

```typescript
/**
 * Future: API design for backend integration
 */
export interface BackendAPI {
  /**
   * Submit technique score to backend
   */
  submitScore(score: TechniqueScore): Promise<{ success: boolean }>;

  /**
   * Request AI coaching feedback
   */
  requestCoaching(input: AICoachingInput): Promise<AICoachingResponse>;

  /**
   * Upload session telemetry for model training
   */
  uploadTelemetry(data: AITrainingData): Promise<void>;

  /**
   * Get leaderboard rankings
   */
  getLeaderboard(level: number): Promise<LeaderboardEntry[]>;
}

/**
 * REST API endpoints (design)
 */
const API_ENDPOINTS = {
  SUBMIT_SCORE: '/api/v1/scores',
  REQUEST_COACHING: '/api/v1/coaching',
  UPLOAD_TELEMETRY: '/api/v1/telemetry',
  LEADERBOARD: '/api/v1/leaderboard/:level',
};
```

### 2. Multiplayer Architecture Preparation

**Shared State Synchronization:**

```typescript
/**
 * Future: WebSocket-based multiplayer state sync
 */
export interface MultiplayerSession {
  sessionId: string;
  participants: ParticipantInfo[];
  sharedState: SharedSessionState;
}

export interface SharedSessionState {
  level: number;
  trajectories: Map<string, TrajectoryPoint[]>; // userId -> trajectory
  annotations: Annotation[]; // Instructor annotations
  liveAudio: boolean;
}

/**
 * WebSocket message protocol
 */
export enum MessageType {
  POSITION_UPDATE = 'position_update',
  COLLISION_EVENT = 'collision_event',
  ANNOTATION = 'annotation',
  VOICE_DATA = 'voice_data',
}

export interface WSMessage {
  type: MessageType;
  userId: string;
  timestamp: number;
  payload: any;
}
```

### 3. Extensibility Points

**Plugin Architecture for Custom Modules:**

```typescript
/**
 * Future: Plugin system for custom curriculum modules
 */
export interface CurriculumPlugin {
  id: string;
  name: string;
  version: string;

  /** Custom module definitions */
  modules: CurriculumModule[];

  /** Custom scoring logic */
  customScoring?: (score: TechniqueScore) => number;

  /** Custom UI components */
  customComponents?: {
    briefing?: React.ComponentType<any>;
    simulation?: React.ComponentType<any>;
    review?: React.ComponentType<any>;
  };
}

/**
 * Plugin registry
 */
export class PluginRegistry {
  private static plugins: Map<string, CurriculumPlugin> = new Map();

  static register(plugin: CurriculumPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  static getPlugin(id: string): CurriculumPlugin | null {
    return this.plugins.get(id) ?? null;
  }

  static getAllPlugins(): CurriculumPlugin[] {
    return Array.from(this.plugins.values());
  }
}
```

---

## Implementation Roadmap

### Phase 1B Implementation (Technique Scoring)

**Week 1-2: Core Scoring Engine**
- [ ] Implement `TechniqueScorer` class
- [ ] Implement `RingBuffer` utility
- [ ] Write unit tests (target 90% coverage)
- [ ] Integration with `CollisionManager`

**Week 3: Persistence & UI**
- [ ] Implement `ScoringPersistence`
- [ ] Create `TechniqueScoreHUD` component
- [ ] Integration with `App.tsx`
- [ ] Visual testing

**Week 4: Safety & Efficiency**
- [ ] Integration with `SafetyCorridorManager`
- [ ] Trajectory tracking implementation
- [ ] Backtracking detection
- [ ] Performance profiling

### Phase 1C Implementation (Curriculum Mode)

**Week 1-2: Data Structures & State Machine**
- [ ] Define curriculum modules
- [ ] Implement `useCurriculum` hook
- [ ] Write state machine tests
- [ ] Success criteria validation

**Week 3-4: UI Components**
- [ ] `EnrollmentScreen`
- [ ] `ModuleBriefingScreen`
- [ ] `SimulationScreen` integration
- [ ] `ReviewScreen` & results

**Week 5-6: Certification & Polish**
- [ ] `CertificationScreen`
- [ ] `CurriculumPersistence`
- [ ] User flow testing
- [ ] Documentation

### Phase 2 Preparation (Future)

**Future Enhancements:**
- [ ] Backend API implementation
- [ ] Claude Vision integration
- [ ] Trajectory prediction system
- [ ] AI coaching feedback
- [ ] Multiplayer infrastructure

---

## Testing Strategy

### Unit Tests

**Target Coverage: 90%**

- `TechniqueScorer`: All scoring calculation methods
- `RingBuffer`: Buffer operations
- `useTechniqueScoring`: Hook behavior
- `useCurriculum`: State machine transitions
- Success criteria validation

### Integration Tests

- Scoring system + collision manager
- Scoring system + safety corridor
- Curriculum + scoring system
- Persistence layer

### E2E Tests

- Complete module flow (briefing → simulation → review → pass/fail)
- Certification workflow
- Multi-module progression
- Retry mechanism

---

## Performance Metrics

**Target: <10ms scoring overhead**

- Trajectory buffer: ~4KB memory
- Score calculation: <5ms (with caching)
- Persistence: <2ms (localStorage)
- UI render: 60 FPS maintained

**Monitoring:**

```typescript
// Performance monitoring
const ScoringMetrics = {
  scoreCalculationTime: 0,
  trajectoryUpdateTime: 0,
  persistenceTime: 0,
  totalOverhead: 0,
};

// Log to console for debugging
console.table(ScoringMetrics);
```

---

## File Structure

```
src/
├── components/
│   ├── 3d/
│   │   ├── collision/
│   │   │   ├── CollisionManager.tsx
│   │   │   └── types.ts
│   │   ├── safety/
│   │   │   └── SafetyCorridorManager.tsx
│   │   └── scoring/                     # NEW
│   │       ├── TechniqueScorer.ts
│   │       ├── useTechniqueScoring.ts
│   │       ├── ScoringPersistence.ts
│   │       ├── types.ts
│   │       └── __tests__/
│   │           ├── TechniqueScorer.test.ts
│   │           └── useTechniqueScoring.test.tsx
│   ├── ui/
│   │   ├── SafetyHUD.tsx
│   │   └── TechniqueScoreHUD.tsx        # NEW
│   └── curriculum/                       # NEW
│       ├── CurriculumScreen.tsx
│       ├── useCurriculum.ts
│       ├── CurriculumPersistence.ts
│       ├── modules.ts
│       ├── types.ts
│       ├── screens/
│       │   ├── EnrollmentScreen.tsx
│       │   ├── ModuleBriefingScreen.tsx
│       │   ├── SimulationScreen.tsx
│       │   ├── ReviewScreen.tsx
│       │   ├── SuccessScreen.tsx
│       │   ├── FailureScreen.tsx
│       │   └── CertificationScreen.tsx
│       └── __tests__/
│           ├── useCurriculum.test.ts
│           └── CurriculumScreen.test.tsx
├── utils/
│   └── RingBuffer.ts                    # NEW
└── App.tsx
```

---

## Dependencies

**No new external dependencies required**

All implementations use existing technologies:
- React hooks
- TypeScript
- Three.js / R3F (already present)
- localStorage API (built-in)

**Future (Phase 2):**
- WebSocket library (e.g., `socket.io-client`)
- HTTP client (e.g., `axios` or native `fetch`)

---

## Conclusion

This architecture provides:

1. **Scalable**: Modular design supports future AI integration and multiplayer
2. **Testable**: Clear separation of concerns, comprehensive test coverage
3. **Performant**: <10ms overhead, maintains 60 FPS
4. **Maintainable**: TypeScript, documented interfaces, consistent patterns
5. **Extensible**: Plugin system for custom modules, backend API ready

The design leverages existing architecture patterns (hooks, centralized state) while introducing new systems (scoring, curriculum) that integrate cleanly without disruption.

---

**Next Steps:**

1. Review this architecture with stakeholders
2. Prioritize Phase 1B vs 1C (or parallel development)
3. Begin implementation following roadmap
4. Iterate based on user testing feedback

**Questions for Review:**

1. Are the success criteria thresholds appropriate for each module?
2. Should we implement real-time AI coaching in Phase 1 or defer to Phase 2?
3. Is localStorage sufficient for persistence, or should we prioritize backend API?
4. Should we add multiplayer observability (instructor viewing student) in Phase 1?
