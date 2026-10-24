-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mleqofawbgtzolutbmyp/sql/new

CREATE TABLE IF NOT EXISTS public.checkpoints (
  id           BIGSERIAL PRIMARY KEY,
  tag          TEXT        NOT NULL DEFAULT 'heartbeat',
  baseline     FLOAT       NOT NULL DEFAULT 18.0,
  resonance    FLOAT       NOT NULL DEFAULT 73.0,
  system_state TEXT        NOT NULL DEFAULT 'unknown',
  agents_state TEXT        NOT NULL DEFAULT 'unknown',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deploy_log (
  id         BIGSERIAL PRIMARY KEY,
  role       TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deploy_log  ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (bypasses RLS automatically)
-- No extra policies needed for service_role key
