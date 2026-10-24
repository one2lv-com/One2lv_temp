/**
 * Interplanetary-disk Vector Memory System
 * =========================================
 * Real vector database with embeddings, similarity search, and persistence
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

/**
 * Vector Operations (Real implementations)
 */
class VectorOps {
    /**
     * Cosine similarity between two vectors
     */
    static cosineSimilarity(vec1, vec2) {
        if (vec1.length !== vec2.length) {
            throw new Error('Vectors must have same dimensions');
        }

        let dotProduct = 0;
        let mag1 = 0;
        let mag2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            mag1 += vec1[i] * vec1[i];
            mag2 += vec2[i] * vec2[i];
        }

        mag1 = Math.sqrt(mag1);
        mag2 = Math.sqrt(mag2);

        if (mag1 === 0 || mag2 === 0) return 0;

        return dotProduct / (mag1 * mag2);
    }

    /**
     * Euclidean distance
     */
    static euclideanDistance(vec1, vec2) {
        if (vec1.length !== vec2.length) {
            throw new Error('Vectors must have same dimensions');
        }

        let sum = 0;
        for (let i = 0; i < vec1.length; i++) {
            const diff = vec1[i] - vec2[i];
            sum += diff * diff;
        }

        return Math.sqrt(sum);
    }

    /**
     * Dot product
     */
    static dotProduct(vec1, vec2) {
        if (vec1.length !== vec2.length) {
            throw new Error('Vectors must have same dimensions');
        }

        let sum = 0;
        for (let i = 0; i < vec1.length; i++) {
            sum += vec1[i] * vec2[i];
        }

        return sum;
    }

    /**
     * Normalize vector
     */
    static normalize(vec) {
        const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
        if (magnitude === 0) return vec;
        return vec.map(val => val / magnitude);
    }
}

/**
 * Simple Embedding Generator (fallback)
 * In production, use NVIDIA NIM or similar
 */
class SimpleEmbedding {
    constructor(dimensions = 384) {
        this.dimensions = dimensions;
    }

    /**
     * Generate embedding for text (simple hash-based for demo)
     * In production, replace with real embedding model
     */
    async generate(text) {
        // Simple deterministic embedding based on text
        const hash = crypto.createHash('sha256').update(text).digest();
        const embedding = [];

        // Generate deterministic vector from hash
        for (let i = 0; i < this.dimensions; i++) {
            const value = hash[i % hash.length] / 255;
            // Add some variation based on text length and position
            const variation = Math.sin(text.length + i) * 0.1;
            embedding.push(value + variation);
        }

        // Normalize
        return VectorOps.normalize(embedding);
    }

    /**
     * Batch generate embeddings
     */
    async generateBatch(texts) {
        return Promise.all(texts.map(text => this.generate(text)));
    }
}

/**
 * Vector Store (Persistent SQLite-based)
 */
class VectorStore {
    constructor(dbPath = './vector_memory.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.embedder = new SimpleEmbedding(384);
        this.initialized = false;
    }

    /**
     * Initialize database
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Create vectors table
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS vectors (
                        id TEXT PRIMARY KEY,
                        content TEXT NOT NULL,
                        embedding TEXT NOT NULL,
                        namespace TEXT DEFAULT 'default',
                        metadata TEXT,
                        created_at INTEGER DEFAULT (strftime('%s', 'now'))
                    )
                `, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Create index on namespace
                    this.db.run(`
                        CREATE INDEX IF NOT EXISTS idx_namespace
                        ON vectors(namespace)
                    `, (err) => {
                        if (err) reject(err);
                        else {
                            this.initialized = true;
                            resolve();
                        }
                    });
                });
            });
        });
    }

    /**
     * Insert vector
     */
    async insert(content, metadata = {}, namespace = 'default') {
        if (!this.initialized) {
            throw new Error('VectorStore not initialized');
        }

        const id = crypto.randomUUID();
        const embedding = await this.embedder.generate(content);

        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO vectors (id, content, embedding, namespace, metadata)
                VALUES (?, ?, ?, ?, ?)
            `, [
                id,
                content,
                JSON.stringify(embedding),
                namespace,
                JSON.stringify(metadata)
            ], function(err) {
                if (err) reject(err);
                else resolve({ id, content, embedding, metadata, namespace });
            });
        });
    }

    /**
     * Batch insert
     */
    async insertBatch(items) {
        const results = [];

        for (const item of items) {
            const result = await this.insert(
                item.content,
                item.metadata || {},
                item.namespace || 'default'
            );
            results.push(result);
        }

        return results;
    }

    /**
     * Search by similarity
     */
    async search(query, options = {}) {
        if (!this.initialized) {
            throw new Error('VectorStore not initialized');
        }

        const {
            top_k = 10,
            namespace = null,
            min_similarity = 0.0,
            metric = 'cosine'
        } = options;

        // Generate query embedding
        const queryEmbedding = await this.embedder.generate(query);

        // Get all vectors (or filtered by namespace)
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM vectors';
            const params = [];

            if (namespace) {
                sql += ' WHERE namespace = ?';
                params.push(namespace);
            }

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Calculate similarities
                const results = rows.map(row => {
                    const embedding = JSON.parse(row.embedding);
                    let similarity;

                    if (metric === 'cosine') {
                        similarity = VectorOps.cosineSimilarity(queryEmbedding, embedding);
                    } else if (metric === 'euclidean') {
                        const distance = VectorOps.euclideanDistance(queryEmbedding, embedding);
                        similarity = 1 / (1 + distance); // Convert distance to similarity
                    } else {
                        similarity = VectorOps.dotProduct(queryEmbedding, embedding);
                    }

                    return {
                        id: row.id,
                        content: row.content,
                        metadata: JSON.parse(row.metadata || '{}'),
                        namespace: row.namespace,
                        similarity,
                        created_at: row.created_at
                    };
                });

                // Filter and sort
                const filtered = results
                    .filter(r => r.similarity >= min_similarity)
                    .sort((a, b) => b.similarity - a.similarity)
                    .slice(0, top_k);

                resolve({
                    query,
                    results: filtered,
                    total_results: results.length,
                    metric
                });
            });
        });
    }

    /**
     * Get vector by ID
     */
    async get(id) {
        if (!this.initialized) {
            throw new Error('VectorStore not initialized');
        }

        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM vectors WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(null);
                } else {
                    resolve({
                        id: row.id,
                        content: row.content,
                        embedding: JSON.parse(row.embedding),
                        metadata: JSON.parse(row.metadata || '{}'),
                        namespace: row.namespace,
                        created_at: row.created_at
                    });
                }
            });
        });
    }

    /**
     * Delete vector
     */
    async delete(id) {
        if (!this.initialized) {
            throw new Error('VectorStore not initialized');
        }

        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM vectors WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ deleted: this.changes > 0, id });
            });
        });
    }

    /**
     * Delete by namespace
     */
    async deleteNamespace(namespace) {
        if (!this.initialized) {
            throw new Error('VectorStore not initialized');
        }

        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM vectors WHERE namespace = ?', [namespace], function(err) {
                if (err) reject(err);
                else resolve({ deleted: this.changes, namespace });
            });
        });
    }

    /**
     * List all namespaces
     */
    async listNamespaces() {
        if (!this.initialized) {
            throw new Error('VectorStore not initialized');
        }

        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT namespace, COUNT(*) as count
                FROM vectors
                GROUP BY namespace
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * Get statistics
     */
    async getStats() {
        if (!this.initialized) {
            throw new Error('VectorStore not initialized');
        }

        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT
                    COUNT(*) as total_vectors,
                    COUNT(DISTINCT namespace) as namespaces,
                    MIN(created_at) as oldest,
                    MAX(created_at) as newest
                FROM vectors
            `, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /**
     * Compact database (vacuum)
     */
    async compact() {
        if (!this.initialized) {
            throw new Error('VectorStore not initialized');
        }

        return new Promise((resolve, reject) => {
            this.db.run('VACUUM', [], (err) => {
                if (err) reject(err);
                else resolve({ compacted: true });
            });
        });
    }

    /**
     * Close database
     */
    async close() {
        if (this.db) {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err) reject(err);
                    else {
                        this.initialized = false;
                        resolve();
                    }
                });
            });
        }
    }
}

/**
 * Memory Manager (High-level interface)
 */
class InterplanetaryDiskMemory {
    constructor(dbPath = './ipd_memory.db') {
        this.store = new VectorStore(dbPath);
        this.initialized = false;
    }

    async initialize() {
        await this.store.initialize();
        this.initialized = true;
        console.log('✓ Interplanetary-disk Vector Memory initialized');
    }

    /**
     * Remember something
     */
    async remember(content, metadata = {}, namespace = 'default') {
        return await this.store.insert(content, {
            ...metadata,
            remembered_at: Date.now()
        }, namespace);
    }

    /**
     * Recall similar memories
     */
    async recall(query, options = {}) {
        return await this.store.search(query, options);
    }

    /**
     * Forget a memory
     */
    async forget(id) {
        return await this.store.delete(id);
    }

    /**
     * Get memory stats
     */
    async stats() {
        const [dbStats, namespaces] = await Promise.all([
            this.store.getStats(),
            this.store.listNamespaces()
        ]);

        return {
            ...dbStats,
            namespaces
        };
    }

    /**
     * Organize memories
     */
    async organize() {
        return await this.store.compact();
    }

    /**
     * Shutdown
     */
    async shutdown() {
        await this.store.close();
        this.initialized = false;
    }
}

module.exports = {
    VectorStore,
    VectorOps,
    SimpleEmbedding,
    InterplanetaryDiskMemory
};
