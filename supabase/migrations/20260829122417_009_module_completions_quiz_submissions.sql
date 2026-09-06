/*
# Module Completions & Quiz Submissions Persistence

## What this migration does

1. New Tables
- `module_completions`: Records which course modules a user has completed.
  - `id` (uuid, primary key)
  - `enrollment_id` (uuid, FK to enrollments, ON DELETE CASCADE)
  - `module_id` (uuid, FK to course_modules, ON DELETE CASCADE)
  - `user_id` (uuid, NOT NULL, DEFAULT auth.uid())
  - `completed_at` (timestamptz, default now())
  - Unique constraint on (enrollment_id, module_id) to prevent duplicates.

- `quiz_submissions`: Records quiz attempts with scores.
  - `id` (uuid, primary key)
  - `quiz_id` (uuid, FK to quizzes, ON DELETE CASCADE)
  - `user_id` (uuid, NOT NULL, DEFAULT auth.uid())
  - `score` (integer, not null)
  - `passed` (boolean, not null)
  - `answers` (jsonb, stores the user's answer selections)
  - `created_at` (timestamptz, default now())

2. Security
- Both tables have RLS enabled.
- Owner-scoped CRUD: authenticated users can only access their own rows.
- SELECT, INSERT, UPDATE, DELETE policies for each table scoped to auth.uid() = user_id.
*/

CREATE TABLE IF NOT EXISTS module_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(enrollment_id, module_id)
);

ALTER TABLE module_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_module_completions" ON module_completions;
CREATE POLICY "select_own_module_completions" ON module_completions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_module_completions" ON module_completions;
CREATE POLICY "insert_own_module_completions" ON module_completions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_module_completions" ON module_completions;
CREATE POLICY "update_own_module_completions" ON module_completions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_module_completions" ON module_completions;
CREATE POLICY "delete_own_module_completions" ON module_completions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS quiz_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL,
  passed boolean NOT NULL,
  answers jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_quiz_submissions" ON quiz_submissions;
CREATE POLICY "select_own_quiz_submissions" ON quiz_submissions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_quiz_submissions" ON quiz_submissions;
CREATE POLICY "insert_own_quiz_submissions" ON quiz_submissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_quiz_submissions" ON quiz_submissions;
CREATE POLICY "update_own_quiz_submissions" ON quiz_submissions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_quiz_submissions" ON quiz_submissions;
CREATE POLICY "delete_own_quiz_submissions" ON quiz_submissions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_module_completions_enrollment ON module_completions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_quiz ON quiz_submissions(user_id, quiz_id);
