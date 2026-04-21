-- ════════════════════════════════════════════════════════════════
-- MIGRATION: Add unique constraint to prevent duplicate research sections
-- ════════════════════════════════════════════════════════════════
-- 
-- Problem: Multiple Bab entries (9, 10, 11+) were being created for a single
-- research session due to race conditions between:
--   1. Edge Function (research-builder) inserting 4 base sections
--   2. ensureIMRADStructure() inserting missing sections on workspace mount
--   3. React StrictMode / multiple re-renders causing duplicate calls
--
-- Solution: Database-level unique constraint as the final safety net.
-- ════════════════════════════════════════════════════════════════

-- Step 1: Clean up existing duplicates (keep the one with most content)
-- This CTE identifies duplicate rows and deletes all but the best version.
WITH ranked AS (
  SELECT 
    id,
    session_id,
    title,
    ROW_NUMBER() OVER (
      PARTITION BY session_id, LOWER(title)
      ORDER BY LENGTH(COALESCE(content, '')) DESC, created_at ASC
    ) AS rn
  FROM research_sections
)
DELETE FROM research_sections
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

-- Step 2: Add unique constraint on (session_id, title)
-- Using title instead of order_index because the Edge Function doesn't always
-- set order_index consistently, but titles are always from FIXED_IMRAD.
ALTER TABLE research_sections 
  ADD CONSTRAINT unique_section_per_session 
  UNIQUE (session_id, title);

-- Step 3 (Optional): Add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_research_sections_session 
  ON research_sections(session_id, order_index);

-- Verify: Count sections per session (should all be <= 7)
-- SELECT session_id, COUNT(*) as section_count 
-- FROM research_sections 
-- GROUP BY session_id 
-- HAVING COUNT(*) > 7;
