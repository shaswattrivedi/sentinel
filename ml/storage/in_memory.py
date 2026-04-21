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
    alerts_max_points: int = 200
    outputs_by_organization: Dict[str, Deque[IntelligenceOutput]] = field(default_factory=dict)
    alerts_by_organization: Dict[str, Deque[IntelligenceOutput]] = field(default_factory=dict)
    last_inference_by_organization: Dict[str, datetime] = field(default_factory=dict)
    hardware_status_by_organization: Dict[str, HardwareStatus] = field(default_factory=dict)

    def _normalize_org(self, organization_id: Optional[str]) -> str:
        org_id = (organization_id or "").strip()
        return org_id if org_id else "default-org"

    def _get_outputs_queue(self, organization_id: Optional[str]) -> Deque[IntelligenceOutput]:
        org_id = self._normalize_org(organization_id)
        if org_id not in self.outputs_by_organization:
            self.outputs_by_organization[org_id] = deque(maxlen=self.max_points)
        return self.outputs_by_organization[org_id]

    def _get_alerts_queue(self, organization_id: Optional[str]) -> Deque[IntelligenceOutput]:
        org_id = self._normalize_org(organization_id)
        if org_id not in self.alerts_by_organization:
            self.alerts_by_organization[org_id] = deque(maxlen=self.alerts_max_points)
        return self.alerts_by_organization[org_id]

    def get_hardware_status(self, organization_id: Optional[str]) -> HardwareStatus:
        org_id = self._normalize_org(organization_id)
        if org_id not in self.hardware_status_by_organization:
            self.hardware_status_by_organization[org_id] = HardwareStatus()
        return self.hardware_status_by_organization[org_id]

    def add_output(self, output: IntelligenceOutput, organization_id: Optional[str] = None) -> None:
        org_id = self._normalize_org(organization_id)
        outputs = self._get_outputs_queue(org_id)
        outputs.append(output)
        self.last_inference_by_organization[org_id] = output.timestamp
        if output.alert_status:
            alerts = self._get_alerts_queue(org_id)
            alerts.append(output)

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
        organization_id: Optional[str] = None,
    ) -> None:
        status = self.get_hardware_status(organization_id)
        status.risk_score = risk_score
        status.system_status = system_status
        status.zone_status = zone_status

        # Merge incoming zone data with previous values so partial payloads don't reset dashboard tiles.
        previous_zone_data = status.zone_data if isinstance(status.zone_data, dict) else {}
        incoming_zone_data = zone_data if isinstance(zone_data, dict) else {}
        merged_zone_data: Dict[str, Dict[str, Any]] = {}
        for zone_id in sorted(set(previous_zone_data.keys()) | set(incoming_zone_data.keys())):
            prev_zone = previous_zone_data.get(zone_id, {})
            next_zone = incoming_zone_data.get(zone_id, {})

            prev_zone_dict = prev_zone if isinstance(prev_zone, dict) else {}
            next_zone_dict = next_zone if isinstance(next_zone, dict) else {}
            merged_zone = dict(prev_zone_dict)
            for key, value in next_zone_dict.items():
                if value is not None:
                    merged_zone[key] = value
            merged_zone_data[zone_id] = merged_zone
        if merged_zone_data:
            status.zone_data = merged_zone_data

        # Preserve last good frame if producer sends null/missing frame during transient network issues.
        previous_frames = status.annotated_frames if isinstance(status.annotated_frames, dict) else {}
        incoming_frames = annotated_frames if isinstance(annotated_frames, dict) else {}
        merged_frames: Dict[str, Optional[str]] = dict(previous_frames)
        for zone_id in sorted(set(previous_frames.keys()) | set(incoming_frames.keys())):
            incoming_frame = incoming_frames.get(zone_id)
            if isinstance(incoming_frame, str) and incoming_frame:
                merged_frames[zone_id] = incoming_frame
            elif zone_id not in merged_frames:
                merged_frames[zone_id] = None
        if merged_frames:
            status.annotated_frames = merged_frames

        status.trend_prediction = trend_prediction
        status.alerts = alerts
        status.timestamp = timestamp

    def update_camera_snapshot(
        self,
        latest_annotated_frame: Optional[str],
        z1_people_count: int,
        timestamp: datetime,
        organization_id: Optional[str] = None,
    ) -> None:
        status = self.get_hardware_status(organization_id)
        status.annotated_frames["zone-1"] = latest_annotated_frame
        status.zone_data["zone-1"]["cam_people_count"] = z1_people_count
        status.timestamp = timestamp

    def get_recent_outputs(self, organization_id: Optional[str], limit: int = 100) -> List[IntelligenceOutput]:
        outputs = self._get_outputs_queue(organization_id)
        return list(outputs)[-limit:]

    def get_recent_alerts(self, organization_id: Optional[str], limit: int = 50) -> List[IntelligenceOutput]:
        alerts = self._get_alerts_queue(organization_id)
        return list(alerts)[-limit:]

    def get_last_inference(self, organization_id: Optional[str]) -> Optional[datetime]:
        org_id = self._normalize_org(organization_id)
        return self.last_inference_by_organization.get(org_id)

    def reset(self, organization_id: Optional[str] = None) -> None:
        """Clear in-memory dashboard history and hardware snapshot for one organization or all."""
        if organization_id is None:
            self.outputs_by_organization.clear()
            self.alerts_by_organization.clear()
            self.last_inference_by_organization.clear()
            self.hardware_status_by_organization.clear()
            return

        org_id = self._normalize_org(organization_id)
        self.outputs_by_organization.pop(org_id, None)
        self.alerts_by_organization.pop(org_id, None)
        self.last_inference_by_organization.pop(org_id, None)
        self.hardware_status_by_organization.pop(org_id, None)
