from collections import deque
from dataclasses import dataclass, field
from datetime import datetime
from typing import Deque, Dict, List, Optional, Any

from sentinel_ml.outputs.contracts import IntelligenceOutput


@dataclass
class HardwareStatus:
    """Latest hardware status from ESP32 sensors."""
    zone_status: Dict[str, str] = field(default_factory=dict)
    hardware_commands: Dict[str, Any] = field(default_factory=dict)
    trend_prediction: Dict[str, Any] = field(default_factory=dict)
    last_updated: Optional[datetime] = None


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
        zone_status: Dict[str, str],
        hardware_commands: Dict[str, Any],
        trend_prediction: Dict[str, Any],
        timestamp: datetime,
    ) -> None:
        self.hardware_status.zone_status = zone_status
        self.hardware_status.hardware_commands = hardware_commands
        self.hardware_status.trend_prediction = trend_prediction
        self.hardware_status.last_updated = timestamp

    def get_recent_outputs(self, limit: int = 100) -> List[IntelligenceOutput]:
        return list(self.outputs)[-limit:]

    def get_recent_alerts(self, limit: int = 50) -> List[IntelligenceOutput]:
        return list(self.alerts)[-limit:]
