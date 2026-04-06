# SENTINEL

**Intelligent Crowd Monitoring & Emergency Response System**

A full-stack application for real-time crowd density monitoring, risk assessment, and evacuation decision support using ML-powered analytics.

## Architecture

```
sentinel/
├── backend/          # Node.js/Express API server (Port 4000)
├── frontend/         # React + Vite SPA (Port 5173)
└── ml/               # Python FastAPI ML service (Port 8000)
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- MongoDB instance (local or Atlas)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm install
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env.local
# Edit if needed (defaults work for local development)
npm install
npm run dev
```

### 3. ML Service Setup

```bash
cd ml
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

## Services

| Service   | URL                     | Description                        |
|-----------|-------------------------|------------------------------------|
| Frontend  | http://localhost:5173   | React dashboard                    |
| Backend   | http://localhost:4000   | Express REST API                   |
| ML API    | http://localhost:8000   | FastAPI ML prediction service      |
| API Docs  | http://localhost:4000/docs | Swagger UI                       |

## Development

### Running All Services

Open three terminal windows and run each service:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - ML Service
cd ml && source venv/bin/activate && python main.py
```

### Building for Production

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

## API Overview

### Backend Endpoints

- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/users` - List users (admin)
- `GET /api/v1/alerts` - Get active alerts
- `GET /api/v1/risk` - Get risk assessments
- `GET /api/v1/sensors` - Get sensor data
- `GET /api/v1/evacuation` - Get evacuation status

### ML Endpoints

- `POST /predict` - Get ML predictions
- `POST /telemetry` - Submit sensor telemetry
- `GET /dashboard` - Get aggregated dashboard data

## Environment Variables

See `.env.example` files in each service directory for required configuration.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, TypeScript, MongoDB/Mongoose
- **ML Service**: Python, FastAPI, NumPy, OpenCV

## License

Private - All rights reserved.
