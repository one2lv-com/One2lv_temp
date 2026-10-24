"""
Sovereign Council - REAL FastAPI Server with NVIDIA API
========================================================
Uses actual NVIDIA llama-3.3-70b-instruct model via OpenAI-compatible API
Council of Seven specialized agents with real AI inference
"""

import os
import asyncio
import json
import time
from typing import Dict, List, Optional, Any
from datetime import datetime

import httpx
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configuration
NVIDIA_API_KEY = os.getenv('NVIDIA_API_KEY', '')
NVIDIA_API_BASE = os.getenv('NVIDIA_API_BASE', 'https://integrate.api.nvidia.com/v1')
NVIDIA_MODEL = os.getenv('NVIDIA_MODEL', 'meta/llama-3.3-70b-instruct')

if not NVIDIA_API_KEY:
    print("⚠️  WARNING: NVIDIA_API_KEY not set. Using demo mode.")
    print("   Get your key from: https://build.nvidia.com/")

# FastAPI App
app = FastAPI(title="Sovereign Council - Real AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class ChatRequest(BaseModel):
    message: str
    agent: Optional[str] = "strategist"
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1024
    stream: Optional[bool] = False

class ChatResponse(BaseModel):
    response: str
    agent: str
    model: str
    tokens: int
    processing_time: float

# Council of Seven Agents
COUNCIL_AGENTS = {
    "strategist": {
        "name": "Strategist",
        "role": "Planning and decision making",
        "system_prompt": """You are the Strategist agent of the Sovereign Council.
Your role is strategic planning, high-level decision making, and orchestrating complex operations.
Provide clear, actionable strategies with step-by-step execution plans.
Consider multiple perspectives and long-term consequences.""",
        "temperature": 0.8
    },
    "architect": {
        "name": "Architect",
        "role": "Technical design and architecture",
        "system_prompt": """You are the Architect agent of the Sovereign Council.
Your role is designing robust, scalable technical architectures and system designs.
Think in terms of components, interfaces, data flow, and integration patterns.
Always consider performance, security, and maintainability.""",
        "temperature": 0.6
    },
    "engineer": {
        "name": "Engineer",
        "role": "Implementation and coding",
        "system_prompt": """You are the Engineer agent of the Sovereign Council.
Your role is implementing solutions with clean, efficient, production-ready code.
Focus on best practices, error handling, testing, and documentation.
Provide working code examples and implementation details.""",
        "temperature": 0.5
    },
    "analyst": {
        "name": "Analyst",
        "role": "Data analysis and insights",
        "system_prompt": """You are the Analyst agent of the Sovereign Council.
Your role is analyzing data, identifying patterns, and extracting actionable insights.
Use statistical reasoning, data visualization concepts, and analytical frameworks.
Always quantify findings and support conclusions with evidence.""",
        "temperature": 0.4
    },
    "researcher": {
        "name": "Researcher",
        "role": "Knowledge retrieval and research",
        "system_prompt": """You are the Researcher agent of the Sovereign Council.
Your role is comprehensive research, fact-finding, and knowledge synthesis.
Provide well-researched, accurate information with proper context.
Cite sources when applicable and acknowledge knowledge limitations.""",
        "temperature": 0.3
    },
    "validator": {
        "name": "Validator",
        "role": "Quality assurance and validation",
        "system_prompt": """You are the Validator agent of the Sovereign Council.
Your role is ensuring quality, catching errors, and validating correctness.
Think critically, identify edge cases, and suggest improvements.
Focus on security, reliability, and adherence to requirements.""",
        "temperature": 0.2
    },
    "synthesizer": {
        "name": "Synthesizer",
        "role": "Integration and synthesis",
        "system_prompt": """You are the Synthesizer agent of the Sovereign Council.
Your role is integrating insights from all agents into coherent, actionable output.
Resolve conflicts, identify common themes, and create unified recommendations.
Provide clear, concise final synthesis that incorporates all perspectives.""",
        "temperature": 0.7
    }
}

# NVIDIA API Client
class NVIDIAClient:
    """Real NVIDIA API client with OpenAI-compatible interface"""

    def __init__(self):
        self.api_key = NVIDIA_API_KEY
        self.base_url = NVIDIA_API_BASE
        self.model = NVIDIA_MODEL
        self.client = httpx.AsyncClient(timeout=60.0)

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1024,
        stream: bool = False
    ) -> Dict[str, Any]:
        """Real NVIDIA API call using llama-3.3-70b"""

        if not self.api_key:
            # Demo mode - return simulated response
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": f"[DEMO MODE] Simulated response to: {messages[-1]['content'][:50]}..."
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": 50,
                    "completion_tokens": 100,
                    "total_tokens": 150
                },
                "model": self.model
            }

        # Real NVIDIA API call
        try:
            url = f"{self.base_url}/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": stream
            }

            response = await self.client.post(url, headers=headers, json=payload)
            response.raise_for_status()

            return response.json()

        except httpx.HTTPStatusError as e:
            print(f"NVIDIA API error: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=502, detail=f"NVIDIA API error: {e}")
        except Exception as e:
            print(f"Error calling NVIDIA API: {e}")
            raise HTTPException(status_code=500, detail=f"API call failed: {e}")

nvidia_client = NVIDIAClient()

# Council Session Manager
class CouncilSession:
    """Manages conversation sessions with context"""

    def __init__(self):
        self.sessions = {}

    def get_session(self, session_id: str) -> List[Dict[str, str]]:
        """Get session history"""
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        return self.sessions[session_id]

    def add_message(self, session_id: str, role: str, content: str):
        """Add message to session"""
        session = self.get_session(session_id)
        session.append({"role": role, "content": content})

        # Keep last 20 messages
        if len(session) > 20:
            self.sessions[session_id] = session[-20:]

session_manager = CouncilSession()

# System Stats
system_stats = {
    "total_requests": 0,
    "total_tokens": 0,
    "agent_usage": {agent: 0 for agent in COUNCIL_AGENTS.keys()},
    "start_time": time.time()
}

# Health Check
@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "sovereign-council-real",
        "nvidia_api": "connected" if NVIDIA_API_KEY else "demo-mode",
        "model": NVIDIA_MODEL,
        "agents": len(COUNCIL_AGENTS)
    }

# Status
@app.get("/api/status")
async def status():
    """Detailed status"""
    uptime = time.time() - system_stats["start_time"]

    return {
        "council": {
            "mode": "real" if NVIDIA_API_KEY else "demo",
            "model": NVIDIA_MODEL,
            "agents": list(COUNCIL_AGENTS.keys()),
            "total_requests": system_stats["total_requests"],
            "total_tokens": system_stats["total_tokens"],
            "agent_usage": system_stats["agent_usage"],
            "uptime_seconds": uptime
        },
        "reactor": {
            "status": "online",
            "temperature": 0.7,
            "pulse": "73ms"
        }
    }

# Chat Endpoint
@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Real AI chat using NVIDIA API"""

    start_time = time.time()

    # Validate agent
    if request.agent not in COUNCIL_AGENTS:
        raise HTTPException(status_code=400, detail=f"Invalid agent. Choose from: {list(COUNCIL_AGENTS.keys())}")

    agent_config = COUNCIL_AGENTS[request.agent]

    # Build messages
    messages = [
        {"role": "system", "content": agent_config["system_prompt"]},
        {"role": "user", "content": request.message}
    ]

    # Call NVIDIA API
    try:
        result = await nvidia_client.chat_completion(
            messages=messages,
            temperature=request.temperature or agent_config["temperature"],
            max_tokens=request.max_tokens,
            stream=request.stream
        )

        # Extract response
        response_content = result["choices"][0]["message"]["content"]
        tokens_used = result.get("usage", {}).get("total_tokens", 0)

        # Update stats
        system_stats["total_requests"] += 1
        system_stats["total_tokens"] += tokens_used
        system_stats["agent_usage"][request.agent] += 1

        processing_time = time.time() - start_time

        return ChatResponse(
            response=response_content,
            agent=request.agent,
            model=NVIDIA_MODEL,
            tokens=tokens_used,
            processing_time=processing_time
        )

    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Council Deliberation (multi-agent)
class DeliberationRequest(BaseModel):
    topic: str
    agents: Optional[List[str]] = None  # None = all agents
    max_rounds: Optional[int] = 1

@app.post("/api/council/deliberate")
async def deliberate(request: DeliberationRequest):
    """Multi-agent council deliberation"""

    start_time = time.time()
    agents_to_use = request.agents or list(COUNCIL_AGENTS.keys())

    # Validate agents
    for agent in agents_to_use:
        if agent not in COUNCIL_AGENTS:
            raise HTTPException(status_code=400, detail=f"Invalid agent: {agent}")

    # Collect responses from all agents
    responses = {}

    for agent in agents_to_use:
        agent_config = COUNCIL_AGENTS[agent]

        messages = [
            {"role": "system", "content": agent_config["system_prompt"]},
            {"role": "user", "content": f"Deliberate on this topic: {request.topic}"}
        ]

        try:
            result = await nvidia_client.chat_completion(
                messages=messages,
                temperature=agent_config["temperature"],
                max_tokens=512
            )

            responses[agent] = {
                "response": result["choices"][0]["message"]["content"],
                "role": agent_config["role"]
            }

            system_stats["agent_usage"][agent] += 1

        except Exception as e:
            print(f"Error from {agent}: {e}")
            responses[agent] = {
                "response": f"Error: {str(e)}",
                "role": agent_config["role"]
            }

    # Synthesize with Synthesizer agent
    if "synthesizer" in agents_to_use and len(responses) > 1:
        synthesis_prompt = f"""The council has deliberated on: {request.topic}

Here are the perspectives from each agent:

"""
        for agent, data in responses.items():
            if agent != "synthesizer":
                synthesis_prompt += f"{agent.upper()} ({data['role']}):\n{data['response']}\n\n"

        synthesis_prompt += "\nProvide a unified synthesis that integrates all perspectives."

        messages = [
            {"role": "system", "content": COUNCIL_AGENTS["synthesizer"]["system_prompt"]},
            {"role": "user", "content": synthesis_prompt}
        ]

        try:
            result = await nvidia_client.chat_completion(
                messages=messages,
                temperature=0.7,
                max_tokens=1024
            )

            synthesis = result["choices"][0]["message"]["content"]
        except Exception as e:
            synthesis = f"Synthesis error: {e}"
    else:
        synthesis = None

    processing_time = time.time() - start_time
    system_stats["total_requests"] += 1

    return {
        "topic": request.topic,
        "agents_consulted": agents_to_use,
        "responses": responses,
        "synthesis": synthesis,
        "processing_time": processing_time
    }

# List Agents
@app.get("/api/agents")
async def list_agents():
    """List all available agents"""
    return {
        "agents": [
            {
                "id": agent_id,
                "name": config["name"],
                "role": config["role"],
                "temperature": config["temperature"]
            }
            for agent_id, config in COUNCIL_AGENTS.items()
        ]
    }

# WebSocket for streaming
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for streaming responses"""
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "chat":
                agent = data.get("agent", "strategist")
                message = data.get("message", "")

                if agent not in COUNCIL_AGENTS:
                    await websocket.send_json({"error": "Invalid agent"})
                    continue

                agent_config = COUNCIL_AGENTS[agent]
                messages = [
                    {"role": "system", "content": agent_config["system_prompt"]},
                    {"role": "user", "content": message}
                ]

                # For now, send non-streaming response
                # TODO: Implement true streaming with NVIDIA API
                result = await nvidia_client.chat_completion(
                    messages=messages,
                    temperature=agent_config["temperature"]
                )

                await websocket.send_json({
                    "type": "response",
                    "agent": agent,
                    "content": result["choices"][0]["message"]["content"],
                    "done": True
                })

    except WebSocketDisconnect:
        print("WebSocket disconnected")

# Startup
@app.on_event("startup")
async def startup():
    """Startup message"""
    mode = "REAL AI MODE" if NVIDIA_API_KEY else "DEMO MODE"
    print(f"""
╔═══════════════════════════════════════════════════════════════╗
║     SOVEREIGN COUNCIL - {mode:^30}     ║
╠═══════════════════════════════════════════════════════════════╣
║  Model:     {NVIDIA_MODEL:<50} ║
║  Agents:    7 specialized agents                             ║
║  API:       NVIDIA NIM (OpenAI-compatible)                   ║
╠═══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                   ║
║    POST /api/chat               - Single agent chat          ║
║    POST /api/council/deliberate - Multi-agent deliberation   ║
║    GET  /api/agents             - List all agents            ║
║    GET  /api/status             - System status              ║
║    WS   /ws                     - WebSocket streaming        ║
╚═══════════════════════════════════════════════════════════════╝
    """)

    if not NVIDIA_API_KEY:
        print("⚠️  Running in DEMO MODE - Set NVIDIA_API_KEY for real AI")
        print("   Get your key from: https://build.nvidia.com/")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
