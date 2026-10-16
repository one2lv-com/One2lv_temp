#!/bin/bash

# One2lvOS Network Service Verification Script
# Checks if all components are properly installed

echo "================================================"
echo "  One2lvOS Network Service Verification"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0

# Check Node.js
echo -e "${BLUE}Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js found: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    ((ERRORS++))
fi
echo ""

# Check npm
echo -e "${BLUE}Checking npm...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm found: v${NPM_VERSION}${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
    ((ERRORS++))
fi
echo ""

# Change to script directory
cd "$(dirname "$0")"

# Check required files
echo -e "${BLUE}Checking required files...${NC}"

FILES=(
    "services/mesh-routing.js"
    "services/network-service.js"
    "services/protocols/webdav-handler.js"
    "services/protocols/ftp-handler.js"
    "server/network-api.js"
    "network-manager.html"
    "config/connections.json"
    "start-network-service.sh"
    "NETWORK-SERVICE.md"
)

for FILE in "${FILES[@]}"; do
    if [ -f "$FILE" ]; then
        echo -e "${GREEN}✓ ${FILE}${NC}"
    else
        echo -e "${RED}✗ Missing: ${FILE}${NC}"
        ((ERRORS++))
    fi
done
echo ""

# Check dependencies
echo -e "${BLUE}Checking dependencies...${NC}"
if [ -d "node_modules/express" ]; then
    echo -e "${GREEN}✓ express installed${NC}"
else
    echo -e "${YELLOW}⚠ express not installed (run: npm install)${NC}"
fi

if [ -d "node_modules/cors" ]; then
    echo -e "${GREEN}✓ cors installed${NC}"
else
    echo -e "${YELLOW}⚠ cors not installed (run: npm install)${NC}"
fi
echo ""

# Check package.json scripts
echo -e "${BLUE}Checking package.json scripts...${NC}"
if grep -q '"network"' package.json; then
    echo -e "${GREEN}✓ npm run network script configured${NC}"
else
    echo -e "${RED}✗ Missing network script in package.json${NC}"
    ((ERRORS++))
fi
echo ""

# Summary
echo "================================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You can now start the Network Service:"
    echo "  ./start-network-service.sh"
    echo "  or"
    echo "  npm run network"
    echo ""
    echo "Access the Network Manager UI at:"
    echo "  http://localhost:3003/network-manager.html"
else
    echo -e "${RED}✗ ${ERRORS} error(s) found${NC}"
    echo ""
    echo "Please fix the errors above before starting the service."
fi
echo "================================================"
