"""
List available NVIDIA NIM models
"""
import os
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def list_models():
    api_key = os.getenv("NVIDIA_API_KEY")
    base_url = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")

    client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    try:
        models = await client.models.list()
        print("📋 Available NVIDIA NIM Models:\n")
        for model in models.data:
            print(f"  - {model.id}")
        print(f"\n✅ Total: {len(models.data)} models")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(list_models())
