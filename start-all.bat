@echo off
REM start-all.bat: launch backend, frontend and employee reporter in separate windows

rem sync system clock before starting services (requires admin privileges)
if exist "%SystemRoot%\system32\w32tm.exe" (
    echo Syncing system clock...
    w32tm /resync >nul 2>&1 || echo Failed to sync time (run as Administrator)
) else (
    echo w32tm not available, skipping time sync
)


rem first load configuration (API URL, API key, export folder)
if exist "%~dp0start-config.bat" (
    call "%~dp0start-config.bat"
) else (
    echo WARNING: start-config.bat not found, using defaults.
)

echo =============================================
echo Starting StatusPR stack
echo =============================================

:: backend (uses npm dev script so it reloads when server.js changes)
start "Backend" cmd /k "cd /d "%~dp0backend" && npm install && npm run dev"

:: frontend (Vite dev server)
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm install && npm run dev"

:: reporter (employee machine script)
start "Reporter" cmd /k "cd /d "%~dp0employee-reporter" && npm install && node index.js"

echo All windows launched.  Close this window to finish.
pause
