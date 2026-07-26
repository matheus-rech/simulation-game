"""
Telemetry Data Models

Defines the data structures for session recording, trajectory analysis,
and performance metrics calculation.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Dict, Any, Optional, Tuple
import math


class TissueType(str, Enum):
    """Tissue types matching NeuroSim frontend."""
    MUCOSA = "mucosa"
    BONE = "bone"
    DURA = "dura"
    MWCS = "mwcs"
    ICA = "ica"
    TUMOR = "tumor"
    PITUITARY = "pituitary"


class CrisisType(str, Enum):
    """Crisis types matching NeuroSim frontend."""
    ICA_INJURY = "ica_injury"
    CSF_LEAK = "csf_leak"
    OPTIC_NERVE_INJURY = "optic_nerve_injury"


class RiskLevel(str, Enum):
    """Risk levels for safety assessment."""
    SAFE = "safe"
    WARNING = "warning"
    DANGER = "danger"
    CRITICAL = "critical"


@dataclass
class Vector3D:
    """3D position vector."""
    x: float
    y: float
    z: float

    def distance_to(self, other: 'Vector3D') -> float:
        """Calculate Euclidean distance to another point."""
        return math.sqrt(
            (self.x - other.x) ** 2 +
            (self.y - other.y) ** 2 +
            (self.z - other.z) ** 2
        )

    def to_dict(self) -> Dict[str, float]:
        return {"x": self.x, "y": self.y, "z": self.z}

    @classmethod
    def from_dict(cls, data: Dict[str, float]) -> 'Vector3D':
        return cls(x=data["x"], y=data["y"], z=data["z"])


@dataclass
class ScopeAngle:
    """Endoscope orientation."""
    pitch: float
    yaw: float

    def to_dict(self) -> Dict[str, float]:
        return {"pitch": self.pitch, "yaw": self.yaw}


@dataclass
class TrajectoryPoint:
    """Single point in the endoscope trajectory."""
    timestamp: int  # Unix timestamp ms
    position: Vector3D
    angle: ScopeAngle
    level: int
    nearest_critical: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "position": self.position.to_dict(),
            "angle": self.angle.to_dict(),
            "level": self.level,
            "nearest_critical": self.nearest_critical
        }


@dataclass
class CollisionEvent:
    """Record of a collision with tissue."""
    timestamp: int
    position: Vector3D
    tissue_type: TissueType
    intensity: float = 1.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "position": self.position.to_dict(),
            "tissue_type": self.tissue_type.value,
            "intensity": self.intensity
        }


@dataclass
class CrisisEvent:
    """Record of a crisis (catastrophic event)."""
    timestamp: int
    crisis_type: CrisisType
    collision: CollisionEvent
    description: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "crisis_type": self.crisis_type.value,
            "collision": self.collision.to_dict(),
            "description": self.description
        }


@dataclass
class LevelAdvanceEvent:
    """Record of advancing to next surgical level."""
    timestamp: int
    from_level: int
    to_level: int
    time_in_previous_level_seconds: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "from_level": self.from_level,
            "to_level": self.to_level,
            "time_in_previous_level_seconds": self.time_in_previous_level_seconds
        }


@dataclass
class SafetyZoneEvent:
    """Record of entering/exiting safety zones."""
    timestamp: int
    structure_name: str
    distance: float
    risk_level: RiskLevel
    entering: bool  # True if entering zone, False if exiting

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "structure_name": self.structure_name,
            "distance": self.distance,
            "risk_level": self.risk_level.value,
            "entering": self.entering
        }


@dataclass
class PerformanceMetrics:
    """
    Comprehensive performance metrics.
    Adapted from NeuroVision's SurgicalTrainingSystem.
    """
    accuracy_score: float = 0.0      # 0-100: Trajectory precision
    efficiency_score: float = 0.0    # 0-100: Movement economy
    safety_score: float = 0.0        # 0-100: Avoidance of critical structures
    technique_score: float = 0.0     # 0-100: Smoothness and steadiness
    time_score: float = 0.0          # 0-100: Completion within expected time

    # Weights for overall score (from NeuroVision)
    WEIGHTS = {
        "accuracy": 0.25,
        "efficiency": 0.15,
        "safety": 0.30,
        "technique": 0.20,
        "time": 0.10
    }

    @property
    def overall_score(self) -> float:
        """Calculate weighted overall score."""
        return (
            self.accuracy_score * self.WEIGHTS["accuracy"] +
            self.efficiency_score * self.WEIGHTS["efficiency"] +
            self.safety_score * self.WEIGHTS["safety"] +
            self.technique_score * self.WEIGHTS["technique"] +
            self.time_score * self.WEIGHTS["time"]
        )

    @property
    def grade(self) -> str:
        """Get letter grade based on overall score."""
        score = self.overall_score
        if score >= 90:
            return "A - Excellent"
        elif score >= 80:
            return "B - Proficient"
        elif score >= 70:
            return "C - Competent"
        elif score >= 60:
            return "D - Developing"
        else:
            return "F - Needs Improvement"

    @property
    def certification_eligible(self) -> bool:
        """Check if trainee meets certification requirements."""
        return self.overall_score >= 80 and self.safety_score >= 85

    def to_dict(self) -> Dict[str, Any]:
        return {
            "accuracy_score": round(self.accuracy_score, 1),
            "efficiency_score": round(self.efficiency_score, 1),
            "safety_score": round(self.safety_score, 1),
            "technique_score": round(self.technique_score, 1),
            "time_score": round(self.time_score, 1),
            "overall_score": round(self.overall_score, 1),
            "grade": self.grade,
            "certification_eligible": self.certification_eligible
        }


@dataclass
class AccuracyMetrics:
    """Detailed accuracy metrics for analysis."""
    mean_trajectory_deviation_mm: float = 0.0
    max_trajectory_deviation_mm: float = 0.0
    target_precision_mm: float = 0.0
    optimal_path_adherence: float = 0.0  # 0-100%


@dataclass
class EfficiencyMetrics:
    """Detailed efficiency metrics for analysis."""
    total_path_length_mm: float = 0.0
    optimal_path_length_mm: float = 0.0
    path_efficiency: float = 0.0  # optimal / actual * 100
    total_movements: int = 0
    unnecessary_movements: int = 0
    movement_efficiency: float = 0.0  # (total - unnecessary) / total * 100


@dataclass
class SafetyMetrics:
    """Detailed safety metrics for analysis."""
    total_collisions: int = 0
    collisions_by_tissue: Dict[TissueType, int] = field(default_factory=dict)
    critical_proximity_events: int = 0
    time_in_danger_zone_seconds: float = 0.0
    ica_min_distance_mm: float = float('inf')
    mwcs_min_distance_mm: float = float('inf')
    crises_triggered: int = 0


@dataclass
class TechniqueMetrics:
    """Detailed technique metrics for analysis."""
    smoothness_score: float = 0.0  # Based on acceleration variance
    steadiness_score: float = 0.0  # Based on position variance when stationary
    instrument_control: float = 0.0  # Combined metric


@dataclass
class TimeMetrics:
    """Detailed time metrics for analysis."""
    total_duration_seconds: float = 0.0
    expected_duration_seconds: float = 0.0
    time_per_level_seconds: Dict[int, float] = field(default_factory=dict)
    time_in_critical_zone_seconds: float = 0.0


@dataclass
class SessionRecord:
    """
    Complete record of a training session.
    Used for persistence and analysis.
    """
    session_id: str
    trainee_id: str
    procedure: str
    start_time: datetime
    end_time: Optional[datetime] = None

    # Trajectory data (sampled every 100ms)
    trajectory: List[TrajectoryPoint] = field(default_factory=list)

    # Events
    collisions: List[CollisionEvent] = field(default_factory=list)
    crises: List[CrisisEvent] = field(default_factory=list)
    level_advances: List[LevelAdvanceEvent] = field(default_factory=list)
    safety_zone_events: List[SafetyZoneEvent] = field(default_factory=list)

    # Computed metrics (filled after session ends)
    final_metrics: Optional[PerformanceMetrics] = None
    accuracy_details: Optional[AccuracyMetrics] = None
    efficiency_details: Optional[EfficiencyMetrics] = None
    safety_details: Optional[SafetyMetrics] = None
    technique_details: Optional[TechniqueMetrics] = None
    time_details: Optional[TimeMetrics] = None

    # AI Mentor feedback history
    mentor_feedback_count: int = 0
    mentor_warnings_count: int = 0

    def duration_seconds(self) -> float:
        """Calculate session duration."""
        if not self.end_time:
            return (datetime.now() - self.start_time).total_seconds()
        return (self.end_time - self.start_time).total_seconds()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dictionary."""
        return {
            "session_id": self.session_id,
            "trainee_id": self.trainee_id,
            "procedure": self.procedure,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "duration_seconds": self.duration_seconds(),
            "trajectory_points": len(self.trajectory),
            "collisions": [c.to_dict() for c in self.collisions],
            "crises": [c.to_dict() for c in self.crises],
            "level_advances": [l.to_dict() for l in self.level_advances],
            "final_metrics": self.final_metrics.to_dict() if self.final_metrics else None,
            "mentor_feedback_count": self.mentor_feedback_count,
            "mentor_warnings_count": self.mentor_warnings_count
        }


@dataclass
class TraineeProgress:
    """Aggregated progress data for a trainee across sessions."""
    trainee_id: str
    total_sessions: int = 0
    total_training_time_hours: float = 0.0
    sessions: List[str] = field(default_factory=list)  # Session IDs
    score_history: List[float] = field(default_factory=list)
    grade_history: List[str] = field(default_factory=list)

    # Trend analysis
    improvement_rate: float = 0.0  # Points per session
    consistency_score: float = 0.0  # Score standard deviation (lower is better)

    # Weak areas identification
    weak_areas: List[str] = field(default_factory=list)
    strong_areas: List[str] = field(default_factory=list)

    # Certification status
    certification_ready: bool = False
    sessions_until_certification: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "trainee_id": self.trainee_id,
            "total_sessions": self.total_sessions,
            "total_training_time_hours": round(self.total_training_time_hours, 2),
            "score_history": [round(s, 1) for s in self.score_history],
            "grade_history": self.grade_history,
            "improvement_rate": round(self.improvement_rate, 2),
            "consistency_score": round(self.consistency_score, 2),
            "weak_areas": self.weak_areas,
            "strong_areas": self.strong_areas,
            "certification_ready": self.certification_ready,
            "sessions_until_certification": self.sessions_until_certification
        }


@dataclass
class Benchmark:
    """Benchmark comparison data."""
    trainee_id: str
    percentile: float  # 0-100
    compared_to_count: int
    strengths_vs_population: List[str] = field(default_factory=list)
    weaknesses_vs_population: List[str] = field(default_factory=list)
    expert_comparison: Optional[Dict[str, float]] = None  # Metric -> percentage of expert

    def to_dict(self) -> Dict[str, Any]:
        return {
            "trainee_id": self.trainee_id,
            "percentile": round(self.percentile, 1),
            "compared_to_count": self.compared_to_count,
            "strengths_vs_population": self.strengths_vs_population,
            "weaknesses_vs_population": self.weaknesses_vs_population,
            "expert_comparison": self.expert_comparison
        }
