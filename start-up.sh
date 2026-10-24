#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  set -a && source .env && set +a
else
  echo "Error: .env file not found."
  exit 1
fi

# Check if Lumenis sovereign core server is already running
if pgrep -f "uvicorn lumenis-main" > /dev/null; then
  echo "Lumenis sovereign core server is already running."
  exit 1
fi

# Start Lumenis sovereign core server with uvicorn
echo "Starting Lumenis sovereign core server..."
python3 -m uvicorn "lumenis-main:app" --host 0.0.0.0 --port 8000 &

# Wait for server to come up
echo "Waiting for server to start..."
for i in $(seq 1 15); do
  sleep 1
  if curl -s -f http://localhost:8000/api/status > /dev/null 2>&1; then
    echo "Lumenis sovereign core server started successfully."
    curl -s http://localhost:8000/api/status | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('  Model   :', d['reactor']['model'])
print('  NVIDIA  :', 'online' if d['nvidia']['online'] else 'offline')
print('  Seats   :', len(d['seats']))
print('  Compass :', d['compass']['sessions'], 'sessions')
"
    exit 0
  fi
  echo "  ...waiting ($i/15)"
done

echo "Error: Lumenis sovereign core server failed to start."
exit 1
