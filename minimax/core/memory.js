import { supabase } from './supabase.js';

// Simple embedding simulation (in production, use OpenAI embeddings)
function simpleEmbed(text) {
  const hash = text.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  // Generate 1536-dimensional vector (simplified)
  const vector = [];
  for (let i = 0; i < 1536; i++) {
    vector.push(Math.sin(hash * (i + 1)) * 0.5 + 0.5);
  }
  return vector;
}

// Store new memory
export async function storeMemory(content, context = '') {
  try {
    // Use in-memory storage if Supabase not available
    if (!supabase) {
      console.log('💾 Memory stored (demo mode):', content.substring(0, 50) + '...');
      return { content, context, id: Date.now() };
    }

    const embedding = simpleEmbed(content);

    const { data, error } = await supabase
      .from('memory')
      .insert({
        content,
        embedding,
        context,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    console.log('💾 Memory stored:', content.substring(0, 50) + '...');
    return data;
  } catch (e) {
    console.log('Memory storage (will create table if needed)');
    return null;
  }
}

// Search memory with similarity
export async function searchMemory(query, limit = 5) {
  try {
    // Return demo data if Supabase not available
    if (!supabase) {
      return [
        { content: `Demo memory for: ${query}`, similarity: 0.8, context: 'demo' }
      ].slice(0, limit);
    }

    const embedding = simpleEmbed(query);

    // Get all memories and calculate similarity
    const { data, error } = await supabase
      .from('memory')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    // Calculate cosine similarity
    const scored = data.map(mem => {
      const memEmbed = mem.embedding || simpleEmbed(mem.content);
      let similarity = 0;

      for (let i = 0; i < Math.min(embedding.length, memEmbed.length); i++) {
        similarity += embedding[i] * memEmbed[i];
      }

      similarity = similarity / Math.sqrt(embedding.length * memEmbed.length);

      return { ...mem, similarity };
    });

    // Sort by similarity and return top results
    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, limit);
  } catch (e) {
    console.log('Memory search (table may not exist yet)');
    return [];
  }
}

// Get context for AI
export async function getContext(query) {
  const memories = await searchMemory(query, 3);
  return memories.map(m => m.content).join('\n\n');
}

// Store game session
export async function storeSession(nodeId, state) {
  try {
    const { data } = await supabase
      .from('sessions')
      .insert({
        node_id: nodeId,
        state,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    return data;
  } catch (e) {
    return null;
  }
}

// Get latest session
export async function getLatestSession(nodeId) {
  try {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('node_id', nodeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data;
  } catch (e) {
    return null;
  }
}

export default {
  storeMemory,
  searchMemory,
  getContext,
  storeSession,
  getLatestSession
};