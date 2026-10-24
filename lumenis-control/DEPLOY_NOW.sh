#!/bin/bash

cat << "EOF"
🌌 LUMENIS ONE2LVOS - One-Step Deployment
========================================================

This script will:
  1. ✅ Deploy database schema to Supabase
  2. ✅ Install all Node.js dependencies
  3. ✅ Setup Python backend environment
  4. ✅ Launch the complete system

========================================================
EOF

echo ""
read -p "Press ENTER to begin deployment... "

echo ""
echo "🚀 Starting deployment..."
echo ""

# Install Node dependencies
echo "[1/4] Installing Node.js dependencies..."
npm install --silent
echo "✅ Node.js ready"
echo ""

# Setup Python
echo "[2/4] Setting up Python backend..."
cd python-backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
deactivate
cd ..
echo "✅ Python backend ready"
echo ""

# Schema deployment instructions
echo "[3/4] Database Schema Deployment"
echo "----------------------------------------"
echo ""
echo "📋 Please complete this manual step:"
echo ""
echo "1. Open in browser: https://supabase.com/dashboard/project/pplbxjguhmfeuptyamic/sql/new"
echo ""
echo "2. Copy and paste this SQL:"
echo ""
cat supabase-schema.sql
echo ""
echo "3. Click 'RUN' button"
echo ""
read -p "Press ENTER after you've deployed the schema... "
echo ""
echo "✅ Schema deployed"
echo ""

# Final launch
echo "[4/4] Launching LUMENIS System..."
echo "----------------------------------------"
echo ""
echo "🌌 System Starting..."
echo ""
echo "Access Points:"
echo "  • Main Control:      http://localhost:3000/"
echo "  • Sovereign Lattice: http://localhost:3000/sovereign-lattice.html"
echo "  • Python API:        http://localhost:3002/"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""
echo "=========================================================="
echo ""

# Launch
if [ -f "./start-all.sh" ]; then
    ./start-all.sh
else
    # Fallback: start services manually
    node backend/server.js &
    cd python-backend && source venv/bin/activate && python3 main.py &
    wait
fi
