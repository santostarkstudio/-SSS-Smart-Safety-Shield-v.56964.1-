@echo off
title AuraFarming Auto-Editor - Setup
echo ========================================================
echo       AuraFarming Auto-Editor - Dependency & Audio Setup
echo ========================================================
echo.
echo 1. Installing Python libraries (Flask, opencv-python, numpy, Pillow, imageio-ffmpeg)...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
echo.
echo 2. Converting MP4 soundtracks to high-fidelity audio tracks (WAV)...
python extract_audio.py
echo.
echo ========================================================
echo Setup complete! Both Desktop and Web versions are ready:
echo.
echo  - Launch Web App:     run_web.bat  (or python app.py)
echo  - Launch Desktop App: run.bat      (or python face_monitor.py)
echo ========================================================
pause
