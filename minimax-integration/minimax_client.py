"""
ONE2LVOS MiniMax AI Integration
Connects to NVIDIA MiniMax API for enhanced AI capabilities
"""
import os
import asyncio
from typing import List, Dict, Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

class MiniMaxClient:
    """MiniMax AI Client for One2lvos Sovereign Architecture"""

    def __init__(self):
        # Try MINIMAX key first, fallback to primary NVIDIA key
        self.api_key = os.getenv("NVIDIA_API_KEY_MINIMAX") or os.getenv("NVIDIA_API_KEY")
        self.base_url = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )
        # Use widely accessible model (configurable)
        self.model = os.getenv("MINIMAX_MODEL", "mistralai/mistral-7b-instruct-v0.3")

    async def chat(self, message: str, system_prompt: Optional[str] = None,
                   temperature: float = 0.7, max_tokens: int = 2048) -> Dict:
        """
        Send chat message to MiniMax AI
        """
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": message})

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )

            return {
                "success": True,
                "response": response.choices[0].message.content,
                "model": self.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def reasoning_task(self, problem: str, context: Optional[str] = None) -> Dict:
        """
        Use MiniMax for complex reasoning tasks
        """
        system = """You are MiniMax, an advanced reasoning AI integrated into One2lvos.
        You excel at logical reasoning, problem-solving, and strategic planning.
        Provide detailed, step-by-step reasoning for complex problems."""

        prompt = f"Problem: {problem}"
        if context:
            prompt = f"Context: {context}\n\n{prompt}"

        return await self.chat(prompt, system_prompt=system, temperature=0.5)

    async def creative_generation(self, prompt: str, style: Optional[str] = None) -> Dict:
        """
        Use MiniMax for creative content generation
        """
        system = """You are MiniMax, a creative AI assistant in One2lvos.
        Generate creative, engaging content while maintaining coherence and quality."""

        if style:
            prompt = f"Style: {style}\n\n{prompt}"

        return await self.chat(prompt, system_prompt=system, temperature=0.9)

    async def multi_turn_conversation(self, messages: List[Dict[str, str]],
                                     system_prompt: Optional[str] = None) -> Dict:
        """
        Handle multi-turn conversations with context
        """
        formatted_messages = []

        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})

        formatted_messages.extend(messages)

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=formatted_messages,
                temperature=0.7,
                max_tokens=2048
            )

            return {
                "success": True,
                "response": response.choices[0].message.content,
                "model": self.model
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


async def main():
    """Test MiniMax integration"""
    client = MiniMaxClient()

    print("🤖 MiniMax AI Integration Test\n")

    # Test 1: Simple chat
    print("Test 1: Simple Chat")
    result = await client.chat("What is your purpose in the One2lvos system?")
    if result["success"]:
        print(f"✅ Response: {result['response']}\n")
    else:
        print(f"❌ Error: {result['error']}\n")

    # Test 2: Reasoning task
    print("Test 2: Reasoning Task")
    result = await client.reasoning_task(
        "Design an efficient algorithm for real-time memory retrieval in a vector database"
    )
    if result["success"]:
        print(f"✅ Response: {result['response'][:200]}...\n")
    else:
        print(f"❌ Error: {result['error']}\n")

    # Test 3: Creative generation
    print("Test 3: Creative Generation")
    result = await client.creative_generation(
        "Create a futuristic interface concept for AR glasses",
        style="cyberpunk"
    )
    if result["success"]:
        print(f"✅ Response: {result['response'][:200]}...\n")
    else:
        print(f"❌ Error: {result['error']}\n")


if __name__ == "__main__":
    asyncio.run(main())
