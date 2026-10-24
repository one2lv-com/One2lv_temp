const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Sovereign Bridge Integration
const sovereignBridge = require('../bridge');

const app = express();

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Configuration for the Home Workstation
const WORKSTATION_CONFIG = {
    stationName: "Reactor_Core",
    residentAgent: "Lumenis_Agentic_Core",
    port: 3000,
    assets: [
        "flux_compass_a.tor",
        "The_Inovative_Thought_Team",
        "The_Registry_of_Thought"
    ]
};

async function initializeReactorCore() {
    console.log(`🌌 INITIALIZING WORKSTATION: ${WORKSTATION_CONFIG.stationName}`);
    console.log(`🧠 DEPLOYING AGENT: ${WORKSTATION_CONFIG.residentAgent}`);
    console.log("--------------------------------------------------");

    try {
        // 1. Mount the Flux Compass (.tor handle)
        console.log(`📡 Mounting asset: ${WORKSTATION_CONFIG.assets[0]}...`);
        // Logic to interface with the .tor file structure

        // 2. Register the Thought Registry
        console.log(`📚 Synchronizing: ${WORKSTATION_CONFIG.assets[2]}...`);

        // 3. Establish the Home Workstation Directory
        const corePath = path.join(__dirname, '../Reactor_Core');
        if (!fs.existsSync(corePath)) {
            fs.mkdirSync(corePath);
            console.log(`✅ Reactor_Core directory created.`);
        } else {
            console.log(`✅ Reactor_Core directory exists.`);
        }

        // 4. Link Lumenis to the Core
        const manifest = {
            timestamp: Date.now(),
            station: WORKSTATION_CONFIG.stationName,
            status: "ACTIVE",
            active_assets: WORKSTATION_CONFIG.assets,
            environment: "Lumenis_Agentic_Runtime"
        };

        fs.writeFileSync(
            path.join(corePath, 'station_manifest.json'),
            JSON.stringify(manifest, null, 2)
        );

        console.log("--------------------------------------------------");
        console.log("✨ REACTOR_CORE IS ONLINE");
        console.log("🚀 Agentic Lumenis is now homed in Reactor_Core.");
        console.log("");
    } catch (error) {
        console.error("❌ Initialization Failed:", error);
    }
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// ═══════════════════════════════════════════════════════
// SOVEREIGN CORE API ENDPOINTS
// ═══════════════════════════════════════════════════════

// Get Sovereign Core status
app.get('/api/sovereign/status', async (req, res) => {
  try {
    const status = await sovereignBridge.getStatus();
    res.json(status || { error: 'Sovereign Core offline' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message to ITT Council
app.post('/api/sovereign/chat', async (req, res) => {
  try {
    const { message, session_id } = req.body;
    const result = await sovereignBridge.chat(message, session_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new session
app.post('/api/sovereign/session', async (req, res) => {
  try {
    const { title } = req.body;
    const sessionId = await sovereignBridge.createSession(title);
    res.json({ session_id: sessionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get session history
app.get('/api/sovereign/session/:id/history', async (req, res) => {
  try {
    const history = await sovereignBridge.getHistory(req.params.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Store fact in FluxCompass
app.post('/api/sovereign/fact', async (req, res) => {
  try {
    const { key, value, session_id } = req.body;
    await sovereignBridge.storeFact(key, value, session_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recall facts
app.post('/api/sovereign/recall', async (req, res) => {
  try {
    const { query } = req.body;
    const facts = await sovereignBridge.recallFacts(query);
    res.json({ facts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Runtime state
let runtimeState = {
  LUMENIS_CORE: 'EVOLVING',
  REALITY_SYNC: 'STABLE',
  SELF_BOOT: 'ACTIVE',
  TRIAD_PROTOCOL: 'ONLINE',
  TWITCH_BRIDGE: 'STANDBY',
  DISCORD_BRIDGE: 'STANDBY',
  AGENT_SPECIALIZATION: 'ENABLED',
  connectedClients: 0
};

// Load memory
function loadMemory() {
  const memoryPath = path.join(__dirname, '../memory/persistent_state.json');
  try {
    if (fs.existsSync(memoryPath)) {
      const data = fs.readFileSync(memoryPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.log('Creating new memory state');
  }
  return {
    session_id: `lumenis_${Date.now()}`,
    runtime_state: 'EVOLVING',
    agents: {
      SCOUT: { status: 'ACTIVE', last_action: 'initialized', priority: 3 },
      GUARDIAN: { status: 'ACTIVE', last_action: 'monitoring', priority: 5 },
      BERSERKER: { status: 'STANDBY', last_action: 'ready', priority: 2 },
      ARCHIVIST: { status: 'ACTIVE', last_action: 'memory_loaded', priority: 4 }
    },
    match_history: [],
    discord_alerts: [],
    twitch_commentary: []
  };
}

// Save memory
function saveMemory(data) {
  const memoryPath = path.join(__dirname, '../memory/persistent_state.json');
  fs.writeFileSync(memoryPath, JSON.stringify(data, null, 2));
}

let memory = loadMemory();

// Socket.io connection handling
io.on('connection', (socket) => {
  runtimeState.connectedClients++;
  console.log(`🌌 LUMENIS Core connected (${runtimeState.connectedClients} clients)`);

  // Send initial state
  socket.emit('runtime_state', runtimeState);
  socket.emit('memory_state', memory);

  // Handle Sovereign Core chat requests via WebSocket
  socket.on('sovereign_chat', async (data) => {
    try {
      const result = await sovereignBridge.chat(data.message, data.session_id);
      socket.emit('sovereign_response', result);
    } catch (err) {
      socket.emit('sovereign_error', { error: err.message });
    }
  });

  // Handle agent updates
  socket.on('agent_update', (data) => {
    console.log(`🦝 Agent update: ${JSON.stringify(data)}`);

    if (data.agent && memory.agents[data.agent]) {
      memory.agents[data.agent].last_action = data.action;
      memory.agents[data.agent].status = data.status || memory.agents[data.agent].status;
      saveMemory(memory);
    }

    io.emit('runtime_sync', {
      timestamp: Date.now(),
      type: 'agent_update',
      data: data
    });
  });

  // Handle state changes
  socket.on('state_change', (data) => {
    console.log(`⚡ State change: ${JSON.stringify(data)}`);

    if (data.key && runtimeState[data.key]) {
      runtimeState[data.key] = data.value;
    }

    io.emit('runtime_state', runtimeState);
  });

  // Handle memory updates
  socket.on('memory_update', (data) => {
    console.log(`🧠 Memory update: ${JSON.stringify(data)}`);

    memory = { ...memory, ...data };
    saveMemory(memory);

    io.emit('memory_state', memory);
  });

  socket.on('disconnect', () => {
    runtimeState.connectedClients--;
    console.log(`💫 Client disconnected (${runtimeState.connectedClients} clients)`);
  });
});

// Agent system loop
setInterval(() => {
  const activeAgents = Object.keys(memory.agents).filter(
    agent => memory.agents[agent].status === 'ACTIVE'
  );

  if (activeAgents.length > 0) {
    const randomAgent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
    const actions = ['pattern_detected', 'monitoring', 'analyzing', 'processing', 'optimizing'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];

    memory.agents[randomAgent].last_action = randomAction;
    saveMemory(memory);

    io.emit('agent_pulse', {
      agent: randomAgent,
      action: randomAction,
      timestamp: Date.now()
    });
  }
}, 5000);

// Start server
server.listen(PORT, async () => {
  // Initialize Reactor Core
  await initializeReactorCore();

  // Connect to Sovereign Core
  try {
    await sovereignBridge.connect();
    console.log('🔗 Sovereign Bridge: CONNECTED');
    runtimeState.SOVEREIGN_CORE = 'ONLINE';

    // Relay Sovereign messages to all Socket.io clients
    sovereignBridge.onMessage((msg) => {
      io.emit('sovereign_event', msg);
    });
  } catch (err) {
    console.log('⚠️  Sovereign Bridge: OFFLINE (will retry)');
    runtimeState.SOVEREIGN_CORE = 'OFFLINE';
  }

  console.log('');
  console.log('🌌 ═══════════════════════════════════════════════');
  console.log('   LUMENIS ONE2LVOS RUNTIME INITIALIZED');
  console.log('🌌 ═══════════════════════════════════════════════');
  console.log('');
  console.log(`⚡ Server: http://localhost:${PORT}`);
  console.log(`🏠 Workstation: ${WORKSTATION_CONFIG.stationName}`);
  console.log(`🧠 Runtime State: ${runtimeState.LUMENIS_CORE}`);
  console.log(`🦝 Agents: ${Object.keys(memory.agents).length} active`);
  console.log(`🔮 Sovereign Core: ${runtimeState.SOVEREIGN_CORE || 'OFFLINE'}`);
  console.log('🔗 WebSocket: Ready');
  console.log('💾 Memory: Loaded');
  console.log('');
  console.log('✨ LUMENIS ONLINE');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🌌 Shutting down LUMENIS...');
  saveMemory(memory);
  console.log('💾 Memory saved');
  console.log('✨ LUMENIS offline');
  process.exit(0);
});
