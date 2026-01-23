# Phase 3B: AI Surgical Mentor - Implementation Summary

## Overview

This document summarizes the complete design for the AI Surgical Mentor system (Phase 3B), integrating Claude Vision API with the NeuroSim surgical training simulator and bridging functionality from the NeuroVision project.

---

## Deliverables Created

### 1. Architecture Documentation

**File**: `/docs/AI_SURGICAL_MENTOR_ARCHITECTURE.md`

Contains:
- Architecture decision (Hybrid Backend + Frontend recommended)
- System architecture diagram
- Data pipeline design (frame capture, WebSocket streaming)
- Analysis orchestrator design
- Response format specifications
- Frontend integration (MentorUI component, hooks)
- Cost estimation and optimization strategies
- Implementation roadmap (6 weeks)

### 2. Integration Analysis

**File**: `/docs/NEUROSIM_NEUROVISION_INTEGRATION.md`

Contains:
- Feature comparison matrix (19 capabilities compared)
- Code portability analysis
- Directly portable modules (PerformanceMetrics, ProcedureStep)
- Shared constants and thresholds
- API contract specifications
- Synthetic training data generation plan

### 3. Backend Implementation

**Directory**: `/backend/app/`

| File | Purpose |
|------|---------|
| `main.py` | FastAPI application with all endpoints |
| `models/telemetry.py` | Data models for sessions, events, metrics |
| `services/trajectory_analyzer.py` | Trajectory analysis and scoring algorithms |
| `prompts/mentor_prompts.py` | Claude prompt templates with tone adaptation |

### 4. Configuration Files

| File | Purpose |
|------|---------|
| `backend/requirements.txt` | Python dependencies |
| `backend/pyproject.toml` | Modern Python project configuration |
| `backend/README.md` | Backend documentation and quick start |

---

## Key Architecture Decisions

### 1. Backend vs Frontend: Backend (FastAPI) Recommended

**Rationale**:
- API key security (keys stay server-side)
- Server-managed rate limiting and throttling
- Persistent session telemetry storage
- Direct integration with NeuroVision Python modules
- Cost management and billing control

### 2. Frame Capture Approach: Canvas.toDataURL()

**Implementation**:
```typescript
const imageData = canvas.toDataURL('image/jpeg', 0.85);
// Send base64 JPEG to backend at 2 FPS
```

**Rationale**:
- Native browser API, no dependencies
- JPEG compression reduces payload (vs PNG)
- 2 FPS sufficient for analysis (matches NeuroVision)
- Quality 0.85 balances size vs clarity

### 3. Communication: WebSocket + HTTP Fallback

**Primary**: WebSocket `/ws/mentor/stream` for real-time feedback
**Fallback**: HTTP POST `/api/v1/mentor/analyze` for reliability

**Rationale**:
- WebSocket provides <100ms latency
- HTTP fallback handles connection drops
- Both use same request/response format

### 4. Tone Adaptation: Three-Tier System

| Tone | Trigger | UI Treatment |
|------|---------|--------------|
| Encouraging | All safe (>3mm) | Green, positive language |
| Cautionary | Warning zone (1-3mm) | Yellow, alert language |
| Urgent | Danger/Critical (<1mm) | Red, direct commands |

---

## API Endpoints Summary

### Mentor Analysis

```
POST /api/v1/mentor/analyze
WebSocket /ws/mentor/stream
```

### Session Management

```
POST /api/v1/session/start
POST /api/v1/session/{id}/event
POST /api/v1/session/{id}/end
GET /api/v1/session/{id}/report
```

### Trainee Progress

```
GET /api/v1/trainee/{id}/progress
```

---

## Scoring System (from NeuroVision)

| Metric | Weight | Description |
|--------|--------|-------------|
| Safety | 30% | Critical structure avoidance |
| Accuracy | 25% | Trajectory precision |
| Technique | 20% | Movement smoothness |
| Efficiency | 15% | Path economy |
| Time | 10% | Completion speed |

**Grades**:
- A (90-100): Excellent
- B (80-89): Proficient
- C (70-79): Competent
- D (60-69): Developing
- F (<60): Needs Improvement

---

## Prompt Engineering Highlights

### System Prompt Structure

1. **Role Definition**: Expert neurosurgeon mentor
2. **Anatomical Context**: Transsphenoidal approach details
3. **Critical Structures**: ICA, MWCS with safety margins
4. **Response Format**: Structured JSON
5. **Tone Instructions**: Dynamic based on safety status

### Example Coaching Messages

**Encouraging** (safe):
> "Good orientation. The middle turbinate is clearly visible on your left. Continue advancing toward the sphenoid ostium."

**Cautionary** (warning):
> "Be careful here. The left carotid prominence is visible, indicating the ICA is 1.8mm away. Stay medial."

**Urgent** (critical):
> "Stop. You are 0.7mm from the right internal carotid artery. Move medially immediately."

---

## Integration with NeuroVision

### Directly Ported

1. **PerformanceMetrics** dataclass with weighted scoring
2. **Safety margin thresholds** (2mm ICA, 1mm MWCS)
3. **Risk level classifications** (safe/warning/danger/critical)
4. **Collision penalties** by tissue type

### Can Be Integrated Later

1. **NeuroimagingSegmenter** for frame validation
2. **Procedure library** with step-by-step assessment
3. **Voice alert generation** with TTS integration

### Synthetic Data Export

NeuroSim can generate labeled training data for NeuroVision:
- Annotated endoscopic frames
- Trajectory paths with safety classifications
- Expert vs novice session recordings

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Set up FastAPI backend
- [ ] Implement WebSocket endpoint
- [ ] Create FrameCaptureService in frontend
- [ ] Basic MentorUI component

### Phase 2: Analysis Pipeline (Week 2-3)
- [ ] Implement AnalysisOrchestrator
- [ ] Build prompt templates with tone adaptation
- [ ] Add response parsing and validation
- [ ] Integrate safety zone data from frontend

### Phase 3: Frontend Integration (Week 3-4)
- [ ] useMentorCapture hook
- [ ] MentorUI with all tone variants
- [ ] Voice message output (Web Speech API)
- [ ] Settings panel for mentor configuration

### Phase 4: NeuroVision Integration (Week 4-5)
- [ ] Port PerformanceMetrics to TypeScript
- [ ] Integrate procedure library
- [ ] Add session telemetry storage
- [ ] Build technique analysis reports

### Phase 5: Testing & Optimization (Week 5-6)
- [ ] End-to-end testing
- [ ] Performance optimization (caching, throttling)
- [ ] User testing and feedback
- [ ] Documentation

---

## Cost Estimation

### Claude API Usage (Monthly)

| Operation | Frequency | Estimated Cost |
|-----------|-----------|----------------|
| Frame Analysis | 2/sec * 30min * 20 sessions | $50-100 |
| Session Summary | 1/session * 20 sessions | ~$1 |
| **Total** | | **$50-150** |

### Optimization Strategies

1. **Caching**: Cache responses for similar contexts
2. **Throttling**: Max 2 requests/second
3. **Context Compression**: Only send changed metadata
4. **Batch Analysis**: Queue for non-real-time processing

---

## Quick Start

### Backend

```bash
cd backend
uv venv && source .venv/bin/activate
uv pip install -e ".[dev]"

# Configure
echo "ANTHROPIC_API_KEY=sk-ant-your-key" > .env

# Run
uvicorn app.main:app --reload --port 8000
```

### Frontend Integration

```typescript
// Add to App.tsx or dedicated MentorProvider
const [mentorEnabled, setMentorEnabled] = useState(false);
const { feedback, sendFrame } = useMentorCapture({ enabled: mentorEnabled });

// Render MentorUI
<MentorUI feedback={feedback} visible={mentorEnabled} />
```

---

## Files Created

```
simulation-game/
├── docs/
│   ├── AI_SURGICAL_MENTOR_ARCHITECTURE.md
│   ├── NEUROSIM_NEUROVISION_INTEGRATION.md
│   └── PHASE_3B_SUMMARY.md (this file)
└── backend/
    ├── app/
    │   ├── __init__.py
    │   ├── main.py
    │   ├── models/
    │   │   └── telemetry.py
    │   ├── services/
    │   │   └── trajectory_analyzer.py
    │   └── prompts/
    │       └── mentor_prompts.py
    ├── requirements.txt
    ├── pyproject.toml
    └── README.md
```

---

## Next Steps

1. **Review architecture documents** with team
2. **Set up development environment** for backend
3. **Begin Phase 1** implementation
4. **Create frontend hooks and components**
5. **Integrate with existing SafetyCorridorManager**

---

## Questions Answered

### Q1: Backend or Frontend for Claude Vision?

**Answer**: Backend (FastAPI) recommended for security, rate limiting, and NeuroVision integration.

### Q2: How to capture frames from Three.js?

**Answer**: Canvas.toDataURL('image/jpeg', 0.85) at 2 FPS, send via WebSocket.

### Q3: What metadata to send with frame?

**Answer**: Level, scope position/angle, safety zones, recent collisions, session duration, current objective.

### Q4: Response format for mentor?

**Answer**: Structured JSON with visible_structures, current_location, is_safe, coaching_message, recommended_action.

### Q5: Which NeuroVision modules can be ported?

**Answer**: PerformanceMetrics, safety thresholds, collision penalties, procedure library - all TypeScript portable.
