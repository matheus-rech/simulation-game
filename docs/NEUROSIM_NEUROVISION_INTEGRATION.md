# NeuroSim + NeuroVision Integration Analysis

## 1. Feature Comparison Matrix

### 1.1 Core Capabilities

| Capability | NeuroSim (Web Simulator) | NeuroVision (Python/CV) | Integration Priority |
|------------|-------------------------|-------------------------|---------------------|
| **3D Anatomical Rendering** | React Three Fiber, CSG geometry, procedural generation | N/A (camera-based) | Keep NeuroSim |
| **Real-time Safety Monitoring** | SafetyCorridorManager (distance-based warnings) | ORSafetyMonitor (contamination, sterile field) | Merge approaches |
| **Collision Detection** | Raycasting + tissue-specific responses | Frame analysis + proximity alerts | Complement each other |
| **Claude Vision Integration** | Planned (Phase 3B) | Implemented (camera_vision_system.py) | Port to NeuroSim |
| **Local Segmentation** | N/A | NeuroimagingSegmenter (physics-based) | Optional validation |
| **Technique Scoring** | Basic score system | SurgicalTrainingSystem (5 metrics) | Port full system |
| **Procedure Library** | Implicit (3 levels) | Explicit (craniotomy, transsphenoidal, DBS) | Adapt for NeuroSim |
| **Voice Alerts** | N/A | Voice-ready messages | Implement in NeuroSim |
| **Session Recording** | N/A | Frame analysis history | Implement telemetry |
| **WebSocket Streaming** | N/A | Dashboard backend | Implement for mentor |

### 1.2 Safety System Comparison

| Feature | NeuroSim | NeuroVision | Notes |
|---------|----------|-------------|-------|
| **ICA Safety Margin** | 2mm warning, 0.5mm critical | 3mm boundary | Use NeuroVision's stricter margins |
| **MWCS Safety Margin** | 1mm warning, 0.2mm critical | 1mm boundary | Aligned |
| **Risk Levels** | safe/warning/danger/critical | safe/warning/danger/critical | Identical |
| **Audio Warnings** | Oscillator tones (440/660/880 Hz) | ElevenLabs TTS / pyttsx3 | Enhance with TTS |
| **Visual Indicators** | Colored spheres (debug mode) | Overlay contours | Keep both |

### 1.3 Scoring System Comparison

| Metric | NeuroSim (Current) | NeuroVision Training System |
|--------|-------------------|----------------------------|
| **Safety Score** | 100 - (collisions * penalty) | Weighted by proximity + contamination |
| **Accuracy Score** | N/A | Based on target deviation |
| **Efficiency Score** | N/A | Movement economy + time |
| **Technique Score** | N/A | Tissue handling + instrument use |
| **Time Score** | N/A | vs. expected duration per step |
| **Overall Grade** | Score 0-100 | A-F with weights (safety 30%, technique 20%, etc.) |

---

## 2. Code Portability Analysis

### 2.1 Directly Portable (TypeScript Conversion Required)

#### PerformanceMetrics

```python
# NeuroVision (Python)
@dataclass
class PerformanceMetrics:
    accuracy_score: float = 0.0
    efficiency_score: float = 0.0
    safety_score: float = 0.0
    technique_score: float = 0.0
    time_score: float = 0.0

    @property
    def overall_score(self) -> float:
        weights = {
            "accuracy": 0.25,
            "efficiency": 0.15,
            "safety": 0.30,
            "technique": 0.20,
            "time": 0.10
        }
        return sum(getattr(self, f"{k}_score") * v for k, v in weights.items())
```

```typescript
// NeuroSim (TypeScript port)
interface PerformanceMetrics {
  accuracyScore: number;
  efficiencyScore: number;
  safetyScore: number;
  techniqueScore: number;
  timeScore: number;
}

const SCORE_WEIGHTS = {
  accuracy: 0.25,
  efficiency: 0.15,
  safety: 0.30,
  technique: 0.20,
  time: 0.10
} as const;

function calculateOverallScore(metrics: PerformanceMetrics): number {
  return (
    metrics.accuracyScore * SCORE_WEIGHTS.accuracy +
    metrics.efficiencyScore * SCORE_WEIGHTS.efficiency +
    metrics.safetyScore * SCORE_WEIGHTS.safety +
    metrics.techniqueScore * SCORE_WEIGHTS.technique +
    metrics.timeScore * SCORE_WEIGHTS.time
  );
}

function getGrade(score: number): string {
  if (score >= 90) return "A - Excellent";
  if (score >= 80) return "B - Proficient";
  if (score >= 70) return "C - Competent";
  if (score >= 60) return "D - Developing";
  return "F - Needs Improvement";
}
```

#### ProcedureStep (Transsphenoidal)

```python
# NeuroVision procedure library (adapted for NeuroSim levels)
TRANSSPHENOIDAL_STEPS = [
    ProcedureStep(
        step_number=1,
        name="Nasal Entry",  # Level 1 in NeuroSim
        description="Navigate nasal cavity, identify middle turbinate and septum",
        critical=False,
        required_instruments=["Endoscope", "Suction"],
        safety_checks=["Turbinates preserved", "Septum intact"],
        assessment_criteria={
            "navigation_accuracy": 0.4,
            "tissue_preservation": 0.3,
            "efficiency": 0.3
        }
    ),
    ProcedureStep(
        step_number=2,
        name="Sphenoidotomy",  # Level 2 in NeuroSim
        description="Locate sphenoid ostium, open sphenoid sinus",
        critical=True,
        required_instruments=["Kerrison rongeur", "High-speed drill"],
        safety_checks=["Carotid identified", "Optic nerve protected"],
        assessment_criteria={
            "bone_removal_precision": 0.3,
            "safety_margin": 0.5,
            "exposure_quality": 0.2
        }
    ),
    ProcedureStep(
        step_number=3,
        name="Sellar Opening & Tumor Resection",  # Level 3 in NeuroSim
        description="Open sella, identify dura, resect tumor",
        critical=True,
        required_instruments=["Ring curettes", "Bipolar", "Angled endoscope"],
        safety_checks=[
            "ICA lateral margins identified",
            "CSF leak controlled",
            "Diaphragm intact"
        ],
        assessment_criteria={
            "extent_of_resection": 0.4,
            "safety": 0.4,
            "technique": 0.2
        }
    )
]
```

### 2.2 Requires Backend (Python)

| Module | Reason | Integration Approach |
|--------|--------|---------------------|
| `ClaudeVisionAnalyzer` | API key security, rate limiting | FastAPI backend |
| `NeuroimagingSegmenter` | OpenCV dependencies, CPU-intensive | Optional backend service |
| `SurgicalTrainingSystem` | Complex state management, persistence | Backend + REST API |
| `IntraoperativeNavigationAssistant` | Real-time streaming analysis | WebSocket endpoint |

### 2.3 Can Run Client-Side

| Module | Notes |
|--------|-------|
| Safety margin calculations | Pure math, port to TypeScript |
| Risk level determination | Threshold-based logic |
| Voice message generation | Text generation, use Web Speech API |
| Performance metrics | Calculation only, no external deps |

---

## 3. Integration Opportunities Roadmap

### Phase 1: Core Scoring System (Immediate)

**Goal**: Replace simple score with NeuroVision's comprehensive metrics.

```typescript
// src/components/3d/scoring/TechniqueScorer.ts

export interface SessionMetrics {
  // Imported from NeuroVision concept
  accuracy: {
    trajectoryDeviation: number;      // Average mm from optimal path
    targetPrecision: number;          // Distance from intended target
  };
  efficiency: {
    totalMovements: number;           // Scope position changes
    unnecessaryMovements: number;     // Movements that didn't advance goal
    pathLength: number;               // Total distance traveled
  };
  safety: {
    criticalProximityEvents: number;  // Times within danger zone
    collisionCount: number;           // Total tissue contacts
    icaMinDistance: number;           // Closest approach to ICA
  };
  technique: {
    smoothness: number;               // Acceleration variance
    steadiness: number;               // Position variance when stationary
  };
  time: {
    totalDuration: number;            // Seconds
    timeInCriticalZone: number;       // Seconds near critical structures
  };
}

export function calculateScores(metrics: SessionMetrics): PerformanceMetrics {
  return {
    accuracyScore: calculateAccuracyScore(metrics.accuracy),
    efficiencyScore: calculateEfficiencyScore(metrics.efficiency),
    safetyScore: calculateSafetyScore(metrics.safety),
    techniqueScore: calculateTechniqueScore(metrics.technique),
    timeScore: calculateTimeScore(metrics.time)
  };
}
```

### Phase 2: Procedure Library Integration (Week 2)

**Goal**: Map NeuroSim's 3 levels to NeuroVision's procedure steps.

```typescript
// src/data/procedureLibrary.ts

export interface ProcedureStep {
  stepNumber: number;
  name: string;
  description: string;
  critical: boolean;
  assessmentCriteria: Record<string, number>;  // criterion -> weight
  safetyChecks: string[];
  completionIndicators: string[];
}

export const TRANSSPHENOIDAL_PROCEDURE: ProcedureStep[] = [
  {
    stepNumber: 1,
    name: "Nasal Approach",
    description: "Navigate through nasal cavity to sphenoid ostium",
    critical: false,
    assessmentCriteria: {
      "navigation_accuracy": 0.4,
      "tissue_preservation": 0.3,
      "efficiency": 0.3
    },
    safetyChecks: [
      "Middle turbinate identified",
      "Septum not damaged"
    ],
    completionIndicators: [
      "Sphenoid ostium visualized",
      "No mucosal bleeding"
    ]
  },
  // ... more steps
];
```

### Phase 3: AI Mentor Integration (Week 3-4)

**Goal**: Bring NeuroVision's Claude Vision analysis to NeuroSim.

See: `AI_SURGICAL_MENTOR_ARCHITECTURE.md`

### Phase 4: Telemetry & Learning Curve (Week 5-6)

**Goal**: Track trainee progress across sessions.

```typescript
// src/services/telemetry/SessionRecorder.ts

export interface SessionRecord {
  sessionId: string;
  traineeId: string;
  procedure: string;
  startTime: Date;
  endTime: Date;

  // Trajectory data (sampled every 100ms)
  trajectory: TrajectoryPoint[];

  // Events
  collisions: CollisionEvent[];
  crises: CrisisEvent[];
  levelAdvances: LevelAdvanceEvent[];

  // Final metrics
  finalMetrics: PerformanceMetrics;
  grade: string;
}

export interface TrajectoryPoint {
  timestamp: number;
  position: Vector3D;
  angle: ScopeAngle;
  level: number;
  nearestCritical: { structure: string; distance: number } | null;
}
```

---

## 4. Synthetic Training Data Generation

### 4.1 NeuroSim Can Generate for NeuroVision

| Data Type | Generation Method | Use in NeuroVision |
|-----------|------------------|-------------------|
| **Labeled Endoscopic Frames** | Canvas.toDataURL() + known anatomy positions | Claude Vision fine-tuning examples |
| **Trajectory Datasets** | Record position/angle over time | Path efficiency model training |
| **Collision Events** | CollisionManager history | Safety violation pattern learning |
| **Expert vs. Novice Paths** | Supervised sessions | Technique classification |

### 4.2 Data Export Format

```json
{
  "session_id": "sim_20250122_001",
  "procedure": "transsphenoidal_pituitary",
  "frames": [
    {
      "frame_id": 1,
      "timestamp": 1705936800000,
      "image": "base64_jpeg...",
      "annotations": {
        "visible_structures": [
          {"name": "sphenoid_sinus", "bbox": [100, 100, 200, 200]},
          {"name": "ica_left", "bbox": [50, 150, 80, 180]}
        ],
        "scope_position": {"x": 0, "y": 0.3, "z": -6.8},
        "level": 2,
        "safety_zones": [
          {"structure": "ICA Left", "distance_mm": 2.5, "risk": "warning"}
        ]
      }
    }
  ],
  "events": [
    {"type": "collision", "timestamp": 1705936850000, "tissue": "BONE", "position": {...}},
    {"type": "level_advance", "timestamp": 1705936900000, "from": 2, "to": 3}
  ],
  "metrics": {
    "accuracy_score": 85,
    "efficiency_score": 72,
    "safety_score": 90,
    "technique_score": 78,
    "time_score": 65,
    "overall_score": 80.5,
    "grade": "B - Proficient"
  }
}
```

---

## 5. Shared Constants & Thresholds

### 5.1 Safety Margins (Unified)

```typescript
// Shared between NeuroSim and NeuroVision
export const SAFETY_MARGINS = {
  ICA: {
    safe: 3.0,      // mm - Green
    warning: 2.0,   // mm - Yellow
    danger: 1.0,    // mm - Orange
    critical: 0.5   // mm - Red
  },
  MWCS: {
    safe: 2.0,
    warning: 1.0,
    danger: 0.5,
    critical: 0.2
  },
  DURA: {
    safe: 1.5,
    warning: 1.0,
    danger: 0.5,
    critical: 0.2
  }
} as const;
```

### 5.2 Score Penalties (Unified)

```typescript
export const COLLISION_PENALTIES = {
  MUCOSA: 1,
  BONE: 3,
  DURA: 5,
  MWCS: 10,
  ICA: 100  // Catastrophic
} as const;
```

### 5.3 Phase Mapping

```typescript
// Map NeuroSim levels to NeuroVision surgical phases
export const LEVEL_TO_PHASE = {
  1: 'APPROACH',     // Nasal cavity navigation
  2: 'EXPOSURE',     // Sphenoid sinus opening
  3: 'RESECTION'     // Sellar access and tumor removal
} as const;

// NeuroVision phase for detailed tracking
export enum SurgicalPhase {
  PREPARATION = "preparation",
  POSITIONING = "positioning",
  APPROACH = "approach",
  EXPOSURE = "exposure",
  RESECTION = "resection",
  HEMOSTASIS = "hemostasis",
  CLOSURE = "closure"
}
```

---

## 6. API Contract (Backend-Frontend)

### 6.1 Session Management

```
POST /api/v1/session/start
  Request: { traineeId: string, procedure: string }
  Response: { sessionId: string, startTime: string }

POST /api/v1/session/{sessionId}/event
  Request: CollisionEvent | CrisisEvent | LevelAdvanceEvent
  Response: { acknowledged: true }

POST /api/v1/session/{sessionId}/end
  Request: { endTime: string }
  Response: SessionReport

GET /api/v1/session/{sessionId}/report
  Response: SessionReport with all metrics
```

### 6.2 AI Mentor

```
WebSocket /ws/mentor/stream
  Client -> Server: { imageData: string, metadata: FrameMetadata }
  Server -> Client: MentorFeedback

POST /api/v1/mentor/analyze (polling fallback)
  Request: { imageData: string, metadata: FrameMetadata }
  Response: MentorFeedback
```

### 6.3 Learning Curve

```
GET /api/v1/trainee/{traineeId}/progress
  Response: {
    sessionCount: number,
    scoreHistory: number[],
    improvementRate: number,
    weakAreas: string[],
    certificationReady: boolean
  }

GET /api/v1/trainee/{traineeId}/benchmark
  Response: {
    percentile: number,
    comparedTo: number,  // total trainees
    strengthsVsPopulation: string[],
    weaknessesVsPopulation: string[]
  }
```

---

## 7. Implementation Checklist

### Immediate (Can Start Now)
- [x] Create architecture document
- [x] Create integration analysis
- [ ] Port PerformanceMetrics to TypeScript
- [ ] Port safety margin constants
- [ ] Add TechniqueScorer service

### Short-Term (Week 1-2)
- [ ] Create FastAPI backend skeleton
- [ ] Implement session management endpoints
- [ ] Add WebSocket endpoint for mentor
- [ ] Create FrameCaptureService in frontend

### Medium-Term (Week 3-4)
- [ ] Integrate Claude Vision API
- [ ] Build MentorUI component
- [ ] Add voice alerts (Web Speech API)
- [ ] Implement procedure library

### Long-Term (Week 5-6)
- [ ] Session telemetry storage
- [ ] Learning curve analysis
- [ ] Benchmarking system
- [ ] Synthetic data export for NeuroVision

---

## 8. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Claude API rate limits | Implement caching, throttling at 2 req/sec |
| High API costs | Cache similar contexts, batch analysis |
| WebSocket reliability | HTTP polling fallback |
| Frame capture performance | Capture at 2 FPS, not 60 FPS |
| Backend availability | Graceful degradation to basic scoring |
