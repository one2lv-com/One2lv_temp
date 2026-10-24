#!/bin/bash

echo "🌌 LUMENIS CONTROL — UNIFIED STARTUP"
echo "======================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js."
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
cd python-backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
cd ..

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Check environment variables
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  Warning: ANTHROPIC_API_KEY not set"
    echo "   The Python backend requires this for Claude API access"
fi

if [ -z "$SUPABASE_URL" ]; then
    echo "⚠️  Warning: SUPABASE_URL not set"
fi

echo ""
echo "🚀 Starting services..."
echo ""

# Start Python backend in background
echo "🧠 Starting Sovereign Core (Python) on port 3002..."
cd python-backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 3002 &
PYTHON_PID=$!
cd ..

# Wait for Python backend to be ready
sleep 3

# Start Node.js backend
echo "⚡ Starting Lumenis Control (Node.js) on port 3000..."
npm start &
NODE_PID=$!

echo ""
echo "✨ LUMENIS CONTROL ONLINE"
echo "================================"
echo "🌐 Frontend:        http://localhost:3000"
echo "🧠 Sovereign Core:  http://localhost:3002"
echo "🦝 Raccoon Agents:  ACTIVE"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Trap Ctrl+C and stop both services
trap "echo ''; echo '🛑 Stopping services...'; kill $PYTHON_PID $NODE_PID 2>/dev/null; exit" INT

# Wait for both processes
wait
