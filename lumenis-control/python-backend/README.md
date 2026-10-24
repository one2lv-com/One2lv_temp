# Sovereign Agentic Core Integration

This directory contains the Python-based Sovereign Agentic Core integrated into the Lumenis Control system.

## Architecture

The Sovereign Core provides:
- **LumenisReactor**: Claude Opus 4.6 at temperature 0.18 (73ms heartbeat)
- **FluxCompass**: SQLite persistent memory system
- **ITT Council of Seven**: Specialized AI agents
- **VanguardNodePool**: Async task execution with 144,382 nodes

## Running the Python Backend

```bash
# Install dependencies (includes websocket support for /ws and /ws/vanguard)
pip install -r requirements.txt

# Set environment variables
export ANTHROPIC_API_KEY=your_key_here
export NVIDIA_API_KEY=your_nvidia_key_here  # Optional

# Run the server
uvicorn main:app --host 0.0.0.0 --port 3002
```

## API Endpoints

- `GET /api/status` - System status
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create session
- `WS /ws` - WebSocket chat interface
- `WS /ws/vanguard` - Persistent manifold heartbeat + telemetry stream

## Integration with Node.js Backend

The Node.js backend (port 3000) communicates with the Python backend (port 3002) via:
- HTTP REST API calls
- Shared Supabase database
- WebSocket event broadcasting
