# Sovereign Agentic Core Integration

## Overview

Lumenis Control now integrates the **Sovereign Agentic Core** — a Python-based AI orchestration system powered by Claude Opus 4.6 and specialized agent councils.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│               LUMENIS CONTROL SYSTEM                    │
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │  Node.js Server  │◄───────►│  Python Backend  │     │
│  │  (Port 3000)     │  Bridge │  (Port 3002)     │     │
│  │                  │         │                  │     │
│  │  • WebSocket     │         │  • LumenisReactor│     │
│  │  • Discord       │         │  • FluxCompass   │     │
│  │  • Supabase      │         │  • ITT Council   │     │
│  │  • Frontend UI   │         │  • VanguardNodes │     │
│  └──────────────────┘         └──────────────────┘     │
│           │                            │                │
│           └────────────┬───────────────┘                │
│                        ▼                                │
│                 ┌──────────────┐                        │
│                 │   Supabase   │                        │
│                 │   Database   │                        │
│                 └──────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

## Components

### Python Backend (Sovereign Core)

Located in `python-backend/`:

- **LumenisReactor** — Claude Opus 4.6 at temperature 0.18
  - 73ms heartbeat pulse
  - Streaming responses
  - Adaptive thinking enabled

- **FluxCompass** — SQLite persistent memory
  - Session management
  - Message history
  - Fact storage and retrieval

- **ITT Council of Seven** — Specialized agents:
  - **The Witness** — Memory & context retrieval
  - **The Sentinel** — Security validation
  - **The Navigator** — Intent classification
  - **The Weaver** — Response synthesis
  - **The Forge** — Code generation
  - **The Oracle** — Knowledge reasoning
  - **The Architect** — System governance

- **VanguardNodePool** — Async task execution
  - 144,382 node lattice
  - 16 concurrent workers
  - Parallel processing

### Node.js Frontend

Located in `backend/`:

- Express server with WebSocket
- Discord integration
- Supabase synchronization
- Reactor Core workstation
- Frontend UI serving

### Bridge Layer

`bridge.js` connects Node.js and Python:

- WebSocket relay
- HTTP API proxy
- Event synchronization
- Session management

## Installation

### 1. Install Dependencies

```bash
# Python dependencies
cd python-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Node.js dependencies
npm install
```

### 2. Configure Environment

Create `.env` in root directory:

```bash
# Anthropic (required for Python backend)
ANTHROPIC_API_KEY=your_anthropic_key

# NVIDIA (optional, for secondary reactor)
NVIDIA_API_KEY=your_nvidia_key

# Supabase
SUPABASE_URL=https://pplbxjguhmfeuptyamic.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_key

# Maton (for api-gateway skill)
MATON_API_KEY=your_maton_key

# Discord
DISCORD_WEBHOOK_URL=your_discord_webhook

# Python backend URL (for bridge)
PYTHON_API_URL=http://localhost:3002
```

### 3. Start Services

#### Option A: Unified Start (Recommended)

```bash
chmod +x start-all.sh
./start-all.sh
```

This starts both Node.js (port 3000) and Python (port 3002) backends.

#### Option B: Manual Start

Terminal 1 — Python Backend:
```bash
cd python-backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 3002
```

Terminal 2 — Node.js Backend:
```bash
npm start
```

## Usage

### Web Interface

Navigate to `http://localhost:3000` for the main UI with:
- Starfield visualization
- Build model documentation
- Core pulse animation
- Raccoon agent display

### AI Chat via Sovereign Core

```javascript
const bridge = require('./bridge');

// Connect to Python backend
await bridge.connect();

// Send message to ITT Council
const result = await bridge.chat('Analyze my Brawlhalla gameplay');

console.log(result.response);
console.log(result.meta); // Intent, complexity, seats activated
```

### Memory Operations

```javascript
// Store fact
await bridge.storeFact('username', 'Lumenis', sessionId);

// Recall facts
const facts = await bridge.recallFacts('user preferences');
```

### System Status

```javascript
const status = await bridge.getStatus();
// Returns reactor, nodes, compass, ITT seats status
```

## API Endpoints

### Python Backend (Port 3002)

- `GET /` — Web UI (static HTML)
- `GET /api/status` — System status
- `GET /api/sessions` — List sessions
- `POST /api/sessions` — Create session
- `GET /api/sessions/{id}/history` — Chat history
- `GET /api/sessions/{id}/facts` — Session facts
- `POST /api/facts` — Store fact
- `GET /api/tasks` — Recent tasks
- `WS /ws` — WebSocket chat interface

### Node.js Backend (Port 3000)

- `GET /` — Main UI
- `POST /api/discord` — Discord webhook
- `GET /api/supabase/status` — Supabase status
- WebSocket routes for frontend

## Development

### Project Structure

```
lumenis-control/
├── index.html              # Main frontend UI
├── backend/                # Node.js backend
│   ├── server.js          # Express server
│   ├── discord.js         # Discord integration
│   ├── supabase.js        # Supabase client
│   └── twitch.js          # Twitch integration
├── python-backend/         # Python Sovereign Core
│   ├── main.py            # FastAPI server
│   ├── core/
│   │   ├── reactor.py     # LumenisReactor & NvidiaReactor
│   │   ├── compass.py     # FluxCompass memory
│   │   ├── itt.py         # ITT Council of Seven
│   │   ├── nodes.py       # VanguardNodePool
│   │   └── maton.py       # Maton API bridge
│   └── requirements.txt
├── bridge.js              # Node/Python bridge
├── start-all.sh           # Unified startup script
└── package.json
```

### Adding New Features

1. **Python Agent**: Modify `python-backend/core/itt.py`
2. **Node.js Route**: Add to `backend/server.js`
3. **Bridge Function**: Add to `bridge.js`
4. **Frontend UI**: Modify `index.html`

## Troubleshooting

### Python backend won't start

- Check `ANTHROPIC_API_KEY` is set
- Verify Python 3.8+ installed
- Install dependencies: `pip install -r requirements.txt`

### Bridge connection fails

- Ensure Python backend is running on port 3002
- Check firewall settings
- Verify `PYTHON_API_URL` in .env

### Memory/sessions not persisting

- Check SQLite database file permissions
- Verify FluxCompass initialization
- Check `python-backend/flux_compass.db`

## Credits

- **Sovereign Agentic Core**: github.com/one2lv-com/sovereign-agentic-core
- **Lumenis Control**: github.com/one2lv-com/lumenis-control
- **Claude Opus 4.6**: Anthropic
- **NVIDIA API**: NVIDIA AI Foundation
