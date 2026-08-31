@echo off
title SSS v.56964 — Android APK Builder
cd /d "%~dp0sss_flutter"
echo =========================================================================
echo       BUILDING SSS v.56964 PRODUCTION ANDROID APK (RELEASE)
echo =========================================================================
echo.

where flutter >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Flutter SDK not detected in PATH.
    echo Please install Flutter and add it to PATH before running this build script.
    echo See 'SETUP_AND_DEPENDENCIES_GUIDE.md' for help.
    pause
    exit /b 1
)

echo 1. Fetching Flutter Dependencies...
flutter pub get

echo.
echo 2. Compiling Release APK...
flutter build apk --release

if %errorlevel% equ 0 (
    echo.
    echo =========================================================================
    echo [SUCCESS] APK BUILD COMPLETE!
    echo Location: sss_flutter\build\app\outputs\flutter-apk\app-release.apk
    echo =========================================================================
) else (
    echo.
    echo [ERROR] Build encountered an issue. Check Android SDK setup.
)

pause
