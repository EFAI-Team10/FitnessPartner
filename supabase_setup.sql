-- Run this in your Supabase SQL Editor

-- 1. Create the workouts table
CREATE TABLE workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL,
  reps INTEGER NOT NULL DEFAULT 0,
  weight INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
-- Users can only insert their own workouts
CREATE POLICY "Users can insert their own workouts"
ON workouts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view all workouts (for leaderboard)
CREATE POLICY "Workouts are viewable by everyone"
ON workouts FOR SELECT
USING (true);

-- 4. Create a view for the leaderboard (optional, but makes querying easier)
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  user_id,
  -- We don't have user profiles yet, so we just group by user_id
  SUM(reps * (CASE WHEN weight > 0 THEN weight ELSE 1 END)) as total_volume,
  MAX(score) as best_score,
  COUNT(id) as total_workouts
FROM workouts
GROUP BY user_id
ORDER BY total_volume DESC;
