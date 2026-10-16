/**
 * One2lvOS Network API Server
 * Express API for managing mesh routing, WebDAV, and FTP connections
 */

const express = require('express');
const cors = require('cors');
const { getNetworkService } = require('../services/network-service');

const app = express();
const PORT = process.env.NETWORK_API_PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + '/../'));

// Initialize network service
let networkService;
(async () => {
    networkService = getNetworkService();
    await networkService.initialize();
    console.log('[Network API] Service initialized');
})();

// API Routes

/**
 * Get all connections
 */
app.get('/api/network/connections', (req, res) => {
    try {
        const connections = networkService.getConnections();
        res.json(connections);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get single connection
 */
app.get('/api/network/connections/:id', (req, res) => {
    try {
        const connection = networkService.getConnection(req.params.id);
        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }
        res.json(connection);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create new connection
 */
app.post('/api/network/connections', async (req, res) => {
    try {
        const connection = await networkService.createConnection(req.body);
        res.status(201).json(connection);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * Delete connection
 */
app.delete('/api/network/connections/:id', async (req, res) => {
    try {
        await networkService.removeConnection(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Connect to a connection
 */
app.post('/api/network/connections/:id/connect', async (req, res) => {
    try {
        await networkService.connect(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Disconnect from a connection
 */
app.post('/api/network/connections/:id/disconnect', async (req, res) => {
    try {
        await networkService.disconnect(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Test connection
 */
app.post('/api/network/test', async (req, res) => {
    try {
        const result = await networkService.testConnection(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get network statistics
 */
app.get('/api/network/stats', (req, res) => {
    try {
        const stats = networkService.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// WebDAV Operations

/**
 * List WebDAV directory
 */
app.get('/api/network/connections/:id/webdav/list', async (req, res) => {
    try {
        const path = req.query.path || '/';
        const files = await networkService.webdavList(req.params.id, path);
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get WebDAV file
 */
app.get('/api/network/connections/:id/webdav/get', async (req, res) => {
    try {
        const path = req.query.path;
        if (!path) {
            return res.status(400).json({ error: 'Path required' });
        }

        const result = await networkService.webdavGet(req.params.id, path);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${path.split('/').pop()}"`);
        res.send(result.body);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Upload WebDAV file
 */
app.put('/api/network/connections/:id/webdav/put', async (req, res) => {
    try {
        const path = req.query.path;
        if (!path) {
            return res.status(400).json({ error: 'Path required' });
        }

        await networkService.webdavPut(req.params.id, path, req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delete WebDAV file/directory
 */
app.delete('/api/network/connections/:id/webdav/delete', async (req, res) => {
    try {
        const path = req.query.path;
        if (!path) {
            return res.status(400).json({ error: 'Path required' });
        }

        await networkService.webdavDelete(req.params.id, path);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create WebDAV directory
 */
app.post('/api/network/connections/:id/webdav/mkdir', async (req, res) => {
    try {
        const path = req.body.path;
        if (!path) {
            return res.status(400).json({ error: 'Path required' });
        }

        await networkService.webdavMkdir(req.params.id, path);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// FTP Operations

/**
 * List FTP directory
 */
app.get('/api/network/connections/:id/ftp/list', async (req, res) => {
    try {
        const path = req.query.path || '.';
        const files = await networkService.ftpList(req.params.id, path);
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get FTP file
 */
app.get('/api/network/connections/:id/ftp/get', async (req, res) => {
    try {
        const path = req.query.path;
        if (!path) {
            return res.status(400).json({ error: 'Path required' });
        }

        const data = await networkService.ftpGet(req.params.id, path);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${path.split('/').pop()}"`);
        res.send(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Upload FTP file
 */
app.put('/api/network/connections/:id/ftp/put', async (req, res) => {
    try {
        const path = req.query.path;
        if (!path) {
            return res.status(400).json({ error: 'Path required' });
        }

        await networkService.ftpPut(req.params.id, req.body, path);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delete FTP file
 */
app.delete('/api/network/connections/:id/ftp/delete', async (req, res) => {
    try {
        const path = req.query.path;
        if (!path) {
            return res.status(400).json({ error: 'Path required' });
        }

        await networkService.ftpDelete(req.params.id, path);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create FTP directory
 */
app.post('/api/network/connections/:id/ftp/mkdir', async (req, res) => {
    try {
        const path = req.body.path;
        if (!path) {
            return res.status(400).json({ error: 'Path required' });
        }

        await networkService.ftpMkdir(req.params.id, path);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Change FTP directory
 */
app.post('/api/network/connections/:id/ftp/cwd', async (req, res) => {
    try {
        const path = req.body.path;
        if (!path) {
            return res.status(400).json({ error: 'Path required' });
        }

        await networkService.ftpCwd(req.params.id, path);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get current FTP directory
 */
app.get('/api/network/connections/:id/ftp/pwd', async (req, res) => {
    try {
        const path = await networkService.ftpPwd(req.params.id);
        res.json({ path });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`[Network API] Server running on port ${PORT}`);
    console.log(`[Network API] Network Manager UI: http://localhost:${PORT}/network-manager.html`);
});

module.exports = app;
