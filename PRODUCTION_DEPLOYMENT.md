# One2lvOS Production Deployment Guide

## Architecture Overview

```
                          ┌─────────────────┐
                          │   INTERNET      │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │  Nginx Gateway  │
                          │   Port 80/443   │
                          └────────┬────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
     ┌────────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
     │   One2lvOS UI   │  │ Node AI Lobby  │  │  Python Core   │
     │   Static Files  │  │   Port 8787    │  │   Port 3002    │
     └─────────────────┘  └────────┬───────┘  └───────┬────────┘
                                   │                   │
                          ┌────────▼───────────────────▼────────┐
                          │        Astra DB Vector Memory       │
                          │   NVIDIA Embedding Integration      │
                          └─────────────────────────────────────┘
```

## Features

- **Nginx Gateway**: Routes traffic to UI, Node, and Python services
- **Node AI Lobby** (Port 8787): AI agent management and interaction
- **Python Core** (Port 3002): FastAPI Sovereign Council backend
- **Astra DB**: Vector memory with NVIDIA embedding provider
- **Auto-restart**: All services automatically restart on failure
- **Health checks**: Automatic health monitoring for all services
- **CI/CD**: GitHub Actions deployment pipeline

## Prerequisites

- Docker 20.10+
- Docker Compose v2.0+
- Git
- Linux server with 4GB+ RAM
- Open ports: 80, 443, 8787, 3002

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/one2lv-com/One2lvos.git
cd One2lvos
```

### 2. Configure Environment

```bash
# Copy production environment
cp .env.production .env

# Edit configuration (optional)
nano .env
```

### 3. Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Start all services
./deploy.sh start
```

### 4. Verify Deployment

```bash
# Check service status
./deploy.sh status

# Check health
./deploy.sh health

# View logs
./deploy.sh logs
```

## Deployment Commands

```bash
# Start services
./deploy.sh start

# Stop services
./deploy.sh stop

# Restart services
./deploy.sh restart

# Check status
./deploy.sh status

# View logs (all services)
./deploy.sh logs

# View logs (specific service)
./deploy.sh logs nginx
./deploy.sh logs node-ai-lobby
./deploy.sh logs python-core

# Update from GitHub
./deploy.sh update

# Initialize Astra DB
./deploy.sh init-astra

# Create backup
./deploy.sh backup

# Health check
./deploy.sh health
```

## Manual Deployment

### Using Docker Compose

```bash
# Start services
docker compose -f docker-compose.production.yml up -d

# Stop services
docker compose -f docker-compose.production.yml down

# View logs
docker compose -f docker-compose.production.yml logs -f

# Restart a specific service
docker compose -f docker-compose.production.yml restart node-ai-lobby
```

## Astra DB Setup

### Initialize Collections

The system automatically creates these collections with NVIDIA vectorize:

1. **agent_memory** - Agent conversation and decision memory
2. **sovereign_council** - Council deliberation and consensus tracking
3. **delta_engine_state** - Delta Engine autonomous dynamics memory
4. **system_snapshots** - O2PNG system state snapshots metadata
5. **user_interactions** - User commands and interaction history

### Manual Initialization

```bash
# Run Astra DB setup
./deploy.sh init-astra

# Or manually
docker compose -f docker-compose.production.yml run --rm astra-init
```

### Verify Collections

```python
python3 astra-db-setup.py
```

## CI/CD with GitHub Actions

### Setup GitHub Secrets

Go to your repository → Settings → Secrets → Actions, and add:

```
PRODUCTION_SSH_KEY      # SSH private key for deployment server
PRODUCTION_HOST         # Server hostname or IP
PRODUCTION_USER         # SSH username
PRODUCTION_PATH         # Deployment path (e.g., /opt/one2lvos)
```

### Generate SSH Key

On your production server:

```bash
# Generate SSH key (if needed)
ssh-keygen -t ed25519 -C "github-actions-deploy"

# Display public key (add to ~/.ssh/authorized_keys on server)
cat ~/.ssh/id_ed25519.pub

# Display private key (add to GitHub secrets as PRODUCTION_SSH_KEY)
cat ~/.ssh/id_ed25519
```

### Automatic Deployment

Push to `main` branch triggers automatic deployment:

```bash
git add .
git commit -m "Deploy changes"
git push origin main
```

## Access Points

After deployment, access your system at:

### Main Applications
- **Main UI**: http://your-server/
- **Infinity Glasses**: http://your-server/Infinity_Glasses/
- **Aetherix Terminal**: http://your-server/Aetherix/
- **Lumenis Gaming**: http://your-server/Lumenis/
- **AI Lobby**: http://your-server/Agentic_Control/

### API Endpoints
- **Node API**: http://your-server:8787
- **Python API**: http://your-server:3002
- **Nginx Gateway**: http://your-server:80

### Health Checks
- **Nginx**: http://your-server/health
- **Node**: http://your-server:8787/health
- **Python**: http://your-server:3002/health

## Configuration

### Environment Variables

Key environment variables in `.env`:

```bash
# Astra DB
ASTRA_DB_API_ENDPOINT=https://...
ASTRA_DB_APPLICATION_TOKEN=AstraCS:...
ASTRA_DB_KEYSPACE=sovereign_memory

# NVIDIA API Keys
NVIDIA_API_KEY=nvapi-...
NVIDIA_API_KEY_SECONDARY=nvapi-...

# Gemini
GEMINI_API_KEY=...
GEMINI_CLIENT_ID=...

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# Steam
STEAM_API_KEY=...

# Maton
MATON_API_KEY=...
```

### Service Ports

Default ports (configurable in docker-compose):

- Nginx: 80, 443
- Node AI Lobby: 8787
- Python Core: 3002

## Monitoring

### Service Status

```bash
# Check running containers
docker ps

# Check service status
./deploy.sh status

# Health check
./deploy.sh health
```

### View Logs

```bash
# All services
./deploy.sh logs

# Specific service
./deploy.sh logs nginx
./deploy.sh logs node-ai-lobby
./deploy.sh logs python-core

# Real-time logs
docker compose -f docker-compose.production.yml logs -f
```

### Log Files

Logs are stored in `./logs/`:

```
logs/
├── nginx/
│   ├── access.log
│   └── error.log
├── node/
│   └── app.log
└── python/
    └── app.log
```

## Backup & Recovery

### Create Backup

```bash
# Automatic backup
./deploy.sh backup

# Manual backup
docker compose -f docker-compose.production.yml run --rm \
  -v one2lvos-node-data:/source \
  -v ./backups:/backup \
  alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz -C /source .
```

### Restore Backup

```bash
# Stop services
./deploy.sh stop

# Restore data
docker compose -f docker-compose.production.yml run --rm \
  -v one2lvos-node-data:/target \
  -v ./backups:/backup \
  alpine tar xzf /backup/backup-YYYYMMDD.tar.gz -C /target

# Restart services
./deploy.sh start
```

## Troubleshooting

### Services Won't Start

```bash
# Check Docker status
systemctl status docker

# Check logs
./deploy.sh logs

# Rebuild containers
docker compose -f docker-compose.production.yml build --no-cache
./deploy.sh restart
```

### Health Checks Failing

```bash
# Check individual services
curl http://localhost:80/health
curl http://localhost:8787/health
curl http://<SERVER_IP>:3002/health

# Check service logs
./deploy.sh logs nginx
./deploy.sh logs node-ai-lobby
./deploy.sh logs python-core
```

### Port Conflicts

```bash
# Check port usage
sudo netstat -tulpn | grep -E ':(80|8787|3002)'

# Stop conflicting services
sudo systemctl stop nginx  # if system nginx is running
```

### Astra DB Connection Issues

```bash
# Test Astra DB connection
curl -X POST \
  "${ASTRA_DB_API_ENDPOINT}/api/json/v1/${ASTRA_DB_KEYSPACE}" \
  -H "Token: ${ASTRA_DB_APPLICATION_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"findCollections": {}}'

# Reinitialize collections
./deploy.sh init-astra
```

## Updating

### Update from GitHub

```bash
# Automatic update
./deploy.sh update
```

### Manual Update

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

## Security

### Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Restrict API ports to internal network (optional)
sudo ufw allow from 10.0.0.0/8 to any port 8787
sudo ufw allow from 10.0.0.0/8 to any port 3002
```

### SSL/TLS Setup

Add SSL certificates to nginx configuration:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;
    # ... rest of config
}
```

## Performance Tuning

### Resource Limits

Edit `docker-compose.production.yml`:

```yaml
services:
  node-ai-lobby:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Nginx Tuning

Edit `nginx.conf`:

```nginx
worker_processes auto;
worker_connections 2048;
keepalive_timeout 120;
```

## Support

- **Documentation**: https://github.com/one2lv-com/One2lvos
- **Issues**: https://github.com/one2lv-com/One2lvos/issues
- **Discord**: [Join Community]

---

**One2lvOS v1.0.2 Production** | Deployed: 2026-09-08
