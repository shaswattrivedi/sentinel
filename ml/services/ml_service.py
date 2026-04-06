import base64
from typing import Dict, List, Optional

import cv2
import numpy as np

from api.schemas.input import CameraFramePayload, PredictRequest, SensorTelemetryPayload
from sentinel_ml.inputs.schemas import CameraFrameInput, SensorHealthStatus, SensorTelemetryInput
from sentinel_ml.iot.engine import CRITICAL, MODERATE, SAFE, IoTRiskEngine
from sentinel_ml.outputs.contracts import IntelligenceOutput
from sentinel_ml.pipeline import SentinelPipeline


class MLService:
    """Thin wrapper that feeds validated telemetry into legacy and IoT-native pipelines."""

    def __init__(self) -> None:
        self.pipeline = SentinelPipeline()
        self.iot_engine = IoTRiskEngine()

    def _decode_frame(self, frame_b64: str) -> np.ndarray:
        buffer = base64.b64decode(frame_b64)
        arr = np.frombuffer(buffer, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Could not decode camera frame")
        return frame

    def run(
        self,
        sensor_payloads: List[SensorTelemetryPayload],
        camera_payload: Optional[CameraFramePayload] = None,
    ):
        sensor_inputs = [
            SensorTelemetryInput(
                timestamp=s.timestamp,
                zone_id=s.zone_id,
                pir_motion_detected=s.pir_motion_detected,
                ultrasonic_distance_cm=s.ultrasonic_distance_cm,
                sensor_estimated_count=s.sensor_estimated_count,
                sensor_health_status=SensorHealthStatus(s.sensor_health_status.upper()),
            )
            for s in sensor_payloads
        ]

        camera_input = None
        if camera_payload is not None:
            frame = self._decode_frame(camera_payload.frame_b64)
            camera_input = CameraFrameInput(
                timestamp=camera_payload.timestamp,
                zone_id=camera_payload.zone_id,
                frame=frame,
            )

        return self.pipeline.process(sensor_inputs=sensor_inputs, camera_input=camera_input)

    @staticmethod
    def _to_legacy_risk_level(system_status: str) -> str:
        if system_status == CRITICAL:
            return "HIGH"
        if system_status == MODERATE:
            return "MEDIUM"
        return "LOW"

    @staticmethod
    def _to_density_label(avg_density: float) -> str:
        if avg_density > 75:
            return "HIGH"
        if avg_density > 40:
            return "MEDIUM"
        return "LOW"

    @staticmethod
    def _decision_from_status(system_status: str) -> Dict[str, object]:
        if system_status == CRITICAL:
            return {
                "alert_status": True,
                "alert_severity": "CRITICAL",
                "recommended_action": "Initiate emergency crowd control and route flow away from congested zones.",
                "directional_guidance": "Open relief corridors and restrict inflow to impacted zones.",
            }
        if system_status == MODERATE:
            return {
                "alert_status": True,
                "alert_severity": "ELEVATED",
                "recommended_action": "Issue crowding advisory and rebalance movement between zones.",
                "directional_guidance": "Slow inflow and guide occupants toward lower-density areas.",
            }
        return {
            "alert_status": False,
            "alert_severity": "NORMAL",
            "recommended_action": "Monitor conditions. No intervention required.",
            "directional_guidance": "Maintain normal guidance signage.",
        }

    def run_iot_predict(self, payload: PredictRequest) -> Dict[str, object]:
        """Run the hardware-native IoT risk model (Z1 camera + Z2/Z3 density sensors)."""
        return self.iot_engine.predict(
            z1_cam_count=payload.z1_cam_count,
            z2_density_score=payload.z2_density_score,
            z3_density_score=payload.z3_density_score,
            timestamp=payload.timestamp,
        )

    def iot_result_to_intelligence_output(self, payload: PredictRequest, result: Dict[str, object]) -> IntelligenceOutput:
        """Bridge IoT-native result into dashboard's historical output contract."""
        features = result["features"]
        avg_density = float(features["avg_density"])
        system_status = str(result["system_status"])
        decision = self._decision_from_status(system_status)

        return IntelligenceOutput(
            timestamp=payload.timestamp,
            zone_id="MULTI_ZONE",
            fused_crowd_count=avg_density,
            crowd_density=self._to_density_label(avg_density),
            risk_level=self._to_legacy_risk_level(system_status),
            fusion_confidence=1.0,
            alert_status=bool(decision["alert_status"]),
            alert_severity=str(decision["alert_severity"]),
            recommended_action=str(decision["recommended_action"]),
            directional_guidance=str(decision["directional_guidance"]),
            explanation_text=str(result["reason"]),
            camera_people_count=float(payload.z1_cam_count),
            sensor_people_count=avg_density,
        )
