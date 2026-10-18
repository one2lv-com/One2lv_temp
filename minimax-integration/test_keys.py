"""Test different NVIDIA API keys"""
import os
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def _check_key(key_name, key_value):
    client = AsyncOpenAI(
        api_key=key_value,
        base_url="https://integrate.api.nvidia.com/v1"
    )

    try:
        # Try a simple model list
        models = await client.models.list()
        print(f"✅ {key_name}: Valid ({len(models.data)} models accessible)")
        return True
    except Exception as e:
        print(f"❌ {key_name}: {e}")
        return False

async def main():
    print("🔑 Testing NVIDIA API Keys...\n")

    keys = {
        "PRIMARY": os.getenv("NVIDIA_API_KEY"),
        "MINIMAX": os.getenv("NVIDIA_API_KEY_MINIMAX"),
        "SECONDARY": os.getenv("NVIDIA_API_KEY_SECONDARY"),
        "NEMOTRON_SUPER": os.getenv("NVIDIA_API_KEY_NEMOTRON_SUPER"),
        "STEPFUN": os.getenv("NVIDIA_API_KEY_STEPFUN"),
        "KIMI": os.getenv("NVIDIA_API_KEY_KIMI"),
    }

    for name, key in keys.items():
        if key:
            await _check_key(name, key)
        else:
            print(f"⚠️  {name}: Not set")

if __name__ == "__main__":
    asyncio.run(main())
