# NeuroSim Testing & Quality Assurance Strategy

**Comprehensive testing strategy for NeuroSim medical training simulator**

## Test Suite Status

### Current Coverage (January 2026)

**Total Tests**: 164 (100% passing ✅)

| Test Suite | Tests | Status | Coverage |
|------------|-------|--------|----------|
| ProceduralGeometry.test.ts | 29 | ✅ Passing | 97.77% |
| CSGOperations.test.ts | 38 | ✅ Passing | 80% |
| CollisionManager.test.tsx | 26 | ✅ Passing | 94.44% |
| SafetyCorridorManager.test.tsx | 42 | ✅ Passing | New |
| SafetyHUD.test.tsx | 29 | ✅ Passing | New |

**Overall Code Coverage**: 87.5%

### Framework

- **Test Runner**: Vitest 4.0.17
- **React Testing**: @testing-library/react
- **Environment**: happy-dom (WebGL mocking)
- **CI/CD**: Ready for integration

---

## Phase 1A: Safety Corridor System (✅ Complete)

### Components Tested

#### 1. SafetyCorridorManager.tsx (42 tests)

**Unit Tests**:
- ✅ SAFETY_MARGINS constants validation
- ✅ RiskLevel enum definitions
- ✅ Distance calculations (ICA, MWCS, Dura)
- ✅ Risk level determination logic
- ✅ Audio warning system
- ✅ State updates and callbacks

**Performance Tests**:
- ✅ 300 calculations/second (60 FPS × 5 structures)
- ✅ Distance calculation efficiency (<10ms for 1000 calcs)

**Edge Cases**:
- ✅ Zero distance (collision)
- ✅ Very large distances (>1000mm)
- ✅ Rapid position updates
- ✅ Undefined structure positions

**Hook Tests** (`useSafetyCorridor`):
- ✅ Empty state initialization
- ✅ Highest risk calculation
- ✅ Closest structure detection
- ✅ Zone updates via callback

#### 2. SafetyHUD.tsx (29 tests)

**Display Accuracy**:
- ✅ Visibility control (visible/hidden)
- ✅ Full mode vs compact mode
- ✅ Distance formatting (1 decimal precision)
- ✅ All structure display

**Color-Coded Warnings**:
- ✅ Green for SAFE (🟢)
- ✅ Yellow for WARNING (🟡)
- ✅ Orange for DANGER (🟠)
- ✅ Red for CRITICAL (🔴)

**Overall Risk Assessment**:
- ✅ Priority: CRITICAL > DANGER > WARNING > SAFE
- ✅ Empty state handling

**UI Features**:
- ✅ Critical warning banner
- ✅ Safety guidelines display
- ✅ Compact mode (closest structure only)

---

## Phase 1B: Technique Scoring System (Planned)

### Components to Test

#### 1. TechniqueEvaluator (Target: 30 tests)

**Core Metrics**:
```typescript
describe('TechniqueEvaluator', () => {
  describe('Accuracy Scoring', () => {
    it('should penalize collisions based on tissue type')
    it('should reward clean dissection (zero collisions)')
    it('should calculate cumulative accuracy score')
    it('should apply intensity-based scoring')
  })

  describe('Efficiency Scoring', () => {
    it('should calculate path efficiency vs. optimal path')
    it('should detect unnecessary movements')
    it('should measure total procedure time')
    it('should penalize excessive scope repositioning')
  })

  describe('Safety Scoring', () => {
    it('should track proximity events to critical structures')
    it('should penalize dangerous approaches')
    it('should reward maintaining safe corridors')
    it('should apply crisis penalties (ICA, CSF leak)')
  })

  describe('Method Scoring', () => {
    it('should validate protocol adherence')
    it('should detect systematic vs. random approach')
    it('should track checkpoint completion order')
    it('should reward correct anatomical navigation')
  })

  describe('Composite Score', () => {
    it('should compute weighted average (40/30/20/10)')
    it('should normalize to 0-100 scale')
    it('should provide detailed breakdown')
    it('should handle edge cases (perfect/zero scores)')
  })
})
```

#### 2. TrajectoryAnalyzer (Target: 25 tests)

```typescript
describe('TrajectoryAnalyzer', () => {
  describe('Path Tracking', () => {
    it('should record 3D position history')
    it('should calculate total path length')
    it('should detect backtracking')
    it('should identify hesitation zones')
  })

  describe('Efficiency Metrics', () => {
    it('should compare actual vs. optimal path')
    it('should calculate straightness index')
    it('should measure angular velocity')
    it('should detect tremor (high-frequency movement)')
  })

  describe('Safety Analysis', () => {
    it('should track distance to critical structures over time')
    it('should identify close calls')
    it('should calculate minimum safe distance maintained')
  })

  describe('Performance', () => {
    it('should handle 1000+ position samples efficiently')
    it('should compute metrics in <5ms')
  })
})
```

#### 3. ScoreCalculator (Target: 20 tests)

```typescript
describe('ScoreCalculator', () => {
  describe('Weight System', () => {
    it('should apply default weights (40/30/20/10)')
    it('should support custom weight profiles')
    it('should normalize weights to sum to 100%')
  })

  describe('Grade Calculation', () => {
    it('should assign letter grades (A/B/C/D/F)')
    it('should determine pass/fail (70% threshold)')
    it('should provide grade boundaries')
  })

  describe('Feedback Generation', () => {
    it('should identify top strengths')
    it('should identify improvement areas')
    it('should provide actionable recommendations')
  })

  describe('Comparison', () => {
    it('should compare to expert benchmarks')
    it('should show percentile ranking')
    it('should track improvement over time')
  })
})
```

### Test Scenarios

**Scenario 1: Perfect Execution**
- Zero collisions
- Optimal path (100% efficiency)
- No proximity warnings
- All checkpoints in order
- **Expected Score**: 95-100

**Scenario 2: Competent with Minor Errors**
- 2-3 minor collisions (mucosa, bone)
- Path efficiency 85%
- 1-2 proximity warnings
- Correct sequence
- **Expected Score**: 75-85

**Scenario 3: Struggling Trainee**
- 10+ collisions including critical tissues
- Path efficiency 60%
- Multiple proximity warnings
- Skipped checkpoints
- **Expected Score**: 40-60

**Scenario 4: Critical Failure**
- ICA injury
- **Expected Score**: 0 (immediate failure)

---

## Phase 1C: Curriculum System (Planned)

### Components to Test

#### 1. CurriculumManager (Target: 35 tests)

```typescript
describe('CurriculumManager', () => {
  describe('Module Progression', () => {
    it('should enforce prerequisites (Module 1 → 2 → 3)')
    it('should track completion status per module')
    it('should unlock next module on success')
    it('should keep subsequent modules locked on failure')
    it('should handle partial completion (save progress)')
  })

  describe('Success Criteria', () => {
    it('should validate minimum score requirement (70%)')
    it('should check collision limits (<5 collisions)')
    it('should detect critical errors (ICA injury = fail)')
    it('should validate time limits per module')
    it('should require all checkpoints completed')
  })

  describe('Certification', () => {
    it('should grant certification on all modules complete')
    it('should require 70%+ average across modules')
    it('should issue certification ID')
    it('should export certification report PDF')
  })

  describe('Retry Logic', () => {
    it('should allow retry on failure')
    it('should limit maximum attempts (3 per module)')
    it('should track best score across attempts')
    it('should reset module state on retry')
  })

  describe('Progress Persistence', () => {
    it('should save progress to localStorage')
    it('should restore progress on reload')
    it('should handle corrupted save data')
  })
})
```

#### 2. ModuleDefinitions (Target: 15 tests)

```typescript
describe('ModuleDefinitions', () => {
  describe('Module 1: Nasal Approach', () => {
    it('should define correct anatomy (nasal cavity, sphenoid ostium)')
    it('should set beginner difficulty')
    it('should have appropriate time limit (15 min)')
    it('should define 5 checkpoints')
  })

  describe('Module 2: Sphenoid Sinus Navigation', () => {
    it('should require Module 1 completion')
    it('should include septations and sella floor')
    it('should set intermediate difficulty')
    it('should have stricter success criteria')
  })

  describe('Module 3: Sellar Opening & Tumor Resection', () => {
    it('should require Module 2 completion')
    it('should include all critical structures')
    it('should set advanced difficulty')
    it('should have tightest success criteria')
  })
})
```

#### 3. ProgressTracker (Target: 20 tests)

```typescript
describe('ProgressTracker', () => {
  describe('Session Tracking', () => {
    it('should record session start time')
    it('should track total practice time')
    it('should count total attempts per module')
    it('should store best scores')
  })

  describe('Learning Analytics', () => {
    it('should calculate improvement rate')
    it('should identify weak areas')
    it('should suggest targeted practice')
  })

  describe('Statistics', () => {
    it('should show completion rate per module')
    it('should calculate average score trend')
    it('should track collision rate over time')
  })
})
```

### Integration Test Scenarios

**Scenario 1: Complete Curriculum Flow**
1. Start Module 1
2. Complete with 75% score
3. Module 2 unlocks
4. Complete with 80% score
5. Module 3 unlocks
6. Complete with 72% score
7. Certification granted

**Scenario 2: Failure and Retry**
1. Attempt Module 1
2. Fail (score 65%)
3. Retry (attempt 2)
4. Pass (score 75%)
5. Module 2 unlocks

**Scenario 3: Critical Failure**
1. Attempt Module 3
2. ICA injury occurs
3. Immediate failure (score 0)
4. Module remains locked until retry

**Scenario 4: Progress Persistence**
1. Complete Module 1 (75%)
2. Close browser
3. Reopen simulator
4. Module 1 marked complete
5. Module 2 still unlocked
6. Scores preserved

---

## Integration Testing Strategy

### End-to-End Scenarios

#### E2E 1: Complete Surgical Procedure (Level 1 → 3)

```typescript
describe('E2E: Complete Procedure', () => {
  it('should navigate through all surgical levels', async () => {
    // 1. Start at Level 1 (nasal approach)
    const { getByText } = render(<App />);
    expect(getByText(/Level 1/i)).toBeDefined();

    // 2. Navigate to sphenoid ostium
    // ... simulate scope movement

    // 3. Advance to Level 2
    await userEvent.click(getByText(/Next Level/i));
    expect(getByText(/Level 2/i)).toBeDefined();

    // 4. Navigate sphenoid sinus
    // ...

    // 5. Advance to Level 3
    await userEvent.click(getByText(/Next Level/i));
    expect(getByText(/Level 3/i)).toBeDefined();

    // 6. Complete tumor resection
    // ...

    // 7. Verify final score
    expect(getByText(/Procedure Complete/i)).toBeDefined();
  });
});
```

#### E2E 2: Safety Corridor Warnings

```typescript
describe('E2E: Safety Warnings', () => {
  it('should trigger audio/visual warnings on approach to ICA', async () => {
    const audioSpy = vi.spyOn(window.AudioContext.prototype, 'createOscillator');

    // 1. Position scope near ICA
    simulateScopeMovement({ x: -0.9, y: 0.3, z: -7.3 });

    // 2. Verify HUD shows WARNING
    expect(screen.getByText(/WARNING/i)).toBeDefined();

    // 3. Verify audio warning played
    expect(audioSpy).toHaveBeenCalled();

    // 4. Move closer (DANGER zone)
    simulateScopeMovement({ x: -0.85, y: 0.3, z: -7.3 });

    // 5. Verify escalated warning
    expect(screen.getByText(/DANGER/i)).toBeDefined();
  });
});
```

#### E2E 3: Crisis Scenarios

```typescript
describe('E2E: Crisis Handling', () => {
  it('should handle ICA injury crisis', async () => {
    // 1. Collide with ICA
    simulateCollision({ x: -0.9, y: 0.3, z: -7.3 }, TissueType.ICA);

    // 2. Verify crisis overlay appears
    expect(screen.getByText(/CRITICAL.*Internal Carotid Artery/i)).toBeDefined();

    // 3. Verify score drops to 0
    expect(screen.getByText(/Score: 0/i)).toBeDefined();

    // 4. Verify procedure cannot continue
    expect(screen.getByText(/Procedure Failed/i)).toBeDefined();
  });

  it('should handle CSF leak crisis', async () => {
    // 1. Collide with dura multiple times (trigger probabilistic event)
    for (let i = 0; i < 50; i++) {
      simulateCollision({ x: 0, y: 0.4, z: -7.2 }, TissueType.DURA);
    }

    // 2. Verify CSF leak detected (should occur at least once)
    expect(screen.getByText(/CSF Leak/i)).toBeDefined();
  });
});
```

#### E2E 4: Curriculum Completion

```typescript
describe('E2E: Curriculum Mode', () => {
  it('should complete full certification pathway', async () => {
    // 1. Start curriculum mode
    await userEvent.click(screen.getByText(/Curriculum Mode/i));

    // 2. Complete Module 1
    await completeModule(1, { score: 80 });

    // 3. Verify Module 2 unlocked
    expect(screen.getByText(/Module 2.*Unlocked/i)).toBeDefined();

    // 4. Complete Module 2
    await completeModule(2, { score: 78 });

    // 5. Verify Module 3 unlocked
    expect(screen.getByText(/Module 3.*Unlocked/i)).toBeDefined();

    // 6. Complete Module 3
    await completeModule(3, { score: 75 });

    // 7. Verify certification granted
    expect(screen.getByText(/Certified/i)).toBeDefined();
    expect(screen.getByText(/Certification ID:/i)).toBeDefined();
  });
});
```

---

## Performance Testing

### Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| Frame Rate | 60 FPS | ✅ 60 FPS |
| Memory Usage | <100MB | ✅ <100MB |
| Safety Calculations | <1ms per frame | ✅ 0.5ms |
| Collision Detection | <250ms debounce | ✅ 250ms |
| Load Time | <3s | ⚠️ Monitor |

### Performance Test Suite

```typescript
describe('Performance Benchmarks', () => {
  it('should maintain 60 FPS during normal use', () => {
    const frameMetrics = [];

    for (let i = 0; i < 600; i++) { // 10 seconds at 60 FPS
      const frameStart = performance.now();

      // Simulate frame (render, physics, safety checks)
      simulateFrame();

      const frameDuration = performance.now() - frameStart;
      frameMetrics.push(frameDuration);
    }

    const averageFPS = 1000 / (frameMetrics.reduce((a, b) => a + b) / frameMetrics.length);
    expect(averageFPS).toBeGreaterThan(58); // Allow 2 FPS margin
  });

  it('should not leak memory over 10-minute session', () => {
    const initialMemory = performance.memory.usedJSHeapSize;

    // Simulate 10 minutes (600 seconds)
    for (let i = 0; i < 36000; i++) { // 60 FPS * 600s
      simulateFrame();
    }

    const finalMemory = performance.memory.usedJSHeapSize;
    const memoryIncrease = finalMemory - initialMemory;

    // Allow <20MB growth over 10 minutes
    expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
  });

  it('should calculate safety zones in <1ms per frame', () => {
    const scopeTip = new Vector3(0, 0, -5);
    const structures = {
      icaLeft: new Vector3(-0.9, 0.3, -7.3),
      icaRight: new Vector3(0.9, 0.3, -7.3),
      mwcsLeft: new Vector3(-1.0, 0.3, -7.3),
      mwcsRight: new Vector3(1.0, 0.3, -7.3),
      dura: new Vector3(0, 0.4, -7.2),
    };

    const startTime = performance.now();

    for (let i = 0; i < 60; i++) { // 1 second at 60 FPS
      calculateSafetyZones(scopeTip, structures);
    }

    const duration = performance.now() - startTime;
    const averagePerFrame = duration / 60;

    expect(averagePerFrame).toBeLessThan(1); // <1ms per frame
  });

  it('should handle 100 particles without FPS drop', () => {
    const { fps: baselineFPS } = measureFPS(() => simulateFrame());

    // Add 100 bleeding particles
    for (let i = 0; i < 100; i++) {
      addBleedingParticle({ x: 0, y: 0, z: 0 });
    }

    const { fps: particleFPS } = measureFPS(() => simulateFrame());

    // Allow <5 FPS drop
    expect(baselineFPS - particleFPS).toBeLessThan(5);
  });
});
```

---

## Visual Regression Testing

### Snapshot Testing Strategy

**Key UI Components to Snapshot**:
- SafetyHUD (all risk levels)
- Crisis overlays (ICA, CSF leak)
- Score display
- Level advancement UI
- Curriculum progress screen

```typescript
describe('Visual Regression', () => {
  it('should match SafetyHUD snapshot (SAFE state)', () => {
    const zones: SafetyZone[] = [/* safe zones */];
    const { container } = render(<SafetyHUD safetyZones={zones} />);
    expect(container).toMatchSnapshot();
  });

  it('should match SafetyHUD snapshot (CRITICAL state)', () => {
    const zones: SafetyZone[] = [/* critical zones */];
    const { container } = render(<SafetyHUD safetyZones={zones} />);
    expect(container).toMatchSnapshot();
  });

  it('should match crisis overlay snapshot (ICA injury)', () => {
    const { container } = render(<CrisisOverlay type={CrisisType.ICA_INJURY} />);
    expect(container).toMatchSnapshot();
  });
});
```

---

## Test Coverage Goals

| Module | Current | Target |
|--------|---------|--------|
| **Overall** | 87.5% | 90%+ |
| Critical Paths (collision, safety) | 94%+ | 95%+ |
| UI Components | 60% | 80% |
| Utilities | 90%+ | 95%+ |
| New Features (Phase 1B/1C) | 0% | 85%+ |

### Coverage Tracking

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html

# CI/CD integration
vitest --coverage --reporter=json
```

---

## CI/CD Pipeline Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Quality Gates

- ✅ All tests must pass
- ✅ Coverage must be ≥87.5%
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Build must succeed

---

## Testing Best Practices

### 1. Test Organization

```typescript
describe('ComponentName', () => {
  // Group related tests
  describe('Feature Group', () => {
    beforeEach(() => {
      // Setup
    });

    it('should do something specific', () => {
      // Test
    });
  });
});
```

### 2. Test Naming

- Use descriptive names: `should calculate risk level correctly`
- Follow pattern: `should [expected behavior] when [condition]`
- Be specific: `should return CRITICAL when distance < 0.5mm`

### 3. Mocking

```typescript
// Mock callbacks
const mockOnChange = vi.fn();

// Mock WebGL context (already in test/setup.ts)
HTMLCanvasElement.prototype.getContext = vi.fn();

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
});
```

### 4. Assertions

```typescript
// Prefer specific assertions
expect(value).toBe(42);
expect(value).toBeCloseTo(3.14, 2);
expect(object).toEqual(expectedObject);

// Avoid vague assertions
expect(value).toBeTruthy(); // ❌ What is truthy?
expect(value).toBe(true);   // ✅ Clear expectation
```

### 5. Test Independence

- Each test should be independent
- Use `beforeEach` for setup, not shared state
- Clean up after tests (timers, mocks)

---

## Future Testing Initiatives

### Phase 2: Advanced Features

1. **AI Mentor System**
   - Real-time feedback accuracy (95%+ match with expert)
   - Response time (<1s for suggestions)
   - Pedagogical effectiveness (user study required)

2. **Multiplayer Collaboration**
   - Network synchronization accuracy
   - Latency handling (<100ms)
   - Conflict resolution

3. **VR Support**
   - Stereoscopic rendering
   - Hand tracking accuracy
   - Motion sickness prevention

### Phase 3: Accessibility

- Screen reader compatibility
- Keyboard navigation
- Color-blind friendly UI
- Configurable font sizes

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- SafetyCorridorManager

# Run with coverage
npm run test:coverage

# Watch mode (auto-rerun on changes)
npm test -- --watch

# Interactive UI
npm run test:ui

# Run tests matching pattern
npm test -- --grep "collision"

# Run only changed files
npm test -- --changed
```

---

## Troubleshooting

### Common Issues

1. **THREE.WARNING: Multiple instances**
   - This is expected in Vitest (separate imports per test file)
   - Harmless - tests still pass correctly

2. **WebGL context errors**
   - Ensure `test/setup.ts` is loaded
   - Check `getContext` mock is in place

3. **Timing issues**
   - Use `vi.useFakeTimers()` and `vi.advanceTimersByTime()`
   - Always advance past debounce periods (250ms for collisions)

4. **Flaky probabilistic tests**
   - Use loop with sufficient iterations (e.g., 50 tries for 30% probability)
   - Set seed for deterministic randomness when possible

---

## Test Summary

**Current Status**: ✅ 164 tests, 100% passing

**Next Steps**:
1. ✅ Phase 1A complete (Safety Corridor)
2. ⏳ Phase 1B upcoming (Technique Scoring)
3. ⏳ Phase 1C upcoming (Curriculum System)
4. 📈 Target: 90%+ overall coverage by Phase 1 completion

**Maintenance**:
- Review tests quarterly
- Update as new features added
- Monitor CI/CD pipeline health
- Track flaky tests and fix root causes

---

**Last Updated**: January 22, 2026
**Test Framework**: Vitest 4.0.17
**Maintained by**: Quality Engineering Team
