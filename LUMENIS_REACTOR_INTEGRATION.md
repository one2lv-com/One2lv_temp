# Lumenis Reactor Core Integration

## Overview
The Lumenis Reactor has been integrated into One2lvos, bringing the Sovereign Agentic Core architecture with the Council of Seven (ITT - Innovative Thought Team).

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Lumenis Reactor Core                │
│                                                     │
│  ┌─────────────┐   ┌──────────────┐                │
│  │  Lumenis    │   │  Flux Compass│                │
│  │  Reactor    │   │  (SQLite)    │                │
│  │  temp=0.18  │   │  Memory      │                │
│  │  73ms pulse │   │  Sessions    │                │
│  └─────────────┘   └──────────────┘                │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         Council of Seven (ITT)              │   │
│  │  Sentinel · Navigator · Witness             │   │
│  │  Weaver · Forge · Oracle · Architect        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │     Vanguard Node Pool (144,382 nodes)      │   │
│  │     asyncio.Semaphore(16) concurrency       │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Components

### 1. LumenisReactor
- **Model**: Claude Opus 4.6
- **Temperature**: 0.18 (Thermal Baseline)
- **Heartbeat**: 73ms pulse interval
- **Features**: Streaming responses with adaptive thinking

### 2. FluxCompass
- **Storage**: SQLite-backed persistent memory
- **Tracks**: Sessions, messages, facts
- **Purpose**: Prevents context drift by grounding all state

### 3. Council of Seven (ITT)

| Seat | Role | Function |
|------|------|----------|
| **The Sentinel** | Security | Validates inputs, flags risks |
| **The Navigator** | Planning | Classifies intent, routes to seats |
| **The Witness** | Memory | Retrieves context from SQLite |
| **The Weaver** | Synthesis | Streams the final response |
| **The Forge** | Execution | Code and structured output (NVIDIA Gemma) |
| **The Oracle** | Knowledge | Reasoning with confidence levels (NVIDIA Gemma) |
| **The Architect** | Governance | Meta decisions and system questions |

### 4. VanguardNodePool
- Async task execution with configurable concurrency
- Supports parallel seat activation
- Built on asyncio.Semaphore

## Installation

### Prerequisites
```bash
pip install fastapi uvicorn anthropic aiofiles httpx
```

### Environment Variables
Add to your `.env` file:

```bash
# Lumenis Reactor Core
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Already configured:
NVIDIA_API_KEY=your_nvidia_api_key_here
ASTRA_DB_API_ENDPOINT=https://your-database-id-region.apps.astra.datastax.com
ASTRA_DB_APPLICATION_TOKEN=AstraCS:your_astra_token_here
```

## Running the Reactor

### Standalone Mode
```bash
cd /home/vercel-sandbox/One2lvos
python3 lumenis-main.py
```

The reactor will start on `http://<SERVER_IP>:3002`

### Integrated with One2lvos
```bash
cd /home/vercel-sandbox/One2lvos
./start-all.sh
```

## API Endpoints

### REST Endpoints
- `GET /` — Web UI
- `GET /api/status` — Live system status
- `GET /api/sessions` — List sessions
- `POST /api/sessions` — Create session
- `GET /api/sessions/{id}/history` — Chat history
- `GET /api/sessions/{id}/facts` — Retrieve facts
- `POST /api/facts` — Store fact
- `GET /api/tasks` — View recent tasks

### WebSocket
- `WS /ws` — Real-time chat with streaming responses

## WebSocket Protocol

### Client → Server Messages
```json
{
  "action": "chat",
  "message": "Your message here",
  "session_id": "optional-session-id"
}

{
  "action": "new_session",
  "title": "Session Name"
}

{
  "action": "recall",
  "query": "search term"
}

{
  "action": "store_fact",
  "key": "fact_key",
  "value": "fact_value",
  "session_id": "optional-session-id"
}
```

### Server → Client Messages
```json
{
  "type": "init",
  "data": { "reactor": {...}, "nodes": {...}, "compass": {...} }
}

{
  "type": "pulse",
  "data": { "temperature": 0.18, "pulse_count": 1234, ... }
}

{
  "type": "session_created",
  "session_id": "uuid"
}

{
  "type": "processing_start",
  "session_id": "uuid"
}

{
  "type": "seat_activity",
  "seat": "sentinel|navigator|witness|weaver|forge|oracle|architect",
  "text": "Status message"
}

{
  "type": "response_chunk",
  "text": "Streaming response text..."
}

{
  "type": "processing_done",
  "session_id": "uuid",
  "meta": {
    "intent": "chat|code|analysis|research|creative|system",
    "complexity": "simple|medium|complex",
    "seats_activated": ["sentinel", "navigator", ...],
    "plan": "Description of response approach",
    "risk_level": "none|low|medium|high",
    "external_data": true
  }
}

{
  "type": "error",
  "message": "Error description"
}
```

## Astra DB Secure Connect Bundle

### Download the Bundle
⚠️ **The download URL has expired**. To get a fresh secure connect bundle:

1. Go to [Astra DB Console](https://astra.datastax.com)
2. Navigate to your database: `one2lvos` (ID: `9b5b1939-fd21-477d-95b8-a1aecc5f90b9`)
3. Click "Connect" → "Download Secure Connect Bundle"
4. Save the file as `secure-connect-one2lvos.zip` in the One2lvos directory

### Verify Bundle
```bash
ls -lh /home/vercel-sandbox/One2lvos/secure-connect-one2lvos.zip
```

## Integration Points with One2lvos

### 1. AI Lobby Integration
The reactor can communicate with the AI Lobby at `http://localhost:8006` for agent-to-agent communication.

### 2. Astra DB Memory
Uses the same Astra DB instance as One2lvos:
- **Keyspace**: `one2lvOS`
- **Collection**: `aria_memory_v2` (updated for nemotron-3-embed-1b)

### 3. NVIDIA Models
- **Primary LLM**: Claude Opus 4.6
- **Secondary (Forge/Oracle)**: NVIDIA Gemma-4-31B-IT
- **Embeddings**: nvidia/nemotron-3-embed-1b (2048 dimensions)

## Flux Compass Database

The Flux Compass creates a local SQLite database at:
```
/home/vercel-sandbox/One2lvos/compass.db
```

### Schema
- **sessions**: Conversation sessions with metadata
- **messages**: Chat history per session
- **facts**: Long-term memory facts extracted from conversations

## Performance Characteristics

- **Thermal Baseline**: 0.18 temperature (stable, emotionally grounded)
- **Pulse Rate**: 73ms (≈13.7 Hz effective frequency)
- **Node Lattice**: 144,382 nodes (Vanguard network size)
- **Concurrency**: 16 parallel seats via asyncio.Semaphore
- **Streaming**: Real-time token-by-token responses

## Monitoring

Check reactor status:
```bash
curl http://<SERVER_IP>:3002/api/status | jq
```

View active sessions:
```bash
curl http://<SERVER_IP>:3002/api/sessions | jq
```

## Troubleshooting

### Reactor won't start
1. Check ANTHROPIC_API_KEY is set: `echo $ANTHROPIC_API_KEY`
2. Verify Python dependencies: `pip list | grep -E 'fastapi|anthropic|uvicorn'`
3. Check port 3002 availability: `lsof -i :3002`

### WebSocket connection fails
1. Ensure reactor is running: `curl http://<SERVER_IP>:3002/api/status`
2. Check browser console for WebSocket errors
3. Verify no firewall blocking WebSocket connections

### Memory issues
1. Check SQLite database: `sqlite3 compass.db ".tables"`
2. View database stats: `curl http://<SERVER_IP>:3002/api/status | jq .compass`
3. Clear old sessions if needed (via API or direct SQLite access)

## Next Steps

1. **Get fresh Astra DB secure connect bundle** (current URL expired)
2. **Add ANTHROPIC_API_KEY** to your environment
3. **Test the reactor**: `python3 lumenis-main.py`
4. **Explore the web UI**: Open `http://<SERVER_IP>:3002`
5. **Try WebSocket chat**: Connect via browser or wscat

## Files Structure

```
One2lvos/
├── lumenis-reactor-core/
│   ├── __init__.py
│   ├── reactor.py         # LumenisReactor & NvidiaReactor
│   ├── compass.py         # FluxCompass (SQLite memory)
│   ├── itt.py            # Council of Seven
│   ├── nodes.py          # VanguardNodePool
│   ├── maton.py          # Maton API Bridge
│   └── arcade.py         # AI Arcade MCP Bridge
├── lumenis-main.py        # FastAPI server entry point
├── compass.db            # SQLite database (auto-created)
└── secure-connect-one2lvos.zip  # Astra DB bundle (needs download)
```

## References

- [Anthropic Claude API](https://docs.anthropic.com/)
- [NVIDIA NIM API](https://build.nvidia.com/)
- [Astra DB Documentation](https://docs.datastax.com/en/astra-db-serverless/)
- [One2lvos Architecture](./ARCHITECTURE.md)
