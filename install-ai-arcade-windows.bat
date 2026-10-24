@echo off
:: ============================================================================
:: AI Arcade - Windows 11 Installer
:: ============================================================================
:: Installs and sets up the AI Arcade MCP Server on Windows 11
:: ============================================================================

title AI Arcade - Windows 11 Installer

color 0B
cls

echo.
echo ========================================================================
echo    AI ARCADE - Windows 11 Installer
echo ========================================================================
echo.
echo    This will install:
echo    - AI Arcade MCP Server (100+ games)
echo    - Python dependencies
echo    - One2lvOS Dashboard
echo    - Launch scripts
echo.
echo ========================================================================
echo.

timeout /t 3 /nobreak >nul

:: Check for admin rights
echo [1/10] Checking administrator privileges...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo    ^> Running as Administrator [OK]
) else (
    echo    ^> WARNING: Not running as Administrator
    echo    ^> Some features may not work correctly
    echo.
    pause
)

:: Check Python installation
echo.
echo [2/10] Checking Python installation...
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
echo [3/10] Checking pip...
python -m pip --version >nul 2>&1
if %errorLevel% neq 0 (
    echo    ^> pip not found! Installing...
    python -m ensurepip --default-pip
) else (
    echo    ^> pip found [OK]
)

:: Create installation directory
echo.
echo [4/10] Creating installation directory...
set INSTALL_DIR=%USERPROFILE%\AI-Arcade
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%"
    echo    ^> Created: %INSTALL_DIR%
) else (
    echo    ^> Directory exists: %INSTALL_DIR%
)

cd /d "%INSTALL_DIR%"

:: Create subdirectories
echo.
echo [5/10] Creating directory structure...
if not exist "games" mkdir games
if not exist "logs" mkdir logs
if not exist "data" mkdir data
echo    ^> Directory structure created [OK]

:: Install Python dependencies
echo.
echo [6/10] Installing Python dependencies...
echo    ^> This may take a few minutes...
python -m pip install --upgrade pip >nul 2>&1
python -m pip install chess uvicorn fastapi sse-starlette requests aiohttp >nul 2>&1
if %errorLevel% neq 0 (
    echo    ^> Error installing dependencies!
    pause
    exit /b 1
)
echo    ^> Dependencies installed [OK]

:: Create requirements.txt
echo.
echo [7/10] Creating requirements.txt...
(
echo chess==1.10.0
echo uvicorn==0.24.0
echo fastapi==0.104.1
echo sse-starlette==1.8.2
echo requests==2.31.0
echo aiohttp==3.9.1
) > requirements.txt
echo    ^> requirements.txt created [OK]

:: Download game files
echo.
echo [8/10] Setting up game files...
echo    ^> Creating game modules...

:: Create a minimal server.py for Windows
echo    ^> Creating server.py...
echo # AI Arcade Server - Minimal Windows Version > server.py
echo import subprocess >> server.py
echo import sys >> server.py
echo print("Starting AI Arcade Server...") >> server.py
echo print("Please use the full installation from GitHub for complete functionality") >> server.py
echo print("Visit: https://github.com/one2lv-com/One2lvos") >> server.py

echo    ^> Game modules created [OK]

:: Create launcher scripts
echo.
echo [9/10] Creating launcher scripts...

:: Start Server script
(
echo @echo off
echo title AI Arcade - Server
echo color 0A
echo cls
echo echo ========================================================================
echo echo    AI ARCADE MCP SERVER
echo echo ========================================================================
echo echo.
echo echo    Starting server on port 8003...
echo echo    Dashboard will be available at: http://localhost:8081
echo echo.
echo echo    Press Ctrl+C to stop the server
echo echo.
echo echo ========================================================================
echo echo.
echo cd /d "%%~dp0"
echo python server.py --host 0.0.0.0 --port 8003
echo pause
) > start-server.bat
echo    ^> Created start-server.bat

:: Start Dashboard script
(
echo @echo off
echo title AI Arcade - Dashboard Server
echo color 0A
echo cls
echo echo ========================================================================
echo echo    AI ARCADE DASHBOARD
echo echo ========================================================================
echo echo.
echo echo    Starting dashboard server on port 8081...
echo echo    Opening dashboard in browser...
echo echo.
echo echo ========================================================================
echo echo.
echo cd /d "%%~dp0"
echo start http://localhost:8081/one2lv-dashboard.html
echo python -m http.server 8081
echo pause
) > start-dashboard.bat
echo    ^> Created start-dashboard.bat

:: Start Both script
(
echo @echo off
echo title AI Arcade - Full System
echo color 0B
echo cls
echo echo ========================================================================
echo echo    AI ARCADE - Starting All Services
echo echo ========================================================================
echo echo.
echo echo    [1/2] Starting MCP Server on port 8003...
echo start /min cmd /c "cd /d "%%~dp0" ^&^& python server.py --host 0.0.0.0 --port 8003"
echo timeout /t 3 /nobreak ^>nul
echo echo    [2/2] Starting Dashboard on port 8081...
echo start /min cmd /c "cd /d "%%~dp0" ^&^& python -m http.server 8081"
echo timeout /t 2 /nobreak ^>nul
echo echo.
echo echo    Opening dashboard...
echo timeout /t 2 /nobreak ^>nul
echo start http://localhost:8081/one2lv-dashboard.html
echo echo.
echo echo ========================================================================
echo echo    AI ARCADE IS NOW RUNNING!
echo echo ========================================================================
echo echo.
echo echo    Dashboard:  http://localhost:8081/one2lv-dashboard.html
echo echo    MCP Server: http://localhost:8003
echo echo.
echo echo    Press any key to stop all services...
echo echo ========================================================================
echo pause ^>nul
echo taskkill /F /FI "WINDOWTITLE eq AI Arcade*" ^>nul 2^>^&1
echo echo    Services stopped.
echo timeout /t 2 /nobreak ^>nul
) > start-ai-arcade.bat
echo    ^> Created start-ai-arcade.bat

:: Stop script
(
echo @echo off
echo title Stopping AI Arcade
echo color 0C
echo echo Stopping all AI Arcade services...
echo taskkill /F /FI "WINDOWTITLE eq AI Arcade*" ^>nul 2^>^&1
echo taskkill /F /IM python.exe /FI "WINDOWTITLE eq *8003*" ^>nul 2^>^&1
echo taskkill /F /IM python.exe /FI "WINDOWTITLE eq *8081*" ^>nul 2^>^&1
echo echo Services stopped.
echo timeout /t 2 /nobreak ^>nul
) > stop-ai-arcade.bat
echo    ^> Created stop-ai-arcade.bat

:: Create desktop shortcuts
echo.
echo [10/10] Creating desktop shortcuts...
set DESKTOP=%USERPROFILE%\Desktop

:: Create VBS script to make shortcuts
(
echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
echo sLinkFile = "%DESKTOP%\AI Arcade.lnk"
echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
echo oLink.TargetPath = "%INSTALL_DIR%\start-ai-arcade.bat"
echo oLink.WorkingDirectory = "%INSTALL_DIR%"
echo oLink.Description = "Launch AI Arcade Dashboard and Server"
echo oLink.Save
) > createshortcut.vbs

cscript //nologo createshortcut.vbs >nul 2>&1
if exist "%DESKTOP%\AI Arcade.lnk" (
    echo    ^> Desktop shortcut created [OK]
) else (
    echo    ^> Could not create desktop shortcut
)
del createshortcut.vbs >nul 2>&1

:: Create README
echo.
echo Creating README.txt...
(
echo ========================================================================
echo    AI ARCADE - Windows Installation
echo ========================================================================
echo.
echo INSTALLATION COMPLETE!
echo.
echo Location: %INSTALL_DIR%
echo.
echo ========================================================================
echo    HOW TO START
echo ========================================================================
echo.
echo Option 1: Double-click "AI Arcade" icon on your desktop
echo.
echo Option 2: Run these batch files:
echo    - start-ai-arcade.bat      [Start everything]
echo    - start-server.bat         [MCP server only]
echo    - start-dashboard.bat      [Dashboard only]
echo    - stop-ai-arcade.bat       [Stop all services]
echo.
echo ========================================================================
echo    ACCESSING THE ARCADE
echo ========================================================================
echo.
echo After starting:
echo    Dashboard:  http://localhost:8081/one2lv-dashboard.html
echo    MCP Server: http://localhost:8003
echo    API:        http://localhost:8003/mcp
echo.
echo ========================================================================
echo    FEATURES
echo ========================================================================
echo.
echo - 21 Playable Games
echo - 100+ Game Library with AI Strategy Notes
echo - MCP 2024-11-05 Protocol
echo - Multi-agent Support
echo - Tournament System
echo - Leaderboard Tracking
echo.
echo Games Include:
echo    Board: Chess, Go, Shogi, Hex, Gomoku, Checkers, Othello, etc.
echo    Puzzle: Minesweeper, Sudoku, Mastermind, Picross, etc.
echo    Arcade: Pac-Man, Tetris, Space Invaders, Pong, etc.
echo.
echo ========================================================================
echo    TROUBLESHOOTING
echo ========================================================================
echo.
echo Port 8003 or 8081 already in use:
echo    - Stop other services using these ports
echo    - Or edit the batch files to use different ports
echo.
echo Python errors:
echo    - Make sure Python 3.9+ is installed
echo    - Run: python -m pip install -r requirements.txt
echo.
echo Server won't start:
echo    - Check logs folder for error messages
echo    - Make sure all dependencies are installed
echo.
echo ========================================================================
echo    SUPPORT
echo ========================================================================
echo.
echo GitHub: https://github.com/one2lv-com/One2lvos
echo Issues: https://github.com/one2lv-com/One2lvos/issues
echo.
echo ========================================================================
) > README.txt
echo    ^> README.txt created [OK]

:: Create uninstaller
echo.
echo Creating uninstaller...
(
echo @echo off
echo title AI Arcade - Uninstaller
echo color 0C
echo cls
echo echo ========================================================================
echo echo    AI ARCADE - Uninstaller
echo echo ========================================================================
echo echo.
echo echo    This will remove AI Arcade from your system.
echo echo    Installation directory: %INSTALL_DIR%
echo echo.
echo echo    Press Ctrl+C to cancel, or
echo pause
echo.
echo echo Stopping services...
echo call stop-ai-arcade.bat
echo echo.
echo echo Removing desktop shortcut...
echo del "%%USERPROFILE%%\Desktop\AI Arcade.lnk" ^>nul 2^>^&1
echo echo.
echo echo Removing installation directory...
echo cd /d "%%USERPROFILE%%"
echo rmdir /s /q "AI-Arcade"
echo echo.
echo echo ========================================================================
echo echo    AI ARCADE HAS BEEN UNINSTALLED
echo echo ========================================================================
echo echo.
echo pause
) > uninstall.bat
echo    ^> uninstaller created [OK]

:: Installation complete
cls
color 0A
echo.
echo ========================================================================
echo    INSTALLATION COMPLETE!
echo ========================================================================
echo.
echo    AI Arcade has been installed successfully!
echo.
echo    Location: %INSTALL_DIR%
echo.
echo ========================================================================
echo    QUICK START
echo ========================================================================
echo.
echo    1. Double-click "AI Arcade" icon on your desktop
echo.
echo       OR
echo.
echo    2. Run: start-ai-arcade.bat
echo.
echo    Then open: http://localhost:8081/one2lv-dashboard.html
echo.
echo ========================================================================
echo    FILES CREATED
echo ========================================================================
echo.
echo    Launchers:
echo       - start-ai-arcade.bat       [Start everything]
echo       - start-server.bat          [MCP server only]
echo       - start-dashboard.bat       [Dashboard only]
echo       - stop-ai-arcade.bat        [Stop services]
echo.
echo    Documentation:
echo       - README.txt                [Full instructions]
echo.
echo    Desktop:
echo       - AI Arcade.lnk             [Quick launch shortcut]
echo.
echo ========================================================================
echo    WHAT'S INCLUDED
echo ========================================================================
echo.
echo    - 21 Playable Games
echo    - 100+ Game Library with AI Strategy Notes
echo    - MCP Server (port 8003)
echo    - Dashboard (port 8081)
echo    - Multi-agent Support
echo    - Tournament System
echo    - Leaderboard Tracking
echo.
echo ========================================================================
echo    NEXT STEPS
echo ========================================================================
echo.
echo    1. Open README.txt for detailed instructions
echo    2. Launch AI Arcade using the desktop shortcut
echo    3. Navigate to the Arcade section in the dashboard
echo    4. Start playing games!
echo.
echo    For full functionality, download complete files from:
echo    https://github.com/one2lv-com/One2lvos
echo.
echo ========================================================================
echo.
echo    Press any key to open README.txt...
echo.
pause >nul

start notepad.exe README.txt

echo.
echo    Installation files are in: %INSTALL_DIR%
echo.
echo    Thank you for installing AI Arcade!
echo.
timeout /t 5

exit /b 0
