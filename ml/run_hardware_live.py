import base64
import os
import re
import time
from urllib.parse import urlparse

import cv2
import numpy as np
import requests
from ultralytics import YOLO

# Hardware stream URLs
ZONE_STREAM_URLS = {
    "zone-1": "http://10.191.109.209:81/stream",
    "zone-2": "http://10.191.109.26:81/stream",
}

# Dedicated sensor endpoints/IPs (separate from camera ESP32-CAM hosts)
ZONE_SENSOR_ENDPOINTS = {
    "zone-1": "10.191.109.43",
    "zone-2": "10.191.109.130",
}

ML_SERVICE_URL = "http://localhost:8000/predict"
model = YOLO("yolov8n.pt")


def _extract_float(text: str) -> float | None:
    """Extract the first float-like token from text (for plain-text score endpoints)."""
    match = re.search(r"[-+]?\d*\.?\d+", text)
    if not match:
        return None
    try:
        return float(match.group(0))
    except ValueError:
        return None


def _base_url_from_stream(stream_url: str) -> str:
    parsed = urlparse(stream_url)
    return f"{parsed.scheme}://{parsed.netloc}"


def _score_candidate_urls(sensor_endpoint: str) -> list[str]:
    """Build candidate /score URLs from sensor IP/base URL."""
    endpoint = (sensor_endpoint or "").strip()
    if not endpoint:
        return []

    if not endpoint.startswith("http://") and not endpoint.startswith("https://"):
        endpoint = f"http://{endpoint}"

    parsed = urlparse(endpoint)
    if not parsed.scheme or not parsed.netloc:
        return []

    base = f"{parsed.scheme}://{parsed.netloc}"
    path = (parsed.path or "").rstrip("/")

    candidates: list[str] = []
    if path and path != "/":
        candidates.append(f"{base}{path}")
    candidates.append(f"{base}/score")
    return list(dict.fromkeys(candidates))


def grab_frame(stream_url: str) -> np.ndarray | None:
    """Pull one JPEG frame from the ESP32-CAM MJPEG stream."""
    try:
        stream = requests.get(stream_url, stream=True, timeout=3)
        bytes_buf = b""
        for chunk in stream.iter_content(chunk_size=1024):
            bytes_buf += chunk
            a = bytes_buf.find(b"\xff\xd8")
            b = bytes_buf.find(b"\xff\xd9")
            if a != -1 and b != -1:
                jpg = bytes_buf[a : b + 2]
                bytes_buf = bytes_buf[b + 2 :]
                frame = cv2.imdecode(np.frombuffer(jpg, np.uint8), cv2.IMREAD_COLOR)
                return frame
    except Exception as e:
        print(f"[{stream_url}] Frame grab error: {e}")
    return None


def get_validation_score(sensor_endpoint: str, zone_id: str) -> float:
    """Pull sensor validation score from dedicated sensor endpoint; supports JSON or plain-text responses."""
    candidate_urls = _score_candidate_urls(sensor_endpoint)
    if not candidate_urls:
        print(f"[{zone_id}] Score fetch warning: sensor endpoint not configured; defaulting to 0.0")
        return 0.0

    last_error = "unknown"
    for score_url in dict.fromkeys(candidate_urls):
        try:
            r = requests.get(score_url, timeout=2)
            if not r.ok:
                last_error = f"HTTP {r.status_code}"
                continue

            content_type = (r.headers.get("content-type") or "").lower()
            if "application/json" in content_type:
                data = r.json()
                if isinstance(data, dict):
                    if "validation_score" in data:
                        return float(data["validation_score"])
                    if "score" in data:
                        return float(data["score"])

            text_value = (r.text or "").strip()
            parsed_score = _extract_float(text_value)
            if parsed_score is not None:
                return parsed_score

            last_error = "no numeric score in response"
        except Exception as e:
            last_error = str(e)

    print(f"[{zone_id}] Score fetch warning ({candidate_urls[0]}): {last_error}; defaulting to 0.0")
    return 0.0


def count_and_annotate(frame: np.ndarray) -> tuple[int, float, str]:
    """Run YOLO on frame. Returns (count, confidence, annotated_b64)."""
    results = model(frame, classes=[0], verbose=False)
    boxes = results[0].boxes
    count = len(boxes)
    conf = float(boxes.conf.mean().item()) if count > 0 else 0.75
    # Keep bounding boxes but hide class/confidence text like "person 0.46".
    annotated = results[0].plot(labels=False, conf=False)
    _, buf = cv2.imencode(".jpg", annotated)
    b64 = base64.b64encode(buf).decode("utf-8")
    return count, conf, b64


def run_loop() -> None:
    ml_service_url = os.getenv("ML_SERVICE_URL", ML_SERVICE_URL)
    print("[SENTINEL] Starting hardware live loop...")
    print(f"[SENTINEL] ML endpoint: {ml_service_url}")
    while True:
        payload = {"timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")}
        annotated_frames = {}

        for zone_id, stream_url in ZONE_STREAM_URLS.items():
            sensor_endpoint = ZONE_SENSOR_ENDPOINTS.get(zone_id, "")
            frame = _frame(stream_url)
            validation_score = get_validation_score(sensor_endpoint, zone_id)

            if frame is not None:
                count, conf, b64 = count_and_annotate(frame)
                annotated_frames[zone_id] = b64
                if validation_score <= 0.0:
                    # Fallback when hardware /score endpoint is unavailable.
                    validation_score = round(max(0.0, min(100.0, conf * 100.0)), 2)
            else:
                count, conf = 0, 0.0
                annotated_frames[zone_id] = None

            payload[zone_id] = {
                "cam_people_count": count,
                "cam_confidence": conf,
                "validation_score": validation_score,
            }

        payload["annotated_frames"] = annotated_frames

        try:
            r = requests.post(ml_service_url, json=payload, timeout=3)
            system_status = "unknown"
            try:
                body = r.json()
                if isinstance(body, dict):
                    system_status = str(body.get("system_status", "unknown"))
            except ValueError:
                pass
            print(f"[ML] Response: {r.status_code} {system_status}")
        except requests.exceptions.ConnectionError:
            print(
                f"[ML] Post error: cannot connect to {ml_service_url}. "
                "Start ML API with: cd ml && source venv/bin/activate && python main.py"
            )
        except Exception as e:
            print(f"[ML] Post error: {e}")

        time.sleep(1.5)


if __name__ == "__main__":
    run_loop()