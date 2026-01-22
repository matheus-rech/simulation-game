# Testing Documentation - NeuroSim

This document provides comprehensive guidance on testing the NeuroSim medical simulation application.

## Table of Contents

- [Overview](#overview)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Debugging Tests](#debugging-tests)

---

## Overview

NeuroSim uses **Vitest** as the testing framework with the following setup:

- **Test Runner**: Vitest 4.0.17
- **Test Environment**: happy-dom (lightweight DOM for Node.js)
- **UI Testing**: @testing-library/react for React hooks
- **Coverage**: v8 coverage provider
- **Total Tests**: 93 (as of last update)

### Test Categories

1. **Unit Tests** - Test individual functions and components in isolation
2. **Integration Tests** - Test interactions between multiple components
3. **Hook Tests** - Test React hooks using @testing-library/react

---

## Running Tests

### Basic Commands

```bash
# Run all tests once (CI mode)
npm test

# Run tests in watch mode (development)
npm test -- --watch

# Run tests with UI interface
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Filtering Tests

```bash
# Run specific test file
npm test -- ProceduralGeometry

# Run tests matching pattern
npm test -- --grep "collision"

# Run only failed tests
npm test -- --only-failed
```

### Viewing Coverage

After running `npm run test:coverage`, open:
```
coverage/index.html
```

Coverage reports include:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

---

## Test Coverage

### Current Coverage Summary

| Module | Tests | Coverage |
|--------|-------|----------|
| ProceduralGeometry | 29 tests | Unit tests for all functions |
| CSGOperations | 38 tests | Complete CSG and cache testing |
| CollisionManager | 26 tests | Full integration testing |
| **Total** | **93 tests** | **All passing ✅** |

### Coverage Goals

- **Geometry utilities**: 80%+ coverage
- **Collision system**: 90%+ coverage
- **Critical paths** (ICA injury, crisis detection): 100% coverage

---

## Test Structure

### Directory Organization

```
src/
├── components/
│   └── 3d/
│       ├── anatomy/
│       │   └── geometry/
│       │       ├── ProceduralGeometry.ts
│       │       ├── CSGOperations.ts
│       │       └── __tests__/
│       │           ├── ProceduralGeometry.test.ts
│       │           └── CSGOperations.test.ts
│       ├── collision/
│       │   ├── CollisionManager.tsx
│       │   └── __tests__/
│       │       └── CollisionManager.test.tsx
│       └── materials/
│           └── TissueMaterials.tsx
└── test/
    └── setup.ts  # Global test configuration
```

### Test File Naming

- Test files: `*.test.ts` or `*.test.tsx`
- Location: `__tests__/` directory next to source files
- Naming pattern: Match source file name

---

## Writing Tests

### ProceduralGeometry Example

```typescript
import { describe, it, expect } from 'vitest'
import { perlin3D, applyNoiseDistortion } from '../ProceduralGeometry'
import { SphereGeometry } from 'three'

describe('ProceduralGeometry - Perlin Noise', () => {
  it('should return values between -1 and 1', () => {
    const noise = perlin3D(1.5, 2.3, 3.7)
    expect(noise).toBeGreaterThanOrEqual(-1)
    expect(noise).toBeLessThanOrEqual(1)
  })

  it('should be deterministic', () => {
    const noise1 = perlin3D(1, 2, 3)
    const noise2 = perlin3D(1, 2, 3)
    expect(noise1).toBe(noise2)
  })
})

describe('ProceduralGeometry - Geometry Manipulation', () => {
  it('should modify geometry vertices', () => {
    const geometry = new SphereGeometry(1, 16, 16)
    const originalPositions = geometry.attributes.position.array.slice()

    applyNoiseDistortion(geometry, 0.15, 1.0, 3)

    const modifiedPositions = geometry.attributes.position.array

    // Check at least some vertices changed
    let changedCount = 0
    for (let i = 0; i < originalPositions.length; i++) {
      if (Math.abs(originalPositions[i] - modifiedPositions[i]) > 0.001) {
        changedCount++
      }
    }

    expect(changedCount).toBeGreaterThan(0)
  })
})
```

### CSGOperations Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { BoxGeometry, SphereGeometry } from 'three'
import { union, subtract, createHollowGeometry } from '../CSGOperations'

describe('CSGOperations - Basic Operations', () => {
  let boxGeometry: BoxGeometry
  let sphereGeometry: SphereGeometry

  beforeEach(() => {
    boxGeometry = new BoxGeometry(2, 2, 2)
    sphereGeometry = new SphereGeometry(1.5, 32, 32)
  })

  it('should combine two geometries', () => {
    const result = union(boxGeometry, sphereGeometry)

    expect(result).toBeDefined()
    expect(result.attributes).toBeDefined()
    expect(result.attributes.position.count).toBeGreaterThan(0)
  })

  it('should create hollow geometry', () => {
    const solid = new BoxGeometry(2, 2, 2)
    const hollow = createHollowGeometry(solid, 0.2)

    expect(hollow.attributes.position.count).toBeGreaterThan(0)
  })
})
```

### CollisionManager Hook Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCollisionManager } from '../CollisionManager'
import { TissueType } from '../../materials/TissueMaterials'

describe('CollisionManager', () => {
  const mockOnScoreChange = vi.fn()
  const mockOnCrisis = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('should handle collision event', () => {
    const { result } = renderHook(() =>
      useCollisionManager({
        onScoreChange: mockOnScoreChange,
      })
    )

    act(() => {
      result.current.handleCollision(
        { x: 1, y: 2, z: 3 },
        TissueType.MUCOSA,
        0.8
      )
    })

    expect(mockOnScoreChange).toHaveBeenCalledWith(-1)
  })

  it('should trigger ICA crisis', () => {
    const { result } = renderHook(() =>
      useCollisionManager({ onCrisis: mockOnCrisis })
    )

    act(() => {
      result.current.handleCollision(
        { x: 0, y: 0, z: 0 },
        TissueType.ICA
      )
    })

    expect(mockOnCrisis).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CrisisType.ICA_INJURY,
      })
    )
  })
})
```

---

## Best Practices

### 1. Test Organization

✅ **DO**: Group related tests with `describe` blocks
```typescript
describe('ProceduralGeometry - Perlin Noise', () => {
  describe('perlin3D', () => {
    it('should return values between -1 and 1', () => { /* ... */ })
  })
})
```

❌ **DON'T**: Put all tests in a flat list
```typescript
it('test 1', () => { /* ... */ })
it('test 2', () => { /* ... */ })
it('test 3', () => { /* ... */ })
```

### 2. Test Naming

✅ **DO**: Use descriptive test names
```typescript
it('should debounce rapid collisions within 250ms', () => { /* ... */ })
```

❌ **DON'T**: Use vague names
```typescript
it('works', () => { /* ... */ })
it('test collision', () => { /* ... */ })
```

### 3. Setup and Teardown

✅ **DO**: Use `beforeEach` for shared setup
```typescript
beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
})
```

✅ **DO**: Use `afterEach` for cleanup
```typescript
afterEach(() => {
  vi.useRealTimers()
  clearCSGCache()
})
```

### 4. Assertions

✅ **DO**: Test behavior, not implementation
```typescript
expect(result.attributes.position.count).toBeGreaterThan(0)
```

❌ **DON'T**: Test internal details
```typescript
expect(result._internalCache).toBeDefined()
```

### 5. Async Testing

✅ **DO**: Use `act()` for hook updates
```typescript
act(() => {
  result.current.handleCollision(position, tissueType)
})
```

### 6. Mocking

✅ **DO**: Mock external dependencies
```typescript
const mockOnScoreChange = vi.fn()
```

✅ **DO**: Clear mocks between tests
```typescript
beforeEach(() => {
  vi.clearAllMocks()
})
```

### 7. Edge Cases

✅ **DO**: Test boundary conditions
```typescript
it('should handle zero intensity', () => {
  result.current.handleCollision(pos, tissue, 0)
  expect(mockOnCollision).toHaveBeenCalledWith(
    expect.objectContaining({ intensity: 0 })
  )
})
```

---

## Debugging Tests

### Common Issues

#### 1. Three.js Multiple Instances Warning

**Issue**: `THREE.WARNING: Multiple instances of Three.js being imported`

**Cause**: Vitest imports Three.js separately for each test file

**Solution**: This is a warning, not an error. Tests still pass correctly.

#### 2. toBeInstanceOf Fails with Three.js

**Issue**: `expect(result).toBeInstanceOf(BufferGeometry)` fails

**Cause**: Multiple Three.js instances create different `BufferGeometry` constructors

**Solution**: Check for attributes instead
```typescript
expect(result).toBeDefined()
expect(result.attributes).toBeDefined()
expect(result.attributes.position).toBeDefined()
```

#### 3. Probabilistic Tests Fail

**Issue**: CSF leak test (30% probability) fails sometimes

**Solution**: Use multiple iterations
```typescript
let triggered = false
for (let i = 0; i < 50; i++) {
  // Try collision
  if (crisisTriggered) {
    triggered = true
    break
  }
}
expect(triggered).toBe(true)
```

#### 4. Timer Issues

**Issue**: Debounce tests don't work correctly

**Solution**: Use fake timers
```typescript
beforeEach(() => {
  vi.useFakeTimers()
})

act(() => {
  vi.advanceTimersByTime(300)
})
```

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test
npm test -- -t "should debounce rapid collisions"

# Run with debugger
npm test -- --inspect-brk

# Show all console.log output
npm test -- --reporter=verbose
```

### Debugging in VSCode

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--run"],
  "console": "integratedTerminal"
}
```

---

## Test Maintenance

### Adding New Tests

1. Create test file in `__tests__/` directory
2. Import functions/components to test
3. Write descriptive test cases
4. Run tests: `npm test`
5. Check coverage: `npm run test:coverage`

### Updating Tests

When modifying code:

1. Update related tests
2. Check if new edge cases need testing
3. Verify coverage didn't decrease
4. Run full test suite before committing

### Performance Considerations

- **CSG operations**: Tests can be slow (300ms for 38 tests)
- **Collision tests**: Fast (26ms for 26 tests)
- **Geometry tests**: Fast (61ms for 29 tests)

To speed up slow tests:

```typescript
// Use smaller geometries for CSG tests
const box = new BoxGeometry(1, 1, 1) // Not 10, 10, 10

// Use fewer iterations for probabilistic tests
for (let i = 0; i < 20; i++) { // Not 1000
```

---

## Coverage Reports

### Viewing Coverage

After running `npm run test:coverage`:

```
coverage/
├── index.html        # Main coverage report
├── lcov.info         # LCOV format (for CI)
└── coverage-final.json  # JSON format
```

### Coverage Metrics

- **Lines**: % of code lines executed
- **Functions**: % of functions called
- **Branches**: % of if/else branches taken
- **Statements**: % of statements executed

### Excluded from Coverage

As defined in `vitest.config.ts`:

- `node_modules/`
- `src/test/`
- `**/*.d.ts` (TypeScript definitions)
- `**/*.config.*` (Config files)
- `**/dist/**` (Build output)

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --run
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Troubleshooting

### Tests Hang or Timeout

```bash
# Increase timeout in vitest.config.ts
testTimeout: 10000  # 10 seconds
```

### Memory Issues

```bash
# Run with more memory
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

### WebGL Context Issues

The test setup mocks WebGL context. If you encounter WebGL-specific errors, check `src/test/setup.ts`.

---

## Resources

- **Vitest Documentation**: https://vitest.dev
- **React Testing Library**: https://testing-library.com/react
- **Three.js Testing**: https://threejs.org/docs/#manual/en/introduction/How-to-run-things-locally
- **Coverage Reports**: https://istanbul.js.org/docs/tutorials/coverage-reports/

---

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Aim for 80%+ coverage
3. Include edge cases
4. Update this documentation
5. Run full test suite before PR

### Test Checklist

- [ ] Tests written for new functionality
- [ ] Edge cases covered
- [ ] Coverage maintained/improved
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Documentation updated

---

**Last Updated**: 2026-01-22
**Test Framework**: Vitest 4.0.17
**Total Tests**: 93
**Test Pass Rate**: 100% ✅
