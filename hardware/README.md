# SENTINEL Hardware Integration Guide

## Overview

This document describes how to set up and connect the ESP32 hardware sensors with the SENTINEL ML dashboard.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Zone 1        │    │   Zone 2        │    │   Zone 3        │
│   ESP32-CAM     │    │   ESP32 Dev     │    │   ESP32 Dev     │
│   Camera        │    │   PIR+Ultrasonic│    │   PIR+Ultrasonic│
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         │        WiFi          │         WiFi         │
         └──────────┬───────────┴──────────┬───────────┘
                    │                      │
                    ▼                      ▼
         ┌──────────────────────────────────────────┐
         │         Python ML Service (Port 8000)     │
         │   - YOLO People Detection                 │
         │   - Density Score Processing              │
         │   - Risk Assessment                       │
         │   - Hardware Command Generation           │
         └─────────────────┬────────────────────────┘
                           │
                           ▼
         ┌──────────────────────────────────────────┐
         │         React Dashboard (Port 5173)       │
         │   - Real-time Risk Display               │
         │   - Zone Status Indicators               │
         │   - Traffic Signal LEDs                  │
         │   - Trend Predictions                    │
         └──────────────────────────────────────────┘
```

## Hardware Components

### Zone 1 (ESP32-CAM)
- ESP32-CAM (RHYX-M21-45 or AI-Thinker)
- ESP32-CAM USB Base Board
- USB Cable

### Zone 2 & 3 (ESP32 Dev Board)
Each zone requires:
- ESP32 Dev Board (CH340/CP2102)
- HC-SR501 PIR Motion Sensor
- HC-SR04 Ultrasonic Sensor
- 1kΩ + 2kΩ Resistors (voltage divider for Echo pin)
- Traffic Signal LED Module (Red-Yellow-Green)
- 5V Active Buzzer
- Breadboard
- Jumper Wires

## Wiring Diagrams

### Zone 2/3 ESP32 Dev Board

```
ESP32 Pin   │ Component
────────────┼─────────────────────────
GPIO 27     │ PIR Sensor OUT
GPIO 26     │ Ultrasonic TRIG
GPIO 25     │ Ultrasonic ECHO (through voltage divider)
GPIO 14     │ LED Red
GPIO 12     │ LED Yellow
GPIO 13     │ LED Green
GPIO 32     │ Buzzer +
5V          │ PIR VCC, Ultrasonic VCC
GND         │ PIR GND, Ultrasonic GND, LED GND, Buzzer GND
```

### Ultrasonic Voltage Divider

```
HC-SR04 ECHO ──┬── 1kΩ ──┬── GPIO 25
               │         │
               └── 2kΩ ──┴── GND
```

This converts 5V Echo signal to ~3.3V for ESP32 safety.

## Software Setup

### 1. Install Arduino IDE Libraries

Required libraries:
- WiFi (built-in for ESP32)
- HTTPClient (built-in for ESP32)
- ArduinoJson (install via Library Manager)
- base64 (for ESP32-CAM, install via Library Manager)

### 2. Configure Arduino Code

In `zone_sensor_esp32.ino`:
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_PC_IP:8000/predict";
const char* ZONE_ID = "zone-2";  // or "zone-3"
```

In `zone1_esp32cam.ino`:
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* cameraEndpoint = "http://YOUR_PC_IP:8000/api/v1/telemetry/camera";
```

### 3. Upload Code

1. Connect ESP32 via USB
2. Select "ESP32 Dev Module" (or "AI Thinker ESP32-CAM")
3. Select correct COM port
4. Upload code

### 4. Start Backend Services

```bash
# Terminal 1: Start ML Service
cd ml
pip install -r requirements.txt
python main.py

# Terminal 2: Start Frontend
cd frontend
npm install
npm run dev
```

### 5. Test Without Hardware (Simulator)

```bash
cd ml
python test_hardware_simulator.py
```

Select a scenario to see dashboard responses.

## API Endpoints

### POST /predict
Main endpoint for sensor data fusion.

Request:
```json
{
  "z1_cam_count": 5,
  "z2_density_score": 45.5,
  "z3_density_score": 30.0
}
```

Response:
```json
{
  "risk_score": 65.0,
  "system_status": "MODERATE",
  "zone_status": {
    "z1": "MODERATE",
    "z2": "MODERATE",
    "z3": "SAFE"
  },
  "hardware_commands": {
    "z2_led": "yellow",
    "z3_led": "green",
    "z2_buzzer": false,
    "z3_buzzer": false
  },
  "trend_prediction": {
    "trend": "STABLE",
    "prediction": "MODERATE_TREND",
    "predicted_density": 37.75,
    "confidence": 0.75
  }
}
```

### GET /dashboard/hardware
Get current hardware status for dashboard display.

## Density Score Calculation

The ESP32 calculates density score (0-100) based on:

1. **Motion Events (0-50 points)**
   - More PIR triggers = higher density
   - 10+ events in 2 seconds = max score

2. **Distance Factor (0-30 points)**
   - < 50cm: 30 points (very close)
   - 50-150cm: 20 points (medium)
   - 150-300cm: 10 points (far)

3. **Motion Recency (0-20 points)**
   - < 1 second ago: 20 points
   - 1-3 seconds ago: 10 points
   - 3-5 seconds ago: 5 points

## Status Thresholds

| Density Score | Zone Status | LED Color | Buzzer |
|---------------|-------------|-----------|--------|
| 0-40          | SAFE        | 🟢 Green  | OFF    |
| 41-75         | MODERATE    | 🟡 Yellow | OFF    |
| 76-100        | CRITICAL    | 🔴 Red    | ON     |

## Troubleshooting

### ESP32 Won't Connect to WiFi
- Verify SSID and password
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Check if router allows new connections

### No Data on Dashboard
- Verify ML service is running on port 8000
- Check ESP32 Serial Monitor for connection status
- Verify IP address in Arduino code matches PC's IP

### Camera Not Working
- ESP32-CAM requires 5V power (USB may not be sufficient)
- Check camera ribbon cable connection
- Verify GPIO 0 is not grounded (except during flashing)

### Sensor Readings Invalid
- Check wiring connections
- Verify voltage divider for ultrasonic Echo pin
- Ensure PIR sensor has warmed up (~60 seconds)

## Testing Scenarios

Use `test_hardware_simulator.py` to test:

1. **NORMAL** - Low density, all zones safe
2. **GRADUAL_INCREASE** - Slowly increasing crowd
3. **CRITICAL_Z2** - Zone 2 goes critical
4. **CRITICAL_Z3** - Zone 3 goes critical
5. **MULTI_CRITICAL** - Both zones critical
6. **WAVE_PATTERN** - Oscillating density
7. **RANDOM** - Random realistic data

```bash
# Interactive mode
python test_hardware_simulator.py

# Specific scenario
python test_hardware_simulator.py --scenario=5 --duration=60
```

## Dashboard Features

The dashboard displays:

- **Risk Score Gauge** - 0-100 with color coding
- **Crowd Density Card** - LOW/MEDIUM/HIGH
- **Zone Status Grid** - Individual zone states
- **Traffic Signal LEDs** - Visual LED indicators
- **Buzzer Status** - ON/OFF indicators
- **Trend Prediction** - INCREASING/STABLE/DECREASING
- **Risk Timeline** - Historical graph
- **Alerts Panel** - Critical events
