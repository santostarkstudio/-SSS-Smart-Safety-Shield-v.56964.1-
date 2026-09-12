@echo off
title SSS Smart Safety Shield - Local Server
color 0A
echo.
echo  =======================================================================
echo        SSS v.56964 - SMART SAFETY SHIELD  (Local Dev Server)
echo        Santo Stark Studio  | localhost:8080
echo  =======================================================================
echo.
echo  [*] Starting local server on http://localhost:8080
echo  [*] Features: PWA, Battery API, Geolocation, Weather, Voice
echo.
cd /d "%~dp0"
python -m http.server 8080 &
timeout /t 2 /nobreak > nul
start "" "http://localhost:8080"
echo  [OK] SSS running at http://localhost:8080
pause
