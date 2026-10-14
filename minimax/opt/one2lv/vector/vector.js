/**
 * One2lvOS Vector Database
 * Phase 4-8: Lightweight vector storage and search
 */

import { embed, cosineSimilarity } from '../ai/llm/llm.js';

const CONFIG = {
  VECTOR_FILE: process.env.VECTOR_FILE || '/opt/one2lv/vector/vectors.json',
  EMBEDDING_DIM: 64,
  TOP_K: 5
};

let vectors = [];

/**
 * Load vectors from file
 */
function loadVectors() {
  try {
    const data = require('fs').readFileSync(CONFIG.VECTOR_FILE, 'utf8');
    vectors = JSON.parse(data);
  } catch {
    vectors = [];
  }
}

/**
 * Save vectors to file
 */
function saveVectors() {
  require('fs').writeFileSync(CONFIG.VECTOR_FILE, JSON.stringify(vectors, null, 2));
}

/**
 * Add vector
 */
function addVector(text, metadata = {}) {
  const embedding = embed(text);

  const vector = {
    id: `vec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text,
    embedding,
    metadata,
    created: Date.now()
  };

  vectors.push(vector);
  saveVectors();

  return vector;
}

/**
 * Search vectors
 */
function search(query, topK = CONFIG.TOP_K) {
  const queryEmbedding = embed(query);
  const results = [];

  for (const vec of vectors) {
    const similarity = cosineSimilarity(queryEmbedding, vec.embedding);
    results.push({
      ...vec,
      similarity
    });
  }

  // Sort by similarity
  results.sort((a, b) => b.similarity - a.similarity);

  return results.slice(0, topK);
}

/**
 * Get all vectors
 */
function getAll() {
  return vectors;
}

/**
 * Delete vector
 */
function deleteVector(id) {
  const index = vectors.findIndex(v => v.id === id);
  if (index !== -1) {
    vectors.splice(index, 1);
    saveVectors();
    return true;
  }
  return false;
}

/**
 * Clear all vectors
 */
function clear() {
  vectors = [];
  saveVectors();
}

/**
 * Get stats
 */
function stats() {
  return {
    count: vectors.length,
    dimension: CONFIG.EMBEDDING_DIM,
    file: CONFIG.VECTOR_FILE
  };
}

export {
  addVector,
  search,
  getAll,
  deleteVector,
  clear,
  stats,
  loadVectors,
  saveVectors
};

export default {
  addVector,
  search,
  getAll,
  deleteVector,
  clear,
  stats
};
