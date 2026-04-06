from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ZoneStatusResponse(BaseModel):
    z1: str
    z2: str
    z3: str


class HardwareCommandsResponse(BaseModel):
    """Commands to send back to ESP32 for LED/Buzzer control."""
    z2_led: str = Field(description="LED color for Zone 2: green/yellow/red")
    z3_led: str = Field(description="LED color for Zone 3: green/yellow/red")
    z2_buzzer: bool = Field(description="Buzzer state for Zone 2")
    z3_buzzer: bool = Field(description="Buzzer state for Zone 3")


class TrendPredictionResponse(BaseModel):
    """Pattern ML prediction for future crowd density."""
    trend: str = Field(description="INCREASING/STABLE/DECREASING")
    prediction: str = Field(description="LOW_TREND/MODERATE_TREND/HIGH_RISK")
    predicted_density: float = Field(ge=0.0, le=100.0)
    confidence: float = Field(ge=0.0, le=1.0)


class PredictResponse(BaseModel):
    risk_score: float = Field(ge=0.0, le=100.0)
    system_status: str
    zone_status: ZoneStatusResponse
    reason: str
    features: dict
    hardware_commands: HardwareCommandsResponse = Field(description="Commands for ESP32 hardware")
    trend_prediction: TrendPredictionResponse = Field(description="ML-based trend prediction")


class HardwareStatusResponse(BaseModel):
    """Current hardware status for dashboard display."""
    timestamp: Optional[datetime] = None
    zone_status: ZoneStatusResponse = Field(default_factory=lambda: ZoneStatusResponse(z1="UNKNOWN", z2="UNKNOWN", z3="UNKNOWN"))
    hardware_commands: HardwareCommandsResponse = Field(default_factory=lambda: HardwareCommandsResponse(z2_led="gray", z3_led="gray", z2_buzzer=False, z3_buzzer=False))
    trend_prediction: TrendPredictionResponse = Field(default_factory=lambda: TrendPredictionResponse(trend="UNKNOWN", prediction="NO_DATA", predicted_density=0.0, confidence=0.0))


class OverviewResponse(BaseModel):
    timestamp: Optional[datetime]
    zone_id: Optional[str]
    crowd_count: float
    density_level: str
    risk_level: str
    risk_score: float
    risk_color: str
    system_state: str
    fusion_confidence: float


class TimelinePoint(BaseModel):
    timestamp: datetime
    risk_score: float
    risk_level: str
    density_level: str


class TimelineResponse(BaseModel):
    points: List[TimelinePoint]


class FlowPointResponse(BaseModel):
    timestamp: datetime
    inflow_rate_per_min: float
    outflow_rate_per_min: float
    net_flow_per_min: float


class FlowResponse(BaseModel):
    points: List[FlowPointResponse]


class AlertItem(BaseModel):
    timestamp: datetime
    alert_status: bool
    alert_severity: str
    explanation: str


class AlertsResponse(BaseModel):
    alerts: List[AlertItem] = Field(default_factory=list)


class DecisionResponse(BaseModel):
    timestamp: Optional[datetime]
    risk_level: str
    recommendation: str
    direction: str
    confidence: float


class HealthResponse(BaseModel):
    status: str
    ml_pipeline: str
    last_inference: Optional[datetime]
