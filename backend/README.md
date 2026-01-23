# NeuroSim AI Mentor Backend

FastAPI backend for AI-powered surgical mentorship in the NeuroSim training simulator.

## Features

- **Real-time Frame Analysis**: Claude Vision API integration for endoscopic scene understanding
- **AI Surgical Mentorship**: Context-aware coaching with tone adaptation (encouraging/cautionary/urgent)
- **Session Telemetry**: Record and analyze training sessions
- **Performance Metrics**: Comprehensive scoring system (accuracy, efficiency, safety, technique, time)
- **Learning Curve Analysis**: Track trainee progress across sessions
- **WebSocket Streaming**: Low-latency real-time feedback

## Quick Start

### Prerequisites

- Python 3.11+
- Anthropic API key with Claude Vision access

### Installation

```bash
# Using uv (recommended)
cd backend
uv venv
source .venv/bin/activate
uv pip install -e ".[dev]"

# Or using pip
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

### Configuration

Create a `.env` file:

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
MENTOR_MODEL=claude-sonnet-4-20250514
MENTOR_ANALYSIS_INTERVAL=0.5
MENTOR_MAX_TOKENS=1024
```

### Running

```bash
# Development
uvicorn app.main:app --reload --port 8000

# Production
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

## API Endpoints

### Mentor Analysis

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/mentor/analyze` | POST | Analyze single frame |
| `/ws/mentor/stream` | WebSocket | Real-time streaming analysis |

### Session Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/session/start` | POST | Start new session |
| `/api/v1/session/{id}/event` | POST | Record session event |
| `/api/v1/session/{id}/end` | POST | End session, get report |
| `/api/v1/session/{id}/report` | GET | Get session report |

### Trainee Progress

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/trainee/{id}/progress` | GET | Get trainee learning curve |

## Architecture

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── models/
│   │   └── telemetry.py     # Data models
│   ├── services/
│   │   └── trajectory_analyzer.py  # Analysis algorithms
│   └── prompts/
│       └── mentor_prompts.py       # Claude prompt templates
├── tests/
├── pyproject.toml
└── requirements.txt
```

## Testing

```bash
pytest tests/ -v
```

## Frontend Integration

### Polling-based (Simple)

```typescript
const response = await fetch('http://localhost:8000/api/v1/mentor/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image_data: base64Frame,
    timestamp: Date.now(),
    frame_id: frameCount,
    metadata: {
      level: currentLevel,
      scope_position: { x: 0, y: 0.3, z: -7.2 },
      scope_angle: { pitch: 0, yaw: 0 },
      safety_zones: safetyZoneData,
      recent_collisions: recentCollisions,
      session_duration: sessionDuration
    }
  })
});

const feedback = await response.json();
```

### WebSocket (Real-time)

```typescript
const ws = new WebSocket('ws://localhost:8000/ws/mentor/stream');

ws.onmessage = (event) => {
  const feedback = JSON.parse(event.data);
  updateMentorUI(feedback);
};

// Send frames at 2 FPS
setInterval(() => {
  ws.send(JSON.stringify({
    image_data: captureFrame(),
    timestamp: Date.now(),
    frame_id: ++frameCount,
    metadata: getMetadata()
  }));
}, 500);
```

## Scoring System

| Metric | Weight | Description |
|--------|--------|-------------|
| Safety | 30% | Critical structure avoidance |
| Accuracy | 25% | Trajectory precision |
| Technique | 20% | Movement smoothness |
| Efficiency | 15% | Path economy |
| Time | 10% | Completion speed |

### Grades

- **A (90-100)**: Excellent - Certification eligible
- **B (80-89)**: Proficient - Certification eligible if consistent
- **C (70-79)**: Competent - Needs more practice
- **D (60-69)**: Developing - Significant improvement needed
- **F (<60)**: Needs Improvement - Fundamental skills review

## License

MIT
