# One2lvOS Quick Start - One Command Installation

## 🚀 Install & Deploy in One Command

```bash
curl -fsSL https://raw.githubusercontent.com/one2lv-com/One2lvos/main/one2lvos-quickstart.sh | bash
```

**That's it!** The script will:
1. ✅ Clone the repository
2. ✅ Create `.env` with all API keys configured
3. ✅ Deploy all Docker services
4. ✅ Initialize Astra DB with NVIDIA embeddings
5. ✅ Show access URLs and management commands

---

## 📦 What You Get

After running the command, you'll have:

- **One2lvOS UI** running at `http://your-server/`
- **Node AI Lobby** on port 8787
- **Python Core** on port 3002
- **Astra DB** configured with 5 vector collections
- **NVIDIA embeddings** ready for AI operations
- **Auto-restart** on all services
- **Complete management tools**

---

## 🎯 Custom Installation Directory

Install to a specific directory:

```bash
curl -fsSL https://raw.githubusercontent.com/one2lv-com/One2lvos/main/one2lvos-quickstart.sh | bash -s /opt/one2lvos
```

---

## 🌐 Access Your System

Once deployed, access at:

```
Main UI:          http://your-server/
Infinity Glasses: http://your-server/Infinity_Glasses/
Aetherix:         http://your-server/Aetherix/
Lumenis:          http://your-server/Lumenis/
AI Lobby:         http://your-server/Agentic_Control/

Node API:         http://your-server:8787
Python API:       http://your-server:3002
```

---

## 🛠️ Management Commands

Navigate to installation directory:

```bash
cd ~/one2lvos  # or your custom path
```

Then use these commands:

```bash
./deploy.sh status       # Check service status
./deploy.sh logs         # View all logs
./deploy.sh logs nginx   # View specific service
./deploy.sh restart      # Restart all services
./deploy.sh stop         # Stop all services
./deploy.sh backup       # Create backup
./deploy.sh health       # Health check
```

---

## 📋 Prerequisites

- **Docker** 20.10+
- **Docker Compose** v2.0+
- **Linux** server with 4GB+ RAM
- **Ports** 80, 8787, 3002 available

The script will check these automatically.

---

## 🔧 Manual Installation

If you prefer manual control:

```bash
# 1. Clone repository
git clone https://github.com/one2lv-com/One2lvos.git
cd One2lvos

# 2. Create environment
cp .env.production.template .env
nano .env  # Edit if you want to change API keys

# 3. Deploy
./deploy.sh start

# 4. Initialize Astra DB
./deploy.sh init-astra

# 5. Check health
./deploy.sh health
```

---

## 🔑 API Keys Included

The quickstart script includes working API keys for:

- ✅ **Astra DB** (DataStax) - Vector memory with NVIDIA embeddings
- ✅ **NVIDIA AI** - 6 different API keys for multiple models
- ✅ **Gemini AI** - Google Generative AI (Astra agent)
- ✅ **Supabase** - Backup/sync database
- ✅ **Steam API** - Lumenis gaming integration
- ✅ **Maton API** - Task automation

**All keys are pre-configured and ready to use!**

---

## 🏗️ Architecture

```
                  curl | bash
                      ↓
              One2lvOS Quickstart
                      ↓
            ┌─────────┴─────────┐
            │   Docker Compose   │
            └─────────┬─────────┘
                      │
      ┌───────────────┼───────────────┐
      ↓               ↓               ↓
  Nginx :80      Node :8787    Python :3002
      │               │               │
      └───────────────┼───────────────┘
                      ↓
          Astra DB Vector Memory
          NVIDIA Embedding Provider
          5 Collections Auto-created
```

---

## 📚 Complete Documentation

- **This Guide**: Quick start installation
- **`PRODUCTION_DEPLOYMENT.md`**: Full deployment guide
- **`DEPLOYMENT_COMPLETE.md`**: Architecture and features
- **`DEPLOYMENT_SUCCESS.md`**: Access and usage guide

---

## 🆘 Troubleshooting

### Services won't start?

```bash
# Check Docker status
systemctl status docker

# Check logs
cd ~/one2lvos
./deploy.sh logs

# Restart services
./deploy.sh restart
```

### Health checks failing?

```bash
# Check individual services
curl http://localhost/health
curl http://localhost:8787/health
curl http://<SERVER_IP>:3002/health

# View service logs
./deploy.sh logs nginx
./deploy.sh logs node-ai-lobby
./deploy.sh logs python-core
```

### Port conflicts?

```bash
# Check what's using ports
sudo netstat -tulpn | grep -E ':(80|8787|3002)'

# Stop conflicting services
sudo systemctl stop nginx  # if system nginx is running
```

---

## 🔄 Updating

To update to the latest version:

```bash
cd ~/one2lvos
./deploy.sh update
```

Or manually:

```bash
cd ~/one2lvos
git pull origin main
./deploy.sh restart
```

---

## 🗑️ Uninstall

To completely remove One2lvOS:

```bash
cd ~/one2lvos
./deploy.sh stop
cd ..
rm -rf ~/one2lvos
docker volume prune -f
```

---

## 🎉 Success!

After installation:

1. **Visit** http://your-server/ to see the UI
2. **Explore** the Infinity Glasses spatial desktop
3. **Try** the Aetherix master terminal
4. **Play** with Lumenis cosmic gaming
5. **Chat** with AI agents in the lobby

---

## 📞 Support

- **GitHub**: https://github.com/one2lv-com/One2lvos
- **Issues**: https://github.com/one2lv-com/One2lvos/issues
- **Docs**: See `PRODUCTION_DEPLOYMENT.md`

---

**One2lvOS v1.0.2** - Production Ready 🌌🧲

---

## TL;DR

```bash
# Install everything in one command:
curl -fsSL https://raw.githubusercontent.com/one2lv-com/One2lvos/main/one2lvos-quickstart.sh | bash

# Then visit:
http://your-server/

# Manage with:
cd ~/one2lvos && ./deploy.sh status
```

**Done!** 🎉
