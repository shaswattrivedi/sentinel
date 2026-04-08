from datetime import datetime, timezone
from typing import Dict, List, Optional, Union

from pydantic import BaseModel, Field, validator


class ZoneData(BaseModel):
    cam_people_count: int = 0
    cam_confidence: float = 0.75
    validation_score: float = 0.0


class PredictRequest(BaseModel):
    timestamp: str
    zone_1: Optional[ZoneData] = ZoneData()
    zone_2: Optional[ZoneData] = ZoneData()
    annotated_frames: Optional[Dict[str, Optional[str]]] = Field(default_factory=dict)

    class Config:
        extra = "allow"


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
