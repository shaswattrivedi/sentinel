from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ZoneStatusResponse(BaseModel):
    z1: str
    z2: str
    z3: str


class PredictResponse(BaseModel):
    risk_score: float = Field(ge=0.0, le=100.0)
    system_status: str
    zone_status: ZoneStatusResponse
    reason: str
    features: dict


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


class FlowResponse(BaseModel):
    timestamp: datetime
    inflow_rate_per_min: float
    outflow_rate_per_min: float
    net_flow_per_min: float


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
