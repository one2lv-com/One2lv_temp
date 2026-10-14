# ONE2LVOS Sovereign Architecture - Integration Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                 ONE2LVOS SOVEREIGN ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Minimax    │  │   MiniMax    │  │   Lumenis    │          │
│  │  AI System   │  │ Integration  │  │   Reactor    │          │
│  │  (Port 8080) │  │(Port 8001/2) │  │  (Port 8000) │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┼──────────────────┘                   │
│                            │                                      │
│                    ┌───────▼────────┐                            │
│                    │  Astra DB L1   │                            │
│                    │  Memory Layer  │                            │
│                    └───────┬────────┘                            │
│                            │                                      │
│              ┌─────────────┼─────────────┐                       │
│              │             │             │                       │
│     ┌────────▼────┐  ┌────▼────┐  ┌────▼────┐                  │
│     │  Infinity   │  │  Agent  │  │  Mesh   │                  │
│     │  Glasses    │  │   Hub   │  │ Network │                  │
│     │(Port 4000)  │  │(React)  │  │(WebRTC) │                  │
│     └─────────────┘  └─────────┘  └─────────┘                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Minimax AI System (Port 8080)
**Location**: `/One2lvos/minimax/`

**Features:**
- AI Coach chatbot
- AI Broadcaster (game commentary)
- AI Second Player (10-level evolution)
- Memory system with Supabase
- WebSocket mesh networking
- PM2 process management

**Start:**
```bash
cd /home/vercel-sandbox/One2lvos/minimax
npm install
npm run pm2:start
```

**API Endpoints:**
- `GET /health` - Health check
- `POST /api/coach/chat` - Chat with AI Coach
- `POST /api/broadcaster/commentary` - Generate commentary
- `POST /api/ai/decide` - AI game decisions
- `POST /api/memory/store` - Store memories

### 2. MiniMax Integration (Ports 8001, 8002)
**Location**: `/One2lvos/minimax-integration/`

**Features:**
- NVIDIA NIM API wrapper
- Python FastAPI backend
- Node.js Express bridge
- Chat, reasoning, creative generation

**Start:**
```bash
cd /home/vercel-sandbox/One2lvos/minimax-integration
./start_minimax.sh
```

### 3. Lumenis Reactor Core (Port 8000)
**Location**: `/One2lvos/∆Gemini_Root∆/core/`

**Features:**
- L2 Skills pipeline
- Astra DB vector memory
- NVIDIA embeddings & LLM
- Four Gates architecture
- LSB steganography persistence

**Start:**
```bash
cd /home/vercel-sandbox/One2lvos/∆Gemini_Root∆/core
python3 main.py
```

### 4. Infinity Glasses HUD (Port 4000)
**Location**: `/One2lvos/∆Gemini_Root∆/ui/`

**Features:**
- AR interface gateway
- ITT Governance display
- Real-time chat interface
- Memory stream visualization

**Start:**
```bash
cd /home/vercel-sandbox/One2lvos/∆Gemini_Root∆/ui
node server.js
```

### 5. Agent Hub (React Frontend)
**Location**: `/One2lvos/minimax/agent-hub/`

**Features:**
- Visual agent interface
- Real-time status
- Configuration panel

**Build & Start:**
```bash
cd /home/vercel-sandbox/One2lvos/minimax/agent-hub
npm install
npm run dev
```

## Environment Configuration

### Master .env
**Location**: `/One2lvos/.env.master`

Contains all API keys and credentials:
- Astra DB credentials
- NVIDIA API keys (6 different keys)
- Discord & Twitch tokens
- Supabase credentials
- GitHub token
- Maton API key

**Never commit this file to git!**

### Component .env Files
Each component has its own `.env` file:
- `/One2lvos/minimax/.env` - Minimax system
- `/One2lvos/minimax-integration/.env` - MiniMax integration
- `/One2lvos/∆Gemini_Root∆/core/.env` - Reactor core

## Starting All Services

### Option 1: Manual Start (Development)
```bash
# Terminal 1: Lumenis Reactor Core
cd /home/vercel-sandbox/One2lvos/∆Gemini_Root∆/core
python3 main.py

# Terminal 2: Infinity Glasses HUD
cd /home/vercel-sandbox/One2lvos/∆Gemini_Root∆/ui
node server.js

# Terminal 3: Minimax AI System
cd /home/vercel-sandbox/One2lvos/minimax
npm run pm2:start

# Terminal 4: MiniMax Integration (when API keys work)
cd /home/vercel-sandbox/One2lvos/minimax-integration
./start_minimax.sh

# Terminal 5: Agent Hub
cd /home/vercel-sandbox/One2lvos/minimax/agent-hub
npm run dev
```

### Option 2: PM2 (Production)
```bash
cd /home/vercel-sandbox/One2lvos
pm2 start ecosystem.config.js
pm2 save
```

### Option 3: Docker Compose
```bash
cd /home/vercel-sandbox/One2lvos
docker-compose up -d
```

## Port Map

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| Lumenis Reactor Core | 8000 | HTTP | FastAPI backend |
| MiniMax Integration API | 8001 | HTTP | Python FastAPI |
| MiniMax Bridge | 8002 | HTTP | Node.js gateway |
| Infinity Glasses HUD | 4000 | HTTP/WS | UI gateway |
| Minimax AI System | 8080 | HTTP/WS | Main AI system |
| Agent Hub | 5173 | HTTP | React dev server |

## Testing Integration

### Health Checks
```bash
# Reactor Core
curl http://localhost:8000/health

# Minimax System
curl http://localhost:8080/health

# MiniMax Integration
curl http://localhost:8001/health
curl http://localhost:8002/health

# Infinity Glasses
curl http://localhost:4000/
```

### Chat Test
```bash
# Test Minimax AI Coach
curl -X POST http://localhost:8080/api/coach/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer one2lv-secret-2024" \
  -d '{"message": "How to improve my game?"}'

# Test Lumenis Reactor
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Lumenis!"}'
```

### Memory Integration Test
```bash
# Store memory in Minimax
curl -X POST http://localhost:8080/api/memory/store \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer one2lv-secret-2024" \
  -d '{"type": "event", "content": "User achieved level 10", "metadata": {"userId": "player1"}}'

# Store memory in Lumenis (Astra DB)
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Remember: I completed the tutorial"}'
```

## Astra DB Collections

### aria_memory_v2
- **Dimensions**: 2048
- **Model**: `nvidia/nemotron-3-embed-1b`
- **Keyspace**: `one2lvOS`
- **Purpose**: Lumenis Reactor vector memory

### Supabase Tables (Minimax)
- `memory` - General memory storage
- `sessions` - Game sessions
- `leaderboard` - Player rankings
- `ai_memory` - AI Second Player learning
- `chat_history` - Chat logs
- `game_replays` - Replay data
- `mesh_nodes` - Mesh network nodes

## Mesh Networking

All components can communicate via WebSocket mesh:
- Reactor Core: `ws://localhost:8000`
- Infinity Glasses: `ws://localhost:4000`
- Minimax System: `ws://localhost:8080`

## Troubleshooting

### Services won't start
```bash
# Check port availability
lsof -i :8000
lsof -i :8080
lsof -i :4000

# Kill stuck processes
pkill -9 python
pkill -9 node
pm2 delete all
```

### API key errors
- Check `.env.master` has all keys
- Verify NVIDIA API keys at build.nvidia.com
- Ensure Astra DB token is valid

### Memory/DB connection issues
- Verify Astra DB endpoint is accessible
- Check Supabase credentials
- Ensure collections exist with correct dimensions

## Architecture Alignment

### Four Gates System
1. **Gate 1: Sovereignty** - Independent AI reasoning
2. **Gate 2: Vector Consistency** - Memory integration
3. **Gate 3: Execution & Tooling** - Skills framework
4. **Gate 4: State Persistence** - LSB steganography

### Layer Structure
- **L0 (SOUL)**: Core principles and identity
- **L1 (Memory)**: Persistent knowledge and context
- **L2 (Skills)**: Modular capabilities (1500+ framework)
- **L3 (Execution)**: Active processes and APIs

## Next Steps

1. ✅ All components installed
2. ✅ Environment configured
3. ✅ Integration created
4. ⏳ Get proper NVIDIA API keys for inference
5. ⏳ Deploy to production
6. ⏳ Set up CI/CD pipeline
7. ⏳ Configure persistent storage

## Support

- Documentation: This file
- Issues: GitHub Issues
- Discord: https://discord.com/invite/dBfFAcefs2
