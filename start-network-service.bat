@echo off
REM One2lvOS Network Service Startup Script (Windows)
REM Starts the Static Connections & Mesh Routing service with WebDAV/FTP

echo ================================================
echo   One2lvOS Network Service
echo   Static Connections ^& Mesh Routing
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Change to script directory
cd /d "%~dp0"

REM Create required directories
echo Creating directories...
if not exist "config" mkdir config
if not exist "services" mkdir services
if not exist "services\protocols" mkdir services\protocols

REM Check if root node_modules exist (contains express, cors, etc.)
if not exist "node_modules" (
    echo Dependencies not found. Installing from package.json...
    call npm install --legacy-peer-deps
    echo.
)

REM Create config file if it doesn't exist
if not exist "config\connections.json" (
    echo Creating default configuration...
    echo {"connections":[]} > config\connections.json
)

REM Verify network-api exists
if not exist "server\network-api.js" (
    echo Error: server\network-api.js not found
    echo Make sure you are running this from the One2lvOS directory
    pause
    exit /b 1
)

REM Set default port if not set
if "%NETWORK_API_PORT%"=="" set NETWORK_API_PORT=3003

echo Starting Network Service...
echo Port: %NETWORK_API_PORT%
echo Web UI: http://localhost:%NETWORK_API_PORT%/network-manager.html
echo.
echo Press Ctrl+C to stop the service
echo ================================================
echo.

REM Start the service
node server\network-api.js

pause
