@echo off
setlocal enabledelayedexpansion
title Push SSS to GitHub - Santo Stark Studio
color 0b

echo ==============================================================================
echo   SSS: Smart Safety Shield (v.56964.1) - GitHub Push Utility
echo   Santo Stark Studio (SSS)
echo ==============================================================================
echo.
echo Target GitHub Repository:
echo   https://github.com/santostarkstudio/-SSS-Smart-Safety-Shield-v.56964.1-.git
echo.

:: Locate git binary
set "GIT_EXE=git"
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "C:\Program Files\Git\cmd\git.exe" (
        set "GIT_EXE=C:\Program Files\Git\cmd\git.exe"
    ) else if exist "C:\Program Files\Git\bin\git.exe" (
        set "GIT_EXE=C:\Program Files\Git\bin\git.exe"
    ) else if exist "C:\Program Files (x86)\Git\cmd\git.exe" (
        set "GIT_EXE=C:\Program Files (x86)\Git\cmd\git.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" (
        set "GIT_EXE=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
    ) else (
        echo [ERROR] Git was not found in standard paths.
        echo Please download and install Git from: https://git-scm.com/downloads
        echo.
        pause
        exit /b 1
    )
)

echo Using Git: "%GIT_EXE%"
echo.

:: Abort any lingering rebase or merge conflicts
"%GIT_EXE%" rebase --abort 2>nul
"%GIT_EXE%" merge --abort 2>nul

echo [1/4] Configuring Git Identity...
"%GIT_EXE%" config user.name "Santos Stark"
"%GIT_EXE%" config user.email "santostarkstudio@gmail.com"

echo.
echo [2/4] Staging and Committing all Project Files...
"%GIT_EXE%" add .
"%GIT_EXE%" commit -m "feat: SSS v.56964.1 (Smart Safety Shield) - Core Engine, PRD, README and GNU GPL-3.0 License" 2>nul
"%GIT_EXE%" branch -M main

echo.
echo [3/4] Linking Remote Repository...
"%GIT_EXE%" remote remove origin 2>nul
"%GIT_EXE%" remote add origin https://github.com/santostarkstudio/-SSS-Smart-Safety-Shield-v.56964.1-.git

echo.
echo [4/4] Pushing to GitHub (Overwriting initial placeholder)...
"%GIT_EXE%" push -u origin main --force

if %ERRORLEVEL% equ 0 (
    echo.
    echo ==============================================================================
    echo   [SUCCESS] Successfully pushed SSS v.56964.1 to GitHub!
    echo   View online: https://github.com/santostarkstudio/-SSS-Smart-Safety-Shield-v.56964.1-
    echo ==============================================================================
) else (
    echo.
    echo [NOTE] If a browser window opened to Sign In to GitHub, please complete the login!
)

echo.
pause
