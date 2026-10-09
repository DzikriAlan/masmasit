-- =============================================================================
-- 032: Team Builder invitations + owner edits, Team Collabs owner edit while
-- open, and agency-owner self-service (WhatsApp number, profile edit).
--
-- Depends on 029 for notify_user_i18n(target_uid, n_type, title_en, body_en,
-- title_id, body_id, n_link). 029 already notifies on team_collabs matched and
-- agency approval, and 028 guards INSERT on agencies/team_collabs - neither is
-- repeated here. Everything below is idempotent.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TEAM MEMBERS - invite / accept instead of owner-adds-directly.
--    The column is added with DEFAULT 'active' so every pre-existing row is
--    backfilled as an active member, then the default flips to 'invited'.
-- ---------------------------------------------------------------------------

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE team_members ALTER COLUMN status SET DEFAULT 'invited';

ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_status_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_status_check
  CHECK (status IN ('invited','active'));

-- A row the owner creates for someone else is always an invitation; the
-- owner adding themselves (or an admin seeding data) may be active straight
-- away. Runs regardless of what the client sent.
CREATE OR REPLACE FUNCTION guard_team_member_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id = auth.uid() THEN
    NEW.status := 'active';
  ELSE
    NEW.status := 'invited';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_team_member_insert ON team_members;
CREATE TRIGGER guard_team_member_insert BEFORE INSERT ON team_members
  FOR EACH ROW EXECUTE FUNCTION guard_team_member_insert();

-- Owner may edit role_title; the invitee may only move their own status
-- from invited -> active. Nobody but an admin may repoint team/user.
CREATE OR REPLACE FUNCTION guard_team_member_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_owner boolean;
BEGIN
  IF is_admin() THEN
    RETURN NEW;
  END IF;

  NEW.team_id := OLD.team_id;
  NEW.user_id := OLD.user_id;

  SELECT EXISTS (SELECT 1 FROM teams WHERE id = OLD.team_id AND owner_id = auth.uid()) INTO v_is_owner;

  IF NOT v_is_owner THEN
    NEW.role_title := OLD.role_title;
  END IF;

  IF OLD.user_id IS DISTINCT FROM auth.uid() THEN
    -- Only the invitee can accept their own invitation.
    NEW.status := OLD.status;
  ELSIF NOT (OLD.status = 'invited' AND NEW.status = 'active') THEN
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_team_member_update ON team_members;
CREATE TRIGGER guard_team_member_update BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION guard_team_member_update();

DROP POLICY IF EXISTS "update_team_members_owner" ON team_members;
CREATE POLICY "update_team_members_owner" ON team_members FOR UPDATE
  TO authenticated USING (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()))
  WITH CHECK (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

-- Invitee accepts (invited -> active, enforced by the trigger above).
DROP POLICY IF EXISTS "update_own_team_membership" ON team_members;
CREATE POLICY "update_own_team_membership" ON team_members FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Invitee declines / member leaves the team.
DROP POLICY IF EXISTS "delete_own_team_membership" ON team_members;
CREATE POLICY "delete_own_team_membership" ON team_members FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- `select_teams` already admits anyone with a team_members row via
-- is_team_member(), which covers invited rows - so an invitee can open the
-- team page to accept or decline. Re-declared here so the intent is explicit.
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

-- Invitation -> notification to the invitee, linking to the team page.
CREATE OR REPLACE FUNCTION trg_notify_team_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_name text;
BEGIN
  IF NEW.status = 'invited' THEN
    SELECT name INTO v_team_name FROM teams WHERE id = NEW.team_id;
    PERFORM notify_user_i18n(
      NEW.user_id,
      'team_invite',
      'Team invitation',
      'You were invited to join ' || COALESCE(v_team_name, 'a team') || ' as ' || NEW.role_title || '.',
      'Undangan tim',
      'Kamu diundang bergabung ke ' || COALESCE(v_team_name, 'sebuah tim') || ' sebagai ' || NEW.role_title || '.',
      '/team-builder/' || NEW.team_id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_team_member_invite ON team_members;
CREATE TRIGGER on_team_member_invite AFTER INSERT ON team_members
  FOR EACH ROW EXECUTE FUNCTION trg_notify_team_invite();

-- Roster now carries each row's status. Grade is only computed for active
-- members (an invitee is not on the team yet), and the roster is only
-- returned to someone who can see the team itself. Return type changes, so
-- the function has to be dropped first.
DROP FUNCTION IF EXISTS get_team_roster(uuid);
CREATE FUNCTION get_team_roster(p_team_id uuid)
RETURNS TABLE (
  member_id uuid,
  user_id uuid,
  role_title text,
  grade text,
  full_name text,
  avatar_url text,
  status text
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
    CASE WHEN tm.status = 'active' THEN compute_member_grade(tm.user_id) END,
    p.full_name,
    p.avatar_url,
    tm.status
  FROM team_members tm
  JOIN profiles p ON p.id = tm.user_id
  WHERE tm.team_id = p_team_id
    AND (
      is_admin()
      OR is_team_member(p_team_id)
      OR EXISTS (SELECT 1 FROM teams t WHERE t.id = p_team_id AND t.owner_id = auth.uid())
    )
  ORDER BY (tm.status = 'invited') ASC, tm.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION get_team_roster(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. TEAM COLLABS - owner edits focus/description only while 'open'.
--    (Withdraw is also open -> closed, so it keeps working.)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "update_own_team_collabs" ON team_collabs;
CREATE POLICY "update_own_team_collabs" ON team_collabs FOR UPDATE
  TO authenticated USING (created_by = auth.uid() AND status = 'open')
  WITH CHECK (created_by = auth.uid());

-- update_team_collabs_admin's WITH CHECK (true) is OR'd into every UPDATE,
-- so ownership columns are pinned by trigger rather than by policy.
CREATE OR REPLACE FUNCTION guard_team_collabs_owner_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    NEW.team_id := OLD.team_id;
    NEW.created_by := OLD.created_by;
    IF OLD.status <> 'open' THEN
      NEW.focus := OLD.focus;
      NEW.description := OLD.description;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_team_collabs_owner_edit ON team_collabs;
CREATE TRIGGER guard_team_collabs_owner_edit BEFORE UPDATE ON team_collabs
  FOR EACH ROW EXECUTE FUNCTION guard_team_collabs_owner_edit();

-- ---------------------------------------------------------------------------
-- 3. AGENCIES - own WhatsApp number + owner profile edits at any status.
-- ---------------------------------------------------------------------------

ALTER TABLE agencies ADD COLUMN IF NOT EXISTS whatsapp text;

ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_whatsapp_check;
ALTER TABLE agencies ADD CONSTRAINT agencies_whatsapp_check
  CHECK (whatsapp IS NULL OR whatsapp ~ '^[0-9]{8,15}$');

-- 015's WITH CHECK (approval_status = 'pending') never actually held (the
-- admin policy's WITH CHECK (true) is OR'd in) and would block editing an
-- approved agency's profile anyway. approval_status stays guarded by the
-- guard_agencies_approval trigger from 015.
DROP POLICY IF EXISTS "update_own_agency" ON agencies;
CREATE POLICY "update_own_agency" ON agencies FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- An owner must not be able to promote their agency to "in-house", hand it
-- to someone else, or change the public slug.
CREATE OR REPLACE FUNCTION guard_agency_owner_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    NEW.is_in_house := OLD.is_in_house;
    NEW.owner_id := OLD.owner_id;
    NEW.slug := OLD.slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_agency_owner_columns ON agencies;
CREATE TRIGGER guard_agency_owner_columns BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION guard_agency_owner_columns();

-- agency_services: 015's manage_own_agency_services (FOR ALL, owner of the
-- agency or admin) already gives owners full CRUD - including reading their
-- own inactive rows - so no policy change is needed. Logo uploads reuse the
-- 'company-logos' bucket (010), whose policies allow writes under the
-- uploader's own "{uid}/" folder - exactly the path FileUpload uses.
