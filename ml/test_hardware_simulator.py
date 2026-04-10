#!/usr/bin/env python3
"""
Hardware Simulator for SENTINEL super-node architecture.

Scenarios:
1. NORMAL - Low activity in both zones
2. GRADUAL_INCREASE - Both zones gradually increase
3. CRITICAL_ZONE_1 - Zone 1 goes critical
4. CRITICAL_ZONE_2 - Zone 2 goes critical
5. MULTI_ZONE_CRITICAL - Both zones critical
6. WAVE_PATTERN - Oscillating crowd pattern
7. RANDOM - Randomized realistic data
8. CROWD_FLOW - Directional flow from zone-1 to zone-2

Usage:
    python test_hardware_simulator.py
    python test_hardware_simulator.py --scenario=8
    python test_hardware_simulator.py --scenario=7 --duration=60
    python test_hardware_simulator.py --scenario=5 --duration=30 --org-id=SYMBIOSIS
"""

import argparse
import base64
import math
import random
import sys
import time
from datetime import datetime
from typing import Any, Callable, Dict, Optional, Tuple

import cv2
import numpy as np
import requests

ML_SERVICE_URL = "http://localhost:8000"
PREDICT_ENDPOINT = f"{ML_SERVICE_URL}/predict"
DEFAULT_INTERVAL = 2.0
DEFAULT_ORG_ID = "default-org"


def generate_synthetic_frame(people_count: int) -> str:
    """Generate a synthetic 320x240 frame with people count drawn on it."""
    frame = np.zeros((240, 320, 3), dtype=np.uint8)
    frame[:] = (30, 30, 50)
    cv2.putText(frame, "SIMULATED", (80, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (100, 100, 255), 2)
    cv2.putText(frame, f"People: {people_count}", (100, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 100), 2)
    _, buffer = cv2.imencode(".jpg", frame)
    return base64.b64encode(buffer).decode("utf-8")


class SensorSimulator:
    """Simulates two super-node zones and POSTs payloads to /predict."""

    def __init__(self, interval: float = DEFAULT_INTERVAL, org_id: str = DEFAULT_ORG_ID):
        self.interval = interval
        self.iteration = 0
        self.org_id = org_id.strip() or DEFAULT_ORG_ID

    def _send_reading(
        self,
        z1_count: int,
        z2_count: int,
        z1_validation: float,
        z2_validation: float,
    ) -> Dict[str, Any]:
        payload = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "zone-1": {
                "cam_people_count": z1_count,
                "cam_confidence": 0.82,
                "validation_score": z1_validation,
            },
            "zone-2": {
                "cam_people_count": z2_count,
                "cam_confidence": 0.79,
                "validation_score": z2_validation,
            },
            "annotated_frames": {
                "zone-1": generate_synthetic_frame(z1_count),
                "zone-2": generate_synthetic_frame(z2_count),
            },
        }

        try:
            response = requests.post(
                PREDICT_ENDPOINT,
                json=payload,
                headers={"x-organization-id": self.org_id},
                timeout=5,
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ConnectionError:
            print(f"\nERROR: Cannot connect to ML service at {ML_SERVICE_URL}")
            print("Make sure the ML service is running: cd ml && python main.py")
            return {}
        except Exception as e:
            print(f"\nERROR: Error sending data: {e}")
            return {}

    def _print_status(
        self,
        data: Dict[str, Any],
        z1_count: int,
        z2_count: int,
        z1_validation: float,
        z2_validation: float,
    ) -> None:
        if not data:
            return

        risk = data.get("risk_score", 0)
        status = data.get("system_status", "UNKNOWN")
        zones = data.get("zone_status", {})
        trend = data.get("trend_prediction", {})

        status_icon = {"SAFE": "[GREEN]", "MODERATE": "[YELLOW]", "CRITICAL": "[RED]"}.get(status, "[OFF]")

        print(f"\n{'=' * 60}")
        print(f"Time: {datetime.now().strftime('%H:%M:%S')} | Iteration: {self.iteration}")
        print(f"{'=' * 60}")
        print("\nINPUT DATA:")
        print(f"  zone-1 cam_people_count: {z1_count}")
        print(f"  zone-1 validation_score: {z1_validation:.1f}")
        print(f"  zone-2 cam_people_count: {z2_count}")
        print(f"  zone-2 validation_score: {z2_validation:.1f}")

        print("\nRISK ASSESSMENT:")
        print(f"  Risk Score: {risk:.1f}/100 {status_icon} {status}")
        print(f"  zone-1 status: {zones.get('zone-1', 'N/A')}")
        print(f"  zone-2 status: {zones.get('zone-2', 'N/A')}")

        print("\nTREND PREDICTION:")
        print(f"  Trend: {trend.get('trend', 'N/A')}")
        print(f"  Prediction: {trend.get('prediction', 'N/A')}")
        print(f"  Predicted density: {trend.get('predicted_density', 0):.1f}")
        print(f"  Confidence: {trend.get('confidence', 0) * 100:.0f}%")
        print(f"\nREASON: {data.get('reason', 'N/A')}")

    def run_scenario(self, generator: Callable[[], Tuple[int, int, float, float]], duration: int = 30) -> None:
        print(f"\nStarting simulation for {duration} seconds...")
        print(f"Interval: {self.interval}s between readings")
        print("Press Ctrl+C to stop\n")

        end_time = time.time() + duration
        self.iteration = 0

        try:
            while time.time() < end_time:
                self.iteration += 1
                z1_count, z2_count, z1_validation, z2_validation = generator()
                result = self._send_reading(z1_count, z2_count, z1_validation, z2_validation)
                self._print_status(result, z1_count, z2_count, z1_validation, z2_validation)
                time.sleep(self.interval)
        except KeyboardInterrupt:
            print("\nSimulation stopped by user")

    def scenario_normal(self) -> Tuple[int, int, float, float]:
        return (
            random.randint(0, 2),
            random.randint(0, 2),
            random.uniform(8, 25),
            random.uniform(8, 25),
        )

    def scenario_gradual_increase(self) -> Tuple[int, int, float, float]:
        progress = min(self.iteration / 15, 1.0)
        z1_count = int(1 + progress * 10)
        z2_count = int(1 + progress * 8)
        z1_validation = min(100.0, 20.0 + (progress * 70.0) + random.uniform(-4, 4))
        z2_validation = min(100.0, 18.0 + (progress * 65.0) + random.uniform(-4, 4))
        return z1_count, z2_count, z1_validation, z2_validation

    def scenario_critical_zone_1(self) -> Tuple[int, int, float, float]:
        return (
            random.randint(10, 18),
            random.randint(1, 4),
            random.uniform(75, 95),
            random.uniform(15, 35),
        )

    def scenario_critical_zone_2(self) -> Tuple[int, int, float, float]:
        return (
            random.randint(1, 4),
            random.randint(10, 18),
            random.uniform(15, 35),
            random.uniform(75, 95),
        )

    def scenario_multi_critical(self) -> Tuple[int, int, float, float]:
        return (
            random.randint(12, 20),
            random.randint(12, 20),
            random.uniform(80, 100),
            random.uniform(80, 100),
        )

    def scenario_wave(self) -> Tuple[int, int, float, float]:
        t = self.iteration * 0.5
        wave_1 = (math.sin(t) + 1) / 2
        wave_2 = (math.sin(t + 1.2) + 1) / 2

        z1_count = int(2 + (wave_1 * 10))
        z2_count = int(2 + (wave_2 * 10))
        z1_validation = 20.0 + (wave_1 * 70.0) + random.uniform(-3, 3)
        z2_validation = 20.0 + (wave_2 * 70.0) + random.uniform(-3, 3)
        return z1_count, z2_count, max(0.0, min(100.0, z1_validation)), max(0.0, min(100.0, z2_validation))

    def scenario_random(self) -> Tuple[int, int, float, float]:
        return (
            random.randint(0, 20),
            random.randint(0, 20),
            random.uniform(0, 100),
            random.uniform(0, 100),
        )

    def scenario_crowd_flow(self) -> Tuple[int, int, float, float]:
        t = self.iteration % 40

        z1_count = 1
        z2_count = 1
        z1_validation = 10.0
        z2_validation = 10.0

        if 0 <= t < 18:
            z1_count = int(1 + math.sin((t / 18.0) * math.pi) * 16)
            z1_validation = 15.0 + math.sin((t / 18.0) * math.pi) * 75.0

        if 8 <= t < 30:
            z2_count = int(1 + math.sin(((t - 8) / 22.0) * math.pi) * 16)
            z2_validation = 15.0 + math.sin(((t - 8) / 22.0) * math.pi) * 75.0

        return (
            max(0, z1_count + random.randint(-1, 1)),
            max(0, z2_count + random.randint(-1, 1)),
            max(0.0, min(100.0, z1_validation + random.uniform(-3, 3))),
            max(0.0, min(100.0, z2_validation + random.uniform(-3, 3))),
        )


def interactive_menu() -> Tuple[Optional[int], int]:
    print("\n" + "=" * 60)
    print("SENTINEL HARDWARE SIMULATOR")
    print("=" * 60)
    print("\nSelect a test scenario:\n")
    print("  1. NORMAL             - Low activity in both zones")
    print("  2. GRADUAL_INCREASE   - Gradually increasing crowd")
    print("  3. CRITICAL_ZONE_1    - Zone 1 goes critical")
    print("  4. CRITICAL_ZONE_2    - Zone 2 goes critical")
    print("  5. MULTI_CRITICAL     - Both zones critical")
    print("  6. WAVE_PATTERN       - Oscillating crowd pattern")
    print("  7. RANDOM             - Randomized realistic data")
    print("  8. CROWD_FLOW         - Simulate crowd moving zone-1 -> zone-2")
    print("  0. EXIT\n")

    while True:
        try:
            choice = input("Enter scenario number (0-8): ").strip()
            if choice == "0":
                return None, 0
            num = int(choice)
            if 1 <= num <= 8:
                duration = input("Duration in seconds [30]: ").strip()
                duration = int(duration) if duration else 30
                return num, duration
            print("Please enter a number between 0 and 8")
        except ValueError:
            print("Please enter a valid number")
        except KeyboardInterrupt:
            return None, 0


def main() -> None:
    parser = argparse.ArgumentParser(description="SENTINEL Hardware Simulator")
    parser.add_argument("--scenario", type=int, help="Scenario number (1-8)")
    parser.add_argument("--duration", type=int, default=30, help="Duration in seconds")
    parser.add_argument("--interval", type=float, default=2.0, help="Interval between readings")
    parser.add_argument("--org-id", type=str, default=DEFAULT_ORG_ID, help="Target organization ID")
    args = parser.parse_args()

    simulator = SensorSimulator(interval=args.interval, org_id=args.org_id)

    scenarios = {
        1: ("NORMAL", simulator.scenario_normal),
        2: ("GRADUAL_INCREASE", simulator.scenario_gradual_increase),
        3: ("CRITICAL_ZONE_1", simulator.scenario_critical_zone_1),
        4: ("CRITICAL_ZONE_2", simulator.scenario_critical_zone_2),
        5: ("MULTI_CRITICAL", simulator.scenario_multi_critical),
        6: ("WAVE_PATTERN", simulator.scenario_wave),
        7: ("RANDOM", simulator.scenario_random),
        8: ("CROWD_FLOW", simulator.scenario_crowd_flow),
    }

    if args.scenario:
        if args.scenario not in scenarios:
            print(f"ERROR: Invalid scenario: {args.scenario}")
            sys.exit(1)
        name, generator = scenarios[args.scenario]
        print(f"\nRunning scenario: {name}")
        simulator.run_scenario(generator, args.duration)
        return

    while True:
        choice, duration = interactive_menu()
        if choice is None:
            print("\nGoodbye!")
            break
        name, generator = scenarios[choice]
        print(f"\nRunning scenario: {name}")
        simulator.run_scenario(generator, duration)


if __name__ == "__main__":
    main()
