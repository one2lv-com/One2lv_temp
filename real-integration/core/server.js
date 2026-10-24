/**
 * One2lv Core Server - REAL Integration
 * ======================================
 * Integrates:
 * - Sovereign Council (NVIDIA API)
 * - Delta Engine (9-layer gradient stack)
 * - Interplanetary-disk Vector Memory
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const { DeltaEngine } = require('../delta-engine/delta_engine.js');
const { InterplanetaryDiskMemory } = require('../vector-memory/vector_store.js');

// Configuration
const PORT = process.env.PORT || 3000;
const COUNCIL_URL = process.env.COUNCIL_URL || 'http://localhost:8000';

// Initialize components
const app = express();
const server = http.createServer(app);

// Real Delta Engine
const deltaEngine = new DeltaEngine();
console.log('✓ Delta Engine (9-layer gradient stack) initialized');

// Real Vector Memory
const vectorMemory = new InterplanetaryDiskMemory('./data/ipd_memory.db');

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// System stats
const systemStats = {
    requests: 0,
    delta_processes: 0,
    memory_operations: 0,
    council_calls: 0,
    start_time: Date.now()
};

/**
 * Health Check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'one2lv-core-real',
        components: {
            delta_engine: 'online',
            vector_memory: vectorMemory.initialized ? 'online' : 'initializing',
            council: 'proxy'
        },
        uptime: Math.floor((Date.now() - systemStats.start_time) / 1000)
    });
});

/**
 * System Status
 */
app.get('/api/status', async (req, res) => {
    try {
        const deltaStats = deltaEngine.getStats();
        const memoryStats = await vectorMemory.stats();

        res.json({
            system: {
                uptime: Math.floor((Date.now() - systemStats.start_time) / 1000),
                requests: systemStats.requests,
                components: 3
            },
            delta_engine: {
                status: 'real',
                layers: 9,
                ...deltaStats
            },
            vector_memory: {
                status: 'real',
                ...memoryStats
            },
            council: {
                status: 'real',
                url: COUNCIL_URL,
                calls: systemStats.council_calls
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Process with Delta Engine
 */
app.post('/api/delta/process', (req, res) => {
    try {
        const { input, metadata = {} } = req.body;

        if (!input) {
            return res.status(400).json({ error: 'Input required' });
        }

        // Convert input to array if needed
        const inputArray = Array.isArray(input) ? input :
                          typeof input === 'string' ? input.split('').map(c => c.charCodeAt(0)) :
                          [input];

        // Process through real 9-layer gradient stack
        const result = deltaEngine.forward(inputArray);

        systemStats.delta_processes++;
        systemStats.requests++;

        res.json({
            success: true,
            engine: 'real_9_layer_gradient_stack',
            input_size: inputArray.length,
            ...result,
            metadata
        });
    } catch (error) {
        console.error('Delta processing error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Vector Memory - Store
 */
app.post('/api/memory/store', async (req, res) => {
    try {
        const { content, metadata = {}, namespace = 'default' } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content required' });
        }

        const result = await vectorMemory.remember(content, metadata, namespace);

        systemStats.memory_operations++;
        systemStats.requests++;

        res.json({
            success: true,
            memory_system: 'interplanetary_disk_real',
            ...result
        });
    } catch (error) {
        console.error('Memory store error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Vector Memory - Search
 */
app.post('/api/memory/search', async (req, res) => {
    try {
        const { query, top_k = 10, namespace = null, min_similarity = 0.0 } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query required' });
        }

        const result = await vectorMemory.recall(query, {
            top_k,
            namespace,
            min_similarity
        });

        systemStats.memory_operations++;
        systemStats.requests++;

        res.json({
            success: true,
            memory_system: 'interplanetary_disk_real',
            ...result
        });
    } catch (error) {
        console.error('Memory search error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Integrated Processing Pipeline
 * Combines Council + Delta + Memory
 */
app.post('/api/process', async (req, res) => {
    try {
        const { message, agent = 'strategist', use_memory = true } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message required' });
        }

        const startTime = Date.now();
        const pipeline = [];

        // Step 1: Search relevant memories
        let memoryContext = null;
        if (use_memory) {
            memoryContext = await vectorMemory.recall(message, { top_k: 3 });
            pipeline.push({
                step: 'memory_search',
                time_ms: Date.now() - startTime,
                results: memoryContext.results.length
            });
        }

        // Step 2: Call Sovereign Council (NVIDIA API)
        let councilResponse = null;
        try {
            const fetch = (await import('node-fetch')).default;
            const councilResult = await fetch(`${COUNCIL_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    agent,
                    temperature: 0.7
                })
            });

            if (councilResult.ok) {
                councilResponse = await councilResult.json();
                systemStats.council_calls++;
                pipeline.push({
                    step: 'council_inference',
                    time_ms: Date.now() - startTime - pipeline[pipeline.length - 1]?.time_ms || 0,
                    agent,
                    model: councilResponse.model
                });
            }
        } catch (error) {
            console.error('Council call error:', error.message);
        }

        // Step 3: Process through Delta Engine
        const responseText = councilResponse?.response || message;
        const inputArray = responseText.split('').map(c => c.charCodeAt(0)).slice(0, 100);
        const deltaResult = deltaEngine.forward(inputArray);

        systemStats.delta_processes++;
        pipeline.push({
            step: 'delta_processing',
            time_ms: Date.now() - startTime - pipeline.reduce((sum, p) => sum + p.time_ms, 0),
            layers: 9
        });

        // Step 4: Store in memory
        if (use_memory && councilResponse) {
            await vectorMemory.remember(
                `Q: ${message}\nA: ${councilResponse.response}`,
                {
                    agent,
                    timestamp: Date.now(),
                    quality: deltaResult.layer_outputs[8].metrics?.quality
                },
                'conversations'
            );
            systemStats.memory_operations++;
            pipeline.push({
                step: 'memory_store',
                time_ms: Date.now() - startTime - pipeline.reduce((sum, p) => sum + p.time_ms, 0)
            });
        }

        const totalTime = Date.now() - startTime;
        systemStats.requests++;

        res.json({
            success: true,
            integration: 'real',
            response: councilResponse?.response || 'Council unavailable',
            pipeline,
            memory_context: memoryContext?.results || [],
            delta_quality: deltaResult.layer_outputs[8].metrics?.quality || 0,
            total_time_ms: totalTime,
            components: {
                council: councilResponse ? 'nvidia_llama_3.3_70b' : 'unavailable',
                delta: '9_layer_gradient_stack',
                memory: 'interplanetary_disk'
            }
        });
    } catch (error) {
        console.error('Processing pipeline error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Memory Stats
 */
app.get('/api/memory/stats', async (req, res) => {
    try {
        const stats = await vectorMemory.stats();
        res.json({
            success: true,
            ...stats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delta Engine Stats
 */
app.get('/api/delta/stats', (req, res) => {
    try {
        const stats = deltaEngine.getStats();
        res.json({
            success: true,
            ...stats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Reset Delta Engine
 */
app.post('/api/delta/reset', (req, res) => {
    try {
        deltaEngine.reset();
        res.json({
            success: true,
            message: 'Delta Engine reset'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Startup
 */
async function startup() {
    try {
        // Initialize vector memory
        await vectorMemory.initialize();

        // Start server
        server.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           ONE2LV CORE SERVER - REAL INTEGRATION               ║
╠═══════════════════════════════════════════════════════════════╣
║  Port:        ${PORT}                                                  ║
║  Council:     ${COUNCIL_URL}                              ║
╠═══════════════════════════════════════════════════════════════╣
║  Components:                                                  ║
║    ✓ Delta Engine       9-layer gradient stack (REAL)        ║
║    ✓ Vector Memory      Interplanetary-disk (REAL)           ║
║    ✓ Council Proxy      NVIDIA API integration (REAL)        ║
╠═══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                   ║
║    POST /api/process           - Full integration pipeline   ║
║    POST /api/delta/process     - Delta engine only           ║
║    POST /api/memory/store      - Store in vector memory      ║
║    POST /api/memory/search     - Search vector memory        ║
║    GET  /api/status            - System status               ║
╚═══════════════════════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('Startup error:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await vectorMemory.shutdown();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Start
startup();

module.exports = { app, deltaEngine, vectorMemory };
