# Lumenis Control Setup Guide

Complete setup instructions for the integrated Lumenis Control + Sovereign Agentic Core system.

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- PostgreSQL client (for schema deployment)
- Git

## Step 1: Clone the Repository

```bash
git clone https://github.com/one2lv-com/lumenis-control.git
cd lumenis-control
```

## Step 2: Configure Environment Variables

### Main Environment (.env)

Copy and edit the `.env` file:

```bash
# Already exists with pre-filled Supabase values
# Update these values:

# Add your Discord webhook (already set)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/754920938356604989/...

# Add your AI API keys
ANTHROPIC_API_KEY=sk-ant-...  # Required for Python backend
NVIDIA_API_KEY=nvapi-...       # Optional
MATON_API_KEY=...              # Optional

# Update Supabase password in DATABASE_URL
DATABASE_URL=postgresql://postgres.pplbxjguhmfeuptyamic:YOUR_ACTUAL_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### Python Backend Environment

```bash
cd python-backend
# Edit .env with same values as above
```

## Step 3: Deploy Database Schema to Supabase

Run the schema deployment script:

```bash
./push_schema.sh
```

When prompted, paste your complete PostgreSQL connection URI:
```
postgresql://postgres.pplbxjguhmfeuptyamic:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

This creates all necessary tables:
- `runtime_states`
- `agent_activity`
- `match_history`
- `predictions`
- `memory_events`

## Step 4: Install Dependencies

### Node.js Dependencies

```bash
npm install
```

This installs:
- express
- socket.io
- discord.js
- @supabase/supabase-js
- axios
- ws
- dotenv

### Python Dependencies

```bash
cd python-backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

This installs:
- fastapi
- uvicorn
- anthropic
- httpx
- aiofiles
- python-dotenv

## Step 5: Start the System

### Option A: Unified Start (Recommended)

```bash
./start-all.sh
```

This starts both:
- Node.js frontend on port 3000
- Python Sovereign Core on port 3002

### Option B: Manual Start

**Terminal 1 - Python Backend:**
```bash
cd python-backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 3002
```

**Terminal 2 - Node.js Frontend:**
```bash
npm start
```

## Step 6: Verify Installation

### Check Services

1. **Node.js Frontend**: http://localhost:3000
   - Should show starfield with Lumenis UI

2. **Python Sovereign Core**: http://localhost:3002
   - Should show Sovereign Core status page

### Test API Endpoints

```bash
# Check Sovereign status
curl http://localhost:3000/api/sovereign/status

# Check Node.js runtime state
curl http://localhost:3000/
```

### Verify Database Connection

Check Supabase dashboard:
1. Go to Table Editor
2. Verify tables exist: `runtime_states`, `agent_activity`, etc.
3. Check that Row Level Security is enabled

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                 LUMENIS CONTROL SYSTEM                   │
│                                                          │
│  ┌──────────────────┐         ┌──────────────────┐      │
│  │  Node.js Server  │◄───────►│  Python Backend  │      │
│  │  Port 3000       │  Bridge │  Port 3002       │      │
│  │                  │         │                  │      │
│  │  • WebSocket     │         │  • LumenisReactor│      │
│  │  • Discord       │         │  • FluxCompass   │      │
│  │  • Supabase      │         │  • ITT Council   │      │
│  │  • Frontend UI   │         │  • VanguardNodes │      │
│  └──────────────────┘         └──────────────────┘      │
│           │                            │                 │
│           └────────────┬───────────────┘                 │
│                        ▼                                 │
│                 ┌──────────────┐                         │
│                 │   Supabase   │                         │
│                 │   PostgreSQL │                         │
│                 └──────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

## Features

### Node.js Backend (Port 3000)
- Express server with Socket.io
- Discord webhook integration
- Supabase synchronization
- Reactor Core workstation
- Frontend UI serving

### Python Backend (Port 3002)
- LumenisReactor (Claude Opus 4.6 at 0.18°C)
- FluxCompass persistent memory
- ITT Council of Seven agents
- VanguardNodePool (144,382 nodes)
- WebSocket streaming

### Bridge Layer
- Real-time WebSocket relay
- HTTP API proxy
- Event synchronization
- Session management

## API Endpoints

### Node.js API (Port 3000)

```bash
# Sovereign Core Integration
GET  /api/sovereign/status           # Get Sovereign Core status
POST /api/sovereign/chat             # Send message to ITT Council
POST /api/sovereign/session          # Create new session
GET  /api/sovereign/session/:id/history  # Get chat history
POST /api/sovereign/fact             # Store fact in memory
POST /api/sovereign/recall           # Recall facts from memory
```

### Python API (Port 3002)

```bash
GET  /                    # Sovereign Core UI
GET  /api/status          # System status
GET  /api/sessions        # List sessions
POST /api/sessions        # Create session
GET  /api/sessions/:id/history  # Chat history
GET  /api/sessions/:id/facts    # Session facts
POST /api/facts           # Store fact
GET  /api/tasks           # Recent tasks
WS   /ws                  # WebSocket chat
```

## Usage Examples

### Chat with ITT Council via HTTP

```bash
curl -X POST http://localhost:3000/api/sovereign/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Analyze my Brawlhalla gameplay"}'
```

### Store Fact in Memory

```bash
curl -X POST http://localhost:3000/api/sovereign/fact \
  -H "Content-Type: application/json" \
  -d '{"key": "username", "value": "Lumenis", "session_id": "session-123"}'
```

### WebSocket Connection

```javascript
const socket = io('http://localhost:3000');

socket.emit('sovereign_chat', {
  message: 'Hello Lumenis',
  session_id: 'session-123'
});

socket.on('sovereign_response', (data) => {
  console.log(data.response);
});
```

## Troubleshooting

### Python backend won't start

```bash
# Check if port 3002 is available
lsof -i :3002

# Verify ANTHROPIC_API_KEY is set
cd python-backend
source venv/bin/activate
echo $ANTHROPIC_API_KEY

# Check Python version
python3 --version  # Should be 3.8+
```

### Bridge connection fails

```bash
# Ensure Python backend is running
curl http://localhost:3002/api/status

# Check logs
tail -f python-backend/logs/*.log

# Verify PYTHON_API_URL in .env
cat .env | grep PYTHON_API_URL
```

### Database connection issues

```bash
# Test PostgreSQL connection
psql "postgresql://postgres.pplbxjguhmfeuptyamic:PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres" -c "\dt"

# Re-run schema deployment
./push_schema.sh

# Check Supabase dashboard for table existence
```

### Discord webhook not working

```bash
# Test webhook
curl -X POST "YOUR_DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test from Lumenis"}'

# Verify webhook URL in .env
cat .env | grep DISCORD_WEBHOOK_URL
```

## Development

### Project Structure

```
lumenis-control/
├── index.html              # Main frontend UI
├── backend/                # Node.js backend
│   ├── server.js          # Express + Socket.io server
│   ├── discord.js         # Discord integration
│   ├── supabase.js        # Supabase client
│   └── twitch.js          # Twitch integration
├── python-backend/         # Python Sovereign Core
│   ├── main.py            # FastAPI server
│   ├── core/              # Core modules
│   │   ├── reactor.py     # LumenisReactor
│   │   ├── compass.py     # FluxCompass memory
│   │   ├── itt.py         # ITT Council
│   │   ├── nodes.py       # VanguardNodePool
│   │   └── maton.py       # Maton API bridge
│   ├── static/            # Static files
│   └── requirements.txt
├── bridge.js              # Node/Python bridge
├── start-all.sh           # Unified startup
├── push_schema.sh         # Database schema deployment
├── supabase-schema.sql    # Database schema
├── package.json           # Node.js dependencies
└── .env                   # Environment variables
```

### Adding New Features

1. **New ITT Agent**: Edit `python-backend/core/itt.py`
2. **New API Route**: Add to `backend/server.js`
3. **Bridge Function**: Update `bridge.js`
4. **Frontend UI**: Modify `index.html`

## Maintenance

### Backup Database

```bash
# Backup from Supabase
pg_dump "postgresql://postgres.pplbxjguhmfeuptyamic:PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres" > backup.sql
```

### Update Dependencies

```bash
# Node.js
npm update

# Python
cd python-backend
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

### View Logs

```bash
# Node.js logs
npm start 2>&1 | tee logs/nodejs.log

# Python logs
cd python-backend
uvicorn main:app --host 0.0.0.0 --port 3002 --log-level info
```

## Resources

- **Lumenis Control**: https://github.com/one2lv-com/lumenis-control
- **Sovereign Core**: https://github.com/one2lv-com/sovereign-agentic-core
- **Supabase Dashboard**: https://app.supabase.com/project/pplbxjguhmfeuptyamic
- **Claude API Docs**: https://docs.anthropic.com/
- **FastAPI Docs**: https://fastapi.tiangolo.com/

## Support

For issues or questions:
- GitHub Issues: https://github.com/one2lv-com/lumenis-control/issues
- Discord: Your webhook channel
- Documentation: SOVEREIGN_INTEGRATION.md
