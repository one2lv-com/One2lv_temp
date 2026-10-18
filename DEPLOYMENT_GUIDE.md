# ONE2LVOS Deployment Guide

## Complete Deployment Workflow

This guide covers deploying the complete One2lvOS system with the Sovereign Architecture integration.

## Prerequisites

### Required Software
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Git** for version control
- **curl** for health checks

### Required Accounts
- **NVIDIA API Account**: For LLM and embeddings
  - Get key at: https://build.nvidia.com
  - Models used: Llama-3.3-Nemotron-Super-49b-v1, nv-embedqa-e5-v5

- **DataStax Astra DB Account**: For vector memory
  - Sign up at: https://astra.datastax.com
  - Create Serverless Vector database
  - Deploy to AWS us-east-2 or GCP us-east1

## Step 1: Clone Repository

```bash
git clone https://github.com/one2lv-com/One2lvos.git
cd One2lvos
```

## Step 2: Install Dependencies

### Python Dependencies
```bash
pip3 install -r requirements.txt --user
```

Or for Termux:
```bash
pip install -r requirements.txt --break-system-packages
```

### Node.js Dependencies (Optional - handled by deployment script)
```bash
npm install
```

## Step 3: Configure Environment

### Option A: Use Provided Credentials (Demo Only)
The deployment script includes demo credentials. **DO NOT use in production.**

### Option B: Set Your Own Credentials
Edit the `.env` file after first run:

```bash
./deploy-sovereign.sh  # Run once to create structure
nano ∆Gemini_Root∆/core/.env
```

Update with your credentials:
```env
NVIDIA_API_KEY="your-nvidia-key-here"
ASTRA_DB_API_ENDPOINT="your-astra-endpoint"
ASTRA_DB_APPLICATION_TOKEN="your-astra-token"
```

## Step 4: Deploy Sovereign Architecture

### Make Script Executable
```bash
chmod +x deploy-sovereign.sh
chmod +x shutdown-sovereign.sh
```

### Run Deployment
```bash
./deploy-sovereign.sh
```

Expected output:
```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║       🌷 ONE2LVOS SOVEREIGN ARCHITECTURE - ∆Gemini_Root∆ BOOT 📱      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

☢️  [1/8] Executing Nuclear Memory Purge (Lumenis Reactor Core)...
✅ System State: Homeostatic. Memory purged.

🔄 [2/8] Bootstrapping Tier 1 Skills (Modules 001-300: Core & Ops)...
✅ Core dependencies verified.

...

╔══════════════════════════════════════════════════════════════════════╗
║             🌷 ONE2LVOS SOVEREIGN ARCHITECTURE DEPLOYED 🎮           ║
╚══════════════════════════════════════════════════════════════════════╝

📍 Infinity Glasses HUD:   http://localhost:4000
📍 Lumenis Reactor Core:   http://localhost:8000
📍 One2lvOS Interface:     http://localhost:4000/os
```

## Step 5: Verify Deployment

### Test Backend Health
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "144k_node_active",
  "layer": "L2_SKILLS",
  "llm": "nvidia/llama-3.3-nemotron-super-49b-v1"
}
```

### Test Chat Endpoint
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what are you?", "top_k": 3}'
```

### Open Web Interfaces
1. **Infinity Glasses HUD**: http://localhost:4000
2. **One2lvOS UI**: http://localhost:4000/os
3. **API Docs**: http://localhost:8000/docs

## Step 6: Test Integration

### Test Chat in HUD
1. Open http://localhost:4000
2. Type a message in the input field
3. Press Enter
4. Observe response in chat log
5. Check memory panel for context retrieval

### Test One2lvOS
1. Open http://localhost:4000/os
2. Wait for boot sequence
3. Use terminal commands: `help`, `status`, `registry`
4. Explore desktop environment

## Docker Deployment (Alternative)

### Create Dockerfile
```dockerfile
FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y nodejs npm curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy project
COPY . .

# Install dependencies
RUN pip install -r requirements.txt
RUN cd ∆Gemini_Root∆/ui && npm install

# Expose ports
EXPOSE 4000 8000

# Start services
CMD ["bash", "-c", "cd ∆Gemini_Root∆/core && python3 main.py & cd ../ui && node server.js"]
```

### Build and Run
```bash
docker build -t one2lvos-sovereign .
docker run -p 4000:4000 -p 8000:8000 one2lvos-sovereign
```

## Production Deployment

### Using Systemd (Linux)

#### Backend Service
Create `/etc/systemd/system/one2lvos-core.service`:
```ini
[Unit]
Description=One2lvOS Lumenis Reactor Core
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/One2lvos/∆Gemini_Root∆/core
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Frontend Service
Create `/etc/systemd/system/one2lvos-ui.service`:
```ini
[Unit]
Description=One2lvOS Infinity Glasses HUD
After=network.target one2lvos-core.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/One2lvos/∆Gemini_Root∆/ui
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Enable and Start
```bash
sudo systemctl daemon-reload
sudo systemctl enable one2lvos-core one2lvos-ui
sudo systemctl start one2lvos-core one2lvos-ui
sudo systemctl status one2lvos-core one2lvos-ui
```

### Using Nginx Reverse Proxy

Create `/etc/nginx/sites-available/one2lvos`:
```nginx
server {
    listen 80;
    server_name one2lvos.example.com;

    # HUD and UI
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/one2lvos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d one2lvos.example.com
```

## Cloud Deployment

### AWS EC2
1. Launch Ubuntu 22.04 instance (t3.medium or larger)
2. Configure security groups: Allow TCP 80, 443, 4000, 8000
3. SSH into instance
4. Clone repo and run deployment script
5. Set up Nginx reverse proxy
6. Configure SSL

### Google Cloud Run
```bash
gcloud run deploy one2lvos-sovereign \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Heroku
```bash
heroku create one2lvos-sovereign
git push heroku main
heroku ps:scale web=1
heroku open
```

## Environment-Specific Configurations

### Termux (Android)
```bash
pkg update && pkg upgrade
pkg install python nodejs-lts git
./deploy-sovereign.sh
```

### WSL (Windows)
```bash
wsl --install Ubuntu-22.04
# Inside WSL:
./deploy-sovereign.sh
```

### macOS
```bash
brew install python node
./deploy-sovereign.sh
```

## Monitoring and Maintenance

### Log Rotation
Create `/etc/logrotate.d/one2lvos`:
```
/opt/One2lvos/∆Gemini_Root∆/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
}
```

### Health Monitoring Script
```bash
#!/bin/bash
# check-health.sh

CORE_HEALTH=$(curl -s http://localhost:8000/health | grep -q "144k_node_active" && echo "OK" || echo "FAIL")
UI_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000 | grep -q "200" && echo "OK" || echo "FAIL")

echo "Core: $CORE_HEALTH"
echo "UI: $UI_HEALTH"

if [ "$CORE_HEALTH" != "OK" ] || [ "$UI_HEALTH" != "OK" ]; then
    systemctl restart one2lvos-core one2lvos-ui
    echo "Services restarted"
fi
```

### Cron Job for Health Checks
```bash
# Add to crontab
*/5 * * * * /opt/One2lvos/check-health.sh >> /var/log/one2lvos-health.log 2>&1
```

## Backup and Recovery

### Backup Script
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/one2lvos"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup memory snapshots
tar -czf "$BACKUP_DIR/memory_$DATE.tar.gz" ∆Gemini_Memory∆/

# Backup stego cache
tar -czf "$BACKUP_DIR/stego_$DATE.tar.gz" ∆Gemini_Root∆/stego_cache/

# Backup configuration
cp ∆Gemini_Root∆/core/.env "$BACKUP_DIR/env_$DATE.bak"

echo "Backup completed: $DATE"
```

### Restore
```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

tar -xzf "$BACKUP_FILE" -C /
systemctl restart one2lvos-core one2lvos-ui
```

## Troubleshooting

### Service Won't Start
```bash
# Check Python version
python3 --version  # Should be 3.8+

# Check Node version
node --version  # Should be 16+

# Check port availability
lsof -i :4000
lsof -i :8000

# Check logs
tail -f ∆Gemini_Root∆/logs/core.log
tail -f ∆Gemini_Root∆/logs/hud.log
```

### Memory Issues
```bash
# Check if Astra DB is accessible
curl -I "https://9b5b1939-fd21-477d-95b8-a1aecc5f90b9-us-east-2.apps.astra.datastax.com"

# Test NVIDIA API
curl https://docs.api.nvidia.com/ \
  -H "Authorization: Bearer YOUR_KEY"
```

### Permission Errors
```bash
chmod +x deploy-sovereign.sh shutdown-sovereign.sh
chown -R $USER:$USER ∆Gemini_Root∆ ∆Gemini_Memory∆
```

## Scaling

### Horizontal Scaling
- Deploy multiple instances behind load balancer
- Share Astra DB across instances
- Use Redis for session management

### Vertical Scaling
- Increase CPU/RAM for instance
- Optimize batch sizes for embeddings
- Cache frequent queries

## Security Checklist

- [ ] Rotate API keys monthly
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Use secrets management (Vault, AWS Secrets Manager)
- [ ] Enable authentication on endpoints
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Monitor for suspicious activity
- [ ] Backup encryption at rest
- [ ] Use environment-specific configurations

## Performance Optimization

### Database Indexing
```python
# In Astra DB console, create index:
CREATE INDEX ON aria_memory (type);
CREATE INDEX ON aria_memory (timestamp);
```

### Caching
Add Redis caching:
```python
import redis
r = redis.Redis(host='localhost', port=6379, db=0)

# Cache embeddings
def get_cached_embedding(text):
    cached = r.get(f"embed:{text}")
    if cached:
        return json.loads(cached)
    return None
```

### Connection Pooling
Increase FastAPI workers:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Next Steps

1. ✅ Deploy and verify system
2. 📝 Customize system prompts in `main.py`
3. 🎨 Customize HUD styling in `server.js`
4. 🔧 Add custom skills in `∆Gemini_Root∆/skills/`
5. 📊 Set up monitoring and alerts
6. 🔐 Implement production security
7. 📱 Deploy to production environment
8. 🌐 Configure domain and SSL
9. 📈 Monitor and optimize performance
10. 🚀 Scale as needed

## Support

- GitHub Issues: https://github.com/one2lv-com/One2lvos/issues
- Documentation: See `SOVEREIGN_ARCHITECTURE.md`
- Community: Discord/Forum links

---

**Happy Deploying!** 🌷🚀
