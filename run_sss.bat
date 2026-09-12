@echo off
title SSS v.56964 — SMART SAFETY SHIELD (SANTO STARK STUDIO)
color 0A
cls
echo =========================================================================
echo       SSS v.56964 — SMART SAFETY SHIELD (SANTO STARK STUDIO)
echo       Santos Stark Studio  ^|  Autonomous Cardiac Emergency System
echo =========================================================================
echo.
echo  [1/3] Starting SSS Emergency Backend (WebSocket + Fleet Dispatch on :8080)...
start "SSS Backend :8080" cmd /k "cd /d "%~dp0sss_backend" && node server.js"

echo  [2/3] Starting SSS Web App (Frontend on :3000)...
timeout /t 2 /nobreak > nul
start "SSS Frontend :3000" cmd /k "cd /d "%~dp0sss_app" && python -m http.server 3000"

echo  [3/3] Opening SSS in your browser...
timeout /t 2 /nobreak > nul
start "" "http://localhost:3000"

echo.
echo =========================================================================
echo  SSS IS FULLY RUNNING!
echo.
echo  Patient App:       http://localhost:3000
echo  Guardian Portal:   http://localhost:8080
echo  Backend Health:    http://localhost:8080/api/health
echo =========================================================================
echo.
echo  Press any key to exit this launcher window (servers remain running).
pause >nul
