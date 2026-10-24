#!/bin/bash

echo ""
echo "🌌 ═══════════════════════════════════════════════"
echo "   STARTING LUMENIS ONE2LVOS RUNTIME"
echo "🌌 ═══════════════════════════════════════════════"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "⚠️  No .env file found"
  echo "📋 Copying .env.example to .env"
  cp .env.example .env
  echo ""
  echo "⚙️  Please edit .env with your configuration:"
  echo "   - Discord bot token"
  echo "   - Twitch credentials"
  echo ""
fi

echo "🧠 Booting backend runtime..."
echo "⚡ Starting WebSocket server..."
echo "🦝 Spawning autonomous agents..."
echo ""

# Start the server
node backend/server.js
