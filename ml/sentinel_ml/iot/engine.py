import os
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Optional

from sentinel_ml.utils.time_utils import coerce_timestamp


SAFE = "SAFE"
MODERATE = "MODERATE"
CRITICAL = "CRITICAL"


@dataclass
class ZoneRiskComponents:
    camera_score: float
    sensor_score: float
    zone_risk: float


@dataclass
class TrendPrediction:
    trend: str
    prediction: str
    predicted_density: float
    confidence: float


class IoTRiskEngine:
    """Risk engine for two identical super nodes with camera + validation sensors."""

    def __init__(self) -> None:
        self._last_timestamp: Optional[datetime] = None
        self._last_avg_zone_risk: Optional[float] = None

        # Tunable thresholds for occupancy-heavy deployments.
        self._safe_max_score = float(os.getenv("IOT_SAFE_MAX_SCORE", "40"))
        self._moderate_max_score = float(os.getenv("IOT_MODERATE_MAX_SCORE", "75"))
        self._moderate_cam_people_threshold = int(os.getenv("IOT_MODERATE_CAM_COUNT", "4"))
        self._critical_cam_people_threshold = int(os.getenv("IOT_CRITICAL_CAM_COUNT", "8"))

    @staticmethod
    def _clip(value: float, lo: float, hi: float) -> float:
        return max(lo, min(hi, value))

    def _status_from_score(self, score: float) -> str:
        if score > self._moderate_max_score:
            return CRITICAL
        if score > self._safe_max_score:
            return MODERATE
        return SAFE

    def _zone_status(
        self,
        cam_people_count: int,
        camera_score: float,
        sensor_score: float,
        zone_risk: float,
    ) -> str:
        """Balanced hybrid: weighted fusion is primary, with guarded multi-signal escalation."""
        base_status = self._status_from_score(zone_risk)

        cam_moderate = (
            cam_people_count >= self._moderate_cam_people_threshold
            or camera_score > self._safe_max_score
        )
        sensor_moderate = sensor_score > self._safe_max_score

        cam_critical = (
            cam_people_count >= self._critical_cam_people_threshold
            or camera_score > self._moderate_max_score
        )
        sensor_critical = sensor_score > self._moderate_max_score

        # If weighted fusion already says MODERATE/CRITICAL, trust it.
        if base_status == CRITICAL:
            return CRITICAL
        if base_status == MODERATE:
            # Escalate to CRITICAL only when both signals independently look critical.
            return CRITICAL if (cam_critical and sensor_critical) else MODERATE

        # Weighted SAFE: either signal can promote to MODERATE.
        if cam_moderate or sensor_moderate:
            return MODERATE

        return SAFE

    def _apply_risk_score_floor(self, risk_score: float, system_status: str) -> float:
        """Keep score/status coherent while preserving weighted-signal variation."""
        score = self._clip(float(risk_score), 0.0, 100.0)

        if system_status == CRITICAL:
            if score > self._moderate_max_score:
                return score
            # Nudge into the critical band with minimal distortion.
            src_max = max(self._moderate_max_score, 1.0)
            t = self._clip(score / src_max, 0.0, 1.0)
            return (self._moderate_max_score + 1.0) + (t * 8.0)

        if system_status == MODERATE:
            if score > self._safe_max_score:
                return score
            # Nudge into moderate band with minimal distortion.
            src_max = max(self._safe_max_score, 1.0)
            t = self._clip(score / src_max, 0.0, 1.0)
            return (self._safe_max_score + 1.0) + (t * 5.0)

        return score

    def _master_status(self, zone_status: Dict[str, str]) -> str:
        if any(status == CRITICAL for status in zone_status.values()):
            return CRITICAL
        if any(status == MODERATE for status in zone_status.values()):
            return MODERATE
        return SAFE

    def _compute_zone_risk(self, cam_people_count: int, validation_score: float) -> ZoneRiskComponents:
        camera_score = self._clip(cam_people_count / 20.0, 0.0, 1.0) * 100.0
        sensor_score = self._clip(validation_score, 0.0, 100.0)
        zone_risk = (0.60 * camera_score) + (0.40 * sensor_score)
        return ZoneRiskComponents(
            camera_score=round(camera_score, 2),
            sensor_score=round(sensor_score, 2),
            zone_risk=round(zone_risk, 2),
        )

    def _compute_risk_score(self, zone_1_risk: float, zone_2_risk: float) -> Dict[str, float]:
        zone_disparity = abs(zone_1_risk - zone_2_risk)
        disparity_boost = 10.0 if zone_disparity > 40.0 else 0.0
        avg_zone_risk = (zone_1_risk + zone_2_risk) / 2.0
        risk_score = min(100.0, avg_zone_risk + disparity_boost)
        return {
            "zone_disparity": round(zone_disparity, 2),
            "disparity_boost": round(disparity_boost, 2),
            "avg_zone_risk": round(avg_zone_risk, 2),
            "risk_score": round(risk_score, 2),
        }

    def _compute_trend_prediction(self, timestamp: datetime, avg_zone_risk: float) -> TrendPrediction:
        gradient = 0.0
        if self._last_timestamp is not None and self._last_avg_zone_risk is not None:
            delta_s = max((timestamp - self._last_timestamp).total_seconds(), 1.0)
            gradient = ((avg_zone_risk - self._last_avg_zone_risk) / delta_s) * 60.0

        self._last_timestamp = timestamp
        self._last_avg_zone_risk = avg_zone_risk

        if gradient > 5.0:
            trend = "INCREASING"
        elif gradient < -5.0:
            trend = "DECREASING"
        else:
            trend = "STABLE"

        predicted_density = self._clip(avg_zone_risk + (gradient * 0.5), 0.0, 100.0)

        if predicted_density > 75.0 or avg_zone_risk > 75.0:
            prediction = "HIGH_RISK"
            confidence = 0.88
        elif predicted_density > 40.0 or avg_zone_risk > 40.0:
            prediction = "MODERATE_TREND"
            confidence = 0.78
        else:
            prediction = "LOW_TREND"
            confidence = 0.75

        return TrendPrediction(
            trend=trend,
            prediction=prediction,
            predicted_density=round(predicted_density, 2),
            confidence=confidence,
        )

    def _build_reason(self, zone_status: Dict[str, str], zone_disparity: float, disparity_boost: float) -> str:
        observations = []
        if zone_status["zone-1"] == CRITICAL:
            observations.append("Zone 1 is critical")
        elif zone_status["zone-1"] == MODERATE:
            observations.append("Zone 1 is moderate")

        if zone_status["zone-2"] == CRITICAL:
            observations.append("Zone 2 is critical")
        elif zone_status["zone-2"] == MODERATE:
            observations.append("Zone 2 is moderate")

        if disparity_boost > 0:
            observations.append(f"cross-zone disparity detected ({zone_disparity:.1f})")

        if not observations:
            return "Both zones are stable with low risk signals."

        return ", ".join(observations) + "."

    def predict(
        self,
        zone_1_cam_people_count: int,
        zone_1_validation_score: float,
        zone_2_cam_people_count: int,
        zone_2_validation_score: float,
        timestamp,
    ) -> Dict[str, object]:
        ts = coerce_timestamp(timestamp)

        zone_1 = self._compute_zone_risk(zone_1_cam_people_count, zone_1_validation_score)
        zone_2 = self._compute_zone_risk(zone_2_cam_people_count, zone_2_validation_score)

        risk_parts = self._compute_risk_score(zone_1.zone_risk, zone_2.zone_risk)

        zone_status = {
            "zone-1": self._zone_status(
                cam_people_count=zone_1_cam_people_count,
                camera_score=zone_1.camera_score,
                sensor_score=zone_1.sensor_score,
                zone_risk=zone_1.zone_risk,
            ),
            "zone-2": self._zone_status(
                cam_people_count=zone_2_cam_people_count,
                camera_score=zone_2.camera_score,
                sensor_score=zone_2.sensor_score,
                zone_risk=zone_2.zone_risk,
            ),
        }
        system_status = self._master_status(zone_status)
        risk_score = self._apply_risk_score_floor(risk_parts["risk_score"], system_status)
        trend_prediction = self._compute_trend_prediction(ts, risk_parts["avg_zone_risk"])

        return {
            "risk_score": round(risk_score, 2),
            "system_status": system_status,
            "zone_status": zone_status,
            "reason": self._build_reason(
                zone_status,
                zone_disparity=risk_parts["zone_disparity"],
                disparity_boost=risk_parts["disparity_boost"],
            ),
            "features": {
                "zone_1_camera_score": zone_1.camera_score,
                "zone_1_sensor_score": zone_1.sensor_score,
                "zone_1_risk": zone_1.zone_risk,
                "zone_2_camera_score": zone_2.camera_score,
                "zone_2_sensor_score": zone_2.sensor_score,
                "zone_2_risk": zone_2.zone_risk,
                "avg_zone_risk": risk_parts["avg_zone_risk"],
                "zone_disparity": risk_parts["zone_disparity"],
                "disparity_boost": risk_parts["disparity_boost"],
            },
            "trend_prediction": {
                "trend": trend_prediction.trend,
                "prediction": trend_prediction.prediction,
                "predicted_density": trend_prediction.predicted_density,
                "confidence": trend_prediction.confidence,
            },
        }
