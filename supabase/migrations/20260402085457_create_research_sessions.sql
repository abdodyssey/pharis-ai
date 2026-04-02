CREATE TABLE research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  initial_topic TEXT,
  refined_title TEXT,
  research_objectives JSONB, -- [cite: 6, 25, 26]
  academic_structure JSONB,  -- [cite: 7, 27, 28]
  current_step INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Individu bisa akses data sendiri" ON research_sessions 
FOR ALL USING (auth.uid() = user_id);