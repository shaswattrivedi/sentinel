from collections import deque
from dataclasses import dataclass, field
from datetime import datetime
from typing import Deque, Dict, List, Optional, Any

from sentinel_ml.outputs.contracts import IntelligenceOutput


@dataclass
class HardwareStatus:
    """Latest super-node snapshot for dashboard responses."""

    risk_score: float = 0.0
    system_status: str = "SAFE"
    zone_status: Dict[str, str] = field(default_factory=lambda: {"zone-1": "SAFE", "zone-2": "SAFE"})
    zone_data: Dict[str, Dict[str, Any]] = field(
        default_factory=lambda: {
            "zone-1": {"cam_people_count": 0, "validation_score": 0},
            "zone-2": {"cam_people_count": 0, "validation_score": 0},
        }
    )
    annotated_frames: Dict[str, Optional[str]] = field(default_factory=lambda: {"zone-1": None, "zone-2": None})
    trend_prediction: Dict[str, Any] = field(
        default_factory=lambda: {
            "trend": "STABLE",
            "prediction": "LOW_TREND",
            "predicted_density": 0,
            "confidence": 0.75,
        }
    )
    alerts: List[Dict[str, Any]] = field(default_factory=list)
    timestamp: Optional[datetime] = None


@dataclass
class InMemoryStore:
    max_points: int = 500
    outputs: Deque[IntelligenceOutput] = field(default_factory=lambda: deque(maxlen=500))
    alerts: Deque[IntelligenceOutput] = field(default_factory=lambda: deque(maxlen=200))
    last_inference: Optional[datetime] = None
    hardware_status: HardwareStatus = field(default_factory=HardwareStatus)

    def add_output(self, output: IntelligenceOutput) -> None:
        self.outputs.append(output)
        self.last_inference = output.timestamp
        if output.alert_status:
            self.alerts.append(output)

    def update_hardware_status(
        self,
        risk_score: float,
        system_status: str,
        zone_status: Dict[str, str],
        zone_data: Dict[str, Dict[str, Any]],
        annotated_frames: Dict[str, Optional[str]],
        trend_prediction: Dict[str, Any],
        alerts: List[Dict[str, Any]],
        timestamp: datetime,
    ) -> None:
        self.hardware_status.risk_score = risk_score
        self.hardware_status.system_status = system_status
        self.hardware_status.zone_status = zone_status
        self.hardware_status.zone_data = zone_data
        self.hardware_status.annotated_frames = annotated_frames
        self.hardware_status.trend_prediction = trend_prediction
        self.hardware_status.alerts = alerts
        self.hardware_status.timestamp = timestamp

    def update_camera_snapshot(
        self,
        latest_annotated_frame: Optional[str],
        z1_people_count: int,
        timestamp: datetime,
    ) -> None:
        self.hardware_status.annotated_frames["zone-1"] = latest_annotated_frame
        self.hardware_status.zone_data["zone-1"]["cam_people_count"] = z1_people_count
        self.hardware_status.timestamp = timestamp

    def get_recent_outputs(self, limit: int = 100) -> List[IntelligenceOutput]:
        return list(self.outputs)[-limit:]

    def get_recent_alerts(self, limit: int = 50) -> List[IntelligenceOutput]:
        return list(self.alerts)[-limit:]

    def reset(self) -> None:
        """Clear all in-memory dashboard history and hardware snapshot."""
        self.outputs.clear()
        self.alerts.clear()
        self.last_inference = None
        self.hardware_status = HardwareStatus()
