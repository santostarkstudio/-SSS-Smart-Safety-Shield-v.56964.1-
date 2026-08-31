@echo off
title SSS v.56964 — Smart Safety Shield (Santo Stark Studio)
cd /d "%~dp0"
echo =========================================================================
echo       SSS v.56964 — SMART SAFETY SHIELD (SANTO STARK STUDIO)
echo =========================================================================
echo.
echo Launching SSS v.56964 Prototype in your default browser...
echo.

start "" "%~dp0sss_app\index.html"

echo SSS v.56964 is running.
echo You can test:
echo  1. The Big Red SSS Button (Audio Siren + Flashing CPR Screen)
echo  2. Live ECG & Vitals Monitor
echo  3. 10-Minute Delivery Fleet Radar
echo  4. Bike Handlebar BLE Clicker simulation
echo  5. Safe Practice Drill mode
echo.
echo Press any key to exit this launcher window.
pause >nul
