#!/bin/bash
# ONE2LVOS MiniMax Integration Launcher

echo "🚀 Starting MiniMax Integration..."

# Load environment
if [ -f "../.env.master" ]; then
    export $(cat ../.env.master | grep -v '^#' | xargs)
fi

# Start Python API
echo "🐍 Starting MiniMax API (Port 8001)..."
cd "$(dirname "$0")"
python3 minimax_api.py &
PYTHON_PID=$!

sleep 3

# Start Node.js Bridge
echo "🌉 Starting MiniMax Bridge (Port 8002)..."
npm install --silent
node minimax_bridge.js &
NODE_PID=$!

sleep 2

# Health check
echo "🏥 Health Check..."
curl -s http://localhost:8001/health | jq '.'
curl -s http://localhost:8002/health | jq '.'

echo ""
echo "✅ MiniMax Integration Online"
echo "📍 Python API:  http://localhost:8001"
echo "📍 Node Bridge: http://localhost:8002"
echo ""
echo "To stop: pkill -9 -f minimax_api && pkill -9 -f minimax_bridge"
