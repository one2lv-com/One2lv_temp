/**
 * One2lvOS WebDAV Protocol Handler
 * Provides WebDAV client functionality for mesh routing
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class WebDAVHandler {
    constructor() {
        this.name = 'webdav';
        this.sessions = new Map();
    }

    /**
     * Connect to WebDAV server
     */
    async connect(connection) {
        const { host, port, path = '/', credentials } = connection;
        const protocol = port === 443 ? 'https' : 'http';
        const baseUrl = `${protocol}://${host}:${port}${path}`;

        const session = {
            id: connection.id,
            baseUrl,
            credentials,
            connected: true
        };

        // Test connection with PROPFIND
        try {
            await this.propfind(session, '/');
            this.sessions.set(connection.id, session);
            return session;
        } catch (error) {
            throw new Error(`WebDAV connection failed: ${error.message}`);
        }
    }

    /**
     * Disconnect from WebDAV server
     */
    async disconnect(handle) {
        if (handle && handle.id) {
            this.sessions.delete(handle.id);
        }
    }

    /**
     * List directory contents (PROPFIND)
     */
    async propfind(session, remotePath, depth = 1) {
        const url = new URL(remotePath, session.baseUrl);

        const body = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:displayname/>
    <D:getcontentlength/>
    <D:getcontenttype/>
    <D:creationdate/>
    <D:getlastmodified/>
    <D:resourcetype/>
  </D:prop>
</D:propfind>`;

        const options = {
            method: 'PROPFIND',
            headers: {
                'Content-Type': 'application/xml',
                'Content-Length': Buffer.byteLength(body),
                'Depth': depth.toString()
            }
        };

        if (session.credentials) {
            const auth = Buffer.from(
                `${session.credentials.username}:${session.credentials.password}`
            ).toString('base64');
            options.headers['Authorization'] = `Basic ${auth}`;
        }

        return this.request(url, options, body);
    }

    /**
     * Download file (GET)
     */
    async get(session, remotePath) {
        const url = new URL(remotePath, session.baseUrl);

        const options = {
            method: 'GET',
            headers: {}
        };

        if (session.credentials) {
            const auth = Buffer.from(
                `${session.credentials.username}:${session.credentials.password}`
            ).toString('base64');
            options.headers['Authorization'] = `Basic ${auth}`;
        }

        return this.request(url, options);
    }

    /**
     * Upload file (PUT)
     */
    async put(session, remotePath, data) {
        const url = new URL(remotePath, session.baseUrl);

        const options = {
            method: 'PUT',
            headers: {
                'Content-Length': Buffer.byteLength(data)
            }
        };

        if (session.credentials) {
            const auth = Buffer.from(
                `${session.credentials.username}:${session.credentials.password}`
            ).toString('base64');
            options.headers['Authorization'] = `Basic ${auth}`;
        }

        return this.request(url, options, data);
    }

    /**
     * Create directory (MKCOL)
     */
    async mkcol(session, remotePath) {
        const url = new URL(remotePath, session.baseUrl);

        const options = {
            method: 'MKCOL',
            headers: {}
        };

        if (session.credentials) {
            const auth = Buffer.from(
                `${session.credentials.username}:${session.credentials.password}`
            ).toString('base64');
            options.headers['Authorization'] = `Basic ${auth}`;
        }

        return this.request(url, options);
    }

    /**
     * Delete file or directory (DELETE)
     */
    async delete(session, remotePath) {
        const url = new URL(remotePath, session.baseUrl);

        const options = {
            method: 'DELETE',
            headers: {}
        };

        if (session.credentials) {
            const auth = Buffer.from(
                `${session.credentials.username}:${session.credentials.password}`
            ).toString('base64');
            options.headers['Authorization'] = `Basic ${auth}`;
        }

        return this.request(url, options);
    }

    /**
     * Copy file or directory (COPY)
     */
    async copy(session, srcPath, dstPath) {
        const url = new URL(srcPath, session.baseUrl);
        const dstUrl = new URL(dstPath, session.baseUrl);

        const options = {
            method: 'COPY',
            headers: {
                'Destination': dstUrl.href
            }
        };

        if (session.credentials) {
            const auth = Buffer.from(
                `${session.credentials.username}:${session.credentials.password}`
            ).toString('base64');
            options.headers['Authorization'] = `Basic ${auth}`;
        }

        return this.request(url, options);
    }

    /**
     * Move file or directory (MOVE)
     */
    async move(session, srcPath, dstPath) {
        const url = new URL(srcPath, session.baseUrl);
        const dstUrl = new URL(dstPath, session.baseUrl);

        const options = {
            method: 'MOVE',
            headers: {
                'Destination': dstUrl.href
            }
        };

        if (session.credentials) {
            const auth = Buffer.from(
                `${session.credentials.username}:${session.credentials.password}`
            ).toString('base64');
            options.headers['Authorization'] = `Basic ${auth}`;
        }

        return this.request(url, options);
    }

    /**
     * Generic HTTP/HTTPS request wrapper
     */
    async request(url, options, body = null) {
        return new Promise((resolve, reject) => {
            const client = url.protocol === 'https:' ? https : http;

            const req = client.request(url, options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            body: data
                        });
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (body) {
                req.write(body);
            }

            req.end();
        });
    }

    /**
     * Parse WebDAV XML response
     */
    parseXmlResponse(xmlData) {
        // Simple XML parsing for demonstration
        // In production, use a proper XML parser like 'fast-xml-parser'
        const items = [];
        const responseRegex = /<D:response>(.*?)<\/D:response>/gs;
        const matches = xmlData.matchAll(responseRegex);

        for (const match of matches) {
            const responseXml = match[1];
            const hrefMatch = responseXml.match(/<D:href>(.*?)<\/D:href>/);
            const displayNameMatch = responseXml.match(/<D:displayname>(.*?)<\/D:displayname>/);
            const sizeMatch = responseXml.match(/<D:getcontentlength>(.*?)<\/D:getcontentlength>/);
            const typeMatch = responseXml.match(/<D:getcontenttype>(.*?)<\/D:getcontenttype>/);

            if (hrefMatch) {
                items.push({
                    href: hrefMatch[1],
                    name: displayNameMatch ? displayNameMatch[1] : hrefMatch[1],
                    size: sizeMatch ? parseInt(sizeMatch[1]) : 0,
                    type: typeMatch ? typeMatch[1] : 'directory'
                });
            }
        }

        return items;
    }
}

module.exports = WebDAVHandler;
