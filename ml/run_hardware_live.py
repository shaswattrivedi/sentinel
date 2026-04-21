import base64
import json
import os
import re
import time
from urllib.parse import urlparse

import cv2
import numpy as np
import requests
from dotenv import load_dotenv
from ultralytics import YOLO

load_dotenv()

# Fallback defaults if env variables are not present.
DEFAULT_ZONE_STREAM_URLS = {
    "zone-1": "http://10.191.109.209:81/stream",
    "zone-2": "http://10.191.109.26:81/stream",
}

# Dedicated sensor endpoints/IPs (separate from camera ESP32-CAM hosts)
DEFAULT_ZONE_SENSOR_ENDPOINTS = {
    "zone-1": "10.191.109.43",
    "zone-2": "10.191.109.130",
}

DEFAULT_ML_SERVICE_URL = "http://localhost:8000/predict"
model = YOLO("yolov8n.pt")


def _parse_zone_mapping(raw_value: str | None, fallback: dict[str, str], var_name: str) -> dict[str, str]:
    """
    Parse zone mapping from env in either of these formats:
    - CSV key/value pairs: zone-1=http://...,zone-2=http://...
    - JSON object: {"zone-1": "http://...", "zone-2": "http://..."}
    """
    if raw_value is None or not raw_value.strip():
        return dict(fallback)

    raw = raw_value.strip()

    if raw.startswith("{"):
        try:
            decoded = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ValueError(f"{var_name} has invalid JSON format") from exc

        if not isinstance(decoded, dict):
            raise ValueError(f"{var_name} JSON value must be an object")

        parsed = {str(k).strip(): str(v).strip() for k, v in decoded.items()}
        parsed = {k: v for k, v in parsed.items() if k and v}
        if not parsed:
            raise ValueError(f"{var_name} JSON object is empty")
        return parsed

    parsed: dict[str, str] = {}
    for item in raw.split(","):
        pair = item.strip()
        if not pair:
            continue
        if "=" not in pair:
            raise ValueError(
                f"{var_name} must use 'zone=value' pairs separated by commas. Invalid item: '{pair}'"
            )
        zone_id, value = pair.split("=", 1)
        zone_id = zone_id.strip()
        value = value.strip()
        if not zone_id or not value:
            raise ValueError(f"{var_name} contains an empty zone or value in '{pair}'")
        parsed[zone_id] = value

    if not parsed:
        raise ValueError(f"{var_name} did not contain any valid zone mappings")

    return parsed


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
    """Pull one JPEG frame with a strict anti-hang timeout."""
    start_time = time.time()
    try:
        # timeout=(1.5, 1.5) sets a 1.5s limit on BOTH connection and reading data
        stream = requests.get(stream_url, stream=True, timeout=(1.5, 1.5))
        bytes_buf = b""
        
        for chunk in stream.iter_content(chunk_size=2048):
            # THE KILL SWITCH: If fetching this frame takes more than 1.5 seconds, abort instantly!
            if time.time() - start_time > 1.5:
                stream.close()
                return None
                
            bytes_buf += chunk
            a = bytes_buf.find(b"\xff\xd8")
            b = bytes_buf.find(b"\xff\xd9")
            
            if a != -1 and b != -1:
                jpg = bytes_buf[a : b + 2]
                frame = cv2.imdecode(np.frombuffer(jpg, np.uint8), cv2.IMREAD_COLOR)
                stream.close() # Cleanly close the connection
                return frame
                
    except Exception:
        # Silently fail so the main loop can immediately trigger the fallback cache
        pass
        
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
    zone_stream_urls = _parse_zone_mapping(
        os.getenv("ZONE_STREAM_URLS"),
        DEFAULT_ZONE_STREAM_URLS,
        "ZONE_STREAM_URLS",
    )
    zone_sensor_endpoints = _parse_zone_mapping(
        os.getenv("ZONE_SENSOR_ENDPOINTS"),
        DEFAULT_ZONE_SENSOR_ENDPOINTS,
        "ZONE_SENSOR_ENDPOINTS",
    )
    ml_service_url = os.getenv("ML_SERVICE_URL", DEFAULT_ML_SERVICE_URL)
    target_org_id = (os.getenv("HARDWARE_TARGET_ORG_ID") or "").strip()
    request_headers = {"x-organization-id": target_org_id} if target_org_id else {}

    print("[SENTINEL] Starting hardware live loop...")
    print(f"[SENTINEL] ML endpoint: {ml_service_url}")
    print(f"[SENTINEL] Zone streams: {zone_stream_urls}")
    print(f"[SENTINEL] Zone sensors: {zone_sensor_endpoints}")
    if target_org_id:
        print(f"[SENTINEL] Target organization: {target_org_id}")
    else:
        print("[SENTINEL] Target organization: default-org (set HARDWARE_TARGET_ORG_ID to override)")

    # --- NEW: State trackers for hotspot network bypass ---
    zone_ids = list(zone_stream_urls.keys())
    last_known_frames = {zone_id: None for zone_id in zone_ids}
    last_known_counts = {zone_id: 0 for zone_id in zone_ids}
    last_known_confs = {zone_id: 0.0 for zone_id in zone_ids}

    while True:
        payload = {"timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
        annotated_frames = {}

        for zone_id, stream_url in zone_stream_urls.items():
            sensor_endpoint = zone_sensor_endpoints.get(zone_id, "")
            frame = grab_frame(stream_url)
            validation_score = get_validation_score(sensor_endpoint, zone_id)

            if frame is not None:
                # SUCCESS: Process frame and update the cache
                count, conf, b64 = count_and_annotate(frame)

                last_known_frames[zone_id] = b64
                last_known_counts[zone_id] = count
                last_known_confs[zone_id] = conf

                annotated_frames[zone_id] = b64
            else:
                # NETWORK DROP DETECTED: Fallback to the last known good data
                annotated_frames[zone_id] = last_known_frames.get(zone_id)
                count = last_known_counts.get(zone_id, 0)
                conf = last_known_confs.get(zone_id, 0.0)

            # Calculate validation score regardless of frame drop
            if validation_score <= 0.0:
                # Fallback when hardware /score endpoint is unavailable.
                validation_score = round(max(0.0, min(100.0, conf * 100.0)), 2)

            payload[zone_id] = {
                "cam_people_count": count,
                "cam_confidence": conf,
                "validation_score": validation_score,
            }

        payload["annotated_frames"] = annotated_frames

        try:
            r = requests.post(ml_service_url, json=payload, timeout=3, headers=request_headers)
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
                "Start ML API with: cd ml && source .venv/bin/activate && python main.py"
            )
        except Exception as e:
            print(f"[ML] Post error: {e}")

        time.sleep(1.5)


if __name__ == "__main__":
    run_loop()