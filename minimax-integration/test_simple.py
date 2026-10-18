"""Simple test of NVIDIA chat API"""
import os
import asyncio
import pytest
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

@pytest.mark.asyncio
async def test_chat():
    client = AsyncOpenAI(
        api_key=os.getenv("NVIDIA_API_KEY"),
        base_url="https://integrate.api.nvidia.com/v1"
    )

    models_to_try = [
        "google/gemma-3-4b-it",
        "mistralai/mistral-7b-instruct-v0.3",
        "nvidia/llama-3.1-nemotron-51b-instruct",
        "deepseek-ai/deepseek-v4.1-flash",
    ]

    for model in models_to_try:
        try:
            print(f"\n🧪 Testing: {model}")
            response = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": "Hello!"}],
                max_tokens=50
            )
            print(f"✅ Success: {response.choices[0].message.content[:80]}")
            return model  # Return first working model
        except Exception as e:
            print(f"❌ Failed: {str(e)[:100]}")

    return None

if __name__ == "__main__":
    working_model = asyncio.run(test_chat())
    if working_model:
        print(f"\n🎯 Recommended model: {working_model}")
    else:
        print("\n⚠️  No working models found")
