@echo off
setlocal enabledelayedexpansion
title SENTINEL Startup

echo.
echo ==========================================
echo     SENTINEL -- Startup
echo ==========================================
echo.

:: Step 1: Seed prompt
echo [?] Seed 90 days of demo analytics data?
set /p SEED_ANS="    Type Y to seed, N to skip [Y/n]: "
if /i "!SEED_ANS!"=="Y" (
  echo [SENTINEL] Running seed script...
  cd backend
  call npx ts-node src/scripts/seedAnalytics.ts
  echo [OK] Seed complete.
  cd ..
) else (
  echo [OK] Skipping seed.
)

:: Step 2: Hardware prompt
echo.
echo [?] Start hardware live runner?
set /p HW_ANS="    Type Y to start, N to skip [Y/n]: "

:: Step 3: Launch services in separate windows
echo.
echo [SENTINEL] Starting ML Service...
start "SENTINEL - ML Service" cmd /k "cd ml && venv\Scripts\activate && python main.py"
timeout /t 3 /nobreak >nul

if /i "!HW_ANS!"=="Y" (
  echo [SENTINEL] Starting Hardware Runner...
  start "SENTINEL - Hardware" cmd /k "cd ml && venv\Scripts\activate && python run_hardware_live.py"
)

echo [SENTINEL] Starting Backend...
start "SENTINEL - Backend" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak >nul

echo [SENTINEL] Starting Frontend...
start "SENTINEL - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo  All services launched in separate windows
echo  Frontend  : http://localhost:5173
echo  Backend   : http://localhost:4000
echo  ML API    : http://localhost:8000
echo ==========================================
echo.
pause
