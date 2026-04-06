from dataclasses import dataclass
from enum import Enum
from typing import Optional

import numpy as np

from sentinel_ml.utils.time_utils import coerce_timestamp, TimestampLike


class SensorHealthStatus(str, Enum):
    OK = "OK"
    DEGRADED = "DEGRADED"
    FAILED = "FAILED"


@dataclass
class SensorTelemetryInput:
    timestamp: TimestampLike
    zone_id: str
    pir_motion_detected: bool
    ultrasonic_distance_cm: float
    sensor_estimated_count: int
    sensor_health_status: SensorHealthStatus = SensorHealthStatus.OK

    def validate(self) -> "SensorTelemetryInput":
        self.timestamp = coerce_timestamp(self.timestamp)
        if not self.zone_id:
            raise ValueError("zone_id is required")
        if self.ultrasonic_distance_cm < 0:
            raise ValueError("ultrasonic_distance_cm must be non-negative")
        if self.sensor_estimated_count < 0:
            raise ValueError("sensor_estimated_count must be non-negative")
        return self


@dataclass
class CameraFrameInput:
    timestamp: TimestampLike
    zone_id: str
    frame: np.ndarray

    def validate(self) -> "CameraFrameInput":
        self.timestamp = coerce_timestamp(self.timestamp)
        if not self.zone_id:
            raise ValueError("zone_id is required")
        if self.frame is None or not isinstance(self.frame, np.ndarray):
            raise ValueError("frame must be a numpy array")
        if self.frame.size == 0:
            raise ValueError("frame must not be empty")
        return self
