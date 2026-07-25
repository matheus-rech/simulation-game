"""
AI Mentor Prompt Templates

Comprehensive prompt engineering for Claude-powered surgical mentorship.
Includes system prompts, user prompts, and tone-adaptive templates.
"""

from enum import Enum
from typing import Dict, Any, List, Optional
from dataclasses import dataclass


class MentorTone(str, Enum):
    """Tone for mentor feedback based on safety status."""
    ENCOURAGING = "encouraging"
    CAUTIONARY = "cautionary"
    URGENT = "urgent"


class SurgicalLevel(int, Enum):
    """Surgical depth levels in transsphenoidal approach."""
    NASAL_APPROACH = 1
    SPHENOID_SINUS = 2
    SELLA_TUMOR = 3


# =============================================================================
# SYSTEM PROMPTS
# =============================================================================

MENTOR_SYSTEM_PROMPT = """You are an expert neurosurgeon with 25 years of experience mentoring residents in endoscopic transsphenoidal pituitary surgery.

## Your Role
You are providing real-time guidance during a surgical simulation. Your feedback should be:
- Brief (2-3 sentences maximum)
- Actionable (what to do, not just what's wrong)
- Anatomically accurate
- Appropriate to the trainee's current situation

## Anatomical Context: Transsphenoidal Pituitary Surgery

### Surgical Approach
This is an endonasal endoscopic approach through the nose to reach pituitary tumors:
1. **Nasal Phase**: Navigate through nasal cavity, identify middle turbinate and septum
2. **Sphenoid Phase**: Open sphenoid sinus via the natural ostium
3. **Sellar Phase**: Open sella turcica floor, incise dura, resect tumor

### Critical Structures (MUST AVOID)
- **Internal Carotid Artery (ICA)**: Lateral to sella, 2mm minimum safe distance
- **Medial Wall of Cavernous Sinus (MWCS)**: Contains cranial nerves, 1mm safe distance
- **Optic Nerve/Chiasm**: Superior to sella, risk of visual loss
- **Dura Mater**: Must open carefully to avoid CSF leak

### Anatomical Landmarks by Level
**Level 1 (Nasal)**:
- Middle turbinate (lateral)
- Nasal septum (midline)
- Sphenoid ostium (posterior)

**Level 2 (Sphenoid)**:
- Sphenoid septum
- Carotid prominences (lateral)
- Optic nerve prominences (superolateral)
- Sellar floor (posterior)

**Level 3 (Sella/Tumor)**:
- Sellar dura
- Pituitary gland (normal tissue)
- Tumor/adenoma
- Diaphragma sellae (superior)

## Response Format
Always respond in valid JSON with this structure:
```json
{
  "visible_structures": [
    {"name": "structure_name", "location": "left/center/right", "confidence": 0.0-1.0}
  ],
  "current_location": "Brief anatomical description",
  "is_safe": true/false,
  "coaching_message": "2-3 sentences of guidance",
  "recommended_action": "Specific next step" or null
}
```

## Tone Guidelines
{tone_instructions}

## Important Rules
1. Never recommend aggressive actions when near critical structures
2. Always acknowledge good technique when appropriate
3. If unsure about anatomy, say so - patient safety first
4. Use standard neurosurgical terminology
5. Consider the trainee's level of experience (assume PGY-3 to PGY-5)
"""

TONE_INSTRUCTIONS = {
    MentorTone.ENCOURAGING: """
**TONE: ENCOURAGING**
- Be supportive and positive
- Acknowledge good technique and progress
- Use affirming language: "Good approach", "Nice orientation", "Well done"
- Provide gentle guidance for improvement
- Build confidence while maintaining educational focus
""",
    MentorTone.CAUTIONARY: """
**TONE: CAUTIONARY**
- Be alert but calm
- Clearly warn about approaching critical structures
- Use cautionary language: "Be careful", "Watch the distance", "Slow down here"
- Provide specific safety reminders
- Don't alarm, but ensure awareness of risk
""",
    MentorTone.URGENT: """
**TONE: URGENT**
- Be direct and immediate
- Issue clear warnings without delay
- Use short, commanding phrases: "Stop", "Move away", "Critical proximity"
- Specify the exact risk
- Prioritize safety over encouragement
"""
}


# =============================================================================
# USER PROMPT TEMPLATES
# =============================================================================

@dataclass
class MentorContext:
    """Context data for building mentor prompts."""
    level: int
    scope_position: Dict[str, float]
    scope_angle: Dict[str, float]
    safety_zones: List[Dict[str, Any]]
    recent_collisions: List[Dict[str, Any]]
    current_objective: str
    session_duration_seconds: float

    def format_safety_status(self) -> str:
        """Format safety zones for prompt."""
        if not self.safety_zones:
            return "- All critical structures at safe distance"

        lines = []
        for zone in sorted(self.safety_zones, key=lambda z: z.get("distance", 999))[:3]:
            name = zone.get("structureName", "Unknown")
            distance = zone.get("distance", 0)
            risk = zone.get("riskLevel", "safe")
            lines.append(f"- {name}: {distance:.1f}mm ({risk})")

        return "\n".join(lines)

    def format_collision_history(self) -> str:
        """Format recent collisions for prompt."""
        if not self.recent_collisions:
            return "- None"

        lines = []
        for col in self.recent_collisions[-3:]:
            tissue = col.get("tissueType", "unknown")
            lines.append(f"- {tissue}")

        return "\n".join(lines)

    def to_prompt(self) -> str:
        """Generate the user prompt section."""
        return f"""Analyze this endoscopic view and provide surgical mentorship.

## Current Situation

**Surgical Level**: {self.level}
{LEVEL_DESCRIPTIONS.get(self.level, "Unknown level")}

**Scope Position**: ({self.scope_position.get('x', 0):.2f}, {self.scope_position.get('y', 0):.2f}, {self.scope_position.get('z', 0):.2f})
**Session Duration**: {self.session_duration_seconds:.0f} seconds

**Safety Status**:
{self.format_safety_status()}

**Recent Tissue Contacts** ({len(self.recent_collisions)} total):
{self.format_collision_history()}

**Current Objective**: {self.current_objective}

## Your Task
1. What anatomical structures are visible in this endoscopic view?
2. Is the current approach safe given the proximity to critical structures?
3. What should the trainee do next?

Respond ONLY with valid JSON matching the specified format."""


LEVEL_DESCRIPTIONS = {
    1: """**Level 1: Nasal Approach**
- Goal: Navigate to sphenoid ostium
- Key structures: Middle turbinate, septum, sphenoid ostium
- Risks: Mucosal bleeding, turbinate injury""",

    2: """**Level 2: Sphenoid Sinus**
- Goal: Open sphenoid sinus, expose sellar floor
- Key structures: Sphenoid septum, carotid prominences, optic prominences
- Risks: ICA injury (lateral), optic nerve injury (superolateral)""",

    3: """**Level 3: Sella & Tumor**
- Goal: Open sella, resect tumor while preserving normal pituitary
- Key structures: Sellar dura, pituitary, tumor, ICA (lateral)
- Risks: ICA injury (100% fatal if uncontrolled), CSF leak, residual tumor"""
}


# =============================================================================
# RESPONSE PARSING
# =============================================================================

@dataclass
class MentorResponse:
    """Parsed response from Claude mentor."""
    visible_structures: List[Dict[str, Any]]
    current_location: str
    is_safe: bool
    coaching_message: str
    recommended_action: Optional[str]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MentorResponse':
        return cls(
            visible_structures=data.get("visible_structures", []),
            current_location=data.get("current_location", "Unknown"),
            is_safe=data.get("is_safe", True),
            coaching_message=data.get("coaching_message", ""),
            recommended_action=data.get("recommended_action")
        )


# =============================================================================
# VOICE MESSAGE GENERATION
# =============================================================================

def generate_voice_message(
    response: MentorResponse,
    context: MentorContext,
    tone: MentorTone
) -> Optional[str]:
    """
    Generate a short voice message for TTS.

    Only generates messages for cautionary/urgent situations.
    Keeps messages brief (< 10 words) for quick delivery.
    """
    # No voice for encouraging tone (avoid distraction)
    if tone == MentorTone.ENCOURAGING:
        return None

    # Find closest critical structure
    closest_critical = None
    min_distance = float('inf')

    for zone in context.safety_zones:
        name = zone.get("structureName", "")
        if "ICA" in name or "MWCS" in name:
            distance = zone.get("distance", float('inf'))
            if distance < min_distance:
                min_distance = distance
                closest_critical = zone

    if not closest_critical:
        return None

    risk = closest_critical.get("riskLevel", "safe")
    name = closest_critical.get("structureName", "structure")
    distance = closest_critical.get("distance", 0)

    # Format structure name for speech
    spoken_name = name.replace("Left", "left").replace("Right", "right")

    if risk == "critical":
        return f"Stop. {spoken_name}, {distance:.1f} millimeters."
    elif risk == "danger":
        return f"Danger. {spoken_name} nearby."
    elif risk == "warning" and tone == MentorTone.URGENT:
        return f"Caution. Approaching {spoken_name}."

    return None


# =============================================================================
# EXAMPLE INTERACTIONS
# =============================================================================

EXAMPLE_INTERACTIONS = [
    {
        "context": {
            "level": 1,
            "safety_zones": [],
            "recent_collisions": []
        },
        "tone": MentorTone.ENCOURAGING,
        "expected_response": {
            "visible_structures": [
                {"name": "middle_turbinate", "location": "left", "confidence": 0.9},
                {"name": "nasal_septum", "location": "center", "confidence": 0.95}
            ],
            "current_location": "Anterior nasal cavity, left nostril approach",
            "is_safe": True,
            "coaching_message": "Good orientation. The middle turbinate is clearly visible on your left. Continue advancing toward the sphenoid ostium, keeping the septum as your midline reference.",
            "recommended_action": "Advance posteriorly toward the sphenoid ostium"
        }
    },
    {
        "context": {
            "level": 2,
            "safety_zones": [
                {"structureName": "ICA Left", "distance": 1.8, "riskLevel": "warning"}
            ],
            "recent_collisions": []
        },
        "tone": MentorTone.CAUTIONARY,
        "expected_response": {
            "visible_structures": [
                {"name": "sphenoid_sinus", "location": "center", "confidence": 0.85},
                {"name": "carotid_prominence", "location": "left", "confidence": 0.8}
            ],
            "current_location": "Sphenoid sinus, lateral wall visible",
            "is_safe": True,
            "coaching_message": "Be careful here. The left carotid prominence is visible, indicating the ICA is 1.8mm away. Stay medial and maintain your midline orientation.",
            "recommended_action": "Identify the sellar floor before proceeding"
        }
    },
    {
        "context": {
            "level": 3,
            "safety_zones": [
                {"structureName": "ICA Right", "distance": 0.7, "riskLevel": "critical"}
            ],
            "recent_collisions": [
                {"tissueType": "BONE"}
            ]
        },
        "tone": MentorTone.URGENT,
        "expected_response": {
            "visible_structures": [
                {"name": "sellar_dura", "location": "center", "confidence": 0.9},
                {"name": "ica_right", "location": "right", "confidence": 0.75}
            ],
            "current_location": "Sellar region, dangerously close to right ICA",
            "is_safe": False,
            "coaching_message": "Stop. You are 0.7mm from the right internal carotid artery. Move medially immediately. Do not advance until you have re-established safe margins.",
            "recommended_action": "Move scope medially to increase ICA distance"
        }
    }
]


# =============================================================================
# PROMPT BUILDER
# =============================================================================

class MentorPromptBuilder:
    """
    Builds complete prompts for Claude mentor API calls.
    """

    def __init__(self):
        self.objectives = {
            1: "Navigate through nasal cavity to locate sphenoid ostium",
            2: "Open sphenoid sinus and identify sellar floor safely",
            3: "Open sella floor, incise dura, and approach tumor while avoiding ICA"
        }

    def build_system_prompt(self, tone: MentorTone) -> str:
        """Build the system prompt with tone instructions."""
        return MENTOR_SYSTEM_PROMPT.format(
            tone_instructions=TONE_INSTRUCTIONS[tone]
        )

    def build_user_prompt(self, context: MentorContext) -> str:
        """Build the user prompt from context."""
        return context.to_prompt()

    def determine_tone(self, context: MentorContext) -> MentorTone:
        """Determine appropriate tone based on context."""
        # Check for critical proximity
        for zone in context.safety_zones:
            risk = zone.get("riskLevel", "safe")
            if risk == "critical":
                return MentorTone.URGENT
            elif risk == "danger":
                return MentorTone.CAUTIONARY

        # Check for recent critical collisions
        critical_tissues = {"ICA", "MWCS", "DURA"}
        for col in context.recent_collisions[-5:]:  # Last 5 collisions
            if col.get("tissueType") in critical_tissues:
                return MentorTone.CAUTIONARY

        # Check collision frequency
        if len(context.recent_collisions) >= 5:
            return MentorTone.CAUTIONARY

        return MentorTone.ENCOURAGING

    def get_objective(self, level: int) -> str:
        """Get the current objective for a level."""
        return self.objectives.get(level, "Proceed with caution")

    def build_context(
        self,
        level: int,
        scope_position: Dict[str, float],
        scope_angle: Dict[str, float],
        safety_zones: List[Dict[str, Any]],
        recent_collisions: List[Dict[str, Any]],
        session_duration: float
    ) -> MentorContext:
        """Build a MentorContext from raw data."""
        return MentorContext(
            level=level,
            scope_position=scope_position,
            scope_angle=scope_angle,
            safety_zones=safety_zones,
            recent_collisions=recent_collisions,
            current_objective=self.get_objective(level),
            session_duration_seconds=session_duration
        )
