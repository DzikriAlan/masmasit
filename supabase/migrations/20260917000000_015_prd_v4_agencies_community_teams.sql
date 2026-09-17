-- =============================================================================
-- 015: PRD v4.0 (masmasit/REST.md) — Agency, Team Builder, Team Collabs,
-- Discussions, Builds/Spotlight, Articles, and the "agency_owner" role.
--
-- Scope decisions (documented here since REST.md doesn't specify schema):
--  - Team membership is owner-adds-directly, no invite/accept step.
--  - Spotlight has no table of its own: it is `builds` filtered to
--    `promoted_to_spotlight = true`. A Build's own like count IS its Hot
--    Rank signal — no separate boost mechanism.
--  - Team Collabs matching is admin-mediated (status + free-text
--    `matched_with`), matching the PRD's own human-in-the-loop description
--    ("Tri buatkan grup WA manual") rather than an automated pairing engine.
--  - `compute_member_grade()` reads experiences + user_skills + certificates
--    (the exact three signals REST.md Bagian 8 names) and buckets the score
--    into junior/mid/senior. It is a live function, not a stored column, so
--    a team's roster always reflects the current profile.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. "agency_owner" joins the role vocabulary (REST.md Bagian 8).
-- ---------------------------------------------------------------------------

ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('member','company','client','coach','talent','agency_owner','regional_admin','super_admin'));

-- The CHECK above only says 'agency_owner' is a legal value; migration 014's
-- self-insert policy still names the old role list explicitly and would
-- reject it. Re-declared here with 'agency_owner' added, otherwise the
-- Agency Owner onboarding sub-step can never actually save the role.
DROP POLICY IF EXISTS "insert_own_roles" ON user_roles;
CREATE POLICY "insert_own_roles" ON user_roles FOR INSERT
  TO authenticated WITH CHECK (
    (auth.uid() = user_id AND role IN ('member','company','client','coach','talent','agency_owner'))
    OR is_super_admin()
  );

-- ---------------------------------------------------------------------------
-- 2. AGENCIES — one row per agency, member-owned or the in-house one.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  description text NOT NULL,
  is_in_house boolean NOT NULL DEFAULT false,
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_agencies" ON agencies;
CREATE POLICY "select_agencies" ON agencies FOR SELECT
  TO authenticated USING (approval_status = 'approved' OR owner_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "insert_own_agency" ON agencies;
CREATE POLICY "insert_own_agency" ON agencies FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid() AND is_in_house = false);

DROP POLICY IF EXISTS "update_own_agency" ON agencies;
CREATE POLICY "update_own_agency" ON agencies FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND approval_status = 'pending');

DROP POLICY IF EXISTS "update_agency_admin" ON agencies;
CREATE POLICY "update_agency_admin" ON agencies FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (true);

-- Postgres OR's every applicable policy's WITH CHECK together for the same
-- command, on the same table, regardless of which policy's USING matched —
-- so the admin policy's WITH CHECK (true) above silently overrides
-- update_own_agency's "approval_status = 'pending'" restriction, and an
-- owner's own UPDATE can self-approve. A trigger is the only reliable guard
-- against that: it runs after RLS regardless of which policy let the row
-- through, and reverts the one field a non-admin must never move.
CREATE OR REPLACE FUNCTION guard_agency_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() AND NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    NEW.approval_status := OLD.approval_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_agencies_approval ON agencies;
CREATE TRIGGER guard_agencies_approval BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION guard_agency_approval();

-- `agency_services` (migration 006) already carries the in-house catalogue —
-- give every row a home agency instead of duplicating the table. Existing
-- rows are backfilled onto the seeded in-house agency below.
ALTER TABLE agency_services ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE;

INSERT INTO agencies (id, owner_id, name, slug, description, is_in_house, approval_status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'MasmasIT',
  'masmasit',
  'Agency in-house MasmasIT — tim produk, AI, kreatif dan HR yang membangun bersama klien.',
  true,
  'approved'
)
ON CONFLICT (id) DO NOTHING;

UPDATE agency_services SET agency_id = '00000000-0000-0000-0000-000000000001' WHERE agency_id IS NULL;

DROP POLICY IF EXISTS "select_agency_services" ON agency_services;
CREATE POLICY "select_agency_services" ON agency_services FOR SELECT
  TO authenticated USING (
    is_active = true
    AND agency_id IN (SELECT id FROM agencies WHERE approval_status = 'approved')
  );

DROP POLICY IF EXISTS "manage_own_agency_services" ON agency_services;
CREATE POLICY "manage_own_agency_services" ON agency_services FOR ALL
  TO authenticated USING (
    is_admin() OR agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
  ) WITH CHECK (
    is_admin() OR agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 3. TEAM BUILDER — teams, members with a role title, grade computed live.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Created before the RLS policies below: `select_teams` references
-- `team_members`, so the table has to exist first.
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- `teams` and `team_members` policies each need to check the other table,
-- which is a circular reference Postgres RLS cannot evaluate directly
-- (querying team_members re-enters team_members' own policies, which query
-- teams, which queries team_members again, forever). Same fix already used
-- for is_admin()/is_super_admin() against user_roles: a SECURITY DEFINER
-- function reads team_members with RLS bypassed, so `teams`' policy calls
-- the function instead of querying the table directly.
CREATE OR REPLACE FUNCTION is_team_member(p_team_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM team_members WHERE team_id = p_team_id AND user_id = p_user_id);
$$;

GRANT EXECUTE ON FUNCTION is_team_member(uuid, uuid) TO authenticated;

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_teams" ON teams;
CREATE POLICY "select_teams" ON teams FOR SELECT
  TO authenticated USING (
    owner_id = auth.uid()
    OR is_admin()
    OR is_team_member(id)
  );

DROP POLICY IF EXISTS "insert_own_team" ON teams;
CREATE POLICY "insert_own_team" ON teams FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "update_own_team" ON teams;
CREATE POLICY "update_own_team" ON teams FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_team" ON teams;
CREATE POLICY "delete_own_team" ON teams FOR DELETE
  TO authenticated USING (owner_id = auth.uid());

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_team_members" ON team_members;
CREATE POLICY "select_team_members" ON team_members FOR SELECT
  TO authenticated USING (
    is_admin()
    OR user_id = auth.uid()
    OR team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_team_members_owner" ON team_members;
CREATE POLICY "insert_team_members_owner" ON team_members FOR INSERT
  TO authenticated WITH CHECK (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "delete_team_members_owner" ON team_members;
CREATE POLICY "delete_team_members_owner" ON team_members FOR DELETE
  TO authenticated USING (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

-- Reads experiences + user_skills + certificates — exactly the three
-- signals REST.md Bagian 8 names ("skill, pengalaman, sertifikat") — and
-- buckets a weighted score into junior/mid/senior. SECURITY DEFINER matches
-- the house style of is_admin()/is_super_admin(); the underlying tables are
-- already `USING (true)` for any authenticated reader, so this only adds
-- consistency, not new access.
CREATE OR REPLACE FUNCTION compute_member_grade(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_years numeric;
  v_skill_score numeric;
  v_cert_count int;
  v_score numeric;
BEGIN
  SELECT COALESCE(SUM((COALESCE(end_date, CURRENT_DATE) - start_date) / 365.25), 0)
    INTO v_years FROM experiences WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(CASE level
      WHEN 'expert' THEN 3 WHEN 'advanced' THEN 2 WHEN 'intermediate' THEN 1 ELSE 0.5 END), 0)
    INTO v_skill_score FROM user_skills WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_cert_count FROM certificates WHERE user_id = p_user_id;

  v_score := (v_years * 2) + (v_skill_score * 0.5) + (v_cert_count * 1);

  IF v_score >= 10 THEN RETURN 'senior';
  ELSIF v_score >= 4 THEN RETURN 'mid';
  ELSE RETURN 'junior';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION compute_member_grade(uuid) TO authenticated;

-- Roster in one round trip: member + role + live grade, instead of the
-- client calling compute_member_grade() once per row.
CREATE OR REPLACE FUNCTION get_team_roster(p_team_id uuid)
RETURNS TABLE (
  member_id uuid,
  user_id uuid,
  role_title text,
  grade text,
  full_name text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    tm.id,
    tm.user_id,
    tm.role_title,
    compute_member_grade(tm.user_id),
    p.full_name,
    p.avatar_url
  FROM team_members tm
  JOIN profiles p ON p.id = tm.user_id
  WHERE tm.team_id = p_team_id
  ORDER BY tm.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION get_team_roster(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. TEAM COLLABS — a team registers to build R&D; admin marks the match.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS team_collabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  focus text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','matched','closed')),
  matched_with text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE team_collabs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_team_collabs" ON team_collabs;
CREATE POLICY "select_team_collabs" ON team_collabs FOR SELECT
  TO authenticated USING (status = 'open' OR created_by = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "insert_own_team_collabs" ON team_collabs;
CREATE POLICY "insert_own_team_collabs" ON team_collabs FOR INSERT
  TO authenticated WITH CHECK (
    created_by = auth.uid()
    AND team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_team_collabs" ON team_collabs;
CREATE POLICY "update_own_team_collabs" ON team_collabs FOR UPDATE
  TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "update_team_collabs_admin" ON team_collabs;
CREATE POLICY "update_team_collabs_admin" ON team_collabs FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (true);

-- Same OR-across-policies gap as agencies above: without this trigger, a
-- team could mark its own listing "matched" and fill in matched_with,
-- which is exactly the step REST.md Bagian 6.2 reserves for a human admin
-- ("Tri buatkan grup WA manual"). Owners keep the one self-service move the
-- PRD doesn't reserve for admins — withdrawing an open listing.
CREATE OR REPLACE FUNCTION guard_team_collabs_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() AND (NEW.status = 'matched' OR NEW.matched_with IS DISTINCT FROM OLD.matched_with) THEN
    NEW.status := OLD.status;
    NEW.matched_with := OLD.matched_with;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_team_collabs_match ON team_collabs;
CREATE TRIGGER guard_team_collabs_match BEFORE UPDATE ON team_collabs
  FOR EACH ROW EXECUTE FUNCTION guard_team_collabs_match();

-- ---------------------------------------------------------------------------
-- 5. DISCUSSIONS — topics + comments. `is_featured` is how a thread
--    graduates into Discover's "Tulisan Member" strand (Bagian 3/9).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_discussions" ON discussions;
CREATE POLICY "select_discussions" ON discussions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_discussions" ON discussions;
CREATE POLICY "insert_own_discussions" ON discussions FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_own_discussions" ON discussions;
CREATE POLICY "update_own_discussions" ON discussions FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR is_admin()) WITH CHECK (true);

-- WITH CHECK (true) above lets an author edit their own title/body, which
-- is intended — but it also lets them flip is_featured themselves, the
-- editorial call that promotes a thread into Discover's "Tulisan Member"
-- (Bagian 3/9). Single policy, so (unlike agencies/team_collabs above)
-- there's no second policy to silently OR the check away — a trigger is
-- still the simplest guard against this table's own WITH CHECK (true).
CREATE OR REPLACE FUNCTION guard_discussion_featured()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() AND NEW.is_featured IS DISTINCT FROM OLD.is_featured THEN
    NEW.is_featured := OLD.is_featured;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_discussions_featured ON discussions;
CREATE TRIGGER guard_discussions_featured BEFORE UPDATE ON discussions
  FOR EACH ROW EXECUTE FUNCTION guard_discussion_featured();

DROP POLICY IF EXISTS "delete_own_discussions" ON discussions;
CREATE POLICY "delete_own_discussions" ON discussions FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR is_admin());

CREATE TABLE IF NOT EXISTS discussion_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE discussion_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_discussion_comments" ON discussion_comments;
CREATE POLICY "select_discussion_comments" ON discussion_comments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_discussion_comments" ON discussion_comments;
CREATE POLICY "insert_own_discussion_comments" ON discussion_comments FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_discussion_comments" ON discussion_comments;
CREATE POLICY "delete_own_discussion_comments" ON discussion_comments FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR is_admin());

CREATE INDEX IF NOT EXISTS idx_discussion_comments_discussion ON discussion_comments(discussion_id);

-- ---------------------------------------------------------------------------
-- 6. BUILDS — "what everyone is building". `promoted_to_spotlight = true`
--    is how a row also appears on /spotlight (Bagian 2/9); `likes_count`
--    doubles as Spotlight's Hot Rank signal, so no separate boost table.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id uuid REFERENCES agencies(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  link_url text,
  image_url text,
  source_type text NOT NULL DEFAULT 'build' CHECK (source_type IN ('build','solo_builder','agency')),
  promoted_to_spotlight boolean NOT NULL DEFAULT false,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE builds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_builds" ON builds;
CREATE POLICY "select_builds" ON builds FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_builds" ON builds;
CREATE POLICY "insert_own_builds" ON builds FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND (
      source_type <> 'agency'
      OR agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
    )
  );

-- Re-asserts the same agency-ownership rule insert_own_builds enforces —
-- otherwise an author could UPDATE a build after the fact to point
-- source_type/agency_id at an agency they don't own, impersonating that
-- agency's submission on Spotlight.
DROP POLICY IF EXISTS "update_own_builds" ON builds;
CREATE POLICY "update_own_builds" ON builds FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (
    is_admin()
    OR (
      user_id = auth.uid()
      AND (source_type <> 'agency' OR agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "delete_own_builds" ON builds;
CREATE POLICY "delete_own_builds" ON builds FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR is_admin());

CREATE TABLE IF NOT EXISTS build_likes (
  build_id uuid NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (build_id, user_id)
);

ALTER TABLE build_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_build_likes" ON build_likes;
CREATE POLICY "select_build_likes" ON build_likes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_build_likes" ON build_likes;
CREATE POLICY "insert_own_build_likes" ON build_likes FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_build_likes" ON build_likes;
CREATE POLICY "delete_own_build_likes" ON build_likes FOR DELETE
  TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION trg_build_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE builds SET likes_count = likes_count + 1 WHERE id = NEW.build_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE builds SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.build_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_build_like_insert ON build_likes;
CREATE TRIGGER on_build_like_insert AFTER INSERT ON build_likes
  FOR EACH ROW EXECUTE FUNCTION trg_build_likes_count();

DROP TRIGGER IF EXISTS on_build_like_delete ON build_likes;
CREATE TRIGGER on_build_like_delete AFTER DELETE ON build_likes
  FOR EACH ROW EXECUTE FUNCTION trg_build_likes_count();

-- ---------------------------------------------------------------------------
-- 7. ARTICLES — platform-authored (admin), the "Article" strand of Discover.
--    ("Tulisan Member" is `discussions.is_featured`, not this table.)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  body text NOT NULL,
  cover_image_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_articles" ON articles;
CREATE POLICY "select_articles" ON articles FOR SELECT
  TO authenticated USING (is_published = true OR is_admin());

DROP POLICY IF EXISTS "manage_articles_admin" ON articles;
CREATE POLICY "manage_articles_admin" ON articles FOR ALL
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE INDEX IF NOT EXISTS idx_agency_services_agency ON agency_services(agency_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_builds_spotlight ON builds(promoted_to_spotlight, likes_count DESC);
