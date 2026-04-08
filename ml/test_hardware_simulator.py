#!/usr/bin/env python3
"""
Hardware Simulator for SENTINEL Dashboard Testing

This script simulates ESP32 sensor data and sends it to the ML service,
allowing you to visualize real-time dashboard behavior without physical hardware.

Scenarios:
1. NORMAL - Low density, all zones safe
2. GRADUAL_INCREASE - Slowly increasing crowd
3. CRITICAL_Z2 - Zone 2 goes critical
4. CRITICAL_Z3 - Zone 3 goes critical  
5. MULTI_ZONE_CRITICAL - Both zones critical
6. WAVE_PATTERN - Oscillating crowd density
7. RANDOM - Randomized realistic data
8. CROWD_FLOW - Simulate crowd moving Z1->Z2->Z3

Usage:
    python test_hardware_simulator.py                    # Interactive mode
    python test_hardware_simulator.py --scenario=8       # Run specific scenario
    python test_hardware_simulator.py --scenario=7 --duration=60  # Random for 60s
"""

import argparse
import base64
import math
import random
import sys
import time
from datetime import datetime, timezone
from typing import Callable, Dict, Any

import cv2
import numpy as np
import requests

# Configuration
ML_SERVICE_URL = "http://localhost:8000"
PREDICT_ENDPOINT = f"{ML_SERVICE_URL}/predict"
CAMERA_TELEMETRY_ENDPOINT = f"{ML_SERVICE_URL}/api/v1/telemetry/camera"
DEFAULT_INTERVAL = 2.0  # seconds between readings


def generate_synthetic_frame(people_count: int) -> str:
    """Generate a synthetic 320x240 frame with people count drawn on it."""
    frame = np.zeros((240, 320, 3), dtype=np.uint8)
    frame[:] = (30, 30, 50)  # dark background
    cv2.putText(frame, "SIMULATED", (80, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (100, 100, 255), 2)
    cv2.putText(frame, f"People: {people_count}", (100, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 100), 2)
    _, buffer = cv2.imencode(".jpg", frame)
    return base64.b64encode(buffer).decode("utf-8")


class SensorSimulator:
    """Simulates ESP32 sensor readings for testing."""

    def __init__(self, interval: float = DEFAULT_INTERVAL):
        self.interval = interval
        self.iteration = 0
        self.start_time = time.time()

    def _send_reading(self, z1_cam: int, z2_density: float, z3_density: float) -> Dict[str, Any]:
        """Send simulated reading to ML service."""
        timestamp = datetime.now(timezone.utc).isoformat()
        payload = {
            "z1_cam_count": z1_cam,
            "z2_density_score": z2_density,
            "z3_density_score": z3_density,
            "timestamp": timestamp,
        }

        try:
            response = requests.post(PREDICT_ENDPOINT, json=payload, timeout=5)
            response.raise_for_status()
            self._send_camera_telemetry(z1_cam, timestamp)
            return response.json()
        except requests.exceptions.ConnectionError:
            print(f"\nERROR: Cannot connect to ML service at {ML_SERVICE_URL}")
            print("   Make sure the ML service is running: cd ml && python main.py")
            return {}
        except Exception as e:
            print(f"\nERROR: Error sending data: {e}")
            return {}

    def _send_camera_telemetry(self, people_count: int, timestamp: str) -> None:
        """Send a synthetic frame to exercise the camera telemetry path."""
        synthetic_frame = generate_synthetic_frame(people_count)
        try:
            response = requests.post(
                CAMERA_TELEMETRY_ENDPOINT,
                json={
                    "frame": synthetic_frame,
                    "zone_id": "zone-1",
                    "timestamp": timestamp,
                },
                timeout=5,
            )
            response.raise_for_status()
        except Exception as e:
            print(f"WARNING: Camera telemetry post failed: {e}")

    def _print_status(self, data: Dict[str, Any], z1: int, z2: float, z3: float):
        """Pretty print the current status."""
        if not data:
            return

        risk = data.get("risk_score", 0)
        status = data.get("system_status", "UNKNOWN")
        zones = data.get("zone_status", {})
        hw = data.get("hardware_commands", {})
        trend = data.get("trend_prediction", {})

        # Status colors
        status_icon = {"SAFE": "[GREEN]", "MODERATE": "[YELLOW]", "CRITICAL": "[RED]"}.get(status, "[OFF]")
        led_icon = {"green": "[GREEN]", "yellow": "[YELLOW]", "red": "[RED]"}.get

        print(f"\n{'='*60}")
        print(f"⏱️  Time: {datetime.now().strftime('%H:%M:%S')} | Iteration: {self.iteration}")
        print(f"{'='*60}")
        print(f"\n INPUT DATA:")
        print(f"   Zone 1 (Camera):     {z1} people")
        print(f"   Zone 2 (PIR+Ultra):  {z2:.1f}% density")
        print(f"   Zone 3 (PIR+Ultra):  {z3:.1f}% density")
        print(f"\n RISK ASSESSMENT:")
        print(f"   Risk Score:    {risk:.1f}/100 {status_icon} {status}")
        print(f"   Zone 1 Status: {zones.get('z1', 'N/A')}")
        print(f"   Zone 2 Status: {zones.get('z2', 'N/A')}")
        print(f"   Zone 3 Status: {zones.get('z3', 'N/A')}")
        print(f"\n HARDWARE COMMANDS:")
        print(f"   Zone 2 LED:    {led_icon(hw.get('z2_led', ''), '[OFF]')} {hw.get('z2_led', 'N/A')}")
        print(f"   Zone 3 LED:    {led_icon(hw.get('z3_led', ''), '[OFF]')} {hw.get('z3_led', 'N/A')}")
        print(f"   Zone 2 Buzzer: {'ON ON' if hw.get('z2_buzzer') else 'OFF OFF'}")
        print(f"   Zone 3 Buzzer: {'ON ON' if hw.get('z3_buzzer') else 'OFF OFF'}")
        print(f"\n TREND PREDICTION:")
        print(f"   Trend:      {trend.get('trend', 'N/A')}")
        print(f"   Prediction: {trend.get('prediction', 'N/A')}")
        print(f"   Predicted:  {trend.get('predicted_density', 0):.1f}%")
        print(f"   Confidence: {trend.get('confidence', 0)*100:.0f}%")
        print(f"\n REASON: {data.get('reason', 'N/A')}")

    def run_scenario(self, generator: Callable[[], tuple], duration: int = 30):
        """Run a scenario using the provided data generator."""
        print(f"\n Starting simulation for {duration} seconds...")
        print(f"   Interval: {self.interval}s between readings")
        print(f"   Press Ctrl+C to stop\n")

        end_time = time.time() + duration
        self.iteration = 0

        try:
            while time.time() < end_time:
                self.iteration += 1
                z1, z2, z3 = generator()
                result = self._send_reading(z1, z2, z3)
                self._print_status(result, z1, z2, z3)
                time.sleep(self.interval)
        except KeyboardInterrupt:
            print("\n\n⏹️  Simulation stopped by user")

    # ─────────────────────────────────────────────────────────────
    # SCENARIO GENERATORS
    # ─────────────────────────────────────────────────────────────

    def scenario_normal(self) -> tuple:
        """Scenario 1: Normal conditions - all zones safe."""
        return (
            random.randint(0, 2),         # z1_cam
            random.uniform(10, 30),       # z2_density
            random.uniform(10, 30),       # z3_density
        )

    def scenario_gradual_increase(self) -> tuple:
        """Scenario 2: Gradually increasing crowd density."""
        progress = min(self.iteration / 15, 1.0)  # Full in 15 iterations
        base_z2 = 20 + (progress * 70)  # 20 -> 90
        base_z3 = 15 + (progress * 60)  # 15 -> 75
        return (
            int(1 + progress * 6),                      # z1_cam: 1 -> 7
            min(100, base_z2 + random.uniform(-5, 5)),  # z2
            min(100, base_z3 + random.uniform(-5, 5)),  # z3
        )

    def scenario_critical_z2(self) -> tuple:
        """Scenario 3: Zone 2 goes critical while Zone 3 stays normal."""
        return (
            random.randint(2, 4),          # z1_cam
            random.uniform(75, 95),        # z2 critical
            random.uniform(20, 35),        # z3 safe
        )

    def scenario_critical_z3(self) -> tuple:
        """Scenario 4: Zone 3 goes critical while Zone 2 stays normal."""
        return (
            random.randint(2, 4),          # z1_cam
            random.uniform(20, 35),        # z2 safe
            random.uniform(75, 95),        # z3 critical
        )

    def scenario_multi_critical(self) -> tuple:
        """Scenario 5: Both zones go critical - emergency."""
        return (
            random.randint(6, 10),         # z1_cam high
            random.uniform(80, 100),       # z2 critical
            random.uniform(80, 100),       # z3 critical
        )

    def scenario_wave(self) -> tuple:
        """Scenario 6: Wave pattern - oscillating density."""
        t = self.iteration * 0.5
        wave = (math.sin(t) + 1) / 2  # 0 to 1
        z2_base = 30 + wave * 50      # 30 to 80
        z3_base = 40 + math.sin(t + 1) * 25  # 15 to 65
        return (
            int(2 + wave * 4),
            z2_base + random.uniform(-5, 5),
            z3_base + random.uniform(-5, 5),
        )

    def scenario_random(self) -> tuple:
        """Scenario 7: Random realistic data."""
        return (
            random.randint(0, 8),
            random.uniform(0, 100),
            random.uniform(0, 100),
        )

    def scenario_crowd_flow(self) -> tuple:
        """Scenario 8: Crowd Flow - Directional movement from Zone 1 to Zone 3."""
        # Simulated directional flow where a crowd enters Z1 -> Z2 -> Z3 -> Exits
        t = self.iteration % 40  # 40 iterations per cycle
        
        # Base ambient
        z1 = 1
        z2 = 10.0
        z3 = 10.0
        
        # Zone 1 (Camera) spikes first as people enter
        if 0 <= t < 15:
            z1 = int(1 + math.sin((t / 15.0) * math.pi) * 15)
        
        # Zone 2 (Density) receives them delayed
        if 5 <= t < 25:
            z2 = 10.0 + math.sin(((t - 5) / 20.0) * math.pi) * 75.0
            
        # Zone 3 (Density) receives them last before they exit
        if 15 <= t < 35:
            z3 = 10.0 + math.sin(((t - 15) / 20.0) * math.pi) * 80.0
            
        return (
            max(0, z1 + random.randint(-1, 1)),
            max(0.0, min(100.0, z2 + random.uniform(-3, 3))),
            max(0.0, min(100.0, z3 + random.uniform(-3, 3))),
        )


def interactive_menu():
    """Display interactive scenario selection menu."""
    print("\n" + "="*60)
    print(" SENTINEL HARDWARE SIMULATOR")
    print("="*60)
    print("\nSelect a test scenario:\n")
    print("  1. NORMAL          - Low density, all zones safe")
    print("  2. GRADUAL_INCREASE- Slowly increasing crowd")
    print("  3. CRITICAL_Z2     - Zone 2 goes critical")
    print("  4. CRITICAL_Z3     - Zone 3 goes critical")
    print("  5. MULTI_CRITICAL  - Both zones critical (emergency)")
    print("  6. WAVE_PATTERN    - Oscillating crowd density")
    print("  7. RANDOM          - Randomized realistic data")
    print("  8. CROWD_FLOW      - Simulate crowd moving Z1->Z2->Z3")
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


def main():
    parser = argparse.ArgumentParser(description="SENTINEL Hardware Simulator")
    parser.add_argument("--scenario", type=int, help="Scenario number (1-8)")
    parser.add_argument("--duration", type=int, default=30, help="Duration in seconds")
    parser.add_argument("--interval", type=float, default=2.0, help="Interval between readings")
    args = parser.parse_args()

    simulator = SensorSimulator(interval=args.interval)

    scenarios = {
        1: ("NORMAL", simulator.scenario_normal),
        2: ("GRADUAL_INCREASE", simulator.scenario_gradual_increase),
        3: ("CRITICAL_Z2", simulator.scenario_critical_z2),
        4: ("CRITICAL_Z3", simulator.scenario_critical_z3),
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
        print(f"\n Running scenario: {name}")
        simulator.run_scenario(generator, args.duration)
    else:
        while True:
            choice, duration = interactive_menu()
            if choice is None:
                print("\n Goodbye!")
                break
            name, generator = scenarios[choice]
            print(f"\n Running scenario: {name}")
            simulator.run_scenario(generator, duration)


if __name__ == "__main__":
    main()
