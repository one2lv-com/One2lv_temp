# One2lvOS Network Service

## Static Connections & Mesh Routing with WebDAV/FTP Integration

The One2lvOS Network Service provides a comprehensive solution for managing static network connections with mesh routing capabilities, supporting WebDAV and FTP protocols.

## Features

### 🌐 Mesh Routing Core
- **Dynamic Node Registration**: Register and manage network nodes in the mesh
- **Intelligent Path Finding**: Dijkstra's algorithm for optimal routing
- **Automatic Route Updates**: Real-time routing table updates
- **Multi-Protocol Support**: Extensible protocol handler system

### 📁 WebDAV Protocol Support
- **Full WebDAV Client**: Complete implementation of WebDAV operations
- **Directory Browsing**: List and navigate remote directories
- **File Operations**: Upload, download, delete, copy, and move files
- **Collection Management**: Create and manage WebDAV collections
- **Authentication**: HTTP Basic Auth support

### 🖥️ FTP Protocol Support
- **FTP/FTPS Client**: Standard FTP with optional TLS support
- **Passive Mode**: PASV mode for firewall-friendly connections
- **Directory Operations**: List, change, create, and remove directories
- **File Transfer**: Binary mode upload and download
- **Auto-Reconnect**: Automatic reconnection on connection loss

### 🔌 Static Connection Management
- **Persistent Connections**: Maintain long-lived connections
- **Auto-Reconnect**: Automatic reconnection on failures
- **Connection Pooling**: Efficient resource management
- **Configuration Storage**: Save and restore connections
- **Status Monitoring**: Real-time connection status tracking

### 🎨 Web UI Interface
- **Modern Dashboard**: Beautiful, responsive web interface
- **Real-time Status**: Live connection status updates
- **File Browser**: Browse remote filesystems
- **Connection Manager**: Create, edit, and manage connections
- **Statistics Dashboard**: Network usage and performance metrics

## Architecture

```
One2lvOS/
├── services/
│   ├── mesh-routing.js           # Core mesh routing engine
│   ├── network-service.js         # Main network service
│   └── protocols/
│       ├── webdav-handler.js      # WebDAV protocol handler
│       └── ftp-handler.js         # FTP protocol handler
├── server/
│   └── network-api.js             # Express API server
├── config/
│   └── connections.json           # Saved connections
└── network-manager.html           # Web UI interface
```

## Installation

1. Install dependencies:
```bash
cd One2lvos
npm install express cors
```

2. Start the network service:
```bash
node server/network-api.js
```

The service will start on port 3003 by default.

## Usage

### Access the Web UI

Open your browser and navigate to:
```
http://localhost:3003/network-manager.html
```

### API Endpoints

#### Connection Management

**Get all connections:**
```bash
GET /api/network/connections
```

**Create new connection:**
```bash
POST /api/network/connections
Content-Type: application/json

{
  "protocol": "webdav",
  "host": "example.com",
  "port": 443,
  "path": "/webdav",
  "credentials": {
    "username": "user",
    "password": "pass"
  },
  "persistent": true,
  "autoReconnect": true
}
```

**Connect to a connection:**
```bash
POST /api/network/connections/{id}/connect
```

**Disconnect from a connection:**
```bash
POST /api/network/connections/{id}/disconnect
```

**Delete connection:**
```bash
DELETE /api/network/connections/{id}
```

**Test connection:**
```bash
POST /api/network/test
Content-Type: application/json

{
  "protocol": "ftp",
  "host": "ftp.example.com",
  "port": 21,
  "credentials": {
    "username": "user",
    "password": "pass"
  }
}
```

#### WebDAV Operations

**List directory:**
```bash
GET /api/network/connections/{id}/webdav/list?path=/documents
```

**Download file:**
```bash
GET /api/network/connections/{id}/webdav/get?path=/documents/file.pdf
```

**Upload file:**
```bash
PUT /api/network/connections/{id}/webdav/put?path=/documents/file.pdf
Content-Type: application/octet-stream

[file data]
```

**Delete file/directory:**
```bash
DELETE /api/network/connections/{id}/webdav/delete?path=/documents/old-file.pdf
```

**Create directory:**
```bash
POST /api/network/connections/{id}/webdav/mkdir
Content-Type: application/json

{
  "path": "/documents/new-folder"
}
```

#### FTP Operations

**List directory:**
```bash
GET /api/network/connections/{id}/ftp/list?path=/uploads
```

**Download file:**
```bash
GET /api/network/connections/{id}/ftp/get?path=/uploads/file.txt
```

**Upload file:**
```bash
PUT /api/network/connections/{id}/ftp/put?path=/uploads/file.txt
Content-Type: application/octet-stream

[file data]
```

**Delete file:**
```bash
DELETE /api/network/connections/{id}/ftp/delete?path=/uploads/old-file.txt
```

**Create directory:**
```bash
POST /api/network/connections/{id}/ftp/mkdir
Content-Type: application/json

{
  "path": "/uploads/new-folder"
}
```

**Change directory:**
```bash
POST /api/network/connections/{id}/ftp/cwd
Content-Type: application/json

{
  "path": "/uploads"
}
```

**Get current directory:**
```bash
GET /api/network/connections/{id}/ftp/pwd
```

## Configuration

### Environment Variables

```bash
# Network API port
NETWORK_API_PORT=3003

# Enable debug logging
DEBUG=network:*
```

### Connection Configuration

Connections are automatically saved to `config/connections.json`:

```json
{
  "connections": [
    {
      "id": "conn_1234567890_abc123",
      "protocol": "webdav",
      "host": "example.com",
      "port": 443,
      "path": "/webdav",
      "credentials": {
        "username": "user",
        "password": "encrypted_password"
      },
      "persistent": true,
      "autoReconnect": true
    }
  ]
}
```

## Mesh Routing

The mesh routing system allows you to create complex network topologies:

```javascript
const { getNetworkService } = require('./services/network-service');

const service = getNetworkService();
await service.initialize();

// Register nodes
service.router.registerNode('node1', {
  name: 'Server 1',
  type: 'server',
  capabilities: ['webdav', 'ftp']
});

service.router.registerNode('node2', {
  name: 'Server 2',
  type: 'server',
  capabilities: ['webdav']
});

// Route data through the mesh
await service.router.route('node1', 'node2', data);
```

## Protocol Handlers

### Creating Custom Protocol Handlers

You can extend the system with custom protocol handlers:

```javascript
class CustomProtocolHandler {
  constructor() {
    this.name = 'custom';
  }

  async connect(connection) {
    // Implement connection logic
    return sessionHandle;
  }

  async disconnect(handle) {
    // Implement disconnection logic
  }

  // Add protocol-specific methods
}

// Register the handler
service.router.registerProtocol('custom', new CustomProtocolHandler());
```

## Security Considerations

1. **Credentials Storage**: Implement encryption for stored credentials
2. **TLS/SSL**: Always use secure protocols (HTTPS, FTPS) in production
3. **Authentication**: Implement proper authentication for the API
4. **Input Validation**: All user inputs are validated
5. **Network Isolation**: Run in isolated network environments when possible

## Performance Optimization

- **Connection Pooling**: Reuse existing connections
- **Lazy Loading**: Load files on-demand
- **Caching**: Implement caching for frequently accessed data
- **Batch Operations**: Group multiple operations when possible

## Troubleshooting

### Connection Fails

1. Check network connectivity
2. Verify credentials
3. Ensure correct port and protocol
4. Check firewall settings

### WebDAV Issues

- Ensure server supports WebDAV
- Check PROPFIND depth limits
- Verify authentication method

### FTP Issues

- Try passive mode (enabled by default)
- Check NAT/firewall configuration
- Verify binary mode support

## Examples

### Create WebDAV Connection

```javascript
const connection = await service.createConnection({
  protocol: 'webdav',
  host: 'cloud.example.com',
  port: 443,
  path: '/remote.php/webdav/',
  credentials: {
    username: 'user@example.com',
    password: 'app-password'
  },
  persistent: true,
  autoReconnect: true
});
```

### Create FTP Connection

```javascript
const connection = await service.createConnection({
  protocol: 'ftp',
  host: 'ftp.example.com',
  port: 21,
  credentials: {
    username: 'ftpuser',
    password: 'ftppass'
  },
  persistent: true,
  autoReconnect: true
});
```

### List Remote Files

```javascript
// WebDAV
const files = await service.webdavList(connectionId, '/documents');

// FTP
const files = await service.ftpList(connectionId, '/uploads');
```

### Download File

```javascript
// WebDAV
const data = await service.webdavGet(connectionId, '/documents/file.pdf');

// FTP
const data = await service.ftpGet(connectionId, '/uploads/file.txt');
```

### Upload File

```javascript
// WebDAV
await service.webdavPut(connectionId, '/documents/new-file.pdf', fileData);

// FTP
await service.ftpPut(connectionId, fileData, '/uploads/new-file.txt');
```

## Integration with One2lvOS

The network service integrates seamlessly with the One2lvOS dashboard:

1. Access from the main dashboard
2. Unified authentication
3. Shared configuration
4. Cross-service communication

## Future Enhancements

- [ ] SFTP protocol support
- [ ] S3-compatible storage support
- [ ] Network traffic encryption
- [ ] Advanced routing algorithms
- [ ] Load balancing
- [ ] Failover mechanisms
- [ ] Connection monitoring and alerts
- [ ] Bandwidth throttling
- [ ] File synchronization
- [ ] Scheduled transfers

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions:
- GitHub: https://github.com/one2lv-com/One2lvos
- Discord: https://discord.gg/one2lv

---

**One2lvOS Network Service** - Built with ❤️ by One2lv
