@echo off
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

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in your system PATH.
    echo Please download and install Git from: https://git-scm.com/downloads
    echo.
    pause
    exit /b 1
)

echo [1/5] Checking Git Author Identity...
for /f "tokens=*" %%i in ('git config user.name 2^>nul') do set GIT_USER_NAME=%%i
for /f "tokens=*" %%i in ('git config user.email 2^>nul') do set GIT_USER_EMAIL=%%i

if "%GIT_USER_NAME%"=="" (
    echo Setting default Git Name: Santos Stark
    git config user.name "Santos Stark"
) else (
    echo Git Name: %GIT_USER_NAME%
)

if "%GIT_USER_EMAIL%"=="" (
    echo Setting default Git Email: santostarkstudio@gmail.com
    git config user.email "santostarkstudio@gmail.com"
) else (
    echo Git Email: %GIT_USER_EMAIL%
)

echo.
echo [2/5] Checking Git repository initialization...
if not exist ".git" (
    echo Initializing fresh Git repository...
    git init
)

echo.
echo [3/5] Staging all project files (README, PRD, LICENSE, SSS Apps)...
git add .

echo.
echo [4/5] Creating commit...
git commit -m "feat: SSS v.56964.1 (Smart Safety Shield) - Core Engine, PRD, README and GNU GPL-3.0 License"
git branch -M main

echo.
echo [5/5] Setting remote and pushing to GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/santostarkstudio/-SSS-Smart-Safety-Shield-v.56964.1-.git

echo Pushing to branch main...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ==============================================================================
    echo   [SUCCESS] Successfully pushed SSS v.56964.1 to GitHub!
    echo   View online: https://github.com/santostarkstudio/-SSS-Smart-Safety-Shield-v.56964.1-
    echo ==============================================================================
) else (
    echo.
    echo [NOTE] If GitHub rejected the push because the remote repository was initialized with files,
    echo syncing and pushing now...
    git pull origin main --rebase --allow-unrelated-histories 2>nul
    git push -u origin main
    if %errorlevel% equ 0 (
        echo.
        echo ==============================================================================
        echo   [SUCCESS] Successfully pushed SSS v.56964.1 to GitHub!
        echo   View online: https://github.com/santostarkstudio/-SSS-Smart-Safety-Shield-v.56964.1-
        echo ==============================================================================
    ) else (
        echo.
        echo [INFO] If it opened a browser window to Sign In to GitHub, please complete the sign in!
    )
)

echo.
pause
