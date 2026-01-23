"""
Trajectory Analysis Service

Analyzes endoscope trajectory data to calculate performance metrics.
Implements algorithms from NeuroVision adapted for NeuroSim telemetry.
"""

import math
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import statistics

from ..models.telemetry import (
    TrajectoryPoint, Vector3D, CollisionEvent, CrisisEvent,
    SafetyZoneEvent, LevelAdvanceEvent, TissueType, RiskLevel,
    PerformanceMetrics, AccuracyMetrics, EfficiencyMetrics,
    SafetyMetrics, TechniqueMetrics, TimeMetrics, SessionRecord
)


# Constants matching NeuroSim frontend
SAFETY_MARGINS = {
    "ICA": {"safe": 3.0, "warning": 2.0, "danger": 1.0, "critical": 0.5},
    "MWCS": {"safe": 2.0, "warning": 1.0, "danger": 0.5, "critical": 0.2},
    "DURA": {"safe": 1.5, "warning": 1.0, "danger": 0.5, "critical": 0.2}
}

COLLISION_PENALTIES = {
    TissueType.MUCOSA: 1,
    TissueType.BONE: 3,
    TissueType.DURA: 5,
    TissueType.MWCS: 10,
    TissueType.ICA: 100,
    TissueType.TUMOR: 2,
    TissueType.PITUITARY: 5
}

# Expected durations per level (seconds)
EXPECTED_LEVEL_DURATIONS = {
    1: 120,   # 2 minutes for nasal approach
    2: 180,   # 3 minutes for sphenoidotomy
    3: 300    # 5 minutes for sella/tumor
}

# Optimal path lengths per level (mm) - based on anatomical distances
OPTIMAL_PATH_LENGTHS = {
    1: 50,    # Nostril to sphenoid ostium
    2: 30,    # Ostium to sella floor
    3: 20     # Sella floor to tumor center
}


class TrajectoryAnalyzer:
    """
    Analyzes trajectory data to compute performance metrics.
    """

    def __init__(self):
        self.trajectory: List[TrajectoryPoint] = []
        self.collisions: List[CollisionEvent] = []
        self.crises: List[CrisisEvent] = []
        self.safety_events: List[SafetyZoneEvent] = []
        self.level_advances: List[LevelAdvanceEvent] = []

    def load_session(self, session: SessionRecord) -> None:
        """Load session data for analysis."""
        self.trajectory = session.trajectory
        self.collisions = session.collisions
        self.crises = session.crises
        self.safety_events = session.safety_zone_events
        self.level_advances = session.level_advances

    def analyze(self) -> PerformanceMetrics:
        """
        Perform complete analysis and return performance metrics.
        """
        accuracy = self._calculate_accuracy()
        efficiency = self._calculate_efficiency()
        safety = self._calculate_safety()
        technique = self._calculate_technique()
        time_metrics = self._calculate_time()

        return PerformanceMetrics(
            accuracy_score=self._normalize_accuracy(accuracy),
            efficiency_score=self._normalize_efficiency(efficiency),
            safety_score=self._normalize_safety(safety),
            technique_score=self._normalize_technique(technique),
            time_score=self._normalize_time(time_metrics)
        )

    def get_detailed_metrics(self) -> Dict[str, any]:
        """Get all detailed metrics for comprehensive reporting."""
        return {
            "accuracy": self._calculate_accuracy(),
            "efficiency": self._calculate_efficiency(),
            "safety": self._calculate_safety(),
            "technique": self._calculate_technique(),
            "time": self._calculate_time()
        }

    # =========================================================================
    # ACCURACY ANALYSIS
    # =========================================================================

    def _calculate_accuracy(self) -> AccuracyMetrics:
        """
        Calculate accuracy metrics based on trajectory deviation from optimal path.
        """
        if len(self.trajectory) < 2:
            return AccuracyMetrics()

        # Define optimal waypoints for transsphenoidal approach
        # These are simplified; in production would be more detailed
        optimal_waypoints = {
            1: [Vector3D(0, 0, 0.5), Vector3D(0, 0.2, -5.0)],  # Nasal entry
            2: [Vector3D(0, 0.2, -6.5), Vector3D(0, 0.3, -6.8)],  # Sphenoid
            3: [Vector3D(0, 0.4, -7.2), Vector3D(0, 0.6, -7.5)]   # Sella
        }

        deviations = []
        for point in self.trajectory:
            level = point.level
            if level in optimal_waypoints:
                # Find minimum distance to optimal path segment
                min_dev = self._point_to_segment_distance(
                    point.position,
                    optimal_waypoints[level]
                )
                deviations.append(min_dev)

        if not deviations:
            return AccuracyMetrics()

        return AccuracyMetrics(
            mean_trajectory_deviation_mm=statistics.mean(deviations),
            max_trajectory_deviation_mm=max(deviations),
            target_precision_mm=deviations[-1] if deviations else 0,
            optimal_path_adherence=max(0, 100 - statistics.mean(deviations) * 10)
        )

    def _point_to_segment_distance(
        self,
        point: Vector3D,
        segment: List[Vector3D]
    ) -> float:
        """Calculate minimum distance from point to line segment."""
        if len(segment) < 2:
            return point.distance_to(segment[0]) if segment else 0

        p1, p2 = segment[0], segment[1]

        # Vector from p1 to p2
        dx = p2.x - p1.x
        dy = p2.y - p1.y
        dz = p2.z - p1.z

        # If segment has zero length
        length_sq = dx*dx + dy*dy + dz*dz
        if length_sq < 1e-10:
            return point.distance_to(p1)

        # Project point onto line, clamped to segment
        t = max(0, min(1, (
            (point.x - p1.x) * dx +
            (point.y - p1.y) * dy +
            (point.z - p1.z) * dz
        ) / length_sq))

        # Closest point on segment
        closest = Vector3D(
            p1.x + t * dx,
            p1.y + t * dy,
            p1.z + t * dz
        )

        return point.distance_to(closest)

    def _normalize_accuracy(self, metrics: AccuracyMetrics) -> float:
        """Convert accuracy metrics to 0-100 score."""
        # Lower deviation = higher score
        # Perfect (0mm deviation) = 100, 10mm deviation = 0
        deviation_score = max(0, 100 - metrics.mean_trajectory_deviation_mm * 10)
        adherence = metrics.optimal_path_adherence

        return (deviation_score * 0.6 + adherence * 0.4)

    # =========================================================================
    # EFFICIENCY ANALYSIS
    # =========================================================================

    def _calculate_efficiency(self) -> EfficiencyMetrics:
        """
        Calculate efficiency metrics based on movement economy.
        """
        if len(self.trajectory) < 2:
            return EfficiencyMetrics()

        # Calculate total path length
        total_length = 0.0
        movements = 0
        unnecessary = 0

        prev_point = self.trajectory[0]
        prev_level = prev_point.level

        for point in self.trajectory[1:]:
            segment_length = point.position.distance_to(prev_point.position)
            total_length += segment_length

            # Count movements (significant position changes)
            if segment_length > 0.01:  # 0.01 units = ~0.1mm
                movements += 1

                # Check if movement was "unnecessary" (moved away from goal)
                if point.level == prev_level:
                    # Still in same level, check if progressing
                    # For simplicity: movement toward -Z is progress
                    if point.position.z > prev_point.position.z:
                        unnecessary += 1

            prev_point = point
            prev_level = point.level

        # Calculate optimal path length based on levels traversed
        optimal_length = sum(
            OPTIMAL_PATH_LENGTHS.get(adv.to_level, 30)
            for adv in self.level_advances
        ) or OPTIMAL_PATH_LENGTHS[1]

        path_efficiency = min(100, (optimal_length / max(total_length, 0.01)) * 100)
        movement_efficiency = 100 * (movements - unnecessary) / max(movements, 1)

        return EfficiencyMetrics(
            total_path_length_mm=total_length * 10,  # Convert to mm
            optimal_path_length_mm=optimal_length,
            path_efficiency=path_efficiency,
            total_movements=movements,
            unnecessary_movements=unnecessary,
            movement_efficiency=movement_efficiency
        )

    def _normalize_efficiency(self, metrics: EfficiencyMetrics) -> float:
        """Convert efficiency metrics to 0-100 score."""
        return (metrics.path_efficiency * 0.6 + metrics.movement_efficiency * 0.4)

    # =========================================================================
    # SAFETY ANALYSIS
    # =========================================================================

    def _calculate_safety(self) -> SafetyMetrics:
        """
        Calculate safety metrics based on collisions and proximity events.
        """
        # Count collisions by tissue type
        collisions_by_tissue = {}
        for collision in self.collisions:
            tissue = collision.tissue_type
            collisions_by_tissue[tissue] = collisions_by_tissue.get(tissue, 0) + 1

        # Count critical proximity events
        critical_events = sum(
            1 for event in self.safety_events
            if event.risk_level in (RiskLevel.DANGER, RiskLevel.CRITICAL)
        )

        # Calculate time in danger zone
        danger_time = 0.0
        in_danger = False
        danger_start = 0

        for event in sorted(self.safety_events, key=lambda e: e.timestamp):
            if event.risk_level in (RiskLevel.DANGER, RiskLevel.CRITICAL):
                if event.entering and not in_danger:
                    in_danger = True
                    danger_start = event.timestamp
                elif not event.entering and in_danger:
                    in_danger = False
                    danger_time += (event.timestamp - danger_start) / 1000

        # Find minimum distances to critical structures
        ica_min = float('inf')
        mwcs_min = float('inf')

        for point in self.trajectory:
            if point.nearest_critical:
                name = point.nearest_critical.get("structure", "")
                dist = point.nearest_critical.get("distance", float('inf'))

                if "ICA" in name:
                    ica_min = min(ica_min, dist)
                elif "MWCS" in name:
                    mwcs_min = min(mwcs_min, dist)

        return SafetyMetrics(
            total_collisions=len(self.collisions),
            collisions_by_tissue=collisions_by_tissue,
            critical_proximity_events=critical_events,
            time_in_danger_zone_seconds=danger_time,
            ica_min_distance_mm=ica_min if ica_min != float('inf') else -1,
            mwcs_min_distance_mm=mwcs_min if mwcs_min != float('inf') else -1,
            crises_triggered=len(self.crises)
        )

    def _normalize_safety(self, metrics: SafetyMetrics) -> float:
        """Convert safety metrics to 0-100 score."""
        score = 100.0

        # Deduct for collisions based on severity
        for tissue, count in metrics.collisions_by_tissue.items():
            penalty = COLLISION_PENALTIES.get(tissue, 1) * count
            score -= penalty

        # Deduct for critical proximity events
        score -= metrics.critical_proximity_events * 2

        # Deduct for time in danger zone
        score -= min(20, metrics.time_in_danger_zone_seconds * 0.5)

        # Massive penalty for crises
        score -= metrics.crises_triggered * 50

        return max(0, min(100, score))

    # =========================================================================
    # TECHNIQUE ANALYSIS
    # =========================================================================

    def _calculate_technique(self) -> TechniqueMetrics:
        """
        Calculate technique metrics based on movement smoothness and steadiness.
        """
        if len(self.trajectory) < 3:
            return TechniqueMetrics()

        # Calculate velocity and acceleration for smoothness
        velocities = []
        accelerations = []

        for i in range(1, len(self.trajectory)):
            prev = self.trajectory[i-1]
            curr = self.trajectory[i]

            dt = (curr.timestamp - prev.timestamp) / 1000  # Convert to seconds
            if dt < 0.001:
                continue

            # Velocity magnitude
            dist = curr.position.distance_to(prev.position)
            velocity = dist / dt
            velocities.append(velocity)

            if len(velocities) >= 2:
                # Acceleration
                dv = abs(velocities[-1] - velocities[-2])
                accelerations.append(dv / dt)

        # Smoothness: low acceleration variance = smooth movement
        smoothness = 100.0
        if accelerations:
            accel_variance = statistics.variance(accelerations) if len(accelerations) > 1 else 0
            smoothness = max(0, 100 - accel_variance * 1000)

        # Steadiness: low velocity when "stationary" (low overall velocity)
        steadiness = 100.0
        low_velocity_points = [v for v in velocities if v < 0.01]
        if low_velocity_points:
            steady_variance = statistics.variance(low_velocity_points) if len(low_velocity_points) > 1 else 0
            steadiness = max(0, 100 - steady_variance * 10000)

        return TechniqueMetrics(
            smoothness_score=smoothness,
            steadiness_score=steadiness,
            instrument_control=(smoothness + steadiness) / 2
        )

    def _normalize_technique(self, metrics: TechniqueMetrics) -> float:
        """Convert technique metrics to 0-100 score."""
        return metrics.instrument_control

    # =========================================================================
    # TIME ANALYSIS
    # =========================================================================

    def _calculate_time(self) -> TimeMetrics:
        """
        Calculate time metrics based on session duration.
        """
        if not self.trajectory:
            return TimeMetrics()

        start_time = self.trajectory[0].timestamp
        end_time = self.trajectory[-1].timestamp
        total_duration = (end_time - start_time) / 1000  # Seconds

        # Calculate time per level
        time_per_level = {}
        current_level = self.trajectory[0].level
        level_start = start_time

        for point in self.trajectory:
            if point.level != current_level:
                time_per_level[current_level] = (point.timestamp - level_start) / 1000
                current_level = point.level
                level_start = point.timestamp

        # Add final level
        time_per_level[current_level] = (end_time - level_start) / 1000

        # Calculate expected duration
        expected = sum(EXPECTED_LEVEL_DURATIONS.get(level, 180) for level in time_per_level.keys())

        # Time in critical zone
        critical_time = 0.0
        for point in self.trajectory:
            if point.nearest_critical:
                if point.nearest_critical.get("riskLevel") in ("danger", "critical"):
                    critical_time += 0.1  # Assuming 100ms sample rate

        return TimeMetrics(
            total_duration_seconds=total_duration,
            expected_duration_seconds=expected,
            time_per_level_seconds=time_per_level,
            time_in_critical_zone_seconds=critical_time
        )

    def _normalize_time(self, metrics: TimeMetrics) -> float:
        """Convert time metrics to 0-100 score."""
        if metrics.expected_duration_seconds == 0:
            return 85.0  # Default score if no expected duration

        # Score based on completion time vs expected
        ratio = metrics.total_duration_seconds / metrics.expected_duration_seconds

        if ratio <= 1.0:
            # Completed on time or faster
            return min(100, 85 + (1.0 - ratio) * 15)
        elif ratio <= 1.5:
            # Up to 50% over time
            return 85 - (ratio - 1.0) * 30
        else:
            # Significantly over time
            return max(0, 70 - (ratio - 1.5) * 40)


# =========================================================================
# RECOMMENDATIONS GENERATOR
# =========================================================================

class RecommendationsGenerator:
    """
    Generate personalized recommendations based on performance metrics.
    """

    THRESHOLDS = {
        "accuracy": 80,
        "efficiency": 75,
        "safety": 85,
        "technique": 80,
        "time": 75
    }

    RECOMMENDATIONS = {
        "accuracy_low": [
            "Practice trajectory planning before starting the procedure",
            "Use navigation waypoints to guide your approach",
            "Study the optimal path anatomy in detail"
        ],
        "efficiency_low": [
            "Minimize unnecessary movements - plan each action",
            "Practice smooth continuous movements rather than jerky adjustments",
            "Review video of your session to identify wasted motion"
        ],
        "safety_low": [
            "Prioritize critical structure identification before advancing",
            "Maintain greater distance from ICA and MWCS",
            "Slow down when approaching danger zones"
        ],
        "technique_low": [
            "Practice microsurgical technique in low-stakes scenarios",
            "Focus on smooth, deliberate movements",
            "Work on instrument steadiness when stationary"
        ],
        "time_low": [
            "Improve procedural flow by reviewing step sequences",
            "Identify bottlenecks in your approach",
            "Balance speed with safety - don't rush critical steps"
        ]
    }

    def generate(self, metrics: PerformanceMetrics) -> List[str]:
        """Generate personalized recommendations."""
        recommendations = []

        if metrics.accuracy_score < self.THRESHOLDS["accuracy"]:
            recommendations.extend(self.RECOMMENDATIONS["accuracy_low"][:1])

        if metrics.efficiency_score < self.THRESHOLDS["efficiency"]:
            recommendations.extend(self.RECOMMENDATIONS["efficiency_low"][:1])

        if metrics.safety_score < self.THRESHOLDS["safety"]:
            recommendations.extend(self.RECOMMENDATIONS["safety_low"][:2])

        if metrics.technique_score < self.THRESHOLDS["technique"]:
            recommendations.extend(self.RECOMMENDATIONS["technique_low"][:1])

        if metrics.time_score < self.THRESHOLDS["time"]:
            recommendations.extend(self.RECOMMENDATIONS["time_low"][:1])

        if not recommendations:
            recommendations.append("Excellent performance! Continue practicing to maintain proficiency.")

        return recommendations
