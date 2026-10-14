import WebSocket from 'ws';

const MESH_PEERS = (process.env.MESH_PEERS || '').split(',').filter(Boolean);
const NODE_ID = process.env.NODE_ID || 'node-1';

// Connected peers
const connectedPeers = new Map();

// Mesh event history
const eventHistory = [];

// Broadcast to all connected peers
export function broadcast(event, excludeWs = null) {
  const eventWithMeta = {
    ...event,
    nodeId: NODE_ID,
    timestamp: Date.now()
  };

  // Store in history
  eventHistory.push(eventWithMeta);
  if (eventHistory.length > 100) eventHistory.shift();

  // Send to all connected peers
  connectedPeers.forEach((ws, peerId) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(eventWithMeta));
      } catch (e) {
        console.log(`Failed to send to peer ${peerId}`);
      }
    }
  });

  // Also try to reach external peers
  MESH_PEERS.forEach(peerUrl => {
    tryConnectPeer(peerUrl, eventWithMeta);
  });

  return eventWithMeta;
}

// Connect to external peer
function tryConnectPeer(url, event = null) {
  try {
    const ws = new WebSocket(url);

    ws.on('open', () => {
      console.log(`🔗 Connected to mesh peer: ${url}`);
      connectedPeers.set(url, ws);

      if (event) {
        ws.send(JSON.stringify(event));
      }
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handlePeerMessage(message, url);
      } catch (e) {
        console.log('Invalid peer message');
      }
    });

    ws.on('close', () => {
      connectedPeers.delete(url);
      console.log(`🔌 Disconnected from peer: ${url}`);

      // Reconnect after delay
      setTimeout(() => tryConnectPeer(url), 5000);
    });

    ws.on('error', () => {
      connectedPeers.delete(url);
    });
  } catch (e) {
    // Peer unavailable, will retry
  }
}

// Handle incoming peer message
function handlePeerMessage(message, fromPeer) {
  console.log(`📥 Peer message: ${message.type} from ${fromPeer}`);

  switch (message.type) {
    case 'game_event':
      // Broadcast game event to all peers
      broadcast({ type: 'game_sync', data: message.data }, fromPeer);
      break;

    case 'ai_command':
      // Process AI command from peer
      broadcast({ type: 'ai_response', data: message.data }, fromPeer);
      break;

    case 'leaderboard_update':
      // Sync leaderboard across mesh
      broadcast({ type: 'leaderboard_sync', data: message.data }, fromPeer);
      break;

    default:
      // Broadcast unknown events
      broadcast(message, fromPeer);
  }
}

// Get mesh status
export function getMeshStatus() {
  return {
    nodeId: NODE_ID,
    connectedPeers: connectedPeers.size,
    configuredPeers: MESH_PEERS.length,
    eventHistorySize: eventHistory.length,
    peers: Array.from(connectedPeers.keys())
  };
}

// Initialize mesh connections
export function initializeMesh() {
  console.log('🌐 Initializing mesh network...');

  if (MESH_PEERS.length === 0) {
    console.log('📡 Mesh running in standalone mode (no peers configured)');
  } else {
    MESH_PEERS.forEach(peer => {
      tryConnectPeer(peer);
    });
  }

  console.log('✅ Mesh initialized');
}

// Cleanup
export function cleanupMesh() {
  connectedPeers.forEach((ws, id) => {
    try {
      ws.close();
    } catch (e) {}
  });
  connectedPeers.clear();
}

export default {
  broadcast,
  getMeshStatus,
  initializeMesh,
  cleanupMesh
};