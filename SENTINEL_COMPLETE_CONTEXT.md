# SENTINEL - Complete Project Context

## Project Overview

**SENTINEL** is an Intelligent Crowd Monitoring & Emergency Response System that provides real-time crowd density monitoring, risk assessment, and evacuation decision support using ML-powered analytics.

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SENTINEL SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Zone 1     │    │   Zone 2     │    │   Zone 3     │      │
│  │ ESP32-CAM    │    │ ESP32 Dev    │    │ ESP32 Dev    │      │
│  │ + Camera     │    │ PIR+Ultra    │    │ PIR+Ultra    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         └─────────WiFi──────┴─────────WiFi──────┘               │
│                             │                                    │
│                             ▼                                    │
│         ┌───────────────────────────────────────┐               │
│         │   ML Service (FastAPI - Port 8000)    │               │
│         │   - YOLO People Detection             │               │
│         │   - IoT Risk Engine                   │               │
│         │   - Density Classification            │               │
│         │   - Trend Prediction                  │               │
│         │   - Hardware Command Generation       │               │
│         └─────────────┬─────────────────────────┘               │
│                       │                                          │
│         ┌─────────────┴─────────────────────┐                   │
│         │                                   │                   │
│         ▼                                   ▼                   │
│  ┌─────────────────┐           ┌──────────────────────┐        │
│  │  Backend API    │           │  Frontend Dashboard  │        │
│  │  (Express)      │◄─────────►│  (React + Vite)     │        │
│  │  Port 4000      │           │  Port 5173          │        │
│  │  + MongoDB      │           │  + TailwindCSS      │        │
│  └─────────────────┘           └──────────────────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Services & Ports

| Service       | Port | URL                       | Description                           |
|--------------|------|---------------------------|---------------------------------------|
| Frontend     | 5173 | http://localhost:5173     | React dashboard with real-time updates|
| Backend API  | 4000 | http://localhost:4000     | Express REST API + JWT auth          |
| ML Service   | 8000 | http://localhost:8000     | FastAPI ML prediction service         |
| API Docs     | 4000 | http://localhost:4000/docs| Swagger UI documentation              |
| MongoDB      | 27017| mongodb://localhost:27017 | Database (local or Atlas)            |

---

## Technology Stack

### Frontend (React + TypeScript + Vite)
- **Framework**: React 18.3.1
- **Build Tool**: Vite 7.3.1
- **Language**: TypeScript 5.4.5
- **Styling**: TailwindCSS 4.1.18
- **Animations**: Framer Motion 12.29.2, GSAP 3.14.2
- **Routing**: React Router DOM 6.26.2
- **HTTP Client**: Axios 1.7.7
- **UI Components**: Lucide React (icons), Custom glass morphism components
- **3D Graphics**: OGL 1.0.11 (for Aurora background effect)

### Backend (Node.js + Express + TypeScript)
- **Runtime**: Node.js 18+
- **Framework**: Express 4.19.2
- **Language**: TypeScript 5.9.3
- **Database**: MongoDB with Mongoose 9.1.5
- **Authentication**: JWT (jsonwebtoken 9.0.3), bcrypt 6.0.0
- **Security**: Helmet 7.0.0, CORS 2.8.5, express-rate-limit 7.2.0
- **Validation**: Zod 3.23.8
- **Logging**: Morgan 1.10.0
- **Dev Tools**: tsx 4.19.0 (for hot reload)

### ML Service (Python + FastAPI)
- **Framework**: FastAPI 0.109.0+ with Uvicorn
- **Data Processing**: NumPy 1.26.0+
- **Computer Vision**: OpenCV 4.9.0+
- **Validation**: Pydantic 2.5.0+
- **HTTP Client**: Requests 2.31.0+
- **Environment**: Python-dotenv 1.0.0+

### Hardware (ESP32 IoT Devices)
- **Microcontroller**: ESP32 Dev Board (CH340/CP2102)
- **Camera**: ESP32-CAM (RHYX-M21-45 or AI-Thinker)
- **Sensors**: HC-SR501 PIR Motion, HC-SR04 Ultrasonic Distance
- **Actuators**: Traffic Signal LED Module (Red-Yellow-Green), 5V Active Buzzer
- **Programming**: Arduino IDE with ArduinoJson library

---

## Directory Structure

```
sentinel/
├── backend/               # Node.js Express API
│   ├── src/
│   │   ├── config/       # Database & environment configuration
│   │   │   ├── db.ts
│   │   │   └── env.ts
│   │   ├── middleware/   # Auth, RBAC, error handling
│   │   │   ├── auth.ts
│   │   │   ├── rbac.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── requestContext.ts
│   │   ├── models/       # Mongoose schemas
│   │   │   └── user.ts
│   │   ├── routes/       # API endpoints
│   │   │   ├── index.ts
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── sensors.ts
│   │   │   ├── risk.ts
│   │   │   ├── evacuation.ts
│   │   │   └── alerts.ts
│   │   ├── services/     # Business logic
│   │   │   ├── authService.ts
│   │   │   ├── userService.ts
│   │   │   ├── mlClient.ts
│   │   │   ├── riskService.ts
│   │   │   └── alertService.ts
│   │   ├── types/        # TypeScript types
│   │   │   ├── auth.ts
│   │   │   └── users.ts
│   │   ├── utils/        # Utilities
│   │   │   ├── response.ts
│   │   │   ├── logger.ts
│   │   │   ├── password.ts
│   │   │   └── jwt.ts
│   │   └── index.ts      # Entry point
│   ├── docs/             # API documentation
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/             # React SPA
│   ├── src/
│   │   ├── api/         # API clients
│   │   │   ├── client.ts
│   │   │   ├── mlClient.ts
│   │   │   └── dashboard.ts
│   │   ├── components/   # React components
│   │   │   ├── ml/      # Dashboard ML components
│   │   │   │   ├── RiskScoreIndicator.tsx
│   │   │   │   ├── CrowdDensityCard.tsx
│   │   │   │   ├── FlowChart.tsx
│   │   │   │   ├── RiskTimelineChart.tsx
│   │   │   │   ├── AlertsPanel.tsx
│   │   │   │   ├── EvacuationDecisionPanel.tsx
│   │   │   │   ├── HardwareStatusPanel.tsx
│   │   │   │   └── MLTrendPanel.tsx
│   │   │   ├── Aurora.tsx        # 3D WebGL background
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── ShinyText.tsx
│   │   │   ├── SplitText.tsx
│   │   │   └── ... (other UI components)
│   │   ├── context/     # React context
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/       # Custom hooks
│   │   │   └── useMLDashboardData.ts
│   │   ├── pages/       # Route pages
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── types/       # TypeScript types
│   │   │   ├── ml.ts
│   │   │   └── ogl.d.ts
│   │   ├── main.tsx     # Entry point
│   │   └── styles.css   # Global styles
│   ├── public/          # Static assets
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env.example
│
├── ml/                  # Python ML Service
│   ├── sentinel_ml/     # Core ML pipeline
│   │   ├── pipeline.py  # Main orchestrator
│   │   ├── density/     # Density classification
│   │   │   └── classifier.py
│   │   ├── risk/        # Risk assessment
│   │   │   └── assessor.py
│   │   ├── decisions/   # Decision engine
│   │   │   └── engine.py
│   │   ├── iot/         # IoT-native risk engine
│   │   │   └── engine.py
│   │   ├── vision/      # Computer vision
│   │   │   └── people_counter.py
│   │   ├── sensors/     # Sensor interpretation
│   │   │   └── interpreter.py
│   │   ├── fusion/      # Data fusion
│   │   │   └── confidence_fuser.py
│   │   ├── features/    # Temporal features
│   │   │   └── temporal_model.py
│   │   ├── inputs/      # Input schemas
│   │   │   └── schemas.py
│   │   ├── outputs/     # Output contracts
│   │   │   └── contracts.py
│   │   └── utils/       # Utilities
│   │       ├── time_utils.py
│   │       └── smoothing.py
│   ├── api/             # FastAPI routes
│   │   ├── routes/
│   │   │   ├── predict.py
│   │   │   ├── telemetry.py
│   │   │   └── dashboard.py
│   │   └── schemas/
│   │       ├── input.py
│   │       └── output.py
│   ├── services/        # Service layer
│   │   ├── ml_service.py
│   │   └── aggregation_service.py
│   ├── storage/         # In-memory storage
│   │   └── in_memory.py
│   ├── utils/           # Utilities
│   │   └── deps.py
│   ├── main.py          # Entry point
│   ├── test_hardware_simulator.py  # Hardware simulator
│   ├── test_integration.py
│   ├── example_usage.py
│   ├── requirements.txt
│   └── .env.example
│
├── hardware/            # ESP32 Arduino code
│   ├── zone_sensor_esp32.ino     # Zone 2/3 sensor controller
│   ├── zone1_esp32cam.ino        # Zone 1 camera controller
│   └── README.md                 # Hardware setup guide
│
├── package.json         # Root package.json (workspace scripts)
├── README.md           # Main documentation
└── .gitignore

```

---

## Core Features & Functionality

### 1. Authentication & Authorization (Backend)
- **JWT-based authentication** with access + refresh tokens
- **Role-based access control (RBAC)** with roles:
  - `SUPER_ADMIN`: Full system access
  - `ADMIN`: Organization-level admin
  - `VIEW_ONLY`: Read-only dashboard access
- **Token management**: In-memory refresh token store with revocation
- **Public signup endpoint** for self-registration (VIEW_ONLY role)
- **Password hashing**: bcrypt with cost factor 10

### 2. ML Intelligence Pipeline (Python)
The core ML pipeline (`sentinel_ml/pipeline.py`) processes multi-modal inputs:

#### Input Sources:
1. **Camera Input** (Zone 1 ESP32-CAM):
   - Base64-encoded JPEG frames
   - YOLO-based people counting (via `CameraPeopleCounter`)
   - Confidence scoring

2. **Sensor Telemetry** (Zone 2/3 ESP32 Dev):
   - PIR motion detection (binary)
   - Ultrasonic distance (cm)
   - Calculated density score (0-100)

#### Processing Stages:
1. **Data Fusion** (`ConfidenceWeightedFuser`):
   - Combines camera counts + sensor estimates
   - Weighted fusion with confidence scoring
   - Handles missing/unreliable data sources

2. **Temporal Feature Extraction** (`TemporalCrowdModel`):
   - Rate of change (growth/decay)
   - Volatility (standard deviation)
   - Duration in state (persistence)

3. **Density Classification** (`CrowdDensityClassifier`):
   - **LOW**: < 5 people
   - **MEDIUM**: 5-15 people
   - **HIGH**: > 15 people

4. **Risk Assessment** (`RiskAssessor`):
   - Considers: density level, growth rate, volatility, persistence
   - Risk levels: **LOW**, **MEDIUM**, **HIGH**
   - Explainable reasoning for each assessment

5. **Decision Engine** (`DecisionEngine`):
   - Maps risk → evacuation actions
   - Generates alerts, severity levels, guidance
   - Provides directional routing recommendations

#### IoT-Native Risk Engine (`sentinel_ml/iot/engine.py`)
Hardware-optimized pipeline for ESP32 telemetry:

**Inputs**:
- `z1_cam_count`: People count from Zone 1 camera
- `z2_density_score`: 0-100 density from Zone 2 sensors
- `z3_density_score`: 0-100 density from Zone 3 sensors

**Derived Features**:
- `avg_density`: Mean of Z2+Z3 density scores
- `density_gradient`: Per-minute rate of change
- `zone_disparity`: Cross-zone imbalance
- `cam_density_factor`: Normalized camera congestion

**Risk Scoring** (weighted sum):
```python
risk_score = (
    0.55 * sensor_density_norm +
    0.25 * cam_density_factor +
    0.20 * zone_disparity_norm +
    0.10 * gradient_boost
) * 100
```

**Zone Status Thresholds**:
| Density Score | Status    | LED Color | Buzzer |
|--------------|-----------|-----------|--------|
| 0-40         | SAFE      | 🟢 Green  | OFF    |
| 41-75        | MODERATE  | 🟡 Yellow | OFF    |
| 76-100       | CRITICAL  | 🔴 Red    | ON     |

**Hardware Commands**:
- `z2_led`, `z3_led`: "green", "yellow", or "red"
- `z2_buzzer`, `z3_buzzer`: true/false

**Trend Prediction** (pattern ML):
- **Trend**: INCREASING, STABLE, DECREASING (based on gradient)
- **Prediction**: LOW_TREND, MODERATE_TREND, HIGH_RISK
- **Confidence**: 0.75-0.90 based on certainty

### 3. Dashboard (React Frontend)
Three-tab interface with real-time updates (polling every 5 seconds):

#### **OVERVIEW Tab**:
- **Risk Score Indicator**: 0-100 gauge with color-coded risk level
- **Crowd Density Card**: LOW/MEDIUM/HIGH with zone status grid
- **Evacuation Decision Panel**: Current evacuation state + confidence

#### **ANALYTICS Tab**:
- **Risk Timeline Chart**: Historical risk score graph
- **Flow Chart**: Traffic flow visualization across zones
- **ML Trend Panel**: Predicted density trends (INCREASING/STABLE/DECREASING)

#### **OPERATIONS Tab**:
- **Hardware Status Panel**: Real-time LED/Buzzer states for Z2 & Z3
- **ML Status**: Trend prediction with confidence percentage
- **Alerts Panel**: Critical event log (scrollable, auto-refresh)

**Dashboard Features**:
- Real-time polling with `useMLDashboardData` hook
- Manual refresh button
- Reset dashboard state (clears ML history + hardware snapshot)
- Loading skeletons for async data
- Error boundary for crash recovery
- Token cleanup on mount (prevents stale auth loops)

### 4. Hardware Integration (ESP32)

#### **Zone 1: ESP32-CAM Controller** (`zone1_esp32cam.ino`)
- Captures JPEG frames (QVGA 320x240)
- Base64 encodes frames
- Sends to `/telemetry/camera` endpoint
- Receives people count response
- 1-second capture interval

**Camera Configuration**:
```cpp
- Resolution: QVGA (320x240)
- Format: JPEG
- Quality: 12 (0-63, lower = better)
- Brightness: 0 (auto)
- Contrast: 0 (auto)
```

#### **Zone 2/3: ESP32 Sensor Controllers** (`zone_sensor_esp32.ino`)
**Sensors**:
1. **PIR Motion Sensor** (HC-SR501):
   - Digital output → GPIO 27
   - Detects motion events
   - Counted over 2-second window

2. **Ultrasonic Distance Sensor** (HC-SR04):
   - TRIG → GPIO 26
   - ECHO → GPIO 25 (with voltage divider: 1kΩ + 2kΩ)
   - Measures distance 2-400cm
   - Timeout: 30ms

**Density Score Calculation** (0-100):
```cpp
density = motion_score + distance_score + recency_score
```
- **Motion Events** (0-50): More PIR triggers = higher density
- **Distance Factor** (0-30):
  - < 50cm: 30 points (very close)
  - 50-150cm: 20 points (medium)
  - 150-300cm: 10 points (far)
- **Motion Recency** (0-20):
  - < 1s ago: 20 points
  - 1-3s ago: 10 points
  - 3-5s ago: 5 points

**Actuators**:
- **Traffic Signal LEDs**:
  - RED → GPIO 14
  - YELLOW → GPIO 12
  - GREEN → GPIO 13
- **Buzzer** → GPIO 32 (active only when CRITICAL)

**Communication**:
- WiFi connection to local network
- POST to `/predict` endpoint every 2 seconds
- Receives hardware commands in response
- Updates LEDs/Buzzer based on server response

---

## API Endpoints

### Backend API (Port 4000)

#### Authentication (`/api/v1/auth`)
```typescript
POST /api/v1/auth/login
Body: { email: string, password: string }
Response: { access_token, refresh_token, user }

POST /api/v1/auth/refresh
Body: { refresh_token: string }
Response: { access_token, refresh_token, user }

POST /api/v1/auth/logout
Headers: { Authorization: "Bearer <access_token>" }
Response: { message: "Logged out" }

POST /api/v1/auth/signup
Headers: { Authorization: "Bearer <admin_token>" }
Body: { email, password, role, organizationId }
Response: { user }

POST /api/v1/auth/signup/public
Body: { email, password, organizationId }
Response: { access_token, refresh_token, user }
```

#### Users (`/api/v1/users`)
```typescript
GET /api/v1/users
Headers: { Authorization: "Bearer <access_token>" }
Query: { page?, limit?, role?, organizationId? }
Response: { users[], total, page, limit }

GET /api/v1/users/me
Headers: { Authorization: "Bearer <access_token>" }
Response: { user }

GET /api/v1/users/:id
Headers: { Authorization: "Bearer <access_token>" }
Response: { user }

DELETE /api/v1/users/:id
Headers: { Authorization: "Bearer <admin_token>" }
Response: { message: "User deleted" }
```

#### Sensors (`/api/v1/sensors`)
```typescript
GET /api/v1/sensors
Response: { sensors[] }

GET /api/v1/sensors/:zoneId
Response: { sensor }
```

#### Risk (`/api/v1/risk`)
```typescript
GET /api/v1/risk/current
Query: { zoneId? }
Response: { riskEvent }

GET /api/v1/risk/timeline
Query: { start?, end?, zoneId? }
Response: { events[] }
```

#### Alerts (`/api/v1/alerts`)
```typescript
GET /api/v1/alerts
Query: { severity?, zoneId?, limit? }
Response: { alerts[] }
```

#### Evacuation (`/api/v1/evacuation`)
```typescript
GET /api/v1/evacuation/status
Response: { state, confidence, guidance }
```

### ML Service (Port 8000)

#### Prediction (`/predict`)
```python
POST /predict
Body: {
  z1_cam_count: int,          # Zone 1 camera people count
  z2_density_score: float,    # Zone 2 density (0-100)
  z3_density_score: float,    # Zone 3 density (0-100)
  timestamp: str              # ISO 8601 UTC timestamp
}
Response: {
  risk_score: float,          # 0-100
  system_status: str,         # "SAFE" | "MODERATE" | "CRITICAL"
  zone_status: {
    z1: str,                  # Zone 1 status
    z2: str,                  # Zone 2 status
    z3: str                   # Zone 3 status
  },
  reason: str,                # Explanation text
  features: {
    avg_density: float,
    density_gradient: float,
    zone_disparity: float,
    cam_density_factor: float
  },
  hardware_commands: {
    z2_led: str,              # "green" | "yellow" | "red"
    z3_led: str,
    z2_buzzer: bool,
    z3_buzzer: bool
  },
  trend_prediction: {
    trend: str,               # "INCREASING" | "STABLE" | "DECREASING"
    prediction: str,          # "LOW_TREND" | "MODERATE_TREND" | "HIGH_RISK"
    predicted_density: float,
    confidence: float         # 0.0-1.0
  }
}
```

#### Camera Telemetry (`/telemetry/camera`)
```python
POST /telemetry/camera
Body: {
  zone_id: str,
  frame_b64: str,             # Base64-encoded JPEG
  timestamp: str
}
Response: {
  people_count: int,
  confidence: float
}
```

#### Dashboard Data (`/dashboard`)
```python
GET /dashboard/overview
Response: {
  riskScore: float,
  riskLevel: str,
  densityLevel: str
}

GET /dashboard/timeline
Response: {
  events: [{ timestamp, riskScore, riskLevel }]
}

GET /dashboard/flow
Response: {
  zones: [{ id, count, status }],
  flows: [{ from, to, intensity }]
}

GET /dashboard/alerts
Response: {
  alerts: [{ timestamp, severity, message, zoneId }]
}

GET /dashboard/evacuation
Response: {
  state: str,
  confidence: float,
  guidance: str
}

GET /dashboard/hardware
Response: {
  zone_status: { z1, z2, z3 },
  hardware_commands: { z2_led, z3_led, z2_buzzer, z3_buzzer },
  trend_prediction: { trend, prediction, predicted_density, confidence },
  timestamp: str
}

POST /dashboard/reset
Response: { message: "Dashboard state reset" }
```

---

## Environment Configuration

### Backend `.env`
```bash
PORT=4000
NODE_ENV=development

# JWT Configuration
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
JWT_ISSUER=sentinel
JWT_AUDIENCE=sentinel-dashboard

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sentinel
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority
MONGODB_DB=sentinel

# CORS (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60

# Logging
LOG_LEVEL=info
```

### Frontend `.env.local`
```bash
# Backend API (proxied via Vite)
VITE_API_BASE_URL=/api/v1

# ML Service (direct connection)
VITE_ML_API_BASE_URL=http://localhost:8000
```

### ML Service `.env`
```bash
# Server
ML_HOST=0.0.0.0
ML_PORT=8000

# CORS (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:4000

# Logging
LOG_LEVEL=INFO
```

### Hardware (Arduino)
```cpp
// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server URLs (update with your PC's IP)
const char* serverUrl = "http://192.168.1.100:8000/predict";
const char* cameraEndpoint = "http://192.168.1.100:8000/telemetry/camera";

// Zone ID
const char* ZONE_ID = "zone-2";  // or "zone-3" for Zone 3
```

---

## Development Workflow

### Starting All Services

**Terminal 1 - Backend**:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev  # Runs on port 4000
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev  # Runs on port 5173
```

**Terminal 3 - ML Service**:
```bash
cd ml
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python main.py  # Runs on port 8000
```

### Testing Without Hardware

**Simulate ESP32 sensors**:
```bash
cd ml
python test_hardware_simulator.py
```

**Available scenarios**:
1. NORMAL - Low density, all safe
2. GRADUAL_INCREASE - Slowly increasing crowd
3. CRITICAL_Z2 - Zone 2 goes critical
4. CRITICAL_Z3 - Zone 3 goes critical
5. MULTI_ZONE_CRITICAL - Both zones critical
6. WAVE_PATTERN - Oscillating density
7. RANDOM - Randomized realistic data
8. CROWD_FLOW - Simulate Z1→Z2→Z3 movement

**Run specific scenario**:
```bash
python test_hardware_simulator.py --scenario=5 --duration=60
```

### Building for Production

**Backend**:
```bash
cd backend
npm run build     # Compiles TypeScript to dist/
npm start         # Runs compiled code
```

**Frontend**:
```bash
cd frontend
npm run build     # Creates optimized build in dist/
npm run preview   # Preview production build
```

---

## Data Models & Types

### User Model (MongoDB)
```typescript
interface UserDoc {
  _id: ObjectId;
  email: string;              // Unique, lowercase
  passwordHash: string;       // bcrypt hash
  role: UserRole;             // SUPER_ADMIN | ADMIN | VIEW_ONLY
  organizationId: string;
  createdAt: Date;
}
```

### JWT Payload
```typescript
interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  organizationId: string;
  email: string;
}
```

### Risk Event
```typescript
interface RiskEvent {
  timestamp: string;          // ISO 8601
  zoneId: string;
  riskScore: number;          // 0.0-1.0
  riskState: "SAFE" | "WARNING" | "DANGER";
  reason: string;
}
```

### Intelligence Output (ML)
```python
@dataclass
class IntelligenceOutput:
    timestamp: datetime
    zone_id: str
    fused_crowd_count: float
    crowd_density: str          # "LOW" | "MEDIUM" | "HIGH"
    risk_level: str             # "LOW" | "MEDIUM" | "HIGH"
    fusion_confidence: float    # 0.0-1.0
    alert_status: bool
    alert_severity: str         # "NORMAL" | "ELEVATED" | "CRITICAL"
    recommended_action: str
    directional_guidance: str
    explanation_text: str
    camera_people_count: Optional[float]
    sensor_people_count: Optional[float]
```

### Hardware Commands
```python
@dataclass
class HardwareCommands:
    z2_led: str                 # "green" | "yellow" | "red"
    z3_led: str
    z2_buzzer: bool
    z3_buzzer: bool
```

### Trend Prediction
```python
@dataclass
class TrendPrediction:
    trend: str                  # "INCREASING" | "STABLE" | "DECREASING"
    prediction: str             # "LOW_TREND" | "MODERATE_TREND" | "HIGH_RISK"
    predicted_density: float    # 0-100
    confidence: float           # 0.0-1.0
```

---

## Key Algorithms & Logic

### 1. Density Score Calculation (ESP32)
```cpp
float calculateDensityScore() {
  // 1. Motion Events Score (0-50 points)
  int motion_score = min(motionEvents * 5, 50);
  
  // 2. Distance Factor (0-30 points)
  int distance_score = 0;
  if (distance < 50) distance_score = 30;
  else if (distance < 150) distance_score = 20;
  else if (distance < 300) distance_score = 10;
  
  // 3. Motion Recency (0-20 points)
  int elapsed = millis() - lastMotionTime;
  int recency_score = 0;
  if (elapsed < 1000) recency_score = 20;
  else if (elapsed < 3000) recency_score = 10;
  else if (elapsed < 5000) recency_score = 5;
  
  return motion_score + distance_score + recency_score;
}
```

### 2. Risk Score Calculation (IoT Engine)
```python
def _compute_risk_score(features: IoTDerivedFeatures) -> float:
    sensor_norm = clip_01(features.avg_density / 100.0)
    disparity_norm = clip_01(features.zone_disparity / 100.0)
    gradient_boost = clip_01(max(features.density_gradient, 0.0) / 20.0) * 0.10
    
    risk_01 = (
        0.55 * sensor_norm +           # Sensor density weight
        0.25 * features.cam_density_factor +  # Camera weight
        0.20 * disparity_norm +        # Zone imbalance weight
        gradient_boost                 # Trend boost
    )
    return round(clip_01(risk_01) * 100.0, 2)
```

### 3. Confidence-Weighted Fusion
```python
def fuse(camera_estimate: Tuple[float, float], 
         sensor_estimate: Tuple[float, float]) -> Tuple[float, float]:
    if camera_estimate and sensor_estimate:
        cam_count, cam_conf = camera_estimate
        sens_count, sens_conf = sensor_estimate
        total_conf = cam_conf + sens_conf
        fused = (cam_count * cam_conf + sens_count * sens_conf) / total_conf
        return fused, total_conf / 2.0
    elif camera_estimate:
        return camera_estimate
    elif sensor_estimate:
        return sensor_estimate
    else:
        return 0.0, 0.0
```

### 4. Risk Assessment Logic
```python
def assess(density: str, features: TemporalFeatures) -> Tuple[str, str]:
    if density == "HIGH" and (
        features.rate_of_change > 0.4 or
        features.duration_in_state_sec > 120.0
    ):
        return "HIGH", "Sustained congestion or rapid growth"
    
    if density == "MEDIUM" and features.rate_of_change > 0.4:
        return "MEDIUM", "Medium density with rapid inflow"
    
    if density == "HIGH" and features.volatility > 3.0:
        return "MEDIUM", "High density but unstable counts"
    
    return "LOW", "Stable conditions"
```

---

## Security Features

### Authentication & Authorization
1. **JWT Access Tokens** (15-minute expiry):
   - Short-lived, stateless
   - Issued via `/auth/login` and `/auth/refresh`

2. **JWT Refresh Tokens** (30-day expiry):
   - Long-lived, stored in-memory with revocation
   - Rotation on refresh (old token invalidated)

3. **Password Security**:
   - bcrypt hashing with cost factor 10
   - Minimum 8 characters enforced

4. **Role-Based Access Control**:
   - Middleware checks `user.role` against required roles
   - Admin-only endpoints (user management, admin signup)

### API Security
1. **Rate Limiting**: 60 requests/minute per IP
2. **CORS**: Configurable allowed origins
3. **Helmet.js**: Security headers (CSP, HSTS, etc.)
4. **Input Validation**: Zod schemas for all endpoints
5. **Error Handling**: Sanitized error messages (no stack traces in production)

### Hardware Security
1. **WiFi Encryption**: WPA2 recommended
2. **HTTPS**: Should be used in production (currently HTTP for dev)
3. **API Authentication**: Could add API keys for ESP32 devices

---

## Testing & Debugging

### Backend Tests
```bash
cd backend
npm run lint  # ESLint
```

### ML Service Tests
```bash
cd ml
python test_integration.py           # Integration tests
python test_hardware_simulator.py    # Hardware simulation
python example_usage.py              # Usage examples
```

### Hardware Debugging
1. **Serial Monitor** (115200 baud):
   - View ESP32 logs
   - Check WiFi connection status
   - See sensor readings + server responses

2. **Common Issues**:
   - **WiFi won't connect**: Check SSID/password, ensure 2.4GHz network
   - **No dashboard data**: Verify ML service running, check IP address
   - **Camera not working**: ESP32-CAM requires 5V power, check ribbon cable
   - **Invalid sensor readings**: Check wiring, voltage divider for ultrasonic

---

## Performance Optimization

### Frontend
- **Lazy Loading**: Routes loaded on-demand
- **Polling Optimization**: 5-second interval (configurable)
- **Memoization**: `useMemo` for expensive computations
- **Virtual DOM**: React's efficient rendering

### Backend
- **Connection Pooling**: MongoDB connection reuse
- **Rate Limiting**: Prevents API abuse
- **Compression**: Helmet.js gzip compression

### ML Service
- **Async Processing**: FastAPI's async/await
- **In-Memory Storage**: Fast access for recent data
- **NumPy Vectorization**: Efficient array operations

### Hardware
- **WiFi Sleep Mode**: ESP32 power management
- **Efficient Sampling**: 2-second intervals (configurable)
- **Minimal Payload**: Compact JSON (~200 bytes)

---

## Future Enhancements

### Planned Features
1. **WebSocket Support**: Replace polling with real-time push
2. **Historical Analytics**: MongoDB time-series collections
3. **Multi-Location Support**: Scale to multiple venues
4. **Mobile App**: React Native or Flutter
5. **Alert Notifications**: Email/SMS via Twilio
6. **Advanced ML**: LSTM for better trend prediction
7. **3D Visualization**: Three.js heatmaps
8. **Offline Mode**: PWA with service workers

### Hardware Improvements
1. **LoRaWAN Support**: Long-range, low-power networking
2. **Edge AI**: On-device YOLO (ESP32-S3 or Jetson Nano)
3. **Mesh Networking**: ESP32 mesh for resilience
4. **Battery Power**: Solar panels + LiPo batteries

---

## Git History (Recent Commits)
```
08702ba Dashboard Functionality Changes
ed6d5d6 V4 Updated Changes
d4f525e V4 Updated Changes
99933b3 Dashboard Changes: V2
73cde13 Updated Dashboard UI Components
e555fc7 Added Dashboard UI components
1fafadd Remodelling UI after Scaffold Changes
dcc66d6 Bug Fixes for HTML Code
8b2e9a0 TypeScript Migration to Vite Based Setup
f9406b3 Updated Repo Scaffold - Updated Wrapped ML Api and Inter Connectivity
```

---

## Project Status

### Completed ✅
- Full-stack authentication (JWT + refresh tokens)
- Real-time ML pipeline with multi-modal fusion
- IoT-native risk engine for ESP32 hardware
- React dashboard with 3-tab interface
- Hardware integration (ESP32-CAM + sensor modules)
- Traffic signal LED + buzzer control
- Trend prediction ML
- Hardware simulator for testing
- Documentation (README, Hardware guide)

### In Progress 🚧
- Comprehensive testing suite
- Production deployment configuration
- WebSocket implementation

### Not Started ❌
- Historical data persistence (MongoDB time-series)
- Mobile app
- Multi-venue support
- Advanced ML models (LSTM/GRU)

---

## Troubleshooting Guide

### Backend Issues
**MongoDB connection fails**:
- Check `MONGODB_URI` in `.env`
- Ensure MongoDB is running (`mongod` or Atlas connection)
- Verify network connectivity

**JWT errors**:
- Regenerate secrets in `.env`
- Clear browser localStorage (old tokens)

### Frontend Issues
**API requests fail (CORS)**:
- Check `ALLOWED_ORIGINS` in backend `.env`
- Verify Vite proxy configuration (`vite.config.ts`)

**Dashboard not updating**:
- Check ML service is running
- Verify `/dashboard/*` endpoints return data
- Check browser console for errors

### ML Service Issues
**Import errors**:
```bash
pip install -r requirements.txt
```

**Port 8000 already in use**:
```bash
lsof -ti:8000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :8000   # Windows
```

### Hardware Issues
**ESP32 won't upload**:
- Press BOOT button while uploading
- Check USB driver (CH340/CP2102)
- Verify correct board selection in Arduino IDE

**Sensor readings invalid**:
- Check wiring diagram
- Verify voltage divider (1kΩ + 2kΩ for Echo pin)
- Test sensors individually with sample code

---

## License & Contact

**License**: Private - All rights reserved

**Repository**: https://github.com/shaswattrivedi/sentinel

**Contributors**:
- Shaswat Trivedi ([@shaswattrivedi](https://github.com/shaswattrivedi))

---

## Additional Resources

### Documentation
- [Backend API Documentation](http://localhost:4000/docs) (Swagger UI)
- [Hardware Setup Guide](./hardware/README.md)
- [Frontend Architecture](./frontend/README.md)
- [ML Pipeline Overview](./ml/README.md)

### External Dependencies
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Manual](https://www.mongodb.com/docs/)
- [ESP32 Arduino Core](https://github.com/espressif/arduino-esp32)

---

**End of Complete Project Context**

This document contains every essential detail about the SENTINEL project, including architecture, technology stack, code structure, APIs, algorithms, configuration, and operational procedures. Use this context to understand and work with the project comprehensively.
