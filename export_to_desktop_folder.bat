@echo off
title Extract SSS to Desktop Folder - Santo Stark Studio
color 0b
echo ==============================================================================
echo   SSS: Smart Safety Shield (v.56964) - Project Exporter
echo   Santo Stark Studio (SSS)
echo ==============================================================================
echo.
set "TARGET_DIR=C:\Users\santo\OneDrive\Desktop\SSS Smart Safety Shield (v.56964)"

echo Extracting all project files to:
echo   "%TARGET_DIR%"
echo.

if not exist "%TARGET_DIR%" (
    echo Creating destination folder on Desktop...
    mkdir "%TARGET_DIR%"
)

echo [1/4] Copying Web Application and PWA Assets...
xcopy /E /I /Y "%~dp0sss_app\*" "%TARGET_DIR%\" >nul

echo [2/4] Copying Documentation, PRD and License...
copy /Y "%~dp0README.md" "%TARGET_DIR%\" >nul
copy /Y "%~dp0PRODUCT_REQUIREMENTS_DOCUMENT.md" "%TARGET_DIR%\" >nul
copy /Y "%~dp0LICENSE" "%TARGET_DIR%\" >nul
copy /Y "%~dp0readit.md" "%TARGET_DIR%\" >nul
copy /Y "%~dp0readit.txt" "%TARGET_DIR%\" >nul

echo [3/4] Copying Launchers and Python Wi-Fi Host...
copy /Y "%~dp0run_sss.bat" "%TARGET_DIR%\" >nul
copy /Y "%~dp0host_on_phone.bat" "%TARGET_DIR%\" >nul
copy /Y "%~dp0sss_server.py" "%TARGET_DIR%\" >nul
copy /Y "%~dp0push_to_github.bat" "%TARGET_DIR%\" >nul
copy /Y "%~dp0.gitignore" "%TARGET_DIR%\" >nul

echo [4/4] Creating 1-Click Browser Launcher in target folder...
(
echo @echo off
echo title SSS v.56964 — Smart Safety Shield
echo cd /d "%%~dp0"
echo start "" "%%~dp0index.html"
) > "%TARGET_DIR%\run_app.bat"

echo.
echo ==============================================================================
echo   [SUCCESS] All project files extracted to:
echo   "%TARGET_DIR%"
echo ==============================================================================
echo.
echo You can now open your new folder on Desktop and run 'run_app.bat' or 'index.html'!
echo.
pause
