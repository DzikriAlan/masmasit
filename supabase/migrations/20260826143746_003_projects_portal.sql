/*
# Projects: Project Portal with Bids and Reviews

1. New Tables
- `projects` — member-posted projects (title, description, budget, deadline, status)
- `project_bids` — bids by other members on projects
- `project_reviews` — two-way reviews after project completion

2. Security
- projects: any authenticated user can SELECT; owner can INSERT/UPDATE/DELETE own.
- project_bids: any authenticated user can SELECT; bidder can INSERT own; project owner can UPDATE (accept/reject bids).
- project_reviews: any authenticated user can SELECT; project owner or assigned freelancer can INSERT; reviewer can manage own review.
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  budget_min integer,
  budget_max integer,
  deadline date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_projects" ON projects;
CREATE POLICY "select_projects" ON projects FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- PROJECT BIDS
CREATE TABLE IF NOT EXISTS project_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  proposal text NOT NULL,
  eta_days integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
ALTER TABLE project_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_project_bids" ON project_bids;
CREATE POLICY "select_project_bids" ON project_bids FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_bid" ON project_bids;
CREATE POLICY "insert_own_bid" ON project_bids FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_bid_owner" ON project_bids;
CREATE POLICY "update_bid_owner" ON project_bids FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "update_own_bid" ON project_bids;
CREATE POLICY "update_own_bid" ON project_bids FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PROJECT REVIEWS
CREATE TABLE IF NOT EXISTS project_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, reviewer_id)
);
ALTER TABLE project_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_project_reviews" ON project_reviews;
CREATE POLICY "select_project_reviews" ON project_reviews FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_review" ON project_reviews;
CREATE POLICY "insert_own_review" ON project_reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "delete_own_review" ON project_reviews;
CREATE POLICY "delete_own_review" ON project_reviews FOR DELETE
  TO authenticated USING (auth.uid() = reviewer_id);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_bids_project ON project_bids(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_project ON project_reviews(project_id);
