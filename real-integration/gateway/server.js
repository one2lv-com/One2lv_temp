/**
 * Gateway for Real Integration
 */

import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.GATEWAY_PORT || 4000;
const COUNCIL_URL = process.env.COUNCIL_URL || 'http://localhost:8000';
const CORE_URL = process.env.CORE_URL || 'http://localhost:3000';

const app = express();

app.use(cors());
app.use(express.json());

// Health
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'gateway-real',
        integration: 'real'
    });
});

// Proxy to Council
app.use('/api/ai', createProxyMiddleware({
    target: COUNCIL_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/ai': '/api' }
}));

// Proxy to Core
app.use('/api/core', createProxyMiddleware({
    target: CORE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/core': '/api' }
}));

// Static UI
app.use(express.static(path.join(__dirname, '../ui')));

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║  ONE2LV GATEWAY - REAL INTEGRATION            ║
║  Port: ${PORT}                                    ║
║  Council: ${COUNCIL_URL}                   ║
║  Core: ${CORE_URL}                      ║
╚═══════════════════════════════════════════════╝
    `);
});
