import os
from openai import OpenAI
from dotenv import load_dotenv

# Initialize environment
load_dotenv()

class Qwen3Coder:
    def __init__(self):
        self.api_key = os.getenv("NVIDIA_API_KEY")
        if not self.api_key:
            raise ValueError("❌ NVIDIA_API_KEY missing from environment.")

        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=self.api_key
        )
        self.model_name = "qwen/qwen3-coder-480b-a35b-instruct"

    def stream_completion(self, prompt: str, system_prompt: str = "You are Qwen3-Coder, the lead syntax architect for the Lumenis system."):
        print(f"🌌 Routing to {self.model_name}...")

        completion = self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            top_p=0.8,
            max_tokens=4096,
            stream=True
        )

        for chunk in completion:
            if chunk.choices and chunk.choices[0].delta.content is not None:
                print(chunk.choices[0].delta.content, end="", flush=True)

# Quick local test execution
if __name__ == "__main__":
    coder = Qwen3Coder()
    coder.stream_completion("Initialize a 3D tensor representing a VanguardNode matrix.")
