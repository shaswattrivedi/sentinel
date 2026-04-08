#!/usr/bin/env python3
"""
Quick integration test for SENTINEL hardware integration.
Run this to verify the ML service endpoints work correctly.

Usage:
    python test_integration.py
"""

import requests
import json
import sys
from datetime import datetime, timezone

ML_SERVICE_URL = "http://localhost:8000"


def test_predict_endpoint():
    """Test the /predict endpoint with sample ESP32 data."""
    print("Testing /predict endpoint...")
    
    payload = {
        "z1_cam_count": 3,
        "z2_density_score": 55.0,
        "z3_density_score": 25.0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    
    try:
        response = requests.post(f"{ML_SERVICE_URL}/predict", json=payload, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        print(f"  SUCCESS: Status: {response.status_code}")
        print(f"  Risk Score: {data['risk_score']}")
        print(f"  System Status: {data['system_status']}")
        print(f"  Zone Status: {data['zone_status']}")
        print(f"  Hardware Commands: {data['hardware_commands']}")
        print(f"  Trend Prediction: {data['trend_prediction']}")
        return True
    except requests.exceptions.ConnectionError:
        print(f"  ERROR: Cannot connect to ML service at {ML_SERVICE_URL}")
        return False
    except Exception as e:
        print(f"  ERROR: Error: {e}")
        return False


def test_dashboard_hardware():
    """Test the /dashboard/hardware endpoint."""
    print("\nTesting /dashboard/hardware endpoint...")
    
    try:
        response = requests.get(f"{ML_SERVICE_URL}/dashboard/hardware", timeout=5)
        response.raise_for_status()
        data = response.json()
        
        print(f"  SUCCESS: Status: {response.status_code}")
        print(f"  Zone Status: {data.get('zone_status', 'N/A')}")
        print(f"  Hardware Commands: {data.get('hardware_commands', 'N/A')}")
        print(f"  Trend Prediction: {data.get('trend_prediction', 'N/A')}")
        return True
    except requests.exceptions.ConnectionError:
        print(f"  ERROR: Cannot connect to ML service at {ML_SERVICE_URL}")
        return False
    except Exception as e:
        print(f"  ERROR: Error: {e}")
        return False


def test_dashboard_overview():
    """Test the /dashboard/overview endpoint."""
    print("\nTesting /dashboard/overview endpoint...")
    
    try:
        response = requests.get(f"{ML_SERVICE_URL}/dashboard/overview", timeout=5)
        response.raise_for_status()
        data = response.json()
        
        print(f"  SUCCESS: Status: {response.status_code}")
        print(f"  Risk Level: {data.get('risk_level', 'N/A')}")
        print(f"  Risk Score: {data.get('risk_score', 'N/A')}")
        print(f"  System State: {data.get('system_state', 'N/A')}")
        return True
    except requests.exceptions.ConnectionError:
        print(f"  ERROR: Cannot connect to ML service at {ML_SERVICE_URL}")
        return False
    except Exception as e:
        print(f"  ERROR: Error: {e}")
        return False


def test_scenario_sequence():
    """Test a sequence of readings simulating a crowd buildup."""
    print("\n" + "="*60)
    print("Testing Scenario: Crowd Buildup")
    print("="*60)
    
    scenarios = [
        {"name": "Low density", "z1": 1, "z2": 20, "z3": 15},
        {"name": "Moderate buildup", "z1": 3, "z2": 45, "z3": 35},
        {"name": "High density Zone 2", "z1": 4, "z2": 78, "z3": 40},
        {"name": "Critical situation", "z1": 8, "z2": 90, "z3": 85},
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\nStep {i}: {scenario['name']}")
        
        payload = {
            "z1_cam_count": scenario["z1"],
            "z2_density_score": scenario["z2"],
            "z3_density_score": scenario["z3"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        
        try:
            response = requests.post(f"{ML_SERVICE_URL}/predict", json=payload, timeout=5)
            data = response.json()
            
            status = data["system_status"]
            hw = data["hardware_commands"]
            
            led_emoji = {"green": "[GREEN]", "yellow": "[YELLOW]", "red": "[RED]"}.get
            
            print(f"  Status: {status} | Risk: {data['risk_score']:.1f}")
            print(f"  Zone 2 LED: {led_emoji(hw['z2_led'], '[OFF]')} {hw['z2_led']} | Buzzer: {'ON' if hw['z2_buzzer'] else 'OFF'}")
            print(f"  Zone 3 LED: {led_emoji(hw['z3_led'], '[OFF]')} {hw['z3_led']} | Buzzer: {'ON' if hw['z3_buzzer'] else 'OFF'}")
            print(f"  Trend: {data['trend_prediction']['trend']} → {data['trend_prediction']['prediction']}")
            
        except Exception as e:
            print(f"  ERROR: Error: {e}")
            return False
        
        import time
        time.sleep(0.5)
    
    return True


def main():
    print("="*60)
    print("SENTINEL Hardware Integration Test")
    print("="*60)
    print(f"ML Service URL: {ML_SERVICE_URL}")
    print()
    
    tests = [
        ("Predict Endpoint", test_predict_endpoint),
        ("Dashboard Hardware", test_dashboard_hardware),
        ("Dashboard Overview", test_dashboard_overview),
        ("Scenario Sequence", test_scenario_sequence),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"  ERROR: Test failed with exception: {e}")
            results.append((name, False))
    
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    all_passed = True
    for name, passed in results:
        status = "SUCCESS: PASS" if passed else "ERROR: FAIL"
        print(f"  {status}: {name}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print("\n All tests passed!")
    else:
        print("\nWARNING:  Some tests failed. Make sure the ML service is running:")
        print("   cd ml && python main.py")
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
