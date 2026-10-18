# Lumenis Reactor Integration - Complete ✨

**Date**: October 17, 2026
**Status**: ✅ Integration Complete
**Repository**: [one2lv-com/sovereign-agentic-core](https://github.com/one2lv-com/sovereign-agentic-core)

---

## 🎯 What Was Integrated

The **Lumenis Reactor Core** from the Sovereign Agentic Core repository has been successfully integrated into One2lvos. This brings the full power of the Council of Seven (ITT - Innovative Thought Team) architecture to the One2lvos ecosystem.

## 📦 Files Added

### Core Modules (`/lumenis-reactor-core/`)
```
One2lvos/
├── lumenis-reactor-core/
│   ├── __init__.py           # Module initialization
│   ├── reactor.py           # LumenisReactor & NvidiaReactor classes
│   ├── compass.py           # FluxCompass SQLite memory system
│   ├── itt.py               # Council of Seven (ITT) orchestration
│   ├── nodes.py             # VanguardNodePool task execution
│   ├── maton.py             # Maton API Bridge (external services)
│   └── arcade.py            # AI Arcade MCP Bridge (games)
```

### Entry Point & Scripts
```
├── lumenis-main.py                   # FastAPI server entry point
├── start-lumenis-reactor.sh          # Startup script with env checks
├── LUMENIS_REACTOR_INTEGRATION.md    # Integration documentation
├── ASTRA_DB_SECURE_CONNECT.md        # Secure bundle guide
└── LUMENIS_INTEGRATION_COMPLETE.md   # This summary
```

### Updated Files
```
├── requirements.txt          # Added aiofiles dependency
└── .env.master              # Added ANTHROPIC_API_KEY section
```

### Auto-Generated (Runtime)
```
├── compass.db               # SQLite database (created on first run)
└── secure-connect-one2lvos.zip  # Astra DB bundle (needs download)
```

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Lumenis Reactor Core                      │
│                                                               │
│  ┌──────────────────┐      ┌─────────────────────────────┐  │
│  │ LumenisReactor   │      │    FluxCompass (SQLite)     │  │
│  │ Claude Opus 4.6  │◄────►│  • Sessions                 │  │
│  │ temp: 0.18       │      │  • Messages                 │  │
│  │ pulse: 73ms      │      │  • Facts                    │  │
│  └──────────────────┘      └─────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Council of Seven (ITT)                     ││
│  │                                                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ││
│  │  │ Sentinel    │  │ Navigator   │  │ Witness     │    ││
│  │  │ Security    │  │ Planning    │  │ Memory      │    ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘    ││
│  │                                                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ││
│  │  │ Weaver      │  │ Forge       │  │ Oracle      │    ││
│  │  │ Synthesis   │  │ Code (NV)   │  │ Reason (NV) │    ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘    ││
│  │                                                          ││
│  │  ┌─────────────┐                                        ││
│  │  │ Architect   │                                        ││
│  │  │ Governance  │                                        ││
│  │  └─────────────┘                                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │          VanguardNodePool (144,382 nodes)               ││
│  │          asyncio.Semaphore(16) concurrency              ││
│  └─────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install Python dependencies
cd /home/vercel-sandbox/One2lvos
pip install -r requirements.txt

# Verify installations
python3 -c "import anthropic, fastapi, uvicorn; print('✓ All dependencies installed')"
```

### 2. Configure Environment

Edit `.env` or `.env.master`:

```bash
# REQUIRED: Add your Anthropic API key
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here

# Already configured:
NVIDIA_API_KEY=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
ASTRA_DB_API_ENDPOINT=https://9b5b1939-fd21-477d-95b8-a1aecc5f90b9-us-east-2.apps.astra.datastax.com
ASTRA_DB_APPLICATION_TOKEN=AstraCS:wdhjJlzIvxbEWgIWnNApOWDA:...
```

Get your Anthropic API key: [https://console.anthropic.com/](https://console.anthropic.com/)

### 3. Start the Reactor

```bash
# Automated startup with checks
./start-lumenis-reactor.sh

# OR manual start
python3 lumenis-main.py

# OR with uvicorn (dev mode)
uvicorn lumenis-main:app --host 0.0.0.0 --port 3002 --reload
```

### 4. Verify Running

```bash
# Check status
curl http://<SERVER_IP>:3002/api/status

# Expected output:
# {
#   "reactor": {
#     "temperature": 0.18,
#     "pulse_count": 123,
#     "uptime_seconds": 45.67,
#     "frequency_hz": 13.7,
#     "model": "claude-opus-4-6"
#   },
#   "compass": {
#     "sessions": 0,
#     "messages": 0,
#     "facts": 0
#   },
#   "seats": [...]
# }
```

### 5. Access Web UI

Open in browser: [http://<SERVER_IP>:3002](http://<SERVER_IP>:3002)

---

## 🌐 API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Web UI |
| `GET` | `/api/status` | System status (reactor, compass, seats) |
| `GET` | `/api/sessions` | List all sessions (limit 20) |
| `POST` | `/api/sessions` | Create new session |
| `GET` | `/api/sessions/{id}/history` | Get session chat history |
| `GET` | `/api/sessions/{id}/facts` | Get session facts |
| `POST` | `/api/facts` | Store a new fact |
| `GET` | `/api/tasks` | View recent Vanguard tasks |

### WebSocket Chat (`/ws`)

#### Client → Server

```json
// Send a chat message
{
  "action": "chat",
  "message": "Your question here",
  "session_id": "optional-uuid"
}

// Create a new session
{
  "action": "new_session",
  "title": "Session Name"
}

// Recall facts
{
  "action": "recall",
  "query": "search term"
}

// Store a fact
{
  "action": "store_fact",
  "key": "fact_key",
  "value": "fact_value",
  "session_id": "optional-uuid"
}
```

#### Server → Client

```json
// Initialization
{"type": "init", "data": {...}}

// Heartbeat pulse (every 73ms)
{"type": "pulse", "data": {"temperature": 0.18, "pulse_count": 123}}

// Session created
{"type": "session_created", "session_id": "uuid"}

// Processing started
{"type": "processing_start", "session_id": "uuid"}

// Seat activity (real-time updates)
{"type": "seat_activity", "seat": "sentinel", "text": "Checking..."}
{"type": "seat_activity", "seat": "navigator", "text": "Planning route..."}
{"type": "seat_activity", "seat": "witness", "text": "Retrieving memory..."}

// Response streaming (token by token)
{"type": "response_chunk", "text": "The answer is..."}

// Processing complete
{
  "type": "processing_done",
  "session_id": "uuid",
  "meta": {
    "intent": "chat",
    "complexity": "simple",
    "seats_activated": ["sentinel", "navigator", "weaver"],
    "plan": "Direct response",
    "risk_level": "none",
    "external_data": false
  }
}

// Error
{"type": "error", "message": "Error description"}
```

---

## 🧠 Council of Seven (ITT)

### Seat Responsibilities

#### 1. The Sentinel 🛡️
- **Role**: Security & Validation
- **Backend**: Claude Opus 4.6
- **Function**: Validates inputs, flags risks (injection, harmful content)
- **Output**: `{safe, risk_level, concerns, recommendation}`

#### 2. The Navigator 🧭
- **Role**: Intent Classification & Routing
- **Backend**: Claude Opus 4.6
- **Function**: Determines intent (chat/code/research/etc), routes to seats
- **Output**: `{intent, complexity, seats_needed, plan}`

#### 3. The Witness 👁️
- **Role**: Memory & Context Retrieval
- **Backend**: Claude Opus 4.6
- **Function**: Recalls relevant facts and history from SQLite
- **Output**: 2-4 sentence memory context summary

#### 4. The Weaver 🧵
- **Role**: Response Synthesis
- **Backend**: Claude Opus 4.6
- **Function**: Streams the final coherent response to the user
- **Output**: Streaming text response

#### 5. The Forge ⚒️
- **Role**: Code & Structured Output
- **Backend**: **NVIDIA Gemma-4-31B-IT** (with thinking enabled)
- **Function**: Generates code, data transformations, technical output
- **Output**: Code with comments, structured data

#### 6. The Oracle 🔮
- **Role**: Knowledge & Reasoning
- **Backend**: **NVIDIA Gemma-4-31B-IT** (with thinking enabled)
- **Function**: Provides reasoned answers with confidence levels
- **Output**: Answer with `[HIGH/MEDIUM/LOW]` confidence

#### 7. The Architect 🏛️
- **Role**: Governance & Meta Decisions
- **Backend**: Claude Opus 4.6
- **Function**: Resolves conflicts, handles system meta-questions
- **Output**: Final integration decisions

### Execution Flow

```
User Message
     ↓
Sentinel (security check)
     ↓
Navigator (intent classification)
     ↓
     ├→ Witness (memory retrieval)
     ├→ Forge (code generation) [NVIDIA]
     ├→ Oracle (reasoning) [NVIDIA]
     └→ Architect (governance)
     ↓
Weaver (synthesis & streaming)
     ↓
User Response (streamed)
```

---

## ⚙️ Configuration

### Thermal Baseline (Temperature)

The reactor operates at **0.18 temperature** (mapped from 18°C):
- **0.18**: "Cool Fire" — stable, emotionally grounded, logically coherent
- Provides consistent, reliable responses
- Adaptive thinking enabled for complex reasoning

### Pulse Interval

**73ms heartbeat** (mapped from 73Hz):
- ≈13.7 Hz effective pulse rate
- Broadcasts status updates to all WebSocket clients
- Keeps system responsive and alive

### Concurrency

**16 parallel seats** via `asyncio.Semaphore(16)`:
- Allows multiple seats to activate simultaneously
- Prevents resource exhaustion
- Optimizes response time

### Node Lattice

**144,382 nodes** (Vanguard network size):
- Conceptual lattice size
- Used for status displays and pool sizing
- Represents distributed agent capacity

---

## 🗄️ Flux Compass (Memory System)

### SQLite Database (`compass.db`)

#### Tables

**sessions**
```sql
CREATE TABLE sessions (
    id          TEXT PRIMARY KEY,  -- UUID
    created_at  REAL NOT NULL,     -- Unix timestamp
    updated_at  REAL NOT NULL,     -- Unix timestamp
    title       TEXT,              -- Session name
    metadata    TEXT DEFAULT '{}'  -- JSON metadata
);
```

**messages**
```sql
CREATE TABLE messages (
    id          TEXT PRIMARY KEY,  -- UUID
    session_id  TEXT NOT NULL,     -- Foreign key to sessions
    role        TEXT NOT NULL,     -- "user" | "assistant"
    content     TEXT NOT NULL,     -- Message text
    seat        TEXT,              -- Seat name (if assistant)
    created_at  REAL NOT NULL,     -- Unix timestamp
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

**facts**
```sql
CREATE TABLE facts (
    id          TEXT PRIMARY KEY,  -- UUID
    session_id  TEXT,              -- Optional: fact scope
    key         TEXT NOT NULL,     -- Fact identifier
    value       TEXT NOT NULL,     -- Fact content
    source      TEXT,              -- Where it came from
    created_at  REAL NOT NULL      -- Unix timestamp
);
```

### Auto-Fact Extraction

The system automatically extracts facts:
- **Name detection**: "my name is X" → stores `{key: "user_name", value: "X"}`
- **More patterns coming**: dates, preferences, locations, etc.

### Memory Context

Each request:
1. Queries facts by keyword (top 5 matches)
2. Retrieves recent history (6 messages)
3. Passes to Witness seat for summarization
4. Injects context into Weaver for final response

---

## 🔗 Integration with One2lvos

### Shared Resources

| Component | Location | Purpose |
|-----------|----------|---------|
| **Astra DB** | `aria_memory_v2` collection | Vector embeddings (nemotron-3-embed-1b) |
| **NVIDIA API** | Multiple keys | Forge & Oracle seat execution |
| **AI Lobby** | `http://localhost:8006` | Agent-to-agent communication |
| **Port 3002** | Reactor endpoint | FastAPI + WebSocket server |

### Unified Dashboard

The Lumenis Reactor can be integrated into the One2lvos dashboard:
- Real-time pulse visualization
- Seat activity monitoring
- Session history browser
- Fact store explorer

---

## 📊 Monitoring & Debugging

### View Logs

```bash
# Reactor logs (if using start script)
tail -f /home/vercel-sandbox/One2lvos/logs/lumenis-reactor.log

# View in real-time
./start-lumenis-reactor.sh 2>&1 | tee logs/lumenis-reactor.log
```

### Check Status

```bash
# Full system status
curl -s http://<SERVER_IP>:3002/api/status | jq

# Just reactor stats
curl -s http://<SERVER_IP>:3002/api/status | jq .reactor

# Just compass (memory) stats
curl -s http://<SERVER_IP>:3002/api/status | jq .compass

# Council seats
curl -s http://<SERVER_IP>:3002/api/status | jq .seats
```

### Inspect Database

```bash
# Open SQLite shell
sqlite3 /home/vercel-sandbox/One2lvos/compass.db

# View sessions
SELECT * FROM sessions ORDER BY updated_at DESC LIMIT 10;

# View messages
SELECT role, content, created_at FROM messages WHERE session_id='<uuid>';

# View facts
SELECT key, value FROM facts ORDER BY created_at DESC LIMIT 20;
```

### WebSocket Testing

```bash
# Using websocat (install: cargo install websocat)
websocat ws://<SERVER_IP>:3002/ws

# Send a message
{"action": "chat", "message": "Hello Lumenis Reactor!"}

# Using wscat (install: npm i -g wscat)
wscat -c ws://<SERVER_IP>:3002/ws
> {"action": "chat", "message": "Test message"}
```

---

## ⚠️ Astra DB Secure Connect Bundle

### Status
The download URL provided has **expired** (403 Forbidden).

### How to Get It

See full instructions in: [`ASTRA_DB_SECURE_CONNECT.md`](./ASTRA_DB_SECURE_CONNECT.md)

**Quick version:**
1. Go to [astra.datastax.com](https://astra.datastax.com)
2. Navigate to database `one2lvos` (ID: `9b5b1939-fd21-477d-95b8-a1aecc5f90b9`)
3. Click "Connect" → "Download Secure Connect Bundle"
4. Save as: `/home/vercel-sandbox/One2lvos/secure-connect-one2lvos.zip`

### Is It Required?

**No** — for current Data API usage
**Yes** — for CQL/native Cassandra driver usage

The Lumenis Reactor uses the **Data API** (HTTP/JSON), so the bundle is optional.

---

## 🛠️ Troubleshooting

### Reactor won't start

**Missing ANTHROPIC_API_KEY**
```bash
# Check if set
echo $ANTHROPIC_API_KEY

# Set temporarily
export ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Set permanently (add to .env)
echo "ANTHROPIC_API_KEY=sk-ant-api03-your-key-here" >> .env
```

**Port 3002 already in use**
```bash
# Find process using port
lsof -i :3002

# Kill it
kill -9 <PID>

# Or use a different port
uvicorn lumenis-main:app --host 0.0.0.0 --port 3003
```

**Missing dependencies**
```bash
# Install all requirements
pip install -r requirements.txt

# Or install individually
pip install fastapi uvicorn anthropic aiofiles httpx
```

### WebSocket connection fails

**CORS issues**
- Ensure reactor allows your origin
- Check browser console for CORS errors
- Verify CORS middleware in `lumenis-main.py`

**Connection drops**
- Check reactor is still running: `curl http://<SERVER_IP>:3002/api/status`
- Look for errors in reactor logs
- Verify network connectivity

### Slow responses

**Check seat activation**
- Some seats (Forge, Oracle) use NVIDIA API (slower)
- Navigator routing may activate unnecessary seats
- Check `seats_activated` in response metadata

**Database locking**
- SQLite can lock on concurrent writes
- Check `compass.db` file permissions
- Consider switching to PostgreSQL for production

### Memory growing

**SQLite database size**
```bash
# Check size
du -h compass.db

# Count records
sqlite3 compass.db "SELECT COUNT(*) FROM messages;"

# Clean old sessions (manual)
sqlite3 compass.db "DELETE FROM sessions WHERE updated_at < strftime('%s', 'now', '-30 days');"
```

---

## 🚢 Deployment

### Development

```bash
# Auto-reload on code changes
uvicorn lumenis-main:app --host 0.0.0.0 --port 3002 --reload
```

### Production

```bash
# Start with gunicorn (multiple workers)
gunicorn lumenis-main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:3002

# Or with uvicorn directly
uvicorn lumenis-main:app --host 0.0.0.0 --port 3002 --workers 4
```

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3002

CMD ["uvicorn", "lumenis-main:app", "--host", "0.0.0.0", "--port", "3002"]
```

```bash
# Build
docker build -t one2lvos-lumenis .

# Run
docker run -d \
  -p 3002:3002 \
  -e ANTHROPIC_API_KEY=your-key \
  -e NVIDIA_API_KEY=your-key \
  -v $(pwd)/compass.db:/app/compass.db \
  one2lvos-lumenis
```

---

## 📚 References

### Documentation
- [Lumenis Reactor Integration](./LUMENIS_REACTOR_INTEGRATION.md)
- [Astra DB Secure Connect](./ASTRA_DB_SECURE_CONNECT.md)
- [One2lvos Architecture](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)

### External Resources
- [Anthropic Claude API](https://docs.anthropic.com/)
- [NVIDIA NIM API](https://build.nvidia.com/)
- [Astra DB Documentation](https://docs.datastax.com/en/astra-db-serverless/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

### Source Code
- [sovereign-agentic-core](https://github.com/one2lv-com/sovereign-agentic-core)
- [One2lvos](https://github.com/one2lv-com/One2lvos)

---

## ✅ Next Steps

1. **Get Anthropic API Key**
   → [console.anthropic.com](https://console.anthropic.com/)

2. **Download Astra DB Bundle** (optional)
   → See [ASTRA_DB_SECURE_CONNECT.md](./ASTRA_DB_SECURE_CONNECT.md)

3. **Start the Reactor**
   ```bash
   ./start-lumenis-reactor.sh
   ```

4. **Test WebSocket**
   Open [http://<SERVER_IP>:3002](http://<SERVER_IP>:3002)

5. **Integrate with One2lvos**
   Add Lumenis panel to unified dashboard

6. **Deploy to Production**
   Use Docker or systemd service

---

**🎉 Integration Complete! The Lumenis Reactor is ready to power your One2lvos system.**
