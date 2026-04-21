-- supabase/migrations/20260418000000_create_research_progress.sql
-- Tracks the completion status of each of the 7 research lifecycle steps.

CREATE TABLE research_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 7),
  step_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'active', 'completed')),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, step_number)
);

-- Enable RLS
ALTER TABLE research_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage progress of their own sessions
CREATE POLICY "Users can manage progress of their own sessions" ON research_progress
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM research_sessions 
    WHERE research_sessions.id = research_progress.session_id 
    AND research_sessions.user_id = auth.uid()
  )
);

-- Extend current_step range to support 7 steps
-- (No constraint existed before, but we ensure the column supports 1-7)
ALTER TABLE research_sessions 
ALTER COLUMN current_step SET DEFAULT 1;
