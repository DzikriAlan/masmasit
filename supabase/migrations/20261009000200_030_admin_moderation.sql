/*
# 030 - Admin moderation, member suspension, regional scoping

1. Member suspension (TC-09-16)
   - profiles.is_suspended / suspended_reason / suspended_at / suspended_by.
   - Only trusted writers (admins, service role, SECURITY DEFINER code) may
     move them; a member's own UPDATE has them reset by a trigger, same
     pattern as migration 027.
   - The auth-side ban (no login) is applied by the server route with the
     service-role key; these columns are what the directory and the admin
     panel read.

2. Regional scoping (TC-14-04 / TC-14-05)
   - Only events carried a region. profiles.region_id gives every member a
     home region, derived from profiles.location by matching a region name
     (e.g. "Jakarta Selatan" -> Jakarta). Content without its own region
     (jobs, projects, courses, discussions, builds, payments...) belongs to
     its owner's region. The /api/v1/admin routes filter and check on it.
   - Members cannot pick region_id directly; it follows their location.

3. Admin moderation reach
   - jobs / projects / courses only had owner DELETE policies, so the
     Moderation tab's delete matched 0 rows and still reported success.
   - agencies had no DELETE policy at all (TC-14-07).
   - bookings were readable/updatable by super_admin only, so a regional
     admin's Payments queue could never see or confirm a booking.

Every statement is idempotent.
*/

-- ---------------------------------------------------------------------------
-- 0. Helper from 027, re-declared verbatim so this file applies on a database
--    where 027 has not been run yet.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_trusted_writer()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_user NOT IN ('authenticated', 'anon') OR is_admin();
$$;

-- ---------------------------------------------------------------------------
-- 1. SUSPENSION COLUMNS
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_reason text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON profiles(is_suspended);

-- ---------------------------------------------------------------------------
-- 2. MEMBER REGION
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES regions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_region ON profiles(region_id);

-- Longest name wins so "Jakarta Barat" never matches a shorter, broader name
-- ahead of a more specific one.
CREATE OR REPLACE FUNCTION region_for_location(p_location text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id
  FROM regions r
  WHERE p_location IS NOT NULL
    AND btrim(p_location) <> ''
    AND p_location ILIKE '%' || r.name || '%'
  ORDER BY length(r.name) DESC
  LIMIT 1;
$$;

-- One trigger guards both privileged column groups on profiles.
CREATE OR REPLACE FUNCTION guard_profile_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_trusted boolean := is_trusted_writer();
BEGIN
  -- Suspension: admin / service role only.
  IF NOT v_trusted THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_suspended := false;
      NEW.suspended_reason := NULL;
      NEW.suspended_at := NULL;
      NEW.suspended_by := NULL;
    ELSE
      NEW.is_suspended := OLD.is_suspended;
      NEW.suspended_reason := OLD.suspended_reason;
      NEW.suspended_at := OLD.suspended_at;
      NEW.suspended_by := OLD.suspended_by;
    END IF;
  END IF;

  -- Region: follows location. A trusted writer may still set it explicitly.
  IF TG_OP = 'INSERT' THEN
    IF NOT v_trusted OR NEW.region_id IS NULL THEN
      NEW.region_id := region_for_location(NEW.location);
    END IF;
  ELSIF NEW.location IS DISTINCT FROM OLD.location THEN
    IF NOT v_trusted OR NEW.region_id IS NOT DISTINCT FROM OLD.region_id THEN
      NEW.region_id := region_for_location(NEW.location);
    END IF;
  ELSIF NOT v_trusted THEN
    NEW.region_id := OLD.region_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_admin_fields ON profiles;
CREATE TRIGGER guard_profile_admin_fields BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION guard_profile_admin_fields();

-- Backfill existing members (runs as the migration owner -> trusted writer).
UPDATE profiles
SET region_id = region_for_location(location)
WHERE region_id IS NULL AND location IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. ADMIN DELETE / PAYMENT REACH
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "delete_jobs_admin" ON jobs;
CREATE POLICY "delete_jobs_admin" ON jobs FOR DELETE
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "delete_projects_admin" ON projects;
CREATE POLICY "delete_projects_admin" ON projects FOR DELETE
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "delete_courses_admin" ON courses;
CREATE POLICY "delete_courses_admin" ON courses FOR DELETE
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "delete_agencies_admin" ON agencies;
CREATE POLICY "delete_agencies_admin" ON agencies FOR DELETE
  TO authenticated USING (is_admin() AND is_in_house = false);

DROP POLICY IF EXISTS "select_bookings_admin" ON bookings;
CREATE POLICY "select_bookings_admin" ON bookings FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "update_bookings_admin" ON bookings;
CREATE POLICY "update_bookings_admin" ON bookings FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 028 limits guests to a column whitelist on profiles and builds it from the
-- columns that exist at that point, which is before these two. Public pages
-- (shared profile links, talents) filter on is_suspended, so guests need it.
GRANT SELECT (is_suspended, region_id) ON profiles TO anon;

-- PostgREST caches the schema; the new columns must be visible immediately.
NOTIFY pgrst, 'reload schema';
