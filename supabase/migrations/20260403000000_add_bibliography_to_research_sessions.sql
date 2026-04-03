-- supabase/migrations/20260403000000_add_bibliography_to_research_sessions.sql

ALTER TABLE research_sessions 
ADD COLUMN bibliography JSONB DEFAULT '[]'::jsonb;

-- Optional: Add extra tracking columns if not already present
-- ALTER TABLE research_sessions ADD COLUMN is_completed BOOLEAN DEFAULT false;
-- ALTER TABLE research_sessions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
