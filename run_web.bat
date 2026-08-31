@echo off
title AuraFarming Auto-Editor — Web Server
cd /d "%~dp0"
echo ========================================================
echo       AuraFarming Auto-Editor — Web Application
echo ========================================================
echo.
echo 1. Checking and preparing Python environment...
python -m pip install flask opencv-python numpy Pillow imageio-ffmpeg --quiet

echo.
echo 2. Launching AuraFarming Web Server...
echo Web Dashboard URL: http://localhost:5000
echo.

start "" "http://localhost:5000"

python app.py
if errorlevel 1 (
    echo.
    echo ========================================================
    echo Server stopped or encountered an issue.
    echo ========================================================
)
pause
