from datetime import datetime
from typing import Iterable, List, Optional, Tuple

from sentinel_ml.decisions.engine import DecisionEngine
from sentinel_ml.density.classifier import CrowdDensityClassifier
from sentinel_ml.features.temporal_model import TemporalCrowdModel
from sentinel_ml.fusion.confidence_fuser import ConfidenceWeightedFuser
from sentinel_ml.inputs.schemas import CameraFrameInput, SensorTelemetryInput
from sentinel_ml.outputs.contracts import IntelligenceOutput
from sentinel_ml.risk.assessor import RiskAssessor
from sentinel_ml.sensors.interpreter import SensorInterpreter
from sentinel_ml.utils.time_utils import coerce_timestamp, now_utc
from sentinel_ml.vision.people_counter import CameraPeopleCounter


class SentinelPipeline:
    """End-to-end SENTINEL intelligence pipeline."""

    def __init__(self) -> None:
        self.camera_counter = CameraPeopleCounter()
        self.sensor_interpreter = SensorInterpreter()
        self.fuser = ConfidenceWeightedFuser()
        self.temporal_model = TemporalCrowdModel()
        self.density_classifier = CrowdDensityClassifier()
        self.risk_assessor = RiskAssessor()
        self.decision_engine = DecisionEngine()

    def _resolve_zone(self, camera_input: Optional[CameraFrameInput], sensor_inputs: Iterable[SensorTelemetryInput]) -> str:
        sensor_zone = next(iter(sensor_inputs)).zone_id if sensor_inputs else None
        camera_zone = camera_input.zone_id if camera_input else None
        zones = {z for z in [sensor_zone, camera_zone] if z}
        if len(zones) == 1:
            return zones.pop()
        if len(zones) == 0:
            return "UNKNOWN_ZONE"
        raise ValueError(f"Zone mismatch between sources: {zones}")

    def _resolve_timestamp(
        self, camera_input: Optional[CameraFrameInput], sensor_inputs: Iterable[SensorTelemetryInput]
    ) -> datetime:
        ts_candidates: List[datetime] = []
        if camera_input:
            ts_candidates.append(coerce_timestamp(camera_input.timestamp))
        for s in sensor_inputs:
            ts_candidates.append(coerce_timestamp(s.timestamp))
        return ts_candidates[0] if ts_candidates else now_utc()

    def process(
        self,
        sensor_inputs: List[SensorTelemetryInput],
        camera_input: Optional[CameraFrameInput] = None,
    ) -> IntelligenceOutput:
        zone_id = self._resolve_zone(camera_input, sensor_inputs)
        timestamp = self._resolve_timestamp(camera_input, sensor_inputs)

        sensor_estimate: Optional[Tuple[float, float]] = None
        if sensor_inputs:
            sensor_estimate = self.sensor_interpreter.interpret(sensor_inputs)

        camera_estimate: Optional[Tuple[float, float]] = None
        if camera_input is not None:
            camera_estimate = self.camera_counter.process(camera_input)

        fused_count, fusion_confidence = self.fuser.fuse(camera_estimate, sensor_estimate)
        temporal_features = self.temporal_model.update(timestamp, fused_count)
        density_label, density_reason = self.density_classifier.classify(fused_count)
        self.temporal_model.notify_density(density_label, timestamp)
        risk_level, risk_reason = self.risk_assessor.assess(density_label, temporal_features)
        decision = self.decision_engine.decide(density_label, risk_level)

        explanation = (
            f"Fusion confidence {fusion_confidence:.2f}. "
            f"Density: {density_reason}. Risk: {risk_reason}. "
            f"Decision: {decision['explanation']}"
        )

        return IntelligenceOutput(
            timestamp=timestamp,
            zone_id=zone_id,
            fused_crowd_count=fused_count,
            crowd_density=density_label,
            risk_level=risk_level,
            fusion_confidence=fusion_confidence,
            alert_status=decision["alert_status"],
            alert_severity=decision["alert_severity"],
            recommended_action=decision["recommended_action"],
            directional_guidance=decision["directional_guidance"],
            explanation_text=explanation,
            camera_people_count=camera_estimate[0] if camera_estimate else None,
            sensor_people_count=sensor_estimate[0] if sensor_estimate else None,
        )
