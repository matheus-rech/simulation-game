"""
NeuroSim AI Mentor Backend

FastAPI application providing AI-powered surgical mentorship for the
NeuroSim surgical training simulator.

Endpoints:
- POST /api/v1/mentor/analyze - Analyze frame and get mentor feedback
- WebSocket /ws/mentor/stream - Real-time mentor streaming
- POST /api/v1/session/start - Start a training session
- POST /api/v1/session/{session_id}/event - Record session event
- GET /api/v1/session/{session_id}/report - Get session report
- GET /api/v1/trainee/{trainee_id}/progress - Get trainee progress
"""

import os
import json
import time
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import anthropic

from .models.telemetry import (
    Vector3D, ScopeAngle, CollisionEvent, CrisisEvent,
    SafetyZoneEvent, LevelAdvanceEvent, SessionRecord,
    PerformanceMetrics, TissueType, CrisisType, RiskLevel
)
from .services.trajectory_analyzer import TrajectoryAnalyzer, RecommendationsGenerator
from .prompts.mentor_prompts import (
    MentorPromptBuilder, MentorContext, MentorTone,
    generate_voice_message, MentorResponse
)


# =============================================================================
# CONFIGURATION
# =============================================================================

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
MENTOR_MODEL = os.environ.get("MENTOR_MODEL", "claude-sonnet-4-20250514")
MENTOR_ANALYSIS_INTERVAL = float(os.environ.get("MENTOR_ANALYSIS_INTERVAL", "0.5"))
MENTOR_MAX_TOKENS = int(os.environ.get("MENTOR_MAX_TOKENS", "1024"))


# =============================================================================
# APPLICATION LIFESPAN
# =============================================================================

# In-memory storage (replace with database in production)
sessions: Dict[str, SessionRecord] = {}
trainee_sessions: Dict[str, List[str]] = {}  # trainee_id -> session_ids


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management."""
    # Startup
    print("Starting NeuroSim AI Mentor Backend...")
    print(f"  Anthropic API Key: {'configured' if ANTHROPIC_API_KEY else 'NOT CONFIGURED'}")
    print(f"  Model: {MENTOR_MODEL}")
    print(f"  Analysis Interval: {MENTOR_ANALYSIS_INTERVAL}s")

    yield

    # Shutdown
    print("Shutting down NeuroSim AI Mentor Backend...")


# =============================================================================
# FASTAPI APP
# =============================================================================

app = FastAPI(
    title="NeuroSim AI Mentor API",
    description="AI-powered surgical mentorship for NeuroSim training simulator",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class FrameMetadata(BaseModel):
    """Metadata accompanying each frame for analysis."""
    level: int = Field(..., ge=1, le=3, description="Surgical level 1-3")
    scope_position: Dict[str, float] = Field(..., description="Scope tip position {x, y, z}")
    scope_angle: Dict[str, float] = Field(..., description="Scope angle {pitch, yaw}")
    safety_zones: List[Dict[str, Any]] = Field(default_factory=list)
    recent_collisions: List[Dict[str, Any]] = Field(default_factory=list)
    session_duration: float = Field(default=0, description="Session duration in seconds")


class AnalysisRequest(BaseModel):
    """Request for frame analysis."""
    image_data: str = Field(..., description="Base64 encoded JPEG image")
    timestamp: int = Field(..., description="Frame timestamp (Unix ms)")
    frame_id: int = Field(..., description="Frame sequence number")
    metadata: FrameMetadata


class MentorFeedback(BaseModel):
    """Response from mentor analysis."""
    frame_id: int
    timestamp: str
    processing_time_ms: float

    # Anatomical context
    visible_structures: List[Dict[str, Any]]
    current_location: str

    # Safety assessment
    safety_level: str
    safety_score: float
    closest_critical: Optional[Dict[str, Any]]

    # Coaching feedback
    coaching_message: str
    tone: str
    recommended_action: Optional[str]

    # Voice output
    voice_message: Optional[str]


class SessionStartRequest(BaseModel):
    """Request to start a new session."""
    trainee_id: str
    procedure: str = "transsphenoidal_pituitary"


class SessionStartResponse(BaseModel):
    """Response after starting a session."""
    session_id: str
    start_time: str


class SessionEventRequest(BaseModel):
    """Request to record a session event."""
    event_type: str  # collision, crisis, level_advance, safety_zone
    event_data: Dict[str, Any]


class SessionReport(BaseModel):
    """Complete session report."""
    session_id: str
    trainee_id: str
    procedure: str
    start_time: str
    end_time: Optional[str]
    duration_seconds: float

    # Metrics
    metrics: Dict[str, Any]
    grade: str
    certification_eligible: bool

    # Events summary
    total_collisions: int
    total_crises: int
    levels_completed: int

    # Recommendations
    recommendations: List[str]


# =============================================================================
# MENTOR ANALYSIS SERVICE
# =============================================================================

class MentorAnalysisService:
    """
    Service for analyzing frames and generating mentor feedback.
    """

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None
        self.prompt_builder = MentorPromptBuilder()
        self.last_analysis_time = 0
        self._last_response: Optional[Dict] = None
        self._analysis_count = 0

    async def analyze(self, request: AnalysisRequest) -> MentorFeedback:
        """Analyze a frame and generate mentor feedback."""
        start_time = time.time()

        # Build context
        context = self.prompt_builder.build_context(
            level=request.metadata.level,
            scope_position=request.metadata.scope_position,
            scope_angle=request.metadata.scope_angle,
            safety_zones=request.metadata.safety_zones,
            recent_collisions=request.metadata.recent_collisions,
            session_duration=request.metadata.session_duration
        )

        # Determine tone
        tone = self.prompt_builder.determine_tone(context)

        # Check rate limiting
        current_time = time.time()
        should_run_claude = (
            self.client and
            (current_time - self.last_analysis_time) >= MENTOR_ANALYSIS_INTERVAL
        )

        if should_run_claude:
            try:
                claude_response = await self._call_claude(request.image_data, context, tone)
                self._last_response = claude_response
                self.last_analysis_time = current_time
                self._analysis_count += 1
            except Exception as e:
                print(f"Claude analysis error: {e}")
                claude_response = self._last_response or self._fallback_response(context)
        else:
            claude_response = self._last_response or self._fallback_response(context)

        # Parse response
        mentor_response = MentorResponse.from_dict(claude_response)

        # Generate voice message
        voice = generate_voice_message(mentor_response, context, tone)

        processing_time = (time.time() - start_time) * 1000

        return MentorFeedback(
            frame_id=request.frame_id,
            timestamp=datetime.now().isoformat(),
            processing_time_ms=processing_time,
            visible_structures=mentor_response.visible_structures,
            current_location=mentor_response.current_location,
            safety_level=self._assess_safety_level(context),
            safety_score=self._calculate_safety_score(context),
            closest_critical=self._get_closest_critical(context.safety_zones),
            coaching_message=mentor_response.coaching_message,
            tone=tone.value,
            recommended_action=mentor_response.recommended_action,
            voice_message=voice
        )

    async def _call_claude(
        self,
        image_data: str,
        context: MentorContext,
        tone: MentorTone
    ) -> Dict[str, Any]:
        """Call Claude Vision API for analysis."""
        system_prompt = self.prompt_builder.build_system_prompt(tone)
        user_prompt = self.prompt_builder.build_user_prompt(context)

        message = self.client.messages.create(
            model=MENTOR_MODEL,
            max_tokens=MENTOR_MAX_TOKENS,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": image_data
                            }
                        },
                        {
                            "type": "text",
                            "text": user_prompt
                        }
                    ]
                }
            ]
        )

        response_text = message.content[0].text

        # Parse JSON response
        try:
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            return json.loads(response_text.strip())
        except json.JSONDecodeError:
            return {
                "visible_structures": [],
                "current_location": "Unable to determine",
                "is_safe": True,
                "coaching_message": response_text[:200],
                "recommended_action": None
            }

    def _fallback_response(self, context: MentorContext) -> Dict[str, Any]:
        """Generate fallback response when Claude unavailable."""
        level_locations = {
            1: "Nasal cavity approach",
            2: "Sphenoid sinus region",
            3: "Sellar access area"
        }

        return {
            "visible_structures": [],
            "current_location": level_locations.get(context.level, "Unknown"),
            "is_safe": len([z for z in context.safety_zones
                          if z.get("riskLevel") in ("danger", "critical")]) == 0,
            "coaching_message": f"Continue with {context.current_objective}. Maintain awareness of critical structures.",
            "recommended_action": None
        }

    def _assess_safety_level(self, context: MentorContext) -> str:
        """Assess overall safety level."""
        for zone in context.safety_zones:
            risk = zone.get("riskLevel", "safe")
            if risk == "critical":
                return "critical"
            elif risk == "danger":
                return "danger"
            elif risk == "warning":
                return "warning"
        return "safe"

    def _calculate_safety_score(self, context: MentorContext) -> float:
        """Calculate safety score (0-100)."""
        score = 100.0

        for zone in context.safety_zones:
            risk = zone.get("riskLevel", "safe")
            if risk == "critical":
                score -= 40
            elif risk == "danger":
                score -= 20
            elif risk == "warning":
                score -= 10

        score -= len(context.recent_collisions) * 5

        return max(0, min(100, score))

    def _get_closest_critical(self, safety_zones: List[Dict]) -> Optional[Dict]:
        """Find the closest critical structure."""
        critical_names = ["ICA Left", "ICA Right", "MWCS Left", "MWCS Right"]

        closest = None
        min_distance = float('inf')

        for zone in safety_zones:
            if zone.get("structureName") in critical_names:
                distance = zone.get("distance", float('inf'))
                if distance < min_distance:
                    min_distance = distance
                    closest = zone

        return closest


# Global service instance
mentor_service = MentorAnalysisService()


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "NeuroSim AI Mentor",
        "version": "0.1.0",
        "status": "healthy",
        "claude_available": mentor_service.client is not None
    }


@app.post("/api/v1/mentor/analyze", response_model=MentorFeedback)
async def analyze_frame(request: AnalysisRequest):
    """
    Analyze a single frame and return mentor feedback.

    Use this endpoint for polling-based integration.
    For real-time streaming, use the WebSocket endpoint.
    """
    return await mentor_service.analyze(request)


@app.websocket("/ws/mentor/stream")
async def mentor_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time mentor streaming.

    Send frames as JSON, receive feedback immediately.
    """
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()
            request = AnalysisRequest(**data)
            feedback = await mentor_service.analyze(request)
            await websocket.send_json(feedback.model_dump())

    except WebSocketDisconnect:
        print("Mentor WebSocket disconnected")
    except Exception as e:
        print(f"Mentor WebSocket error: {e}")
        await websocket.close(code=1011)


# =============================================================================
# SESSION MANAGEMENT ENDPOINTS
# =============================================================================

@app.post("/api/v1/session/start", response_model=SessionStartResponse)
async def start_session(request: SessionStartRequest):
    """Start a new training session."""
    import uuid

    session_id = f"session_{uuid.uuid4().hex[:12]}"
    start_time = datetime.now()

    session = SessionRecord(
        session_id=session_id,
        trainee_id=request.trainee_id,
        procedure=request.procedure,
        start_time=start_time
    )

    sessions[session_id] = session

    # Track for trainee
    if request.trainee_id not in trainee_sessions:
        trainee_sessions[request.trainee_id] = []
    trainee_sessions[request.trainee_id].append(session_id)

    return SessionStartResponse(
        session_id=session_id,
        start_time=start_time.isoformat()
    )


@app.post("/api/v1/session/{session_id}/event")
async def record_event(session_id: str, request: SessionEventRequest):
    """Record an event during a session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[session_id]

    if request.event_type == "collision":
        session.collisions.append(CollisionEvent(
            timestamp=request.event_data.get("timestamp", int(time.time() * 1000)),
            position=Vector3D.from_dict(request.event_data.get("position", {"x": 0, "y": 0, "z": 0})),
            tissue_type=TissueType(request.event_data.get("tissueType", "mucosa")),
            intensity=request.event_data.get("intensity", 1.0)
        ))

    elif request.event_type == "crisis":
        # Crisis events include the triggering collision
        collision_data = request.event_data.get("collision", {})
        session.crises.append(CrisisEvent(
            timestamp=request.event_data.get("timestamp", int(time.time() * 1000)),
            crisis_type=CrisisType(request.event_data.get("crisisType", "csf_leak")),
            collision=CollisionEvent(
                timestamp=collision_data.get("timestamp", int(time.time() * 1000)),
                position=Vector3D.from_dict(collision_data.get("position", {"x": 0, "y": 0, "z": 0})),
                tissue_type=TissueType(collision_data.get("tissueType", "dura")),
                intensity=collision_data.get("intensity", 1.0)
            ),
            description=request.event_data.get("description", "")
        ))

    elif request.event_type == "level_advance":
        session.level_advances.append(LevelAdvanceEvent(
            timestamp=request.event_data.get("timestamp", int(time.time() * 1000)),
            from_level=request.event_data.get("fromLevel", 1),
            to_level=request.event_data.get("toLevel", 2),
            time_in_previous_level_seconds=request.event_data.get("timeInPreviousLevel", 0)
        ))

    return {"acknowledged": True, "event_type": request.event_type}


@app.post("/api/v1/session/{session_id}/end", response_model=SessionReport)
async def end_session(session_id: str):
    """End a session and generate report."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[session_id]
    session.end_time = datetime.now()

    # Calculate metrics
    analyzer = TrajectoryAnalyzer()
    analyzer.collisions = session.collisions
    analyzer.crises = session.crises
    analyzer.level_advances = session.level_advances

    metrics = analyzer.analyze()
    session.final_metrics = metrics

    # Generate recommendations
    recommender = RecommendationsGenerator()
    recommendations = recommender.generate(metrics)

    return SessionReport(
        session_id=session.session_id,
        trainee_id=session.trainee_id,
        procedure=session.procedure,
        start_time=session.start_time.isoformat(),
        end_time=session.end_time.isoformat(),
        duration_seconds=session.duration_seconds(),
        metrics=metrics.to_dict(),
        grade=metrics.grade,
        certification_eligible=metrics.certification_eligible,
        total_collisions=len(session.collisions),
        total_crises=len(session.crises),
        levels_completed=len(session.level_advances) + 1,
        recommendations=recommendations
    )


@app.get("/api/v1/session/{session_id}/report", response_model=SessionReport)
async def get_session_report(session_id: str):
    """Get the report for a completed session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[session_id]

    if not session.final_metrics:
        raise HTTPException(status_code=400, detail="Session not yet ended")

    recommender = RecommendationsGenerator()
    recommendations = recommender.generate(session.final_metrics)

    return SessionReport(
        session_id=session.session_id,
        trainee_id=session.trainee_id,
        procedure=session.procedure,
        start_time=session.start_time.isoformat(),
        end_time=session.end_time.isoformat() if session.end_time else None,
        duration_seconds=session.duration_seconds(),
        metrics=session.final_metrics.to_dict(),
        grade=session.final_metrics.grade,
        certification_eligible=session.final_metrics.certification_eligible,
        total_collisions=len(session.collisions),
        total_crises=len(session.crises),
        levels_completed=len(session.level_advances) + 1,
        recommendations=recommendations
    )


# =============================================================================
# TRAINEE PROGRESS ENDPOINTS
# =============================================================================

@app.get("/api/v1/trainee/{trainee_id}/progress")
async def get_trainee_progress(trainee_id: str):
    """Get progress data for a trainee across all sessions."""
    if trainee_id not in trainee_sessions:
        raise HTTPException(status_code=404, detail="Trainee not found")

    session_ids = trainee_sessions[trainee_id]
    completed_sessions = [
        sessions[sid] for sid in session_ids
        if sid in sessions and sessions[sid].final_metrics
    ]

    if not completed_sessions:
        return {
            "trainee_id": trainee_id,
            "total_sessions": len(session_ids),
            "completed_sessions": 0,
            "message": "No completed sessions yet"
        }

    scores = [s.final_metrics.overall_score for s in completed_sessions]
    grades = [s.final_metrics.grade for s in completed_sessions]

    # Calculate improvement rate (score change per session)
    improvement_rate = 0
    if len(scores) > 1:
        improvement_rate = (scores[-1] - scores[0]) / (len(scores) - 1)

    # Identify weak areas
    weak_areas = []
    strong_areas = []

    avg_safety = sum(s.final_metrics.safety_score for s in completed_sessions) / len(completed_sessions)
    avg_technique = sum(s.final_metrics.technique_score for s in completed_sessions) / len(completed_sessions)
    avg_accuracy = sum(s.final_metrics.accuracy_score for s in completed_sessions) / len(completed_sessions)
    avg_efficiency = sum(s.final_metrics.efficiency_score for s in completed_sessions) / len(completed_sessions)

    if avg_safety < 85:
        weak_areas.append("Safety awareness")
    elif avg_safety >= 90:
        strong_areas.append("Safety awareness")

    if avg_technique < 80:
        weak_areas.append("Surgical technique")
    elif avg_technique >= 85:
        strong_areas.append("Surgical technique")

    if avg_accuracy < 80:
        weak_areas.append("Trajectory accuracy")
    elif avg_accuracy >= 85:
        strong_areas.append("Trajectory accuracy")

    if avg_efficiency < 75:
        weak_areas.append("Movement efficiency")
    elif avg_efficiency >= 80:
        strong_areas.append("Movement efficiency")

    # Certification readiness
    recent_eligible = sum(
        1 for s in completed_sessions[-5:]
        if s.final_metrics.certification_eligible
    )
    certification_ready = recent_eligible >= 3

    return {
        "trainee_id": trainee_id,
        "total_sessions": len(session_ids),
        "completed_sessions": len(completed_sessions),
        "score_history": [round(s, 1) for s in scores],
        "grade_history": grades,
        "improvement_rate": round(improvement_rate, 2),
        "weak_areas": weak_areas,
        "strong_areas": strong_areas,
        "certification_ready": certification_ready,
        "sessions_until_certification": max(0, 3 - recent_eligible) if not certification_ready else 0
    }


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
