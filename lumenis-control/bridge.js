/**
 * Bridge between Node.js Lumenis Control and Python Sovereign Core
 *
 * This bridge allows the Node.js frontend to communicate with the
 * Python-based Sovereign Agentic Core, enabling:
 * - AI agent orchestration via ITT Council
 * - Persistent memory via FluxCompass
 * - Claude Opus 4.6 streaming responses
 */

const axios = require('axios');
const WebSocket = require('ws');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:3002';

class SovereignBridge {
    constructor() {
        this.pythonWs = null;
        this.listeners = [];
        this.connected = false;
    }

    /**
     * Connect to Python backend WebSocket
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                this.pythonWs = new WebSocket(`${PYTHON_API_URL.replace('http', 'ws')}/ws`);

                this.pythonWs.on('open', () => {
                    console.log('🔗 Connected to Sovereign Core');
                    this.connected = true;
                    resolve();
                });

                this.pythonWs.on('message', (data) => {
                    try {
                        const msg = JSON.parse(data);
                        this.listeners.forEach(fn => fn(msg));
                    } catch (err) {
                        console.error('Bridge message parse error:', err);
                    }
                });

                this.pythonWs.on('error', (err) => {
                    console.error('🔴 Sovereign Bridge error:', err.message);
                    this.connected = false;
                });

                this.pythonWs.on('close', () => {
                    console.log('🔴 Sovereign Bridge disconnected');
                    this.connected = false;
                    // Auto-reconnect after 5s
                    setTimeout(() => this.connect(), 5000);
                });

            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Listen for messages from Python backend
     */
    onMessage(callback) {
        this.listeners.push(callback);
    }

    /**
     * Send chat message to ITT Council
     */
    async chat(message, sessionId = null) {
        if (!this.connected || !this.pythonWs) {
            throw new Error('Not connected to Sovereign Core');
        }

        return new Promise((resolve, reject) => {
            const chunks = [];
            const timeout = setTimeout(() => reject(new Error('Timeout')), 60000);

            const handler = (msg) => {
                if (msg.type === 'response_chunk') {
                    chunks.push(msg.text);
                } else if (msg.type === 'processing_done') {
                    clearTimeout(timeout);
                    this.listeners = this.listeners.filter(fn => fn !== handler);
                    resolve({
                        response: chunks.join(''),
                        meta: msg.meta,
                        sessionId: msg.session_id
                    });
                } else if (msg.type === 'error') {
                    clearTimeout(timeout);
                    this.listeners = this.listeners.filter(fn => fn !== handler);
                    reject(new Error(msg.message));
                }
            };

            this.listeners.push(handler);

            this.pythonWs.send(JSON.stringify({
                action: 'chat',
                message,
                session_id: sessionId
            }));
        });
    }

    /**
     * Get system status from Sovereign Core
     */
    async getStatus() {
        try {
            const response = await axios.get(`${PYTHON_API_URL}/api/status`);
            return response.data;
        } catch (err) {
            console.error('Failed to get Sovereign status:', err.message);
            return null;
        }
    }

    /**
     * Create new session
     */
    async createSession(title = 'New Session') {
        try {
            const response = await axios.post(`${PYTHON_API_URL}/api/sessions`, { title });
            return response.data.session_id;
        } catch (err) {
            console.error('Failed to create session:', err.message);
            return null;
        }
    }

    /**
     * Get session history
     */
    async getHistory(sessionId) {
        try {
            const response = await axios.get(`${PYTHON_API_URL}/api/sessions/${sessionId}/history`);
            return response.data;
        } catch (err) {
            console.error('Failed to get history:', err.message);
            return [];
        }
    }

    /**
     * Store fact in FluxCompass memory
     */
    async storeFact(key, value, sessionId = null) {
        if (!this.connected || !this.pythonWs) {
            throw new Error('Not connected to Sovereign Core');
        }

        this.pythonWs.send(JSON.stringify({
            action: 'store_fact',
            key,
            value,
            session_id: sessionId
        }));
    }

    /**
     * Recall facts from memory
     */
    async recallFacts(query) {
        if (!this.connected || !this.pythonWs) {
            throw new Error('Not connected to Sovereign Core');
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve([]), 5000);

            const handler = (msg) => {
                if (msg.type === 'recall_result') {
                    clearTimeout(timeout);
                    this.listeners = this.listeners.filter(fn => fn !== handler);
                    resolve(msg.facts);
                }
            };

            this.listeners.push(handler);

            this.pythonWs.send(JSON.stringify({
                action: 'recall',
                query
            }));
        });
    }
}

module.exports = new SovereignBridge();
