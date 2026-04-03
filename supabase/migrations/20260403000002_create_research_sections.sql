-- supabase/migrations/20260403000002_create_research_sections.sql

CREATE TABLE research_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE research_sections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access sections of their own sessions
CREATE POLICY "Users can access their own session sections" ON research_sections
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM research_sessions 
    WHERE research_sessions.id = research_sections.session_id 
    AND research_sessions.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_research_sections_updated_at
BEFORE UPDATE ON research_sections
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
