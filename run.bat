@echo off
title AuraFarming Auto-Editor
echo ========================================================
echo             AuraFarming Auto-Editor
echo ========================================================
echo.
echo Launching AuraFarming Face Monitor and Cinematic Editor...
python face_monitor.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Application exited with an error.
    pause
)
