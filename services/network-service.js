/**
 * One2lvOS Network Service
 * Manages static connections and mesh routing with WebDAV/FTP integration
 */

const MeshRouter = require('./mesh-routing');
const WebDAVHandler = require('./protocols/webdav-handler');
const FTPHandler = require('./protocols/ftp-handler');
const fs = require('fs').promises;
const path = require('path');

class NetworkService {
    constructor() {
        this.router = new MeshRouter();
        this.configFile = path.join(__dirname, '../config/connections.json');
        this.initialized = false;
    }

    /**
     * Initialize network service
     */
    async initialize() {
        if (this.initialized) return;

        // Register protocol handlers
        this.router.registerProtocol('webdav', new WebDAVHandler());
        this.router.registerProtocol('ftp', new FTPHandler());

        // Register local node
        this.router.registerNode('local', {
            name: 'One2lvOS Local Node',
            type: 'host',
            capabilities: ['webdav', 'ftp', 'routing']
        });

        // Load saved connections
        await this.loadConnections();

        this.initialized = true;
        console.log('[NetworkService] Initialized successfully');
    }

    /**
     * Load connections from config file
     */
    async loadConnections() {
        try {
            const data = await fs.readFile(this.configFile, 'utf8');
            const config = JSON.parse(data);

            for (const conn of config.connections || []) {
                try {
                    await this.createConnection(conn);
                } catch (error) {
                    console.error(`[NetworkService] Failed to restore connection ${conn.id}:`, error.message);
                }
            }

            console.log(`[NetworkService] Loaded ${config.connections?.length || 0} connections`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('[NetworkService] No saved connections found');
                await this.saveConnections();
            } else {
                console.error('[NetworkService] Error loading connections:', error);
            }
        }
    }

    /**
     * Save connections to config file
     */
    async saveConnections() {
        try {
            const connections = this.router.getConnections().map(conn => ({
                id: conn.id,
                protocol: conn.protocol,
                host: conn.host,
                port: conn.port,
                path: conn.path,
                credentials: conn.credentials,
                persistent: conn.persistent,
                autoReconnect: conn.autoReconnect
            }));

            const config = { connections };

            // Ensure config directory exists
            await fs.mkdir(path.dirname(this.configFile), { recursive: true });
            await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));

            console.log('[NetworkService] Connections saved');
        } catch (error) {
            console.error('[NetworkService] Error saving connections:', error);
        }
    }

    /**
     * Create a new connection
     */
    async createConnection(config) {
        const connection = this.router.createStaticConnection(config);
        await this.saveConnections();
        return connection;
    }

    /**
     * Connect to a connection
     */
    async connect(connectionId) {
        return this.router.connect(connectionId);
    }

    /**
     * Disconnect from a connection
     */
    async disconnect(connectionId) {
        await this.router.disconnect(connectionId);
        await this.saveConnections();
    }

    /**
     * Remove a connection
     */
    async removeConnection(connectionId) {
        await this.router.removeConnection(connectionId);
        await this.saveConnections();
    }

    /**
     * Get all connections
     */
    getConnections() {
        return this.router.getConnections();
    }

    /**
     * Get connection by ID
     */
    getConnection(connectionId) {
        return this.router.getConnection(connectionId);
    }

    /**
     * Get network statistics
     */
    getStats() {
        return this.router.getStats();
    }

    /**
     * Execute operation on a connection
     */
    async executeOperation(connectionId, operation, ...args) {
        const connection = this.router.getConnection(connectionId);
        if (!connection) {
            throw new Error(`Connection ${connectionId} not found`);
        }

        if (connection.status !== 'connected') {
            throw new Error(`Connection ${connectionId} is not connected`);
        }

        const handler = this.router.protocols.get(connection.protocol);
        if (!handler || typeof handler[operation] !== 'function') {
            throw new Error(`Operation ${operation} not supported for protocol ${connection.protocol}`);
        }

        return handler[operation](connection.handle, ...args);
    }

    /**
     * WebDAV operations
     */
    async webdavList(connectionId, remotePath = '/') {
        const result = await this.executeOperation(connectionId, 'propfind', remotePath);
        const handler = this.router.protocols.get('webdav');
        return handler.parseXmlResponse(result.body);
    }

    async webdavGet(connectionId, remotePath) {
        return this.executeOperation(connectionId, 'get', remotePath);
    }

    async webdavPut(connectionId, remotePath, data) {
        return this.executeOperation(connectionId, 'put', remotePath, data);
    }

    async webdavDelete(connectionId, remotePath) {
        return this.executeOperation(connectionId, 'delete', remotePath);
    }

    async webdavMkdir(connectionId, remotePath) {
        return this.executeOperation(connectionId, 'mkcol', remotePath);
    }

    /**
     * FTP operations
     */
    async ftpList(connectionId, remotePath = '.') {
        return this.executeOperation(connectionId, 'list', remotePath);
    }

    async ftpGet(connectionId, remotePath) {
        return this.executeOperation(connectionId, 'get', remotePath);
    }

    async ftpPut(connectionId, data, remotePath) {
        return this.executeOperation(connectionId, 'put', data, remotePath);
    }

    async ftpDelete(connectionId, remotePath) {
        return this.executeOperation(connectionId, 'delete', remotePath);
    }

    async ftpMkdir(connectionId, remotePath) {
        return this.executeOperation(connectionId, 'mkdir', remotePath);
    }

    async ftpCwd(connectionId, remotePath) {
        return this.executeOperation(connectionId, 'cwd', remotePath);
    }

    async ftpPwd(connectionId) {
        return this.executeOperation(connectionId, 'pwd');
    }

    /**
     * Test connection
     */
    async testConnection(config) {
        const testId = `test_${Date.now()}`;
        try {
            const connection = this.router.createStaticConnection({
                ...config,
                id: testId,
                persistent: false
            });

            await this.router.connect(testId);
            await this.router.disconnect(testId);
            await this.router.removeConnection(testId);

            return { success: true, message: 'Connection successful' };
        } catch (error) {
            await this.router.removeConnection(testId).catch(() => {});
            return { success: false, message: error.message };
        }
    }
}

// Singleton instance
let instance = null;

function getNetworkService() {
    if (!instance) {
        instance = new NetworkService();
    }
    return instance;
}

module.exports = { NetworkService, getNetworkService };
