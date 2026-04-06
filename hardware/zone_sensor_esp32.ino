/*
 * SENTINEL - Zone 2/3 ESP32 Sensor Controller
 * 
 * Hardware Components:
 * - ESP32 Dev Board (CH340/CP2102)
 * - HC-SR501 PIR Motion Sensor
 * - HC-SR04 Ultrasonic Sensor (with voltage divider for Echo)
 * - Traffic Signal LED Module (Red-Yellow-Green)
 * - 5V Active Buzzer
 * 
 * Wiring for Zone 2 (same for Zone 3):
 * PIR Sensor:
 *   - VCC -> 5V
 *   - GND -> GND  
 *   - OUT -> GPIO 27
 * 
 * Ultrasonic Sensor:
 *   - VCC -> 5V
 *   - GND -> GND
 *   - TRIG -> GPIO 26
 *   - ECHO -> GPIO 25 (through voltage divider: 1kΩ + 2kΩ)
 * 
 * Traffic Signal LEDs:
 *   - RED -> GPIO 14
 *   - YELLOW -> GPIO 12
 *   - GREEN -> GPIO 13
 *   - GND -> GND
 * 
 * Buzzer:
 *   - VCC -> GPIO 32
 *   - GND -> GND
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ======================= CONFIGURATION =======================
// WiFi credentials - UPDATE THESE
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server URL - UPDATE THIS to your PC's IP address
const char* serverUrl = "http://192.168.1.100:8000/predict";

// Zone configuration - CHANGE FOR ZONE 3
const char* ZONE_ID = "zone-2";  // Change to "zone-3" for Zone 3 controller

// ======================= PIN DEFINITIONS =======================
// PIR Sensor
#define PIR_PIN 27

// Ultrasonic Sensor
#define TRIG_PIN 26
#define ECHO_PIN 25

// Traffic Signal LEDs
#define LED_RED 14
#define LED_YELLOW 12
#define LED_GREEN 13

// Buzzer
#define BUZZER_PIN 32

// ======================= TIMING CONSTANTS =======================
#define SEND_INTERVAL 2000       // Send data every 2 seconds
#define PIR_SAMPLE_COUNT 10      // Number of PIR samples for averaging
#define ULTRASONIC_TIMEOUT 30000 // Ultrasonic timeout in microseconds

// ======================= DENSITY CALCULATION =======================
// Distance thresholds for person detection (in cm)
#define NEAR_THRESHOLD 50    // Very close detection
#define MID_THRESHOLD 150    // Medium distance
#define FAR_THRESHOLD 300    // Far detection limit

// ======================= GLOBAL VARIABLES =======================
unsigned long lastSendTime = 0;
int pirMotionCount = 0;
float lastDistance = 0;

// For density calculation
int motionEvents = 0;
unsigned long lastMotionTime = 0;
float densityScore = 0.0;

// For response handling
String currentLedColor = "green";
bool buzzerActive = false;

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(PIR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Initialize LEDs (all off)
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_GREEN, HIGH);  // Default to green
  digitalWrite(BUZZER_PIN, LOW);
  
  // Connect to WiFi
  connectWiFi();
  
  Serial.println("SENTINEL Sensor Controller Ready");
  Serial.print("Zone: ");
  Serial.println(ZONE_ID);
}

void loop() {
  // Maintain WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  
  // Read PIR sensor
  bool motionDetected = digitalRead(PIR_PIN);
  if (motionDetected) {
    motionEvents++;
    lastMotionTime = millis();
  }
  
  // Read ultrasonic distance
  float distance = measureDistance();
  if (distance > 0) {
    lastDistance = distance;
  }
  
  // Send data at regular intervals
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    // Calculate density score based on PIR events and distance
    densityScore = calculateDensityScore();
    
    // Send to server and get response
    sendDataToServer();
    
    // Reset counters for next interval
    motionEvents = 0;
    lastSendTime = millis();
  }
  
  // Update hardware outputs
  updateLED();
  updateBuzzer();
  
  delay(100);  // Small delay for stability
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

float measureDistance() {
  // Clear trigger
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  
  // Send trigger pulse
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read echo pulse duration
  long duration = pulseIn(ECHO_PIN, HIGH, ULTRASONIC_TIMEOUT);
  
  if (duration == 0) {
    return -1;  // No echo received
  }
  
  // Calculate distance in cm (speed of sound = 343 m/s)
  float distance = (duration * 0.0343) / 2;
  
  return distance;
}

float calculateDensityScore() {
  /*
   * Density Score Calculation (0-100):
   * 
   * Components:
   * 1. Motion Events (0-50 points): More motion = higher density
   * 2. Distance Factor (0-30 points): Closer objects = higher density
   * 3. Motion Recency (0-20 points): Recent motion = higher density
   */
  
  float score = 0.0;
  
  // 1. Motion component (up to 50 points)
  // Assumes max 10 motion events per interval is critical
  float motionScore = min(50.0, (motionEvents / 10.0) * 50.0);
  score += motionScore;
  
  // 2. Distance component (up to 30 points)
  // Closer distance = higher score
  float distanceScore = 0.0;
  if (lastDistance > 0 && lastDistance < FAR_THRESHOLD) {
    if (lastDistance < NEAR_THRESHOLD) {
      distanceScore = 30.0;  // Very close
    } else if (lastDistance < MID_THRESHOLD) {
      distanceScore = 20.0;  // Medium distance
    } else {
      distanceScore = 10.0;  // Far but detected
    }
  }
  score += distanceScore;
  
  // 3. Motion recency component (up to 20 points)
  // More points if motion was detected recently
  unsigned long timeSinceMotion = millis() - lastMotionTime;
  float recencyScore = 0.0;
  if (timeSinceMotion < 1000) {
    recencyScore = 20.0;
  } else if (timeSinceMotion < 3000) {
    recencyScore = 10.0;
  } else if (timeSinceMotion < 5000) {
    recencyScore = 5.0;
  }
  score += recencyScore;
  
  // Clamp to 0-100 range
  score = max(0.0, min(100.0, score));
  
  Serial.print("Density Score: ");
  Serial.print(score);
  Serial.print(" (Motion: ");
  Serial.print(motionEvents);
  Serial.print(", Distance: ");
  Serial.print(lastDistance);
  Serial.println(" cm)");
  
  return score;
}

void sendDataToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping send");
    return;
  }
  
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  // Note: z1_cam_count is set to 0 as it comes from ESP32-CAM separately
  // The server expects all three zones, so we send our zone data
  StaticJsonDocument<256> doc;
  doc["z1_cam_count"] = 0;  // Camera count from Zone 1 ESP32-CAM
  
  // Set the appropriate zone density based on ZONE_ID
  if (String(ZONE_ID) == "zone-2") {
    doc["z2_density_score"] = densityScore;
    doc["z3_density_score"] = 0.0;  // Zone 3 will send its own data
  } else {
    doc["z2_density_score"] = 0.0;  // Zone 2 will send its own data
    doc["z3_density_score"] = densityScore;
  }
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.print("Sending: ");
  Serial.println(jsonPayload);
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Response code: ");
    Serial.println(httpResponseCode);
    
    // Parse response to get hardware commands
    parseResponse(response);
  } else {
    Serial.print("Error sending data: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

void parseResponse(String response) {
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, response);
  
  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Extract hardware commands for this zone
  JsonObject hw = doc["hardware_commands"];
  
  if (String(ZONE_ID) == "zone-2") {
    currentLedColor = hw["z2_led"].as<String>();
    buzzerActive = hw["z2_buzzer"].as<bool>();
  } else {
    currentLedColor = hw["z3_led"].as<String>();
    buzzerActive = hw["z3_buzzer"].as<bool>();
  }
  
  // Print status
  Serial.print("System Status: ");
  Serial.println(doc["system_status"].as<String>());
  Serial.print("Risk Score: ");
  Serial.println(doc["risk_score"].as<float>());
  Serial.print("LED Command: ");
  Serial.println(currentLedColor);
  Serial.print("Buzzer: ");
  Serial.println(buzzerActive ? "ON" : "OFF");
}

void updateLED() {
  // Turn off all LEDs first
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_GREEN, LOW);
  
  // Turn on appropriate LED
  if (currentLedColor == "red") {
    digitalWrite(LED_RED, HIGH);
  } else if (currentLedColor == "yellow") {
    digitalWrite(LED_YELLOW, HIGH);
  } else {
    digitalWrite(LED_GREEN, HIGH);
  }
}

void updateBuzzer() {
  if (buzzerActive) {
    // Pulsing buzzer for critical alerts
    if ((millis() / 500) % 2 == 0) {
      digitalWrite(BUZZER_PIN, HIGH);
    } else {
      digitalWrite(BUZZER_PIN, LOW);
    }
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }
}
