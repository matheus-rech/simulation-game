# Architecture Diagrams: Phase 1B & 1C

**Companion Document to ARCHITECTURE_PHASE1BC.md**

This document provides visual architecture diagrams and high-level summaries.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NEUROSIM APPLICATION                         │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                          UI LAYER                               │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │ │
│  │  │  App.tsx     │  │  Safety HUD  │  │  Technique Score   │  │ │
│  │  │  (Root)      │  │              │  │  HUD               │  │ │
│  │  │              │  │  - Risk      │  │  - Overall Score   │  │ │
│  │  │ [State Mgmt] │  │    Levels    │  │  - Component       │  │ │
│  │  │ - level      │  │  - Distance  │  │    Breakdown       │  │ │
│  │  │ - score      │  │  - Warnings  │  │  - Detailed        │  │ │
│  │  │ - collisions │  │              │  │    Metrics         │  │ │
│  │  └──────────────┘  └──────────────┘  └────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                 │                                    │
│                                 ▼                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    RENDERING LAYER                              │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │            EndoscopeView.tsx (R3F Canvas)                 │  │ │
│  │  │  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐ │  │ │
│  │  │  │ Three.js   │  │ Post-Process │  │ Physics Context  │ │  │ │
│  │  │  │ Scene      │  │ - DOF        │  │ (@react-three/   │ │  │ │
│  │  │  │            │  │ - Bloom      │  │  rapier)         │ │  │ │
│  │  │  └────────────┘  └──────────────┘  └──────────────────┘ │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                 │                                    │
│                                 ▼                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    SIMULATION LAYER                             │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐  │ │
│  │  │  Anatomy      │  │  Collision    │  │  Safety Corridor  │  │ │
│  │  │  Manager      │  │  Manager      │  │  Manager          │  │ │
│  │  │               │  │               │  │                   │  │ │
│  │  │ - CSG-based   │  │ - Tissue-     │  │ - Proximity       │  │ │
│  │  │   structures  │  │   specific    │  │   Detection       │  │ │
│  │  │ - Level-based │  │   responses   │  │ - Risk Levels     │  │ │
│  │  │   visibility  │  │ - Crisis      │  │ - Audio Warnings  │  │ │
│  │  │               │  │   detection   │  │                   │  │ │
│  │  └───────────────┘  └───────────────┘  └───────────────────┘  │ │
│  │                                                                  │ │
│  │  ┌───────────────────────────────────────────────────────────┐ │ │
│  │  │              🆕 PHASE 1B: SCORING LAYER                    │ │ │
│  │  │  ┌──────────────────┐  ┌──────────────────────────────┐  │ │ │
│  │  │  │ TechniqueScorer  │  │ useTechniqueScoring Hook     │  │ │ │
│  │  │  │                  │  │                              │  │ │ │
│  │  │  │ - Accuracy       │  │ - Orchestrates scoring       │  │ │ │
│  │  │  │ - Efficiency     │  │ - Integrates with collision  │  │ │ │
│  │  │  │ - Safety         │  │ - Integrates with safety     │  │ │ │
│  │  │  │ - Method         │  │ - Trajectory tracking        │  │ │ │
│  │  │  │                  │  │ - Real-time updates          │  │ │ │
│  │  │  └──────────────────┘  └──────────────────────────────┘  │ │ │
│  │  └───────────────────────────────────────────────────────────┘ │ │
│  │                                                                  │ │
│  │  ┌───────────────────────────────────────────────────────────┐ │ │
│  │  │              🆕 PHASE 1C: CURRICULUM LAYER                 │ │ │
│  │  │  ┌──────────────────┐  ┌──────────────────────────────┐  │ │ │
│  │  │  │ useCurriculum    │  │ CurriculumPersistence        │  │ │ │
│  │  │  │ Hook             │  │                              │  │ │ │
│  │  │  │                  │  │ - Progress Tracking          │  │ │ │
│  │  │  │ - State Machine  │  │ - Module Completion          │  │ │ │
│  │  │  │ - Module Mgmt    │  │ - Certification Records      │  │ │ │
│  │  │  │ - Success        │  │ - localStorage               │  │ │ │
│  │  │  │   Validation     │  │                              │  │ │ │
│  │  │  └──────────────────┘  └──────────────────────────────┘  │ │ │
│  │  └───────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                   ┌──────────────────────────┐
                   │   PERSISTENCE LAYER      │
                   │                          │
                   │  localStorage            │
                   │  - Technique Scores      │
                   │  - Curriculum Progress   │
                   │  - Certifications        │
                   │                          │
                   │  Future: Backend API     │
                   └──────────────────────────┘
```

---

## Phase 1B: Technique Scoring Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    TECHNIQUE SCORING SYSTEM                           │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                   DATA COLLECTION LAYER                          │ │
│  │                                                                   │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │ │
│  │  │  Collision   │  │  Safety      │  │  Trajectory           │ │ │
│  │  │  Events      │  │  Proximity   │  │  History              │ │ │
│  │  │              │  │  Events      │  │                       │ │ │
│  │  │ - Position   │  │ - Distance   │  │ - Position (3D)       │ │ │
│  │  │ - Tissue     │  │ - Risk Level │  │ - Velocity            │ │ │
│  │  │   Type       │  │ - Structure  │  │ - Backtracking Flag   │ │ │
│  │  │ - Intensity  │  │              │  │ - Timestamp           │ │ │
│  │  └──────────────┘  └──────────────┘  └───────────────────────┘ │ │
│  │         │                   │                    │               │ │
│  └─────────┼───────────────────┼────────────────────┼───────────────┘ │
│            │                   │                    │                 │
│            └───────────────────┼────────────────────┘                 │
│                                ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                   SCORING ENGINE (TechniqueScorer)               │ │
│  │                                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐│ │
│  │  │             COMPONENT SCORE CALCULATORS                      ││ │
│  │  │                                                               ││ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐││ │
│  │  │  │  Accuracy   │  │ Efficiency  │  │  Safety              │││ │
│  │  │  │             │  │             │  │                      │││ │
│  │  │  │ Base: 100   │  │ Base: 100   │  │  Base: 100           │││ │
│  │  │  │ - Critical  │  │ - Path      │  │  - Warning Events    │││ │
│  │  │  │   Collision │  │   Ratio     │  │    (-2 pts each)     │││ │
│  │  │  │   (-20 pts) │  │ - Backtrack │  │  - Danger Events     │││ │
│  │  │  │ - Non-Crit. │  │   (-5 pts)  │  │    (-10 pts each)    │││ │
│  │  │  │   (-2 pts)  │  │ - Time to   │  │  - Critical Events   │││ │
│  │  │  │             │  │   Target    │  │    (-25 pts each)    │││ │
│  │  │  └─────────────┘  └─────────────┘  └──────────────────────┘││ │
│  │  │                                                               ││ │
│  │  │  ┌──────────────────────────────────────────────────────────┐││ │
│  │  │  │  Method Adherence                                        │││ │
│  │  │  │                                                          │││ │
│  │  │  │  Base: 100                                               │││ │
│  │  │  │  - Incomplete Steps                                      │││ │
│  │  │  │  - Protocol Violations (-5 pts each)                     │││ │
│  │  │  └──────────────────────────────────────────────────────────┘││ │
│  │  └─────────────────────────────────────────────────────────────┘│ │
│  │                                 │                                 │ │
│  │                                 ▼                                 │ │
│  │  ┌─────────────────────────────────────────────────────────────┐│ │
│  │  │              WEIGHTED COMPOSITE SCORE                        ││ │
│  │  │                                                               ││ │
│  │  │  Overall = Accuracy × 0.35                                   ││ │
│  │  │          + Efficiency × 0.25                                 ││ │
│  │  │          + Safety × 0.30                                     ││ │
│  │  │          + Method × 0.10                                     ││ │
│  │  │                                                               ││ │
│  │  │  Range: 0-100                                                ││ │
│  │  └─────────────────────────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                 │                                     │
│                                 ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    OUTPUT & PERSISTENCE                          │ │
│  │                                                                   │ │
│  │  ┌──────────────────┐              ┌─────────────────────────┐  │ │
│  │  │  TechniqueScore  │─────────────>│  ScoringPersistence     │  │ │
│  │  │  Object          │              │  (localStorage)         │  │ │
│  │  │                  │              │                         │  │ │
│  │  │ - overall        │              │ - Autosave (1s)         │  │ │
│  │  │ - accuracy       │              │ - Session history       │  │ │
│  │  │ - efficiency     │              │ - Best scores           │  │ │
│  │  │ - safety         │              │ - Export to JSON        │  │ │
│  │  │ - method         │              │                         │  │ │
│  │  └──────────────────┘              └─────────────────────────┘  │ │
│  │          │                                                        │ │
│  │          └───────────────────────────┐                           │ │
│  │                                      ▼                           │ │
│  │                        ┌─────────────────────────┐               │ │
│  │                        │  TechniqueScoreHUD      │               │ │
│  │                        │  (UI Component)         │               │ │
│  │                        │                         │               │ │
│  │                        │ - Overall Score Display │               │ │
│  │                        │ - Component Bars        │               │ │
│  │                        │ - Detailed Metrics      │               │ │
│  │                        │ - Color-coded Feedback  │               │ │
│  │                        └─────────────────────────┘               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1C: Curriculum State Machine

```
┌──────────────────────────────────────────────────────────────────┐
│                  CURRICULUM STATE MACHINE                         │
│                                                                    │
│                      ┌─────────────────┐                          │
│                      │  NOT_ENROLLED   │                          │
│                      └────────┬────────┘                          │
│                               │ enroll()                          │
│                               ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                        BRIEFING                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  ModuleBriefingScreen                                 │  │  │
│  │  │  - Learning objectives                                │  │  │
│  │  │  - Instructions & tips                                │  │  │
│  │  │  - Success criteria                                   │  │  │
│  │  │  - Common mistakes                                    │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                           │ start()                               │
│                           ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                      SIMULATING                            │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  SimulationScreen (wraps EndoscopeView)              │  │  │
│  │  │  - Technique scoring active                          │  │  │
│  │  │  - Curriculum HUD overlay                            │  │  │
│  │  │  - Real-time objective tracking                      │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────┬───────────────────────────────────────────┬────────┘  │
│           │ pause()                          complete()│           │
│           ▼                                            ▼           │
│  ┌─────────────┐                            ┌──────────────────┐  │
│  │   PAUSED    │                            │     REVIEW       │  │
│  │             │                            │  ┌─────────────┐ │  │
│  │ - Timer     │◄──────────┐                │  │ Display:    │ │  │
│  │   stopped   │  resume()  │                │  │ - Score     │ │  │
│  │ - State     │            │                │  │ - Stats     │ │  │
│  │   preserved │────────────┘                │  │ - Details   │ │  │
│  └─────────────┘                            │  └─────────────┘ │  │
│                                              └────────┬─────────┘  │
│                                                       │ evaluate() │
│                                                       ▼            │
│                              ┌────────────────────────────────┐   │
│                              │  Success Criteria Validation   │   │
│                              │  - minScore                    │   │
│                              │  - maxCollisions               │   │
│                              │  - maxCriticalCollisions       │   │
│                              │  - customValidation()          │   │
│                              └────┬───────────────────┬───────┘   │
│                                   │ PASS              │ FAIL      │
│                                   ▼                   ▼           │
│  ┌────────────────────────────────────┐  ┌──────────────────────┐│
│  │           PASSED                   │  │       FAILED         ││
│  │  ┌──────────────────────────────┐  │  │  ┌────────────────┐ ││
│  │  │ SuccessScreen                │  │  │  │ FailureScreen  │ ││
│  │  │ - Celebration                │  │  │  │ - Reasons      │ ││
│  │  │ - Final Score                │  │  │  │ - Feedback     │ ││
│  │  │ - Unlock next module         │  │  │  │ - Retry option │ ││
│  │  └──────────────────────────────┘  │  │  └────────────────┘ ││
│  └────────────┬───────────────────────┘  └───────────┬──────────┘│
│               │ next_module()                        │ retry()    │
│               │                                      │            │
│               ▼                                      ▼            │
│  ┌─────────────────────┐                   ┌────────────────────┐│
│  │  Next Module        │                   │  Return to         ││
│  │  BRIEFING           │                   │  BRIEFING          ││
│  └─────────────────────┘                   └────────────────────┘│
│               │                                                   │
│               │ (if last module)                                 │
│               ▼                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                       CERTIFIED                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  CertificationScreen                                  │  │  │
│  │  │  - Generate certification                             │  │  │
│  │  │  - Display certificate                                │  │  │
│  │  │  - Export option                                      │  │  │
│  │  │  - Overall performance summary                        │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Curriculum Module Progression

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CURRICULUM MODULES                              │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  MODULE 1: Anatomical Recognition                           │    │
│  │  ┌────────────────────────────────────────────────────────┐ │    │
│  │  │  Level: 1 (Sphenoid Sinus)                             │ │    │
│  │  │  Duration: ~10 minutes                                  │ │    │
│  │  │  Prerequisites: None                                    │ │    │
│  │  │                                                          │ │    │
│  │  │  Objectives:                                            │ │    │
│  │  │  ✓ Identify sphenoid ostium                            │ │    │
│  │  │  ✓ Visualize septations                                │ │    │
│  │  │  ✓ Confirm cavity boundaries                           │ │    │
│  │  │  ✓ Recognize mucosa vs. bone                           │ │    │
│  │  │                                                          │ │    │
│  │  │  Success Criteria:                                      │ │    │
│  │  │  • Score ≥ 75                                           │ │    │
│  │  │  • Max 10 collisions                                    │ │    │
│  │  │  • 0 critical collisions                                │ │    │
│  │  │  • Safety score ≥ 80                                    │ │    │
│  │  │  • 100% method steps completed                          │ │    │
│  │  └────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                               │                                      │
│                               │ PASS                                 │
│                               ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  MODULE 2: Tumor Debulking (Non-Invasive)                   │    │
│  │  ┌────────────────────────────────────────────────────────┐ │    │
│  │  │  Level: 2 (Sella Turcica)                              │ │    │
│  │  │  Duration: ~15 minutes                                  │ │    │
│  │  │  Prerequisites: Module 1 ✓                              │ │    │
│  │  │                                                          │ │    │
│  │  │  Objectives:                                            │ │    │
│  │  │  ✓ Identify sella floor and open dura                  │ │    │
│  │  │  ✓ Recognize tumor boundaries                          │ │    │
│  │  │  ✓ Perform systematic tumor debulking                  │ │    │
│  │  │  ✓ Avoid carotid prominences                           │ │    │
│  │  │                                                          │ │    │
│  │  │  Success Criteria:                                      │ │    │
│  │  │  • Score ≥ 75                                           │ │    │
│  │  │  • Max 8 collisions                                     │ │    │
│  │  │  • 0 critical collisions (ICA/MWCS)                     │ │    │
│  │  │  • Safety score ≥ 75                                    │ │    │
│  │  │  • 90% method steps completed                           │ │    │
│  │  └────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                               │                                      │
│                               │ PASS                                 │
│                               ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  MODULE 3: MWCS Decision Making (Invasive)                  │    │
│  │  ┌────────────────────────────────────────────────────────┐ │    │
│  │  │  Level: 3 (Cavernous Sinus)                            │ │    │
│  │  │  Duration: ~20 minutes                                  │ │    │
│  │  │  Prerequisites: Module 1 ✓, Module 2 ✓                 │ │    │
│  │  │                                                          │ │    │
│  │  │  Objectives:                                            │ │    │
│  │  │  ✓ Identify MWCS and ICA relationship                  │ │    │
│  │  │  ✓ Assess tumor invasion into MWCS                     │ │    │
│  │  │  ✓ Determine safe dissection plane                     │ │    │
│  │  │  ✓ Execute safe MWCS dissection (if indicated)         │ │    │
│  │  │                                                          │ │    │
│  │  │  Success Criteria:                                      │ │    │
│  │  │  • Score ≥ 80 (HIGHER threshold)                        │ │    │
│  │  │  • Max 5 collisions                                     │ │    │
│  │  │  • 0 critical collisions                                │ │    │
│  │  │  • Safety score ≥ 85                                    │ │    │
│  │  │  • 95% method steps completed                           │ │    │
│  │  │  • Custom: ICA closest approach > 0.5mm                 │ │    │
│  │  └────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                               │                                      │
│                               │ PASS                                 │
│                               ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   🎓 CERTIFICATION                           │    │
│  │  ┌────────────────────────────────────────────────────────┐ │    │
│  │  │  Certification Type: Basic                              │ │    │
│  │  │  Issued: [Date]                                         │ │    │
│  │  │  Overall Score: [Average of all modules]               │ │    │
│  │  │                                                          │ │    │
│  │  │  Digital Certificate:                                   │ │    │
│  │  │  - JSON export                                          │ │    │
│  │  │  - Module completion records                            │ │    │
│  │  │  - Performance summary                                  │ │    │
│  │  │  - Future: Blockchain verification                      │ │    │
│  │  └────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Scoring Integration

```
┌────────────────────────────────────────────────────────────────────┐
│                      DATA FLOW DIAGRAM                              │
│                                                                      │
│  User Action (Endoscope Movement)                                   │
│         │                                                            │
│         ▼                                                            │
│  ┌─────────────────┐                                                │
│  │  EndoscopeRig   │                                                │
│  │  (Raycasting)   │                                                │
│  └────────┬────────┘                                                │
│           │                                                          │
│           │ Collision Detected                                      │
│           ▼                                                          │
│  ┌─────────────────────────┐                                        │
│  │  CollisionManager       │                                        │
│  │  handleCollision()      │                                        │
│  └──────────┬──────────────┘                                        │
│             │                                                        │
│             ├───────────────┬──────────────┐                        │
│             │               │              │                        │
│             ▼               ▼              ▼                        │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────────┐ │
│  │  Update      │  │  Trigger      │  │  🆕 useTechniqueScoring  │ │
│  │  Legacy      │  │  Crisis       │  │  recordCollision()       │ │
│  │  Score       │  │  (if ICA)     │  │                          │ │
│  └──────────────┘  └───────────────┘  └──────────┬──────────────┘ │
│                                                   │                 │
│                                                   ▼                 │
│                                        ┌────────────────────────┐  │
│                                        │  TechniqueScorer       │  │
│                                        │  - Add to collision    │  │
│                                        │    history             │  │
│                                        │  - Update accuracy     │  │
│                                        │    metrics             │  │
│                                        └────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Safety Corridor (Every Frame)                               │ │
│  │                                                               │ │
│  │  SafetyCorridorManager                                       │ │
│  │  calculateSafetyZones()                                      │ │
│  └───────────────┬──────────────────────────────────────────────┘ │
│                  │                                                 │
│                  │ Proximity Event (if risk > SAFE)               │
│                  ▼                                                 │
│  ┌──────────────────────────┐                                     │
│  │  App.tsx                 │                                     │
│  │  handleSafetyChange()    │                                     │
│  └──────────┬───────────────┘                                     │
│             │                                                      │
│             ├──────────────┬────────────────┐                     │
│             │              │                │                     │
│             ▼              ▼                ▼                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │  Update      │  │  Trigger     │  │  🆕 useTechniqueScoring │    │
│  │  SafetyHUD   │  │  Audio       │  │  recordProximityEvent()│    │
│  └──────────────┘  │  Warning     │  └──────────┬──────────┘    │
│                    └──────────────┘             │                │
│                                                 ▼                │
│                                      ┌────────────────────────┐  │
│                                      │  TechniqueScorer       │  │
│                                      │  - Add to proximity    │  │
│                                      │    history             │  │
│                                      │  - Update safety       │  │
│                                      │    metrics             │  │
│                                      └────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Position Update (Every 100ms)                           │  │
│  │                                                           │  │
│  │  useEffect(() => {                                       │  │
│  │    scoring.recordPosition(tipPosition, Date.now())       │  │
│  │  }, [tipPosition])                                       │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│               ┌────────────────────────┐                        │
│               │  TechniqueScorer       │                        │
│               │  - Add to trajectory   │                        │
│               │    ring buffer         │                        │
│               │  - Calculate velocity  │                        │
│               │  - Detect backtracking │                        │
│               └────────────────────────┘                        │
│                          │                                      │
│  ┌───────────────────────┼──────────────────────────────────┐  │
│  │  Score Calculation (Every 1 second)                       │  │
│  │                      │                                    │  │
│  │  setInterval(() => { ▼                                    │  │
│  │    scorer.calculateScore()                                │  │
│  │  }, 1000)   ┌──────────────────────────┐                 │  │
│  │             │  TechniqueScorer          │                 │  │
│  │             │  calculateScore()         │                 │  │
│  │             │  - calculateAccuracy()    │                 │  │
│  │             │  - calculateEfficiency()  │                 │  │
│  │             │  - calculateSafety()      │                 │  │
│  │             │  - calculateMethod()      │                 │  │
│  │             │  - Compute weighted avg   │                 │  │
│  │             └────────────┬──────────────┘                 │  │
│  │                          │                                │  │
│  │                          ▼                                │  │
│  │             ┌──────────────────────────┐                  │  │
│  │             │  TechniqueScore Object   │                  │  │
│  │             └────────────┬─────────────┘                  │  │
│  └──────────────────────────┼────────────────────────────────┘  │
│                             │                                   │
│                             ├──────────────┬────────────────┐   │
│                             │              │                │   │
│                             ▼              ▼                ▼   │
│              ┌──────────────────┐  ┌──────────┐  ┌────────────┐│
│              │  onScoreUpdate() │  │ Autosave │  │ Display in ││
│              │  (App.tsx)       │  │ (local   │  │ Technique  ││
│              │                  │  │ Storage) │  │ ScoreHUD   ││
│              └──────────────────┘  └──────────┘  └────────────┘│
└────────────────────────────────────────────────────────────────────┘
```

---

## Performance Budget

```
┌─────────────────────────────────────────────────────────────┐
│                    PERFORMANCE TARGETS                       │
│                                                               │
│  Frame Rate:                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Target:  60 FPS (16.67ms per frame)                 │   │
│  │  Current: 60 FPS (baseline without scoring)          │   │
│  │  Goal:    60 FPS (with scoring enabled)              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Scoring Overhead Budget:                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Per-Frame Operations:                               │   │
│  │  • Position recording:         < 1ms                 │   │
│  │  • Collision event:            < 1ms (debounced)     │   │
│  │  • Proximity event:            < 1ms                 │   │
│  │                                                       │   │
│  │  Periodic Operations (1s interval):                  │   │
│  │  • Score calculation:          < 5ms                 │   │
│  │  • Autosave to localStorage:   < 2ms                 │   │
│  │                                                       │   │
│  │  Total Overhead:               < 10ms (periodic)     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Memory Budget:                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Trajectory Ring Buffer:       4KB (1000 points)     │   │
│  │  Collision History:            2KB (100 events)      │   │
│  │  Proximity History:            2KB                   │   │
│  │  Scoring State:                1KB                   │   │
│  │  Total Per Session:            < 10KB                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Storage (localStorage):                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Technique Scores:             ~50 scores × 5KB      │   │
│  │  Curriculum Progress:          < 10KB                │   │
│  │  Certifications:               < 5KB                 │   │
│  │  Total:                        < 300KB               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Future Architecture: AI Integration (Phase 2/3)

```
┌──────────────────────────────────────────────────────────────────┐
│                    FUTURE: AI COACHING SYSTEM                     │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    FRONTEND (Current)                       │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  Technique Scoring + Trajectory Tracking             │  │  │
│  │  └──────────────────────┬───────────────────────────────┘  │  │
│  └─────────────────────────┼──────────────────────────────────┘  │
│                            │                                      │
│                            │ HTTPS/WebSocket                      │
│                            ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    BACKEND API (New)                        │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  Express.js / FastAPI Server                         │  │  │
│  │  │                                                       │  │  │
│  │  │  Endpoints:                                          │  │  │
│  │  │  • POST /api/v1/scores       (save score)           │  │  │
│  │  │  • POST /api/v1/coaching     (request AI feedback)  │  │  │
│  │  │  • POST /api/v1/telemetry    (training data)        │  │  │
│  │  │  • GET  /api/v1/leaderboard  (rankings)             │  │  │
│  │  └──────────────────────┬───────────────────────────────┘  │  │
│  └─────────────────────────┼──────────────────────────────────┘  │
│                            │                                      │
│                            ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    AI SERVICES LAYER                        │  │
│  │  ┌──────────────────┐  ┌───────────────┐  ┌─────────────┐ │  │
│  │  │  Claude Vision   │  │  Trajectory   │  │  Risk       │ │  │
│  │  │  API             │  │  Predictor    │  │  Analyzer   │ │  │
│  │  │                  │  │  (ML Model)   │  │  (ML Model) │ │  │
│  │  │ - Screenshot     │  │               │  │             │ │  │
│  │  │   Analysis       │  │ - Physics-    │  │ - ICA risk  │ │  │
│  │  │ - Contextual     │  │   based       │  │   heatmap   │ │  │
│  │  │   Feedback       │  │   prediction  │  │ - Collision │ │  │
│  │  │ - Technique      │  │ - Collision   │  │   prob.     │ │  │
│  │  │   Recommendations│  │   probability │  │             │ │  │
│  │  └──────────────────┘  └───────────────┘  └─────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    DATABASE LAYER                           │  │
│  │  ┌──────────────────┐  ┌───────────────┐  ┌─────────────┐ │  │
│  │  │  PostgreSQL      │  │  Redis        │  │  S3 Bucket  │ │  │
│  │  │  - User data     │  │  - Session    │  │  - Training │ │  │
│  │  │  - Scores        │  │    cache      │  │    data     │ │  │
│  │  │  - Progress      │  │  - Leaderboard│  │  - Telemetry│ │  │
│  │  │  - Certs         │  │               │  │             │ │  │
│  │  └──────────────────┘  └───────────────┘  └─────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions Summary

| Decision | Rationale |
|----------|-----------|
| **State Management: Centralized in App.tsx** | Matches current architecture; simple to implement; avoids new dependencies |
| **Scoring Frequency: 1 second intervals** | Balances real-time feedback with performance; <5ms calculation time |
| **Trajectory Storage: Ring Buffer (1000 points)** | Prevents unbounded memory growth; sufficient for analysis |
| **Persistence: localStorage first** | Simple implementation; easy migration to backend API later |
| **Curriculum: State Machine** | Clear transitions; easy to test; handles all edge cases |
| **Success Criteria: Per-module thresholds** | Progressive difficulty; encourages mastery before advancement |
| **No new dependencies** | Minimizes bundle size; uses existing Three.js/R3F ecosystem |

---

## Integration Checklist

### Phase 1B (Technique Scoring)

- [ ] Create `src/components/3d/scoring/` directory
- [ ] Implement `TechniqueScorer.ts` class
- [ ] Implement `useTechniqueScoring.ts` hook
- [ ] Implement `RingBuffer.ts` utility
- [ ] Implement `ScoringPersistence.ts`
- [ ] Create `TechniqueScoreHUD.tsx` component
- [ ] Integrate with `CollisionManager.tsx`
- [ ] Integrate with `SafetyCorridorManager.tsx`
- [ ] Add position tracking to `App.tsx`
- [ ] Write unit tests (target 90% coverage)
- [ ] Performance profiling (<10ms overhead)

### Phase 1C (Curriculum Mode)

- [ ] Create `src/components/curriculum/` directory
- [ ] Define curriculum modules in `modules.ts`
- [ ] Implement `useCurriculum.ts` hook
- [ ] Implement `CurriculumPersistence.ts`
- [ ] Create `CurriculumScreen.tsx`
- [ ] Create screen components:
  - [ ] `EnrollmentScreen.tsx`
  - [ ] `ModuleBriefingScreen.tsx`
  - [ ] `SimulationScreen.tsx`
  - [ ] `ReviewScreen.tsx`
  - [ ] `SuccessScreen.tsx`
  - [ ] `FailureScreen.tsx`
  - [ ] `CertificationScreen.tsx`
- [ ] Add mode selector to `App.tsx`
- [ ] Write state machine tests
- [ ] User flow testing (E2E)

---

## Questions for Stakeholder Review

1. **Scoring Weights**: Are the default weights appropriate?
   - Accuracy: 35%
   - Efficiency: 25%
   - Safety: 30%
   - Method: 10%

2. **Success Criteria**: Are module thresholds realistic?
   - Module 1: Score ≥ 75, max 10 collisions
   - Module 2: Score ≥ 75, max 8 collisions
   - Module 3: Score ≥ 80, max 5 collisions

3. **Curriculum Scope**: Should we add more modules or focus on these 3?

4. **AI Integration**: Priority for Phase 1 or defer to Phase 2?

5. **Backend API**: Should we implement backend sooner for data analytics?

6. **Multiplayer**: Instructor observation mode in Phase 1C or Phase 2?

---

## Next Steps

1. **Review** this architecture with team
2. **Prioritize** Phase 1B vs 1C (or parallel development)
3. **Assign** implementation tasks
4. **Set up** testing infrastructure
5. **Begin** development following roadmap

---

**Document Version**: 1.0
**Last Updated**: 2026-01-22
**Author**: Backend System Architect
**Related Documents**: ARCHITECTURE_PHASE1BC.md
