@echo off
title SSS v.56964 — Install on Smartphone Server
cd /d "%~dp0"
echo =========================================================================
echo       LAUNCHING SSS PHONE INSTALLATION SERVER
echo =========================================================================
echo.

python sss_server.py
if errorlevel 1 (
    echo.
    echo Python was not found. Opening app locally in default browser...
    start "" "%~dp0sss_app\index.html"
    pause
)
