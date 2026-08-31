@echo off
title SSS v.56964 — Environment & Dependencies Checker
cd /d "%~dp0"
echo =========================================================================
echo       SSS v.56964 — NATIVE MOBILE ENVIRONMENT CHECKER
echo              Santo Stark Studio Production Toolchain
echo =========================================================================
echo.

echo [1/3] Checking Node.js (For Cloud Fleet Server)...
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Node.js is installed:
    node -v
) else (
    echo   [MISSING] Node.js is not found.
    echo   Download Node.js from: https://nodejs.org/
)
echo.

echo [2/3] Checking Flutter SDK (For Mobile Native App)...
where flutter >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Flutter SDK is installed:
    flutter --version
) else (
    echo   [MISSING] Flutter SDK is not found in PATH.
    echo   Download Flutter from: https://docs.flutter.dev/get-started/install/windows/mobile
)
echo.

echo [3/3] Checking Android ADB / Java SDK...
where adb >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Android Tools found:
    adb --version
) else (
    echo   [NOTE] Android SDK will be provided by Android Studio.
    echo   Download Android Studio from: https://developer.android.com/studio
)
echo.
echo =========================================================================
echo Refer to 'SETUP_AND_DEPENDENCIES_GUIDE.md' for full instructions.
echo =========================================================================
pause
