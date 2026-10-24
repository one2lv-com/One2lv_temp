#!/bin/bash

echo "🌌 LUMENIS ONE2LVOS - Complete Deployment & Launch Script"
echo "=========================================================="
echo ""

# Colors for output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Supabase Configuration
SUPABASE_URL="https://pplbxjguhmfeuptyamic.supabase.co"
SUPABASE_SERVICE_JWT="<SUPABASE_SERVICE_ROLE_JWT>"

# Step 1: Deploy Database Schema
echo -e "${CYAN}[1/5] Deploying Database Schema to Supabase...${NC}"
echo "------------------------------------------------------"

python3 <<'PYTHON_SCRIPT'
import urllib.request
import json

SUPABASE_URL = "https://pplbxjguhmfeuptyamic.supabase.co"
SERVICE_JWT = "<SUPABASE_SERVICE_ROLE_JWT>"

# Read SQL schema
with open('supabase-schema.sql', 'r') as f:
    schema_sql = f.read()

# Split into individual statements
statements = [s.strip() for s in schema_sql.split(';') if s.strip()]

print(f"📋 Deploying {len(statements)} SQL statements...")

success_count = 0
for i, statement in enumerate(statements, 1):
    if not statement:
        continue

    try:
        # Use Supabase REST API to execute SQL
        url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
        data = json.dumps({"query": statement + ";"}).encode()

        req = urllib.request.Request(url, data=data, method='POST')
        req.add_header('apikey', SERVICE_JWT)
        req.add_header('Authorization', f'Bearer {SERVICE_JWT}')
        req.add_header('Content-Type', 'application/json')

        urllib.request.urlopen(req)
        success_count += 1
        print(f"  ✅ Statement {i}/{len(statements)} executed")
    except Exception as e:
        # Some statements might fail if already exist (like CREATE TABLE IF NOT EXISTS)
        # This is expected and okay
        if "already exists" in str(e).lower():
            print(f"  ⚠️  Statement {i}/{len(statements)} - Table already exists (OK)")
            success_count += 1
        else:
            print(f"  ❌ Statement {i}/{len(statements)} failed: {e}")

print(f"\n✅ Schema deployment complete: {success_count}/{len(statements)} successful")
PYTHON_SCRIPT

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database schema deployed successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Schema deployment had issues, but continuing...${NC}"
fi

echo ""

# Step 2: Install Node.js Dependencies
echo -e "${CYAN}[2/5] Installing Node.js Dependencies...${NC}"
echo "------------------------------------------------------"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Node.js dependencies installed!${NC}"
else
    echo -e "${RED}❌ Failed to install Node.js dependencies${NC}"
    exit 1
fi

echo ""

# Step 3: Setup Python Backend
echo -e "${CYAN}[3/5] Setting up Python Backend...${NC}"
echo "------------------------------------------------------"
cd python-backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -q -r requirements.txt

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Python backend configured!${NC}"
else
    echo -e "${RED}❌ Failed to setup Python backend${NC}"
    exit 1
fi

cd ..
echo ""

# Step 4: Verify Configuration
echo -e "${CYAN}[4/5] Verifying System Configuration...${NC}"
echo "------------------------------------------------------"

# Check if required environment variables are set
if [ -f ".env" ]; then
    echo "✅ .env file found"

    # Check for critical variables
    if grep -q "SUPABASE_URL" .env && grep -q "NVIDIA_API_KEY" .env && grep -q "MATON_API_KEY" .env; then
        echo "✅ Critical environment variables configured"
    else
        echo -e "${YELLOW}⚠️  Some environment variables may be missing${NC}"
    fi
else
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

echo ""

# Step 5: Launch System
echo -e "${CYAN}[5/5] Launching LUMENIS System...${NC}"
echo "------------------------------------------------------"
echo ""
echo -e "${GREEN}🚀 Starting all services...${NC}"
echo ""
echo "Frontend will be available at:"
echo "  • Main Control:      http://localhost:3000/"
echo "  • Sovereign Lattice: http://localhost:3000/sovereign-lattice.html"
echo ""
echo "Backend APIs:"
echo "  • Node.js Server:    http://localhost:3000/"
echo "  • Python API:        http://localhost:3002/"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo "=========================================================="
echo ""

# Check if start-all.sh exists
if [ -f "./start-all.sh" ]; then
    chmod +x ./start-all.sh
    exec ./start-all.sh
else
    echo -e "${YELLOW}⚠️  start-all.sh not found, starting services manually...${NC}"

    # Start Node.js backend
    echo "Starting Node.js backend..."
    node backend/server.js &
    NODE_PID=$!

    # Start Python backend
    echo "Starting Python backend..."
    cd python-backend
    source venv/bin/activate
    python3 main.py &
    PYTHON_PID=$!
    cd ..

    echo ""
    echo -e "${GREEN}✅ Services started!${NC}"
    echo "Node.js PID: $NODE_PID"
    echo "Python PID: $PYTHON_PID"
    echo ""
    echo "To stop services:"
    echo "  kill $NODE_PID $PYTHON_PID"

    # Wait for user interrupt
    wait
fi
