#!/bin/bash
# Demo: Lumenis + Maton API Gateway Integration
# Shows how to use the api-gateway skill with Lumenis Reactor Core

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Lumenis Reactor Core + Maton API Gateway Demo          ║"
echo "║   Demonstrating api-gateway skill integration             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

cd /home/vercel-sandbox/One2lvos

echo "📊 Connection Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
maton connection list
echo ""

echo "📧 Gmail Quick Test (via Maton CLI):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
maton google-mail label list | head -10
echo ""

echo "📁 Google Drive Quick Test (via Maton CLI):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
maton google-drive file list | head -10
echo ""

echo "🔬 Python Integration Test:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
python3 test_maton_integration.py
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  Demo Complete!                                           ║"
echo "║                                                           ║"
echo "║  To interact with Lumenis using these services:          ║"
echo "║  $ python3 talk_to_lumenis.py                            ║"
echo "║                                                           ║"
echo "║  Example prompts:                                         ║"
echo "║  - Show me my recent Gmail messages                      ║"
echo "║  - List my Google Drive files                            ║"
echo "║  - What's in my inbox?                                   ║"
echo "╚═══════════════════════════════════════════════════════════╝"
