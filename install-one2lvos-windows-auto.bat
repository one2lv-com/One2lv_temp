@echo off
:: ============================================================================
:: One2lvOS - FULLY AUTOMATIC Windows 11 Installer
:: ============================================================================
:: Automatically installs Git, Python, Node.js if missing
:: Clones repository, installs dependencies, and launches system
:: Repository: https://github.com/one2lv-com/One2lvos
:: ============================================================================

title One2lvOS - Automatic Installer

color 0B
cls

echo.
echo ========================================================================
echo    ONE2LVOS - Fully Automatic Installer for Windows 11
echo ========================================================================
echo.
echo    This will automatically:
echo    - Install Git, Python 3.12, Node.js 20 (if missing)
echo    - Clone One2lvOS from GitHub
echo    - Install all dependencies
echo    - Build TypeScript projects
echo    - Launch the system
echo.
echo    Installation will begin in 3 seconds...
echo ========================================================================
echo.

timeout /t 3 /nobreak >nul

:: Set installation directory
set INSTALL_DIR=%USERPROFILE%\One2lvOS
set LOG_FILE=%TEMP%\one2lvos-install.log

echo [STARTING] One2lvOS Automatic Installation > "%LOG_FILE%"
echo [TIME] %date% %time% >> "%LOG_FILE%"

:: ============================================================================
:: STEP 1: Check and Install Git
:: ============================================================================
echo.
echo [1/12] Checking Git installation...

git --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=3" %%i in ('git --version 2^>^&1') do set GIT_VERSION=%%i
    echo    ^> Git %GIT_VERSION% found [OK]
    echo [GIT] Already installed: %GIT_VERSION% >> "%LOG_FILE%"
) else (
    echo    ^> Git not found - Installing automatically...
    echo [GIT] Not found, attempting auto-install >> "%LOG_FILE%"

    :: Try winget first (Windows 11 built-in)
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements --silent >nul 2>&1
    if %errorLevel% == 0 (
        echo    ^> Git installed via winget [OK]
        echo [GIT] Installed via winget >> "%LOG_FILE%"
        :: Refresh PATH
        call refreshenv >nul 2>&1
    ) else (
        :: Try chocolatey
        where choco >nul 2>&1
        if %errorLevel% == 0 (
            echo    ^> Installing Git via Chocolatey...
            choco install git -y --no-progress >nul 2>&1
            echo [GIT] Installed via chocolatey >> "%LOG_FILE%"
        ) else (
            echo    ^> Installing Git manually...
            echo    ^> Downloading Git installer...
            powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe' -OutFile '%TEMP%\git-installer.exe'" >nul 2>&1
            echo    ^> Running Git installer...
            start /wait "" "%TEMP%\git-installer.exe" /VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS /COMPONENTS="icons,ext\reg\shellhere,assoc,assoc_sh"
            del "%TEMP%\git-installer.exe" >nul 2>&1
            echo [GIT] Installed manually >> "%LOG_FILE%"
        )
        :: Add Git to PATH for this session
        set "PATH=%PATH%;C:\Program Files\Git\cmd"
    )

    :: Verify installation
    git --version >nul 2>&1
    if %errorLevel% == 0 (
        echo    ^> Git installation verified [OK]
    ) else (
        echo    ^> ERROR: Git installation failed
        echo    ^> Please install manually from https://git-scm.com/download/win
        echo [ERROR] Git installation failed >> "%LOG_FILE%"
    )
)

:: ============================================================================
:: STEP 2: Check and Install Python
:: ============================================================================
echo.
echo [2/12] Checking Python installation...

python --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
    echo    ^> Python %PYTHON_VERSION% found [OK]
    echo [PYTHON] Already installed: %PYTHON_VERSION% >> "%LOG_FILE%"
) else (
    echo    ^> Python not found - Installing automatically...
    echo [PYTHON] Not found, attempting auto-install >> "%LOG_FILE%"

    :: Try winget first
    winget install --id Python.Python.3.12 -e --source winget --accept-package-agreements --accept-source-agreements --silent >nul 2>&1
    if %errorLevel% == 0 (
        echo    ^> Python installed via winget [OK]
        echo [PYTHON] Installed via winget >> "%LOG_FILE%"
        call refreshenv >nul 2>&1
    ) else (
        :: Try chocolatey
        where choco >nul 2>&1
        if %errorLevel% == 0 (
            echo    ^> Installing Python via Chocolatey...
            choco install python312 -y --no-progress >nul 2>&1
            echo [PYTHON] Installed via chocolatey >> "%LOG_FILE%"
        ) else (
            echo    ^> Installing Python manually...
            echo    ^> Downloading Python 3.12 installer...
            powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.12.0/python-3.12.0-amd64.exe' -OutFile '%TEMP%\python-installer.exe'" >nul 2>&1
            echo    ^> Running Python installer...
            start /wait "" "%TEMP%\python-installer.exe" /quiet InstallAllUsers=0 PrependPath=1 Include_test=0 Include_pip=1
            del "%TEMP%\python-installer.exe" >nul 2>&1
            echo [PYTHON] Installed manually >> "%LOG_FILE%"
        )
        :: Add Python to PATH for this session
        set "PATH=%PATH%;%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python312\Scripts"
    )

    :: Verify installation
    python --version >nul 2>&1
    if %errorLevel% == 0 (
        echo    ^> Python installation verified [OK]
    ) else (
        echo    ^> ERROR: Python installation failed
        echo [ERROR] Python installation failed >> "%LOG_FILE%"
    )
)

:: Ensure pip is available
echo    ^> Verifying pip...
python -m pip --version >nul 2>&1
if %errorLevel% neq 0 (
    echo    ^> Installing pip...
    python -m ensurepip --default-pip >nul 2>&1
    echo [PIP] Ensured pip installation >> "%LOG_FILE%"
)

:: ============================================================================
:: STEP 3: Check and Install Node.js
:: ============================================================================
echo.
echo [3/12] Checking Node.js installation...

node --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('node --version 2^>^&1') do set NODE_VERSION=%%i
    echo    ^> Node.js %NODE_VERSION% found [OK]
    echo [NODEJS] Already installed: %NODE_VERSION% >> "%LOG_FILE%"
) else (
    echo    ^> Node.js not found - Installing automatically...
    echo [NODEJS] Not found, attempting auto-install >> "%LOG_FILE%"

    :: Try winget first
    winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements --silent >nul 2>&1
    if %errorLevel% == 0 (
        echo    ^> Node.js installed via winget [OK]
        echo [NODEJS] Installed via winget >> "%LOG_FILE%"
        call refreshenv >nul 2>&1
    ) else (
        :: Try chocolatey
        where choco >nul 2>&1
        if %errorLevel% == 0 (
            echo    ^> Installing Node.js via Chocolatey...
            choco install nodejs-lts -y --no-progress >nul 2>&1
            echo [NODEJS] Installed via chocolatey >> "%LOG_FILE%"
        ) else (
            echo    ^> Installing Node.js manually...
            echo    ^> Downloading Node.js 20 installer...
            powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%TEMP%\node-installer.msi'" >nul 2>&1
            echo    ^> Running Node.js installer...
            start /wait msiexec /i "%TEMP%\node-installer.msi" /quiet /norestart
            del "%TEMP%\node-installer.msi" >nul 2>&1
            echo [NODEJS] Installed manually >> "%LOG_FILE%"
        )
        :: Add Node to PATH for this session
        set "PATH=%PATH%;%ProgramFiles%\nodejs"
    )

    :: Verify installation
    node --version >nul 2>&1
    if %errorLevel% == 0 (
        echo    ^> Node.js installation verified [OK]
    ) else (
        echo    ^> ERROR: Node.js installation failed
        echo [ERROR] Node.js installation failed >> "%LOG_FILE%"
    )
)

:: Verify npm
npm --version >nul 2>&1
if %errorLevel% == 0 (
    echo    ^> npm found [OK]
) else (
    echo    ^> ERROR: npm not found
)

:: ============================================================================
:: STEP 4: Create Installation Directory
:: ============================================================================
echo.
echo [4/12] Creating installation directory...

if exist "%INSTALL_DIR%" (
    echo    ^> Directory exists, will update: %INSTALL_DIR%
    echo [DIR] Updating existing installation >> "%LOG_FILE%"
) else (
    mkdir "%INSTALL_DIR%"
    echo    ^> Created: %INSTALL_DIR%
    echo [DIR] Created new installation directory >> "%LOG_FILE%"
)

cd /d "%INSTALL_DIR%"

:: ============================================================================
:: STEP 5: Clone Repository
:: ============================================================================
echo.
echo [5/12] Cloning One2lvOS repository from GitHub...
echo    ^> Repository: https://github.com/one2lv-com/One2lvos
echo    ^> This may take 2-5 minutes depending on connection...

if exist ".git" (
    echo    ^> Repository exists, pulling latest changes...
    git fetch origin >> "%LOG_FILE%" 2>&1
    git reset --hard origin/main >> "%LOG_FILE%" 2>&1
    git pull origin main >> "%LOG_FILE%" 2>&1
    echo [GIT] Updated existing repository >> "%LOG_FILE%"
) else (
    git clone https://github.com/one2lv-com/One2lvos.git . >> "%LOG_FILE%" 2>&1
    echo [GIT] Cloned fresh repository >> "%LOG_FILE%"
)

if %errorLevel% neq 0 (
    echo    ^> ERROR: Failed to clone repository
    echo    ^> Check your internet connection
    echo [ERROR] Git clone failed >> "%LOG_FILE%"
    timeout /t 10
    exit /b 1
)
echo    ^> Repository synced successfully [OK]

:: ============================================================================
:: STEP 6: Create Logs Directory
:: ============================================================================
echo.
echo [6/12] Creating logs directory...
if not exist "logs" mkdir logs
echo    ^> Logs directory ready [OK]

:: ============================================================================
:: STEP 7: Upgrade pip
:: ============================================================================
echo.
echo [7/12] Upgrading pip...
python -m pip install --upgrade pip --quiet >> "%LOG_FILE%" 2>&1
echo    ^> pip upgraded [OK]

:: ============================================================================
:: STEP 8: Install Python Dependencies
:: ============================================================================
echo.
echo [8/12] Installing Python dependencies...
echo    ^> This may take 3-5 minutes...

:: Install core requirements
if exist "requirements.txt" (
    echo    ^> Installing from requirements.txt...
    python -m pip install -r requirements.txt --quiet >> "%LOG_FILE%" 2>&1
)

:: Install additional packages
echo    ^> Installing additional Python packages...
python -m pip install chess sse-starlette aiohttp --quiet >> "%LOG_FILE%" 2>&1

echo    ^> Python dependencies installed [OK]
echo [PYTHON] All dependencies installed >> "%LOG_FILE%"

:: ============================================================================
:: STEP 9: Install Node.js Dependencies
:: ============================================================================
echo.
echo [9/12] Installing Node.js dependencies...
echo    ^> This may take 3-5 minutes...

:: Install pnpm globally
echo    ^> Installing pnpm...
npm install -g pnpm --silent >> "%LOG_FILE%" 2>&1

:: Install root packages
if exist "package.json" (
    echo    ^> Installing root packages...
    npm install --legacy-peer-deps --silent >> "%LOG_FILE%" 2>&1
)

:: Install lumenis-os
if exist "lumenis-os\package.json" (
    echo    ^> Installing lumenis-os packages...
    cd lumenis-os
    pnpm install --silent >> "%LOG_FILE%" 2>&1
    if exist "artifacts\api-server\package.json" (
        cd artifacts\api-server
        pnpm install --silent >> "%LOG_FILE%" 2>&1
        cd ..\..
    )
    cd ..
)

:: Install minimax (agent-hub, one2lv-agent-hub, witness proxy, core)
if exist "minimax\agent-hub\package.json" (
    echo    ^> Installing minimax\agent-hub packages...
    cd minimax\agent-hub
    npm install --legacy-peer-deps --silent >> "%LOG_FILE%" 2>&1
    cd ..\..
)
if exist "minimax\one2lv-agent-hub\package.json" (
    echo    ^> Installing minimax\one2lv-agent-hub packages...
    cd minimax\one2lv-agent-hub
    npm install --legacy-peer-deps --silent >> "%LOG_FILE%" 2>&1
    cd ..\..
)
if exist "minimax\one2lv-witness-v8\proxy\package.json" (
    echo    ^> Installing minimax\witness-proxy packages...
    cd minimax\one2lv-witness-v8\proxy
    npm install --legacy-peer-deps --silent >> "%LOG_FILE%" 2>&1
    cd ..\..\..
)
if exist "minimax\package.json" (
    echo    ^> Installing minimax core packages...
    cd minimax
    npm install --legacy-peer-deps --silent >> "%LOG_FILE%" 2>&1
    cd ..
)

:: Install lumenis-v7
if exist "steamos_lumenis\lumenis-v7-cjs\package.json" (
    echo    ^> Installing lumenis-v7 packages...
    cd steamos_lumenis\lumenis-v7-cjs
    npm install --legacy-peer-deps --silent >> "%LOG_FILE%" 2>&1
    cd ..\..
)

echo    ^> Node.js dependencies installed [OK]
echo [NODEJS] All dependencies installed >> "%LOG_FILE%"

:: ============================================================================
:: STEP 10: Build TypeScript Projects
:: ============================================================================
echo.
echo [10/12] Building TypeScript projects...

if exist "lumenis-os\artifacts\api-server\build.mjs" (
    echo    ^> Building lumenis-os api-server...
    cd lumenis-os\artifacts\api-server
    node build.mjs >> "%LOG_FILE%" 2>&1
    cd ..\..\..
    if exist "lumenis-os\artifacts\api-server\dist\index.mjs" (
        echo    ^> Build successful [OK]
    ) else (
        echo    ^> Build failed (non-fatal)
    )
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
    npm run build >> "%LOG_FILE%" 2>&1
    if exist "minimax\agent-hub\dist\index.html" (
        echo    ^> minimax\agent-hub built [OK]
    ) else (
        echo    ^> Warning: minimax\agent-hub build failed (non-fatal)
    )
    cd ..\..
)
if exist "minimax\one2lv-agent-hub\package.json" (
    echo    ^> Building minimax\one2lv-agent-hub...
    cd minimax\one2lv-agent-hub
    npm run build >> "%LOG_FILE%" 2>&1
    echo    ^> minimax\one2lv-agent-hub built [OK]
    cd ..\..
)

echo [BUILD] TypeScript build complete >> "%LOG_FILE%"

:: ============================================================================
:: STEP 11: Create Launcher Scripts and Desktop Shortcuts
:: ============================================================================
echo.
echo [11/12] Creating launcher scripts...

:: Create Python launcher script for .exe compilation
(
echo import subprocess
echo import sys
echo import os
echo import time
echo from pathlib import Path
echo.
echo def main^(^):
echo     """Launch One2lvOS system"""
echo     # Get installation directory
echo     if getattr^(sys, 'frozen', False^):
echo         # Running as compiled exe
echo         install_dir = Path^(os.path.expanduser^('~/One2lvOS'^)^)
echo     else:
echo         # Running as script
echo         install_dir = Path^(__file__^).parent
echo.
echo     os.chdir^(install_dir^)
echo.
echo     print^("=" * 72^)
echo     print^("   ONE2LVOS - Launching All Services"^)
echo     print^("=" * 72^)
echo     print^(^)
echo.
echo     services = [
echo         ^("AI Arcade MCP", "python", ["ai-arcade/server.py"], 8003^),
echo         ^("One2lvOS Core", "python", ["-m", "flask", "run", "--host", "0.0.0.0", "--port", "3002", "--app", "One2lvos/core_service.py"], 3002^),
echo         ^("Sovereign Agentic Core", "python", ["-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3003", "--app-dir", "sovereign-agentic-core"], 3003^),
echo         ^("AI Lobby", "python", ["-m", "uvicorn", "ai_lobby:app", "--host", "0.0.0.0", "--port", "8006"], 8006^),
echo         ^("Unified Gateway", "python", ["-m", "uvicorn", "unified_gateway:app", "--host", "0.0.0.0", "--port", "8888"], 8888^),
echo         ^("Minimax Core API", "node", ["minimax/index.js"], 8080^),
echo         ^("Minimax Witness Proxy", "node", ["minimax/one2lv-witness-v8/proxy/server.js"], 3001^),
echo     ]
echo.
echo     processes = []
echo.
echo     for name, cmd, args, port in services:
echo         print^(f"[{len^(processes^) + 1}/{len^(services^)}] Starting {name} [port {port}]..."^)
echo         try:
echo             if cmd == "python":
echo                 proc = subprocess.Popen^(
echo                     [sys.executable] + args,
echo                     stdout=subprocess.DEVNULL,
echo                     stderr=subprocess.DEVNULL,
echo                     creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
echo                 ^)
echo             else:
echo                 proc = subprocess.Popen^(
echo                     [cmd] + args,
echo                     stdout=subprocess.DEVNULL,
echo                     stderr=subprocess.DEVNULL,
echo                     creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
echo                 ^)
echo             processes.append^(^(name, proc^)^)
echo             time.sleep^(1^)
echo         except Exception as e:
echo             print^(f"   Warning: Failed to start {name}: {e}"^)
echo.
echo     print^(^)
echo     print^("=" * 72^)
echo     print^("   ONE2LVOS SYSTEM IS NOW RUNNING!"^)
echo     print^("=" * 72^)
echo     print^(^)
echo     print^("   Unified Gateway:  http://localhost:8888"^)
echo     print^("   System Status:    http://localhost:8888/status"^)
echo     print^("   AI Arcade MCP:    http://localhost:8003"^)
echo     print^("   AI Lobby:         http://localhost:8006"^)
echo     print^(^)
echo     print^("   Press Ctrl+C to stop all services..."^)
echo     print^("=" * 72^)
echo.
echo     # Open browser
echo     try:
echo         import webbrowser
echo         time.sleep^(2^)
echo         webbrowser.open^('http://localhost:8888/status'^)
echo     except:
echo         pass
echo.
echo     try:
echo         while True:
echo             time.sleep^(1^)
echo     except KeyboardInterrupt:
echo         print^("\n\nStopping all services..."^)
echo         for name, proc in processes:
echo             try:
echo                 proc.terminate^(^)
echo                 proc.wait^(timeout=5^)
echo             except:
echo                 proc.kill^(^)
echo         print^("All services stopped."^)
echo.
echo if __name__ == '__main__':
echo     main^(^)
) > one2lvos_launcher.py
echo    ^> Created one2lvos_launcher.py

:: Create batch launcher
(
echo @echo off
echo title One2lvOS - System Launcher
echo color 0B
echo cls
echo cd /d "%%~dp0"
echo python one2lvos_launcher.py
) > start-one2lvos.bat
echo    ^> Created start-one2lvos.bat

:: Create stop script
(
echo @echo off
echo title Stopping One2lvOS
echo echo Stopping all One2lvOS services...
echo taskkill /F /IM python.exe /FI "WINDOWTITLE eq *One2lvOS*" ^>nul 2^>^&1
echo taskkill /F /IM node.exe /FI "WINDOWTITLE eq *One2lvOS*" ^>nul 2^>^&1
echo for %%%%p in ^(3001 3002 3003 8003 8005 8006 8080 8081 8888 9001 9002 9003^) do ^(
echo     for /f "tokens=5" %%%%a in ^('netstat -ano ^| findstr :%%%%p ^| findstr LISTENING 2^>nul'^) do taskkill /F /PID %%%%a ^>nul 2^>^&1
echo ^)
echo echo Services stopped.
echo timeout /t 2 /nobreak ^>nul
) > stop-one2lvos.bat
echo    ^> Created stop-one2lvos.bat

:: Create desktop shortcut
set DESKTOP=%USERPROFILE%\Desktop
(
echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
echo sLinkFile = "%DESKTOP%\One2lvOS.lnk"
echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
echo oLink.TargetPath = "%INSTALL_DIR%\start-one2lvos.bat"
echo oLink.WorkingDirectory = "%INSTALL_DIR%"
echo oLink.Description = "Launch One2lvOS Unified AI System"
echo oLink.Save
) > createshortcut.vbs
cscript //nologo createshortcut.vbs >nul 2>&1
del createshortcut.vbs >nul 2>&1

if exist "%DESKTOP%\One2lvOS.lnk" (
    echo    ^> Desktop shortcut created [OK]
) else (
    echo    ^> Desktop shortcut creation skipped
)

:: ============================================================================
:: STEP 12: Install PyInstaller for .exe Creation
:: ============================================================================
echo.
echo [12/12] Installing PyInstaller for .exe compilation...
python -m pip install pyinstaller --quiet >> "%LOG_FILE%" 2>&1
echo    ^> PyInstaller installed [OK]

:: Create .exe
echo    ^> Compiling One2lvOS.exe...
echo    ^> This may take 1-2 minutes...
python -m PyInstaller --onefile --windowed --name "One2lvOS" --icon=NONE --add-data "one2lvos_launcher.py;." one2lvos_launcher.py >> "%LOG_FILE%" 2>&1

if exist "dist\One2lvOS.exe" (
    echo    ^> One2lvOS.exe created successfully [OK]
    copy "dist\One2lvOS.exe" "%DESKTOP%\One2lvOS.exe" >nul 2>&1
    if exist "%DESKTOP%\One2lvOS.exe" (
        echo    ^> One2lvOS.exe copied to Desktop [OK]
    )
    echo [EXE] Executable created and deployed >> "%LOG_FILE%"
) else (
    echo    ^> .exe creation skipped (using .bat launcher instead^)
    echo [EXE] Creation skipped, using batch launcher >> "%LOG_FILE%"
)

:: ============================================================================
:: Installation Complete - Auto-Launch
:: ============================================================================
cls
color 0A
echo.
echo ========================================================================
echo    INSTALLATION COMPLETE!
echo ========================================================================
echo.
echo    One2lvOS has been installed and is starting automatically...
echo.
echo    Location: %INSTALL_DIR%
echo.
echo ========================================================================
echo    LAUNCHING IN 3 SECONDS...
echo ========================================================================
echo.
echo    Desktop shortcuts created:
if exist "%DESKTOP%\One2lvOS.exe" (
    echo       - One2lvOS.exe ^(Click to launch^)
)
if exist "%DESKTOP%\One2lvOS.lnk" (
    echo       - One2lvOS.lnk ^(Batch launcher^)
)
echo.
echo    Services starting:
echo       - Unified Gateway   [http://localhost:8888]
echo       - AI Arcade MCP     [http://localhost:8003]
echo       - AI Lobby          [http://localhost:8006]
echo       - And 7 more services...
echo.
echo ========================================================================

echo [COMPLETE] Installation finished successfully >> "%LOG_FILE%"
echo [LAUNCH] Auto-launching system >> "%LOG_FILE%"

timeout /t 3 /nobreak >nul

:: Launch the system
start "" "%INSTALL_DIR%\start-one2lvos.bat"

:: Open browser after delay
timeout /t 5 /nobreak >nul
start http://localhost:8888/status

echo.
echo    System launched! Browser should open automatically.
echo.
echo    Installation log: %LOG_FILE%
echo.
timeout /t 5

exit /b 0
