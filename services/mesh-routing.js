/**
 * One2lvOS Mesh Routing Core
 * Handles distributed routing and connection management
 */

class MeshRouter {
    constructor() {
        this.nodes = new Map();
        this.routes = new Map();
        this.connections = new Map();
        this.protocols = new Map();
        this.routingTable = new Map();
    }

    /**
     * Register a new node in the mesh network
     */
    registerNode(nodeId, nodeInfo) {
        this.nodes.set(nodeId, {
            id: nodeId,
            ...nodeInfo,
            lastSeen: Date.now(),
            status: 'active'
        });
        this.updateRoutingTable();
        return nodeId;
    }

    /**
     * Register a protocol handler
     */
    registerProtocol(protocolName, handler) {
        this.protocols.set(protocolName.toLowerCase(), handler);
        console.log(`[MeshRouter] Registered protocol: ${protocolName}`);
    }

    /**
     * Create a static connection
     */
    createStaticConnection(connectionConfig) {
        const {
            id,
            protocol,
            host,
            port,
            path = '/',
            credentials,
            persistent = true,
            autoReconnect = true
        } = connectionConfig;

        const connection = {
            id: id || this.generateConnectionId(),
            protocol: protocol.toLowerCase(),
            host,
            port,
            path,
            credentials,
            persistent,
            autoReconnect,
            status: 'disconnected',
            created: Date.now(),
            lastConnected: null
        };

        this.connections.set(connection.id, connection);

        if (persistent) {
            this.connect(connection.id);
        }

        return connection;
    }

    /**
     * Connect to a registered connection
     */
    async connect(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            throw new Error(`Connection ${connectionId} not found`);
        }

        const protocolHandler = this.protocols.get(connection.protocol);
        if (!protocolHandler) {
            throw new Error(`Protocol ${connection.protocol} not supported`);
        }

        try {
            connection.status = 'connecting';
            const result = await protocolHandler.connect(connection);
            connection.status = 'connected';
            connection.lastConnected = Date.now();
            connection.handle = result;

            console.log(`[MeshRouter] Connected to ${connection.protocol}://${connection.host}:${connection.port}`);
            return result;
        } catch (error) {
            connection.status = 'error';
            connection.lastError = error.message;
            console.error(`[MeshRouter] Connection failed:`, error);

            if (connection.autoReconnect) {
                setTimeout(() => this.connect(connectionId), 5000);
            }
            throw error;
        }
    }

    /**
     * Disconnect from a connection
     */
    async disconnect(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection || connection.status !== 'connected') {
            return;
        }

        const protocolHandler = this.protocols.get(connection.protocol);
        if (protocolHandler && protocolHandler.disconnect) {
            await protocolHandler.disconnect(connection.handle);
        }

        connection.status = 'disconnected';
        connection.handle = null;
        console.log(`[MeshRouter] Disconnected from ${connection.id}`);
    }

    /**
     * Route data through the mesh network
     */
    async route(from, to, data) {
        const path = this.findPath(from, to);
        if (!path) {
            throw new Error(`No route from ${from} to ${to}`);
        }

        let currentData = data;
        for (let i = 0; i < path.length - 1; i++) {
            const currentNode = path[i];
            const nextNode = path[i + 1];
            currentData = await this.forwardData(currentNode, nextNode, currentData);
        }

        return currentData;
    }

    /**
     * Find optimal path between nodes using Dijkstra's algorithm
     */
    findPath(from, to) {
        if (from === to) return [from];

        const distances = new Map();
        const previous = new Map();
        const unvisited = new Set();

        for (const [nodeId] of this.nodes) {
            distances.set(nodeId, Infinity);
            unvisited.add(nodeId);
        }
        distances.set(from, 0);

        while (unvisited.size > 0) {
            let current = null;
            let minDist = Infinity;

            for (const nodeId of unvisited) {
                const dist = distances.get(nodeId);
                if (dist < minDist) {
                    minDist = dist;
                    current = nodeId;
                }
            }

            if (current === null || current === to) break;
            unvisited.delete(current);

            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (!unvisited.has(neighbor)) continue;

                const alt = distances.get(current) + this.getEdgeWeight(current, neighbor);
                if (alt < distances.get(neighbor)) {
                    distances.set(neighbor, alt);
                    previous.set(neighbor, current);
                }
            }
        }

        // Reconstruct path
        const path = [];
        let current = to;
        while (current !== undefined) {
            path.unshift(current);
            current = previous.get(current);
        }

        return path[0] === from ? path : null;
    }

    /**
     * Get neighboring nodes
     */
    getNeighbors(nodeId) {
        const neighbors = [];
        const routes = this.routingTable.get(nodeId) || [];
        for (const route of routes) {
            neighbors.push(route.to);
        }
        return neighbors;
    }

    /**
     * Get edge weight between nodes (latency)
     */
    getEdgeWeight(from, to) {
        const route = (this.routingTable.get(from) || []).find(r => r.to === to);
        return route ? route.weight : Infinity;
    }

    /**
     * Forward data to next node
     */
    async forwardData(from, to, data) {
        console.log(`[MeshRouter] Forwarding data: ${from} -> ${to}`);
        // In a real implementation, this would use the actual network protocol
        return data;
    }

    /**
     * Update routing table based on current network topology
     */
    updateRoutingTable() {
        // Simple all-to-all routing for now
        for (const [fromId] of this.nodes) {
            const routes = [];
            for (const [toId] of this.nodes) {
                if (fromId !== toId) {
                    routes.push({
                        to: toId,
                        weight: 1, // Equal weight for all connections
                        protocol: 'tcp'
                    });
                }
            }
            this.routingTable.set(fromId, routes);
        }
    }

    /**
     * Generate unique connection ID
     */
    generateConnectionId() {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get all connections
     */
    getConnections() {
        return Array.from(this.connections.values());
    }

    /**
     * Get connection by ID
     */
    getConnection(id) {
        return this.connections.get(id);
    }

    /**
     * Remove connection
     */
    async removeConnection(id) {
        await this.disconnect(id);
        this.connections.delete(id);
    }

    /**
     * Get mesh network statistics
     */
    getStats() {
        return {
            nodes: this.nodes.size,
            connections: this.connections.size,
            protocols: Array.from(this.protocols.keys()),
            activeConnections: Array.from(this.connections.values())
                .filter(c => c.status === 'connected').length
        };
    }
}

module.exports = MeshRouter;
