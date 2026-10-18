# ONE2LVOS Sovereign Architecture - Quick Start

Get the complete One2lvOS system with Sovereign Architecture running in 5 minutes.

## Prerequisites

- Python 3.8+ with pip
- Node.js 16+ with npm
- 1GB free disk space
- Internet connection

## Installation

### 1. Clone and Enter Directory
```bash
git clone https://github.com/one2lv-com/One2lvos.git
cd One2lvos
```

### 2. Install Python Dependencies
```bash
pip3 install -r requirements.txt --user
```

### 3. Deploy Sovereign Architecture
```bash
chmod +x deploy-sovereign.sh
./deploy-sovereign.sh
```

Wait for deployment to complete (~2-3 minutes).

## Access

Once deployed, open your browser to:

| Service | URL | Description |
|---------|-----|-------------|
| **Infinity Glasses HUD** | http://localhost:4000 | Main AI interface |
| **One2lvOS UI** | http://localhost:4000/os | Spatial OS environment |
| **API Core** | http://localhost:8000 | Backend API |
| **API Docs** | http://localhost:8000/docs | Interactive API documentation |

## First Steps

### 1. Test the Chat Interface

Open http://localhost:4000 and try these queries:

```
Hello, what is your purpose?
```

```
What is the One2lvOS system?
```

```
Explain the 1500 Skills Framework
```

### 2. Explore One2lvOS

Open http://localhost:4000/os and use terminal commands:

```bash
help       # Show available commands
status     # System status
registry   # Query Registry of Thought
council    # Submit to AI Council
```

### 3. Test the API

```bash
# Health check
curl http://localhost:8000/health

# Chat with AI
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "top_k": 3}'
```

## Understanding the System

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Infinity Glasses HUD                   │
│                   (Port 4000)                           │
│  ┌──────────────┐  ┌───────────┐  ┌─────────────────┐ │
│  │     ITT      │  │   Chat    │  │  Memory Stream  │ │
│  │  Governance  │  │ Interface │  │   (Astra DB)    │ │
│  └──────────────┘  └───────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────────────┐
                    │   API Proxy   │
                    └───────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│            Lumenis Reactor Core (Port 8000)             │
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │   NVIDIA LLM     │◄────────┤   ITT System     │    │
│  │  Nemotron-49B    │         └──────────────────┘    │
│  └──────────────────┘                                  │
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │ Vector Embeddings│◄────────┤  Astra DB Memory │    │
│  │   nv-embedqa     │         │   (aria_memory)  │    │
│  └──────────────────┘         └──────────────────┘    │
│                                                         │
│  ┌──────────────────┐                                  │
│  │  LSB Stego PNG   │ (State Persistence - Gate 4)    │
│  └──────────────────┘                                  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   One2lvOS Browser UI                   │
│         (Spatial OS with AI Council & Registry)         │
└─────────────────────────────────────────────────────────┘
```

### Key Components

**∆Gemini_Root∆**: Core deployment directory
- `core/`: Python FastAPI backend
- `ui/`: Node.js Express frontend
- `logs/`: System logs
- `stego_cache/`: LSB-encoded state images
- `skills/`: Modular skill system

**∆Gemini_Memory∆**: Memory persistence
- `vectors/`: Vector embeddings
- `snapshots/`: Memory snapshots

### Four Gates

1. **Gate 1 (Sovereignty)**: Autonomous operation
2. **Gate 2 (Vector Consistency)**: Memory coherence
3. **Gate 3 (Execution & Tooling)**: Verification
4. **Gate 4 (State Persistence)**: LSB steganography

## Common Tasks

### View Logs
```bash
tail -f ∆Gemini_Root∆/logs/core.log
tail -f ∆Gemini_Root∆/logs/hud.log
```

### Restart Services
```bash
./shutdown-sovereign.sh
./deploy-sovereign.sh
```

### Update Configuration
```bash
nano ∆Gemini_Root∆/core/.env
# Edit settings
./shutdown-sovereign.sh
./deploy-sovereign.sh
```

### Check Status
```bash
# Check if services are running
ps aux | grep -E 'python3.*main.py|node.*server.js'

# Check health
curl http://localhost:8000/health
```

## Troubleshooting

### Services Won't Start

**Check ports:**
```bash
lsof -i :4000
lsof -i :8000
```

**Kill conflicting processes:**
```bash
pkill -9 node
pkill -9 python3
```

**Re-deploy:**
```bash
./deploy-sovereign.sh
```

### Python Errors

**Missing packages:**
```bash
pip3 install -r requirements.txt --user
```

**Permission errors (Termux):**
```bash
pip3 install -r requirements.txt --break-system-packages
```

### Node.js Errors

**Missing packages:**
```bash
cd ∆Gemini_Root∆/ui
npm install
```

### API Connection Errors

**Check environment variables:**
```bash
cat ∆Gemini_Root∆/core/.env
```

**Test NVIDIA API:**
```bash
curl https://docs.api.nvidia.com/ \
  -H "Authorization: Bearer YOUR_NVIDIA_KEY"
```

**Test Astra DB:**
```bash
curl -I YOUR_ASTRA_ENDPOINT
```

## Next Steps

### Customize System Prompt
Edit `∆Gemini_Root∆/core/main.py` around line 67:

```python
system = f"""You are the Sovereign AI executing within One2lvOS.
Directives:
- [Add your custom directives here]
Context:\n{context}"""
```

### Add Custom Skills
Create a new skill in `∆Gemini_Root∆/skills/`:

```python
# my_skill.py
class MySkill:
    def __init__(self):
        self.name = "my_skill"

    async def execute(self, context):
        # Your skill logic
        return {"result": "Success"}
```

### Style the HUD
Edit `∆Gemini_Root∆/ui/server.js` to customize colors, layout, and styling.

### Connect Your Own APIs
Update `.env` with your NVIDIA and Astra DB credentials:

```env
NVIDIA_API_KEY="your-key"
ASTRA_DB_API_ENDPOINT="your-endpoint"
ASTRA_DB_APPLICATION_TOKEN="your-token"
```

### Deploy to Production
See `DEPLOYMENT_GUIDE.md` for production deployment with:
- Systemd services
- Nginx reverse proxy
- SSL certificates
- Docker containers
- Cloud platforms

## Learning Resources

- **Architecture**: See `SOVEREIGN_ARCHITECTURE.md`
- **Deployment**: See `DEPLOYMENT_GUIDE.md`
- **One2lvOS Docs**: See `One2lvOS/README.md`
- **API Reference**: http://localhost:8000/docs (when running)

## Getting Help

- Check logs first: `∆Gemini_Root∆/logs/*.log`
- GitHub Issues: https://github.com/one2lv-com/One2lvos/issues
- Documentation: All `.md` files in repo
- API Docs: http://localhost:8000/docs

## Shutdown

### Graceful Shutdown
```bash
./shutdown-sovereign.sh
```

### Force Stop
```bash
pkill -9 node && pkill -9 python3
```

## Tips

1. **Start small**: Test with simple queries first
2. **Check logs**: Most issues show up in logs
3. **Use health endpoint**: Quick way to verify backend
4. **Try API docs**: Interactive testing at `/docs`
5. **Monitor memory**: Vector DB can use significant RAM
6. **Backup state**: LSB PNG files contain your state
7. **Update regularly**: `git pull` for latest features

## Performance

Expected performance on modern hardware:
- **Startup**: 3-5 seconds
- **Chat latency**: 2-4 seconds
- **Memory retrieval**: <500ms
- **RAM usage**: 200-400MB
- **Disk usage**: 100-200MB

## Security Note

⚠️ **The demo credentials are for testing only!**

For production:
1. Get your own NVIDIA API key
2. Create your own Astra DB
3. Never commit `.env` files
4. Use secrets management
5. Enable HTTPS/SSL

## Success Indicators

You'll know it's working when:
- ✅ Both services show "active" in logs
- ✅ Health endpoint returns JSON
- ✅ Chat interface responds to queries
- ✅ Memories appear in sidebar
- ✅ One2lvOS boots in browser

## What's Next?

1. ✅ **You've deployed the system**
2. 📚 **Read the architecture docs**
3. 🎨 **Customize the interface**
4. 🔧 **Add custom skills**
5. 🚀 **Deploy to production**
6. 🌐 **Share with the community**

---

**Welcome to the Sovereign Architecture!** 🌷

*"From atomic to cosmic, from individual to collective"*
