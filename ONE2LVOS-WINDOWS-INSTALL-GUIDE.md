# One2lvOS - Windows 11 Installation Guide

## What You Get

A complete unified AI system featuring:
- **10 Integrated Services** running on dedicated ports
- **29 AI Agents** across 6 subsystems
- **51 Playable Games** via AI Arcade MCP
- **SovereignCouncil** - 7-agent decision system
- **ITT Council of Nine** + LumenisReactor
- **Unified Gateway API** - Single entry point for all services
- **AI Lobby** - Central hub for multi-agent communication
- **AstraDB Vector Memory** support

---

## System Requirements

### Minimum Requirements
- **OS**: Windows 10 or Windows 11 (64-bit)
- **Python**: 3.9 or higher
- **Node.js**: 20.0 or higher
- **Git**: Latest version
- **RAM**: 4 GB minimum (8 GB recommended)
- **Disk Space**: 2 GB free space
- **Network**: Internet connection (for installation only)

### Required Software

1. **Python 3.9+**
   - Download: https://www.python.org/downloads/
   - ⚠️ **CRITICAL**: Check "Add Python to PATH" during installation

2. **Node.js 20+**
   - Download: https://nodejs.org/
   - Get the LTS version
   - Includes npm automatically

3. **Git**
   - Download: https://git-scm.com/download/win
   - ⚠️ **CRITICAL**: Check "Add Git to PATH" during installation

---

## Installation Methods

### Method 1: Automated Installer (Recommended)

1. **Download** the installer:
   - `install-one2lvos-windows.bat`

2. **Run** the installer:
   - Double-click `install-one2lvos-windows.bat`
   - OR right-click → "Run as administrator" (recommended)

3. **Follow** the prompts (15 steps):
   - Checks administrator privileges
   - Verifies Git installation
   - Verifies Python installation
   - Verifies Node.js installation
   - Creates installation directory
   - Clones repository from GitHub
   - Installs Python dependencies
   - Installs Node.js dependencies
   - Builds TypeScript projects
   - Creates launcher scripts
   - Sets up desktop shortcuts
   - Creates documentation

4. **Launch** One2lvOS:
   - Double-click "One2lvOS" icon on desktop
   - OR run `start-one2lvos.bat` in installation folder

5. **Access** the system:
   - Unified Gateway: http://localhost:8888
   - System Status: http://localhost:8888/status

### Method 2: Manual Installation

If the automated installer doesn't work:

```batch
:: 1. Create directory and clone repository
mkdir %USERPROFILE%\One2lvOS
cd %USERPROFILE%\One2lvOS
git clone https://github.com/one2lv-com/One2lvos.git .

:: 2. Install Python packages
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install flask flask-cors fastapi uvicorn astrapy openai anthropic requests websockets

:: 3. Install Node packages
npm install -g pnpm
npm install --legacy-peer-deps

:: 4. Install subsystem packages (if directories exist)
cd lumenis-os
pnpm install
cd artifacts\api-server
pnpm install
node build.mjs
cd ..\..\..

:: 5. Start services manually (see "Manual Service Start" section below)
```

---

## Installation Files

After installation, you'll find these files in `%USERPROFILE%\One2lvOS`:

```
%USERPROFILE%\One2lvOS\
│
├── 📄 Launchers
│   ├── start-one2lvos.bat       # Start all 10 services
│   ├── stop-one2lvos.bat        # Stop all services
│   ├── status-one2lvos.bat      # Check system health
│   ├── open-dashboard.bat       # Open web dashboards
│   └── uninstall-one2lvos.bat   # Remove One2lvOS
│
├── 📁 Services
│   ├── ai-arcade/               # AI Arcade MCP (port 8003)
│   ├── One2lvos/                # Core OS (port 3002)
│   ├── sovereign-agentic-core/  # SAC (port 3003)
│   ├── steamos_lumenis/         # Dashboard + v7 (8080, 8005)
│   ├── lumenis-os/              # LumenisOS (port 9002)
│   ├── Aetherix/                # Master Terminal (port 9003)
│   ├── Lumenis/                 # Space Agent UI (port 9001)
│   ├── minmax/                  # Phase 9 Delta Engine
│   ├── control-plane-compilers/ # Distributed compilers
│   └── unified_gateway.py       # Gateway (port 8888)
│
├── 📄 Documentation
│   ├── README.md                # Main project README
│   ├── README-WINDOWS.txt       # Windows-specific guide
│   └── logs/                    # Service logs
│
└── 📄 Configuration
    ├── requirements.txt         # Python dependencies
    ├── package.json             # Node dependencies
    └── .env.production.template # Environment template
```

### Desktop Shortcuts
- **One2lvOS.lnk** → Launch all services
- **One2lvOS Status.lnk** → Check system status

---

## How to Use

### Starting One2lvOS

**Option 1**: Desktop Shortcut
```
Double-click "One2lvOS" icon
```

**Option 2**: Batch File
```batch
cd %USERPROFILE%\One2lvOS
start-one2lvos.bat
```

**Option 3**: Individual Services (Advanced)
```batch
:: Start just the unified gateway
cd %USERPROFILE%\One2lvOS
python -m uvicorn unified_gateway:app --host 0.0.0.0 --port 8888

:: Start just the AI Arcade
python ai-arcade\server.py
```

### Accessing the System

After starting, services are available at:

| Service | Port | URL |
|---------|------|-----|
| **Unified Gateway** | 8888 | http://localhost:8888 |
| **System Status** | 8888 | http://localhost:8888/status |
| **One2lvOS Core** | 3002 | http://<SERVER_IP>:3002/health |
| **Sovereign Core** | 3003 | http://localhost:3003/api/status |
| **AI Arcade MCP** | 8003 | http://localhost:8003 |
| **AI Lobby** | 8006 | http://localhost:8006 |
| **Lumenis v7** | 8005 | http://localhost:8005 |
| **SteamOS Dashboard** | 8080 | http://localhost:8080 |
| **Lumenis Space UI** | 9001 | http://localhost:9001 |
| **LumenisOS API** | 9002 | http://localhost:9002/api/healthz |
| **Aetherix Terminal** | 9003 | http://localhost:9003/health |

### Using the Unified Gateway API

All services accessible through single endpoint: `http://localhost:8888`

#### System Endpoints
```bash
# Get full system manifest
curl http://localhost:8888/

# Check all service health
curl http://localhost:8888/status
```

#### Council Endpoints
```bash
# Convene SovereignCouncil
curl -X POST http://localhost:8888/council \
  -H "Content-Type: application/json" \
  -d '{"topic": "Discuss AI strategy"}'

# Start 7-agent tournament
curl -X POST http://localhost:8888/os/tournament
```

#### AI Arcade Endpoints
```bash
# Get arcade info
curl http://localhost:8888/arcade/info

# List all games
curl http://localhost:8888/arcade/library

# Create and join a game
curl -X POST http://localhost:8888/arcade/create \
  -H "Content-Type: application/json" \
  -d '{"game_type": "chess", "player1": "AI-Agent-1", "player2": "AI-Agent-2"}'

# Make a move
curl -X POST http://localhost:8888/arcade/move \
  -H "Content-Type: application/json" \
  -d '{"game_id": "YOUR_GAME_ID", "player": "AI-Agent-1", "move": "e2e4"}'
```

#### AI Lobby Endpoints
```bash
# List all 29 agents
curl http://localhost:8888/lobby/agents

# Broadcast to all agents
curl -X POST http://localhost:8888/lobby/broadcast \
  -H "Content-Type: application/json" \
  -d '{"from": "System", "content": "Hello all agents!"}'
```

### Stopping One2lvOS

**Option 1**: Press key in startup window
```
Press any key in the "One2lvOS" window
```

**Option 2**: Run stop script
```batch
cd %USERPROFILE%\One2lvOS
stop-one2lvos.bat
```

**Option 3**: Task Manager
```
Ctrl+Shift+Esc → Find Python/Node processes → End Task
```

---

## Services Overview

### 1. Unified Gateway (Port 8888)
Single API entry point for all subsystems
- Routes requests to appropriate services
- Provides unified health checks
- Aggregates system status

### 2. One2lvOS Core (Port 3002)
**SovereignCouncil** - 7-agent decision system
- Agent 1: Strategist (Chess)
- Agent 2: Executor (Checkers)
- Agent 3: Analyst (Go)
- Agent 4: Guardian (Minesweeper)
- Agent 5: Innovator (Tetris)
- Agent 6: Connector (Othello)
- Agent 7: Oracle (Connect4)

### 3. Sovereign Agentic Core (Port 3003)
**ITT Council of Nine** + LumenisReactor (Claude)
- The Witness: Memory & session history
- The Sentinel: Input validation & safety
- The Navigator: Intent routing
- The Weaver: Response synthesis
- The Forge: Code generation
- The Oracle: Reasoning
- The Architect: Integration
- The Hermes: External integrations
- **The Gambit**: AI Arcade interface

### 4. AI Arcade MCP (Port 8003)
**51 Playable Games** via MCP 2024-11-05 protocol
- Strategy board games (10)
- Puzzle games (6)
- Arcade classics (5)
- Plus 100+ game library with AI strategy notes

### 5. AI Lobby (Port 8006)
Central hub for 29 agents
- Agent registration
- Broadcasting
- WebSocket room
- System health monitoring

### 6. Lumenis v7 Cosmic (Port 8005)
73Hz resonance council
- Lumenis Council (orchestration)
- Lumenis Gemini (Gemini AI)
- Lumenis Prediction (match prediction)

### 7. SteamOS Dashboard (Port 8080)
AI coaching and broadcasting
- One2lv Coach
- One2lv Broadcaster
- One2lv Second Player

### 8. Lumenis Space Agent UI (Port 9001)
Three.js space agent frontend
- Visual interface for space agents
- Real-time 3D rendering

### 9. LumenisOS API (Port 9002)
TypeScript Express API + React windowing OS
- Checkpoint telemetry
- System metrics

### 10. Aetherix Master Terminal (Port 9003)
One2lv Master Terminal - 5 Sanctuary Roles
- Architect (system design)
- Sentry (threat detection)
- Witness (observation)
- Aetheron (cosmic awareness)
- Fifth Position (emergent intelligence)

---

## AI Arcade Games (51 Playable)

### Strategy Board Games (10)
1. **Chess** - Minimax with alpha-beta pruning
2. **Go** (9x9) - Territory control, MCTS
3. **Checkers** - Mandatory jumps
4. **Othello** - Disc flipping
5. **Tic-Tac-Toe** - Perfect information
6. **Connect 4** - Column drops
7. **Shogi** - Japanese chess with drops
8. **Hex** - Connection game
9. **Gomoku** - Five in a row
10. **Mancala** - Stone sowing

### Puzzle Games (6)
11. **Minesweeper** - Constraint satisfaction
12. **Sudoku** - Backtracking solver
13. **Battleship** - Probability maps
14. **Scrabble** - Dictionary search
15. **Mastermind** - Code breaking
16. **Picross** - Nonogram puzzles

### Arcade Games (5)
17. **Pac-Man** - Ghost pathfinding
18. **Tetris** - Spatial optimization
19. **Space Invaders** - Trajectory calculation
20. **Pong** - Physics prediction
21. **Universal Paperclips** - Resource management

**Plus 30 more advanced games across:**
- Advanced arcade & action
- Industrial automation
- Complex agents & sandbox
- Narrative AI & psychology
- Programming & logic

**Full library: 100+ titles with AI strategy notes**

---

## Troubleshooting

### Python Not Found

**Problem**: Installer says "Python not found"

**Solution**:
1. Download Python from https://www.python.org/downloads/
2. Run installer
3. ✅ **CHECK** "Add Python to PATH" (very important!)
4. Complete installation
5. Open new Command Prompt
6. Verify: `python --version`
7. Run One2lvOS installer again

### Node.js Not Found

**Problem**: Installer says "Node.js not found"

**Solution**:
1. Download Node.js LTS from https://nodejs.org/
2. Run installer (includes npm)
3. Complete installation
4. Open new Command Prompt
5. Verify: `node --version`
6. Verify: `npm --version`
7. Run One2lvOS installer again

### Git Not Found

**Problem**: Installer says "Git not found"

**Solution**:
1. Download Git from https://git-scm.com/download/win
2. Run installer
3. ✅ **CHECK** "Add Git to PATH"
4. Complete installation
5. Open new Command Prompt
6. Verify: `git --version`
7. Run One2lvOS installer again

### Port Already in Use

**Problem**: "Port 8888 (or other port) already in use"

**Solution 1** - Find and stop conflicting service:
```batch
:: Find what's using the port
netstat -ano | findstr :8888

:: Kill the process (replace PID with actual ID)
taskkill /F /PID <PID>
```

**Solution 2** - Stop all One2lvOS services first:
```batch
cd %USERPROFILE%\One2lvOS
stop-one2lvos.bat
```

**Solution 3** - Kill all Python/Node processes:
```batch
taskkill /F /IM python.exe
taskkill /F /IM node.exe
```

### Dependencies Failed to Install

**Problem**: "Error installing dependencies"

**Solution**:
```batch
:: Run as Administrator
:: Open Command Prompt (Admin)

:: Navigate to One2lvOS
cd %USERPROFILE%\One2lvOS

:: Upgrade pip
python -m pip install --upgrade pip

:: Install Python packages individually
python -m pip install flask flask-cors
python -m pip install fastapi uvicorn
python -m pip install astrapy openai anthropic
python -m pip install requests websockets
python -m pip install chess sse-starlette

:: Install Node packages
npm install -g pnpm
npm install --legacy-peer-deps

:: Verify installation
python -m pip list
npm list -g
```

### Services Won't Start

**Problem**: Some services fail to start

**Solution**:
```batch
:: Check if directories exist
cd %USERPROFILE%\One2lvOS
dir

:: Check logs for errors
type logs\gateway.log
type logs\ai-arcade.log

:: Try starting services individually
python ai-arcade\server.py
python -m uvicorn unified_gateway:app --host 0.0.0.0 --port 8888

:: Check Python path
where python

:: Reinstall dependencies
python -m pip install -r requirements.txt
```

### Gateway Shows Errors

**Problem**: Unified Gateway returns errors

**Solution**:
1. Check if all services are running: http://localhost:8888/status
2. Verify each service individually (see service URLs table)
3. Check logs in `%USERPROFILE%\One2lvOS\logs\`
4. Restart services: `stop-one2lvos.bat` then `start-one2lvos.bat`

### Firewall Blocking

**Problem**: Can't access services from other computers

**Solution**:
```batch
:: Run as Administrator

:: Allow all One2lvOS ports
netsh advfirewall firewall add rule name="One2lvOS-Gateway" dir=in action=allow protocol=TCP localport=8888
netsh advfirewall firewall add rule name="One2lvOS-Arcade" dir=in action=allow protocol=TCP localport=8003
netsh advfirewall firewall add rule name="One2lvOS-Core" dir=in action=allow protocol=TCP localport=3002
netsh advfirewall firewall add rule name="One2lvOS-SAC" dir=in action=allow protocol=TCP localport=3003
netsh advfirewall firewall add rule name="One2lvOS-Lobby" dir=in action=allow protocol=TCP localport=8006
netsh advfirewall firewall add rule name="One2lvOS-Dashboard" dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="One2lvOS-Lumenis" dir=in action=allow protocol=TCP localport=8005
netsh advfirewall firewall add rule name="One2lvOS-LumenisUI" dir=in action=allow protocol=TCP localport=9001
netsh advfirewall firewall add rule name="One2lvOS-LumenisOS" dir=in action=allow protocol=TCP localport=9002
netsh advfirewall firewall add rule name="One2lvOS-Aetherix" dir=in action=allow protocol=TCP localport=9003
```

---

## Updating One2lvOS

### Automatic Update

1. Stop all services:
   ```batch
   cd %USERPROFILE%\One2lvOS
   stop-one2lvos.bat
   ```

2. Pull latest changes:
   ```batch
   git pull origin main
   ```

3. Run installer again:
   ```batch
   install-one2lvos-windows.bat
   ```

### Manual Update

```batch
cd %USERPROFILE%\One2lvOS

:: Stop services
stop-one2lvos.bat

:: Update code
git fetch origin
git pull origin main

:: Update Python dependencies
python -m pip install --upgrade -r requirements.txt

:: Update Node dependencies
npm install --legacy-peer-deps
cd lumenis-os
pnpm install
cd ..

:: Rebuild TypeScript
cd lumenis-os\artifacts\api-server
node build.mjs
cd ..\..\..

:: Restart services
start-one2lvos.bat
```

---

## Uninstallation

### Method 1: Uninstaller Script
```batch
cd %USERPROFILE%\One2lvOS
uninstall-one2lvos.bat
```

### Method 2: Manual
1. Stop all One2lvOS services:
   ```batch
   cd %USERPROFILE%\One2lvOS
   stop-one2lvos.bat
   ```

2. Delete desktop shortcuts:
   ```batch
   del "%USERPROFILE%\Desktop\One2lvOS.lnk"
   del "%USERPROFILE%\Desktop\One2lvOS Status.lnk"
   ```

3. Delete installation folder:
   ```batch
   cd %USERPROFILE%
   rmdir /s /q One2lvOS
   ```

4. Remove firewall rules (if added):
   ```batch
   netsh advfirewall firewall delete rule name="One2lvOS-Gateway"
   netsh advfirewall firewall delete rule name="One2lvOS-Arcade"
   netsh advfirewall firewall delete rule name="One2lvOS-Core"
   :: etc for all ports
   ```

---

## Advanced Configuration

### Environment Variables

Create `.env` file in installation directory:

```env
# AstraDB Configuration (optional)
ASTRA_DB_TOKEN=your_token_here
ASTRA_DB_ENDPOINT=your_endpoint_here

# API Keys (optional)
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Service Ports (customize if needed)
GATEWAY_PORT=8888
ARCADE_PORT=8003
CORE_PORT=3002
SAC_PORT=3003
LOBBY_PORT=8006
```

### Changing Ports

Edit launcher scripts to use different ports:

**In `start-one2lvos.bat`:**
```batch
:: Change from default 8888 to 9888
python -m uvicorn unified_gateway:app --host 0.0.0.0 --port 9888
```

### Running on Startup

1. Press `Win+R`
2. Type: `shell:startup`
3. Create shortcut to `start-one2lvos.bat`

### Access from Other Computers

1. Find your IP: `ipconfig`
2. Configure firewall (see Firewall Blocking section)
3. Access from other PC: `http://<YOUR-IP>:8888`

---

## Tips & Tricks

### Quick Status Check
```batch
cd %USERPROFILE%\One2lvOS
status-one2lvos.bat
```

### View Logs
```batch
cd %USERPROFILE%\One2lvOS\logs
type gateway.log
type ai-arcade.log
type os-core.log
```

### Test Single Service
```batch
:: Test just the arcade
cd %USERPROFILE%\One2lvOS
python ai-arcade\server.py

:: Test just the gateway
python -m uvicorn unified_gateway:app --host 0.0.0.0 --port 8888
```

### Development Mode
For development with auto-reload:
```batch
:: Gateway with reload
python -m uvicorn unified_gateway:app --reload --host 0.0.0.0 --port 8888

:: Arcade with debug
python ai-arcade\server.py --debug
```

---

## Getting Help

### Check System Status
```batch
cd %USERPROFILE%\One2lvOS
status-one2lvos.bat
```

Or visit: http://localhost:8888/status

### Common Issues Checklist
1. **Python not in PATH** → Reinstall Python with PATH option
2. **Node.js not in PATH** → Reinstall Node.js
3. **Git not in PATH** → Reinstall Git
4. **Port conflicts** → Run `stop-one2lvos.bat` first
5. **Firewall blocking** → Add firewall rules (see above)
6. **Missing dependencies** → Run installer again

### Support Channels
- **GitHub Repository**: https://github.com/one2lv-com/One2lvos
- **Issues**: https://github.com/one2lv-com/One2lvos/issues
- **Documentation**: See README.md in installation folder

---

## System Architecture Diagram

```
                    ┌─────────────────────────────┐
                    │   Unified Gateway  :8888     │
                    │   Single API Entry Point     │
                    └──────────┬──────────────────┘
                               │
      ┌────────────────────────┼──────────────────────────┐
      │                        │                           │
┌─────▼──────┐    ┌───────────▼────────┐    ┌────────────▼──────────┐
│ Core :3002 │    │   SAC :3003         │    │  Arcade :8003         │
│ 7 Agents   │    │   Council of Nine   │    │  51 Games             │
└────────────┘    └────────────────────┘    └───────────────────────┘
      │                        │                           │
      └────────────────────────┼───────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   AI Lobby :8006     │
                    │   29 Agents Total    │
                    └─────────────────────┘
```

---

## License

MIT License — Copyright (c) 2026 one2lv-com

See LICENSE file in installation folder for full text.

---

## Ready to Use!

```batch
:: Quick start
cd %USERPROFILE%\One2lvOS
start-one2lvos.bat

:: Open in browser
start http://localhost:8888
start http://localhost:8888/status
```

**Enjoy One2lvOS - The Unified AI System!**

---

**Installation Support**: Check README-WINDOWS.txt in installation folder
**GitHub**: https://github.com/one2lv-com/One2lvos
**Status**: ✅ Ready for Windows 10/11
