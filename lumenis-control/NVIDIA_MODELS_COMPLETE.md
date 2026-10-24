# 🚀 Complete NVIDIA AI Models Suite

## Overview

Your Lumenis Control system now includes **6 NVIDIA AI models** with both Python and Node.js implementations, providing unparalleled flexibility for any AI task.

## 🧠 Available Models

### 1. Nemotron-Mini-4B-Instruct (Fast)
**Best for**: Quick responses, simple tasks, chatbots

| Spec | Value |
|------|-------|
| **Model ID** | `nvidia/nemotron-mini-4b-instruct` |
| **Parameters** | 4B |
| **Max Tokens** | 1,024 |
| **Temperature** | 0.2 (focused) |
| **Thinking** | No |
| **Speed** | ~500ms |
| **API Key** | `NVIDIA_API_KEY` |

**Use Cases**:
- ✅ Chat responses
- ✅ Quick Q&A
- ✅ Simple classification
- ✅ Short summaries

---

### 2. Gemma-4-31B-IT (Reasoning)
**Best for**: Complex reasoning, code generation, analysis

| Spec | Value |
|------|-------|
| **Model ID** | `google/gemma-4-31b-it` |
| **Parameters** | 31B |
| **Max Tokens** | 16,384 |
| **Temperature** | 1.0 (creative) |
| **Thinking** | Yes (enabled) |
| **Speed** | ~1200ms |
| **API Key** | `NVIDIA_API_KEY_SECONDARY` |

**Use Cases**:
- ✅ Deep analysis
- ✅ Code generation
- ✅ Architecture design
- ✅ Complex problem-solving

---

### 3. Nemotron-3-Super-120B-A12B (Ultra)
**Best for**: Maximum reasoning, research, theoretical work

| Spec | Value |
|------|-------|
| **Model ID** | `nvidia/nemotron-3-super-120b-a12b` |
| **Parameters** | 120B |
| **Max Tokens** | 16,384 |
| **Temperature** | 1.0 |
| **Thinking** | Yes + Reasoning Budget (16K) |
| **Speed** | ~3000ms |
| **API Key** | `NVIDIA_API_KEY_NEMOTRON_SUPER` |

**Use Cases**:
- ✅ Scientific research
- ✅ Theoretical analysis
- ✅ Mathematical proofs
- ✅ Ultra-complex reasoning

---

### 4. MiniMax-M2.7 (Balanced)
**Best for**: Balanced performance, multimodal tasks

| Spec | Value |
|------|-------|
| **Model ID** | `minimaxai/minimax-m2.7` |
| **Parameters** | Undisclosed |
| **Max Tokens** | 8,192 |
| **Temperature** | 1.0 |
| **Thinking** | No |
| **Speed** | ~1000ms |
| **API Key** | `NVIDIA_API_KEY_MINIMAX` |

**Use Cases**:
- ✅ Multimodal tasks
- ✅ Balanced inference
- ✅ General purpose
- ✅ Content generation

---

### 5. Step-3.5-Flash (Flash Reasoning)
**Best for**: Fast inference with reasoning capabilities

| Spec | Value |
|------|-------|
| **Model ID** | `stepfun-ai/step-3.5-flash` |
| **Parameters** | Undisclosed |
| **Max Tokens** | 16,384 |
| **Temperature** | 1.0 |
| **Thinking** | Yes |
| **Speed** | ~800ms |
| **API Key** | `NVIDIA_API_KEY_STEPFUN` |

**Use Cases**:
- ✅ Fast complex reasoning
- ✅ Real-time analysis
- ✅ Streaming with thinking
- ✅ Interactive applications

---

### 6. UnifiedReactor (Auto-Routing)
**Best for**: Automatic model selection based on task

| Spec | Value |
|------|-------|
| **Models** | All above models |
| **Routing** | Intelligent task analysis |
| **Fallback** | Nemotron-Mini (default) |
| **Tracking** | Full routing statistics |

**Routing Logic**:
- **Ultra-Complex** → Nemotron-Super-120B
- **Complex** → Gemma-4-31B
- **Simple** → Nemotron-Mini-4B

---

## 🔑 API Keys Configuration

Your `.env` files are configured with all API keys:

```bash
# Primary (Nemotron Mini, Gemma)
NVIDIA_API_KEY=nvapi-your_nvidia_api_key_here

# Secondary (Gemma)
NVIDIA_API_KEY_SECONDARY=nvapi-your_secondary_nvidia_key_here

# Nemotron Super (120B)
NVIDIA_API_KEY_NEMOTRON_SUPER=nvapi-your_nemotron_super_key_here

# MiniMax
NVIDIA_API_KEY_MINIMAX=nvapi-your_minimax_key_here

# StepFun
NVIDIA_API_KEY_STEPFUN=nvapi-your_stepfun_key_here
```

---

## 🐍 Python Usage

### Quick Start

```python
from core import (
    NemotronReactor,          # Fast
    GemmaReactor,             # Reasoning
    NemotronSuperReactor,     # Ultra
    MinimaxReactor,           # Balanced
    StepFunReactor,           # Flash
    UnifiedNvidiaReactor      # Auto
)

# Fast response
nemotron = NemotronReactor()
async for chunk in nemotron.stream_response(
    messages=[{"role": "user", "content": "Hello!"}]
):
    print(chunk, end="")

# Ultra reasoning
nemotron_super = NemotronSuperReactor()
async for chunk in nemotron_super.stream_response(
    messages=[{"role": "user", "content": "Prove Fermat's Last Theorem"}],
    system="You are a mathematician"
):
    print(chunk, end="")

# Auto-routing (recommended)
unified = UnifiedNvidiaReactor()
async for chunk in unified.stream_response(
    messages=[{"role": "user", "content": user_input}],
    model="auto"  # or "nemotron", "gemma", etc.
):
    print(chunk, end="")
```

### Thinking/Reasoning Output

Models with thinking enabled will output reasoning before the answer:

```python
from core import StepFunReactor

reactor = StepFunReactor()
async for chunk in reactor.stream_response(
    messages=[{"role": "user", "content": "Explain quantum entanglement"}]
):
    # Outputs both reasoning and content
    print(chunk, end="")
```

---

## 🟢 Node.js Usage

### Quick Start

```javascript
const { NvidiaClient, UnifiedNvidiaClient } = require('./backend/nvidia-client');

// Fast response
const nemotron = new NvidiaClient('nemotron_mini');
const response = await nemotron.call([
    { role: 'user', content: 'Hello!' }
]);
console.log(response);

// Ultra reasoning
const nemotronSuper = new NvidiaClient('nemotron_super');
for await (const chunk of nemotronSuper.streamResponse(
    [{ role: 'user', content: 'Design a quantum computer' }],
    { system: 'You are a quantum physicist' }
)) {
    if (chunk.type === 'reasoning') {
        console.log('[Thinking]:', chunk.content);
    } else if (chunk.type === 'content') {
        process.stdout.write(chunk.content);
    }
}

// Auto-routing (recommended)
const unified = new UnifiedNvidiaClient();
for await (const chunk of unified.streamResponse(
    [{ role: 'user', content: 'Explain machine learning' }],
    { model: 'auto' }
)) {
    if (chunk.type === 'content') {
        process.stdout.write(chunk.content);
    }
}

// Check status
console.log(unified.getStatus());
```

### Available Models

```javascript
const models = [
    'nemotron_mini',    // Fast
    'gemma',            // Reasoning
    'nemotron_super',   // Ultra (120B)
    'minimax',          // Balanced
    'stepfun'           // Flash
];

// Use any model
const client = new NvidiaClient('nemotron_super');
```

---

## 📊 Performance Comparison

| Model | Parameters | Speed | Max Tokens | Thinking | Best For |
|-------|-----------|-------|------------|----------|----------|
| Nemotron Mini | 4B | ~500ms | 1K | No | Fast responses |
| Gemma | 31B | ~1200ms | 16K | Yes | Complex reasoning |
| Nemotron Super | 120B | ~3000ms | 16K | Yes + Budget | Ultra reasoning |
| MiniMax | - | ~1000ms | 8K | No | Balanced tasks |
| StepFun | - | ~800ms | 16K | Yes | Flash reasoning |

---

## 🎯 Model Selection Guide

### Use Nemotron Mini When:
- ✅ Response time < 1 second required
- ✅ Simple Q&A or chat
- ✅ Cost optimization priority
- ✅ High request volume

### Use Gemma When:
- ✅ Code generation needed
- ✅ Complex analysis required
- ✅ Architecture design
- ✅ Deep explanations

### Use Nemotron Super When:
- ✅ Maximum reasoning required
- ✅ Scientific/research work
- ✅ Theoretical analysis
- ✅ Mathematical proofs

### Use MiniMax When:
- ✅ Multimodal tasks
- ✅ Balanced performance needed
- ✅ General purpose inference
- ✅ Content generation

### Use StepFun When:
- ✅ Fast reasoning needed
- ✅ Real-time applications
- ✅ Interactive experiences
- ✅ Streaming with thinking

### Use UnifiedReactor When:
- ✅ Unsure which model to use
- ✅ Want automatic optimization
- ✅ Mixed workload types
- ✅ Cost/performance balance

---

## 🔄 API Endpoints

### Python Backend (Port 3002)

```bash
# Get all reactor statuses
curl http://localhost:3002/api/status | jq '.nvidia_reactors'

# Response includes:
{
  "nemotron_mini": { ... },
  "gemma": { ... },
  "nemotron_super": { ... },
  "minimax": { ... },
  "stepfun": { ... },
  "unified": {
    "routing": {
      "total_requests": 100,
      "counts": { ... }
    }
  }
}
```

---

## 💡 Advanced Usage

### Python: Manual Model Selection

```python
from core import UnifiedNvidiaReactor

reactor = UnifiedNvidiaReactor()

# Force specific model
await reactor.stream_response(
    messages=messages,
    model="nemotron_super"  # Force ultra model
)
```

### Node.js: Routing Statistics

```javascript
const unified = new UnifiedNvidiaClient();

// After some requests
const status = unified.getStatus();
console.log('Routing stats:', status.routing);
// Output: { totalRequests: 50, counts: { nemotron_mini: 35, gemma: 15 } }
```

### Mixing Models

```python
# Use different models for different tasks
fast = NemotronReactor()
ultra = NemotronSuperReactor()

# Quick greeting
greeting = await fast.call([{"role": "user", "content": "Hi!"}])

# Complex analysis
analysis = await ultra.call([
    {"role": "user", "content": "Analyze quantum field theory"}
])
```

---

## 🛠️ Integration Examples

### Discord Bot with Auto-Routing

```javascript
const { UnifiedNvidiaClient } = require('./backend/nvidia-client');
const unified = new UnifiedNvidiaClient();

client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!ask')) {
        const question = message.content.slice(5);

        let response = '';
        for await (const chunk of unified.streamResponse(
            [{ role: 'user', content: question }],
            { model: 'auto' }
        )) {
            if (chunk.type === 'content') {
                response += chunk.content;
            }
        }

        message.reply(response);
    }
});
```

### Webhook with Model Selection

```javascript
app.post('/api/ai/chat', async (req, res) => {
    const { message, model = 'auto' } = req.body;

    const client = new NvidiaClient(model);
    const response = await client.call([
        { role: 'user', content: message }
    ]);

    res.json({ response, model: client.modelName });
});
```

---

## 📈 Cost Optimization Tips

1. **Use UnifiedReactor** - Automatically uses cheaper models when possible
2. **Cache responses** - Store results for common queries
3. **Batch requests** - Group similar tasks together
4. **Set appropriate max_tokens** - Don't request more than needed
5. **Monitor routing stats** - Optimize based on actual usage

---

## 🔧 Troubleshooting

### Model Not Responding

```bash
# Check API key
echo $NVIDIA_API_KEY_NEMOTRON_SUPER

# Test directly
curl https://integrate.api.nvidia.com/v1/models \
  -H "Authorization: Bearer $NVIDIA_API_KEY_NEMOTRON_SUPER"
```

### Rate Limiting

Distribute requests across multiple API keys:

```python
# Use different keys for different models
nemotron_mini = NemotronReactor()  # Uses NVIDIA_API_KEY
nemotron_super = NemotronSuperReactor()  # Uses NVIDIA_API_KEY_NEMOTRON_SUPER
```

### Slow Responses

Use faster models for non-critical tasks:

```python
unified = UnifiedNvidiaReactor()
# Will auto-route to Nemotron Mini for simple tasks
```

---

## 📚 Complete API Reference

### Python

```python
# All reactor classes follow this pattern:
class ModelReactor:
    async def stream_response(
        messages: list[dict],
        system: str = "",
        max_tokens: int = ...,
        temperature: float = ...
    ) -> AsyncIterator[str]

    async def call(
        messages: list[dict],
        system: str = "",
        max_tokens: int = ...
    ) -> str

    def get_status() -> dict
```

### Node.js

```javascript
class NvidiaClient {
    async *streamResponse(messages, options)
    async call(messages, options)
    getStatus()
}

class UnifiedNvidiaClient {
    async *streamResponse(messages, options)
    async call(messages, options)
    getStatus()
    determineModel(messages, system)
}
```

---

## 🎉 You're All Set!

Your Lumenis Control system now has:
- ✅ **6 NVIDIA AI models** ready to use
- ✅ **Python + Node.js** implementations
- ✅ **Auto-routing** intelligence
- ✅ **All API keys** configured
- ✅ **Thinking mode** for supported models
- ✅ **Full documentation**

**Start using:**
```bash
./start-all.sh
```

Then access:
- Frontend: http://localhost:3000
- Python API: http://localhost:3002
- Model status: http://localhost:3002/api/status

🚀 Ready to build amazing AI applications!
