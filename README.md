# NeuroSim – Endoscopic Transsphenoidal Surgery Serious Game

**NeuroSim** is a web-based serious game designed for **neurosurgery resident training**, focusing on the **endoscopic endonasal transsphenoidal approach** to pituitary adenomas, including navigation to the sphenoid sinus, identification of the sphenoid ostium, and progressive management of cavernous sinus–related challenges.

This project is **educational only** and is **not intended for clinical decision-making**.

---

## 🎯 Educational Goals

- Teach safe **endoscopic nasal navigation**
- Reinforce **anatomical landmarks** (septum, turbinates, sphenoid ostium)
- Simulate **medial wall cavernous sinus awareness**
- Train **economy of motion** and tremor control
- Expose trainees to **complication recognition** (e.g., ICA injury)
- Provide **real-time coaching feedback** via a virtual attending surgeon

---

## 🧠 Core Features

- **Hand-tracked endoscope control** using MediaPipe Hands
- **Physics-based scope behavior** (depth, angle, rotation)
- **Collision detection** with key anatomical structures
- **Patient vitals simulation** reacting to surgical events
- **Objective-driven levels** with scoring and grading
- **AI attending surgeon panel** (stubbed, no API keys required)
- **Multi-level progression** from basic navigation to crisis management
- **Fully client-side** (no backend required)

---

## 🚀 Development

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Testing

NeuroSim has a comprehensive test suite with **93 tests** covering:

- **ProceduralGeometry** (29 tests) - Perlin noise, geometry manipulation, vertex operations
- **CSGOperations** (38 tests) - Boolean operations, hollow geometry, caching
- **CollisionManager** (26 tests) - Collision handling, crisis detection, statistics

For detailed testing documentation, see [TESTING.md](./TESTING.md).

**Test Coverage**: 100% passing ✅

---

## 📚 Documentation

- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide
- **[CLAUDE.md](./CLAUDE.md)** - AI assistant development guide
- **[SETUP_COMPLETE.md](./SETUP_COMPLETE.md)** - Phase completion summary

---

## 🛠️ Technology Stack

- **React** 19.2.3 - UI framework
- **TypeScript** - Type-safe development
- **Three.js** 0.182.0 - 3D graphics
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/rapier** - Physics engine
- **three-bvh-csg** - CSG boolean operations
- **Vite** - Build tool and dev server
- **Vitest** - Testing framework

---

## 📄 License

ISC
