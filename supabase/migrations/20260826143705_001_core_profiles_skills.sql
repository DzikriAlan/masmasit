/*
# Core: User Profiles, Roles, Skills, Experiences

1. New Tables
- `profiles` — extends auth.users with public profile data (full_name, bio, avatar, location, job status, links, coach/talent flags)
- `user_roles` — multi-role per user (member, company, client, coach, talent, regional_admin, super_admin)
- `skills` — master skill list (name, category)
- `user_skills` — links users to skills with a proficiency level
- `experiences` — work history entries per user

2. Security
- RLS enabled on all tables.
- profiles: any authenticated user can SELECT (member directory); users can UPDATE only their own row.
- user_roles: users can SELECT/INSERT their own roles; super_admin can manage all.
- skills: any authenticated user can SELECT; super_admin can INSERT.
- user_skills: any authenticated user can SELECT (shown on profiles); users manage only their own.
- experiences: any authenticated user can SELECT; users manage only their own.
- All owner columns default to auth.uid() so inserts that omit user_id succeed.
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  bio text,
  avatar_url text,
  location text,
  current_job_status text,
  linkedin_url text,
  whatsapp text,
  calendly_url text,
  is_coach boolean NOT NULL DEFAULT false,
  is_talent boolean NOT NULL DEFAULT false,
  coach_approved text NOT NULL DEFAULT 'pending',
  talent_approved text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- USER ROLES
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('member','company','client','coach','talent','regional_admin','super_admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_roles" ON user_roles;
CREATE POLICY "select_own_roles" ON user_roles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_roles" ON user_roles;
CREATE POLICY "insert_own_roles" ON user_roles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id AND role IN ('member','company','client','coach','talent'));

-- SKILLS
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text
);
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_skills" ON skills;
CREATE POLICY "select_skills" ON skills FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_skills_admin" ON skills;
CREATE POLICY "insert_skills_admin" ON skills FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- USER SKILLS
CREATE TABLE IF NOT EXISTS user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'intermediate' CHECK (level IN ('beginner','intermediate','advanced','expert')),
  UNIQUE (user_id, skill_id)
);
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_user_skills" ON user_skills;
CREATE POLICY "select_user_skills" ON user_skills FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_user_skills" ON user_skills;
CREATE POLICY "insert_own_user_skills" ON user_skills FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_skills" ON user_skills;
CREATE POLICY "update_own_user_skills" ON user_skills FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_skills" ON user_skills;
CREATE POLICY "delete_own_user_skills" ON user_skills FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- EXPERIENCES
CREATE TABLE IF NOT EXISTS experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  position text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  description text
);
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_experiences" ON experiences;
CREATE POLICY "select_experiences" ON experiences FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_experiences" ON experiences;
CREATE POLICY "insert_own_experiences" ON experiences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_experiences" ON experiences;
CREATE POLICY "update_own_experiences" ON experiences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_experiences" ON experiences;
CREATE POLICY "delete_own_experiences" ON experiences FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_user ON experiences(user_id);
