# 🌌 LUMENIS ONE2LVOS

A persistent autonomous holographic runtime environment with AI orchestration, reactive visualization, agent specialization, and Supabase backend.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier available at https://supabase.com)

### Installation

```bash
# Navigate to project directory
cd lumenis

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start the server
npm start

# OR use the build script
chmod +x build.sh
./build.sh
```

### Supabase Setup

1. Create a new project at https://supabase.com
2. Copy your project URL and anon key from Settings → API
3. Run the SQL schema in Supabase SQL Editor:
   ```bash
   # Copy contents of supabase-schema.sql and run in Supabase SQL Editor
   ```
4. Add credentials to `.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Access the Interface

Open your browser to: **http://localhost:3000**

## 🧬 System Architecture

### Frontend
- Three.js starfield with 5000 animated stars
- Real-time WebSocket synchronization
- Holographic UI panels with glassmorphism
- Interactive raccoon agent
- Reactive runtime visualization

### Backend
- Express.js HTTP server
- Socket.io WebSocket server
- Autonomous agent system
- **Supabase persistent storage**
- Discord/Twitch bridge integration (optional)

### Database (Supabase)
- `runtime_states` - Core system state
- `agent_activity` - Agent action logs
- `match_history` - Gameplay records
- `predictions` - AI predictions & outcomes
- `memory_events` - System events

## 🦝 Agent System

Four specialized autonomous agents:

- **SCOUT** - Pattern detection (Priority: 3)
- **GUARDIAN** - Recovery and protection (Priority: 5)
- **BERSERKER** - Aggression adaptation (Priority: 2)
- **ARCHIVIST** - Memory persistence (Priority: 4)

Agents execute autonomously every 5 seconds, log to Supabase, and emit real-time updates to the UI.

## 🎮 Features

### Core Features
- ✅ Real-time WebSocket communication
- ✅ **Supabase cloud database storage**
- ✅ **Real-time database subscriptions**
- ✅ Autonomous agent loops
- ✅ Three.js cosmic starfield
- ✅ Interactive UI panels
- ✅ Runtime state visualization
- ✅ Keyboard shortcuts (Press L for logs)

### Optional Integrations
- 🔌 Discord bridge (configure in .env)
- 🔌 Twitch bridge (configure in .env)

## 📁 Project Structure

```
lumenis/
├── index.html              # Main UI (Three.js + WebSocket client)
├── package.json            # Dependencies
├── build.sh                # Build script
├── .env.example            # Environment template
├── supabase-schema.sql     # Supabase database schema
├── backend/
│   ├── server.js           # Main Express + Socket.io server
│   ├── supabase.js         # Supabase client & functions
│   ├── discord.js          # Discord bridge module
│   └── twitch.js           # Twitch bridge module
├── memory/
│   └── persistent_state.json  # Local fallback storage
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables

Edit `.env` with your credentials:

```env
# Supabase (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Discord (optional)
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CHANNEL_ID=your_channel_id
DISCORD_WEBHOOK_URL=your_webhook_url

# Twitch (optional)
TWITCH_BOT_USERNAME=your_username
TWITCH_OAUTH_TOKEN=oauth:your_token
TWITCH_CHANNEL=your_channel

# Server
PORT=3000
```

### Supabase Database Tables

The system uses these Supabase tables:

**runtime_states** - Persistent system state
```json
{
  "id": "lumenis_core",
  "state": {...},
  "updated_at": "2026-05-15T00:00:00Z"
}
```

**agent_activity** - Agent action logs
```json
{
  "agent_name": "SCOUT",
  "activity": {...},
  "timestamp": "2026-05-15T00:00:00Z"
}
```

**match_history** - Gameplay records

**predictions** - AI predictions & outcomes

**memory_events** - System event log

### Discord Setup

1. Create a Discord bot at https://discord.com/developers/applications
2. Enable "Message Content Intent"
3. Invite bot to your server
4. Copy bot token and channel ID to `.env`

### Twitch Setup

1. Get OAuth token from https://twitchapps.com/tmi/
2. Add credentials to `.env`

## 🎨 UI Controls

- **Click Raccoon** - Activate raccoon agent
- **Press L** - Toggle log output panel
- **Hover Panels** - See glow effects

## 📊 Monitoring

The system automatically:
- Saves state to Supabase on every update
- Logs agent activity to Supabase
- Emits WebSocket events for real-time UI sync
- Subscribes to Supabase realtime changes
- Displays runtime state in UI

## 🛠 Development

### Running in Development

```bash
npm run dev
```

### Testing Supabase Connection

```javascript
// In backend code
const { loadRuntimeState, saveRuntimeState } = require('./backend/supabase');

// Load state
const state = await loadRuntimeState();

// Save state
await saveRuntimeState({ status: 'TESTING' });
```

### Testing Agent Updates

```javascript
// In browser console
socket.emit('agent_update', {
  agent: 'SCOUT',
  action: 'testing',
  status: 'ACTIVE'
});
```

## 📦 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "backend/server.js"]
```

Build and run:

```bash
docker build -t lumenis .
docker run -p 3000:3000 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_ANON_KEY=your_key \
  lumenis
```

### Cloud Deployment

Deploy to Railway, Render, or any Node.js hosting:

1. Connect GitHub repository
2. Set environment variables
3. Deploy

## 🔒 Security Notes

- Never commit `.env` to version control
- Use Row Level Security (RLS) in Supabase
- Rotate API keys regularly
- Use environment-specific configs
- Enable HTTPS in production

## 🐛 Troubleshooting

### Supabase Connection Failed

- Verify SUPABASE_URL and SUPABASE_ANON_KEY in .env
- Check Supabase project status
- Verify database tables exist (run schema SQL)

### Port Already in Use

```bash
# Change PORT in .env
PORT=3001
```

### WebSocket Connection Failed

- Check if server is running
- Verify port is accessible
- Check firewall settings

### Agents Not Updating

- Check console for errors
- Verify Supabase connection
- Check database permissions
- Restart server

## 📚 API Reference

### Supabase Functions

**saveRuntimeState(state)** - Save runtime state to Supabase

**loadRuntimeState()** - Load runtime state from Supabase

**saveAgentActivity(agentName, activity)** - Log agent activity

**getAgentActivity(limit)** - Get recent agent activity

**subscribeToRuntimeChanges(callback)** - Subscribe to real-time changes

### WebSocket Events

**Client → Server:**
- `agent_update` - Update agent state
- `state_change` - Change runtime state
- `memory_update` - Update memory

**Server → Client:**
- `runtime_state` - Runtime state update
- `memory_state` - Memory state update
- `agent_pulse` - Agent activity pulse
- `runtime_sync` - General sync event

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Open pull request

## 📄 License

MIT License

## 🌌 Acknowledgments

Built with:
- Three.js for 3D rendering
- Socket.io for WebSocket
- Express.js for HTTP server
- **Supabase for cloud database**
- Discord.js for chat integration
- tmi.js for Twitch integration

---

**🦝 LUMENIS CORE STATUS: EVOLVING**

*Last Updated: 2026-05-15*
*Version: 1.0.0*
*Backend: Supabase*
