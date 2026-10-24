(function(window) {
    'use strict';

    const AIChat = {
        API_URL: 'https://integrate.api.nvidia.com/v1/chat/completions',
        API_KEY: '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',
        MODEL: 'nvidia/nemotron-3-ultra-550b-a55b',

        conversationHistory: [],
        thinkingEnabled: true,

        async sendMessage(userMessage, config = {}) {
            const {
                temperature = 1,
                top_p = 0.95,
                max_tokens = 16384,
                reasoning_budget = 16384,
                enable_thinking = true,
                stream = false
            } = config;

            // Add user message to history
            this.conversationHistory.push({
                role: 'user',
                content: userMessage
            });

            const payload = {
                model: this.MODEL,
                messages: this.conversationHistory,
                temperature,
                top_p,
                max_tokens,
                reasoning_budget,
                chat_template_kwargs: { enable_thinking },
                stream
            };

            try {
                Logger.info('AIChat', 'Sending message to Nemotron...');

                const response = await fetch(this.API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.API_KEY}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                if (data.choices && data.choices[0]) {
                    const assistantMessage = data.choices[0].message;

                    // Add assistant response to history
                    this.conversationHistory.push(assistantMessage);

                    Logger.info('AIChat', 'Response received from Nemotron');

                    // Store in memory
                    await ReactorMemory.store('ai_chat_last', {
                        userMessage,
                        response: assistantMessage.content,
                        thinking: assistantMessage.thinking || null,
                        timestamp: Date.now()
                    }, 'short');

                    return {
                        content: assistantMessage.content,
                        thinking: assistantMessage.thinking || null,
                        usage: data.usage || null,
                        model: data.model
                    };
                }

                throw new Error('No response from API');

            } catch (error) {
                Logger.error('AIChat', 'Failed to send message:', error);
                throw error;
            }
        },

        clearHistory() {
            this.conversationHistory = [];
            Logger.info('AIChat', 'Conversation history cleared');
        },

        getHistory() {
            return [...this.conversationHistory];
        },

        setSystemPrompt(prompt) {
            // Add or update system message at start of history
            if (this.conversationHistory.length > 0 && this.conversationHistory[0].role === 'system') {
                this.conversationHistory[0].content = prompt;
            } else {
                this.conversationHistory.unshift({
                    role: 'system',
                    content: prompt
                });
            }
        },

        async exportConversation() {
            const filename = `nemotron-chat-${Date.now()}.json`;
            const data = JSON.stringify({
                model: this.MODEL,
                history: this.conversationHistory,
                exported: new Date().toISOString()
            }, null, 2);

            await FileSystem.write(`/exports/${filename}`, data, {
                type: 'conversation',
                model: this.MODEL
            });

            Logger.info('AIChat', `Conversation exported to ${filename}`);
            return filename;
        },

        async importConversation(filename) {
            const data = await FileSystem.read(`/exports/${filename}`);
            if (data) {
                const conversation = JSON.parse(data);
                this.conversationHistory = conversation.history || [];
                Logger.info('AIChat', `Conversation imported from ${filename}`);
                return true;
            }
            return false;
        }
    };

    window.AIChat = AIChat;

})(window);
