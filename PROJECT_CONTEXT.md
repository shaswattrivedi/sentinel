# SENTINEL Complete Project Context

Last updated: 2026-04-10 (refreshed)
Repository: sentinel
Primary purpose: Intelligent crowd monitoring, risk assessment, and emergency response decision support.

## 1) Monorepo Snapshot

SENTINEL is a multi-service monorepo with three runtime services plus hardware firmware.

- Frontend: React + Vite + TypeScript SPA (default dev port 5173)
- Backend: Express + TypeScript + MongoDB API server (default dev port 4000)
- ML Service: FastAPI + Python inference/aggregation service (default port 8000)
- Hardware: ESP32 sensor and ESP32-CAM firmware

Top-level file distribution (tracked files via `rg --files`, non-hidden):
- Total files: 227
- frontend: 140
- ml: 46
- backend: 35
- hardware: 3
- root and utility files: remaining

Core ports and URLs:
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api/v1
- Backend docs: http://localhost:4000/docs
- ML API: http://localhost:8000

## 2) High-Level Architecture

End-to-end flow:

1. User authenticates via Backend `/api/v1/auth/*` endpoints.
2. Frontend stores `access_token` and `refresh_token` in localStorage.
3. Frontend dashboards consume:
   - Backend `/api/v1/analytics/*` for persisted historical analytics snapshots.
   - ML service `/dashboard/*` for live in-memory operational telemetry and risk displays.
4. Backend snapshot scheduler polls ML service every 5 minutes and persists snapshots to MongoDB.
5. Hardware or simulators post telemetry/predict payloads to ML service, which updates in-memory dashboard state.

Tenant isolation model:
- Same `organizationId` users share data context.
- Different `organizationId` users are isolated from each other.
- Isolation is enforced in both:
  - Backend routes/services and analytics persistence
  - ML in-memory store and dashboard endpoints

## 3) Root-Level Commands

From repository root:

- `npm run dev:backend`
- `npm run dev:frontend`
- `npm run dev:ml`
- `npm run build:backend`
- `npm run build:frontend`
- `npm run install:backend`
- `npm run install:frontend`
- `npm run install:ml`
- `npm run install:all`

ML runtime convention:
- Use only `ml/venv` for Python execution in this repository.
- Start ML API: `cd ml && source venv/bin/activate && python main.py`
- Start hardware live loop: `cd ml && source venv/bin/activate && python run_hardware_live.py`

## 4) Backend Context (Node/Express/TypeScript)

Entry point:
- `backend/src/index.ts`

### 4.1 Middleware and Platform Behavior

- Security and transport:
  - `helmet`
  - `cors` with configured allowed origins
  - `express-rate-limit`
  - `cookie-parser`
- Logging:
  - `morgan` request logs
  - custom structured logger (`backend/src/utils/logger.ts`)
- Request context:
  - `requestContext` middleware injects request metadata
- Error handling:
  - `HttpError` + centralized `errorHandler`

### 4.2 Environment Variables (Backend)

From `backend/.env.example` and config:

- `PORT` (default 4000)
- `NODE_ENV`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `LOG_LEVEL`
- `ALLOWED_ORIGINS`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`
- `MONGODB_URI`
- `MONGODB_DB`
- Optional runtime usage in snapshot service:
  - `ML_SERVICE_URL`

### 4.3 Authentication and Authorization

Auth routes (`backend/src/routes/auth.ts`):
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout` (requires auth)
- `POST /api/v1/auth/signup` (SUPER_ADMIN)
- `POST /api/v1/auth/signup/public`

Auth implementation details:
- JWT access and refresh tokens via `backend/src/utils/jwt.ts`
- Refresh token rotation implemented in-memory in `authService`
- User identity includes `organizationId`
- `authenticate` middleware resolves token and fetches user from DB

RBAC policy map (`backend/src/middleware/rbac.ts`):
- Supports actions like `users:admin`, `risk:read`, `alerts:ack`, etc.
- Role enum from `backend/src/types/users.ts`

### 4.4 Backend Routes

Mounted at `/api/v1` from `backend/src/routes/index.ts`:

- `/auth`
- `/users`
- `/sensors`
- `/risk`
- `/evacuation`
- `/alerts`
- `/analytics`

Detailed behavior:

Users (`backend/src/routes/users.ts`):
- `GET /users/me` returns id, email, role, organizationId
- Additional admin placeholder endpoints exist for user management

Sensors (`backend/src/routes/sensors.ts`):
- Read/manage placeholders with policy checks (currently mostly TODO stubs)

Risk (`backend/src/routes/risk.ts`):
- `GET /risk/current`
- `GET /risk/timeline`
- `GET /risk/prediction`
- `GET /risk/incidents`
- All scoped by authenticated `organizationId`

Alerts (`backend/src/routes/alerts.ts`):
- `GET /alerts`
- `POST /alerts/:id/acknowledge`
- Both scoped by authenticated `organizationId`

Evacuation (`backend/src/routes/evacuation.ts`):
- Read/simulate recommendation placeholders

Analytics (`backend/src/routes/analytics.ts`):
- `GET /analytics/snapshots?filter=daily|weekly|monthly&date=YYYY-MM-DD`
- `GET /analytics/insight?filter=...&date=...`
- Aggregates MongoDB timeseries snapshots into chart points and summary
- Fully filtered by authenticated `organizationId`

### 4.5 Data Models

User model (`backend/src/models/user.ts`):
- Fields: `email`, `passwordHash`, `role`, `organizationId`, `createdAt`

Analytics snapshot model (`backend/src/models/analyticsSnapshot.ts`):
- Fields include `organizationId`, timestamp, risk/system metrics, zone metrics, trend, alert_count
- Timeseries schema with TTL (`expireAfterSeconds`: 30 days)

### 4.6 Core Services

Auth service (`backend/src/services/authService.ts`):
- Login, refresh, logout, signup, self-signup

User service (`backend/src/services/userService.ts`):
- Create/find users, password verification, public DTO mapping

Risk service (`backend/src/services/riskService.ts`):
- In-memory risk timeline store keyed by `organizationId`
- Event escalation triggers alerts

Alert service (`backend/src/services/alertService.ts`):
- In-memory alerts keyed by `organizationId`
- Supports list/ack + risk escalation and prediction alert generation

Snapshot service (`backend/src/services/snapshotService.ts`):
- Scheduled polling every 5 minutes
- Discovers known organization IDs from users
- Requests ML snapshot with `x-organization-id` header
- Persists org-specific snapshots in MongoDB
- Maintains org-scoped alert count buffer

ML client (`backend/src/services/mlClient.ts`):
- Mock crowd trend prediction helper used by risk route

### 4.7 Seed and Build

Analytics seed script:
- `backend/src/scripts/seedAnalytics.ts`
- Inserts 7-day synthetic snapshots for multiple organizations
- Uses `SEED_ORG_IDS` (comma-separated), default: `org_1,org_2`

Run seed:
- `cd backend && npx ts-node src/scripts/seedAnalytics.ts`

Build:
- `cd backend && npm run build`

## 5) ML Service Context (FastAPI/Python)

Entry point:
- `ml/main.py`

### 5.1 ML Service Endpoints

Dashboard routes (`ml/api/routes/dashboard.py`):
- `GET /dashboard/overview`
- `GET /dashboard/timeline`
- `GET /dashboard/flow`
- `GET /dashboard/alerts`
- `GET /dashboard/decision`
- `GET /dashboard/health`
- `GET /dashboard/hardware`
- `GET /dashboard/snapshot`
- `POST /dashboard/reset`

Prediction routes (`ml/api/routes/predict.py`):
- `POST /predict`

Telemetry routes (`ml/api/routes/telemetry.py`):
- `POST /api/v1/telemetry/sensor`
- `POST /api/v1/telemetry/camera`

### 5.2 ML Tenant Isolation (Important)

Organization context is extracted in `ml/utils/deps.py` via:
- `x-organization-id` header if present
- fallback decode from JWT payload (`organizationId`)
- fallback default `default-org`

In-memory store (`ml/storage/in_memory.py`) uses per-org dictionaries for:
- outputs
- alerts
- last inference timestamp
- hardware status snapshot

Aggregation service (`ml/services/aggregation_service.py`) is org-aware for:
- overview
- timeline
- flow
- alerts
- decision
- health

Routes pass org context into store/aggregation calls.

### 5.3 ML Schemas

Input schemas (`ml/api/schemas/input.py`):
- `PredictRequest` for zone/camera fused payloads
- telemetry payload schemas for sensor and camera endpoints

Output schemas (`ml/api/schemas/output.py`):
- predict response, dashboard cards, timeline points, flow points, alerts, decision, health

### 5.4 ML Dependencies

From `ml/requirements.txt`:
- FastAPI, uvicorn, pydantic
- requests
- numpy, opencv-python, ultralytics
- python-dotenv

### 5.5 ML Pipeline Packages

Under `ml/sentinel_ml/`:
- `pipeline.py`
- density classification
- risk assessment
- fusion and confidence modules
- temporal feature modeling
- IoT engine
- vision people counter
- contracts for standardized outputs

### 5.6 Hardware Live Runner

Runner file:
- `ml/run_hardware_live.py`

Behavior:
- Loads configuration via `python-dotenv` from `ml/.env`.
- Pulls camera frames from `ZONE_STREAM_URLS`.
- Pulls sensor validation scores from `ZONE_SENSOR_ENDPOINTS`.
- Posts fused payload to `ML_SERVICE_URL` (default `/predict`).
- Supports both CSV and JSON zone map formats:
  - CSV: `zone-1=http://...,zone-2=http://...`
  - JSON: `{"zone-1":"http://...","zone-2":"http://..."}`
- Falls back to hardcoded defaults if env variables are missing.

## 6) Frontend Context (React/Vite/TypeScript)

Entry point:
- `frontend/src/main.tsx`

Routing:
- `/` -> Landing
- `/login` -> Login
- `/signup` -> Signup
- `/dashboard` -> Protected dashboard
- `/analytics` -> Protected analytics page

Auth state:
- `frontend/src/context/AuthContext.tsx`
- stores `access_token` and `refresh_token` in localStorage
- profile fetch via `/users/me`

HTTP clients:
- `frontend/src/api/client.ts`: Node backend client (`/api/v1`), token attach + refresh interceptor
- `frontend/src/api/mlClient.ts`: direct ML service client (`http://localhost:8000` by default)

### 6.1 Dashboard

Main dashboard page:
- `frontend/src/pages/Dashboard.tsx`

Current tabs:
- OVERVIEW
- TELEMETRY
- OPERATIONS

Data source hook:
- `frontend/src/hooks/useMLDashboardData.ts`
- Poll interval default: 1500 ms
- Pulls from ML dashboard endpoints + decision/alerts/flow/timeline

Navbar actions:
- Link to `/analytics`
- Refresh
- Reset Data (`POST /dashboard/reset` through ML API)
- Logout

### 6.2 Analytics Page

Page file:
- `frontend/src/pages/Analytics.tsx`

API source:
- `frontend/src/api/analytics.ts` (backend analytics endpoints)

Filter modes:
- `daily`, `weekly`, `monthly`

Charts:
- Recharts components for risk trends, zone validation, alert bars

Header behavior:
- Wordmark "SENTINEL" clickable to logout and navigate to landing page

### 6.3 Landing and Visual System

Landing page:
- `frontend/src/pages/Landing.tsx`
- heavy motion/visual storytelling and sections for problem/solution/use-cases

Visual system includes:
- Aurora animated background (`frontend/src/components/Aurora.tsx`)
- custom fonts from `frontend/public/Performa-Font-Family`, `frontend/public/Plus_Jakarta_Sans`, `frontend/public/satoshi`

## 7) Environment Variables Across Services

Backend (`backend/.env`):
- See section 4.2

Frontend (`frontend/.env.local`):
- `VITE_API_BASE_URL` (default `/api/v1`)
- `VITE_ML_API_BASE_URL` (default `http://localhost:8000`)

ML (`ml/.env`):
- `ML_HOST`
- `ML_PORT`
- `CORS_ORIGINS`
- `LOG_LEVEL`
- `ML_SERVICE_URL`
- `ZONE_STREAM_URLS`
- `ZONE_SENSOR_ENDPOINTS`

Notes:
- `ZONE_STREAM_URLS` and `ZONE_SENSOR_ENDPOINTS` support CSV or JSON map format.
- Reference examples are in `ml/.env.example`.

## 8) Data Persistence and State Model

Persistent state:
- MongoDB users and analytics snapshots

Ephemeral state:
- Backend in-memory risk/alerts stores (org-scoped)
- ML in-memory outputs/hardware snapshots/alerts (org-scoped)
- Refresh token store in backend auth service is in-memory

Implications:
- Restarting backend clears in-memory risk/alerts and refresh token store.
- Restarting ML clears in-memory live dashboard state.
- Analytics historical data survives in MongoDB.

## 9) Tenant Isolation Summary

Goal implemented:
- Same organizationId users share dashboard/analytics context.
- Different organizationId users cannot access each other’s data context.

Backend isolation points:
- `alerts`, `risk`, `analytics` route filters use `req.user.organizationId`
- snapshot persistence writes per organization

ML isolation points:
- org context extraction from header/token
- all dashboard read/write aggregation and hardware status keyed by org
- `POST /dashboard/reset` resets only the calling organization context

## 10) Demo and PPT Presentation Context

### 10.1 Suggested Demo Narrative

1. Problem framing (crowd risk and delayed response)
2. System architecture overview
3. Live dashboard walkthrough
4. Telemetry and operations tab insights
5. Analytics historical view and generated insight text
6. Tenant isolation proof:
   - Login with account A (Org A), show data
   - Login with account B (Org B), show different data
   - Login with account C (Org A), show shared Org A data
7. Hardware + simulator integration
8. Close with roadmap and production hardening items

### 10.2 Suggested PPT Slide Outline

1. Title + team
2. Problem statement and impact metrics
3. Product vision
4. System architecture diagram
5. Backend and ML technical stack
6. Frontend UX and operator workflows
7. Data pipeline and inference flow
8. Security/RBAC and tenancy model
9. Demo screenshots (overview, telemetry, operations, analytics)
10. Validation/testing strategy
11. Current limitations
12. Roadmap (scalability, persistence hardening, deployment)

### 10.3 Demo Talking Points (Technical)

- Real-time vs historical split:
  - Live telemetry from ML in-memory endpoints
  - Historical analytics from MongoDB snapshots
- JWT auth and role-based policies
- Organization-level data boundaries
- 5-minute backend snapshot scheduler as persistence bridge

## 11) Known Limitations and Technical Debt

- Several endpoints are placeholders (`sensors`, `evacuation`, partial `users` admin operations).
- Refresh token store is in-memory (not durable).
- Risk/alerts backend stores are in-memory (not durable).
- Legacy temporary fix scripts were removed; `.gitignore` now blocks common one-off `fix_*`/`update_*` helper scripts to keep scaffold clean.
- Frontend bundle warning indicates large chunk sizes after build.

## 12) AI Agent Handoff Guidance

Use this as operating guidance for any coding agent:

1. Treat this as a monorepo with 3 independently runnable services.
2. Verify which API source is used before editing features:
   - Analytics page -> backend `/api/v1/analytics/*`
   - Dashboard live cards -> ML `/dashboard/*`
3. Preserve tenant isolation on all new data paths.
4. Preserve RBAC policies for sensitive actions.
5. When adding persistence, decide clearly:
   - MongoDB (durable)
   - in-memory (ephemeral)
6. After changes, run:
   - `cd backend && npm run build`
   - `cd frontend && npm run build`
   - Python syntax checks for modified ML modules
7. Python environment discipline:
  - Always use `ml/venv`; do not introduce a root `.venv` for this repo.

## 13) Endpoints Quick Reference

Backend API base: `/api/v1`

- Auth
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `POST /auth/signup`
  - `POST /auth/signup/public`
- Users
  - `GET /users/me`
  - `GET /users/:id`
  - `PUT /users/:id`
  - `GET /users/:id/roles`
- Alerts
  - `GET /alerts`
  - `POST /alerts/:id/acknowledge`
- Risk
  - `GET /risk/current`
  - `GET /risk/timeline`
  - `GET /risk/prediction`
  - `GET /risk/incidents`
- Analytics
  - `GET /analytics/snapshots`
  - `GET /analytics/insight`
- Sensors
  - `GET /sensors`
  - `GET /sensors/:id`
  - `POST /sensors/register`
  - `PUT /sensors/:id/status`
- Evacuation
  - `GET /evacuation/routes`
  - `POST /evacuation/simulate`
  - `GET /evacuation/recommendation`

ML API base: `/`

- Dashboard
  - `GET /dashboard/overview`
  - `GET /dashboard/timeline`
  - `GET /dashboard/flow`
  - `GET /dashboard/alerts`
  - `GET /dashboard/decision`
  - `GET /dashboard/health`
  - `GET /dashboard/hardware`
  - `GET /dashboard/snapshot`
  - `POST /dashboard/reset`
- Prediction
  - `POST /predict`
- Telemetry
  - `POST /api/v1/telemetry/sensor`
  - `POST /api/v1/telemetry/camera`

## 14) Complete File Inventory (Tracked Paths via `rg --files`)

Note:
- This inventory reflects repository paths returned by `rg --files` (hidden dotfiles are excluded).

- README.md
- package.json
- PROJECT_CONTEXT.md
- ml/run_hardware_live.py
- ml/services/aggregation_service.py
- ml/services/__init__.py
- ml/services/ml_service.py
- ml/sentinel_ml/inputs/schemas.py
- ml/sentinel_ml/inputs/__init__.py
- hardware/zone_sensor_esp32.ino
- hardware/README.md
- hardware/zone1_esp32cam.ino
- ml/sentinel_ml/risk/__init__.py
- ml/sentinel_ml/risk/assessor.py
- ml/sentinel_ml/outputs/contracts.py
- ml/sentinel_ml/outputs/__init__.py
- ml/sentinel_ml/pipeline.py
- ml/sentinel_ml/fusion/confidence_fuser.py
- ml/sentinel_ml/fusion/__init__.py
- ml/main.py
- ml/test_integration.py
- backend/src/services/mlClient.ts
- backend/src/services/riskService.ts
- backend/src/services/userService.ts
- backend/src/services/authService.ts
- backend/src/services/snapshotService.ts
- backend/src/services/alertService.ts
- frontend/src/pages/Landing.tsx
- frontend/src/pages/Analytics.tsx
- frontend/src/pages/Signup.tsx
- frontend/src/pages/Dashboard.tsx
- frontend/src/pages/Login.tsx
- ml/sentinel_ml/iot/engine.py
- ml/sentinel_ml/iot/__init__.py
- backend/src/routes/alerts.ts
- backend/src/routes/auth.ts
- backend/src/routes/sensors.ts
- backend/src/routes/index.ts
- backend/src/routes/users.ts
- backend/src/routes/evacuation.ts
- backend/src/routes/risk.ts
- backend/src/routes/analytics.ts
- backend/src/index.ts
- ml/sentinel_ml/decisions/engine.py
- ml/sentinel_ml/decisions/__init__.py
- backend/src/scripts/seedAnalytics.ts
- frontend/src/assets/sentinel-backdrop.png
- frontend/src/assets/sentinel-advantage.png
- frontend/src/assets/sentinel-main.png
- frontend/src/assets/problem-stampedes.png
- frontend/src/assets/problem-initial.png
- frontend/src/assets/problem-injuries.png
- frontend/src/assets/problem-fire.png
- backend/src/models/analyticsSnapshot.ts
- backend/src/models/user.ts
- ml/api/routes/dashboard.py
- ml/api/routes/telemetry.py
- ml/api/routes/__init__.py
- ml/api/routes/predict.py
- ml/sentinel_ml/vision/__init__.py
- ml/sentinel_ml/vision/people_counter.py
- backend/src/utils/response.ts
- backend/src/utils/logger.ts
- backend/src/utils/password.ts
- backend/src/utils/jwt.ts
- frontend/src/api/mlClient.ts
- frontend/src/api/client.ts
- frontend/src/api/dashboard.ts
- frontend/src/api/analytics.ts
- ml/api/schemas/output.py
- ml/api/schemas/input.py
- ml/api/schemas/__init__.py
- ml/api/__init__.py
- ml/sentinel_ml/utils/smoothing.py
- ml/sentinel_ml/utils/time_utils.py
- ml/sentinel_ml/utils/__init__.py
- ml/sentinel_ml/__init__.py
- backend/src/config/db.ts
- backend/src/config/env.ts
- frontend/src/hooks/useMLDashboardData.ts
- frontend/src/vite-env.d.ts
- ml/storage/in_memory.py
- ml/storage/__init__.py
- ml/example_usage.py
- ml/sentinel_ml/density/__init__.py
- backend/src/types/auth.ts
- ml/sentinel_ml/density/classifier.py
- ml/utils/deps.py
- ml/test_hardware_simulator.py
- backend/src/types/users.ts
- ml/yolov8n.pt
- ml/requirements.txt
- frontend/src/components/TiltedCard.css
- frontend/src/components/ShinyText.css
- frontend/src/components/SpotlightCard.tsx
- frontend/src/components/ScrollFloat.tsx
- frontend/src/components/TextType.tsx
- frontend/src/components/ScrollFloat.css
- frontend/src/components/TextType.css
- ml/sentinel_ml/features/temporal_model.py
- ml/sentinel_ml/features/__init__.py
- frontend/src/styles.css
- ml/sentinel_ml/sensors/interpreter.py
- backend/src/middleware/auth.ts
- ml/sentinel_ml/sensors/__init__.py
- frontend/package.json
- frontend/package-lock.json
- frontend/src/context/AuthContext.tsx
- frontend/src/components/ml/Skeleton.tsx
- frontend/src/components/ml/ZoneMapPanel.tsx
- frontend/src/components/ml/AlertsPanel.tsx
- frontend/src/components/ml/FlowChart.tsx
- frontend/src/components/ml/CombinedRiskDensityCard.tsx
- frontend/src/components/ml/RiskTimelineChart.tsx
- frontend/src/components/ml/RiskScoreIndicator.tsx
- frontend/src/components/ml/MLInsightsPanel.tsx
- frontend/src/components/ml/CrowdDensityCard.tsx
- frontend/src/components/ml/EvacuationDecisionPanel.tsx
- frontend/src/components/ml/CameraFeedPanel.tsx
- backend/src/middleware/requestContext.ts
- backend/src/middleware/rbac.ts
- backend/src/middleware/errorHandler.ts
- frontend/src/components/TiltedCard.tsx
- frontend/src/components/ShinyText.tsx
- frontend/src/components/SpotlightCard.css
- frontend/src/components/StatisticsCarousel.css
- frontend/src/components/AboutUs.css
- frontend/src/components/Aurora.tsx
- frontend/src/components/AboutUs.tsx
- frontend/src/components/Aurora.css
- frontend/src/components/ProtectedRoute.tsx
- frontend/src/components/SplitText.tsx
- frontend/src/components/StatisticsCarousel.tsx
- backend/tsconfig.json
- backend/package.json
- backend/package-lock.json
- backend/import-map.cjs
- frontend/tsconfig.node.json
- frontend/index.html
- frontend/vite.config.ts
- frontend/tsconfig.json
- frontend/src/main.tsx
- frontend/src/types/ml.ts
- frontend/src/types/ogl.d.ts
- backend/docs/openapi.yaml
- frontend/public/Plus_Jakarta_Sans/PlusJakartaSans-VariableFont_wght.ttf
- frontend/public/Plus_Jakarta_Sans/README.txt
- frontend/public/Plus_Jakarta_Sans/OFL.txt
- frontend/public/satoshi/Satoshi-Medium.otf
- frontend/public/satoshi/Satoshi-MediumItalic.otf
- frontend/public/satoshi/Satoshi-BlackItalic.otf
- frontend/public/satoshi/Satoshi-LightItalic.otf
- frontend/public/satoshi/Satoshi-Light.otf
- frontend/public/satoshi/Satoshi-BoldItalic.otf
- frontend/public/satoshi/Satoshi-Regular.otf
- frontend/public/satoshi/Satoshi-Black.otf
- frontend/public/satoshi/Satoshi-Italic.otf
- frontend/public/satoshi/Satoshi-Bold.otf
- frontend/public/Plus_Jakarta_Sans/PlusJakartaSans-Italic-VariableFont_wght.ttf
- frontend/public/Plus_Jakarta_Sans/static/PlusJakartaSans-BoldItalic.ttf
- frontend/public/Plus_Jakarta_Sans/static/PlusJakartaSans-Italic.ttf
- frontend/public/Plus_Jakarta_Sans/static/PlusJakartaSans-ExtraBold.ttf
- frontend/public/Plus_Jakarta_Sans/static/PlusJakartaSans-ExtraLight.ttf
- frontend/public/Plus_Jakarta_Sans/static/PlusJakartaSans-Bold.ttf
- frontend/public/Plus_Jakarta_Sans/static/PlusJakartaSans-LightItalic.ttf
- frontend/public/Plus_Jakarta_Sans/static/PlusJakartaSans-Regular.ttf
- frontend/public/Plus_Jakarta_Sans/static/PlusJakartaSans-ExtraLightItalic.ttf
- frontend/public/Plus_Jakarta_Sans/static/PlusJakartaSans-SemiBoldItalic.ttf
- frontend/public/Plus_Jakarta_Sans/static/PlusJakartaSans-SemiBold.ttf
- frontend/public/Plus_Jakarta_Sans/static/PlusJakartaSans-ExtraBoldItalic.ttf
- frontend/public/Plus_Jakarta_Sans/static/PlusJakartaSans-Medium.ttf
- frontend/public/Plus_Jakarta_Sans/static/PlusJakartaSans-Light.ttf
- frontend/public/Plus_Jakarta_Sans/static/PlusJakartaSans-MediumItalic.ttf
- frontend/public/Performa-Font-Family/performa-cm-thin.ttf
- frontend/public/Performa-Font-Family/performa-ex-thin.ttf
- frontend/public/Performa-Font-Family/performa-nr-medium.ttf
- frontend/public/Performa-Font-Family/performa-black.ttf
- frontend/public/Performa-Font-Family/performa-extrabold.ttf
- frontend/public/Performa-Font-Family/performa-nr-extrabold.ttf
- frontend/public/Performa-Font-Family/performa-wide-medium.ttf
- frontend/public/Performa-Font-Family/performa-nr-bold.ttf
- frontend/public/Performa-Font-Family/performa-cm-black.ttf
- frontend/public/Performa-Font-Family/performa-cm-extrabold.ttf
- frontend/public/Performa-Font-Family/performa-ex.ttf
- frontend/public/Performa-Font-Family/performa-nr-extlt.ttf
- frontend/public/Performa-Font-Family/performa-cn-semibold.ttf
- frontend/public/Performa-Font-Family/performa-ex-light.ttf
- frontend/public/Performa-Font-Family/performa-wide-light.ttf
- frontend/public/Performa-Font-Family/performa-ex-extrabold.ttf
- frontend/public/Performa-Font-Family/performa-cn-extrabold.ttf
- frontend/public/Performa-Font-Family/performa-nr-thin.ttf
- frontend/public/Performa-Font-Family/performa-wide-extrabold.ttf
- frontend/public/Performa-Font-Family/performa-medium.ttf
- frontend/public/Performa-Font-Family/performa-ex-bold.ttf
- frontend/public/Performa-Font-Family/performa-cm-medium.ttf
- frontend/public/Performa-Font-Family/performa-cm-bold.ttf
- frontend/public/Performa-Font-Family/performa-cn.ttf
- frontend/public/Performa-Font-Family/performa-cm-extlt.ttf
- frontend/public/Performa-Font-Family/performa-cm-lt.ttf
- frontend/public/Performa-Font-Family/performa-regular.ttf
- frontend/public/Performa-Font-Family/performa-cm.ttf
- frontend/public/Performa-Font-Family/performa-cn-extlt.ttf
- frontend/public/Performa-Font-Family/performa-ex-semibold.ttf
- frontend/public/Performa-Font-Family/performa-cn-bold.ttf
- frontend/public/Performa-Font-Family/performa-extlt.ttf
- frontend/public/Performa-Font-Family/performa-ex-extlt.ttf
- frontend/public/Performa-Font-Family/performa-nr-black.ttf
- frontend/public/Performa-Font-Family/performa-nr-light.ttf
- frontend/public/Performa-Font-Family/performa-wide-extlt.ttf
- frontend/public/Performa-Font-Family/performa-wide-thin.ttf
- frontend/public/Performa-Font-Family/performa-semibold.ttf
- frontend/public/Performa-Font-Family/performa-wide-bold.ttf
- frontend/public/Performa-Font-Family/performa-cn-thin.ttf
- frontend/public/Performa-Font-Family/performa-nr.ttf
- frontend/public/Performa-Font-Family/performa-ex-medium.ttf
- frontend/public/Performa-Font-Family/performa-ex-black.ttf
- frontend/public/Performa-Font-Family/performa-wide-black.ttf
- frontend/public/Performa-Font-Family/performa-nr-semibold.ttf
- frontend/public/Performa-Font-Family/performa-bold.ttf
- frontend/public/Performa-Font-Family/performa-wide-semibold.ttf
- frontend/public/Performa-Font-Family/performa-cn-medium.ttf
- frontend/public/Performa-Font-Family/performa-cn-black.ttf
- frontend/public/Performa-Font-Family/performa-wide.ttf
- frontend/public/Performa-Font-Family/performa-light.ttf
- frontend/public/Performa-Font-Family/performa-thin.ttf
- frontend/public/Performa-Font-Family/performa-cn-lt.ttf
- frontend/public/Performa-Font-Family/performa-cm-semibold.ttf
