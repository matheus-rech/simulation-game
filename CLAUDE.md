# CLAUDE.md - AI Assistant Guide for NeuroSim

## Project Overview

**NeuroSim** is a web-based serious game for neurosurgery resident training, focusing on the endoscopic endonasal transsphenoidal approach to pituitary adenomas. This is an educational simulation - **not intended for clinical decision-making**.

### Key Features
- 3D anatomical simulation of nasal cavity and sphenoid sinus
- Collision detection for surgical training feedback
- Multi-level progression (basic navigation to crisis management)
- Real-time HUD with score tracking
- Fully client-side (no backend required)

---

## Codebase Structure

```
/home/user/simulation-game/
├── src/
│   ├── App.tsx                    # Root component, state management, HUD
│   └── components/
│       ├── EndoscopeView.tsx      # Three.js Canvas, post-processing effects
│       └── 3d/
│           ├── NasalCavity.tsx    # 3D anatomy (nasal passage, turbinates, carotid)
│           ├── EndoscopeRig.tsx   # Camera control, collision detection, spotlight
│           ├── Materials.tsx       # Shader materials (mucosa, bone)
│           └── VFX.tsx            # Visual effects (dust particles, bleeding)
├── package.json                   # Dependencies
├── README.md                      # Project documentation
└── .gitignore                     # Git ignore patterns
```

---

## Key Files and Their Roles

### `src/App.tsx` (Root Component)
- **State management**: level, scopeAngle, tipPosition, collisionCount, score
- **HUD overlay**: Displays game stats (level, score, collisions)
- **Controls**: "Advance Level" and "Reset Scope" buttons
- **Accessibility**: Semantic HTML with ARIA attributes

### `src/components/EndoscopeView.tsx`
- **Canvas setup**: Camera at [0, 0, 1.5] with 55° FOV
- **Post-processing effects**: Depth of Field, Bloom, Vignette, Noise, Chromatic Aberration
- **Scene composition**: Combines NasalCavity, DustParticles, BleedingVFX, EndoscopeRig

### `src/components/3d/NasalCavity.tsx`
- **Main tunnel**: CatmullRom curve creating nasal passage (240 tube segments)
- **Turbinates**: 3 cylindrical structures
- **Posterior wall**: Box geometry (sphenoid sinus area)
- **Sphenoid ostium**: Torus geometry (surgical target)
- **Carotid artery**: Red pulsing sphere (appears at level 2+)

### `src/components/3d/EndoscopeRig.tsx`
- **Camera control**: Smooth lerp to tip position
- **Rotation**: Based on scopeAngle and rotationZ
- **Raycasting**: Collision detection within 0.4 units
- **Debouncing**: 250ms throttle on collision events
- **Spotlight**: Simulates endoscope light

### `src/components/3d/Materials.tsx`
- **MucosaMaterial**: Pink (#c56c72) with animated distortion
- **BoneMaterial**: Cream (#f3eee4) with high roughness

### `src/components/3d/VFX.tsx`
- **DustParticles**: 600 floating particles with sine wave oscillation
- **BleedingVFX**: Red particles spawned on collision, instanced rendering (max 24)

---

## Technology Stack

### Core
- **React** 19.2.3 - UI framework
- **TypeScript** - Type-safe development
- **Three.js** 0.182.0 - 3D graphics

### React Three Ecosystem
- **@react-three/fiber** 9.5.0 - React renderer for Three.js
- **@react-three/drei** 10.7.7 - Three.js helpers and abstractions
- **@react-three/postprocessing** 3.0.4 - Visual effects

### Utilities
- **uuid** 13.0.0 - Unique ID generation for particles

---

## Development Conventions

### React Patterns
- Functional components with hooks
- `useState` for local state (no global state manager)
- `useMemo` for expensive calculations (geometry, curves)
- `useRef` for mutable references (raycaster, mesh instances)
- `useFrame` for animation loops
- `useCallback` for event handlers

### 3D Graphics Patterns
- Materials and geometries defined separately from meshes
- `InstancedMesh` for efficient particle rendering
- Raycasting for collision detection
- `clock.elapsedTime` for animations
- Delta time for frame-rate independence

### TypeScript Conventions
- Interfaces for component props (e.g., `EndoscopeViewProps`)
- Custom `Vector3D` type for 3D vector objects
- Consistent type annotations throughout

### Accessibility
- Semantic HTML: `<section>`, `<dl>`, `<nav>`, `<button>`
- ARIA labels and live regions
- Focus states on interactive elements
- High contrast color palette

### Styling
- Inline style objects with `as const`
- Dark theme: `#0f0a0a` background, `#f7e5da` text
- Glassmorphism effects (backdrop blur, transparency)

---

## Color Palette

| Purpose | Hex | Usage |
|---------|-----|-------|
| Background | `#0f0a0a` | Main dark background |
| Text | `#f7e5da` | Primary text color |
| Mucosa | `#c56c72` | Nasal tissue material |
| Bone | `#f3eee4` | Bone material |
| Blood | `#b0122c` | Bleeding effects |
| Ambient Light | `#f7d9cd` | Warm scene lighting |

---

## Key Constants

| Constant | Value | Location |
|----------|-------|----------|
| Collision distance | 0.4 units | EndoscopeRig.tsx |
| Score decrement | 2 per collision | App.tsx |
| Initial score | 100 | App.tsx |
| Collision debounce | 250ms | EndoscopeRig.tsx |
| Tube segments | 240 | NasalCavity.tsx |
| Max particles | 24 | VFX.tsx |
| Dust particles | 600 | VFX.tsx |

---

## State Flow

```
App.tsx (state owner)
├── level: number (1-3)
├── scopeAngle: { pitch, yaw }
├── tipPosition: Vector3D
├── collisionCount: number
├── score: number (starts 100)
└── lastCollision: Vector3D | null

    ↓ passes down to

EndoscopeView.tsx
    ↓
EndoscopeRig.tsx
    - Handles camera movement
    - Detects collisions via raycasting
    - Calls onCollision callback

    ↓ collision triggers

BleedingVFX (spawns at collision point)
App.tsx (updates score, collision count)
```

---

## Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Current Project Status

### Implemented
- 3D nasal cavity simulation
- Endoscope camera control
- Collision detection system
- Visual effects (dust, bleeding)
- HUD with score tracking
- Vite build configuration
- Multi-level progression
- Accessibility enhancements

### Not Yet Implemented
- MediaPipe hand tracking (mentioned in README)
- Patient vitals simulation
- AI attending surgeon feedback
- Testing framework
- ESLint/Prettier configuration

---

## Common Tasks

### Adding a New Anatomical Structure
1. Add geometry in `NasalCavity.tsx`
2. Use existing materials from `Materials.tsx` or create new ones
3. Position using Three.js Vector3

### Modifying Collision Behavior
1. Adjust collision distance in `EndoscopeRig.tsx` (currently 0.4)
2. Modify debounce timing (currently 250ms)
3. Update score logic in `App.tsx`

### Adding Visual Effects
1. Create new component in `VFX.tsx`
2. Use `useFrame` for animations
3. Consider `InstancedMesh` for many particles

### Updating HUD Elements
1. Modify `App.tsx` HUD section
2. Follow existing semantic HTML patterns
3. Include ARIA attributes for accessibility

---

## Git Conventions

- **Commit format**: Semantic with emoji prefix (e.g., `🎨 Palette: Enhance HUD Accessibility`)
- **Branch strategy**: Feature branches with descriptive names
- **PR workflow**: Feature branches merged via pull requests

---

## Important Notes for AI Assistants

1. **Educational project**: This is for training, not clinical use
2. **No backend**: Fully client-side application
3. **TypeScript required**: Maintain type safety
4. **Accessibility matters**: Follow existing ARIA patterns
5. **Performance critical**: Use `useMemo`, instanced rendering for 3D
6. **React Three Fiber**: Not vanilla Three.js - use R3F patterns
7. **No tests yet**: Consider adding when making changes
8. **Vite bundler**: Use `npm run dev` for development server

---

## File Reading Priority

When exploring for context, read in this order:
1. `src/App.tsx` - Understand state and overall structure
2. `src/components/EndoscopeView.tsx` - Scene composition
3. `src/components/3d/EndoscopeRig.tsx` - Core interaction logic
4. `src/components/3d/NasalCavity.tsx` - 3D anatomy structure
5. `package.json` - Dependencies and scripts
