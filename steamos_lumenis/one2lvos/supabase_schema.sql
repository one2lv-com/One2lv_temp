-- ONE2LVOS v5 - Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- ==================== MEMORY TABLE ====================
-- Stores AI memory and learning data
CREATE TABLE IF NOT EXISTS memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  context TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_memory_embedding ON memory USING ivfflat (embedding vector_cosine_ops);

-- ==================== SESSIONS TABLE ====================
-- Stores game session state
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id TEXT,
  state JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_node ON sessions(node_id);

-- ==================== LEADERBOARD TABLE ====================
-- Stores player scores and stats
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL UNIQUE,
  score INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  evolution_level INTEGER DEFAULT 1,
  adaptive_behavior JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);

-- ==================== AI MEMORY TABLE ====================
-- Stores AI learning and adaptation data
CREATE TABLE IF NOT EXISTS ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT,
  experience JSONB DEFAULT '[]',
  patterns TEXT[] DEFAULT '{}',
  adaptations JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_player ON ai_memory(player_id);

-- ==================== CHAT HISTORY TABLE ====================
-- Stores conversation history
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT,
  role TEXT DEFAULT 'user',
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_player ON chat_history(player_id);

-- ==================== GAME REPLAYS TABLE ====================
-- Stores game replay data for analysis
CREATE TABLE IF NOT EXISTS game_replays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id TEXT,
  player2_id TEXT,
  winner TEXT,
  replay_data JSONB,
  analysis JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_replays_date ON game_replays(created_at DESC);

-- ==================== MESH NODES TABLE ====================
-- Tracks connected mesh nodes
CREATE TABLE IF NOT EXISTS mesh_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id TEXT UNIQUE NOT NULL,
  url TEXT,
  status TEXT DEFAULT 'active',
  last_seen TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_mesh_nodes_status ON mesh_nodes(status);

-- ==================== FUNCTIONS ====================

-- Function to update leaderboard entry
CREATE OR REPLACE FUNCTION update_leaderboard_entry(
  p_player_name TEXT,
  p_score INTEGER,
  p_result TEXT
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  INSERT INTO leaderboard (player_name, score, wins, losses)
  VALUES (p_player_name, p_score,
    CASE WHEN p_result = 'win' THEN 1 ELSE 0 END,
    CASE WHEN p_result = 'loss' THEN 1 ELSE 0 END)
  ON CONFLICT (player_name) DO UPDATE SET
    score = leaderboard.score + p_score,
    wins = leaderboard.wins + CASE WHEN p_result = 'win' THEN 1 ELSE 0 END,
    losses = leaderboard.losses + CASE WHEN p_result = 'loss' THEN 1 ELSE 0 END,
    win_streak = CASE
      WHEN p_result = 'win' THEN leaderboard.win_streak + 1
      ELSE 0
    END,
    updated_at = NOW()
  RETURNING to_jsonb(leaderboard.*) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to search memory with similarity
CREATE OR REPLACE FUNCTION search_similar_memories(
  query_embedding VECTOR(1536),
  match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  context TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.context,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM memory m
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on tables
ALTER TABLE memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Public access policy (for demo)
CREATE POLICY "Public access" ON memory FOR SELECT USING (true);
CREATE POLICY "Public access" ON sessions FOR SELECT USING (true);
CREATE POLICY "Public access" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Public access" ON ai_memory FOR SELECT USING (true);
CREATE POLICY "Public access" ON chat_history FOR SELECT USING (true);

-- Insert policies
CREATE POLICY "Public insert" ON memory FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert" ON leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert" ON ai_memory FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert" ON chat_history FOR INSERT WITH CHECK (true);

-- Update policies
CREATE POLICY "Public update" ON leaderboard FOR UPDATE USING (true);

console.log('✅ ONE2LVOS Schema applied successfully!');