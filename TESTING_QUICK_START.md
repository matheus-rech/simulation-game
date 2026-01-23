# Testing Quick Start Guide

**For**: NeuroSim Development Team
**Last Updated**: January 22, 2026

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode (auto-rerun on changes)
npm test -- --watch

# Interactive UI
npm run test:ui

# Run specific test file
npm test -- SafetyCorridorManager
npm test -- SafetyHUD
npm test -- CollisionManager

# Run tests matching pattern
npm test -- --grep "collision"
npm test -- --grep "safety"
```

---

## Current Test Status

**Total Tests**: 164 ✅
**Pass Rate**: 100% ✅
**Coverage**: 70.3% overall, 94%+ critical paths ✅

| Test Suite | Tests | Status |
|------------|-------|--------|
| ProceduralGeometry | 29 | ✅ |
| CSGOperations | 38 | ✅ |
| CollisionManager | 26 | ✅ |
| SafetyCorridorManager | 42 | ✅ |
| SafetyHUD | 29 | ✅ |

---

## Writing New Tests

### Basic Test Pattern

```typescript
import { describe, it, expect } from 'vitest';

describe('ComponentName', () => {
  it('should do something specific', () => {
    const result = functionUnderTest();
    expect(result).toBe(expectedValue);
  });
});
```

### Testing React Components

```typescript
import { render, screen } from '@testing-library/react';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent prop="value" />);
    expect(screen.getByText('Expected Text')).toBeDefined();
  });
});
```

### Testing React Hooks

```typescript
import { renderHook, act } from '@testing-library/react';

describe('useMyHook', () => {
  it('should update state', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.updateValue(42);
    });

    expect(result.current.value).toBe(42);
  });
});
```

### Testing with Timers

```typescript
import { beforeEach, afterEach, vi } from 'vitest';

describe('Debounced Function', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce calls', () => {
    const callback = vi.fn();
    debouncedFunction(callback);

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
```

---

## Test-Driven Development (TDD)

### Red-Green-Refactor Cycle

1. **Red**: Write a failing test
```typescript
it('should calculate total score', () => {
  const score = calculateScore({ accuracy: 90, efficiency: 80 });
  expect(score).toBe(85); // This will fail initially
});
```

2. **Green**: Write minimal code to pass
```typescript
export function calculateScore({ accuracy, efficiency }) {
  return (accuracy + efficiency) / 2;
}
```

3. **Refactor**: Improve code quality
```typescript
export function calculateScore(metrics: Metrics): number {
  const { accuracy, efficiency } = metrics;
  return Math.round((accuracy + efficiency) / 2);
}
```

---

## Common Test Patterns

### Mocking Callbacks

```typescript
const mockCallback = vi.fn();

// Use the mock
component.onEvent(mockCallback);

// Verify it was called
expect(mockCallback).toHaveBeenCalledTimes(1);
expect(mockCallback).toHaveBeenCalledWith(expectedArg);
```

### Testing Async Code

```typescript
it('should load data', async () => {
  const data = await fetchData();
  expect(data).toEqual(expectedData);
});
```

### Testing Three.js Components

```typescript
import { Vector3 } from 'three';

it('should calculate distance correctly', () => {
  const point1 = new Vector3(0, 0, 0);
  const point2 = new Vector3(3, 4, 0);
  const distance = point1.distanceTo(point2);
  expect(distance).toBe(5);
});
```

---

## Coverage Commands

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html

# Coverage for specific file
npm run test:coverage -- SafetyCorridorManager
```

---

## Debugging Tests

### Using `test.only`

```typescript
// Run only this test
it.only('should focus on this test', () => {
  // ...
});
```

### Using `test.skip`

```typescript
// Skip this test temporarily
it.skip('should skip this test', () => {
  // ...
});
```

### Console Logging

```typescript
it('should debug output', () => {
  const value = computeValue();
  console.log('DEBUG:', value); // Will appear in test output
  expect(value).toBe(42);
});
```

---

## Best Practices

### ✅ Do

- Write descriptive test names
- Test one thing per test
- Use `beforeEach` for setup
- Clean up after tests (timers, mocks)
- Keep tests fast (<1s total)
- Aim for 80%+ coverage on new code

### ❌ Don't

- Test implementation details
- Write flaky tests (timing-dependent)
- Share state between tests
- Mock everything (test real behavior when possible)
- Ignore failing tests (fix or remove)

---

## Test File Organization

```
src/
├── components/
│   ├── MyComponent.tsx
│   └── __tests__/
│       └── MyComponent.test.tsx
```

**Naming Convention**: `ComponentName.test.tsx` or `functionName.test.ts`

---

## Continuous Integration

### Pre-commit Checklist

- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No lint errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Coverage maintained or improved

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
```

---

## Troubleshooting

### Issue: Tests hang or timeout

**Solution**: Check for missing `await` on async operations

```typescript
// ❌ Wrong
it('should load', () => {
  fetchData(); // Missing await
  expect(data).toBeDefined();
});

// ✅ Correct
it('should load', async () => {
  await fetchData();
  expect(data).toBeDefined();
});
```

### Issue: Timer-related flakiness

**Solution**: Use fake timers

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

it('should debounce', () => {
  act(() => {
    vi.advanceTimersByTime(300);
  });
});
```

### Issue: THREE.WARNING: Multiple instances

**Solution**: This is expected and harmless. Vitest imports Three.js separately per test file.

---

## Quick Reference

### Assertions

```typescript
expect(value).toBe(42);                    // Exact equality
expect(value).toEqual({ a: 1 });           // Deep equality
expect(value).toBeCloseTo(3.14, 2);        // Float with precision
expect(value).toBeGreaterThan(10);         // Comparison
expect(value).toBeDefined();               // Existence
expect(array).toHaveLength(5);             // Array length
expect(fn).toHaveBeenCalled();             // Mock called
expect(fn).toHaveBeenCalledWith(arg);      // Mock called with arg
```

### React Testing Library

```typescript
render(<Component />);                     // Render component
screen.getByText('Hello');                 // Find by text
screen.getByRole('button');                // Find by role
screen.queryByText('Optional');            // Find (returns null if not found)
await screen.findByText('Async');          // Find async
userEvent.click(button);                   // Simulate click
```

---

## Getting Help

- **Documentation**: See `TESTING_STRATEGY_COMPREHENSIVE.md`
- **Examples**: Check existing tests in `__tests__/` directories
- **Vitest Docs**: https://vitest.dev
- **Testing Library**: https://testing-library.com

---

**Happy Testing!** 🧪✅
