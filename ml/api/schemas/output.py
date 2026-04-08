from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ZoneDataResponse(BaseModel):
    cam_people_count: int = 0
    validation_score: float = 0.0


class TrendPredictionResponse(BaseModel):
    """Pattern ML prediction for future crowd density."""
    trend: str = Field(description="INCREASING/STABLE/DECREASING")
    prediction: str = Field(description="LOW_TREND/MODERATE_TREND/HIGH_RISK")
    predicted_density: float = Field(ge=0.0, le=100.0)
    confidence: float = Field(ge=0.0, le=1.0)


class PredictResponse(BaseModel):
    risk_score: float = Field(ge=0.0, le=100.0)
    system_status: str
    zone_status: Dict[str, str]
    reason: str
    features: dict
    trend_prediction: TrendPredictionResponse = Field(description="ML-based trend prediction")
    zone_data: Dict[str, ZoneDataResponse] = Field(default_factory=dict)
    annotated_frames: Dict[str, Optional[str]] = Field(default_factory=dict)


class HardwareStatusResponse(BaseModel):
    """Current super-node snapshot for dashboard display."""

    timestamp: Optional[datetime] = None
    risk_score: float = 0.0
    system_status: str = "SAFE"
    zone_status: Dict[str, str] = Field(default_factory=lambda: {"zone-1": "SAFE", "zone-2": "SAFE"})
    zone_data: Dict[str, ZoneDataResponse] = Field(
        default_factory=lambda: {
            "zone-1": ZoneDataResponse(),
            "zone-2": ZoneDataResponse(),
        }
    )
    annotated_frames: Dict[str, Optional[str]] = Field(default_factory=lambda: {"zone-1": None, "zone-2": None})
    trend_prediction: TrendPredictionResponse = Field(default_factory=lambda: TrendPredictionResponse(trend="UNKNOWN", prediction="NO_DATA", predicted_density=0.0, confidence=0.0))
    alerts: List[dict] = Field(default_factory=list)


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
