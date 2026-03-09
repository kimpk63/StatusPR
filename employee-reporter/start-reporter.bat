@echo off
title StatusPR Employee Reporter

echo ===============================
echo   Starting Employee Reporter
echo ===============================

cd /d "%~dp0"

set STATUS_API_URL=http://168.222.28.50:3001
set EXPORT_FOLDER=C:\VideoExports

echo API SERVER: %STATUS_API_URL%
echo EXPORT FOLDER: %EXPORT_FOLDER%
echo.

node index.js

pause