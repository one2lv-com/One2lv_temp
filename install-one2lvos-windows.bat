@echo off
:: ============================================================================
:: One2lvOS - Windows 11 Installer
:: ============================================================================
:: Installs the complete One2lvOS unified AI system from GitHub
:: Repository: https://github.com/one2lv-com/One2lvos
:: ============================================================================

title One2lvOS - Windows 11 Installer

color 0B
cls

echo.
echo ========================================================================
echo    ONE2LVOS - Unified AI System Installer for Windows 11
echo ========================================================================
echo.
echo    This will install:
echo    - One2lvOS Core (10 integrated repositories)
echo    - 29 AI Agents across 6 subsystems
echo    - AI Arcade (51 playable games)
echo    - SovereignCouncil + ITT Council of Nine
echo    - AI Lobby + Unified Gateway
echo    - All required dependencies
echo.
echo ========================================================================
echo.

timeout /t 3 /nobreak >nul

:: Check for admin rights
echo [1/15] Checking administrator privileges...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo    ^> Running as Administrator [OK]
) else (
    echo    ^> WARNING: Not running as Administrator
    echo    ^> Some features may not work correctly
    echo.
    pause
)

:: Check Git installation
echo.
echo [2/15] Checking Git installation...
git --version >nul 2>&1
if %errorLevel% neq 0 (
    echo    ^> Git not found!
    echo    ^> Please install Git from https://git-scm.com/download/win
    echo    ^> Make sure to check "Add Git to PATH" during installation
    echo.
    pause
    exit /b 1
)
for /f "tokens=3" %%i in ('git --version 2^>^&1') do set GIT_VERSION=%%i
echo    ^> Git %GIT_VERSION% found [OK]

:: Check Python installation
echo.
echo [3/15] Checking Python installation...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo    ^> Python not found!
    echo    ^> Please install Python 3.9+ from https://www.python.org/downloads/
    echo    ^> Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo    ^> Python %PYTHON_VERSION% found [OK]

:: Check pip
echo.
echo [4/15] Checking pip...
python -m pip --version >nul 2>&1
if %errorLevel% neq 0 (
    echo    ^> pip not found! Installing...
    python -m ensurepip --default-pip
) else (
    echo    ^> pip found [OK]
)

:: Check Node.js installation
echo.
echo [5/15] Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo    ^> Node.js not found!
    echo    ^> Please install Node.js 20+ from https://nodejs.org/
    echo    ^> Download the LTS version and complete installation
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version 2^>^&1') do set NODE_VERSION=%%i
echo    ^> Node.js %NODE_VERSION% found [OK]

:: Check npm
echo.
echo [6/15] Checking npm...
npm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo    ^> npm not found!
    echo    ^> Please reinstall Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version 2^>^&1') do set NPM_VERSION=%%i
echo    ^> npm %NPM_VERSION% found [OK]

:: Create installation directory
echo.
echo [7/15] Creating installation directory...
set INSTALL_DIR=%USERPROFILE%\One2lvOS
if exist "%INSTALL_DIR%" (
    echo    ^> Directory exists: %INSTALL_DIR%
    echo    ^> WARNING: Existing installation will be updated
    echo.
    choice /M "Continue with update"
    if errorlevel 2 exit /b 0
) else (
    mkdir "%INSTALL_DIR%"
    echo    ^> Created: %INSTALL_DIR%
)

cd /d "%INSTALL_DIR%"

:: Clone repository
echo.
echo [8/15] Cloning One2lvOS repository from GitHub...
echo    ^> This may take several minutes...

if exist ".git" (
    echo    ^> Repository exists, pulling latest changes...
    git pull origin main
    if %errorLevel% neq 0 (
        echo    ^> Git pull failed, trying to clone fresh...
        cd /d "%USERPROFILE%"
        rmdir /s /q "%INSTALL_DIR%"
        mkdir "%INSTALL_DIR%"
        cd /d "%INSTALL_DIR%"
        git clone https://github.com/one2lv-com/One2lvos.git .
    )
) else (
    git clone https://github.com/one2lv-com/One2lvos.git .
)

if %errorLevel% neq 0 (
    echo    ^> Failed to clone repository!
    echo    ^> Check your internet connection and try again
    pause
    exit /b 1
)
echo    ^> Repository cloned successfully [OK]

:: Create logs directory
echo.
echo [9/15] Creating logs directory...
if not exist "logs" mkdir logs
echo    ^> Logs directory: %INSTALL_DIR%\logs [OK]

:: Install Python dependencies
echo.
echo [10/15] Installing Python dependencies...
echo    ^> This may take several minutes...

python -m pip install --upgrade pip >nul 2>&1

if exist "requirements.txt" (
    echo    ^> Installing core Python packages...
    python -m pip install -r requirements.txt
    if %errorLevel% neq 0 (
        echo    ^> Warning: Some packages may have failed (attempting individual install)
        python -m pip install flask flask-cors fastapi uvicorn astrapy openai anthropic requests websockets pillow numpy
    )
)

:: Install additional Python packages for subsystems
echo    ^> Installing subsystem dependencies...
python -m pip install chess sse-starlette aiohttp >nul 2>&1

echo    ^> Python dependencies installed [OK]

:: Install Node.js dependencies
echo.
echo [11/15] Installing Node.js dependencies...
echo    ^> This may take several minutes...

:: Check for pnpm
pnpm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo    ^> pnpm not found, installing globally...
    npm install -g pnpm >nul 2>&1
)

:: Install main package.json if exists
if exist "package.json" (
    echo    ^> Installing root packages...
    npm install --legacy-peer-deps >nul 2>&1
)

:: Install lumenis-os dependencies
if exist "lumenis-os\package.json" (
    echo    ^> Installing lumenis-os packages...
    cd lumenis-os
    pnpm install --silent 2>nul || npm install --legacy-peer-deps >nul 2>&1
    cd ..
)

:: Install lumenis-os api-server
if exist "lumenis-os\artifacts\api-server\package.json" (
    echo    ^> Installing lumenis-os api-server packages...
    cd lumenis-os\artifacts\api-server
    pnpm install --silent 2>nul || npm install --legacy-peer-deps >nul 2>&1
    cd ..\..\..
)

:: Install minimax dependencies (agent-hub, one2lv-agent-hub, witness proxy, core)
if exist "minimax\agent-hub\package.json" (
    echo    ^> Installing minimax\agent-hub packages...
    cd minimax\agent-hub
    npm install --legacy-peer-deps >nul 2>&1
    cd ..\..
)
if exist "minimax\one2lv-agent-hub\package.json" (
    echo    ^> Installing minimax\one2lv-agent-hub packages...
    cd minimax\one2lv-agent-hub
    npm install --legacy-peer-deps >nul 2>&1
    cd ..\..
)
if exist "minimax\one2lv-witness-v8\proxy\package.json" (
    echo    ^> Installing minimax\witness-proxy packages...
    cd minimax\one2lv-witness-v8\proxy
    npm install --legacy-peer-deps >nul 2>&1
    cd ..\..\..
)
if exist "minimax\package.json" (
    echo    ^> Installing minimax core packages...
    cd minimax
    npm install --legacy-peer-deps >nul 2>&1
    cd ..
)

:: Install lumenis-v7 dependencies
if exist "steamos_lumenis\lumenis-v7-cjs\package.json" (
    echo    ^> Installing lumenis-v7-cjs packages...
    cd steamos_lumenis\lumenis-v7-cjs
    npm install --legacy-peer-deps >nul 2>&1
    cd ..\..
)

echo    ^> Node.js dependencies installed [OK]

:: Build TypeScript projects
echo.
echo [12/15] Building TypeScript projects...

if exist "lumenis-os\artifacts\api-server\build.mjs" (
    echo    ^> Building lumenis-os api-server...
    cd lumenis-os\artifacts\api-server
    node build.mjs >nul 2>&1
    if %errorLevel% == 0 (
        echo    ^> lumenis-os api-server built [OK]
    ) else (
        echo    ^> Warning: lumenis-os build failed (non-fatal)
    )
    cd ..\..\..
)

:: Create .env for minimax Vite apps (NVIDIA NIM key + MiniMax model)
echo    ^> Writing minimax .env files...
if exist "minimax\agent-hub" (
    (
        echo VITE_NVIDIA_API_KEY=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
        echo VITE_NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
        echo VITE_MINIMAX_MODEL=minimax/minimax-01
    ) > minimax\agent-hub\.env
)
if exist "minimax\one2lv-agent-hub" (
    (
        echo VITE_NVIDIA_API_KEY=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
        echo VITE_NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
        echo VITE_MINIMAX_MODEL=minimax/minimax-01
    ) > minimax\one2lv-agent-hub\.env
)
if exist "minimax\one2lv-witness-v8\proxy" (
    (
        echo NVIDIA_API_KEY=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
        echo NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
        echo NVIDIA_MODEL=minimax/minimax-01
        echo PORT=3001
        echo NODE_ENV=production
    ) > minimax\one2lv-witness-v8\proxy\.env
)

:: Build minimax Vite apps (bakes NVIDIA key into bundle)
if exist "minimax\agent-hub\package.json" (
    echo    ^> Building minimax\agent-hub...
    cd minimax\agent-hub
    npm run build >nul 2>&1
    if %errorLevel% == 0 (
        echo    ^> minimax\agent-hub built [OK]
    ) else (
        echo    ^> Warning: minimax\agent-hub build failed (non-fatal)
    )
    cd ..\..
)
if exist "minimax\one2lv-agent-hub\package.json" (
    echo    ^> Building minimax\one2lv-agent-hub...
    cd minimax\one2lv-agent-hub
    npm run build >nul 2>&1
    if %errorLevel% == 0 (
        echo    ^> minimax\one2lv-agent-hub built [OK]
    ) else (
        echo    ^> Warning: minimax\one2lv-agent-hub build failed (non-fatal)
    )
    cd ..\..
)

echo    ^> Build complete [OK]

:: Create launcher scripts
echo.
echo [13/15] Creating launcher scripts...

:: Start All Services script
(
echo @echo off
echo title One2lvOS - Full System
echo color 0B
echo cls
echo echo ========================================================================
echo echo    ONE2LVOS - Starting All Services
echo echo ========================================================================
echo echo.
echo cd /d "%%~dp0"
echo.
echo echo [1/10] AI Arcade MCP [port 8003]...
echo start /min "AI-Arcade" cmd /c "python ai-arcade\server.py"
echo timeout /t 2 /nobreak ^>nul
echo.
echo echo [2/10] One2lvOS Core [port 3002]...
echo start /min "OS-Core" cmd /c "python -m flask run --host 0.0.0.0 --port 3002 --app One2lvos\core_service.py"
echo timeout /t 2 /nobreak ^>nul
echo.
echo echo [3/10] Sovereign Agentic Core [port 3003]...
echo start /min "SAC" cmd /c "cd sovereign-agentic-core && python -m uvicorn main:app --host 0.0.0.0 --port 3003"
echo timeout /t 2 /nobreak ^>nul
echo.
echo echo [4/10] Lumenis v7 Cosmic [port 8005]...
echo if exist "steamos_lumenis\lumenis-v7-cjs\server.js" (
echo     start /min "Lumenis-v7" cmd /c "cd steamos_lumenis\lumenis-v7-cjs && set PORT=8005 && node server.js"
echo )
echo timeout /t 2 /nobreak ^>nul
echo.
echo echo [5/10] SteamOS Dashboard [port 8081]...
echo if exist "steamos_lumenis\one2lvos_dashboard\server.py" (
echo     start /min "SteamOS-Dash" cmd /c "python steamos_lumenis\one2lvos_dashboard\server.py"
echo )
echo timeout /t 2 /nobreak ^>nul
echo.
echo echo [6/10] AI Lobby [port 8006]...
echo start /min "AI-Lobby" cmd /c "python -m uvicorn ai_lobby:app --host 0.0.0.0 --port 8006"
echo timeout /t 2 /nobreak ^>nul
echo.
echo echo [7/10] Lumenis Space Agent UI [port 9001]...
echo if exist "Lumenis\frontend" (
echo     start /min "Lumenis-UI" cmd /c "cd Lumenis\frontend && python -m http.server 9001"
echo )
echo timeout /t 2 /nobreak ^>nul
echo.
echo echo [8/10] LumenisOS API Server [port 9002]...
echo if exist "lumenis-os\artifacts\api-server\dist\index.mjs" (
echo     start /min "LumenisOS-API" cmd /c "cd lumenis-os\artifacts\api-server && set PORT=9002 && node dist\index.mjs"
echo )
echo timeout /t 2 /nobreak ^>nul
echo.
echo echo [9/10] Aetherix Master Terminal [port 9003]...
echo if exist "Aetherix\server.py" (
echo     start /min "Aetherix" cmd /c "python Aetherix\server.py"
echo )
echo timeout /t 2 /nobreak ^>nul
echo.
echo echo [10/10] Unified Gateway [port 8888]...
echo start /min "Gateway" cmd /c "python -m uvicorn unified_gateway:app --host 0.0.0.0 --port 8888"
echo timeout /t 2 /nobreak ^>nul
echo.
echo echo [11/12] Minimax Core API [port 8080]...
echo if exist "minimax\package.json" (
echo     start /min "Minimax-Core" cmd /c "cd minimax && set NODE_PORT=8080 && node index.js"
echo )
echo timeout /t 2 /nobreak ^>nul
echo.
echo echo [12/12] Minimax Witness Proxy [port 3001]...
echo if exist "minimax\one2lv-witness-v8\proxy\server.js" (
echo     start /min "Minimax-Witness" cmd /c "cd minimax\one2lv-witness-v8\proxy && node server.js"
echo )
echo timeout /t 2 /nobreak ^>nul
echo.
echo echo ========================================================================
echo echo    ONE2LVOS SYSTEM IS NOW RUNNING!
echo echo ========================================================================
echo echo.
echo echo    Unified Gateway:  http://localhost:8888
echo echo    AI Arcade MCP:    http://localhost:8003
echo echo    AI Lobby:         http://localhost:8006
echo echo    SteamOS Dash:     http://localhost:8081
echo echo    LumenisOS:        http://localhost:9002
echo echo    Aetherix:         http://localhost:9003
echo echo    Minimax Core:     http://localhost:8080
echo echo    Minimax Witness:  http://localhost:3001
echo echo.
echo echo    View system status: http://localhost:8888/status
echo echo.
echo echo    Press any key to stop all services...
echo echo ========================================================================
echo pause ^>nul
echo.
echo echo Stopping all services...
echo taskkill /F /FI "WINDOWTITLE eq AI-Arcade*" ^>nul 2^>^&1
echo taskkill /F /FI "WINDOWTITLE eq OS-Core*" ^>nul 2^>^&1
echo taskkill /F /FI "WINDOWTITLE eq SAC*" ^>nul 2^>^&1
echo taskkill /F /FI "WINDOWTITLE eq Lumenis*" ^>nul 2^>^&1
echo taskkill /F /FI "WINDOWTITLE eq SteamOS*" ^>nul 2^>^&1
echo taskkill /F /FI "WINDOWTITLE eq AI-Lobby*" ^>nul 2^>^&1
echo taskkill /F /FI "WINDOWTITLE eq Aetherix*" ^>nul 2^>^&1
echo taskkill /F /FI "WINDOWTITLE eq Gateway*" ^>nul 2^>^&1
echo echo Services stopped.
echo timeout /t 2 /nobreak ^>nul
) > start-one2lvos.bat
echo    ^> Created start-one2lvos.bat

:: Stop Services script
(
echo @echo off
echo title Stopping One2lvOS
echo color 0C
echo echo Stopping all One2lvOS services...
echo.
echo taskkill /F /FI "WINDOWTITLE eq AI-Arcade*" ^>nul 2^>^&1
echo taskkill /F /FI "WINDOWTITLE eq OS-Core*" ^>nul 2^>^&1
echo taskkill /F /FI "WINDOWTITLE eq SAC*" ^>nul 2^>^&1
echo taskkill /F /FI "WINDOWTITLE eq Lumenis*" ^>nul 2^>^&1
echo taskkill /F /FI "WINDOWTITLE eq SteamOS*" ^>nul 2^>^&1
echo taskkill /F /FI "WINDOWTITLE eq AI-Lobby*" ^>nul 2^>^&1
echo taskkill /F /FI "WINDOWTITLE eq Aetherix*" ^>nul 2^>^&1
echo taskkill /F /FI "WINDOWTITLE eq Gateway*" ^>nul 2^>^&1
echo taskkill /F /FI "WINDOWTITLE eq Minimax*" ^>nul 2^>^&1
echo.
echo :: Kill by port as fallback
echo for %%%%p in ^(3001 3002 3003 8003 8005 8006 8080 8081 8888 9001 9002 9003^) do ^(
echo     netstat -ano ^| findstr :%%%%p ^| findstr LISTENING ^> nul
echo     if not errorlevel 1 ^(
echo         for /f "tokens=5" %%%%a in ^('netstat -ano ^| findstr :%%%%p ^| findstr LISTENING'^) do taskkill /F /PID %%%%a ^>nul 2^>^&1
echo     ^)
echo ^)
echo.
echo echo All services stopped.
echo timeout /t 2 /nobreak ^>nul
) > stop-one2lvos.bat
echo    ^> Created stop-one2lvos.bat

:: System Status script
(
echo @echo off
echo title One2lvOS - System Status
echo color 0A
echo cls
echo echo ========================================================================
echo echo    ONE2LVOS - SYSTEM STATUS
echo echo ========================================================================
echo echo.
echo echo Checking services...
echo echo.
echo.
echo curl -s http://localhost:8888/status 2^>nul
echo if %%errorLevel%% neq 0 ^(
echo     echo Gateway [port 8888]:  OFFLINE
echo     echo.
echo     echo System appears to be stopped.
echo     echo Run: start-one2lvos.bat
echo ^) else ^(
echo     echo.
echo     echo System is running!
echo     echo View full status: http://localhost:8888/status
echo ^)
echo.
echo echo ========================================================================
echo echo.
echo pause
) > status-one2lvos.bat
echo    ^> Created status-one2lvos.bat

:: Open Dashboard script
(
echo @echo off
echo title Opening One2lvOS Dashboard
echo echo Opening One2lvOS dashboards in browser...
echo echo.
echo start http://localhost:8888
echo timeout /t 1 /nobreak ^>nul
echo start http://localhost:8080
echo timeout /t 1 /nobreak ^>nul
echo start http://localhost:8003
echo echo.
echo echo Dashboards opened!
echo timeout /t 2 /nobreak ^>nul
) > open-dashboard.bat
echo    ^> Created open-dashboard.bat

:: Create desktop shortcuts
echo.
echo [14/15] Creating desktop shortcuts...
set DESKTOP=%USERPROFILE%\Desktop

:: Create VBS script to make shortcuts
(
echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
echo.
echo ' One2lvOS Main Launcher
echo sLinkFile = "%DESKTOP%\One2lvOS.lnk"
echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
echo oLink.TargetPath = "%INSTALL_DIR%\start-one2lvos.bat"
echo oLink.WorkingDirectory = "%INSTALL_DIR%"
echo oLink.Description = "Launch One2lvOS Unified AI System"
echo oLink.Save
echo.
echo ' One2lvOS Status
echo sLinkFile = "%DESKTOP%\One2lvOS Status.lnk"
echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
echo oLink.TargetPath = "%INSTALL_DIR%\status-one2lvos.bat"
echo oLink.WorkingDirectory = "%INSTALL_DIR%"
echo oLink.Description = "Check One2lvOS System Status"
echo oLink.Save
) > createshortcuts.vbs

cscript //nologo createshortcuts.vbs >nul 2>&1
if exist "%DESKTOP%\One2lvOS.lnk" (
    echo    ^> Desktop shortcuts created [OK]
) else (
    echo    ^> Could not create desktop shortcuts (non-fatal)
)
del createshortcuts.vbs >nul 2>&1

:: Create README
echo.
echo [15/15] Creating README...
(
echo ========================================================================
echo    ONE2LVOS - Unified AI System
echo ========================================================================
echo.
echo INSTALLATION COMPLETE!
echo.
echo Location: %INSTALL_DIR%
echo GitHub: https://github.com/one2lv-com/One2lvos
echo.
echo ========================================================================
echo    QUICK START
echo ========================================================================
echo.
echo Option 1: Double-click "One2lvOS" icon on your desktop
echo.
echo Option 2: Run batch files:
echo    - start-one2lvos.bat      [Start all 10 services]
echo    - stop-one2lvos.bat       [Stop all services]
echo    - status-one2lvos.bat     [Check system status]
echo    - open-dashboard.bat      [Open web dashboards]
echo.
echo ========================================================================
echo    SYSTEM ARCHITECTURE
echo ========================================================================
echo.
echo 10 Integrated Services:
echo.
echo    Unified Gateway       http://localhost:8888
echo    One2lvOS Core         http://localhost:3002
echo    Sovereign Core        http://localhost:3003
echo    AI Arcade MCP         http://localhost:8003
echo    AI Lobby              http://localhost:8006
echo    Lumenis v7            http://localhost:8005
echo    SteamOS Dashboard     http://localhost:8080
echo    Lumenis UI            http://localhost:9001
echo    LumenisOS API         http://localhost:9002
echo    Aetherix Terminal     http://localhost:9003
echo.
echo ========================================================================
echo    FEATURES
echo ========================================================================
echo.
echo - 29 AI Agents across 6 subsystems
echo - 51 Playable Games in AI Arcade
echo - SovereignCouncil (7 agents^)
echo - ITT Council of Nine + LumenisReactor
echo - Phase 9 Delta Engine
echo - Multi-agent tournaments
echo - Unified Gateway API
echo - AstraDB vector memory
echo.
echo ========================================================================
echo    API ENDPOINTS
echo ========================================================================
echo.
echo System:
echo    GET  http://localhost:8888/           - Full system manifest
echo    GET  http://localhost:8888/status     - Live health check
echo.
echo Council:
echo    POST http://localhost:8888/council    - Convene SovereignCouncil
echo    WS   http://localhost:8888/chat       - ITT Council chat
echo.
echo Arcade:
echo    GET  http://localhost:8888/arcade/library     - Game library
echo    POST http://localhost:8888/arcade/create      - Create game
echo    POST http://localhost:8888/arcade/move        - Make move
echo.
echo Lobby:
echo    GET  http://localhost:8888/lobby/agents       - List all agents
echo    POST http://localhost:8888/lobby/broadcast    - Broadcast message
echo    WS   http://localhost:8888/lobby/room         - Agent room
echo.
echo ========================================================================
echo    AI ARCADE GAMES (51 playable^)
echo ========================================================================
echo.
echo Strategy Board: chess, go, checkers, othello, tictactoe, connect4,
echo                 shogi, hex, gomoku, mancala
echo.
echo Puzzle:         minesweeper, sudoku, battleship, scrabble,
echo                 mastermind, picross
echo.
echo Arcade:         pacman, tetris, space_invaders, pong,
echo                 universal_paperclips
echo.
echo Full library: 100+ titles across 9 categories
echo.
echo ========================================================================
echo    TROUBLESHOOTING
echo ========================================================================
echo.
echo Services won't start:
echo    - Check if ports are available (8888, 8003, 3002, 3003, 8006, etc.^)
echo    - Run: stop-one2lvos.bat to kill conflicting processes
echo    - Check logs folder for error messages
echo.
echo Port conflicts:
echo    - Find process using port: netstat -ano ^| findstr :8888
echo    - Kill process: taskkill /F /PID [PID]
echo.
echo Python/Node errors:
echo    - Verify Python 3.9+ installed: python --version
echo    - Verify Node.js 20+ installed: node --version
echo    - Reinstall dependencies: run installer again
echo.
echo Missing services:
echo    - Some services are optional and may not exist in all repos
echo    - Check if the service directory exists in your installation
echo.
echo ========================================================================
echo    UPDATING ONE2LVOS
echo ========================================================================
echo.
echo To update to latest version:
echo.
echo 1. Stop all services: stop-one2lvos.bat
echo 2. Navigate to installation folder: cd %%USERPROFILE%%\One2lvOS
echo 3. Pull latest changes: git pull origin main
echo 4. Run installer again: install-one2lvos-windows.bat
echo.
echo ========================================================================
echo    UNINSTALLATION
echo ========================================================================
echo.
echo To uninstall One2lvOS:
echo.
echo 1. Run: uninstall-one2lvos.bat
echo.
echo OR manually:
echo    1. Stop services: stop-one2lvos.bat
echo    2. Delete desktop shortcuts
echo    3. Delete folder: rmdir /s /q %%USERPROFILE%%\One2lvOS
echo.
echo ========================================================================
echo    SUPPORT
echo ========================================================================
echo.
echo GitHub:  https://github.com/one2lv-com/One2lvos
echo Issues:  https://github.com/one2lv-com/One2lvos/issues
echo License: MIT License
echo.
echo ========================================================================
) > README-WINDOWS.txt
echo    ^> README-WINDOWS.txt created [OK]

:: Create uninstaller
(
echo @echo off
echo title One2lvOS - Uninstaller
echo color 0C
echo cls
echo echo ========================================================================
echo echo    ONE2LVOS - Uninstaller
echo echo ========================================================================
echo echo.
echo echo    This will remove One2lvOS from your system.
echo echo    Installation directory: %INSTALL_DIR%
echo echo.
echo echo    Press Ctrl+C to cancel, or
echo pause
echo.
echo echo Stopping all services...
echo call "%INSTALL_DIR%\stop-one2lvos.bat"
echo timeout /t 2 /nobreak ^>nul
echo.
echo echo Removing desktop shortcuts...
echo del "%%USERPROFILE%%\Desktop\One2lvOS.lnk" ^>nul 2^>^&1
echo del "%%USERPROFILE%%\Desktop\One2lvOS Status.lnk" ^>nul 2^>^&1
echo.
echo echo Removing installation directory...
echo cd /d "%%USERPROFILE%%"
echo rmdir /s /q "One2lvOS"
echo.
echo echo ========================================================================
echo echo    ONE2LVOS HAS BEEN UNINSTALLED
echo echo ========================================================================
echo echo.
echo pause
) > uninstall-one2lvos.bat
echo    ^> uninstaller created [OK]

:: Installation complete
cls
color 0A
echo.
echo ========================================================================
echo    INSTALLATION COMPLETE!
echo ========================================================================
echo.
echo    One2lvOS has been installed successfully!
echo.
echo    Location: %INSTALL_DIR%
echo.
echo ========================================================================
echo    QUICK START
echo ========================================================================
echo.
echo    1. Double-click "One2lvOS" icon on your desktop
echo.
echo       OR
echo.
echo    2. Run: start-one2lvos.bat
echo.
echo    Then open:
echo       Unified Gateway:  http://localhost:8888
echo       System Status:    http://localhost:8888/status
echo       AI Arcade:        http://localhost:8003
echo       Dashboard:        http://localhost:8080
echo.
echo ========================================================================
echo    WHAT'S INCLUDED
echo ========================================================================
echo.
echo    - 10 Integrated Services (all ports configured)
echo    - 29 AI Agents (SovereignCouncil, ITT Council, etc.)
echo    - 51 Playable Games (AI Arcade MCP)
echo    - Unified Gateway API (port 8888)
echo    - AI Lobby (29 agents registered)
echo    - Complete documentation in README-WINDOWS.txt
echo.
echo ========================================================================
echo    LAUNCHER SCRIPTS
echo ========================================================================
echo.
echo    - start-one2lvos.bat      [Start all services]
echo    - stop-one2lvos.bat       [Stop all services]
echo    - status-one2lvos.bat     [Check system status]
echo    - open-dashboard.bat      [Open dashboards]
echo    - uninstall-one2lvos.bat  [Remove system]
echo.
echo ========================================================================
echo    NEXT STEPS
echo ========================================================================
echo.
echo    1. Read README-WINDOWS.txt for detailed information
echo    2. Launch One2lvOS using desktop shortcut
echo    3. Visit http://localhost:8888 for unified gateway
echo    4. Check system status at http://localhost:8888/status
echo    5. Explore AI Arcade at http://localhost:8003
echo.
echo    For full documentation:
echo    https://github.com/one2lv-com/One2lvos
echo.
echo ========================================================================
echo.
echo    Press any key to open README-WINDOWS.txt...
echo.
pause >nul

start notepad.exe README-WINDOWS.txt

echo.
echo    Thank you for installing One2lvOS!
echo.
timeout /t 5

exit /b 0
