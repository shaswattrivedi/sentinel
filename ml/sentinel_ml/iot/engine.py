from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Optional

from sentinel_ml.utils.time_utils import coerce_timestamp


SAFE = "SAFE"
MODERATE = "MODERATE"
CRITICAL = "CRITICAL"


@dataclass
class IoTDerivedFeatures:
    avg_density: float
    density_gradient: float
    zone_disparity: float
    cam_density_factor: float


class IoTRiskEngine:
    """Hardware-native risk engine for Z1 camera + Z2/Z3 density sensors."""

    def __init__(
        self,
        w_sensor_density: float = 0.55,
        w_camera_count: float = 0.25,
        w_zone_disparity: float = 0.20,
    ) -> None:
        self.w_sensor_density = w_sensor_density
        self.w_camera_count = w_camera_count
        self.w_zone_disparity = w_zone_disparity
        self._last_timestamp: Optional[datetime] = None
        self._last_avg_density: Optional[float] = None

    @staticmethod
    def _clip_01(value: float) -> float:
        return max(0.0, min(1.0, value))

    def _sensor_status(self, density_score: float) -> str:
        if density_score > 75:
            return CRITICAL
        if density_score > 40:
            return MODERATE
        return SAFE

    def _camera_status(self, cam_count: int) -> str:
        if cam_count > 5:
            return CRITICAL
        if cam_count > 2:
            return MODERATE
        return SAFE

    def _master_status(self, zone_status: Dict[str, str]) -> str:
        if any(status == CRITICAL for status in zone_status.values()):
            return CRITICAL
        if any(status == MODERATE for status in zone_status.values()):
            return MODERATE
        return SAFE

    def _compute_features(
        self,
        timestamp: datetime,
        z1_cam_count: int,
        z2_density_score: float,
        z3_density_score: float,
    ) -> IoTDerivedFeatures:
        avg_density = (z2_density_score + z3_density_score) / 2.0

        # Density gradient: per-minute change in averaged sensor density score.
        density_gradient = 0.0
        if self._last_timestamp is not None and self._last_avg_density is not None:
            delta_s = max((timestamp - self._last_timestamp).total_seconds(), 1.0)
            density_gradient = ((avg_density - self._last_avg_density) / delta_s) * 60.0

        zone_disparity = abs(z2_density_score - z3_density_score)
        cam_density_factor = self._clip_01(z1_cam_count / 10.0)

        self._last_timestamp = timestamp
        self._last_avg_density = avg_density

        return IoTDerivedFeatures(
            avg_density=avg_density,
            density_gradient=density_gradient,
            zone_disparity=zone_disparity,
            cam_density_factor=cam_density_factor,
        )

    def _compute_risk_score(self, features: IoTDerivedFeatures) -> float:
        sensor_norm = self._clip_01(features.avg_density / 100.0)
        disparity_norm = self._clip_01(features.zone_disparity / 100.0)

        # Optional trend boost: fast positive growth slightly increases risk.
        gradient_boost = self._clip_01(max(features.density_gradient, 0.0) / 20.0) * 0.10

        risk_01 = (
            self.w_sensor_density * sensor_norm
            + self.w_camera_count * features.cam_density_factor
            + self.w_zone_disparity * disparity_norm
            + gradient_boost
        )
        return round(self._clip_01(risk_01) * 100.0, 2)

    def _build_reason(self, zone_status: Dict[str, str], features: IoTDerivedFeatures) -> str:
        observations = []
        if zone_status["z2"] == CRITICAL:
            observations.append("high density detected in Zone 2")
        elif zone_status["z2"] == MODERATE:
            observations.append("moderate density detected in Zone 2")

        if zone_status["z3"] == CRITICAL:
            observations.append("high density detected in Zone 3")
        elif zone_status["z3"] == MODERATE:
            observations.append("moderate density detected in Zone 3")

        if zone_status["z1"] == CRITICAL:
            observations.append("high camera congestion in Zone 1")
        elif zone_status["z1"] == MODERATE:
            observations.append("moderate camera congestion in Zone 1")

        if features.zone_disparity >= 25:
            observations.append("strong cross-zone imbalance between Z2 and Z3")

        if features.density_gradient > 8:
            observations.append("rapid increase in average density")

        if not observations:
            return "All zones are stable with low congestion signals."

        sentence = ", and ".join(observations)
        return sentence[:1].upper() + sentence[1:] + "."

    def predict(
        self,
        z1_cam_count: int,
        z2_density_score: float,
        z3_density_score: float,
        timestamp,
    ) -> Dict[str, object]:
        ts = coerce_timestamp(timestamp)
        features = self._compute_features(ts, z1_cam_count, z2_density_score, z3_density_score)

        zone_status = {
            "z1": self._camera_status(z1_cam_count),
            "z2": self._sensor_status(z2_density_score),
            "z3": self._sensor_status(z3_density_score),
        }
        system_status = self._master_status(zone_status)
        risk_score = self._compute_risk_score(features)

        return {
            "risk_score": risk_score,
            "system_status": system_status,
            "zone_status": zone_status,
            "reason": self._build_reason(zone_status, features),
            "features": {
                "avg_density": round(features.avg_density, 2),
                "density_gradient": round(features.density_gradient, 2),
                "zone_disparity": round(features.zone_disparity, 2),
                "cam_density_factor": round(features.cam_density_factor, 3),
            },
        }
