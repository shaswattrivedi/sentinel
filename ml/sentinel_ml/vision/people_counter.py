from pathlib import Path
from typing import Optional, Tuple

import cv2
import numpy as np

from sentinel_ml.inputs.schemas import CameraFrameInput
from sentinel_ml.utils.smoothing import ExponentialSmoother, MovingAverageSmoother


class CameraPeopleCounter:
    """Lightweight people counter using OpenCV Haar cascades or MobileNet SSD."""

    def __init__(
        self,
        detection_mode: str = "haar",
        haar_cascade: str = "haarcascade_fullbody.xml",
        smoothing_alpha: float = 0.4,
        average_window: int = 3,
    ) -> None:
        self.detection_mode = detection_mode
        self.smoother = ExponentialSmoother(alpha=smoothing_alpha)
        self.mavg = MovingAverageSmoother(window_size=average_window)
        self.detector = self._load_detector(haar_cascade)

    def _load_detector(self, cascade_name: str):
        if self.detection_mode == "haar":
            cascade_path = Path(cv2.data.haarcascades) / cascade_name
            if not cascade_path.exists():
                raise FileNotFoundError(f"Cascade not found: {cascade_path}")
            return cv2.CascadeClassifier(str(cascade_path))
        raise ValueError(f"Unsupported detection_mode: {self.detection_mode}")

    def _detect(self, frame: np.ndarray) -> Tuple[int, float]:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        detections = self.detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3)
        count = len(detections)
        confidence = min(1.0, count / 5.0) if count > 0 else 0.2
        return count, confidence

    def process(self, camera_input: CameraFrameInput) -> Tuple[int, float]:
        camera_input.validate()
        count, raw_confidence = self._detect(camera_input.frame)
        smoothed_count = self.smoother.update(float(count))
        stabilized = self.mavg.update(smoothed_count)
        confidence = min(1.0, (raw_confidence + 0.3 * stabilized) / 1.3)
        return int(round(stabilized)), confidence
