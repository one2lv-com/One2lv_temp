# One2lvOS Production Deployment Guide

This guide explains how to deploy One2lvOS to production using Docker Compose and GitHub Actions.

## Architecture

```
git push main
     ↓
GitHub Actions
     ↓
validate + build
     ↓
SSH → production Docker host
     ↓
git pull main
     ↓
docker compose build
     ↓
docker compose up -d
     ↓
┌─────────────────────────────┐
│ Nginx Gateway (Port 80/443) │
│       ↓                     │
│ One2lvOS UI (Port 3000)     │
│ Node AI Lobby (Port 8787)   │
│ Python One2lv Core (3002)   │
└─────────────────────────────┘
     ↓
persistent / always restarting
```

## Prerequisites

### On Your Production Server

1. **Docker & Docker Compose** installed
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Install Docker Compose
   sudo apt-get update
   sudo apt-get install docker-compose-plugin
   ```

2. **SSH Access** configured
   ```bash
   # On your server, create a deploy user (optional but recommended)
   sudo useradd -m -s /bin/bash deploy
   sudo usermod -aG docker deploy

   # Add your SSH key for passwordless access
   sudo mkdir -p /home/deploy/.ssh
   sudo nano /home/deploy/.ssh/authorized_keys
   # Paste your public key here
   ```

3. **Project Directory**
   ```bash
   sudo mkdir -p /opt/one2lvos
   sudo chown deploy:deploy /opt/one2lvos
   ```

### On GitHub

1. **Add Repository Secrets** (Settings → Secrets and variables → Actions)
   - `SSH_PRIVATE_KEY`: Your private SSH key for server access
   - `SERVER_HOST`: Your server's IP address or domain
   - `SERVER_USER`: SSH username (e.g., `deploy`)

2. **Generate SSH Key Pair** (if you don't have one)
   ```bash
   ssh-keygen -t ed25519 -C "deploy@one2lvos" -f ~/.ssh/one2lvos_deploy
   # Add public key to server's authorized_keys
   # Add private key to GitHub secrets
   ```

## Configuration

### 1. Environment Variables

Create `.env` file on your production server:

```bash
cd /opt/one2lvos
cp .env.example .env
nano .env
```

Fill in your actual values:
- Astra DB credentials
- OpenAI API key
- Other service configurations

### 2. SSL Certificates (Optional but Recommended)

For HTTPS support:

```bash
# Using Let's Encrypt with Certbot
sudo apt-get install certbot
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to project
sudo mkdir -p /opt/one2lvos/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/one2lvos/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/one2lvos/ssl/key.pem
sudo chown -R deploy:deploy /opt/one2lvos/ssl
```

Then uncomment the HTTPS server block in `nginx.conf`.

## Deployment

### Automatic Deployment (Recommended)

Push to the `main` branch triggers automatic deployment:

```bash
git add .
git commit -m "Deploy changes"
git push origin main
```

GitHub Actions will:
1. Run tests
2. Build validation
3. SSH to your server
4. Pull latest code
5. Build Docker images
6. Deploy containers

### Manual Deployment

SSH to your server and run:

```bash
cd /opt/one2lvos
./deploy.sh
```

## Service Management

### View Running Services

```bash
docker compose ps
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f ui
docker compose logs -f ai-lobby
docker compose logs -f core-api
docker compose logs -f nginx
```

### Restart Services

```bash
# All services
docker compose restart

# Specific service
docker compose restart ui
```

### Stop Services

```bash
docker compose down
```

### Rebuild After Code Changes

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Health Checks

All services have built-in health checks:

```bash
# Check Nginx gateway
curl http://localhost/health

# Check AI Lobby
curl http://localhost:8787/health

# Check Core API
curl http://<SERVER_IP>:3002/health

# Check all containers health status
docker compose ps
```

## Monitoring

### Container Stats

```bash
docker stats
```

### Disk Usage

```bash
docker system df
```

### Clean Up Old Images

```bash
docker image prune -a
docker volume prune
```

## Troubleshooting

### Services Won't Start

1. **Check logs**
   ```bash
   docker compose logs
   ```

2. **Check environment variables**
   ```bash
   cat .env
   ```

3. **Verify port availability**
   ```bash
   sudo netstat -tulpn | grep -E ':(80|3000|3002|8787)'
   ```

### Container Keeps Restarting

```bash
# Check specific container logs
docker logs one2lvos-ui
docker logs one2lvos-ai-lobby
docker logs one2lvos-core-api

# Check container health
docker inspect one2lvos-ui | grep -A 10 Health
```

### Out of Disk Space

```bash
# Clean up Docker
docker system prune -a --volumes

# Check disk usage
df -h
du -sh /opt/one2lvos/*
```

### Database Connection Issues

1. Verify Astra DB credentials in `.env`
2. Check network connectivity
3. Ensure Astra DB is active and accessible

### GitHub Actions Deployment Fails

1. **Check SSH connection**
   ```bash
   ssh -i ~/.ssh/one2lvos_deploy deploy@your-server
   ```

2. **Verify GitHub secrets** are set correctly

3. **Check workflow logs** in GitHub Actions tab

## Backup & Recovery

### Backup Environment

```bash
# Backup .env and data
cd /opt/one2lvos
tar -czf backup-$(date +%Y%m%d).tar.gz .env docker-compose.yml data/
```

### Restore from Backup

```bash
tar -xzf backup-20260908.tar.gz
docker compose up -d
```

## Security Best Practices

1. **Use SSH keys** instead of passwords
2. **Enable firewall** (ufw or iptables)
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
3. **Keep secrets secure** - never commit `.env` to git
4. **Regular updates**
   ```bash
   sudo apt-get update && sudo apt-get upgrade
   docker compose pull
   docker compose up -d
   ```
5. **Use HTTPS** in production
6. **Set up monitoring** (Prometheus, Grafana, etc.)

## Scaling

### Horizontal Scaling

Update `docker-compose.yml` to add replicas:

```yaml
services:
  core-api:
    deploy:
      replicas: 3
```

### Load Balancing

Nginx is already configured for load balancing. Update upstream blocks as needed.

## Support

- Documentation: See other `*.md` files in this repository
- Issues: https://github.com/one2lv-com/One2lvos/issues
- Email: one2lv@one2lv.com

## Quick Reference

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Rebuild and deploy
./deploy.sh

# Check health
curl http://localhost/health
```
