#!/bin/bash
set -e

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# -- Helpers -------------------------------------------------
log()  { echo -e "\033[1;36m[SENTINEL]\033[0m $1"; }
ok()   { echo -e "\033[1;32m[OK]\033[0m $1"; }
warn() { echo -e "\033[1;33m[!]\033[0m $1"; }
ask()  { read -r -p "$(echo -e "\033[1;35m[?]\033[0m $1 [Y/n]: ")" ans; [[ "$ans" =~ ^[Nn]$ ]] && return 1 || return 0; }

echo ""
echo -e "\033[1;37m========================================\033[0m"
echo -e "\033[1;37m   SENTINEL - Startup v2.0\033[0m"
echo -e "\033[1;37m========================================\033[0m"
echo ""

# -- Step 1: Seed prompt ------------------------------------
log "Checking analytics database..."

SEED_CHECK=$(cd "$REPO/backend" && node --input-type=module <<'NODE' 2>/dev/null || echo "0"
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const rawUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "sentinel";

let mongoUri = rawUri;
try {
  const parsed = new URL(rawUri);
  if (!parsed.pathname || parsed.pathname === "/") {
    parsed.pathname = `/${dbName}`;
  }
  mongoUri = parsed.toString();
} catch {
  mongoUri = rawUri.endsWith("/") ? `${rawUri}${dbName}` : `${rawUri}/${dbName}`;
}

try {
  await mongoose.connect(mongoUri);
  const col = mongoose.connection.db.collection("analyticsnapshots");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = await col.countDocuments({ dataSource: "seed", timestamp: { $lt: today } });
  console.log(count);
} catch {
  console.log("0");
} finally {
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect failures in quick check
  }
}
NODE
)

if [[ "$SEED_CHECK" -gt "0" ]]; then
  warn "Historical seed data found ($SEED_CHECK records)."
  if ask "Re-run seed? (This replaces historical data but preserves today's hardware data)"; then
    log "Seeding analytics data..."
    cd "$REPO/backend" && npx ts-node src/scripts/seedAnalytics.ts --force
    ok "Seed complete."
  else
    ok "Skipping seed. Existing historical data preserved."
  fi
else
  warn "No historical seed data found."
  if ask "Seed 90 days of demo analytics data?"; then
    log "Seeding analytics data (90 days x 5min intervals)..."
    cd "$REPO/backend" && npx ts-node src/scripts/seedAnalytics.ts
    ok "Seed complete."
  else
    ok "Skipping seed. Analytics will show only live hardware data."
  fi
fi

# -- Step 2: Hardware runner prompt -------------------------
echo ""
if ask "Start hardware live runner? (requires ESP32 devices connected to WiFi)"; then
  RUN_HARDWARE=true
else
  RUN_HARDWARE=false
  warn "Hardware runner skipped. Use Admin panel or simulator to generate live data."
fi

# -- Step 3: Launch services --------------------------------
echo ""
log "Starting services..."

# ML Service
log "Starting ML Service (port 8000)..."
cd "$REPO/ml"
source venv/bin/activate
python main.py > /tmp/sentinel-ml.log 2>&1 &
ML_PID=$!
ok "ML Service started (PID $ML_PID) - logs: /tmp/sentinel-ml.log"
sleep 3

# Hardware runner (conditional)
if [[ "$RUN_HARDWARE" == "true" ]]; then
  log "Starting Hardware Live Runner..."
  cd "$REPO/ml"
  source venv/bin/activate
  python run_hardware_live.py > /tmp/sentinel-hw.log 2>&1 &
  HW_PID=$!
  ok "Hardware runner started (PID $HW_PID) - logs: /tmp/sentinel-hw.log"
fi

# Backend
log "Starting Backend API (port 4000)..."
cd "$REPO/backend"
npm run dev > /tmp/sentinel-backend.log 2>&1 &
BACKEND_PID=$!
ok "Backend started (PID $BACKEND_PID) - logs: /tmp/sentinel-backend.log"
sleep 2

# Frontend
log "Starting Frontend (port 5173)..."
cd "$REPO/frontend"
npm run dev > /tmp/sentinel-frontend.log 2>&1 &
FRONTEND_PID=$!
ok "Frontend started (PID $FRONTEND_PID) - logs: /tmp/sentinel-frontend.log"

# -- Summary -------------------------------------------------
echo ""
echo -e "\033[1;32m========================================\033[0m"
echo -e "\033[1;32m  SENTINEL is running\033[0m"
echo -e "\033[1;32m----------------------------------------\033[0m"
echo -e "\033[1;32m  Frontend  -> http://localhost:5173\033[0m"
echo -e "\033[1;32m  Backend   -> http://localhost:4000\033[0m"
echo -e "\033[1;32m  ML API    -> http://localhost:8000\033[0m"
echo -e "\033[1;32m========================================\033[0m"
echo ""
echo -e "\033[0;90mLogs: /tmp/sentinel-*.log\033[0m"
echo -e "\033[0;90mPress Ctrl+C to stop all services.\033[0m"
echo ""

# -- Trap Ctrl+C --------------------------------------------
stop_all() {
  echo ""
  log "Shutting down SENTINEL..."
  kill "$ML_PID" "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  [[ -n "$HW_PID" ]] && kill "$HW_PID" 2>/dev/null || true
  ok "All services stopped."
  exit 0
}
trap stop_all INT

# -- Live log tail ------------------------------------------
if [[ "$RUN_HARDWARE" == "true" ]]; then
  tail -f /tmp/sentinel-ml.log /tmp/sentinel-hw.log /tmp/sentinel-backend.log /tmp/sentinel-frontend.log 2>/dev/null &
else
  tail -f /tmp/sentinel-ml.log /tmp/sentinel-backend.log /tmp/sentinel-frontend.log 2>/dev/null &
fi
wait
