@echo off
echo =====================================
echo Stock Data Automation Script
echo =====================================
echo.

cd /d "%~dp0"

echo Installing dependencies...
call npm install

echo.
echo Starting automation...
echo.

npm run automate-all

echo.
echo Script completed. Press any key to exit...
pause