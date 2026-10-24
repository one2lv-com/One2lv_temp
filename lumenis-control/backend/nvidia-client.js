/**
 * NVIDIA AI Client for Node.js Backend
 *
 * Provides direct access to NVIDIA AI models via OpenAI SDK.
 * Supports all NVIDIA models with streaming and thinking capabilities.
 */

const OpenAI = require('openai');
require('dotenv').config();

// ═══════════════════════════════════════════════════════
// Model Configurations
// ═══════════════════════════════════════════════════════

const MODELS = {
    nemotron_mini: {
        id: 'nvidia/nemotron-mini-4b-instruct',
        maxTokens: 1024,
        temperature: 0.2,
        topP: 0.7,
        thinking: false,
        useCase: 'fast inference, simple tasks'
    },
    gemma: {
        id: 'google/gemma-4-31b-it',
        maxTokens: 16384,
        temperature: 1.0,
        topP: 0.95,
        thinking: true,
        useCase: 'reasoning, complex tasks'
    },
    nemotron_super: {
        id: 'nvidia/nemotron-3-super-120b-a12b',
        maxTokens: 16384,
        temperature: 1.0,
        topP: 0.95,
        thinking: true,
        reasoningBudget: 16384,
        useCase: 'ultra-large reasoning, 120B parameters'
    },
    minimax: {
        id: 'minimaxai/minimax-m2.7',
        maxTokens: 8192,
        temperature: 1.0,
        topP: 0.95,
        thinking: false,
        useCase: 'balanced performance, multimodal'
    },
    stepfun: {
        id: 'stepfun-ai/step-3.5-flash',
        maxTokens: 16384,
        temperature: 1.0,
        topP: 0.9,
        thinking: true,
        useCase: 'flash inference with reasoning'
    },
    kimi: {
        id: 'moonshotai/kimi-k2.6',
        maxTokens: 16384,
        temperature: 1.0,
        topP: 1.0,
        thinking: true,
        useCase: 'Moonshot AI Kimi K2.6, advanced reasoning'
    }
};

// ═══════════════════════════════════════════════════════
// NVIDIA Client Class
// ═══════════════════════════════════════════════════════

class NvidiaClient {
    constructor(model = 'nemotron_mini', apiKey = null) {
        this.model = MODELS[model] || MODELS.nemotron_mini;
        this.modelName = model;
        this.apiKey = apiKey || this.getApiKey(model);

        this.client = new OpenAI({
            apiKey: this.apiKey,
            baseURL: 'https://integrate.api.nvidia.com/v1'
        });

        this.callCount = 0;
        this.errorCount = 0;
    }

    /**
     * Get appropriate API key for model
     */
    getApiKey(model) {
        const keyMap = {
            nemotron_mini: process.env.NVIDIA_API_KEY,
            gemma: process.env.NVIDIA_API_KEY_SECONDARY || process.env.NVIDIA_API_KEY,
            nemotron_super: process.env.NVIDIA_API_KEY_NEMOTRON_SUPER || process.env.NVIDIA_API_KEY,
            minimax: process.env.NVIDIA_API_KEY_MINIMAX || process.env.NVIDIA_API_KEY,
            stepfun: process.env.NVIDIA_API_KEY_STEPFUN || process.env.NVIDIA_API_KEY,
            kimi: process.env.NVIDIA_API_KEY_KIMI || process.env.NVIDIA_API_KEY
        };

        return keyMap[model] || process.env.NVIDIA_API_KEY;
    }

    /**
     * Stream response from NVIDIA model
     */
    async *streamResponse(messages, options = {}) {
        const {
            system = '',
            maxTokens = this.model.maxTokens,
            temperature = this.model.temperature,
            topP = this.model.topP
        } = options;

        const fullMessages = [];
        if (system) {
            fullMessages.push({ role: 'system', content: system });
        }
        fullMessages.push(...messages);

        const requestOptions = {
            model: this.model.id,
            messages: fullMessages,
            temperature,
            top_p: topP,
            max_tokens: maxTokens,
            stream: true
        };

        // Add thinking/reasoning for supported models
        if (this.model.thinking) {
            requestOptions.chat_template_kwargs = { enable_thinking: true };
        }

        if (this.model.reasoningBudget) {
            requestOptions.reasoning_budget = this.model.reasoningBudget;
        }

        try {
            const completion = await this.client.chat.completions.create(requestOptions);

            for await (const chunk of completion) {
                // Yield reasoning content if available
                const reasoning = chunk.choices[0]?.delta?.reasoning_content;
                if (reasoning) {
                    this.callCount++;
                    yield { type: 'reasoning', content: reasoning };
                }

                // Yield regular content
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    this.callCount++;
                    yield { type: 'content', content };
                }
            }
        } catch (error) {
            this.errorCount++;
            yield { type: 'error', content: `[NvidiaClient error: ${error.message}]` };
        }
    }

    /**
     * Non-streaming call
     */
    async call(messages, options = {}) {
        const parts = [];
        for await (const chunk of this.streamResponse(messages, options)) {
            if (chunk.type !== 'error') {
                parts.push(chunk.content);
            }
        }
        return parts.join('');
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            model: this.model.id,
            modelName: this.modelName,
            tokensStreamed: this.callCount,
            errors: this.errorCount,
            online: !!this.apiKey,
            useCase: this.model.useCase,
            thinking: this.model.thinking,
            maxTokens: this.model.maxTokens
        };
    }
}

// ═══════════════════════════════════════════════════════
// Unified NVIDIA Client (Auto-routing)
// ═══════════════════════════════════════════════════════

class UnifiedNvidiaClient {
    constructor() {
        this.clients = {
            nemotron_mini: new NvidiaClient('nemotron_mini'),
            gemma: new NvidiaClient('gemma'),
            nemotron_super: new NvidiaClient('nemotron_super'),
            minimax: new NvidiaClient('minimax'),
            stepfun: new NvidiaClient('stepfun'),
            kimi: new NvidiaClient('kimi')
        };

        this.routeCount = {
            nemotron_mini: 0,
            gemma: 0,
            nemotron_super: 0,
            minimax: 0,
            stepfun: 0,
            kimi: 0
        };
    }

    /**
     * Determine best model based on task complexity
     */
    determineModel(messages, system = '') {
        const combinedText = (system + ' ' + messages.map(m => m.content).join(' ')).toLowerCase();

        // Check for ultra-complex tasks (nemotron_super)
        const ultraKeywords = ['quantum', 'theoretical', 'mathematical proof', 'research', 'scientific'];
        if (ultraKeywords.some(k => combinedText.includes(k))) {
            return 'nemotron_super';
        }

        // Check for complex reasoning (gemma or stepfun)
        const complexKeywords = [
            'analyze', 'reason', 'explain', 'complex',
            'design', 'architecture', 'implement', 'algorithm'
        ];
        if (complexKeywords.some(k => combinedText.includes(k)) || system.length > 500) {
            return 'gemma';
        }

        // Default to fast model
        return 'nemotron_mini';
    }

    /**
     * Stream with auto-routing
     */
    async *streamResponse(messages, options = {}) {
        const { model = 'auto', ...otherOptions } = options;

        const selectedModel = model === 'auto'
            ? this.determineModel(messages, options.system || '')
            : model;

        this.routeCount[selectedModel]++;

        const client = this.clients[selectedModel];
        if (!client) {
            yield { type: 'error', content: `[Unknown model: ${selectedModel}]` };
            return;
        }

        for await (const chunk of client.streamResponse(messages, otherOptions)) {
            yield chunk;
        }
    }

    /**
     * Non-streaming call with auto-routing
     */
    async call(messages, options = {}) {
        const parts = [];
        for await (const chunk of this.streamResponse(messages, options)) {
            if (chunk.type !== 'error') {
                parts.push(chunk.content);
            }
        }
        return parts.join('');
    }

    /**
     * Get all statuses
     */
    getStatus() {
        return {
            models: Object.fromEntries(
                Object.entries(this.clients).map(([name, client]) => [name, client.getStatus()])
            ),
            routing: {
                totalRequests: Object.values(this.routeCount).reduce((a, b) => a + b, 0),
                counts: this.routeCount
            }
        };
    }
}

// ═══════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════

module.exports = {
    NvidiaClient,
    UnifiedNvidiaClient,
    MODELS
};

// ═══════════════════════════════════════════════════════
// Example Usage (commented out)
// ═══════════════════════════════════════════════════════

/*
// Quick response with Nemotron Mini
const nemotron = new NvidiaClient('nemotron_mini');
const quickResponse = await nemotron.call([
    { role: 'user', content: 'Hello!' }
]);
console.log(quickResponse);

// Complex reasoning with Gemma
const gemma = new NvidiaClient('gemma');
for await (const chunk of gemma.streamResponse(
    [{ role: 'user', content: 'Explain quantum computing' }],
    { system: 'You are an expert physicist' }
)) {
    if (chunk.type === 'reasoning') {
        console.log('[Thinking]:', chunk.content);
    } else if (chunk.type === 'content') {
        process.stdout.write(chunk.content);
    }
}

// Auto-routing
const unified = new UnifiedNvidiaClient();
for await (const chunk of unified.streamResponse(
    [{ role: 'user', content: 'Design a microservices architecture' }],
    { model: 'auto' }
)) {
    if (chunk.type === 'content') {
        process.stdout.write(chunk.content);
    }
}

// Check status
console.log(unified.getStatus());
*/
