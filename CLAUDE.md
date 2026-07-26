# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NeuroSim** is a web-based serious game for neurosurgery resident training, focusing on the endoscopic endonasal transsphenoidal approach to pituitary adenomas. This is an educational simulation - **not intended for clinical decision-making**.

## Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # TypeScript check + production build
npm run preview          # Preview production build

# Code Quality
npm run type-check       # TypeScript type checking
npm run lint             # Check for linting errors
npm run lint:fix         # Auto-fix linting errors
npm run format           # Format code with Prettier

# Testing
npm test                 # Run all tests (93 tests)
npm test -- --watch      # Run tests in watch mode
npm run test:ui          # Interactive test UI
npm run test:coverage    # Generate coverage report
npm test -- ProceduralGeometry  # Run specific test file
npm test -- --grep "collision"  # Run tests matching pattern
```

## High-Level Architecture

### Three-Tier System

```
1. UI Layer (App.tsx)
   ├── State management (level, score, collision tracking, crisis events)
   ├── HUD overlay (score, level, collision count, crisis alerts)
   └── User controls (level advancement, scope reset)

2. Rendering Layer (EndoscopeView.tsx)
   ├── Three.js Canvas setup
   ├── Post-processing effects (DOF, Bloom, Vignette)
   ├── Physics context (@react-three/rapier)
   └── Debug utilities (wireframe, stats, physics debug)

3. Simulation Layer (3d/)
   ├── anatomy/         # Anatomical structures (CSG-based)
   ├── collision/       # Collision detection and crisis system
   ├── materials/       # Tissue-specific materials
   ├── debug/           # Performance monitoring and controls
   └── utils/           # Geometry cleanup utilities
```

### Anatomical Structure System (CSG-Based)

All anatomical structures are procedurally generated using **Constructive Solid Geometry (CSG)**:

```
AnatomyManager (orchestrator)
├── SphenoidSinus
│   └── CSG: Box(outer) - Box(inner) + Septations
├── SellaTurcica
│   ├── Bone layer (SphereGeometry hemisphere)
│   └── Dura layer (offset -0.04mm from bone)
├── PituitaryAdenoma
│   ├── Tumor (Perlin noise distortion)
│   └── Pseudocapsule (offset +0.02mm from tumor)
├── InternalCarotidArtery (bilateral)
│   └── TubeGeometry along CatmullRom curve
└── CavernousSinus (bilateral)
    └── MWCS membranes following ICA path
```

**Key Insight**: Structures are shown/hidden based on `level` prop, simulating progressive surgical depth.

### Procedural Geometry Pipeline

1. **Base Geometry Creation** - Three.js primitives (Box, Sphere, Tube)
2. **CSG Operations** - Boolean operations via `three-bvh-csg`
3. **Noise Distortion** - Perlin noise for irregular surfaces
4. **Vertex Coloring** - Heterogeneity via noise-based colors
5. **Layer Generation** - Offset geometry for tissue layers
6. **Cleanup** - Normal recomputation, bounding box updates

See `src/components/3d/anatomy/geometry/` for implementation.

### Collision & Crisis System

```typescript
// Tissue types with different penalties
TissueType.MUCOSA      → -1 score  (bleeding)
TissueType.BONE        → -3 score  (bruising)
TissueType.DURA        → -5 score  (bleeding, 30% CSF leak crisis)
TissueType.ICA         → -100 score (arterial bleed, 100% ICA crisis)
TissueType.MWCS        → -10 score  (bleeding)

// Collision Manager features:
- 250ms debouncing
- Tissue-specific responses
- Crisis triggering (ICA injury, CSF leak)
- Collision statistics by tissue type
- Event history tracking
```

**Critical**: The `useCollisionManager` hook is the central system for handling all surgical events.

### Material System

Each anatomical tissue has specific visual properties defined in `TissueMaterials.tsx`:

- **TISSUE_MATERIALS** - Color, roughness, metalness, opacity
- **TISSUE_PROPERTIES** - Collision response, score penalty, visual effect
- **createTissueMaterial()** - Generates Three.js MeshStandardMaterial

Materials are anatomically accurate based on surgical imaging references.

## Testing Architecture

**Framework**: Vitest 4.0.17 with happy-dom environment

### Test Structure

```
__tests__/
├── ProceduralGeometry.test.ts (29 tests)
│   ├── Perlin noise (determinism, range, seeding)
│   ├── Geometry manipulation (distortion, colors, offset)
│   └── Integration tests
├── CSGOperations.test.ts (38 tests)
│   ├── Basic CSG (union, subtract, intersect)
│   ├── Multiple operations
│   ├── Helpers (hollow, simplify, cleanup)
│   ├── Caching system
│   └── Integration workflows
└── CollisionManager.test.tsx (26 tests)
    ├── Collision handling
    ├── Debouncing (250ms)
    ├── Tissue-specific responses
    ├── Crisis triggering
    └── Statistics tracking
```

**Total**: 93 tests, 100% passing ✅

### Testing Patterns

```typescript
// Unit tests (geometry functions)
describe('perlin3D', () => {
  it('should return values between -1 and 1', () => {
    const noise = perlin3D(1.5, 2.3, 3.7)
    expect(noise).toBeGreaterThanOrEqual(-1)
    expect(noise).toBeLessThanOrEqual(1)
  })
})

// Integration tests (CSG operations)
describe('createHollowGeometry', () => {
  it('should create hollow geometry from solid', () => {
    const solid = new BoxGeometry(2, 2, 2)
    const hollow = createHollowGeometry(solid, 0.2)
    expect(hollow.attributes.position.count).toBeGreaterThan(0)
  })
})

// Hook tests (React Testing Library)
describe('useCollisionManager', () => {
  it('should trigger ICA crisis on collision', () => {
    const { result } = renderHook(() =>
      useCollisionManager({ onCrisis: mockOnCrisis })
    )
    act(() => {
      result.current.handleCollision({ x: 0, y: 0, z: 0 }, TissueType.ICA)
    })
    expect(mockOnCrisis).toHaveBeenCalledWith(
      expect.objectContaining({ type: CrisisType.ICA_INJURY })
    )
  })
})
```

### WebGL Mocking

Tests run in Node.js with happy-dom. WebGL context is mocked in `src/test/setup.ts`:

```typescript
HTMLCanvasElement.prototype.getContext = function (contextId: string) {
  if (contextId === 'webgl' || contextId === 'webgl2') {
    return { /* mock WebGL methods */ }
  }
}
```

## State Management

**Pattern**: Centralized state in App.tsx (no global state library)

```typescript
// App.tsx state
const [level, setLevel] = useState(1)              // Surgical depth (1-3)
const [scopeAngle, setScopeAngle] = useState({...}) // Pitch/yaw
const [tipPosition, setTipPosition] = useState({...}) // 3D position
const [collisionCount, setCollisionCount] = useState(0)
const [score, setScore] = useState(100)
const [activeCrisis, setActiveCrisis] = useState(null)

// State flows down via props
App → EndoscopeView → EndoscopeRig (collision detection)
                   → AnatomyManager (level-based visibility)
```

**State Update Pattern**: Callbacks passed down, state lifted up.

## Physics System

**Engine**: @react-three/rapier (Rust/WASM based, 2-3× faster than Cannon.js)

```typescript
<Physics gravity={[0, 0, 0]} timeStep={1 / 60} debug={physicsDebug}>
  {/* All 3D content */}
</Physics>
```

**Note**: Gravity disabled (zero gravity) for endoscope simulation. Collision detection via raycasting in EndoscopeRig.tsx (not physics-based yet).

## Debug Utilities

Press `H` in the running app to show debug controls:

- **W** - Toggle wireframe mode
- **P** - Toggle physics debug visualization
- **S** - Toggle stats overlay (FPS, memory, triangles)
- **C** - Toggle collision sphere visualization (not yet implemented)
- **H** - Hide/show help overlay

See `src/components/3d/debug/DebugControls.tsx` and `PerformanceMonitor.tsx`.

## Performance Optimization

### Geometry Budget

| Structure | Vertices | Triangles |
|-----------|----------|-----------|
| Sphenoid Sinus | 5,000 | 10,000 |
| Sella Turcica | 5,000 | 10,000 |
| Pituitary Adenoma | 8,000 | 16,000 |
| ICA (bilateral) | 2,000 | 4,000 |
| MWCS (bilateral) | 1,000 | 2,000 |
| **Total** | **25,000** | **50,000** |

### Optimization Patterns

- **useMemo** for expensive geometry calculations
- **InstancedMesh** for particle VFX (24 bleeding particles, 600 dust particles)
- **CSG caching** via `cachedUnion()` in CSGOperations
- **Geometry disposal** via GeometryCleanup utilities
- **Level-based rendering** - Only show structures for current surgical depth

**Target**: 60 FPS on mid-range hardware, <100MB memory

## React Three Fiber Patterns

### Component Structure

```typescript
// Typical R3F component structure
export function AnatomicalStructure({ visible, level }) {
  // 1. Geometry creation (useMemo)
  const geometry = useMemo(() => {
    const outer = new BoxGeometry(2, 2, 2)
    const inner = new BoxGeometry(1.8, 1.8, 1.8)
    return subtract(outer, inner)
  }, [])

  // 2. Material creation (useMemo)
  const material = useMemo(() =>
    createTissueMaterial(TissueType.BONE)
  , [])

  // 3. Animation (useFrame)
  const meshRef = useRef()
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 0.1
    }
  })

  // 4. Render (declarative)
  return (
    <mesh ref={meshRef} geometry={geometry} material={material} visible={visible} />
  )
}
```

**Key**: Always use `useMemo` for geometries/materials to prevent recreation on every frame.

## Anatomical Coordinates

All positions in world space units (1 unit ≈ 1cm):

```typescript
const POSITIONS = {
  sphenoidOstium: new Vector3(0.2, 0.2, -6.45),
  sphenoidSinus: new Vector3(0, 0.2, -6.8),
  sellaFloor: new Vector3(0, 0.4, -7.2),
  pituitary: new Vector3(0, 0.6, -7.5),
  icaLeft: new Vector3(-0.9, 0.3, -7.3),
  icaRight: new Vector3(0.9, 0.3, -7.3)
}
```

**Camera**: Positioned at [0, 0, 1.5] looking toward -Z (into nasal cavity).

## TypeScript Conventions

### Custom Types

```typescript
// Vector3D (matches VFX.tsx and collision system)
interface Vector3D {
  x: number
  y: number
  z: number
}

// Scope angle (pitch/yaw)
interface ScopeAngle {
  pitch: number
  yaw: number
}

// Collision event
interface CollisionEvent {
  position: Vector3D
  tissueType: TissueType
  timestamp: number
  intensity: number
}
```

### Prop Interfaces

Always define prop interfaces for components:

```typescript
export interface ComponentNameProps {
  /** JSDoc description */
  propName: Type
  optionalProp?: Type
}

export function ComponentName({ propName, optionalProp }: ComponentNameProps) {
  // ...
}
```

## Common Development Tasks

### Adding a New Anatomical Structure

1. Create component in `src/components/3d/anatomy/`
2. Use CSG operations from `geometry/CSGOperations.ts`
3. Apply Perlin noise distortion if needed (irregular surface)
4. Create material via `createTissueMaterial(TissueType.NEW_TYPE)`
5. Add to `AnatomyManager.tsx` with level-based visibility
6. Update `TissueMaterials.tsx` with new tissue type and properties

### Modifying Collision Behavior

1. Update `TISSUE_PROPERTIES` in `TissueMaterials.tsx`
2. Modify `getCollisionResponse()` in `CollisionManager.tsx`
3. Add new crisis type to `types.ts` if needed
4. Write tests in `__tests__/CollisionManager.test.tsx`

### Adding Visual Effects

1. Create component in `VFX.tsx` using `InstancedMesh`
2. Use `useFrame` for animation loop
3. Consider particle pooling for performance
4. Update VFX based on collision events from `BleedingVFX` pattern

### Running a Single Test

```bash
# Run specific test file
npm test -- ProceduralGeometry

# Run specific test by name
npm test -- -t "should trigger ICA crisis"

# Run tests in specific directory
npm test -- src/components/3d/collision
```

## Known Limitations & Gotchas

### Three.js Multiple Instances

Vitest imports Three.js separately for each test file, causing `THREE.WARNING: Multiple instances of Three.js being imported`. This is harmless - tests still pass.

**Workaround**: Don't use `toBeInstanceOf(BufferGeometry)`. Instead:

```typescript
// ❌ Don't
expect(result).toBeInstanceOf(BufferGeometry)

// ✅ Do
expect(result).toBeDefined()
expect(result.attributes).toBeDefined()
expect(result.attributes.position).toBeDefined()
```

### CSG Performance

CSG operations (union, subtract, intersect) are CPU-intensive. Always:

1. Use `useMemo` to cache results
2. Consider `cachedUnion()` for repeated operations
3. Call `clearCSGCache()` when geometries update
4. Use `simplifyGeometry()` after complex CSG chains

### Rapier Physics Debug

The `debug={true}` prop on `<Physics>` shows physics debug visualization. This is controlled by the `P` key in DebugControls.

### State Updates & Debouncing

Collision events are debounced at 250ms to prevent spam. When testing:

```typescript
beforeEach(() => {
  vi.useFakeTimers()
})

act(() => {
  result.current.handleCollision(pos, tissue)
  vi.advanceTimersByTime(300) // Past 250ms debounce
  result.current.handleCollision(pos, tissue)
})
```

## File Organization Principles

### Directory Structure

```
src/
├── components/
│   ├── EndoscopeView.tsx          # Scene container
│   └── 3d/
│       ├── anatomy/               # Anatomical structures
│       │   ├── AnatomyManager.tsx # Orchestrator
│       │   ├── [Structure].tsx    # Individual structures
│       │   └── geometry/
│       │       ├── ProceduralGeometry.ts  # Noise, distortion
│       │       ├── CSGOperations.ts       # Boolean ops
│       │       ├── AnatomicalCurves.ts    # ICA paths
│       │       └── __tests__/
│       ├── collision/
│       │   ├── CollisionManager.tsx
│       │   ├── types.ts
│       │   └── __tests__/
│       ├── materials/
│       │   └── TissueMaterials.tsx
│       ├── debug/
│       │   ├── DebugControls.tsx
│       │   └── PerformanceMonitor.tsx
│       └── utils/
│           └── GeometryCleanup.ts
├── test/
│   └── setup.ts                   # Global test setup
└── App.tsx                        # Root component
```

### Naming Conventions

- **Components**: PascalCase (`PituitaryAdenoma.tsx`)
- **Utilities**: camelCase (`createTissueMaterial`)
- **Constants**: UPPER_SNAKE_CASE (`TISSUE_MATERIALS`)
- **Types**: PascalCase (`TissueType`, `CollisionEvent`)
- **Test files**: Match source file (`ProceduralGeometry.test.ts`)

## Git Workflow

### Commit Format

```
<type>: <description>

Examples:
feat: Add pituitary adenoma with Perlin noise distortion
fix: Correct ICA trajectory path calculations
test: Add comprehensive collision manager tests
docs: Update CLAUDE.md with testing architecture
refactor: Extract geometry cleanup into utilities
```

### Branch Strategy

- `main` - Production-ready code
- `meta` - Development branch (current work)
- `feature/[name]` - Feature development

All work should be committed to `meta` branch and merged to `main` when stable.

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.3 | UI framework |
| TypeScript | 5.9.3 | Type-safe development |
| Vite | 7.3.1 | Build tool and dev server |
| Three.js | 0.182.0 | 3D graphics |
| @react-three/fiber | 9.5.0 | React renderer for Three.js |
| @react-three/rapier | 2.2.0 | Physics engine |
| three-bvh-csg | 0.0.17 | CSG boolean operations |
| Vitest | 4.0.17 | Testing framework |

## Documentation

- **TESTING.md** - Comprehensive testing guide with examples
- **SETUP_COMPLETE.md** - Initial setup and Phase 1-5 completion
- **README.md** - Project overview and quick start

## Educational Context

This is a **surgical training simulation** for neurosurgery residents. Key considerations:

1. **Anatomical accuracy** - Proportions and positions match CT/MRI imaging
2. **Crisis scenarios** - ICA injury and CSF leak are real surgical complications
3. **Educational feedback** - Score system teaches economy of motion
4. **Progressive difficulty** - Levels 1-3 simulate increasing surgical depth

**NOT for clinical decision-making** - Educational use only.
