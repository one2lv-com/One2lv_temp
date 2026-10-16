#!/bin/bash

# One2lvOS Network Service Startup Script
# Starts the Static Connections & Mesh Routing service with WebDAV/FTP

echo "================================================"
echo "  One2lvOS Network Service"
echo "  Static Connections & Mesh Routing"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Error: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo -e "${BLUE}Node.js version:${NC} $(node --version)"
echo ""

# Change to script directory
cd "$(dirname "$0")"

# Create required directories
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p config
mkdir -p services/protocols
mkdir -p server

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Dependencies not found. Installing...${NC}"
    npm install express cors
    echo ""
fi

# Create config file if it doesn't exist
if [ ! -f "config/connections.json" ]; then
    echo -e "${BLUE}Creating default configuration...${NC}"
    echo '{"connections":[]}' > config/connections.json
fi

# Set default port if not set
export NETWORK_API_PORT=${NETWORK_API_PORT:-3003}

echo -e "${GREEN}Starting Network Service...${NC}"
echo -e "${BLUE}Port:${NC} $NETWORK_API_PORT"
echo -e "${BLUE}Web UI:${NC} http://localhost:$NETWORK_API_PORT/network-manager.html"
echo ""
echo "Press Ctrl+C to stop the service"
echo "================================================"
echo ""

# Start the service
node server/network-api.js
