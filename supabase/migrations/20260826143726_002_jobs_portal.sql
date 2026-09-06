/*
# Jobs: Companies, Jobs, Applications

1. New Tables
- `companies` — company profiles registered by users, require admin approval
- `jobs` — job postings by approved companies
- `job_applications` — member applications to jobs with tracking status

2. Security
- companies: any authenticated user can SELECT (directory); owner can INSERT/UPDATE own company; super_admin can UPDATE (approval).
- jobs: any authenticated user can SELECT; company owner can INSERT/UPDATE/DELETE their own jobs.
- job_applications: any authenticated user can SELECT (for transparency); user can INSERT own application; company owner can UPDATE status of applications to their jobs.
*/

-- COMPANIES
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  logo_url text,
  website text,
  location text,
  industry text,
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_companies" ON companies;
CREATE POLICY "select_companies" ON companies FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_company" ON companies;
CREATE POLICY "insert_own_company" ON companies FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_company" ON companies;
CREATE POLICY "update_own_company" ON companies FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_company_admin" ON companies;
CREATE POLICY "update_company_admin" ON companies FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

-- JOBS
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  location text,
  job_type text NOT NULL DEFAULT 'full-time' CHECK (job_type IN ('full-time','part-time','contract','internship','remote')),
  salary_min integer,
  salary_max integer,
  deadline date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('draft','open','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_jobs" ON jobs;
CREATE POLICY "select_jobs" ON jobs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_jobs" ON jobs;
CREATE POLICY "insert_own_jobs" ON jobs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_jobs" ON jobs;
CREATE POLICY "update_own_jobs" ON jobs FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_jobs" ON jobs;
CREATE POLICY "delete_own_jobs" ON jobs FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid())
  );

-- JOB APPLICATIONS
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','accepted','rejected')),
  cover_letter text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, user_id)
);
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_job_applications" ON job_applications;
CREATE POLICY "select_job_applications" ON job_applications FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM jobs j
      JOIN companies c ON c.id = j.company_id
      WHERE j.id = job_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_application" ON job_applications;
CREATE POLICY "insert_own_application" ON job_applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_application_status" ON job_applications;
CREATE POLICY "update_application_status" ON job_applications FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN companies c ON c.id = j.company_id
      WHERE j.id = job_id AND c.user_id = auth.uid()
    )
  ) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON job_applications(user_id);
