/*
 * SENTINEL - Zone 1 ESP32-CAM Controller
 * 
 * Hardware Components:
 * - ESP32-CAM (RHYX-M21-45 or AI-Thinker)
 * - ESP32-CAM USB Base Board for programming
 * 
 * This module:
 * 1. Captures camera frames
 * 2. Sends frames to Python backend for YOLO processing
 * 3. Receives people count and displays status
 * 
 * Note: YOLO processing happens on the PC/laptop, not on ESP32-CAM
 * (ESP32-CAM doesn't have enough power for real-time YOLO)
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "base64.h"

// ======================= CONFIGURATION =======================
// WiFi credentials - UPDATE THESE
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server URL - UPDATE THIS to your PC's IP address
// This endpoint receives camera frames for YOLO processing
const char* cameraEndpoint = "http://192.168.1.100:8000/api/v1/telemetry/camera";
const char* predictEndpoint = "http://192.168.1.100:8000/predict";

// Zone configuration
const char* ZONE_ID = "zone-1";

// ======================= AI-THINKER ESP32-CAM PIN CONFIG =======================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Flash LED (built-in)
#define FLASH_LED_PIN 4

// ======================= TIMING CONSTANTS =======================
#define CAPTURE_INTERVAL 1000  // Capture frame every 1 second

// ======================= GLOBAL VARIABLES =======================
unsigned long lastCaptureTime = 0;
int lastPeopleCount = 0;

void setup() {
  Serial.begin(115200);
  
  // Initialize flash LED
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW);
  
  // Initialize camera
  if (!initCamera()) {
    Serial.println("Camera init failed!");
    return;
  }
  
  // Connect to WiFi
  connectWiFi();
  
  Serial.println("SENTINEL ESP32-CAM Ready");
  Serial.print("Zone: ");
  Serial.println(ZONE_ID);
}

void loop() {
  // Maintain WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  
  // Capture and send frame at regular intervals
  if (millis() - lastCaptureTime >= CAPTURE_INTERVAL) {
    captureAndSendFrame();
    lastCaptureTime = millis();
  }
  
  delay(10);
}

bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Lower resolution for faster processing
  // FRAMESIZE_QVGA = 320x240
  // FRAMESIZE_VGA = 640x480
  // FRAMESIZE_SVGA = 800x600
  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 12;  // 0-63, lower = higher quality
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 15;
    config.fb_count = 1;
  }
  
  // Camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return false;
  }
  
  // Adjust camera settings
  sensor_t* s = esp_camera_sensor_get();
  s->set_brightness(s, 0);     // -2 to 2
  s->set_contrast(s, 0);       // -2 to 2
  s->set_saturation(s, 0);     // -2 to 2
  s->set_special_effect(s, 0); // 0 = No Effect
  s->set_whitebal(s, 1);       // Auto white balance
  s->set_awb_gain(s, 1);       // AWB gain
  s->set_wb_mode(s, 0);        // Auto WB mode
  s->set_exposure_ctrl(s, 1);  // Auto exposure
  s->set_aec2(s, 1);           // AEC DSP
  s->set_ae_level(s, 0);       // AE level
  s->set_aec_value(s, 300);    // AEC value
  s->set_gain_ctrl(s, 1);      // Auto gain
  s->set_agc_gain(s, 0);       // AGC gain
  s->set_gainceiling(s, (gainceiling_t)0);
  s->set_bpc(s, 0);            // Black pixel correction
  s->set_wpc(s, 1);            // White pixel correction
  s->set_raw_gma(s, 1);        // Raw GMA
  s->set_lenc(s, 1);           // Lens correction
  s->set_hmirror(s, 0);        // Horizontal mirror
  s->set_vflip(s, 0);          // Vertical flip
  s->set_dcw(s, 1);            // Downsize EN
  
  Serial.println("Camera initialized successfully");
  return true;
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
    
    // Blink flash LED while connecting
    digitalWrite(FLASH_LED_PIN, !digitalRead(FLASH_LED_PIN));
  }
  
  digitalWrite(FLASH_LED_PIN, LOW);
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

void captureAndSendFrame() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping capture");
    return;
  }
  
  // Capture frame
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }
  
  Serial.printf("Captured frame: %dx%d, size: %d bytes\n", 
                fb->width, fb->height, fb->len);
  
  // Brief flash to indicate capture
  digitalWrite(FLASH_LED_PIN, HIGH);
  delay(50);
  digitalWrite(FLASH_LED_PIN, LOW);
  
  // Convert to Base64
  String base64Image = base64::encode(fb->buf, fb->len);
  
  // Return frame buffer
  esp_camera_fb_return(fb);
  
  // Send to server
  sendFrameToServer(base64Image);
}

void sendFrameToServer(String& base64Frame) {
  HTTPClient http;
  http.begin(cameraEndpoint);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);  // 5 second timeout
  
  // Create JSON payload matching CameraFrameRequest schema
  // Using a large buffer for base64 image
  String jsonPayload = "{\"frame\":{\"zone_id\":\"";
  jsonPayload += ZONE_ID;
  jsonPayload += "\",\"frame_b64\":\"";
  jsonPayload += base64Frame;
  jsonPayload += "\"}}";
  
  Serial.print("Sending frame (");
  Serial.print(jsonPayload.length());
  Serial.println(" bytes)...");
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Response code: ");
    Serial.println(httpResponseCode);
    
    // Parse response to get people count
    parseResponse(response);
  } else {
    Serial.print("Error sending frame: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

void parseResponse(String response) {
  // The server returns IntelligenceOutput which includes people count
  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, response);
  
  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Extract people count from response
  // The camera endpoint returns fused_crowd_count
  if (doc.containsKey("fused_crowd_count")) {
    lastPeopleCount = doc["fused_crowd_count"].as<int>();
    Serial.print("People detected: ");
    Serial.println(lastPeopleCount);
  }
  
  if (doc.containsKey("crowd_density")) {
    Serial.print("Density level: ");
    Serial.println(doc["crowd_density"].as<String>());
  }
  
  if (doc.containsKey("risk_level")) {
    Serial.print("Risk level: ");
    Serial.println(doc["risk_level"].as<String>());
  }
}

// Alternative: Simple HTTP stream mode (for direct video streaming)
// This can be used if you want the PC to pull frames instead of push
void startStreamServer() {
  // This would start an HTTP server on the ESP32-CAM
  // that streams MJPEG to the PC for processing
  // Implementation depends on your architecture preference
  Serial.println("Stream server not implemented - using push mode");
}
