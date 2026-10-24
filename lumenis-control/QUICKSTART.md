# 🌌 Lumenis Control — Quick Start

Get your integrated Lumenis Control + Sovereign Agentic Core system running in 5 minutes.

## ⚡ Quick Setup

### 1. Update Your Password

Edit `.env` and replace `[YOUR-PASSWORD]` with your actual Supabase database password:

```bash
DATABASE_URL=postgresql://postgres.pplbxjguhmfeuptyamic:YOUR_ACTUAL_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

Also update `python-backend/.env` with the same password.

### 2. Add Your API Keys

Edit both `.env` files and add:

```bash
# Required for Python backend
ANTHROPIC_API_KEY=sk-ant-...

# Optional
NVIDIA_API_KEY=nvapi-...
MATON_API_KEY=...
```

### 3. Deploy Database Schema

```bash
chmod +x push_schema.sh
./push_schema.sh
```

When prompted, paste your complete PostgreSQL URI with password.

### 4. Install Dependencies

```bash
# Node.js
npm install

# Python
cd python-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 5. Start Everything

```bash
chmod +x start-all.sh
./start-all.sh
```

## 🎯 Access Points

- **Frontend UI**: http://localhost:3000
- **Sovereign Core**: http://localhost:3002
- **API Status**: http://localhost:3000/api/sovereign/status

## ✅ What's Already Configured

- ✅ Supabase URL and keys
- ✅ Discord webhook
- ✅ Database connection template
- ✅ All integration code

## ⚙️ What You Need to Add

1. **Supabase Password** (in DATABASE_URL)
2. **ANTHROPIC_API_KEY** (required)
3. **NVIDIA_API_KEY** (optional)
4. **MATON_API_KEY** (optional)

## 📚 Full Documentation

For detailed setup, troubleshooting, and API reference:
- **SETUP.md** - Complete installation guide
- **SOVEREIGN_INTEGRATION.md** - Architecture documentation
- **README.md** - Project overview

## 🆘 Quick Troubleshooting

### Port already in use
```bash
# Kill processes on ports 3000 and 3002
lsof -ti:3000 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

### Python backend won't start
```bash
# Check ANTHROPIC_API_KEY is set
cd python-backend
source venv/bin/activate
echo $ANTHROPIC_API_KEY
```

### Database connection fails
```bash
# Test connection (replace password)
psql "postgresql://postgres.pplbxjguhmfeuptyamic:PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres" -c "\dt"
```

## 🚀 Next Steps

1. Open http://localhost:3000 to see the starfield UI
2. Test the Sovereign Core at http://localhost:3002
3. Try the API: `curl http://localhost:3000/api/sovereign/status`
4. Connect your Discord channel to receive updates

## 📋 System Components

| Component | Port | Description |
|-----------|------|-------------|
| Node.js Frontend | 3000 | WebSocket, Discord, UI |
| Python Sovereign | 3002 | Claude AI, ITT Council |
| Supabase | Remote | PostgreSQL database |
| Bridge | N/A | Node ↔ Python relay |

## 🧠 ITT Council of Seven

Once running, you'll have access to:
- **The Witness** — Memory keeper
- **The Sentinel** — Security guardian
- **The Navigator** — Intent router
- **The Weaver** — Response synthesizer
- **The Forge** — Code generator
- **The Oracle** — Knowledge reasoner
- **The Architect** — System governor

## 🦝 Features Active

- ✅ 144,382 VanguardNodes
- ✅ Claude Opus 4.6 at 0.18°C
- ✅ Persistent memory (SQLite + Supabase)
- ✅ Real-time WebSocket streaming
- ✅ Discord integration
- ✅ Twitch bridge ready
- ✅ Raccoon agent system

---

**Ready to launch?** Run `./start-all.sh` and watch the magic happen! 🌌✨
