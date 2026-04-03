-- supabase/migrations/20260403000001_add_extra_columns_to_research_sessions.sql

ALTER TABLE research_sessions 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
