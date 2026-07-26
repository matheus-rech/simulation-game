"""
Prompt templates for Claude AI Mentor.
"""

from .mentor_prompts import (
    MentorPromptBuilder,
    MentorContext,
    MentorTone,
    MentorResponse,
    generate_voice_message,
    EXAMPLE_INTERACTIONS,
)

__all__ = [
    "MentorPromptBuilder",
    "MentorContext",
    "MentorTone",
    "MentorResponse",
    "generate_voice_message",
    "EXAMPLE_INTERACTIONS",
]
