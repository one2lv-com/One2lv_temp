# Lumenis Reactor Core - Chat UI

## Overview

The Lumenis Reactor Core Chat UI is a cyberpunk-inspired interface for interacting with the Council of Nine AI agents through a real-time WebSocket connection.

## Features

### 🎨 Visual Design
- **Cyberpunk Aesthetic**: Dark theme with neon accents (cyan, magenta, yellow)
- **Animated Background**: Particle system with floating dots
- **Responsive Layout**: Three-column grid layout optimized for desktop
- **Real-time Animations**: Seat activation, message streaming, pulse indicators

### 🏛️ Council of Nine

The interface displays all nine council seats with real-time activity indicators:

1. **👁️ The Witness** - Memory & context retrieval
2. **🛡️ The Sentinel** - Security & input validation
3. **🧭 The Navigator** - Intent classification & routing
4. **🕸️ The Weaver** - Response synthesis
5. **⚒️ The Forge** - Code & structured output (NVIDIA Gemma)
6. **🔮 The Oracle** - Knowledge & reasoning (NVIDIA Gemma)
7. **🏛️ The Architect** - System governance
8. **⚡ The Hermes** - External services via Maton
9. **🎮 The Gambit** - AI Arcade games

### 🦝 Rocky the Raccoon Agent

The right panel features Rocky, the sovereign assistant raccoon, who displays:
- **Memory Bank**: Key-value pairs of session context
- **Activity Log**: Real-time stream of council activities
- **Status Indicators**: Current system state

### 💬 Chat Interface

- **Session Management**: Create new sessions or continue existing ones
- **Streaming Responses**: Real-time token-by-token response display
- **Processing Indicators**: Visual feedback during council deliberation
- **Message History**: Persistent chat history with timestamps
- **Seat Activity**: Live updates showing which council members are active

### 📊 Reactor Status

Header displays real-time metrics:
- **Temperature**: LLM temperature setting (default 0.18°C)
- **Pulse**: Heartbeat interval (73ms)
- **Nodes**: Active parallel task nodes

## WebSocket Protocol

### Client → Server

```json
{
  "action": "chat",
  "message": "Your message here",
  "session_id": "optional-session-id"
}
```

```json
{
  "action": "new_session",
  "title": "Session Title"
}
```

### Server → Client

**Session Created**
```json
{
  "type": "session_created",
  "session_id": "uuid"
}
```

**Processing Start**
```json
{
  "type": "processing_start",
  "session_id": "uuid"
}
```

**Seat Activity**
```json
{
  "type": "seat_activity",
  "seat": "navigator",
  "text": "✓ chat / simple"
}
```

**Response Chunk** (streaming)
```json
{
  "type": "response_chunk",
  "text": "token"
}
```

**Processing Done**
```json
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
```

**Reactor Pulse** (periodic)
```json
{
  "type": "pulse",
  "data": {
    "temperature": 0.18,
    "active_count": 2,
    "messages_total": 42
  }
}
```

## Usage

### Starting the Server

```bash
cd /home/vercel-sandbox/One2lvos
./start-lumenis-reactor.sh
```

Or manually:

```bash
pip install -r requirements.txt
python lumenis-main.py
```

### Accessing the UI

Open your browser to:
```
http://<SERVER_IP>:3002
```

The WebSocket will automatically connect to `ws://<SERVER_IP>:3002/ws`

### Example Queries

**Simple Chat**
```
Hello, what can you help me with?
```

**Code Generation (activates Forge)**
```
Write a Python function to calculate fibonacci numbers
```

**External Services (activates Hermes)**
```
Get my latest Gmail messages
```

**Games (activates Gambit)**
```
Start a chess game
```

**Knowledge (activates Oracle)**
```
Explain quantum entanglement
```

## Architecture

### Frontend Stack
- Pure HTML5/CSS3/JavaScript (no framework dependencies)
- WebSocket API for real-time communication
- Canvas API for animated background
- CSS Grid for responsive layout

### Backend Integration
- FastAPI server (`lumenis-main.py`)
- WebSocket endpoint at `/ws`
- Static file serving from `/static` directory
- Council orchestration via `ITTCouncil` class

### Styling Variables

```css
--bg-deep: #0a0118        /* Deep purple background */
--bg-card: rgba(15, 5, 30, 0.85)  /* Card background */
--primary: #00f0ff         /* Cyan accent */
--secondary: #ff00d4       /* Magenta accent */
--accent: #fcee0a          /* Yellow accent */
--success: #00ff88         /* Success green */
--danger: #ff3366          /* Error red */
```

## Customization

### Adding New Seats

To add a new council seat, update the `SEATS` array in `index.html`:

```javascript
const SEATS = [
  // ... existing seats
  { key: 'newSeat', name: 'The NewSeat', role: 'Function', icon: '🎯' }
];
```

### Changing Theme Colors

Modify the `:root` CSS variables at the top of the `<style>` section.

### Custom Avatar

Replace the raccoon emoji (🦝) in the `.raccoon-avatar` div:

```html
<div class="raccoon-avatar">🦝</div>
```

## Performance

- **Initial Load**: ~60KB HTML (uncompressed)
- **WebSocket**: Binary frame support, auto-reconnect
- **Animations**: GPU-accelerated via CSS transforms
- **Scrolling**: Custom scrollbar with smooth scrolling

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Note**: Requires WebSocket support and modern CSS Grid.

## Troubleshooting

### WebSocket Connection Failed

Check that the server is running:
```bash
curl http://<SERVER_IP>:3002/api/status
```

### Seats Not Activating

Verify the seat keys match between frontend (`SEATS` array) and backend (`SEATS` dict in `itt.py`).

### Response Not Streaming

Ensure the `stream_cb` function is properly connected in the WebSocket handler.

## Security

- Input validation via Sentinel seat
- No direct code execution in browser
- WebSocket origin checking recommended for production
- API keys stored server-side only

## Future Enhancements

- [ ] Voice input via Web Speech API
- [ ] Multi-language support
- [ ] Dark/light theme toggle
- [ ] Export chat history
- [ ] Markdown rendering in messages
- [ ] Code syntax highlighting
- [ ] Mobile-responsive layout
- [ ] Accessibility improvements (ARIA labels)

## Credits

**Design**: One2lvOS Sovereign Architecture
**Council Framework**: ITT (Innovative Thought Team)
**Mascot**: Rocky the Raccoon 🦝
**Reactor Core**: Lumenis Engine

---

**Version**: 1.0.0
**Last Updated**: 2026-10-18
