@echo off
title SSS Smart Safety Shield v.56964 ? Full System Launcher
color 0A
cls
echo.
echo  =========================================================================
echo        SSS v.56964 ? SMART SAFETY SHIELD  (FULL SYSTEM LAUNCH)
echo        Santo Stark Studio  ^|  Santosha D  ^|  https://sss-shield.local
echo  =========================================================================
echo.
echo  [1/3] Starting SSS Emergency Backend (WebSocket + Fleet Dispatch)...
start "SSS Backend :8080" cmd /k "cd /d "%~dp0sss_backend" && node server.js"

echo  [2/3] Starting SSS Web App (Frontend PWA)...
timeout /t 2 /nobreak > nul
start "SSS Frontend :3000" cmd /k "cd /d "%~dp0sss_app" && python -m http.server 3000"

echo  [3/3] Opening SSS in your browser...
timeout /t 3 /nobreak > nul
start "" "http://localhost:3000"

echo.
echo  =========================================================================
echo   SSS IS FULLY RUNNING!
echo.
echo   Frontend (Web App):  http://localhost:3000
echo   Backend (API + WS):  http://localhost:8080
echo   Health Check:        http://localhost:8080/api/health
echo  =========================================================================
echo.
echo  Close this window to keep the servers running.
echo  Close the two BLACK windows to stop the servers.
echo.
pause
