#!/bin/bash
# Start Maton Security Monitor
# Monitors API logs every 73 minutes for suspicious activity

cd /home/vercel-sandbox/One2lvos

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Starting Maton Security Monitor                        ║"
echo "║   Heartbeat: 73 minutes (synced with Lumenis)            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Load environment variables
if [ -f .env ]; then
    source .env
    echo "✓ Environment loaded from .env"
else
    echo "⚠️  Warning: .env file not found"
fi

# Check configuration
if [ -z "$MATON_API_KEY" ]; then
    echo "✗ MATON_API_KEY not configured"
    exit 1
fi

echo "✓ Maton API Key: ${MATON_API_KEY:0:15}..."

if [ -z "$ALERT_EMAIL" ]; then
    echo "⚠️  ALERT_EMAIL not configured (email alerts disabled)"
fi

# Create logs directory
mkdir -p logs

echo ""
echo "Monitor will check Maton API logs every 73 minutes"
echo "Logs: logs/maton_monitor.log"
echo "Alerts: logs/SECURITY_ALERTS.log"
echo ""
echo "Starting monitor..."
echo ""

# Run monitor (use --once for single check, omit for continuous)
python3 maton_security_monitor.py "$@"
