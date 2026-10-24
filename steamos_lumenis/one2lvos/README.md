# ONE2LVOS v5 - Autonomous Gaming AI System

A self-running, self-learning backend system with AI Coach, AI Broadcaster, AI Second Player, and mesh networking capabilities.

## Features

- **AI Coach**: One2lv combat philosophy chatbot with real-time strategy tips
- **AI Broadcaster**: Real-time game commentary and stream overlay data
- **AI Second Player**: Adaptive fighting opponent with 10-level evolution system
- **Mesh Networking**: WebSocket-based distributed node communication
- **Memory System**: Persistent learning with Supabase integration (optional)
- **Process Manager**: PM2 for persistent runtime (survives terminal close)

## Quick Start

```bash
cd /workspace/one2lvos

# Install dependencies
npm install

# Run in development mode
npm run dev

# Or run with PM2 for persistence
npm run pm2:start
npm run pm2:save  # Save for auto-restart
```

## API Endpoints

### Health & System
- `GET /health` - Health check
- `GET /api/system/status` - System status
- `GET /api/system/metrics` - CPU/Memory metrics

### AI Coach
- `POST /api/coach/chat` - Chat with AI Coach
- `GET /api/coach/tip` - Get coaching tip for game state

### AI Broadcaster
- `POST /api/broadcaster/commentary` - Generate game commentary
- `POST /api/broadcaster/prematch` - Prematch intro
- `POST /api/broadcaster/postmatch` - Postmatch analysis
- `GET /api/broadcaster/overlay` - Stream overlay data

### AI Second Player
- `POST /api/ai/decide` - Get AI game decision
- `GET /api/ai/status` - Get AI evolution status
- `POST /api/ai/reset` - Reset AI to level 1
- `GET /api/ai/evolution-levels` - View all evolution levels

### Memory
- `POST /api/memory/store` - Store memory
- `POST /api/memory/search` - Search memories
- `GET /api/memory/context` - Get context for AI

### Leaderboard
- `GET /api/leaderboard` - View rankings
- `POST /api/leaderboard/update` - Update player score

### Game
- `POST /api/game/start` - Start a game session
- `POST /api/game/end` - End game and record result

### Mesh
- `GET /api/mesh/status` - Mesh network status
- `POST /api/mesh/broadcast` - Broadcast event to peers
- `POST /api/mesh/peer` - Add mesh peer

### Unified Chat
- `POST /api/chat` - Unified chat endpoint (routes to tools or AI Coach)

## Configuration

Edit `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
NODE_ID=node-1
NODE_PORT=8080
MESH_PEERS=ws://peer1:8080,ws://peer2:8080
ADMIN_TOKEN=your-secret-token
```

## Supabase Setup

Run the SQL schema in your Supabase SQL Editor:

```sql
-- See supabase_schema.sql for full schema
-- Tables: memory, sessions, leaderboard, ai_memory, chat_history, game_replays, mesh_nodes
```

## AI Evolution System

The AI Second Player evolves through 10 levels:

| Level | Name | Aggression | Reaction Time |
|-------|------|------------|---------------|
| 1 | Initiate | 30% | 800ms |
| 2 | Apprentice | 40% | 600ms |
| 3 | Adept | 50% | 500ms |
| 4 | Expert | 60% | 400ms |
| 5 | Master | 70% | 300ms |
| 6 | Grandmaster | 80% | 250ms |
| 7 | Champion | 85% | 200ms |
| 8 | Legend | 90% | 150ms |
| 9 | Mythic | 95% | 100ms |
| 10 | One2lv | 100% | 50ms |

## PM2 Commands

```bash
pm2 start index.js --name one2lvos  # Start
pm2 stop one2lvos                    # Stop
pm2 restart one2lvos                 # Restart
pm2 logs one2lvos                   # View logs
pm2 save                            # Save state
pm2 startup                         # Auto-start on boot
```

## WebSocket Usage

Connect to `ws://localhost:8080` and send:

```json
{ "type": "chat", "input": "tip for beginners", "playerId": "player1" }
```

Receive AI responses and game commentary in real-time.

## Example API Calls

```bash
# Health check
curl http://localhost:8080/health

# Chat with AI Coach
curl -X POST http://localhost:8080/api/coach/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"how to improve"}'

# Get AI decision for game state
curl -X POST http://localhost:8080/api/ai/decide \
  -H "Content-Type: application/json" \
  -d '{"gameState":{"health":80,"opponentHealth":50}}'

# Generate game commentary
curl -X POST http://localhost:8080/api/broadcaster/commentary \
  -H "Content-Type: application/json" \
  -d '{"action":{"type":"attack"},"gameState":{"player1":{"stocks":3,"percent":0}}}'
```

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                   ONE2LVOS v5                   │
├─────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  AI     │  │  AI     │  │  AI     │        │
│  │  Coach  │  │Broadcaster│ │Second   │        │
│  │         │  │         │  │Player   │        │
│  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │               │
│       └────────────┼────────────┘               │
│                    │                            │
│              ┌─────▼─────┐                     │
│              │   Tools   │                     │
│              └─────┬─────┘                     │
│                    │                            │
│       ┌────────────┼────────────┐               │
│  ┌────▼────┐  ┌────▼────┐  ┌────▼────┐        │
│  │ Memory  │  │  Mesh   │  │ Leader- │        │
│  │ (Store) │  │ Network │  │ board   │        │
│  └────┬────┘  └────┬────┘  └─────────┘        │
│       │            │                            │
│  ┌────▼────────────▼────┐                      │
│  │      API Server      │                      │
│  │   Express + WS       │                      │
│  └──────────────────────┘                      │
└─────────────────────────────────────────────────┘
```

## Files

```
one2lvos/
├── api/
│   └── server.js          # Express API server
├── ai/
│   ├── coach.js          # AI Coach chatbot
│   ├── broadcaster.js    # AI Broadcaster
│   └── secondPlayer.js   # AI Second Player with evolution
├── core/
│   ├── supabase.js       # Supabase client
│   └── memory.js         # Memory/learning system
├── mesh/
│   └── mesh.js           # WebSocket mesh networking
├── tools/
│   └── tools.js          # System tools
├── games/                 # Game logic (future)
├── index.js              # Entry point
├── ecosystem.config.js   # PM2 configuration
├── supabase_schema.sql   # Database schema
├── setup.sh             # Setup script
└── package.json
```

---

**ONE2LVOS v5** - The system that runs itself.
