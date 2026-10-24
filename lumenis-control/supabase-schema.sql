-- LUMENIS Supabase Database Schema

-- Runtime States Table
CREATE TABLE IF NOT EXISTS runtime_states (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Activity Table
CREATE TABLE IF NOT EXISTS agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  activity JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match History Table
CREATE TABLE IF NOT EXISTS match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legend TEXT NOT NULL,
  opponent_legend TEXT,
  result TEXT,
  stats JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_type TEXT NOT NULL,
  prediction_data JSONB NOT NULL,
  confidence FLOAT,
  actual_outcome TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory Events Table
CREATE TABLE IF NOT EXISTS memory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_activity_timestamp ON agent_activity(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_match_history_timestamp ON match_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON predictions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_memory_events_timestamp ON memory_events(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE runtime_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_events ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - adjust based on your auth requirements)
CREATE POLICY "Allow all operations on runtime_states" ON runtime_states FOR ALL USING (true);
CREATE POLICY "Allow all operations on agent_activity" ON agent_activity FOR ALL USING (true);
CREATE POLICY "Allow all operations on match_history" ON match_history FOR ALL USING (true);
CREATE POLICY "Allow all operations on predictions" ON predictions FOR ALL USING (true);
CREATE POLICY "Allow all operations on memory_events" ON memory_events FOR ALL USING (true);
