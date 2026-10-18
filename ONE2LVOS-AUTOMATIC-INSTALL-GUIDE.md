# One2lvOS - Fully Automatic Installation & .exe Launcher Guide

## What's New - Automatic Installation

This installer is **completely automatic**:
- ✅ Auto-installs Git, Python 3.12, Node.js 20 if missing
- ✅ Auto-clones repository from GitHub
- ✅ Auto-installs all dependencies (Python + Node.js)
- ✅ Auto-builds TypeScript projects
- ✅ Auto-creates .exe launcher
- ✅ Auto-launches the system
- ✅ **No user interaction required** (except initial run)

---

## Quick Start (One Click!)

### Method 1: Automatic Installer + .exe (Recommended)
```batch
1. Download: install-one2lvos-windows-auto.bat
2. Right-click → "Run as Administrator"
3. Wait 5-10 minutes
4. System launches automatically!
```

**That's it!** Everything installs and starts automatically.

### Method 2: Pre-built .exe (If already installed)
```batch
1. Double-click: One2lvOS.exe on Desktop
2. System starts immediately
```

---

## What Gets Created

### Desktop Icons
After installation, you'll find on your desktop:

1. **One2lvOS.exe** - Standalone executable launcher
   - Click to start entire system
   - No dependencies needed (Python bundled)
   - Can be moved anywhere
   - ~15-20 MB file

2. **One2lvOS.lnk** - Batch file shortcut (backup)
   - Runs start-one2lvos.bat
   - Alternative if .exe doesn't work

### Installation Directory: `%USERPROFILE%\One2lvOS`

```
%USERPROFILE%\One2lvOS\
│
├── One2lvOS.exe                    # Compiled launcher
├── one2lvos_launcher.py            # Source Python launcher
├── start-one2lvos.bat              # Batch launcher
├── stop-one2lvos.bat               # Stop all services
├── build-one2lvos-exe.bat          # Rebuild .exe
│
├── ai-arcade/                      # AI Arcade MCP (port 8003)
├── One2lvos/                       # Core OS (port 3002)
├── sovereign-agentic-core/         # SAC (port 3003)
├── [... 7 more service directories]
│
└── logs/                           # Service logs
```

---

## Installation Process (Automatic)

### What Happens Automatically

**Step 1: Software Detection & Installation**
- Checks for Git, Python, Node.js
- If missing: Downloads and installs automatically via:
  - **winget** (Windows 11 built-in)
  - **chocolatey** (if available)
  - **Direct download** (fallback)

**Step 2: Repository Clone**
- Clones: `https://github.com/one2lv-com/One2lvos`
- Or pulls latest if already exists

**Step 3: Python Dependencies**
- Upgrades pip
- Installs: flask, fastapi, uvicorn, astrapy, openai, anthropic, chess, etc.

**Step 4: Node.js Dependencies**
- Installs pnpm globally
- Installs all Node packages
- Handles: lumenis-os, minmax, lumenis-v7-cjs

**Step 5: TypeScript Build**
- Builds lumenis-os api-server
- Creates production bundles

**Step 6: .exe Creation**
- Installs PyInstaller
- Compiles one2lvos_launcher.py → One2lvOS.exe
- Copies to Desktop and installation folder

**Step 7: Auto-Launch**
- Starts all 10 services
- Opens browser to http://localhost:8888/status

**Total Time: 5-10 minutes** (depending on internet speed)

---

## The One2lvOS.exe Launcher

### Features

✅ **Standalone** - All Python code bundled inside
✅ **No console window** - Runs in background
✅ **Auto-recovery** - Restarts crashed services
✅ **Port management** - Clears conflicting ports
✅ **Browser integration** - Opens dashboard automatically
✅ **Graceful shutdown** - Press Ctrl+C to stop all

### What It Does

1. **Checks installation** - Verifies One2lvOS is at `%USERPROFILE%\One2lvOS`
2. **Clears ports** - Kills any processes on ports 8888, 8003, etc.
3. **Starts services** - Launches all 10 One2lvOS services
4. **Monitors health** - Watches for service crashes
5. **Opens browser** - Loads http://localhost:8888/status
6. **Waits for Ctrl+C** - Stops all on exit

### Services Started

| Service | Port | Description |
|---------|------|-------------|
| Unified Gateway | 8888 | Main API entry point |
| AI Arcade MCP | 8003 | 51 playable games |
| One2lvOS Core | 3002 | SovereignCouncil (7 agents) |
| Sovereign Core | 3003 | ITT Council of Nine |
| AI Lobby | 8006 | 29 agents hub |
| Lumenis v7 | 8005 | 73Hz resonance (optional) |
| SteamOS Dash | 8080 | AI coaching (optional) |
| Lumenis UI | 9001 | 3D space agents (optional) |
| LumenisOS API | 9002 | TypeScript API (optional) |
| Aetherix | 9003 | Master Terminal (optional) |

**5 core services + 5 optional services = 10 total**

---

## Rebuilding the .exe

If you modify the launcher code:

```batch
cd %USERPROFILE%\One2lvOS
build-one2lvos-exe.bat
```

This will:
1. Clean previous builds
2. Install/upgrade PyInstaller
3. Compile new One2lvOS.exe
4. Copy to Desktop

**Build time: 2-3 minutes**

---

## Windows Sandbox Mode (Advanced)

Run One2lvOS in complete isolation using Windows Sandbox.

### Requirements
- Windows 10/11 Pro, Enterprise, or Education
- Windows Sandbox feature enabled

### Enable Windows Sandbox

**Method 1: GUI**
1. Open "Turn Windows features on or off"
2. Check "Windows Sandbox"
3. Restart computer

**Method 2: Command (Admin)**
```batch
dism /online /Enable-Feature /FeatureName:Containers-DisposableClientVM -All
```

### Launch in Sandbox

**Option 1: Batch Script**
```batch
launch-one2lvos-sandbox.bat
```

**Option 2: Manual**
```batch
1. Double-click: One2lvOS-Sandbox.wsb
2. Wait for sandbox to start
3. One2lvOS launches automatically inside
```

### Sandbox Configuration

The sandbox:
- ✅ Has network access
- ✅ Mounts `%USERPROFILE%\One2lvOS` as `C:\One2lvOS`
- ✅ Auto-starts One2lvOS on login
- ✅ Allocates 4GB RAM
- ✅ Enables GPU virtualization
- ❌ **Changes are NOT saved** (reset on close)

### Access from Host

While sandbox is running:
```batch
# Inside sandbox: services run on localhost:8888
# From host: need sandbox IP address

1. Inside sandbox, run: ipconfig
2. Note IPv4 address (e.g., 172.x.x.x)
3. From host: http://172.x.x.x:8888
```

---

## Auto-Install Technical Details

### Software Installation Methods

**Priority 1: winget** (Windows 11 Package Manager)
```batch
winget install --id Git.Git -e --silent
winget install --id Python.Python.3.12 -e --silent
winget install --id OpenJS.NodeJS.LTS -e --silent
```

**Priority 2: chocolatey** (if installed)
```batch
choco install git python312 nodejs-lts -y
```

**Priority 3: Direct Download**
```batch
# Git
https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe

# Python 3.12
https://www.python.org/ftp/python/3.12.0/python-3.12.0-amd64.exe

# Node.js 20 LTS
https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi
```

All installers run with `/silent` or `/quiet` flags for unattended installation.

### PATH Updates

The installer automatically adds to PATH:
- `C:\Program Files\Git\cmd`
- `%LOCALAPPDATA%\Programs\Python\Python312`
- `%LOCALAPPDATA%\Programs\Python\Python312\Scripts`
- `%ProgramFiles%\nodejs`

Changes take effect immediately in the installer session.

### PyInstaller Configuration

The .exe is built with:
```batch
pyinstaller ^
  --onefile              # Single .exe file
  --console              # Show console window
  --name "One2lvOS"      # Executable name
  --add-data "..."       # Bundle launcher script
  --hidden-import=...    # Include required modules
  one2lvos_launcher.py
```

**Result**: ~15-20 MB standalone executable

---

## Troubleshooting

### Installation Fails

**Problem**: Auto-installer fails to install Git/Python/Node.js

**Solution**:
1. Check if winget is available: `winget --version`
2. If not: Install manually from official sites
3. Ensure internet connection is active
4. Run installer as Administrator

### .exe Doesn't Work

**Problem**: One2lvOS.exe fails to start

**Solution 1**: Use batch launcher instead
```batch
cd %USERPROFILE%\One2lvOS
start-one2lvos.bat
```

**Solution 2**: Rebuild .exe
```batch
cd %USERPROFILE%\One2lvOS
build-one2lvos-exe.bat
```

**Solution 3**: Run Python launcher directly
```batch
cd %USERPROFILE%\One2lvOS
python one2lvos_launcher.py
```

### Port Conflicts

**Problem**: "Port already in use" errors

**Solution**: The launcher automatically clears ports, but if issues persist:
```batch
# Stop everything first
stop-one2lvos.bat

# Kill specific ports manually
netstat -ano | findstr :8888
taskkill /F /PID <PID>
```

### Services Don't Start

**Problem**: Some services fail to start

**Solution**:
```batch
# Check logs
cd %USERPROFILE%\One2lvOS\logs
type *.log

# Check if directories exist
dir ai-arcade
dir One2lvos
dir sovereign-agentic-core

# Reinstall dependencies
cd %USERPROFILE%\One2lvOS
python -m pip install -r requirements.txt
npm install --legacy-peer-deps
```

### Sandbox Won't Launch

**Problem**: Windows Sandbox feature not available

**Solution**:
- Sandbox only works on Pro/Enterprise/Education editions
- Upgrade Windows edition OR
- Use regular launcher without sandbox

---

## Advanced Usage

### Environment Variables

Create `.env` in installation directory:
```env
# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# AstraDB
ASTRA_DB_TOKEN=AstraCS:...
ASTRA_DB_ENDPOINT=https://...

# Ports (customize)
GATEWAY_PORT=8888
ARCADE_PORT=8003
CORE_PORT=3002
```

### Running as Windows Service

**Option 1: NSSM (Non-Sucking Service Manager)**
```batch
# Download NSSM from https://nssm.cc/download
nssm install One2lvOS "%USERPROFILE%\One2lvOS\One2lvOS.exe"
nssm set One2lvOS Start SERVICE_AUTO_START
nssm start One2lvOS
```

**Option 2: Task Scheduler**
```batch
# Run at startup
schtasks /create /tn "One2lvOS" /tr "%USERPROFILE%\One2lvOS\One2lvOS.exe" /sc onlogon /rl highest
```

### Updating One2lvOS

To update to latest version:
```batch
cd %USERPROFILE%\One2lvOS
stop-one2lvos.bat

git pull origin main

# Reinstall dependencies
python -m pip install -r requirements.txt --upgrade
npm install --legacy-peer-deps

# Rebuild .exe
build-one2lvos-exe.bat

# Restart
start-one2lvos.bat
```

---

## Performance Tips

### Resource Usage
- **RAM**: ~500-1000 MB for core services
- **CPU**: Low usage (mostly idle)
- **Disk**: ~500 MB installation + logs
- **Network**: Only during API calls

### Optimization

**Reduce memory usage:**
```batch
# Start only core services (edit start-one2lvos.bat)
# Comment out optional services
```

**Faster startup:**
```batch
# Pre-install dependencies
python -m pip install -r requirements.txt
npm install --legacy-peer-deps

# Dependencies cached for next run
```

---

## Security Considerations

### Sandbox Benefits
✅ Complete isolation from host system
✅ No persistent changes
✅ Network access controllable
✅ Safe for testing/development

### Regular Installation
⚠️ Services run with user privileges
⚠️ Access to filesystem
⚠️ Network accessible on localhost
✅ Firewall blocks external by default

### Best Practices
1. **Use Sandbox for untrusted code**
2. **Firewall**: Add rules if exposing externally
3. **API Keys**: Use .env file, not hardcoded
4. **Updates**: Pull latest regularly
5. **Logs**: Review for suspicious activity

---

## Command Reference

### Launcher Commands
```batch
# Start system
One2lvOS.exe
# OR
start-one2lvos.bat

# Stop system
stop-one2lvos.bat
# OR
Ctrl+C in launcher window

# Build .exe
build-one2lvos-exe.bat

# Launch in sandbox
launch-one2lvos-sandbox.bat
```

### Service URLs
```
Unified Gateway:     http://localhost:8888
System Status:       http://localhost:8888/status
AI Arcade:           http://localhost:8003
AI Lobby:            http://localhost:8006
One2lvOS Core:       http://<SERVER_IP>:3002/health
Sovereign Core:      http://localhost:3003/api/status
```

---

## FAQ

**Q: Do I need to install Python/Node.js manually?**
A: No! The installer auto-installs everything.

**Q: Can I move One2lvOS.exe to another computer?**
A: The .exe needs the One2lvOS installation at `%USERPROFILE%\One2lvOS`. Copy the entire folder.

**Q: How do I uninstall?**
A: Run `uninstall-one2lvos.bat` or manually delete `%USERPROFILE%\One2lvOS` and desktop icons.

**Q: Is Windows Sandbox required?**
A: No, it's optional. Regular installation works fine.

**Q: How do I access from other computers?**
A: Configure firewall, then use your PC's IP: `http://YOUR-IP:8888`

**Q: Can I run multiple instances?**
A: Not on the same ports. Edit port numbers in configuration.

**Q: Does it work on Windows Home?**
A: Yes! Sandbox only needs Pro/Enterprise, but regular install works on Home.

---

## Getting Help

### Installation Log
```batch
type %TEMP%\one2lvos-install.log
```

### Service Logs
```batch
cd %USERPROFILE%\One2lvOS\logs
dir
type gateway.log
type ai-arcade.log
```

### Support Channels
- **GitHub**: https://github.com/one2lv-com/One2lvos
- **Issues**: https://github.com/one2lv-com/One2lvos/issues
- **README**: `%USERPROFILE%\One2lvOS\README.md`

---

## Complete Workflow

### First Time Setup
```batch
1. Download install-one2lvos-windows-auto.bat
2. Right-click → "Run as Administrator"
3. Wait 5-10 minutes
4. One2lvOS.exe appears on Desktop
5. System launches automatically
6. Browser opens to http://localhost:8888/status
```

### Daily Use
```batch
1. Double-click One2lvOS.exe on Desktop
2. Wait 10-20 seconds for services to start
3. Browser opens automatically
4. Use the system
5. Press Ctrl+C in window to stop
```

### In Sandbox (Testing)
```batch
1. Right-click One2lvOS-Sandbox.wsb → Open
2. Wait for sandbox window
3. System starts automatically
4. Test/experiment safely
5. Close sandbox window (changes discarded)
```

---

## System Requirements Summary

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Windows 10 Home | Windows 11 Pro |
| **RAM** | 4 GB | 8 GB |
| **Disk** | 2 GB free | 5 GB free |
| **CPU** | Dual-core | Quad-core |
| **Network** | Required for install | Always available |
| **Sandbox** | Pro/Enterprise only | Pro/Enterprise |

---

## Summary

**The fully automatic installer:**
1. ✅ Detects and installs Git, Python, Node.js
2. ✅ Clones One2lvOS from GitHub
3. ✅ Installs all dependencies
4. ✅ Builds TypeScript projects
5. ✅ Compiles One2lvOS.exe
6. ✅ Launches system automatically
7. ✅ Opens browser dashboard

**Result**: One-click installation and launch!

**The .exe launcher:**
- Standalone Windows executable
- Starts all 10 services
- Monitors and manages processes
- Opens browser automatically
- Graceful shutdown with Ctrl+C

**Windows Sandbox mode:**
- Complete isolation
- Safe testing environment
- No persistent changes
- Network accessible

---

**Ready to use One2lvOS with zero configuration!**

Just run `install-one2lvos-windows-auto.bat` and everything happens automatically.
