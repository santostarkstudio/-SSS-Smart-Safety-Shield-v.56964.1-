@echo off
title SSS Master Visual Report & Technical Blueprint - PDF Generator
color 0C
cls
echo ==============================================================================
echo  SSS v.56964.1 — MASTER TECHNICAL BLUEPRINT & VISUAL PROJECT REPORT
echo  Santo Stark Studio • Cardiac SOS, Delivery Fleet, Rural Mesh & Hardware
echo ==============================================================================
echo.
echo Opening Master Visual Report in your default browser...
echo.
echo ==============================================================================
echo  INSTRUCTIONS TO SAVE AS HIGH-RESOLUTION PDF:
echo ==============================================================================
echo  1. Click the red "Generate Master PDF Report" button at the top.
echo  2. Select "Destination: Save as PDF".
echo  3. Under More Settings:
echo     - Paper Size: A4
echo     - Layout: Portrait
echo     - Margins: Default
echo     - Background Graphics: CHECKED / ON (Important for colors and charts!)
echo  4. Click "Save"!
echo ==============================================================================
echo.
start "" "%~dp0SSS_MASTER_ULTIMATE_BLUEPRINT_REPORT.html"
echo Master Visual Report opened successfully!
echo.
pause
