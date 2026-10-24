(function(window) {
    'use strict';

    const ChatWindow = {
        windowId: null,
        messageContainer: null,
        inputField: null,
        sendButton: null,

        create() {
            if (this.windowId) {
                WindowManager.focus(this.windowId);
                return;
            }

            this.windowId = WindowManager.create({
                id: 'ai-chat-nemotron',
                title: '🤖 Nemotron Ultra 550B Chat',
                x: 100,
                y: 100,
                width: 800,
                height: 600,
                content: this.buildUI(),
                onClose: () => {
                    this.windowId = null;
                    this.messageContainer = null;
                    this.inputField = null;
                    this.sendButton = null;
                }
            });

            // Wait for DOM to be ready, then set up handlers
            setTimeout(() => this.setupHandlers(), 100);

            Logger.info('ChatWindow', 'Nemotron chat window opened');
        },

        buildUI() {
            return `
                <div class="chat-container" style="display: flex; flex-direction: column; height: 100%; padding: 0;">
                    <div class="chat-header" style="padding: 15px; background: rgba(0, 100, 255, 0.1); border-bottom: 1px solid rgba(0, 180, 255, 0.3);">
                        <h3 style="margin: 0 0 5px 0; color: #00b8ff;">NVIDIA Nemotron-3-Ultra-550B-A55B</h3>
                        <p style="margin: 0; font-size: 12px; color: #888;">Advanced reasoning AI • 550B parameters • Thinking enabled</p>
                        <div style="margin-top: 10px; display: flex; gap: 10px;">
                            <button id="clear-chat" class="btn" style="font-size: 11px; padding: 4px 10px;">Clear History</button>
                            <button id="export-chat" class="btn" style="font-size: 11px; padding: 4px 10px;">Export</button>
                            <button id="toggle-thinking" class="btn btn-primary" style="font-size: 11px; padding: 4px 10px;">Thinking: ON</button>
                        </div>
                    </div>

                    <div id="chat-messages" class="chat-messages" style="flex: 1; overflow-y: auto; padding: 20px; background: rgba(0, 0, 0, 0.2);">
                        <div class="system-message" style="text-align: center; color: #888; padding: 20px; font-style: italic;">
                            Connected to NVIDIA Nemotron Ultra 550B<br>
                            Send a message to start chatting...
                        </div>
                    </div>

                    <div class="chat-input-container" style="padding: 15px; background: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <div style="display: flex; gap: 10px; align-items: flex-end;">
                            <textarea
                                id="chat-input"
                                placeholder="Type your message... (Shift+Enter for new line)"
                                style="flex: 1; background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; padding: 10px; border-radius: 6px; resize: none; font-size: 14px; font-family: inherit; min-height: 40px; max-height: 120px;"
                                rows="1"
                            ></textarea>
                            <button
                                id="send-button"
                                class="btn btn-primary"
                                style="padding: 10px 20px; white-space: nowrap;"
                            >Send</button>
                        </div>
                        <div style="margin-top: 8px; font-size: 11px; color: #666;">
                            <span id="status-indicator">Ready</span>
                        </div>
                    </div>
                </div>
            `;
        },

        setupHandlers() {
            const win = WindowManager.getWindow(this.windowId);
            if (!win) return;

            const content = win.element.querySelector('.window-content');
            this.messageContainer = content.querySelector('#chat-messages');
            this.inputField = content.querySelector('#chat-input');
            this.sendButton = content.querySelector('#send-button');

            const clearBtn = content.querySelector('#clear-chat');
            const exportBtn = content.querySelector('#export-chat');
            const thinkingBtn = content.querySelector('#toggle-thinking');
            const statusIndicator = content.querySelector('#status-indicator');

            // Send message handler
            const sendMessage = async () => {
                const message = this.inputField.value.trim();
                if (!message) return;

                this.inputField.value = '';
                this.inputField.disabled = true;
                this.sendButton.disabled = true;
                statusIndicator.textContent = 'Thinking...';
                statusIndicator.style.color = '#00b8ff';

                // Add user message to UI
                this.addMessage(message, 'user');

                try {
                    // Send to API
                    const response = await AIChat.sendMessage(message, {
                        enable_thinking: AIChat.thinkingEnabled
                    });

                    // Show thinking if available
                    if (response.thinking && AIChat.thinkingEnabled) {
                        this.addThinking(response.thinking);
                    }

                    // Add assistant response
                    this.addMessage(response.content, 'assistant', response.usage);

                    statusIndicator.textContent = 'Ready';
                    statusIndicator.style.color = '#0f0';

                } catch (error) {
                    this.addMessage(`Error: ${error.message}`, 'error');
                    statusIndicator.textContent = 'Error';
                    statusIndicator.style.color = '#f00';
                }

                this.inputField.disabled = false;
                this.sendButton.disabled = false;
                this.inputField.focus();
            };

            this.sendButton.addEventListener('click', sendMessage);

            this.inputField.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }

                // Auto-resize textarea
                this.inputField.style.height = 'auto';
                this.inputField.style.height = Math.min(this.inputField.scrollHeight, 120) + 'px';
            });

            clearBtn.addEventListener('click', () => {
                if (confirm('Clear conversation history?')) {
                    AIChat.clearHistory();
                    this.messageContainer.innerHTML = '<div class="system-message" style="text-align: center; color: #888; padding: 20px;">Conversation cleared</div>';
                }
            });

            exportBtn.addEventListener('click', async () => {
                try {
                    const filename = await AIChat.exportConversation();
                    this.addMessage(`Conversation exported to ${filename}`, 'system');
                } catch (error) {
                    this.addMessage(`Export failed: ${error.message}`, 'error');
                }
            });

            thinkingBtn.addEventListener('click', () => {
                AIChat.thinkingEnabled = !AIChat.thinkingEnabled;
                thinkingBtn.textContent = `Thinking: ${AIChat.thinkingEnabled ? 'ON' : 'OFF'}`;
                thinkingBtn.className = AIChat.thinkingEnabled ? 'btn btn-primary' : 'btn';
            });
        },

        addMessage(content, role, usage = null) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${role}`;

            const styles = {
                user: 'background: rgba(0, 100, 255, 0.2); border-left: 3px solid #0064ff; margin-left: 60px;',
                assistant: 'background: rgba(0, 180, 255, 0.1); border-left: 3px solid #00b8ff; margin-right: 60px;',
                system: 'background: rgba(100, 100, 100, 0.1); border-left: 3px solid #666; text-align: center;',
                error: 'background: rgba(255, 0, 0, 0.2); border-left: 3px solid #f00;'
            };

            const icons = {
                user: '👤',
                assistant: '🤖',
                system: 'ℹ️',
                error: '⚠️'
            };

            messageDiv.style.cssText = `
                ${styles[role] || styles.system}
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                animation: fadeIn 0.3s ease;
            `;

            let html = `
                <div style="font-weight: bold; margin-bottom: 8px; color: ${role === 'user' ? '#0064ff' : role === 'assistant' ? '#00b8ff' : '#888'};">
                    ${icons[role]} ${role.charAt(0).toUpperCase() + role.slice(1)}
                    <span style="float: right; font-size: 11px; color: #666;">${new Date().toLocaleTimeString()}</span>
                </div>
                <div style="white-space: pre-wrap; line-height: 1.6;">${this.escapeHtml(content)}</div>
            `;

            if (usage) {
                html += `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: #666;">
                        Tokens: ${usage.total_tokens || 'N/A'} • Completion: ${usage.completion_tokens || 'N/A'}
                    </div>
                `;
            }

            messageDiv.innerHTML = html;
            this.messageContainer.appendChild(messageDiv);
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        },

        addThinking(thinking) {
            const thinkingDiv = document.createElement('div');
            thinkingDiv.className = 'chat-thinking';
            thinkingDiv.style.cssText = `
                background: rgba(100, 0, 255, 0.1);
                border-left: 3px solid #6400ff;
                padding: 15px;
                margin: 10px 60px 10px 0;
                border-radius: 8px;
                animation: fadeIn 0.3s ease;
            `;

            thinkingDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px; color: #6400ff;">
                    💭 Thinking Process
                </div>
                <details style="cursor: pointer;">
                    <summary style="color: #888; font-size: 12px;">Click to view reasoning (${thinking.length} characters)</summary>
                    <div style="margin-top: 10px; padding: 10px; background: rgba(0, 0, 0, 0.3); border-radius: 4px; font-family: monospace; font-size: 12px; white-space: pre-wrap; line-height: 1.4;">
                        ${this.escapeHtml(thinking)}
                    </div>
                </details>
            `;

            this.messageContainer.appendChild(thinkingDiv);
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    window.ChatWindow = ChatWindow;

})(window);
