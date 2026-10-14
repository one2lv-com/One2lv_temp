#!/bin/bash
# ONE2LVOS Sovereign Architecture - Unified Shutdown Script

echo "🛑 Shutting down ONE2LVOS Sovereign Architecture..."

# Stop PM2 processes
pm2 delete all 2>/dev/null || true

# Kill Python processes
pkill -9 -f "python3 main.py" 2>/dev/null || true

# Kill Node processes
pkill -9 -f "node server.js" 2>/dev/null || true
pkill -9 -f "minimax" 2>/dev/null || true

echo "✅ All processes terminated"
echo ""
echo "To restart: ./start-all.sh"
