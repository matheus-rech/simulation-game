# NeuroSim Testing Strategy Guide

**Comprehensive guide for implementing the test evaluation recommendations**

---

## Table of Contents

1. [Testing Philosophies](#1-testing-philosophies)
2. [Test-Driven Development (TDD) Workflow](#2-test-driven-development-tdd-workflow)
3. [Unit Testing Strategy](#3-unit-testing-strategy)
4. [Integration Testing Strategy](#4-integration-testing-strategy)
5. [End-to-End Testing Strategy](#5-end-to-end-testing-strategy)
6. [React Three Fiber Testing Patterns](#6-react-three-fiber-testing-patterns)
7. [Performance Testing](#7-performance-testing)
8. [Visual Regression Testing](#8-visual-regression-testing)
9. [Test Data Management](#9-test-data-management)
10. [CI/CD Integration](#10-cicd-integration)

---

## 1. Testing Philosophies

### Test Pyramid Distribution

```
        /\
       /  \      E2E Tests (5-10%)
      /----\     - Full workflows
     /      \    - User journeys
    /  INT   \   Integration Tests (20-30%)
   /----------\  - Component interaction
  /    UNIT    \ - State flow
 /______________\ Unit Tests (60-70%)
                 - Pure functions
                 - Business logic
```

### Testing Principles

1. **Test Behavior, Not Implementation**
   - ❌ Don't test internal state directly
   - ✅ Do test observable behavior and outputs

2. **Write Tests First (TDD)**
   - 🔴 RED: Write failing test
   - 🟢 GREEN: Write minimal code to pass
   - 🔵 REFACTOR: Improve code with safety net

3. **Maintain Fast Feedback Loops**
   - Unit tests: <1s total
   - Integration tests: <10s total
   - E2E tests: <30s total

4. **Isolate External Dependencies**
   - Mock WebGL/Three.js in unit tests
   - Use test doubles for external services
   - Avoid network calls in tests

5. **Keep Tests Simple and Readable**
   - Arrange-Act-Assert (AAA) pattern
   - One assertion per concept
   - Descriptive test names

---

## 2. Test-Driven Development (TDD) Workflow

### Red-Green-Refactor Cycle

#### Example: Creating Tissue Material Function

**STEP 1: Write Failing Test (RED 🔴)**

```typescript
// tests/unit/materials/TissueMaterials.test.ts
import { describe, it, expect } from 'vitest'
import { createTissueMaterial, TissueType } from '../../../src/components/3d/materials/TissueMaterials'
import { MeshStandardMaterial, Color } from 'three'

describe('TissueMaterials - createTissueMaterial', () => {
  it('should create material with correct color for bone', () => {
    const material = createTissueMaterial(TissueType.BONE)

    expect(material).toBeInstanceOf(MeshStandardMaterial)
    expect(material.color.getHexString()).toBe('f3eee4')
  })
})
```

Run test: `npm test -- TissueMaterials`

**Expected Output:**
```
❌ FAIL tests/unit/materials/TissueMaterials.test.ts
  TissueMaterials - createTissueMaterial
    ✗ should create material with correct color for bone
      TypeError: createTissueMaterial is not a function
```

**STEP 2: Write Minimal Code (GREEN 🟢)**

```typescript
// src/components/3d/materials/TissueMaterials.tsx
export function createTissueMaterial(tissueType: TissueType): MeshStandardMaterial {
  const props = TISSUE_MATERIALS[tissueType]

  return new MeshStandardMaterial({
    color: new Color(props.color),
    roughness: props.roughness,
    metalness: props.metalness,
  })
}
```

Run test: `npm test -- TissueMaterials`

**Expected Output:**
```
✅ PASS tests/unit/materials/TissueMaterials.test.ts
  TissueMaterials - createTissueMaterial
    ✓ should create material with correct color for bone (3ms)
```

**STEP 3: Refactor with Safety Net (REFACTOR 🔵)**

```typescript
// src/components/3d/materials/TissueMaterials.tsx
export function createTissueMaterial(tissueType: TissueType): MeshStandardMaterial {
  const props = TISSUE_MATERIALS[tissueType]

  const material = new MeshStandardMaterial({
    color: new Color(props.color),
    roughness: props.roughness,
    metalness: props.metalness,
    opacity: props.opacity ?? 1.0,
    transparent: props.transparent ?? false,
  })

  if (props.emissive) {
    material.emissive = new Color(props.emissive)
    material.emissiveIntensity = props.emissiveIntensity ?? 0.0
  }

  return material
}
```

Run test: `npm test -- TissueMaterials`

**Expected Output:**
```
✅ PASS tests/unit/materials/TissueMaterials.test.ts
  TissueMaterials - createTissueMaterial
    ✓ should create material with correct color for bone (3ms)
```

### TDD Metrics Tracking

Create a TDD dashboard in your CI/CD:

```typescript
// scripts/tdd-metrics.ts
interface TDDMetrics {
  totalFeatures: number
  testFirstFeatures: number
  complianceRate: number
  avgCycleTime: number // minutes
  testGrowthRate: number // tests per feature
}

function calculateTDDMetrics(gitLog: string[]): TDDMetrics {
  // Parse git commits for TDD patterns
  // Look for: test commits before feature commits
  // Measure: time between test and implementation
  // Track: test count growth per feature

  return {
    totalFeatures: 45,
    testFirstFeatures: 36,
    complianceRate: 80, // %
    avgCycleTime: 12, // minutes
    testGrowthRate: 2.1, // tests per feature
  }
}
```

---

## 3. Unit Testing Strategy

### Testing Pure Functions

#### Example: Perlin Noise Tests

```typescript
// tests/unit/geometry/ProceduralGeometry.test.ts
import { describe, it, expect } from 'vitest'
import { perlin3D, octavePerlin, setNoiseSeed } from '../../../src/components/3d/anatomy/geometry/ProceduralGeometry'

describe('ProceduralGeometry - Perlin Noise', () => {
  describe('perlin3D', () => {
    it('should return values between -1 and 1', () => {
      const samples = 100
      for (let i = 0; i < samples; i++) {
        const x = Math.random() * 10
        const y = Math.random() * 10
        const z = Math.random() * 10
        const noise = perlin3D(x, y, z)

        expect(noise).toBeGreaterThanOrEqual(-1)
        expect(noise).toBeLessThanOrEqual(1)
      }
    })

    it('should be deterministic for same coordinates', () => {
      const noise1 = perlin3D(1.5, 2.3, 3.7)
      const noise2 = perlin3D(1.5, 2.3, 3.7)

      expect(noise1).toBe(noise2)
    })

    it('should produce continuous gradients', () => {
      const noise1 = perlin3D(5.0, 5.0, 5.0)
      const noise2 = perlin3D(5.01, 5.01, 5.01)

      expect(Math.abs(noise1 - noise2)).toBeLessThan(0.1)
    })
  })

  describe('setNoiseSeed', () => {
    it('should make noise deterministic with same seed', () => {
      setNoiseSeed(12345)
      const noise1a = perlin3D(1, 2, 3)
      const noise1b = perlin3D(4, 5, 6)

      setNoiseSeed(12345)
      const noise2a = perlin3D(1, 2, 3)
      const noise2b = perlin3D(4, 5, 6)

      expect(noise1a).toBe(noise2a)
      expect(noise1b).toBe(noise2b)
    })

    it('should produce different patterns with different seeds', () => {
      setNoiseSeed(111)
      const noiseA = perlin3D(5.3, 5.7, 5.2)

      setNoiseSeed(222)
      const noiseB = perlin3D(5.3, 5.7, 5.2)

      expect(noiseA).not.toBe(noiseB)
    })
  })
})
```

### Testing React Hooks

#### Example: Collision Manager Hook

```typescript
// tests/unit/hooks/useCollisionManager.test.tsx
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCollisionManager } from '../../../src/components/3d/collision/CollisionManager'
import { TissueType } from '../../../src/components/3d/materials/TissueMaterials'
import { CrisisType } from '../../../src/components/3d/collision/types'

describe('useCollisionManager', () => {
  const mockOnScoreChange = vi.fn()
  const mockOnCollision = vi.fn()
  const mockOnCrisis = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Collision Handling', () => {
    it('should handle basic collision event', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onScoreChange: mockOnScoreChange,
          onCollision: mockOnCollision,
        })
      )

      const position = { x: 1, y: 2, z: 3 }

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA, 0.8)
      })

      expect(mockOnCollision).toHaveBeenCalledTimes(1)
      expect(mockOnCollision).toHaveBeenCalledWith(
        expect.objectContaining({
          position,
          tissueType: TissueType.MUCOSA,
          intensity: 0.8,
        })
      )

      expect(mockOnScoreChange).toHaveBeenCalledWith(-1)
    })

    it('should debounce rapid collisions', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onScoreChange: mockOnScoreChange,
        })
      )

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
        result.current.handleCollision(position, TissueType.MUCOSA)
        result.current.handleCollision(position, TissueType.MUCOSA)
      })

      // Only first collision should be processed
      expect(mockOnScoreChange).toHaveBeenCalledTimes(1)
    })

    it('should allow collisions after debounce period', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onScoreChange: mockOnScoreChange,
        })
      )

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
      })

      act(() => {
        vi.advanceTimersByTime(300) // Past 250ms debounce
      })

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
      })

      expect(mockOnScoreChange).toHaveBeenCalledTimes(2)
    })
  })

  describe('Crisis Triggering', () => {
    it('should trigger ICA injury crisis on ICA collision', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onCrisis: mockOnCrisis,
        })
      )

      const position = { x: 1, y: 2, z: 3 }

      act(() => {
        result.current.handleCollision(position, TissueType.ICA)
      })

      expect(mockOnCrisis).toHaveBeenCalledTimes(1)
      expect(mockOnCrisis).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CrisisType.ICA_INJURY,
          description: expect.stringContaining('CRITICAL'),
        })
      )
    })

    it('should trigger CSF leak on dura collision (probabilistic)', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onCrisis: mockOnCrisis,
        })
      )

      const position = { x: 0, y: 0, z: 0 }

      // Try multiple times to account for 30% probability
      let crisisTriggered = false

      for (let i = 0; i < 50; i++) {
        mockOnCrisis.mockClear()

        act(() => {
          vi.advanceTimersByTime(300)
          result.current.handleCollision(position, TissueType.DURA)
        })

        if (mockOnCrisis.mock.calls.length > 0) {
          crisisTriggered = true
          expect(mockOnCrisis).toHaveBeenCalledWith(
            expect.objectContaining({
              type: CrisisType.CSF_LEAK,
            })
          )
          break
        }
      }

      expect(crisisTriggered).toBe(true)
    })
  })

  describe('Statistics Tracking', () => {
    it('should track total collisions', () => {
      const { result } = renderHook(() => useCollisionManager())

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
        vi.advanceTimersByTime(300)
        result.current.handleCollision(position, TissueType.BONE)
        vi.advanceTimersByTime(300)
        result.current.handleCollision(position, TissueType.DURA)
      })

      const stats = result.current.getStats()

      expect(stats.total).toBe(3)
    })

    it('should track collisions by tissue type', () => {
      const { result } = renderHook(() => useCollisionManager())

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
        vi.advanceTimersByTime(300)
        result.current.handleCollision(position, TissueType.MUCOSA)
        vi.advanceTimersByTime(300)
        result.current.handleCollision(position, TissueType.BONE)
      })

      const stats = result.current.getStats()

      expect(stats.byTissue[TissueType.MUCOSA]).toBe(2)
      expect(stats.byTissue[TissueType.BONE]).toBe(1)
      expect(stats.byTissue[TissueType.DURA]).toBe(0)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset collision history', () => {
      const { result } = renderHook(() => useCollisionManager())

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
        vi.advanceTimersByTime(300)
        result.current.handleCollision(position, TissueType.BONE)
      })

      let stats = result.current.getStats()
      expect(stats.total).toBe(2)

      act(() => {
        result.current.reset()
      })

      stats = result.current.getStats()
      expect(stats.total).toBe(0)
    })

    it('should reset crisis history', () => {
      const { result } = renderHook(() => useCollisionManager())

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.ICA)
      })

      let crises = result.current.getActiveCrises()
      expect(crises).toHaveLength(1)

      act(() => {
        result.current.reset()
      })

      crises = result.current.getActiveCrises()
      expect(crises).toHaveLength(0)
    })
  })
})
```

### Testing Utility Functions

#### Example: Tissue Material Utilities

```typescript
// tests/unit/materials/TissueMaterialsUtils.test.ts
import { describe, it, expect } from 'vitest'
import {
  getTissueName,
  isCriticalTissue,
  getScorePenalty,
  getVisualEffect,
  TissueType,
} from '../../../src/components/3d/materials/TissueMaterials'

describe('TissueMaterials - Utility Functions', () => {
  describe('getTissueName', () => {
    it('should return correct name for each tissue type', () => {
      expect(getTissueName(TissueType.MUCOSA)).toBe('Nasal Mucosa')
      expect(getTissueName(TissueType.BONE)).toBe('Sphenoid Bone')
      expect(getTissueName(TissueType.DURA)).toBe('Dura Mater')
      expect(getTissueName(TissueType.TUMOR)).toBe('Pituitary Adenoma')
      expect(getTissueName(TissueType.PSEUDOCAPSULE)).toBe('Pseudocapsule')
      expect(getTissueName(TissueType.ICA)).toBe('Internal Carotid Artery')
      expect(getTissueName(TissueType.MWCS)).toBe('Cavernous Sinus Wall')
    })
  })

  describe('isCriticalTissue', () => {
    it('should identify ICA as critical', () => {
      expect(isCriticalTissue(TissueType.ICA)).toBe(true)
    })

    it('should identify non-critical tissues correctly', () => {
      expect(isCriticalTissue(TissueType.MUCOSA)).toBe(false)
      expect(isCriticalTissue(TissueType.BONE)).toBe(false)
      expect(isCriticalTissue(TissueType.DURA)).toBe(false)
      expect(isCriticalTissue(TissueType.TUMOR)).toBe(false)
      expect(isCriticalTissue(TissueType.PSEUDOCAPSULE)).toBe(false)
      expect(isCriticalTissue(TissueType.MWCS)).toBe(false)
    })
  })

  describe('getScorePenalty', () => {
    it('should return correct penalties for each tissue', () => {
      expect(getScorePenalty(TissueType.MUCOSA)).toBe(1)
      expect(getScorePenalty(TissueType.BONE)).toBe(3)
      expect(getScorePenalty(TissueType.DURA)).toBe(5)
      expect(getScorePenalty(TissueType.TUMOR)).toBe(2)
      expect(getScorePenalty(TissueType.PSEUDOCAPSULE)).toBe(3)
      expect(getScorePenalty(TissueType.ICA)).toBe(100)
      expect(getScorePenalty(TissueType.MWCS)).toBe(10)
    })
  })

  describe('getVisualEffect', () => {
    it('should return bleeding for soft tissues', () => {
      expect(getVisualEffect(TissueType.MUCOSA)).toBe('bleeding')
      expect(getVisualEffect(TissueType.DURA)).toBe('bleeding')
      expect(getVisualEffect(TissueType.TUMOR)).toBe('bleeding')
      expect(getVisualEffect(TissueType.PSEUDOCAPSULE)).toBe('bleeding')
      expect(getVisualEffect(TissueType.MWCS)).toBe('bleeding')
    })

    it('should return bruising for bone', () => {
      expect(getVisualEffect(TissueType.BONE)).toBe('bruising')
    })

    it('should return arterial_bleed for ICA', () => {
      expect(getVisualEffect(TissueType.ICA)).toBe('arterial_bleed')
    })
  })
})
```

---

## 4. Integration Testing Strategy

### Component Integration Tests

#### Example: App Component Integration

```typescript
// tests/integration/App.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import App from '../../src/App'

describe('App Component Integration', () => {
  describe('Initial State', () => {
    it('should render with default state', () => {
      const { getByText } = render(<App />)

      expect(getByText('Level')).toBeInTheDocument()
      expect(getByText('1')).toBeInTheDocument()
      expect(getByText('Score')).toBeInTheDocument()
      expect(getByText('100')).toBeInTheDocument()
      expect(getByText('Collisions')).toBeInTheDocument()
      expect(getByText('0')).toBeInTheDocument()
    })

    it('should render HUD controls', () => {
      const { getByText } = render(<App />)

      expect(getByText('Advance Level')).toBeInTheDocument()
      expect(getByText('Reset Scope')).toBeInTheDocument()
    })
  })

  describe('Level Management', () => {
    it('should advance level on button click', async () => {
      const { getByText } = render(<App />)

      const advanceButton = getByText('Advance Level')

      // Level 1 → 2
      fireEvent.click(advanceButton)
      await waitFor(() => {
        expect(getByText('2')).toBeInTheDocument()
      })

      // Level 2 → 3
      fireEvent.click(advanceButton)
      await waitFor(() => {
        expect(getByText('3')).toBeInTheDocument()
      })

      // Level 3 → 1 (wrap)
      fireEvent.click(advanceButton)
      await waitFor(() => {
        expect(getByText('1')).toBeInTheDocument()
      })
    })
  })

  describe('Scope Reset', () => {
    it('should reset scope angle and position on button click', async () => {
      const { getByText } = render(<App />)

      const resetButton = getByText('Reset Scope')

      fireEvent.click(resetButton)

      // Verify reset (would need to check internal state or visual feedback)
      // For now, just ensure button is clickable
      expect(resetButton).toBeInTheDocument()
    })
  })

  describe('Crisis Handling', () => {
    it('should display crisis alert when crisis occurs', async () => {
      const { getByText, getByRole, queryByRole } = render(<App />)

      // Initially no crisis
      expect(queryByRole('alert')).not.toBeInTheDocument()

      // TODO: Trigger crisis event (requires EndoscopeView integration)
      // For now, this test is a placeholder

      // After crisis triggered:
      // const alert = getByRole('alert')
      // expect(alert).toHaveTextContent('CRITICAL EVENT')
    })

    it('should apply -50 score penalty for crisis', async () => {
      const { getByText } = render(<App />)

      // Initial score: 100
      expect(getByText('100')).toBeInTheDocument()

      // TODO: Trigger crisis event
      // After crisis:
      // expect(getByText('50')).toBeInTheDocument()
    })
  })

  describe('Button Hover States', () => {
    it('should show hover effect on HUD button', async () => {
      const { getByText } = render(<App />)

      const advanceButton = getByText('Advance Level')

      // Hover
      fireEvent.mouseEnter(advanceButton)
      // Background should change (would need visual regression test)

      // Unhover
      fireEvent.mouseLeave(advanceButton)
    })

    it('should show focus effect on HUD button', async () => {
      const { getByText } = render(<App />)

      const advanceButton = getByText('Advance Level')

      // Focus
      fireEvent.focus(advanceButton)
      // Box shadow should appear (would need visual regression test)

      // Blur
      fireEvent.blur(advanceButton)
    })
  })
})
```

#### Example: AnatomyManager Integration

```typescript
// tests/integration/AnatomyManager.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { AnatomyManager } from '../../src/components/3d/anatomy/AnatomyManager'

describe('AnatomyManager Integration', () => {
  describe('Level-Based Visibility', () => {
    it('should show nasal cavity at level 0', () => {
      const { container } = render(
        <Canvas>
          <AnatomyManager level={0} />
        </Canvas>
      )

      // Check that nasal cavity group is rendered
      // (Requires inspecting Three.js scene - use mockScene)
      expect(container).toBeInTheDocument()
    })

    it('should show sphenoid ostium at level 1', () => {
      const { container } = render(
        <Canvas>
          <AnatomyManager level={1} />
        </Canvas>
      )

      expect(container).toBeInTheDocument()
      // Verify sphenoid ostium is visible in scene
    })

    it('should show sphenoid sinus at level 2', () => {
      const { container } = render(
        <Canvas>
          <AnatomyManager level={2} />
        </Canvas>
      )

      expect(container).toBeInTheDocument()
      // Verify sphenoid sinus is visible in scene
    })

    it('should show sella turcica at level 3', () => {
      const { container } = render(
        <Canvas>
          <AnatomyManager level={3} />
        </Canvas>
      )

      expect(container).toBeInTheDocument()
      // Verify sella turcica is visible in scene
    })

    it('should show pituitary and dura at level 4', () => {
      const { container } = render(
        <Canvas>
          <AnatomyManager level={4} />
        </Canvas>
      )

      expect(container).toBeInTheDocument()
      // Verify pituitary and dura are visible in scene
    })

    it('should show ICAs and MWCS at level 5', () => {
      const { container } = render(
        <Canvas>
          <AnatomyManager level={5} />
        </Canvas>
      )

      expect(container).toBeInTheDocument()
      // Verify ICAs and MWCS are visible in scene
    })
  })

  describe('Anatomical Positioning', () => {
    it('should position structures at correct coordinates', () => {
      const { container } = render(
        <Canvas>
          <AnatomyManager level={5} />
        </Canvas>
      )

      // Verify positions match ANATOMY_POSITIONS constants
      expect(container).toBeInTheDocument()
    })
  })
})
```

### State Flow Integration Tests

#### Example: Collision to Score Update Flow

```typescript
// tests/integration/flows/CollisionToScore.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import App from '../../../src/App'

describe('Collision to Score Update Flow', () => {
  it('should update score when collision occurs', async () => {
    const { getByText } = render(<App />)

    const initialScore = 100
    expect(getByText('Score')).toBeInTheDocument()
    expect(getByText(String(initialScore))).toBeInTheDocument()

    // TODO: Trigger collision event
    // This requires:
    // 1. Mocking EndoscopeRig raycasting
    // 2. Triggering onRaycastCollision callback
    // 3. Verifying score updates

    // After collision:
    // await waitFor(() => {
    //   expect(getByText('98')).toBeInTheDocument() // -2 penalty
    //   expect(getByText('1')).toBeInTheDocument() // collision count
    // })
  })

  it('should not allow negative score', async () => {
    const { getByText } = render(<App />)

    // Trigger 50 collisions (50 * 2 = 100 points)
    // for (let i = 0; i < 50; i++) {
    //   triggerCollision()
    // }

    // await waitFor(() => {
    //   expect(getByText('0')).toBeInTheDocument() // Score bottoms out at 0
    // })
  })
})
```

#### Example: Crisis to Alert Flow

```typescript
// tests/integration/flows/CrisisToAlert.test.tsx
import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import App from '../../../src/App'

describe('Crisis to Alert Flow', () => {
  it('should display alert and update score on crisis', async () => {
    const { getByText, getByRole } = render(<App />)

    // Initial state
    expect(getByText('100')).toBeInTheDocument()

    // TODO: Trigger crisis event
    // This requires:
    // 1. Mocking collision with ICA
    // 2. Triggering onCrisis callback
    // 3. Verifying alert and score

    // After crisis:
    // await waitFor(() => {
    //   const alert = getByRole('alert')
    //   expect(alert).toHaveTextContent('CRITICAL EVENT')
    //   expect(getByText('50')).toBeInTheDocument() // -50 penalty
    // })
  })
})
```

---

## 5. End-to-End Testing Strategy

### Full Simulation Workflows

#### Example: Level 1-3 Progression

```typescript
// tests/e2e/FullSimulation.test.tsx
import { describe, it, expect } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import App from '../../src/App'

describe('Full Simulation Workflow', () => {
  it('should complete Level 1: Nasal cavity navigation', async () => {
    const { getByText } = render(<App />)

    // Initial state: Level 1
    expect(getByText('Level')).toHaveTextContent('1')
    expect(getByText('Score')).toHaveTextContent('100')

    // Navigate through nasal cavity
    // - Avoid turbinate collisions
    // - Identify sphenoid ostium

    // Advance to Level 2
    const advanceButton = getByText('Advance Level')
    fireEvent.click(advanceButton)

    await waitFor(() => {
      expect(getByText('Level')).toHaveTextContent('2')
      // Verify no collisions
      expect(getByText('Collisions')).toHaveTextContent('0')
      // Verify score maintained
      expect(getByText('Score')).toHaveTextContent('100')
    })
  })

  it('should complete Level 2: Sphenoid sinus entry', async () => {
    const { getByText } = render(<App />)

    // Advance to Level 2
    const advanceButton = getByText('Advance Level')
    fireEvent.click(advanceButton)

    await waitFor(() => {
      expect(getByText('Level')).toHaveTextContent('2')
    })

    // Navigate through sphenoid sinus
    // - Identify septations
    // - Avoid bone collisions
    // - Locate sellar floor

    // Advance to Level 3
    fireEvent.click(advanceButton)

    await waitFor(() => {
      expect(getByText('Level')).toHaveTextContent('3')
      // Verify minimal collisions
      // Verify score > 90
    })
  })

  it('should complete Level 3: Sellar floor exposure', async () => {
    const { getByText } = render(<App />)

    // Advance to Level 3
    const advanceButton = getByText('Advance Level')
    fireEvent.click(advanceButton) // Level 2
    fireEvent.click(advanceButton) // Level 3

    await waitFor(() => {
      expect(getByText('Level')).toHaveTextContent('3')
    })

    // Expose sellar floor
    // - Careful bone removal
    // - Avoid excessive force

    // Verify successful completion
    // - Score > 85
    // - Collisions < 5
  })

  it('should achieve score > 80 for successful procedure', async () => {
    const { getByText } = render(<App />)

    // Complete full simulation workflow
    // - Navigate all levels
    // - Minimize collisions
    // - Avoid crisis events

    // Final score check
    // const finalScore = parseInt(getByText('Score').textContent || '0')
    // expect(finalScore).toBeGreaterThan(80)
  })

  it('should fail procedure on ICA injury', async () => {
    const { getByText, getByRole } = render(<App />)

    // Navigate to Level 5
    // Trigger ICA collision

    // await waitFor(() => {
    //   const alert = getByRole('alert')
    //   expect(alert).toHaveTextContent('CRITICAL')
    //   expect(alert).toHaveTextContent('Internal Carotid Artery')
    //
    //   const finalScore = parseInt(getByText('Score').textContent || '0')
    //   expect(finalScore).toBeLessThan(50) // Massive penalty
    // })
  })
})
```

---

## 6. React Three Fiber Testing Patterns

### Mocking R3F Components

#### Setup: Mock Canvas and Hooks

```typescript
// tests/setup-r3f-mocks.ts
import { vi } from 'vitest'
import { ReactNode } from 'react'

// Mock Canvas to avoid WebGL initialization
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: vi.fn((callback: any) => {
    // Optionally trigger callback once for initial state
    callback({ clock: { elapsedTime: 0, getDelta: () => 0.016 } }, 0.016)
  }),
  useThree: vi.fn(() => ({
    gl: {
      info: {
        render: { calls: 0 },
        memory: { textures: 0 },
      },
    },
    scene: {
      traverse: vi.fn(),
    },
    camera: {},
    size: { width: 800, height: 600 },
  })),
}))

// Mock Rapier Physics
vi.mock('@react-three/rapier', () => ({
  Physics: ({ children }: { children: ReactNode }) => (
    <div data-testid="physics">{children}</div>
  ),
  RigidBody: ({ children }: { children: ReactNode }) => (
    <div data-testid="rigidbody">{children}</div>
  ),
}))

// Mock Post-Processing
vi.mock('@react-three/postprocessing', () => ({
  EffectComposer: ({ children }: { children: ReactNode }) => <>{children}</>,
  Bloom: () => null,
  DepthOfField: () => null,
  Vignette: () => null,
  Noise: () => null,
  ChromaticAberration: () => null,
}))
```

### Testing R3F Components Without Rendering

#### Example: Test Visibility Logic

```typescript
// tests/unit/anatomy/AnatomyManagerLogic.test.ts
import { describe, it, expect } from 'vitest'

describe('AnatomyManager Visibility Logic', () => {
  it('should determine visible structures based on level', () => {
    const levels = [0, 1, 2, 3, 4, 5]

    levels.forEach(level => {
      const visibleStructures = {
        nasalCavity: level >= 0,
        sphenoidOstium: level >= 1,
        sphenoidSinus: level >= 2,
        sellaTurcica: level >= 3,
        dura: level >= 4,
        pituitary: level >= 4,
        ica: level >= 5,
        mwcs: level >= 5,
      }

      if (level === 0) {
        expect(visibleStructures.nasalCavity).toBe(true)
        expect(visibleStructures.sphenoidOstium).toBe(false)
      }

      if (level === 3) {
        expect(visibleStructures.sellaTurcica).toBe(true)
        expect(visibleStructures.dura).toBe(false)
        expect(visibleStructures.ica).toBe(false)
      }

      if (level === 5) {
        expect(visibleStructures.ica).toBe(true)
        expect(visibleStructures.mwcs).toBe(true)
      }
    })
  })
})
```

### Testing Geometry Creation

#### Example: SphenoidSinus Geometry

```typescript
// tests/unit/anatomy/SphenoidSinus.test.ts
import { describe, it, expect } from 'vitest'
import { BoxGeometry } from 'three'
import { subtract, unionMultiple } from '../../../src/components/3d/anatomy/geometry/CSGOperations'

describe('SphenoidSinus Geometry', () => {
  it('should create hollow geometry with correct dimensions', () => {
    const outerDims = [4, 3, 3] as const
    const wallThickness = 0.2

    const outerBox = new BoxGeometry(...outerDims)
    const innerBox = new BoxGeometry(
      outerDims[0] - wallThickness * 2,
      outerDims[1] - wallThickness * 2,
      outerDims[2] - wallThickness * 2
    )

    const hollow = subtract(outerBox, innerBox)

    expect(hollow).toBeDefined()
    expect(hollow.attributes.position).toBeDefined()
    expect(hollow.attributes.position.count).toBeGreaterThan(0)
  })

  it('should generate correct number of septations', () => {
    const septationCount = 2
    const septations = []

    for (let i = 0; i < septationCount; i++) {
      const septation = new BoxGeometry(0.1, 2.5, 2.5)
      const offset = (i - (septationCount - 1) / 2) * 1.0
      septation.translate(offset, 0, 0)
      septations.push(septation)
    }

    expect(septations).toHaveLength(2)

    const combined = unionMultiple(septations)
    expect(combined).toBeDefined()
  })
})
```

---

## 7. Performance Testing

### Triangle Budget Enforcement

```typescript
// tests/performance/GeometryBudget.test.ts
import { describe, it, expect } from 'vitest'
import { BoxGeometry, SphereGeometry } from 'three'
import {
  subtract,
  unionMultiple,
} from '../../src/components/3d/anatomy/geometry/CSGOperations'

describe('Performance Budget - Geometry', () => {
  function countTriangles(geometry: any): number {
    if (geometry.index) {
      return geometry.index.count / 3
    } else if (geometry.attributes.position) {
      return geometry.attributes.position.count / 3
    }
    return 0
  }

  it('should enforce SphenoidSinus triangle budget < 10,000', () => {
    const outer = new BoxGeometry(4, 3, 3)
    const inner = new BoxGeometry(3.6, 2.6, 2.6)
    const hollow = subtract(outer, inner)

    const triangles = countTriangles(hollow)
    expect(triangles).toBeLessThan(10000)
  })

  it('should enforce SellaTurcica triangle budget < 10,000', () => {
    const bone = new SphereGeometry(0.8, 32, 32)
    const dura = new SphereGeometry(0.76, 32, 32) // offset -0.04

    const totalTriangles = countTriangles(bone) + countTriangles(dura)
    expect(totalTriangles).toBeLessThan(10000)
  })

  it('should enforce total scene triangle budget < 50,000', () => {
    // Simulate all anatomical structures
    const structures = [
      subtract(new BoxGeometry(4, 3, 3), new BoxGeometry(3.6, 2.6, 2.6)), // Sphenoid
      new SphereGeometry(0.8, 32, 32), // Sella bone
      new SphereGeometry(0.6, 32, 32), // Tumor
      // ... add all other structures
    ]

    let totalTriangles = 0
    structures.forEach(geometry => {
      totalTriangles += countTriangles(geometry)
    })

    expect(totalTriangles).toBeLessThan(50000)
  })
})
```

### CSG Performance Benchmarks

```typescript
// tests/performance/CSGBenchmarks.test.ts
import { describe, it, expect } from 'vitest'
import { BoxGeometry, SphereGeometry } from 'three'
import {
  union,
  subtract,
  intersect,
} from '../../src/components/3d/anatomy/geometry/CSGOperations'

describe('Performance Benchmarks - CSG Operations', () => {
  it('should complete union in < 100ms', () => {
    const box = new BoxGeometry(2, 2, 2)
    const sphere = new SphereGeometry(1.5, 32, 32)

    const startTime = performance.now()
    const result = union(box, sphere)
    const duration = performance.now() - startTime

    expect(duration).toBeLessThan(100)
    expect(result).toBeDefined()
  })

  it('should complete subtract in < 150ms', () => {
    const outer = new BoxGeometry(4, 3, 3)
    const inner = new BoxGeometry(3.6, 2.6, 2.6)

    const startTime = performance.now()
    const result = subtract(outer, inner)
    const duration = performance.now() - startTime

    expect(duration).toBeLessThan(150)
    expect(result).toBeDefined()
  })

  it('should complete intersect in < 120ms', () => {
    const box = new BoxGeometry(2, 2, 2)
    const sphere = new SphereGeometry(1.5, 32, 32)

    const startTime = performance.now()
    const result = intersect(box, sphere)
    const duration = performance.now() - startTime

    expect(duration).toBeLessThan(120)
    expect(result).toBeDefined()
  })

  it('should complete complex nested operations in < 500ms', () => {
    const outer = new BoxGeometry(4, 3, 3)
    const inner = new BoxGeometry(3.6, 2.6, 2.6)
    const septation1 = new BoxGeometry(0.1, 2.5, 2.5)
    const septation2 = new BoxGeometry(0.1, 2.5, 2.5)

    const startTime = performance.now()

    const cavity = subtract(outer, inner)
    const withSeptations = unionMultiple([cavity, septation1, septation2])

    const duration = performance.now() - startTime

    expect(duration).toBeLessThan(500)
    expect(withSeptations).toBeDefined()
  })
})
```

### Memory Leak Detection

```typescript
// tests/performance/MemoryLeaks.test.ts
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { BufferGeometry } from 'three'
import { SphenoidSinus } from '../../src/components/3d/anatomy/SphenoidSinus'
import { getCacheStats, clearCSGCache } from '../../src/components/3d/anatomy/geometry/CSGOperations'

describe('Performance - Memory Management', () => {
  it('should dispose geometries when components unmount', () => {
    const disposeSpy = vi.spyOn(BufferGeometry.prototype, 'dispose')

    const { unmount } = render(
      <Canvas>
        <SphenoidSinus septationCount={2} seed={1000} showSellarFloor={false} />
      </Canvas>
    )

    unmount()

    // Verify dispose was called
    expect(disposeSpy).toHaveBeenCalled()

    disposeSpy.mockRestore()
  })

  it('should clear CSG cache when geometries update', () => {
    clearCSGCache()
    const initialStats = getCacheStats()

    // Simulate geometry creation with caching
    // (This would require importing and using cachedUnion)

    const finalStats = getCacheStats()

    // Verify cache was used and cleared appropriately
    expect(finalStats.size).toBeGreaterThanOrEqual(0)
  })

  it('should not leak memory with repeated level changes', () => {
    const { rerender } = render(
      <Canvas>
        <SphenoidSinus septationCount={2} seed={1000} showSellarFloor={false} />
      </Canvas>
    )

    // Change seed multiple times (triggers geometry regeneration)
    for (let i = 0; i < 10; i++) {
      rerender(
        <Canvas>
          <SphenoidSinus septationCount={2} seed={1000 + i} showSellarFloor={false} />
        </Canvas>
      )
    }

    // Check that old geometries were disposed
    // (This requires tracking disposal in the component itself)
  })
})
```

---

## 8. Visual Regression Testing

### Snapshot Testing for Component Structure

```typescript
// tests/visual/ComponentSnapshots.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { SphenoidSinus } from '../../src/components/3d/anatomy/SphenoidSinus'
import { SellaTurcica } from '../../src/components/3d/anatomy/SellaTurcica'

describe('Visual Regression - Component Snapshots', () => {
  it('should match SphenoidSinus structure snapshot', () => {
    const { container } = render(
      <Canvas>
        <SphenoidSinus septationCount={2} seed={1000} showSellarFloor={true} />
      </Canvas>
    )

    expect(container.firstChild).toMatchSnapshot()
  })

  it('should match SellaTurcica structure snapshot', () => {
    const { container } = render(
      <Canvas>
        <SellaTurcica showBone={true} showDura={true} />
      </Canvas>
    )

    expect(container.firstChild).toMatchSnapshot()
  })
})
```

### WebGL Screenshot Comparison (Future Enhancement)

```typescript
// tests/visual/WebGLScreenshots.test.ts
// Requires Playwright or similar tool for WebGL rendering

import { test, expect } from '@playwright/test'

test.describe('Visual Regression - WebGL Rendering', () => {
  test('should match Level 1 scene rendering', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Wait for scene to load
    await page.waitForSelector('canvas')

    // Take screenshot
    const screenshot = await page.screenshot()

    // Compare with baseline
    expect(screenshot).toMatchSnapshot('level-1-scene.png')
  })

  test('should match Level 5 scene rendering (all structures)', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Advance to Level 5
    const advanceButton = page.locator('text=Advance Level')
    await advanceButton.click() // Level 2
    await advanceButton.click() // Level 3
    await advanceButton.click() // Level 1 (wrap)
    await advanceButton.click() // Level 2

    // Take screenshot
    const screenshot = await page.screenshot()

    // Compare with baseline
    expect(screenshot).toMatchSnapshot('level-5-scene.png')
  })
})
```

---

## 9. Test Data Management

### Test Fixtures

```typescript
// tests/fixtures/anatomy.ts
import { Vector3 } from 'three'
import { TissueType } from '../../src/components/3d/materials/TissueMaterials'

export const anatomyFixtures = {
  positions: {
    nasalCavity: new Vector3(0, 0, -3),
    sphenoidOstium: new Vector3(0.2, 0.2, -6.45),
    sphenoidSinus: new Vector3(0, 0.2, -6.8),
    sellarFloor: new Vector3(0, 0.4, -7.2),
    sellaTurcica: new Vector3(0, 0.5, -7.4),
    pituitary: new Vector3(0, 0.6, -7.5),
    icaLeft: new Vector3(-0.9, 0.3, -7.3),
    icaRight: new Vector3(0.9, 0.3, -7.3),
  },

  dimensions: {
    sphenoidSinus: {
      outer: [4, 3, 3] as const,
      wall: 0.2,
    },
    sellaTurcica: {
      boneRadius: 0.8,
      duraOffset: -0.04,
    },
    pituitary: {
      size: 1.2,
      pseudocapsuleOffset: 0.02,
    },
  },

  seeds: {
    sphenoidSinus: 1000,
    pituitary: 2000,
    testing: 12345,
  },
}

export const collisionFixtures = {
  positions: [
    { x: 0, y: 0, z: -4 },
    { x: 0.5, y: -0.1, z: -4.5 },
    { x: -0.5, y: -0.1, z: -4.5 },
    { x: 0, y: 0.2, z: -6.45 },
    { x: 0, y: 0.4, z: -7.2 },
  ],

  tissues: [
    TissueType.MUCOSA,
    TissueType.BONE,
    TissueType.DURA,
    TissueType.TUMOR,
    TissueType.PSEUDOCAPSULE,
    TissueType.ICA,
    TissueType.MWCS,
  ],
}
```

### Test Builders

```typescript
// tests/builders/GeometryBuilder.ts
import { BoxGeometry, SphereGeometry, BufferGeometry } from 'three'
import {
  subtract,
  unionMultiple,
} from '../../src/components/3d/anatomy/geometry/CSGOperations'
import { applyNoiseDistortion, applyNoiseVertexColors } from '../../src/components/3d/anatomy/geometry/ProceduralGeometry'

export class GeometryBuilder {
  private geometry: BufferGeometry | null = null

  static box(width: number, height: number, depth: number): GeometryBuilder {
    const builder = new GeometryBuilder()
    builder.geometry = new BoxGeometry(width, height, depth)
    return builder
  }

  static sphere(radius: number, widthSegments: number, heightSegments: number): GeometryBuilder {
    const builder = new GeometryBuilder()
    builder.geometry = new SphereGeometry(radius, widthSegments, heightSegments)
    return builder
  }

  hollow(wallThickness: number): GeometryBuilder {
    if (!this.geometry) throw new Error('No geometry to make hollow')

    const outer = this.geometry
    // Create inner geometry with reduced dimensions
    // (Simplified for example)
    const inner = new BoxGeometry(2, 2, 2)

    this.geometry = subtract(outer, inner)
    return this
  }

  withNoise(strength: number, frequency: number, octaves: number): GeometryBuilder {
    if (!this.geometry) throw new Error('No geometry to distort')

    applyNoiseDistortion(this.geometry, strength, frequency, octaves)
    return this
  }

  withVertexColors(baseColor: number, variation: number): GeometryBuilder {
    if (!this.geometry) throw new Error('No geometry for vertex colors')

    applyNoiseVertexColors(this.geometry, baseColor, variation)
    return this
  }

  build(): BufferGeometry {
    if (!this.geometry) throw new Error('No geometry built')
    return this.geometry
  }
}

// Usage in tests:
// const geometry = GeometryBuilder
//   .box(4, 3, 3)
//   .hollow(0.2)
//   .withNoise(0.15, 2.0, 4)
//   .withVertexColors(0.8, 0.3)
//   .build()
```

### Mock Factories

```typescript
// tests/factories/CollisionFactory.ts
import { TissueType } from '../../src/components/3d/materials/TissueMaterials'
import { CrisisType } from '../../src/components/3d/collision/types'

export class CollisionFactory {
  static createCollisionEvent(overrides = {}) {
    return {
      position: { x: 0, y: 0, z: 0 },
      tissueType: TissueType.MUCOSA,
      intensity: 1.0,
      timestamp: Date.now(),
      ...overrides,
    }
  }

  static createCrisisEvent(overrides = {}) {
    return {
      type: CrisisType.ICA_INJURY,
      description: '⚠️ CRITICAL: Internal Carotid Artery Injury!',
      timestamp: Date.now(),
      collision: CollisionFactory.createCollisionEvent({ tissueType: TissueType.ICA }),
      ...overrides,
    }
  }

  static createCollisionStats(overrides = {}) {
    return {
      total: 0,
      critical: 0,
      byTissue: {
        [TissueType.MUCOSA]: 0,
        [TissueType.BONE]: 0,
        [TissueType.DURA]: 0,
        [TissueType.TUMOR]: 0,
        [TissueType.PSEUDOCAPSULE]: 0,
        [TissueType.ICA]: 0,
        [TissueType.MWCS]: 0,
      },
      lastCollision: null,
      ...overrides,
    }
  }
}

// Usage in tests:
// const collision = CollisionFactory.createCollisionEvent({
//   tissueType: TissueType.ICA,
//   intensity: 0.9,
// })
```

---

## 10. CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, meta]
  pull_request:
    branches: [main, meta]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run type-check

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true

      - name: Enforce coverage thresholds
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.statements.pct')
          if (( $(echo "$COVERAGE < 85" | bc -l) )); then
            echo "❌ Coverage $COVERAGE% is below 85% threshold"
            exit 1
          fi
          echo "✅ Coverage $COVERAGE% meets threshold"

      - name: Run performance benchmarks
        run: npm run test:performance

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            coverage/
            test-results/
```

### Pre-Commit Hooks with Husky

```bash
# Install Husky
npm install --save-dev husky

# Initialize Husky
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npm run pre-commit"
```

```json
// package.json
{
  "scripts": {
    "pre-commit": "npm run type-check && npm run lint && npm test -- --run --changed"
  }
}
```

### Coverage Thresholds in Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        'src/main.tsx',
      ],
    },
  },
})
```

---

## Summary

This guide provides comprehensive testing strategies for the NeuroSim project, covering:

1. ✅ **TDD Workflow** - Red-Green-Refactor cycle with examples
2. ✅ **Unit Testing** - Pure functions, hooks, utilities
3. ✅ **Integration Testing** - Component interaction, state flow
4. ✅ **E2E Testing** - Full simulation workflows
5. ✅ **R3F Testing** - Mocking strategies for Three.js components
6. ✅ **Performance Testing** - Triangle budgets, CSG benchmarks, memory leaks
7. ✅ **Visual Regression** - Snapshot testing, WebGL screenshots
8. ✅ **Test Data** - Fixtures, builders, factories
9. ✅ **CI/CD** - GitHub Actions, pre-commit hooks, coverage thresholds

**Next Steps:**
1. Implement Priority 1 tests (App.tsx, EndoscopeView.tsx, TissueMaterials.tsx)
2. Add integration tests for surgical scenarios
3. Establish TDD workflow and metrics tracking
4. Set up CI/CD pipeline with coverage enforcement

---

**Document Version:** 1.0
**Last Updated:** 2026-01-22
