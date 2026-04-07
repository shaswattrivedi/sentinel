import base64
from pathlib import Path
from typing import Optional, Tuple

import cv2
import numpy as np
from ultralytics import YOLO

from sentinel_ml.inputs.schemas import CameraFrameInput


class CameraPeopleCounter:
    """YOLOv8-backed people counter for camera frames."""

    def __init__(self) -> None:
        # Keep model weights in the vision module, independent of process CWD.
        models_dir = Path(__file__).resolve().parent / "models"
        models_dir.mkdir(parents=True, exist_ok=True)
        self.model_path = models_dir / "yolov8n.pt"
        self.model = YOLO(str(self.model_path))
        self.model.overrides["verbose"] = False

    def _infer(self, frame: np.ndarray):
        return self.model(frame, classes=[0], verbose=False)  # class 0 = person

    def count_from_base64(self, b64_frame: str) -> Tuple[int, float]:
        """
        Takes a base64-encoded JPEG frame.
        Returns (people_count, confidence).
        """
        try:
            img_bytes = base64.b64decode(b64_frame)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if frame is None:
                return 0, 0.0
            results = self._infer(frame)
            boxes = results[0].boxes
            count = len(boxes)
            confidence = float(boxes.conf.mean().item()) if count > 0 else 0.75
            return count, confidence
        except Exception as e:
            print(f"[YOLO] Inference error: {e}")
            return 0, 0.0

    def count_and_annotate(self, b64_frame: str) -> Tuple[int, float, Optional[str]]:
        """
        Same as count_from_base64 but also returns an annotated frame as base64.
        Used for live dashboard camera feed display.
        """
        try:
            img_bytes = base64.b64decode(b64_frame)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if frame is None:
                return 0, 0.0, None
            results = self._infer(frame)
            boxes = results[0].boxes
            count = len(boxes)
            confidence = float(boxes.conf.mean().item()) if count > 0 else 0.75
            annotated_frame = results[0].plot()
            _, buffer = cv2.imencode(".jpg", annotated_frame)
            annotated_b64 = base64.b64encode(buffer).decode("utf-8")
            return count, confidence, annotated_b64
        except Exception as e:
            print(f"[YOLO] Annotation error: {e}")
            return 0, 0.0, None

    def process(self, camera_input: CameraFrameInput) -> Tuple[int, float]:
        """Compatibility path used by the legacy fused pipeline."""
        camera_input.validate()
        try:
            results = self._infer(camera_input.frame)
            boxes = results[0].boxes
            count = len(boxes)
            confidence = float(boxes.conf.mean().item()) if count > 0 else 0.75
            return count, confidence
        except Exception as e:
            print(f"[YOLO] Process error: {e}")
            return 0, 0.0
