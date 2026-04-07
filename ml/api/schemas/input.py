from datetime import datetime, timezone
from typing import List, Optional, Union

from pydantic import BaseModel, Field, validator


class PredictRequest(BaseModel):
    """IoT-native prediction input for multi-zone fusion."""

    z1_cam_count: int = Field(ge=0, description="YOLO people count for Zone 1 camera")
    z2_density_score: float = Field(ge=0, le=100, description="Arduino density score for Zone 2")
    z3_density_score: float = Field(ge=0, le=100, description="Arduino density score for Zone 3")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Optional event timestamp in UTC",
    )


# ---------------------------------------------------------------------------
# Legacy telemetry schemas (kept for backward compatibility).
# These power /api/v1/telemetry/sensor and /api/v1/telemetry/camera.
# ---------------------------------------------------------------------------


class SensorTelemetryPayload(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    zone_id: str
    pir_motion_detected: bool
    ultrasonic_distance_cm: float = Field(ge=0)
    sensor_estimated_count: int = Field(ge=0)
    sensor_health_status: str = Field(default="OK")

    @validator("zone_id")
    def validate_zone(cls, v: str) -> str:
        if not v:
            raise ValueError("zone_id is required")
        return v


class SensorTelemetryRequest(BaseModel):
    readings: List[SensorTelemetryPayload]


class CameraFramePayload(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    zone_id: str
    frame_b64: str = Field(..., description="Base64-encoded image frame")

    @validator("zone_id")
    def validate_zone(cls, v: str) -> str:
        if not v:
            raise ValueError("zone_id is required")
        return v


class CameraFrameRequest(BaseModel):
    frame: Union[CameraFramePayload, str]
    zone_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    # Optional accompanying sensor readings if available for immediate fusion
    readings: Optional[List[SensorTelemetryPayload]] = None

    def to_frame_payload(self) -> CameraFramePayload:
        if isinstance(self.frame, CameraFramePayload):
            return self.frame
        if not self.zone_id:
            raise ValueError("zone_id is required when frame is a base64 string")
        return CameraFramePayload(
            timestamp=self.timestamp or datetime.now(timezone.utc),
            zone_id=self.zone_id,
            frame_b64=self.frame,
        )
