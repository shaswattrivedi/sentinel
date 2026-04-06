from collections import deque
from typing import Iterable, Tuple

from sentinel_ml.inputs.schemas import SensorHealthStatus, SensorTelemetryInput
from sentinel_ml.utils.smoothing import ExponentialSmoother


class SensorInterpreter:
    """Deterministic interpretation of PIR and ultrasonic telemetry."""

    def __init__(
        self,
        ultrasonic_presence_threshold_cm: float = 180.0,
        motion_weight: float = 0.4,
        ultrasonic_weight: float = 0.4,
        count_weight: float = 0.2,
        smoothing_alpha: float = 0.35,
        history: int = 10,
    ) -> None:
        self.ultrasonic_presence_threshold_cm = ultrasonic_presence_threshold_cm
        self.motion_weight = motion_weight
        self.ultrasonic_weight = ultrasonic_weight
        self.count_weight = count_weight
        self.smoother = ExponentialSmoother(alpha=smoothing_alpha)
        self.recent_confidences = deque(maxlen=history)

    def interpret_single(self, telemetry: SensorTelemetryInput) -> Tuple[float, float]:
        telemetry.validate()
        if telemetry.sensor_health_status == SensorHealthStatus.FAILED:
            return 0.0, 0.0

        presence_score = 0.0
        if telemetry.pir_motion_detected:
            presence_score += self.motion_weight

        if telemetry.ultrasonic_distance_cm <= self.ultrasonic_presence_threshold_cm:
            presence_score += self.ultrasonic_weight

        inferred_count = 1.0 if presence_score > 0 else 0.0
        if telemetry.sensor_estimated_count > 0:
            inferred_count = telemetry.sensor_estimated_count
            presence_score += self.count_weight

        health_factor = 0.7 if telemetry.sensor_health_status == SensorHealthStatus.DEGRADED else 1.0
        confidence = max(0.0, min(1.0, presence_score * health_factor))
        return inferred_count, confidence

    def interpret(self, telemetry_batch: Iterable[SensorTelemetryInput]) -> Tuple[float, float]:
        estimates = [self.interpret_single(t) for t in telemetry_batch]
        if not estimates:
            return 0.0, 0.0

        weighted_sum = 0.0
        confidence_sum = 0.0
        for count, confidence in estimates:
            weighted_sum += count * confidence
            confidence_sum += confidence
        if confidence_sum == 0.0:
            return 0.0, 0.0

        average_count = weighted_sum / confidence_sum
        smoothed_count = self.smoother.update(average_count)
        avg_confidence = confidence_sum / max(len(estimates), 1)
        self.recent_confidences.append(avg_confidence)
        stable_confidence = sum(self.recent_confidences) / len(self.recent_confidences)
        return smoothed_count, stable_confidence
