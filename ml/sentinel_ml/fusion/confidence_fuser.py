from typing import Optional, Tuple


class ConfidenceWeightedFuser:
    """Fuse camera and sensor estimates using confidence-weighted rules."""

    def __init__(self, camera_priority: float = 1.2) -> None:
        self.camera_priority = camera_priority

    def fuse(
        self,
        camera_estimate: Optional[Tuple[float, float]],
        sensor_estimate: Optional[Tuple[float, float]],
    ) -> Tuple[float, float]:
        if camera_estimate is None and sensor_estimate is None:
            return 0.0, 0.0

        cam_count, cam_conf = camera_estimate if camera_estimate else (0.0, 0.0)
        sen_count, sen_conf = sensor_estimate if sensor_estimate else (0.0, 0.0)

        if cam_conf == 0.0 and sen_conf > 0.0:
            return sen_count, sen_conf * 0.9
        if sen_conf == 0.0 and cam_conf > 0.0:
            return cam_count, cam_conf

        cam_weight = cam_conf * self.camera_priority
        sen_weight = sen_conf
        total_weight = cam_weight + sen_weight
        if total_weight == 0.0:
            return 0.0, 0.0

        fused_count = (cam_count * cam_weight + sen_count * sen_weight) / total_weight
        fusion_confidence = min(1.0, total_weight / 2.0)
        return fused_count, fusion_confidence
