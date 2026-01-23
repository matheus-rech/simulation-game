# Architecture Summary: Phase 1B & 1C

**Quick Reference Guide for Implementation**

---

## Overview

This document summarizes the architectural design for adding **Technique Scoring** and **Curriculum Mode** to NeuroSim. Full details in `ARCHITECTURE_PHASE1BC.md` and `ARCHITECTURE_DIAGRAMS.md`.

---

## Phase 1B: Technique Scoring System

### What It Does

Provides comprehensive surgical technique assessment with **4 scoring components**:

1. **Accuracy** (35% weight): Based on collision count and clean dissection
2. **Efficiency** (25% weight): Path optimization and economy of motion
3. **Safety** (30% weight): Proximity events to critical structures
4. **Method** (10% weight): Protocol adherence and systematic approach

**Overall Score**: 0-100 (weighted average of components)

### Key Components

```typescript
// Primary Hook
const scoring = useTechniqueScoring({
  level,
  onScoreUpdate: setTechniqueScore,
  enablePersistence: true,
});

// Record Events
scoring.recordCollision(event);           // From CollisionManager
scoring.recordProximityEvent(zone);       // From SafetyCorridorManager
scoring.recordPosition(tipPosition, ts);  // Every 100ms

// Get Current Score
const score = scoring.getCurrentScore();
```

### Implementation Files

```
src/components/3d/scoring/
├── TechniqueScorer.ts          # Core scoring engine (class)
├── useTechniqueScoring.ts      # React hook (orchestrator)
├── ScoringPersistence.ts       # localStorage persistence
├── types.ts                    # TypeScript interfaces
└── __tests__/
    ├── TechniqueScorer.test.ts
    └── useTechniqueScoring.test.tsx

src/utils/
└── RingBuffer.ts               # Trajectory storage utility

src/components/ui/
└── TechniqueScoreHUD.tsx       # Score display component
```

### Performance Targets

- **Scoring Overhead**: <10ms per calculation
- **Memory Usage**: <10KB per session (ring buffer for trajectory)
- **Update Frequency**: 1 second (cached for 500ms)
- **Frame Rate**: Maintain 60 FPS

### Integration Points

1. **App.tsx**: Add `useTechniqueScoring` hook, wire up callbacks
2. **CollisionManager**: Pass collision events to scoring system
3. **SafetyCorridorManager**: Pass proximity events to scoring system
4. **Position Tracking**: Record endoscope position every 100ms

---

## Phase 1C: Curriculum Mode

### What It Does

Provides structured learning pathway with **3 progressive modules**:

1. **Module 1**: Anatomical Recognition (Level 1 - Sphenoid Sinus)
2. **Module 2**: Tumor Debulking (Level 2 - Non-invasive adenoma)
3. **Module 3**: MWCS Decision Making (Level 3 - Invasive tumor)

**Outcome**: Digital certification upon completing all modules

### State Machine

```
NOT_ENROLLED → BRIEFING → SIMULATING ⇄ PAUSED
                             ↓
                          REVIEW
                             ↓
              ┌──────────────┴──────────────┐
              ↓                              ↓
           PASSED                         FAILED
              ↓                              ↓
         Next Module                      Retry
              ↓
         CERTIFIED (after Module 3)
```

### Key Components

```typescript
// Primary Hook
const curriculum = useCurriculum({
  userId,
  level,
  techniqueScore,
  onStateChange,
});

// Actions
curriculum.enroll();              // Start curriculum
curriculum.startSimulation();     // Begin module
curriculum.completeSimulation();  // Finish attempt
curriculum.evaluateAttempt();     // Check success criteria
curriculum.nextModule();          // Advance to next
```

### Implementation Files

```
src/components/curriculum/
├── CurriculumScreen.tsx        # Main screen (state router)
├── useCurriculum.ts            # State machine hook
├── CurriculumPersistence.ts    # Progress & certification storage
├── modules.ts                  # Module definitions
├── types.ts                    # TypeScript interfaces
├── screens/
│   ├── EnrollmentScreen.tsx
│   ├── ModuleBriefingScreen.tsx
│   ├── SimulationScreen.tsx
│   ├── ReviewScreen.tsx
│   ├── SuccessScreen.tsx
│   ├── FailureScreen.tsx
│   └── CertificationScreen.tsx
└── __tests__/
    ├── useCurriculum.test.ts
    └── CurriculumScreen.test.tsx
```

### Module Success Criteria

| Module | Min Score | Max Collisions | Max Critical | Min Safety | Method Steps |
|--------|-----------|----------------|--------------|------------|--------------|
| 1      | 75        | 10             | 0            | 80         | 100%         |
| 2      | 75        | 8              | 0            | 75         | 90%          |
| 3      | 80        | 5              | 0            | 85         | 95%          |

### Integration with App.tsx

```typescript
// Add mode selector
const [mode, setMode] = useState<'free_practice' | 'curriculum'>('free_practice');

return (
  <div>
    {mode === 'free_practice' ? (
      <FreePracticeMode />  // Existing simulation
    ) : (
      <CurriculumScreen />  // New curriculum mode
    )}
  </div>
);
```

---

## Implementation Roadmap

### Week 1-2: Phase 1B Core

- [ ] Implement `TechniqueScorer` class with all 4 scoring components
- [ ] Implement `RingBuffer` utility for trajectory storage
- [ ] Create `useTechniqueScoring` hook
- [ ] Write unit tests (target 90% coverage)

### Week 3: Phase 1B Integration

- [ ] Implement `ScoringPersistence` (localStorage)
- [ ] Create `TechniqueScoreHUD` component
- [ ] Integrate with `CollisionManager` and `SafetyCorridorManager`
- [ ] Add to `App.tsx` with position tracking

### Week 4: Phase 1B Polish

- [ ] Performance profiling and optimization
- [ ] Visual design polish for HUD
- [ ] Documentation and examples
- [ ] User testing and feedback

### Week 5-6: Phase 1C Data & Logic

- [ ] Define curriculum modules in `modules.ts`
- [ ] Implement `useCurriculum` state machine
- [ ] Implement success criteria validation
- [ ] Write state machine tests

### Week 7-8: Phase 1C UI

- [ ] Create all screen components
- [ ] Implement `CurriculumScreen` router
- [ ] Add mode selector to `App.tsx`
- [ ] Integration testing

### Week 9: Phase 1C Certification

- [ ] Implement `CurriculumPersistence`
- [ ] Create `CertificationScreen` with export
- [ ] User flow testing (E2E)
- [ ] Documentation

---

## Key Design Decisions

### Why Centralized State (App.tsx)?

- Matches current architecture pattern
- Simple to implement and test
- No new dependencies (Redux/Zustand)
- Easy migration to Context/state library later if needed

### Why Ring Buffer for Trajectory?

- **Problem**: Unbounded trajectory history causes memory growth
- **Solution**: Fixed-size circular buffer (1000 points ≈ 4KB)
- **Benefit**: Predictable memory usage, still enough data for analysis

### Why 1-Second Scoring Updates?

- **Real-time enough**: Users see feedback quickly
- **Performance**: Scoring calculation in background, doesn't block render
- **Caching**: 500ms cache prevents redundant calculations

### Why localStorage First?

- **Simple**: No backend required for Phase 1
- **Sufficient**: Works for single-user local sessions
- **Migratable**: Easy to swap with backend API later

### Why State Machine for Curriculum?

- **Clear transitions**: All state changes explicit and testable
- **Error handling**: Guards prevent invalid transitions
- **Maintainable**: Easy to add new states/modules later

---

## Testing Strategy

### Unit Tests (Target 90% Coverage)

**Scoring System:**
- [ ] `TechniqueScorer.calculateAccuracy()`
- [ ] `TechniqueScorer.calculateEfficiency()`
- [ ] `TechniqueScorer.calculateSafety()`
- [ ] `TechniqueScorer.calculateMethod()`
- [ ] `TechniqueScorer.calculateScore()` (weighted average)
- [ ] `RingBuffer` operations (push, toArray, size, clear)

**Curriculum System:**
- [ ] `useCurriculum` state transitions
- [ ] `checkSuccessCriteria()` validation
- [ ] `CurriculumPersistence` save/load
- [ ] Module progression logic

### Integration Tests

- [ ] Scoring + CollisionManager integration
- [ ] Scoring + SafetyCorridorManager integration
- [ ] Curriculum + Scoring integration
- [ ] Persistence layer (localStorage mocking)

### E2E Tests

- [ ] Complete module workflow (briefing → simulation → review → pass/fail)
- [ ] Retry mechanism after failure
- [ ] Multi-module progression
- [ ] Certification generation and export

---

## Performance Monitoring

```typescript
// Add to development mode
const ScoringMetrics = {
  scoreCalculationTime: 0,
  trajectoryUpdateTime: 0,
  persistenceTime: 0,
  totalOverhead: 0,
};

// Measure in TechniqueScorer
const startTime = performance.now();
const score = this.calculateScore();
ScoringMetrics.scoreCalculationTime = performance.now() - startTime;

// Log to console
console.table(ScoringMetrics);
```

**Alerts:**
- If `scoreCalculationTime > 10ms` → optimize calculation
- If `totalOverhead > 16ms` → risk of frame drops
- If trajectory buffer exceeds 10KB → reduce buffer size

---

## Future Enhancements (Phase 2/3)

### AI Integration Preparation

**Already designed for easy integration:**

```typescript
// Data pipeline for AI coaching
export interface AICoachingInput {
  techniqueScore: TechniqueScore;
  recentTrajectory: TrajectoryPoint[];
  screenshot?: string;
  userQuery?: string;
}

export interface AICoachingResponse {
  feedback: string;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  nextAction?: string;
}

// Future: Claude Vision API
class AICoachingAPI {
  static async getCoaching(input: AICoachingInput): Promise<AICoachingResponse> {
    // Backend API call
  }
}
```

### Backend API Design

```typescript
// RESTful endpoints (design ready)
POST   /api/v1/scores         // Save technique score
POST   /api/v1/coaching       // Request AI feedback
POST   /api/v1/telemetry      // Upload training data
GET    /api/v1/leaderboard    // Fetch rankings
```

### Multiplayer Architecture

```typescript
// WebSocket-based multiplayer (designed, not implemented)
interface MultiplayerSession {
  sessionId: string;
  participants: ParticipantInfo[];
  sharedState: SharedSessionState;
}

// Instructor observing student in real-time
// Collaborative training sessions
```

---

## Common Pitfalls to Avoid

### 1. Scoring in Render Loop

❌ **Don't do this:**
```typescript
useFrame(() => {
  const score = scorer.calculateScore(); // Every frame!
});
```

✅ **Do this instead:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    const score = scorer.calculateScore(); // Every 1 second
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

### 2. Unbounded Trajectory History

❌ **Don't do this:**
```typescript
const trajectory: TrajectoryPoint[] = []; // Grows forever
trajectory.push(newPoint);
```

✅ **Do this instead:**
```typescript
const trajectory = new RingBuffer<TrajectoryPoint>(1000); // Fixed size
trajectory.push(newPoint); // Automatically overwrites oldest
```

### 3. Blocking Persistence

❌ **Don't do this:**
```typescript
scoring.recordCollision(event);
ScoringPersistence.saveScore(score); // Blocks on every collision
```

✅ **Do this instead:**
```typescript
// Autosave periodically
setInterval(() => {
  ScoringPersistence.autosave(currentScore);
}, 5000); // Every 5 seconds
```

### 4. Missing State Transitions

❌ **Don't do this:**
```typescript
// Directly mutate state
curriculumState = CurriculumState.PASSED;
```

✅ **Do this instead:**
```typescript
// Use state machine transitions
curriculum.evaluateAttempt(); // Validates and transitions
```

---

## Quick Start Commands

```bash
# Install dependencies (none needed - uses existing)
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- TechniqueScorer

# Type checking
npm run type-check

# Build production
npm run build
```

---

## FAQ

### Q: Can I implement Phase 1B and 1C in parallel?

**A**: Yes! They are independent systems:
- **Phase 1B** (Scoring): Depends on CollisionManager + SafetyCorridorManager
- **Phase 1C** (Curriculum): Depends on Phase 1B (needs TechniqueScore for validation)

**Recommendation**: Implement Phase 1B first, then Phase 1C uses it.

### Q: Do I need to modify existing components?

**A**: Minimal changes:
- `App.tsx`: Add hooks, wire up callbacks
- `CollisionManager.tsx`: No changes (already provides callbacks)
- `SafetyCorridorManager.tsx`: No changes (already provides callbacks)
- `EndoscopeView.tsx`: No changes

All new functionality in separate directories.

### Q: How do I test scoring without playing through simulation?

**A**: Create unit tests with mock data:

```typescript
const scorer = new TechniqueScorer(config, sessionId, level);

// Simulate collisions
scorer.recordCollision({
  position: { x: 0, y: 0, z: 0 },
  tissueType: TissueType.ICA,
  timestamp: Date.now(),
  intensity: 1.0,
});

// Get score
const score = scorer.calculateScore();
expect(score.accuracy.score).toBeLessThan(100);
```

### Q: What if localStorage quota is exceeded?

**A**: Implement cleanup logic:

```typescript
// In ScoringPersistence
static cleanup() {
  const scores = this.loadAllScores();
  // Keep only recent 50 scores
  const recent = scores.slice(-50);
  localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recent));
}
```

Call `cleanup()` periodically or on quota exceeded error.

### Q: How do I customize scoring weights?

**A**: Pass custom config to `useTechniqueScoring`:

```typescript
const customConfig: Partial<ScoringConfig> = {
  weights: {
    accuracy: 0.40,   // Emphasize accuracy more
    efficiency: 0.20,
    safety: 0.30,
    method: 0.10,
  },
};

const scoring = useTechniqueScoring({
  level,
  config: customConfig,
  onScoreUpdate: setTechniqueScore,
});
```

### Q: Can I add custom curriculum modules?

**A**: Yes! Edit `modules.ts`:

```typescript
export const CURRICULUM_MODULES: CurriculumModule[] = [
  // ... existing modules ...
  {
    id: 'module_4_custom',
    name: 'Module 4: Custom Training',
    level: 2,
    objectives: [/* ... */],
    successCriteria: {/* ... */},
    // ...
  },
];
```

The `useCurriculum` hook will automatically include it.

---

## Support & Documentation

- **Full Architecture**: `ARCHITECTURE_PHASE1BC.md` (68 pages, detailed)
- **Visual Diagrams**: `ARCHITECTURE_DIAGRAMS.md` (architecture diagrams)
- **This Summary**: `ARCHITECTURE_SUMMARY.md` (quick reference)
- **Testing Guide**: `TESTING.md` (existing, comprehensive)
- **Project Context**: `CLAUDE.md` (existing, project overview)

---

## Next Steps

1. **Review** architecture documents with team
2. **Decide** on Phase 1B vs 1C priority (or parallel)
3. **Set up** project board with tasks from roadmap
4. **Assign** implementation work
5. **Begin** with Phase 1B core scoring engine

**Estimated Timeline**:
- Phase 1B: 4 weeks (2 developers)
- Phase 1C: 5 weeks (2 developers)
- Total: 9 weeks if sequential, 5-6 weeks if parallel

---

**Document Version**: 1.0
**Last Updated**: 2026-01-22
**Author**: Backend System Architect

**Related Documents**:
- `ARCHITECTURE_PHASE1BC.md` - Detailed specification
- `ARCHITECTURE_DIAGRAMS.md` - Visual architecture diagrams
