/**
 * One2lvOS FTP Protocol Handler
 * Provides FTP/FTPS client functionality for mesh routing
 */

const net = require('net');
const tls = require('tls');
const { EventEmitter } = require('events');

class FTPHandler extends EventEmitter {
    constructor() {
        super();
        this.name = 'ftp';
        this.sessions = new Map();
    }

    /**
     * Connect to FTP server
     */
    async connect(connection) {
        const { host, port = 21, credentials, secure = false } = connection;

        const session = {
            id: connection.id,
            host,
            port,
            credentials,
            secure,
            socket: null,
            dataSocket: null,
            connected: false,
            currentDir: '/',
            mode: 'passive'
        };

        try {
            await this.connectControl(session);
            await this.login(session);
            this.sessions.set(connection.id, session);
            return session;
        } catch (error) {
            throw new Error(`FTP connection failed: ${error.message}`);
        }
    }

    /**
     * Establish control connection
     */
    async connectControl(session) {
        return new Promise((resolve, reject) => {
            const socket = session.secure
                ? tls.connect(session.port, session.host)
                : net.connect(session.port, session.host);

            socket.setEncoding('utf8');
            session.socket = socket;

            socket.on('connect', () => {
                console.log(`[FTP] Control connection established to ${session.host}:${session.port}`);
            });

            socket.on('data', (data) => {
                console.log('[FTP] <-', data.trim());
                const code = parseInt(data.substring(0, 3));

                if (code === 220) {
                    session.connected = true;
                    resolve();
                }
            });

            socket.on('error', (error) => {
                reject(error);
            });

            socket.on('close', () => {
                session.connected = false;
                console.log('[FTP] Control connection closed');
            });
        });
    }

    /**
     * Login to FTP server
     */
    async login(session) {
        const username = session.credentials?.username || 'anonymous';
        const password = session.credentials?.password || 'anonymous@';

        await this.sendCommand(session, `USER ${username}`);
        await this.sendCommand(session, `PASS ${password}`);

        // Set binary mode
        await this.sendCommand(session, 'TYPE I');
    }

    /**
     * Disconnect from FTP server
     */
    async disconnect(handle) {
        if (!handle || !handle.id) return;

        const session = this.sessions.get(handle.id);
        if (!session) return;

        try {
            await this.sendCommand(session, 'QUIT');
        } catch (error) {
            console.error('[FTP] Error during disconnect:', error);
        }

        if (session.socket) {
            session.socket.destroy();
        }

        this.sessions.delete(handle.id);
    }

    /**
     * Send FTP command
     */
    async sendCommand(session, command, expectCode = null) {
        return new Promise((resolve, reject) => {
            if (!session.socket || !session.connected) {
                return reject(new Error('Not connected'));
            }

            const timeout = setTimeout(() => {
                reject(new Error('Command timeout'));
            }, 30000);

            const onData = (data) => {
                clearTimeout(timeout);
                console.log('[FTP] <-', data.trim());

                const code = parseInt(data.substring(0, 3));
                const message = data.substring(4).trim();

                if (expectCode && code !== expectCode) {
                    session.socket.removeListener('data', onData);
                    reject(new Error(`Expected code ${expectCode}, got ${code}: ${message}`));
                } else if (code >= 400) {
                    session.socket.removeListener('data', onData);
                    reject(new Error(`FTP error ${code}: ${message}`));
                } else {
                    session.socket.removeListener('data', onData);
                    resolve({ code, message, data });
                }
            };

            session.socket.once('data', onData);
            session.socket.write(command + '\r\n');
            console.log('[FTP] ->', command);
        });
    }

    /**
     * Enter passive mode
     */
    async enterPassiveMode(session) {
        const response = await this.sendCommand(session, 'PASV');
        const match = response.message.match(/(\d+),(\d+),(\d+),(\d+),(\d+),(\d+)/);

        if (!match) {
            throw new Error('Failed to parse PASV response');
        }

        const host = `${match[1]}.${match[2]}.${match[3]}.${match[4]}`;
        const port = parseInt(match[5]) * 256 + parseInt(match[6]);

        return { host, port };
    }

    /**
     * List directory contents
     */
    async list(session, path = '.') {
        const pasv = await this.enterPassiveMode(session);

        return new Promise((resolve, reject) => {
            const dataSocket = net.connect(pasv.port, pasv.host);
            let data = '';

            dataSocket.on('data', (chunk) => {
                data += chunk.toString();
            });

            dataSocket.on('end', () => {
                const files = this.parseListResponse(data);
                resolve(files);
            });

            dataSocket.on('error', (error) => {
                reject(error);
            });

            this.sendCommand(session, `LIST ${path}`).catch(reject);
        });
    }

    /**
     * Parse LIST response
     */
    parseListResponse(data) {
        const lines = data.split('\n').filter(line => line.trim());
        const files = [];

        for (const line of lines) {
            const parts = line.split(/\s+/);
            if (parts.length < 9) continue;

            const permissions = parts[0];
            const isDirectory = permissions.startsWith('d');
            const size = parseInt(parts[4]) || 0;
            const name = parts.slice(8).join(' ');

            files.push({
                name,
                size,
                isDirectory,
                permissions,
                type: isDirectory ? 'directory' : 'file'
            });
        }

        return files;
    }

    /**
     * Download file
     */
    async get(session, remotePath, localPath = null) {
        const pasv = await this.enterPassiveMode(session);

        return new Promise((resolve, reject) => {
            const dataSocket = net.connect(pasv.port, pasv.host);
            const chunks = [];

            dataSocket.on('data', (chunk) => {
                chunks.push(chunk);
            });

            dataSocket.on('end', () => {
                const data = Buffer.concat(chunks);
                resolve(data);
            });

            dataSocket.on('error', (error) => {
                reject(error);
            });

            this.sendCommand(session, `RETR ${remotePath}`).catch(reject);
        });
    }

    /**
     * Upload file
     */
    async put(session, localData, remotePath) {
        const pasv = await this.enterPassiveMode(session);

        return new Promise((resolve, reject) => {
            const dataSocket = net.connect(pasv.port, pasv.host);

            dataSocket.on('connect', () => {
                dataSocket.write(localData);
                dataSocket.end();
            });

            dataSocket.on('end', () => {
                resolve();
            });

            dataSocket.on('error', (error) => {
                reject(error);
            });

            this.sendCommand(session, `STOR ${remotePath}`).catch(reject);
        });
    }

    /**
     * Delete file
     */
    async delete(session, remotePath) {
        return this.sendCommand(session, `DELE ${remotePath}`);
    }

    /**
     * Create directory
     */
    async mkdir(session, remotePath) {
        return this.sendCommand(session, `MKD ${remotePath}`);
    }

    /**
     * Remove directory
     */
    async rmdir(session, remotePath) {
        return this.sendCommand(session, `RMD ${remotePath}`);
    }

    /**
     * Change directory
     */
    async cwd(session, remotePath) {
        const response = await this.sendCommand(session, `CWD ${remotePath}`);
        session.currentDir = remotePath;
        return response;
    }

    /**
     * Get current directory
     */
    async pwd(session) {
        const response = await this.sendCommand(session, 'PWD');
        const match = response.message.match(/"(.+)"/);
        return match ? match[1] : '/';
    }

    /**
     * Rename file or directory
     */
    async rename(session, oldPath, newPath) {
        await this.sendCommand(session, `RNFR ${oldPath}`);
        return this.sendCommand(session, `RNTO ${newPath}`);
    }
}

module.exports = FTPHandler;
