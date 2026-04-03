-- Alter table to add title_options
ALTER TABLE research_sessions ADD COLUMN title_options jsonb DEFAULT '[]'::jsonb;
