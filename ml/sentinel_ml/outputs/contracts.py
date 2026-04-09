from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class IntelligenceOutput:
    timestamp: datetime
    zone_id: str
    fused_crowd_count: float
    crowd_density: str
    risk_level: str
    fusion_confidence: float
    alert_status: bool
    alert_severity: str
    recommended_action: str
    directional_guidance: str
    explanation_text: str
    camera_people_count: Optional[float] = None
    sensor_people_count: Optional[float] = None
    raw_risk_score: Optional[float] = None
