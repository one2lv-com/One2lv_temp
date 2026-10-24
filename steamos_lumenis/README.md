# SteamOS Lumenis

**Interplanetary Gaming System for SteamOS**

A comprehensive gaming platform that integrates Lumenis v7 cosmic orchestration, AI coaching, Twitch streaming, Discord integration, and Steam Community features.

## 🌌 Features

### Core Systems
- **Lumenis Cosmic Engine**: Multi-agent AI system with visual 3D orchestration
- **Real-time Telemetry**: Combo detection (3+ hits within 1.35s)
- **Steam Integration**: Library access, login, community broadcasting
- **Live Streaming**: Twitch integration for gameplay streaming
- **Discord Integration**: Community interaction and notifications
- **AI Coach**: Real-time gameplay analysis and suggestions

### Components

#### 1. Lumenis Cosmic Gaming (Frontend)
React + TypeScript + Vite application with:
- 3D Cosmic Canvas visualization (Three.js with bloom effects)
- Steam Web API integration
- Supabase backend
- Real-time WebSocket communication
- AI-powered coaching interface

#### 2. One2lvOS Backend
Node.js server providing:
- Command execution panels with persistent state
- WebSocket server for real-time updates
- Safe sandboxed execution environment
- Memory persistence system

#### 3. One2lvOS Dashboard
Python-based monitoring dashboard with:
- System metrics visualization
- AI engine integration
- Real-time memory state tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Python 3.8+
- Steam Web API Key
- Supabase account (optional)

### Installation

#### Lumenis Cosmic Gaming
```bash
cd lumenis-cosmic-gaming
pnpm install
cp .env.example .env
# Edit .env with your Steam API key and Supabase credentials
pnpm dev
```

#### One2lvOS Backend
```bash
cd one2lvos
npm install
# Edit .env with your configuration
npm start
```

#### Dashboard
```bash
cd one2lvos_dashboard
pip install -r requirements.txt
python server.py
```

## 🎮 Steam Integration

This system uses the Steam Web API for:
- User authentication
- Game library access
- Community broadcasting
- Achievement tracking

Get your Steam API key: https://steamcommunity.com/dev/apikey

## 🌐 Architecture

```
steamos_lumenis/
├── lumenis-cosmic-gaming/    # React frontend with 3D visualization
├── one2lvos/                 # Node.js backend with AI agents
├── one2lvos_dashboard/       # Python monitoring dashboard
├── one2lvos_live.html        # Live demo page
└── user_input_files/         # Assets and media
```

## 🧬 AI System

The Lumenis system features multiple AI agents:
- **Coach**: Provides real-time gameplay suggestions
- **Broadcaster**: Manages live stream integration
- **Second Player**: Autonomous gameplay companion

## 🔧 Configuration

### Steam API
Add your Steam Web API Key to `lumenis-cosmic-gaming/.env`:
```
VITE_STEAM_API_KEY=your_key_here
```

### Supabase (Optional)
For persistent user data and leaderboards:
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 📊 Telemetry

Real-time combo detection:
- Monitors 3+ hits within 1.35 second window
- Sub-millisecond precision (0.0135ms response time)
- WebSocket-based event streaming

## 🎯 Supported Games

Primary focus: **Brawlhalla**
- Custom combo detection
- AI coaching for competitive play
- Tournament mode support

## 🛠️ Development

### Build Frontend
```bash
cd lumenis-cosmic-gaming
pnpm build
```

### Run Backend
```bash
cd one2lvos
npm start
```

### Monitor System
```bash
cd one2lvos_dashboard
python server.py
```

## 📝 License

MIT License - See individual component licenses for details

## 🌟 Credits

Built with:
- Three.js for 3D visualization
- React + TypeScript
- Node.js + Express
- Python + Flask
- Steam Web API
- Supabase

---

**One2lv.com** | Interplanetary Gaming Systems
