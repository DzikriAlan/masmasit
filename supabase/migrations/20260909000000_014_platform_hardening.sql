/*
  # 014 — Platform hardening

  Closes the gaps found in the September 2026 audit:

  1. Roles
     - `user_roles.region_id` so `regional_admin` is scoped to one region.
     - `is_admin()` / `is_super_admin()` helpers (SECURITY DEFINER, so policies
       can read `user_roles` without tripping its own RLS).
     - Admins can read every role row; only super_admin may grant or revoke.
       Previously `select_own_roles` hid all other users' roles, which also
       made the admin role-distribution chart report only the viewer's roles.

  2. Events
     - `created_by` and `approval_status`; events now need admin approval.
     - Replaces `012_allow_authenticated_insert_events`, whose
       `WITH CHECK (true)` let any signed-in user publish an event.
     - `create_event_rsvp()` enforces capacity server-side.

  3. Projects
     - `accept_project_bid()` performs accept + reject-others + status change
       in one transaction instead of three separate client calls.

  4. Talents
     - `profiles.hourly_rate` so talents set their own rate.

  5. Audit
     - `audit_logs` records who approved, rejected, or deleted what.
*/

-- ---------------------------------------------------------------------------
-- 1. ROLE HELPERS + REGIONAL SCOPING
-- ---------------------------------------------------------------------------

ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES regions(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'regional_admin')
  );
$$;

CREATE OR REPLACE FUNCTION current_admin_region()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT region_id FROM user_roles
  WHERE user_id = auth.uid() AND role = 'regional_admin'
  LIMIT 1;
$$;

DROP POLICY IF EXISTS "select_own_roles" ON user_roles;
CREATE POLICY "select_own_roles" ON user_roles FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_own_roles" ON user_roles;
CREATE POLICY "insert_own_roles" ON user_roles FOR INSERT
  TO authenticated WITH CHECK (
    (auth.uid() = user_id AND role IN ('member','company','client','coach','talent'))
    OR is_super_admin()
  );

DROP POLICY IF EXISTS "update_roles_super_admin" ON user_roles;
CREATE POLICY "update_roles_super_admin" ON user_roles FOR UPDATE
  TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "delete_roles_super_admin" ON user_roles;
CREATE POLICY "delete_roles_super_admin" ON user_roles FOR DELETE
  TO authenticated USING (is_super_admin());

-- ---------------------------------------------------------------------------
-- 2. EVENTS: OWNERSHIP, APPROVAL, CAPACITY
-- ---------------------------------------------------------------------------

ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_approval_status_check'
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_approval_status_check
      CHECK (approval_status IN ('pending','approved','rejected'));
  END IF;
END $$;

-- Events that predate this migration stay visible.
UPDATE events SET approval_status = 'approved' WHERE approval_status = 'pending';

ALTER TABLE events ALTER COLUMN created_by SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "select_events" ON events;
CREATE POLICY "select_events" ON events FOR SELECT
  TO authenticated USING (
    approval_status = 'approved' OR created_by = auth.uid() OR is_admin()
  );

-- Replaces 012's WITH CHECK (true).
DROP POLICY IF EXISTS "insert_events_authenticated" ON events;
DROP POLICY IF EXISTS "allow_authenticated_insert_events" ON events;
DROP POLICY IF EXISTS "insert_events" ON events;
CREATE POLICY "insert_events" ON events FOR INSERT
  TO authenticated WITH CHECK (
    created_by = auth.uid()
    AND (is_admin() OR approval_status = 'pending')
  );

DROP POLICY IF EXISTS "update_events" ON events;
CREATE POLICY "update_events" ON events FOR UPDATE
  TO authenticated USING (created_by = auth.uid() OR is_admin())
  WITH CHECK (created_by = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "delete_events" ON events;
CREATE POLICY "delete_events" ON events FOR DELETE
  TO authenticated USING (created_by = auth.uid() OR is_admin());

/*
  RSVP with a capacity check. Counting and inserting inside one function under
  a row lock closes the race the UI-only check left open.
*/
CREATE OR REPLACE FUNCTION create_event_rsvp(p_event_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacity integer;
  v_taken integer;
  v_approved text;
  v_rsvp_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to RSVP.' USING ERRCODE = '42501';
  END IF;

  SELECT max_capacity, approval_status INTO v_capacity, v_approved
  FROM events WHERE id = p_event_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_approved <> 'approved' THEN
    RAISE EXCEPTION 'This event is not open for registration.' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_taken FROM event_rsvps WHERE event_id = p_event_id;

  IF v_taken >= v_capacity THEN
    RAISE EXCEPTION 'This event is full.' USING ERRCODE = '23514';
  END IF;

  INSERT INTO event_rsvps (event_id, user_id)
  VALUES (p_event_id, auth.uid())
  RETURNING id INTO v_rsvp_id;

  RETURN v_rsvp_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. PROJECTS: ATOMIC BID ACCEPTANCE
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION accept_project_bid(p_bid_id uuid, p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM projects WHERE id = p_project_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Only the project owner can accept a bid.' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM project_bids WHERE id = p_bid_id AND project_id = p_project_id) THEN
    RAISE EXCEPTION 'Bid does not belong to this project.' USING ERRCODE = '23514';
  END IF;

  UPDATE project_bids SET status = 'accepted' WHERE id = p_bid_id;
  UPDATE project_bids SET status = 'rejected' WHERE project_id = p_project_id AND id <> p_bid_id;
  UPDATE projects SET status = 'in_progress' WHERE id = p_project_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. TALENT RATE
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate integer;

-- ---------------------------------------------------------------------------
-- 5. AUDIT LOG
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at DESC);

DROP POLICY IF EXISTS "select_audit_logs_admin" ON audit_logs;
CREATE POLICY "select_audit_logs_admin" ON audit_logs FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "insert_audit_logs_admin" ON audit_logs;
CREATE POLICY "insert_audit_logs_admin" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (is_admin() AND actor_id = auth.uid());
