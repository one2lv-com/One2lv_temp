"""
FastAPI Integration for MiniMax in One2lvos
Exposes MiniMax capabilities via REST API
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from contextlib import asynccontextmanager
from minimax_client import MiniMaxClient

# Initialize MiniMax client
minimax = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global minimax
    minimax = MiniMaxClient()
    print("🤖 MiniMax AI Engine Online")
    yield
    print("🤖 MiniMax AI Engine Shutdown")

app = FastAPI(title="One2lvos MiniMax API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Request Models
class ChatRequest(BaseModel):
    message: str
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 2048

class ReasoningRequest(BaseModel):
    problem: str
    context: Optional[str] = None

class CreativeRequest(BaseModel):
    prompt: str
    style: Optional[str] = None

class MultiTurnRequest(BaseModel):
    messages: List[Dict[str, str]]
    system_prompt: Optional[str] = None

# Endpoints
@app.get("/health")
async def health():
    return {
        "status": "online",
        "service": "minimax-integration",
        "model": "nvidia/minimax-01"
    }

@app.post("/chat")
async def chat(request: ChatRequest):
    """Simple chat endpoint"""
    result = await minimax.chat(
        request.message,
        system_prompt=request.system_prompt,
        temperature=request.temperature,
        max_tokens=request.max_tokens
    )

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])

    return result

@app.post("/reasoning")
async def reasoning(request: ReasoningRequest):
    """Complex reasoning endpoint"""
    result = await minimax.reasoning_task(
        request.problem,
        context=request.context
    )

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])

    return result

@app.post("/creative")
async def creative(request: CreativeRequest):
    """Creative generation endpoint"""
    result = await minimax.creative_generation(
        request.prompt,
        style=request.style
    )

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])

    return result

@app.post("/conversation")
async def conversation(request: MultiTurnRequest):
    """Multi-turn conversation endpoint"""
    result = await minimax.multi_turn_conversation(
        request.messages,
        system_prompt=request.system_prompt
    )

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])

    return result

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("MINIMAX_PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
