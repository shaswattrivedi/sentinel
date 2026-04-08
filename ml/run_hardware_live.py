import base64
import time

import cv2
import numpy as np
import requests
from ultralytics import YOLO

# Hardware IPs - filled in after flashing
ZONE_IPS = {
    "zone-1": "192.168.X.X",  # placeholder, team fills in after flashing
    "zone-2": "192.168.X.X",  # placeholder
}
ML_SERVICE_URL = "http://localhost:8000/predict"
model = YOLO("yolov8n.pt")


def grab_frame(ip: str) -> np.ndarray | None:
    """Pull one JPEG frame from the ESP32-CAM MJPEG stream."""
    try:
        stream = requests.get(f"http://{ip}:81/stream", stream=True, timeout=3)
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
        print(f"[{ip}] Frame grab error: {e}")
    return None


def get_validation_score(ip: str, zone_id: str) -> float:
    """Pull sensor validation score from ESP32."""
    try:
        r = requests.get(f"http://{ip}/score", timeout=2)
        data = r.json()
        return float(data.get("validation_score", 0))
    except Exception as e:
        print(f"[{ip}] Score fetch error: {e}")
    return 0.0


def count_and_annotate(frame: np.ndarray) -> tuple[int, float, str]:
    """Run YOLO on frame. Returns (count, confidence, annotated_b64)."""
    results = model(frame, classes=[0], verbose=False)
    boxes = results[0].boxes
    count = len(boxes)
    conf = float(boxes.conf.mean().item()) if count > 0 else 0.75
    annotated = results[0].plot()
    _, buf = cv2.imencode(".jpg", annotated)
    b64 = base64.b64encode(buf).decode("utf-8")
    return count, conf, b64


def run_loop() -> None:
    print("[SENTINEL] Starting hardware live loop...")
    while True:
        payload = {"timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")}
        annotated_frames = {}

        for zone_id, ip in ZONE_IPS.items():
            frame = grab_frame(ip)
            validation_score = get_validation_score(ip, zone_id)

            if frame is not None:
                count, conf, b64 = count_and_annotate(frame)
                annotated_frames[zone_id] = b64
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
            r = requests.post(ML_SERVICE_URL, json=payload, timeout=3)
            print(f"[ML] Response: {r.status_code} {r.json().get('system_status')}")
        except Exception as e:
            print(f"[ML] Post error: {e}")

        time.sleep(1.5)


if __name__ == "__main__":
    run_loop()