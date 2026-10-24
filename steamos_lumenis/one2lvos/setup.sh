#!/usr/bin/env bash
set -e

echo "🌌 ONE2LVOS v5 SETUP SCRIPT"
echo "============================="
echo ""

# Configuration
APP_DIR="$HOME/one2lvos"
SUDO_INSTALLED=false

# Check if running in workspace
if [ -d "/workspace/one2lvos" ]; then
  APP_DIR="/workspace/one2lvos"
fi

echo "📁 App directory: $APP_DIR"

# ====================
# 1. System Setup
# ====================
echo ""
echo "🔧 Setting up system..."

# Check for sudo
if command -v sudo &> /dev/null; then
  SUDO_INSTALLED=true
  echo "  ✓ sudo available"
elif command -v doas &> /dev/null; then
  SUDO_INSTALLED=true
  alias sudo='doas'
else
  echo "  ⚠️  No sudo available - assuming already root"
fi

# Update package list
if command -v apt-get &> /dev/null; then
  echo "  📦 Updating apt..."
  sudo apt-get update -qq 2>/dev/null || true
fi

# ====================
# 2. Node.js
# ====================
echo ""
echo "🟢 Checking Node.js..."

if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo "  ✓ Node.js installed: $NODE_VERSION"
else
  echo "  📥 Installing Node.js..."
  if [ -f /etc/debian_version ]; then
    sudo apt-get install -y nodejs npm
  elif [ -f /etc/redhat-release ]; then
    sudo yum install -y nodejs npm
  else
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
fi

# ====================
# 3. Dependencies
# ====================
echo ""
echo "📦 Installing npm dependencies..."

cd "$APP_DIR" || exit 1

# Install dependencies
npm install express ws dotenv @supabase/supabase-js node-fetch pm2 cors 2>/dev/null || {
  echo "  ⚠️  npm install had issues, trying with legacy peer deps..."
  npm install --legacy-peer-deps
}

echo "  ✓ Dependencies installed"

# ====================
# 4. PM2 Setup
# ====================
echo ""
echo "⚡ Setting up PM2..."

if command -v pm2 &> /dev/null; then
  echo "  ✓ PM2 already installed"
else
  echo "  📥 Installing PM2 globally..."
  npm install -g pm2
fi

# Create logs directory
mkdir -p "$APP_DIR/logs"

# ====================
# 5. Configuration
# ====================
echo ""
echo "⚙️  Configuration..."

if [ ! -f "$APP_DIR/.env" ]; then
  if [ -f "$APP_DIR/.env.example" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    echo "  ✓ Created .env from example"
    echo "  ⚠️  Please edit .env with your Supabase credentials!"
  else
    cat > "$APP_DIR/.env" <<'ENVFILE'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
NODE_ID=node-1
NODE_PORT=8080
MESH_PEERS=
ADMIN_TOKEN=one2lv-secret-2024
ENVFILE
    echo "  ✓ Created .env"
  fi
else
  echo "  ✓ .env already exists"
fi

# ====================
# 6. PM2 Start
# ====================
echo ""
echo "🚀 Starting ONE2LVOS with PM2..."

cd "$APP_DIR"

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 state
pm2 save

# Setup startup script
pm2 startup 2>/dev/null || true

echo ""
echo "✅ SETUP COMPLETE!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🌌 ONE2LVOS v5 is running!"
echo ""
echo "  Commands:"
echo "    pm2 logs one2lvos     - View logs"
echo "    pm2 status            - Check status"
echo "    pm2 restart one2lvos  - Restart"
echo "    pm2 stop one2lvos     - Stop"
echo ""
echo "  API Endpoints:"
echo "    GET  /health          - Health check"
echo "    POST /api/chat        - Chat with AI"
echo "    POST /api/coach/chat  - AI Coach"
echo "    POST /api/ai/decide   - AI Game Decision"
echo "    GET  /api/leaderboard - Leaderboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Edit .env with your Supabase credentials"
echo ""
echo "2. Run the SQL schema in Supabase SQL Editor:"
echo "   → supabase_schema.sql"
echo ""
echo "3. Test the API:"
echo '   curl -X POST http://localhost:8080/api/chat \'
echo '     -H "Content-Type: application/json" \'
echo '     -d "{\"input\":\"hello coach\"}"'
echo ""
echo "4. View logs:"
echo "   pm2 logs one2lvos"
echo ""