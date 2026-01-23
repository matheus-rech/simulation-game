# AI Surgical Mentor Architecture - Phase 3B

## Executive Summary

This document outlines the architecture for integrating an AI-powered surgical mentor system into NeuroSim, leveraging Claude Vision API and insights from the NeuroVision project. The system provides real-time coaching, technique analysis, and contextual feedback during surgical simulations.

---

## 1. Architecture Decision: Hybrid Backend + Frontend

### Recommendation: **Option A - Python Backend (FastAPI) + Claude Vision**

#### Rationale

| Factor | Backend (FastAPI) | Frontend Only |
|--------|------------------|---------------|
| **API Key Security** | Keys stay server-side | Exposed in client |
| **Rate Limiting Control** | Server-managed throttling | Client-side only |
| **Analysis Caching** | Persistent cache across sessions | Lost on refresh |
| **Session Telemetry** | Full storage & analysis | Limited local storage |
| **Cost Management** | Server-side billing control | Per-user billing risk |
| **Offline Analysis** | Can queue for later processing | Lost if disconnected |
| **Integration with NeuroVision** | Direct Python module access | Would need separate service |

### Architecture Diagram

```
+------------------------------------------------------------------+
|                         NEUROSIM FRONTEND                         |
|                    (React + Three.js + R3F)                       |
+------------------------------------------------------------------+
|                                                                    |
|  +-------------------+    +-------------------+    +-------------+ |
|  | EndoscopeView.tsx |    | SafetyHUD.tsx     |    | MentorUI    | |
|  | (3D Rendering)    |    | (Safety Warnings) |    | (Feedback)  | |
|  +--------+----------+    +--------+----------+    +------+------+ |
|           |                        |                      |        |
|           v                        v                      v        |
|  +-------------------+    +-------------------+    +-------------+ |
|  | Canvas.toDataURL()|    | SafetyZone[]      |    | WebSocket   | |
|  | (Frame Capture)   |    | (Distance Data)   |    | Client      | |
|  +--------+----------+    +--------+----------+    +------+------+ |
|           |                        |                      |        |
+-----------+------------------------+----------------------+--------+
            |                        |                      |
            v                        v                      v
+------------------------------------------------------------------+
|                    HTTP/WebSocket Layer                           |
+------------------------------------------------------------------+
            |                        |                      |
            v                        v                      v
+------------------------------------------------------------------+
|                     AI MENTOR BACKEND                             |
|                    (FastAPI + Python)                             |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------------+    +---------------------------+      |
|  | /api/v1/mentor/analyze |    | /ws/mentor/stream         |      |
|  | (POST - Frame Analysis)|    | (WebSocket - Real-time)   |      |
|  +------------------------+    +---------------------------+      |
|                                                                    |
|  +----------------------------------------------------------+    |
|  |                     AnalysisOrchestrator                  |    |
|  +----------------------------------------------------------+    |
|  |                                                            |    |
|  |  +-------------------+  +------------------+  +---------+  |    |
|  |  | ClaudeVisionAPI   |  | TelemetryStore   |  | Cache   |  |    |
|  |  | (Frame Analysis)  |  | (Session Data)   |  | (LRU)   |  |    |
|  |  +-------------------+  +------------------+  +---------+  |    |
|  |                                                            |    |
|  |  +-------------------+  +------------------+  +---------+  |    |
|  |  | NeuroVision       |  | TrajectoryAnalysis| | Scoring |  |    |
|  |  | (Segmentation)    |  | (Path Efficiency)  | | Engine  |  |    |
|  |  +-------------------+  +------------------+  +---------+  |    |
|  |                                                            |    |
|  +----------------------------------------------------------+    |
|                                                                    |
+------------------------------------------------------------------+
```

---

## 2. Data Pipeline Design

### 2.1 Frame Capture from Three.js

```typescript
// src/services/mentor/FrameCapture.ts

interface CapturedFrame {
  imageData: string;      // Base64 JPEG
  timestamp: number;
  frameId: number;
  metadata: FrameMetadata;
}

interface FrameMetadata {
  level: number;
  scopePosition: Vector3D;
  scopeAngle: ScopeAngle;
  safetyZones: SafetyZone[];
  recentCollisions: CollisionEvent[];
  currentObjective: string;
  sessionDuration: number;
}

export class FrameCaptureService {
  private canvasRef: HTMLCanvasElement | null = null;
  private frameCount = 0;
  private captureInterval: number | null = null;

  // Capture rate: every 500ms (2 FPS for analysis, matching NeuroVision)
  private readonly CAPTURE_INTERVAL_MS = 500;
  private readonly JPEG_QUALITY = 0.85;

  /**
   * Capture current frame from Three.js canvas
   */
  captureFrame(metadata: FrameMetadata): CapturedFrame {
    if (!this.canvasRef) {
      throw new Error('Canvas reference not set');
    }

    this.frameCount++;

    // Use toDataURL for JPEG (smaller payload than PNG)
    const imageData = this.canvasRef.toDataURL('image/jpeg', this.JPEG_QUALITY);

    return {
      imageData: imageData.split(',')[1], // Remove "data:image/jpeg;base64," prefix
      timestamp: Date.now(),
      frameId: this.frameCount,
      metadata
    };
  }

  /**
   * Start automatic frame capture at specified interval
   */
  startCapture(
    canvasRef: HTMLCanvasElement,
    getMetadata: () => FrameMetadata,
    onCapture: (frame: CapturedFrame) => void
  ): void {
    this.canvasRef = canvasRef;

    this.captureInterval = window.setInterval(() => {
      const frame = this.captureFrame(getMetadata());
      onCapture(frame);
    }, this.CAPTURE_INTERVAL_MS);
  }

  stopCapture(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
  }
}
```

### 2.2 React Integration Hook

```typescript
// src/hooks/useMentorCapture.ts

import { useRef, useCallback, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { FrameCaptureService, CapturedFrame, FrameMetadata } from '../services/mentor/FrameCapture';
import { MentorWebSocketService } from '../services/mentor/WebSocketService';

interface UseMentorCaptureOptions {
  enabled: boolean;
  captureRate?: number;  // ms between captures
  onFeedback?: (feedback: MentorFeedback) => void;
}

export function useMentorCapture({
  enabled,
  captureRate = 500,
  onFeedback
}: UseMentorCaptureOptions) {
  const { gl } = useThree();
  const captureService = useRef(new FrameCaptureService());
  const wsService = useRef<MentorWebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<MentorFeedback | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (enabled) {
      wsService.current = new MentorWebSocketService({
        url: 'ws://localhost:8000/ws/mentor/stream',
        onMessage: (feedback) => {
          setLatestFeedback(feedback);
          onFeedback?.(feedback);
        },
        onConnect: () => setIsConnected(true),
        onDisconnect: () => setIsConnected(false)
      });

      wsService.current.connect();
    }

    return () => {
      wsService.current?.disconnect();
    };
  }, [enabled, onFeedback]);

  // Send frame for analysis
  const sendFrame = useCallback((metadata: FrameMetadata) => {
    if (!wsService.current || !isConnected) return;

    const frame = captureService.current.captureFrame(metadata);
    wsService.current.sendFrame(frame);
  }, [isConnected]);

  return {
    isConnected,
    latestFeedback,
    sendFrame,
    captureService: captureService.current
  };
}
```

### 2.3 Backend API Endpoints

```python
# backend/app/api/mentor.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import base64
import asyncio

router = APIRouter(prefix="/api/v1/mentor", tags=["mentor"])


class FrameMetadata(BaseModel):
    level: int
    scope_position: Dict[str, float]  # x, y, z
    scope_angle: Dict[str, float]     # pitch, yaw
    safety_zones: List[Dict[str, Any]]
    recent_collisions: List[Dict[str, Any]]
    current_objective: str
    session_duration: float


class AnalysisRequest(BaseModel):
    image_data: str  # Base64 JPEG
    timestamp: int
    frame_id: int
    metadata: FrameMetadata


class MentorFeedback(BaseModel):
    frame_id: int
    timestamp: datetime
    processing_time_ms: float

    # Anatomical context
    visible_structures: List[Dict[str, Any]]
    current_location: str

    # Safety assessment
    safety_level: str  # "safe", "caution", "warning", "danger"
    safety_score: float  # 0-100
    closest_critical: Optional[Dict[str, Any]]

    # Coaching feedback
    coaching_message: str
    tone: str  # "encouraging", "cautionary", "urgent"
    recommended_action: Optional[str]

    # Voice output (for TTS)
    voice_message: Optional[str]


@router.post("/analyze", response_model=MentorFeedback)
async def analyze_frame(request: AnalysisRequest) -> MentorFeedback:
    """
    Analyze a single frame and return mentor feedback.
    Use for polling-based integration.
    """
    from app.services.analysis_orchestrator import AnalysisOrchestrator

    orchestrator = AnalysisOrchestrator()
    return await orchestrator.analyze(request)


@router.websocket("/ws/mentor/stream")
async def mentor_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time mentor streaming.
    Receives frames, returns feedback with low latency.
    """
    await websocket.accept()

    from app.services.analysis_orchestrator import AnalysisOrchestrator
    orchestrator = AnalysisOrchestrator()

    try:
        while True:
            # Receive frame data
            data = await websocket.receive_json()
            request = AnalysisRequest(**data)

            # Analyze and respond
            feedback = await orchestrator.analyze(request)
            await websocket.send_json(feedback.dict())

    except WebSocketDisconnect:
        print(f"Mentor WebSocket disconnected")
    except Exception as e:
        print(f"Mentor WebSocket error: {e}")
        await websocket.close(code=1011)
```

---

## 3. Analysis Orchestrator

```python
# backend/app/services/analysis_orchestrator.py

import anthropic
import asyncio
import json
import time
import base64
from typing import Optional, Dict, Any, List
from datetime import datetime
from dataclasses import dataclass
from functools import lru_cache
import numpy as np

# Import NeuroVision if available
try:
    from neurovision.vision import NeuroimagingSegmenter
    NEUROVISION_AVAILABLE = True
except ImportError:
    NEUROVISION_AVAILABLE = False


@dataclass
class AnalysisContext:
    """Context built from frame metadata for Claude prompt."""
    level: int
    scope_position: Dict[str, float]
    safety_zones: List[Dict[str, Any]]
    closest_structure: Optional[Dict[str, Any]]
    recent_collisions: List[Dict[str, Any]]
    current_objective: str
    session_duration: float

    def to_prompt_context(self) -> str:
        """Format context for Claude prompt."""
        safety_desc = []
        for zone in self.safety_zones[:3]:  # Top 3 closest
            safety_desc.append(
                f"- {zone['structureName']}: {zone['distance']:.1f}mm ({zone['riskLevel']})"
            )

        collision_desc = []
        for col in self.recent_collisions[-3:]:  # Last 3
            collision_desc.append(
                f"- {col.get('tissueType', 'unknown')} at {col.get('timestamp', 'N/A')}"
            )

        return f"""
Current Situation:
- Surgical Level: {self.level} (1=Nasal, 2=Sphenoid, 3=Sella/Tumor)
- Scope Position: ({self.scope_position['x']:.2f}, {self.scope_position['y']:.2f}, {self.scope_position['z']:.2f})
- Session Duration: {self.session_duration:.0f}s

Safety Status:
{chr(10).join(safety_desc) if safety_desc else '- All structures safe distance'}

Recent Collisions ({len(self.recent_collisions)} total):
{chr(10).join(collision_desc) if collision_desc else '- None'}

Current Objective: {self.current_objective}
"""


class AnalysisOrchestrator:
    """
    Orchestrates all analysis components:
    - Claude Vision API for scene understanding
    - NeuroVision segmentation (if available)
    - Telemetry tracking
    - Response generation
    """

    # Surgical objectives by level
    OBJECTIVES = {
        1: "Navigate through nasal cavity, identify middle turbinate and septum",
        2: "Locate sphenoid ostium, open sphenoid sinus safely",
        3: "Open sella floor, identify dura, safely approach tumor while avoiding ICA"
    }

    # Safety thresholds (matching SafetyCorridorManager)
    ICA_MARGINS = {"safe": 3.0, "warning": 2.0, "danger": 1.0, "critical": 0.5}
    MWCS_MARGINS = {"safe": 2.0, "warning": 1.0, "danger": 0.5, "critical": 0.2}

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        self.client = anthropic.Anthropic(api_key=self.api_key) if self.api_key else None

        # Analysis rate limiting
        self.last_analysis_time = 0
        self.min_analysis_interval = 0.5  # 500ms minimum between Claude calls

        # Caching
        self._last_response: Optional[Dict] = None
        self._analysis_count = 0

        # NeuroVision integration
        self.segmenter = NeuroimagingSegmenter("OR_CAMERA") if NEUROVISION_AVAILABLE else None

    async def analyze(self, request: 'AnalysisRequest') -> 'MentorFeedback':
        """
        Main analysis pipeline.
        """
        start_time = time.time()

        # Build context from metadata
        context = AnalysisContext(
            level=request.metadata.level,
            scope_position=request.metadata.scope_position,
            safety_zones=request.metadata.safety_zones,
            closest_structure=self._get_closest_critical(request.metadata.safety_zones),
            recent_collisions=request.metadata.recent_collisions,
            current_objective=self.OBJECTIVES.get(
                request.metadata.level,
                "Proceed carefully"
            ),
            session_duration=request.metadata.session_duration
        )

        # Determine tone based on safety
        tone = self._determine_tone(context)

        # Run analysis (with rate limiting)
        current_time = time.time()
        should_run_claude = (
            self.client and
            (current_time - self.last_analysis_time) >= self.min_analysis_interval
        )

        if should_run_claude:
            try:
                claude_response = await self._analyze_with_claude(
                    request.image_data,
                    context,
                    tone
                )
                self._last_response = claude_response
                self.last_analysis_time = current_time
                self._analysis_count += 1
            except Exception as e:
                print(f"Claude analysis error: {e}")
                claude_response = self._last_response or self._generate_fallback(context)
        else:
            # Use cached response with updated context
            claude_response = self._last_response or self._generate_fallback(context)

        processing_time = (time.time() - start_time) * 1000

        return MentorFeedback(
            frame_id=request.frame_id,
            timestamp=datetime.now(),
            processing_time_ms=processing_time,
            visible_structures=claude_response.get("visible_structures", []),
            current_location=claude_response.get("current_location", "Unknown"),
            safety_level=self._assess_safety_level(context),
            safety_score=self._calculate_safety_score(context),
            closest_critical=context.closest_structure,
            coaching_message=claude_response.get("coaching_message", ""),
            tone=tone,
            recommended_action=claude_response.get("recommended_action"),
            voice_message=self._generate_voice_message(claude_response, context, tone)
        )

    async def _analyze_with_claude(
        self,
        image_data: str,
        context: AnalysisContext,
        tone: str
    ) -> Dict[str, Any]:
        """
        Send frame to Claude Vision API for analysis.
        """
        system_prompt = self._build_system_prompt(tone)
        user_prompt = self._build_user_prompt(context)

        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",  # Vision-capable
            max_tokens=1024,
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

        # Parse JSON response
        response_text = message.content[0].text
        try:
            # Handle markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            return json.loads(response_text.strip())
        except json.JSONDecodeError:
            return {
                "coaching_message": response_text[:200],
                "visible_structures": [],
                "current_location": "Unknown"
            }

    def _build_system_prompt(self, tone: str) -> str:
        """Build system prompt for Claude."""
        tone_instructions = {
            "encouraging": "Be supportive and positive. Acknowledge good technique. Use phrases like 'Good approach', 'Nice orientation'.",
            "cautionary": "Be alert but calm. Warn about approaching critical structures. Use phrases like 'Be careful', 'Watch the distance'.",
            "urgent": "Be direct and clear. Issue immediate warnings. Use short phrases like 'Stop', 'Move away', 'Critical proximity'."
        }

        return f"""You are an expert neurosurgeon mentoring a resident during endoscopic transsphenoidal pituitary surgery simulation.

Your role:
1. Identify visible anatomical structures in the endoscopic view
2. Assess the surgical approach and safety
3. Provide brief, actionable coaching feedback

Tone: {tone_instructions.get(tone, tone_instructions['encouraging'])}

IMPORTANT ANATOMICAL CONTEXT:
- This is an endonasal transsphenoidal approach
- Critical structures: Internal Carotid Artery (ICA), Medial Wall of Cavernous Sinus (MWCS)
- Safe corridors: 2mm from ICA, 1mm from MWCS
- Surgical progression: Nasal cavity -> Sphenoid sinus -> Sella turcica -> Pituitary/Tumor

Respond in JSON format:
{{
  "visible_structures": [
    {{"name": "structure_name", "location": "left/center/right", "confidence": 0.0-1.0}}
  ],
  "current_location": "brief anatomical description",
  "is_safe": true/false,
  "coaching_message": "2-3 sentences max",
  "recommended_action": "next step or null"
}}"""

    def _build_user_prompt(self, context: AnalysisContext) -> str:
        """Build user prompt with context."""
        return f"""Analyze this endoscopic view and provide surgical mentorship.

{context.to_prompt_context()}

What anatomical structures are visible? Is the current approach safe? What should the trainee do next?"""

    def _get_closest_critical(self, safety_zones: List[Dict]) -> Optional[Dict]:
        """Find the closest critical structure."""
        critical_structures = ["ICA Left", "ICA Right", "MWCS Left", "MWCS Right"]

        closest = None
        min_distance = float('inf')

        for zone in safety_zones:
            if zone.get("structureName") in critical_structures:
                distance = zone.get("distance", float('inf'))
                if distance < min_distance:
                    min_distance = distance
                    closest = zone

        return closest

    def _determine_tone(self, context: AnalysisContext) -> str:
        """Determine coaching tone based on safety status."""
        if context.closest_structure:
            risk = context.closest_structure.get("riskLevel", "safe")
            if risk == "critical":
                return "urgent"
            elif risk in ("danger", "warning"):
                return "cautionary"

        # Check recent collisions
        if context.recent_collisions:
            recent_count = len([c for c in context.recent_collisions
                               if c.get("timestamp", 0) > time.time() - 10])
            if recent_count >= 3:
                return "cautionary"

        return "encouraging"

    def _assess_safety_level(self, context: AnalysisContext) -> str:
        """Assess overall safety level."""
        if not context.closest_structure:
            return "safe"

        return context.closest_structure.get("riskLevel", "safe")

    def _calculate_safety_score(self, context: AnalysisContext) -> float:
        """Calculate safety score (0-100)."""
        score = 100.0

        # Deduct for proximity to critical structures
        for zone in context.safety_zones:
            risk = zone.get("riskLevel", "safe")
            if risk == "critical":
                score -= 40
            elif risk == "danger":
                score -= 20
            elif risk == "warning":
                score -= 10

        # Deduct for recent collisions
        score -= len(context.recent_collisions) * 5

        return max(0, min(100, score))

    def _generate_voice_message(
        self,
        response: Dict,
        context: AnalysisContext,
        tone: str
    ) -> Optional[str]:
        """Generate short voice message for TTS."""
        # Only voice for cautionary/urgent tones
        if tone == "encouraging":
            return None

        if context.closest_structure:
            name = context.closest_structure.get("structureName", "structure")
            distance = context.closest_structure.get("distance", 0)
            risk = context.closest_structure.get("riskLevel", "safe")

            if risk == "critical":
                return f"Stop. {name} at {distance:.1f} millimeters."
            elif risk == "danger":
                return f"Caution. {name} nearby."

        return None

    def _generate_fallback(self, context: AnalysisContext) -> Dict:
        """Generate fallback response when Claude unavailable."""
        level_descriptions = {
            1: "Nasal cavity approach",
            2: "Sphenoid sinus exposure",
            3: "Sellar region access"
        }

        return {
            "visible_structures": [],
            "current_location": level_descriptions.get(context.level, "Unknown"),
            "is_safe": context.closest_structure is None or
                      context.closest_structure.get("riskLevel") == "safe",
            "coaching_message": f"Continue with {self.OBJECTIVES.get(context.level, 'current approach')}.",
            "recommended_action": None
        }
```

---

## 4. Response Format Specification

### 4.1 MentorFeedback Schema

```typescript
// src/types/mentor.ts

export interface MentorFeedback {
  frameId: number;
  timestamp: string;  // ISO format
  processingTimeMs: number;

  // Anatomical context
  visibleStructures: VisibleStructure[];
  currentLocation: string;

  // Safety assessment
  safetyLevel: 'safe' | 'caution' | 'warning' | 'danger';
  safetyScore: number;  // 0-100
  closestCritical: SafetyZone | null;

  // Coaching feedback
  coachingMessage: string;
  tone: 'encouraging' | 'cautionary' | 'urgent';
  recommendedAction: string | null;

  // Voice output
  voiceMessage: string | null;
}

export interface VisibleStructure {
  name: string;
  location: 'left' | 'center' | 'right';
  confidence: number;  // 0-1
}
```

### 4.2 Tone Adaptation Logic

| Condition | Tone | UI Treatment | Voice |
|-----------|------|--------------|-------|
| All structures > 3mm | Encouraging | Green indicators | None |
| Any structure 1-3mm | Cautionary | Yellow/orange indicators | Soft warning |
| Any structure < 1mm | Urgent | Red pulsing indicators | Immediate alert |
| ICA collision | Urgent | Red screen flash | "Stop immediately" |
| Multiple collisions in 10s | Cautionary | Warning badge | "Slow down" |

---

## 5. Frontend Integration

### 5.1 MentorUI Component

```typescript
// src/components/ui/MentorUI.tsx

import React, { useState, useEffect } from 'react';
import { MentorFeedback } from '../../types/mentor';

interface MentorUIProps {
  feedback: MentorFeedback | null;
  visible: boolean;
  position?: 'top-right' | 'bottom-right';
}

const toneStyles = {
  encouraging: {
    background: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid rgba(34, 197, 94, 0.4)',
    icon: 'check-circle'
  },
  cautionary: {
    background: 'rgba(234, 179, 8, 0.15)',
    border: '1px solid rgba(234, 179, 8, 0.4)',
    icon: 'alert-triangle'
  },
  urgent: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '2px solid rgba(239, 68, 68, 0.6)',
    icon: 'alert-octagon',
    animation: 'pulse 1s ease-in-out infinite'
  }
};

export function MentorUI({ feedback, visible, position = 'top-right' }: MentorUIProps) {
  if (!visible || !feedback) return null;

  const style = toneStyles[feedback.tone];

  return (
    <div
      style={{
        position: 'absolute',
        [position.includes('top') ? 'top' : 'bottom']: 16,
        [position.includes('right') ? 'right' : 'left']: 16,
        padding: 16,
        borderRadius: 12,
        maxWidth: 320,
        ...style,
        zIndex: 100,
        fontFamily: "'Segoe UI', Roboto, sans-serif"
      }}
      role="status"
      aria-live={feedback.tone === 'urgent' ? 'assertive' : 'polite'}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: '1.2rem' }}>
          {feedback.tone === 'encouraging' && '&#x2713;'}
          {feedback.tone === 'cautionary' && '&#x26A0;'}
          {feedback.tone === 'urgent' && '&#x1F6D1;'}
        </span>
        <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>
          AI Mentor
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.7 }}>
          {feedback.processingTimeMs.toFixed(0)}ms
        </span>
      </div>

      {/* Location */}
      <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: 8 }}>
        Location: {feedback.currentLocation}
      </div>

      {/* Coaching Message */}
      <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.4 }}>
        {feedback.coachingMessage}
      </p>

      {/* Recommended Action */}
      {feedback.recommendedAction && (
        <div style={{
          marginTop: 12,
          padding: 8,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 6,
          fontSize: '0.85rem'
        }}>
          <strong>Next:</strong> {feedback.recommendedAction}
        </div>
      )}

      {/* Safety Score */}
      <div style={{
        marginTop: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <div style={{
          flex: 1,
          height: 4,
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${feedback.safetyScore}%`,
            height: '100%',
            background: feedback.safetyScore > 80 ? '#22c55e' :
                       feedback.safetyScore > 50 ? '#eab308' : '#ef4444',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <span style={{ fontSize: '0.75rem', minWidth: 35 }}>
          {feedback.safetyScore.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
```

### 5.2 Integration in App.tsx

```typescript
// Updates to App.tsx

import { MentorUI } from './components/ui/MentorUI';
import { useMentorCapture } from './hooks/useMentorCapture';

export default function App() {
  // ... existing state ...
  const [mentorEnabled, setMentorEnabled] = useState(false);
  const [mentorFeedback, setMentorFeedback] = useState<MentorFeedback | null>(null);

  // Mentor capture hook
  const { isConnected, latestFeedback, sendFrame } = useMentorCapture({
    enabled: mentorEnabled,
    onFeedback: setMentorFeedback
  });

  // Effect to send frames when mentor is enabled
  useEffect(() => {
    if (!mentorEnabled || !isConnected) return;

    const metadata = {
      level,
      scopePosition: tipPosition,
      scopeAngle,
      safetyZones,
      recentCollisions: [],  // Would need collision history
      currentObjective: getObjective(level),
      sessionDuration: Date.now() / 1000  // Would track actual session time
    };

    const interval = setInterval(() => {
      sendFrame(metadata);
    }, 500);

    return () => clearInterval(interval);
  }, [mentorEnabled, isConnected, level, tipPosition, scopeAngle, safetyZones, sendFrame]);

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#0f0a0a" }}>
      {/* ... existing UI ... */}

      {/* Mentor Toggle Button */}
      <button
        onClick={() => setMentorEnabled(!mentorEnabled)}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          padding: '8px 16px',
          background: mentorEnabled ? '#22c55e' : '#374151',
          border: 'none',
          borderRadius: 6,
          color: 'white',
          cursor: 'pointer',
          zIndex: 100
        }}
      >
        {mentorEnabled ? 'AI Mentor: ON' : 'AI Mentor: OFF'}
        {isConnected && mentorEnabled && ' (Connected)'}
      </button>

      {/* Mentor Feedback UI */}
      <MentorUI
        feedback={mentorFeedback}
        visible={mentorEnabled}
        position="top-right"
      />

      {/* ... rest of UI ... */}
    </div>
  );
}
```

---

## 6. NeuroVision Integration Opportunities

### 6.1 Feature Comparison Matrix

| Feature | NeuroSim (Current) | NeuroVision | Integration Approach |
|---------|-------------------|-------------|---------------------|
| **Safety Corridor** | SafetyCorridorManager.tsx (2mm ICA, 1mm MWCS) | SafetyCorridor class (same thresholds) | Direct port - use same thresholds |
| **Collision Response** | CollisionManager.tsx (debounced, tissue-specific) | ORSafetyMonitor (contamination focus) | Merge into unified event system |
| **Technique Scoring** | Basic score (-2 per collision) | SurgicalTrainingSystem (accuracy, efficiency, safety, technique, time) | Port full scoring system |
| **Procedure Library** | Implicit (3 levels) | Explicit (craniotomy, transsphenoidal, DBS) | Adapt transsphenoidal steps |
| **Real-time Feedback** | Crisis alerts only | Voice-ready messages, streaming | Full adoption |
| **Segmentation** | N/A (procedural geometry) | NeuroimagingSegmenter (physics-based) | Optional: validate frame vs simulation |
| **Phase Detection** | Level-based (1-3) | SurgicalPhase enum (10 phases) | Map levels to phases |

### 6.2 Directly Portable Modules

1. **PerformanceMetrics dataclass** - Can be ported to TypeScript for frontend scoring
2. **SurgicalTrainingSystem.PROCEDURE_LIBRARY** - Adapt transsphenoidal_pituitary steps
3. **Alert severity system** - Already matches (CRITICAL, WARNING, CAUTION, INFO)
4. **Voice message generation** - Port to backend for TTS integration

### 6.3 Shared Model Opportunities

NeuroVision's `ClaudeVisionAnalyzer` prompts can inform NeuroSim's mentor prompts:
- OR_SAFETY mode for sterile field concepts
- NAVIGATION mode for structure identification
- TRAINING mode for technique assessment

### 6.4 Synthetic Training Data from NeuroSim

NeuroSim can generate training data for NeuroVision:
- Labeled endoscopic views with known anatomy positions
- Trajectory paths with safety classifications
- Collision events with tissue types
- Session recordings for learning curve analysis

---

## 7. Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Set up FastAPI backend with Claude Vision integration
- [ ] Implement WebSocket endpoint for real-time streaming
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

## 8. Cost Estimation

### Claude API Usage

| Operation | Tokens (Est.) | Cost/1K | Frequency | Monthly Cost |
|-----------|--------------|---------|-----------|--------------|
| Frame Analysis | ~800 input, ~400 output | $0.003/$0.015 | 2/sec * 30min * 20 sessions | ~$50-100 |
| Session Summary | ~2000 input, ~1000 output | $0.006/$0.03 | 1/session * 20 sessions | ~$1 |

**Estimated Monthly Cost: $50-150** (depending on usage patterns)

### Optimization Strategies
1. **Caching** - Cache responses for similar contexts
2. **Throttling** - Max 2 requests/second
3. **Context Compression** - Only send changed metadata
4. **Batch Analysis** - Queue frames for batch processing when real-time not needed

---

## Appendix A: Environment Variables

```bash
# .env (backend)
ANTHROPIC_API_KEY=sk-ant-...
MENTOR_ANALYSIS_INTERVAL=0.5
MENTOR_MAX_TOKENS=1024
MENTOR_MODEL=claude-sonnet-4-20250514

# Enable NeuroVision integration
NEUROVISION_ENABLED=true
NEUROVISION_MODALITY=OR_CAMERA
```

## Appendix B: Testing Strategy

```python
# tests/test_mentor_analysis.py

import pytest
from app.services.analysis_orchestrator import AnalysisOrchestrator, AnalysisContext

@pytest.fixture
def orchestrator():
    return AnalysisOrchestrator()

def test_tone_determination_safe():
    context = AnalysisContext(
        level=1,
        scope_position={"x": 0, "y": 0, "z": 1.2},
        safety_zones=[{"structureName": "ICA Left", "distance": 5.0, "riskLevel": "safe"}],
        closest_structure=None,
        recent_collisions=[],
        current_objective="Navigate nasal cavity",
        session_duration=60
    )

    orchestrator = AnalysisOrchestrator()
    tone = orchestrator._determine_tone(context)
    assert tone == "encouraging"

def test_tone_determination_critical():
    context = AnalysisContext(
        level=3,
        scope_position={"x": 0.8, "y": 0.3, "z": -7.3},
        safety_zones=[{"structureName": "ICA Left", "distance": 0.4, "riskLevel": "critical"}],
        closest_structure={"structureName": "ICA Left", "distance": 0.4, "riskLevel": "critical"},
        recent_collisions=[],
        current_objective="Tumor resection",
        session_duration=180
    )

    orchestrator = AnalysisOrchestrator()
    tone = orchestrator._determine_tone(context)
    assert tone == "urgent"
```
