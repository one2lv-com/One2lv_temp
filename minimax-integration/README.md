# MiniMax AI Integration for One2lvos

## Overview
MiniMax integration module for the One2lvos Sovereign Architecture. Provides advanced AI reasoning and creative capabilities through NVIDIA's MiniMax API.

## Architecture
```
┌─────────────────────┐
│  One2lvos Frontend  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  MiniMax Bridge     │  (Node.js - Port 8002)
│  Express Gateway    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  MiniMax API        │  (Python FastAPI - Port 8001)
│  NVIDIA MiniMax-01  │
└─────────────────────┘
```

## Features
- **Chat Interface**: Simple conversational AI
- **Reasoning Engine**: Complex problem-solving
- **Creative Generation**: Content creation
- **Multi-turn Conversations**: Context-aware dialogs

## Installation

```bash
cd /home/vercel-sandbox/One2lvos/minimax-integration

# Install Python dependencies
pip install -r requirements.txt --break-system-packages

# Install Node dependencies
npm install
```

## Configuration
Environment variables (already in `.env.master`):
```bash
NVIDIA_API_KEY_MINIMAX=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
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
MINIMAX_PORT=8001
MINIMAX_BRIDGE_PORT=8002
```

## Usage

### Start Services
```bash
chmod +x start_minimax.sh
./start_minimax.sh
```

### API Endpoints

#### Chat
```bash
curl -X POST http://localhost:8002/api/minimax/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello MiniMax!"}'
```

#### Reasoning
```bash
curl -X POST http://localhost:8002/api/minimax/reasoning \
  -H "Content-Type: application/json" \
  -d '{"problem": "Design a scalable vector database", "context": "For 144k nodes"}'
```

#### Creative
```bash
curl -X POST http://localhost:8002/api/minimax/creative \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create AR interface concept", "style": "cyberpunk"}'
```

## Integration with One2lvos

Add to your main `docker-compose.yml`:
```yaml
minimax-api:
  build: ./minimax-integration
  ports:
    - "8001:8001"
  env_file:
    - .env.master

minimax-bridge:
  build: ./minimax-integration
  command: node minimax_bridge.js
  ports:
    - "8002:8002"
  depends_on:
    - minimax-api
  env_file:
    - .env.master
```

## Testing
```bash
# Test Python client
python3 minimax_client.py

# Test API endpoint
curl http://localhost:8002/api/minimax/test
```

## Model Information
- **Model**: `nvidia/minimax-01`
- **Provider**: NVIDIA NIM
- **Capabilities**: Reasoning, Chat, Creative Generation
- **Context Window**: 128K tokens
- **Output Tokens**: Up to 4096

## Integration Points
- Lumenis Reactor Core (Port 8000)
- Astra DB Memory (aria_memory_v2)
- Infinity Glasses HUD (Port 4000)
- Main Dashboard (Port 3000)

## Sovereign Architecture Alignment
- **Gate 1**: Sovereignty - Independent MiniMax reasoning
- **Gate 2**: Vector Consistency - Memory integration ready
- **Gate 3**: Execution - FastAPI + Express stack
- **Gate 4**: State Persistence - LSB steganography compatible

## Support
Part of the One2lvos Sovereign Architecture
