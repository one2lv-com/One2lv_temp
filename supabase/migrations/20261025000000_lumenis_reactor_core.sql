-- ============================================================
-- ONE2LVOS: Lumenis Reactor Core — Supabase Schema
-- Run this in Supabase SQL Editor to create required tables
-- ============================================================

-- Reactor state (single-row upsert per core instance)
CREATE TABLE IF NOT EXISTS reactor_states (
    id          TEXT PRIMARY KEY,
    state       JSONB NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reactor tasks
CREATE TABLE IF NOT EXISTS reactor_tasks (
    id          TEXT PRIMARY KEY,
    task_data   JSONB NOT NULL DEFAULT '{}',
    status      TEXT NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reactor_tasks_status ON reactor_tasks (status);
CREATE INDEX IF NOT EXISTS idx_reactor_tasks_created ON reactor_tasks (created_at DESC);

-- Long-term reactor memory
CREATE TABLE IF NOT EXISTS reactor_memory (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Realtime for reactor_states (for live sync across sessions)
ALTER PUBLICATION supabase_realtime ADD TABLE reactor_states;

-- Row Level Security (open read/write for anon — tighten for production)
ALTER TABLE reactor_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactor_tasks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactor_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all reactor_states"  ON reactor_states  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all reactor_tasks"   ON reactor_tasks   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all reactor_memory"  ON reactor_memory  FOR ALL USING (true) WITH CHECK (true);
