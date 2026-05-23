-- supabase_migrations/20260522_add_form_scoring.sql
-- Run this in Supabase SQL editor after deploying app changes.

ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS baseline_id TEXT,
  ADD COLUMN IF NOT EXISTS rep_scores JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS defects JSONB DEFAULT '{}'::jsonb;

-- Update the leaderboard view to surface average form score.
DROP VIEW IF EXISTS leaderboard;

CREATE OR REPLACE VIEW leaderboard AS
SELECT
  user_id,
  SUM(reps * (CASE WHEN weight > 0 THEN weight ELSE 1 END)) AS total_volume,
  MAX(score) AS best_score,
  AVG(score) AS avg_score,
  COUNT(id) AS total_workouts
FROM workouts
GROUP BY user_id
ORDER BY total_volume DESC;
