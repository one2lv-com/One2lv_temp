"""
NVIDIA Reactor Suite
====================
Multiple NVIDIA-powered reactors using different models and approaches.

Available Reactors:
  1. NvidiaReactor - Gemma-4-31B-IT with thinking (httpx/SSE)
  2. NemotronReactor - Nemotron-Mini-4B-Instruct (OpenAI client)
  3. UnifiedNvidiaReactor - Auto-switches between models based on task
"""

import asyncio
import json
import os
from typing import AsyncIterator, Literal

import httpx
from openai import AsyncOpenAI


# ─── NVIDIA API Configuration ─────────────────────────────────────────────────
NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"

# Model configurations
MODELS = {
    "gemma": {
        "id": "google/gemma-4-31b-it",
        "max_tokens": 16384,
        "temperature": 1.0,
        "top_p": 0.95,
        "thinking": True,
        "use_case": "reasoning, complex tasks"
    },
    "nemotron": {
        "id": "nvidia/nemotron-mini-4b-instruct",
        "max_tokens": 1024,
        "temperature": 0.2,
        "top_p": 0.7,
        "thinking": False,
        "use_case": "fast inference, simple tasks"
    },
    "nemotron_super": {
        "id": "nvidia/nemotron-3-super-120b-a12b",
        "max_tokens": 16384,
        "temperature": 1.0,
        "top_p": 0.95,
        "thinking": True,
        "reasoning_budget": 16384,
        "use_case": "ultra-large reasoning, 120B parameters"
    },
    "minimax": {
        "id": "minimaxai/minimax-m2.7",
        "max_tokens": 8192,
        "temperature": 1.0,
        "top_p": 0.95,
        "thinking": False,
        "use_case": "balanced performance, multimodal"
    },
    "stepfun": {
        "id": "stepfun-ai/step-3.5-flash",
        "max_tokens": 16384,
        "temperature": 1.0,
        "top_p": 0.9,
        "thinking": True,
        "use_case": "flash inference with reasoning"
    },
    "kimi": {
        "id": "moonshotai/kimi-k2.6",
        "max_tokens": 16384,
        "temperature": 1.0,
        "top_p": 1.0,
        "thinking": True,
        "use_case": "Moonshot AI Kimi K2.6, advanced reasoning"
    }
}


class NemotronReactor:
    """
    Fast reactor powered by NVIDIA Nemotron-Mini-4B-Instruct.
    Uses OpenAI-compatible client for simple streaming responses.
    Optimized for speed and efficiency.
    """

    def __init__(self):
        self.api_key = os.environ.get("NVIDIA_API_KEY", "")
        self.model = MODELS["nemotron"]["id"]
        self.client = AsyncOpenAI(
            base_url=NVIDIA_BASE_URL,
            api_key=self.api_key
        )
        self._call_count = 0
        self._error_count = 0

    async def stream_response(
        self,
        messages: list[dict],
        system: str = "",
        max_tokens: int = 1024,
        temperature: float = 0.2,
    ) -> AsyncIterator[str]:
        """Stream tokens from NVIDIA Nemotron with OpenAI client."""
        full_messages = []
        if system:
            full_messages.append({"role": "system", "content": system})
        full_messages.extend(messages)

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=full_messages,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=0.7,
                stream=True
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    self._call_count += 1
                    yield chunk.choices[0].delta.content

        except Exception as e:
            self._error_count += 1
            yield f"[NemotronReactor error: {str(e)}]"

    async def call(
        self,
        messages: list[dict],
        system: str = "",
        max_tokens: int = 1024,
    ) -> str:
        """Non-streaming call — collects full streamed response."""
        parts = []
        async for chunk in self.stream_response(messages, system, max_tokens):
            parts.append(chunk)
        return "".join(parts)

    def get_status(self) -> dict:
        return {
            "model": self.model,
            "tokens_streamed": self._call_count,
            "errors": self._error_count,
            "online": bool(self.api_key),
            "use_case": MODELS["nemotron"]["use_case"]
        }


class GemmaReactor:
    """
    Advanced reactor powered by NVIDIA Gemma-4-31B-IT with thinking enabled.
    Uses httpx for SSE streaming with reasoning capabilities.
    Optimized for complex reasoning tasks.
    """

    def __init__(self):
        self.api_key = os.environ.get("NVIDIA_API_KEY_SECONDARY") or os.environ.get("NVIDIA_API_KEY", "")
        self.model = MODELS["gemma"]["id"]
        self._call_count = 0
        self._error_count = 0

    async def stream_response(
        self,
        messages: list[dict],
        system: str = "",
        max_tokens: int = 16384,
        temperature: float = 1.0,
    ) -> AsyncIterator[str]:
        """Stream tokens from NVIDIA Gemma with thinking enabled."""
        full_messages = []
        if system:
            full_messages.append({"role": "system", "content": system})
        full_messages.extend(messages)

        payload = {
            "model": self.model,
            "messages": full_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": 0.95,
            "stream": True,
            "chat_template_kwargs": {"enable_thinking": True}
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        }

        in_thinking = False
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream(
                    "POST", NVIDIA_API_URL, headers=headers, json=payload
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        data = line[6:].strip()
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            delta = chunk["choices"][0]["delta"]

                            # Track thinking vs answer sections
                            if delta.get("reasoning_content"):
                                in_thinking = True
                                continue  # skip raw thinking tokens from output
                            if in_thinking and delta.get("content"):
                                in_thinking = False  # thinking ended, answer begins

                            text = delta.get("content", "")
                            if text:
                                self._call_count += 1
                                yield text
                        except Exception:
                            continue
        except Exception as e:
            self._error_count += 1
            yield f"[GemmaReactor error: {str(e)}]"

    async def call(
        self,
        messages: list[dict],
        system: str = "",
        max_tokens: int = 16384,
    ) -> str:
        """Non-streaming call — collects full streamed response."""
        parts = []
        async for chunk in self.stream_response(messages, system, max_tokens):
            parts.append(chunk)
        return "".join(parts)

    def get_status(self) -> dict:
        return {
            "model": self.model,
            "tokens_streamed": self._call_count,
            "errors": self._error_count,
            "online": bool(self.api_key),
            "use_case": MODELS["gemma"]["use_case"]
        }


class NemotronSuperReactor:
    """
    Ultra-large reactor powered by NVIDIA Nemotron-3-Super-120B-A12B.
    120B parameters with thinking and reasoning budget enabled.
    Optimized for maximum reasoning capability.
    """

    def __init__(self):
        self.api_key = os.environ.get("NVIDIA_API_KEY_NEMOTRON_SUPER") or os.environ.get("NVIDIA_API_KEY", "")
        self.model = MODELS["nemotron_super"]["id"]
        self.client = AsyncOpenAI(
            base_url=NVIDIA_BASE_URL,
            api_key=self.api_key
        )
        self._call_count = 0
        self._error_count = 0

    async def stream_response(
        self,
        messages: list[dict],
        system: str = "",
        max_tokens: int = 16384,
        temperature: float = 1.0,
    ) -> AsyncIterator[str]:
        """Stream tokens from NVIDIA Nemotron Super with thinking and reasoning."""
        full_messages = []
        if system:
            full_messages.append({"role": "system", "content": system})
        full_messages.extend(messages)

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=full_messages,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=0.95,
                extra_body={
                    "chat_template_kwargs": {"enable_thinking": True},
                    "reasoning_budget": 16384
                },
                stream=True
            )

            async for chunk in stream:
                # Output reasoning content if available
                reasoning = getattr(chunk.choices[0].delta, "reasoning_content", None)
                if reasoning:
                    self._call_count += 1
                    yield reasoning

                # Output regular content
                if chunk.choices[0].delta.content is not None:
                    self._call_count += 1
                    yield chunk.choices[0].delta.content

        except Exception as e:
            self._error_count += 1
            yield f"[NemotronSuperReactor error: {str(e)}]"

    async def call(
        self,
        messages: list[dict],
        system: str = "",
        max_tokens: int = 16384,
    ) -> str:
        """Non-streaming call — collects full streamed response."""
        parts = []
        async for chunk in self.stream_response(messages, system, max_tokens):
            parts.append(chunk)
        return "".join(parts)

    def get_status(self) -> dict:
        return {
            "model": self.model,
            "tokens_streamed": self._call_count,
            "errors": self._error_count,
            "online": bool(self.api_key),
            "use_case": MODELS["nemotron_super"]["use_case"]
        }


class MinimaxReactor:
    """
    Balanced reactor powered by MinimaxAI MiniMax-M2.7.
    Multimodal capabilities with efficient performance.
    """

    def __init__(self):
        self.api_key = os.environ.get("NVIDIA_API_KEY_MINIMAX") or os.environ.get("NVIDIA_API_KEY", "")
        self.model = MODELS["minimax"]["id"]
        self.client = AsyncOpenAI(
            base_url=NVIDIA_BASE_URL,
            api_key=self.api_key
        )
        self._call_count = 0
        self._error_count = 0

    async def stream_response(
        self,
        messages: list[dict],
        system: str = "",
        max_tokens: int = 8192,
        temperature: float = 1.0,
    ) -> AsyncIterator[str]:
        """Stream tokens from MiniMax model."""
        full_messages = []
        if system:
            full_messages.append({"role": "system", "content": system})
        full_messages.extend(messages)

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=full_messages,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=0.95,
                stream=True
            )

            async for chunk in stream:
                if not getattr(chunk, "choices", None):
                    continue
                if chunk.choices[0].delta.content is not None:
                    self._call_count += 1
                    yield chunk.choices[0].delta.content

        except Exception as e:
            self._error_count += 1
            yield f"[MinimaxReactor error: {str(e)}]"

    async def call(
        self,
        messages: list[dict],
        system: str = "",
        max_tokens: int = 8192,
    ) -> str:
        """Non-streaming call — collects full streamed response."""
        parts = []
        async for chunk in self.stream_response(messages, system, max_tokens):
            parts.append(chunk)
        return "".join(parts)

    def get_status(self) -> dict:
        return {
            "model": self.model,
            "tokens_streamed": self._call_count,
            "errors": self._error_count,
            "online": bool(self.api_key),
            "use_case": MODELS["minimax"]["use_case"]
        }


class StepFunReactor:
    """
    Flash reactor powered by StepFun AI Step-3.5-Flash.
    Fast inference with thinking capabilities.
    """

    def __init__(self):
        self.api_key = os.environ.get("NVIDIA_API_KEY_STEPFUN") or os.environ.get("NVIDIA_API_KEY", "")
        self.model = MODELS["stepfun"]["id"]
        self.client = AsyncOpenAI(
            base_url=NVIDIA_BASE_URL,
            api_key=self.api_key
        )
        self._call_count = 0
        self._error_count = 0

    async def stream_response(
        self,
        messages: list[dict],
        system: str = "",
        max_tokens: int = 16384,
        temperature: float = 1.0,
    ) -> AsyncIterator[str]:
        """Stream tokens from StepFun with reasoning support."""
        full_messages = []
        if system:
            full_messages.append({"role": "system", "content": system})
        full_messages.extend(messages)

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=full_messages,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=0.9,
                stream=True
            )

            async for chunk in stream:
                if not getattr(chunk, "choices", None):
                    continue

                # Output reasoning content if available
                reasoning = getattr(chunk.choices[0].delta, "reasoning_content", None)
                if reasoning:
                    self._call_count += 1
                    yield reasoning

                # Output regular content
                if chunk.choices[0].delta.content:
                    self._call_count += 1
                    yield chunk.choices[0].delta.content

        except Exception as e:
            self._error_count += 1
            yield f"[StepFunReactor error: {str(e)}]"

    async def call(
        self,
        messages: list[dict],
        system: str = "",
        max_tokens: int = 16384,
    ) -> str:
        """Non-streaming call — collects full streamed response."""
        parts = []
        async for chunk in self.stream_response(messages, system, max_tokens):
            parts.append(chunk)
        return "".join(parts)

    def get_status(self) -> dict:
        return {
            "model": self.model,
            "tokens_streamed": self._call_count,
            "errors": self._error_count,
            "online": bool(self.api_key),
            "use_case": MODELS["stepfun"]["use_case"]
        }


class KimiReactor:
    """
    Advanced reactor powered by Moonshot AI Kimi K2.6.
    Supports thinking mode with chat template kwargs.
    Uses raw HTTP/httpx for SSE streaming (alternative implementation).
    """

    def __init__(self):
        self.api_key = os.environ.get("NVIDIA_API_KEY_KIMI") or os.environ.get("NVIDIA_API_KEY", "")
        self.model = MODELS["kimi"]["id"]
        self._call_count = 0
        self._error_count = 0

    async def stream_response(
        self,
        messages: list[dict],
        system: str = "",
        max_tokens: int = 16384,
        temperature: float = 1.0,
    ) -> AsyncIterator[str]:
        """Stream tokens from Kimi K2.6 using raw HTTP/SSE."""
        full_messages = []
        if system:
            full_messages.append({"role": "system", "content": system})
        full_messages.extend(messages)

        payload = {
            "model": self.model,
            "messages": full_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": 1.0,
            "stream": True,
            "chat_template_kwargs": {"thinking": True}
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream"
        }

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream(
                    "POST", NVIDIA_API_URL, headers=headers, json=payload
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line.strip():
                            continue
                        if line.startswith("data: "):
                            data = line[6:].strip()
                            if data == "[DONE]":
                                break
                            try:
                                chunk = json.loads(data)
                                delta = chunk["choices"][0]["delta"]

                                # Output reasoning if available
                                reasoning = delta.get("reasoning_content")
                                if reasoning:
                                    self._call_count += 1
                                    yield reasoning

                                # Output regular content
                                text = delta.get("content", "")
                                if text:
                                    self._call_count += 1
                                    yield text
                            except Exception:
                                continue

        except Exception as e:
            self._error_count += 1
            yield f"[KimiReactor error: {str(e)}]"

    async def call(
        self,
        messages: list[dict],
        system: str = "",
        max_tokens: int = 16384,
    ) -> str:
        """Non-streaming call — collects full streamed response."""
        parts = []
        async for chunk in self.stream_response(messages, system, max_tokens):
            parts.append(chunk)
        return "".join(parts)

    def get_status(self) -> dict:
        return {
            "model": self.model,
            "tokens_streamed": self._call_count,
            "errors": self._error_count,
            "online": bool(self.api_key),
            "use_case": MODELS["kimi"]["use_case"]
        }


class UnifiedNvidiaReactor:
    """
    Intelligent reactor that switches between NVIDIA models based on task complexity.

    Routing Logic:
    - Simple/Fast tasks → Nemotron-Mini-4B (0.2 temp, fast)
    - Complex/Reasoning → Gemma-4-31B (1.0 temp, thinking enabled)
    """

    def __init__(self):
        self.nemotron = NemotronReactor()
        self.gemma = GemmaReactor()
        self.default_model: Literal["nemotron", "gemma"] = "nemotron"
        self._route_count = {"nemotron": 0, "gemma": 0}

    def _determine_model(self, messages: list[dict], system: str) -> Literal["nemotron", "gemma"]:
        """
        Auto-route to best model based on task complexity.

        Triggers for Gemma (complex):
        - Long system prompt (>500 chars)
        - Keywords: "analyze", "reason", "explain", "complex", "deep"
        - Code generation requests

        Otherwise: Nemotron (fast)
        """
        # Check system prompt length
        if len(system) > 500:
            return "gemma"

        # Check message content for complexity indicators
        combined_text = system + " ".join(
            msg.get("content", "") for msg in messages if isinstance(msg.get("content"), str)
        ).lower()

        complexity_keywords = [
            "analyze", "reason", "reasoning", "explain", "complex",
            "deep", "detailed", "comprehensive", "architecture",
            "design", "implement", "code", "algorithm", "debug"
        ]

        if any(keyword in combined_text for keyword in complexity_keywords):
            return "gemma"

        return "nemotron"

    async def stream_response(
        self,
        messages: list[dict],
        system: str = "",
        max_tokens: int = 4096,
        model: Literal["nemotron", "gemma", "auto"] = "auto"
    ) -> AsyncIterator[str]:
        """
        Stream response with auto-routing or explicit model selection.
        """
        if model == "auto":
            selected_model = self._determine_model(messages, system)
        else:
            selected_model = model

        self._route_count[selected_model] += 1

        if selected_model == "gemma":
            async for chunk in self.gemma.stream_response(messages, system, max_tokens):
                yield chunk
        else:
            async for chunk in self.nemotron.stream_response(messages, system, max_tokens):
                yield chunk

    async def call(
        self,
        messages: list[dict],
        system: str = "",
        max_tokens: int = 4096,
        model: Literal["nemotron", "gemma", "auto"] = "auto"
    ) -> str:
        """Non-streaming call with auto-routing."""
        parts = []
        async for chunk in self.stream_response(messages, system, max_tokens, model):
            parts.append(chunk)
        return "".join(parts)

    def get_status(self) -> dict:
        return {
            "models": {
                "nemotron": self.nemotron.get_status(),
                "gemma": self.gemma.get_status()
            },
            "routing": {
                "total_requests": sum(self._route_count.values()),
                "nemotron_count": self._route_count["nemotron"],
                "gemma_count": self._route_count["gemma"],
                "default": self.default_model
            }
        }


# ─── Convenience Exports ──────────────────────────────────────────────────────
# Backward compatibility with existing NvidiaReactor import
NvidiaReactor = GemmaReactor
