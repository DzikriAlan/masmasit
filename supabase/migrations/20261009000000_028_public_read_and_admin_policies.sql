/*
# 028 - Public (guest) read, admin reach, insert guards, booking clashes

1. Guest read (TC-00-01..06, TC-06-03)
   Every listing table granted SELECT `TO authenticated` only, so a signed-out
   visitor saw empty lists and "not found" detail pages, and social crawlers
   (Open Graph) got nothing. Each table below gets an extra `TO anon` SELECT
   policy that mirrors what a member may see; the authenticated policies are
   left untouched. project_bids, bookings, applications, messages etc. stay
   private.

   profiles is special: it also holds email, WhatsApp, onboarding answers and
   referral notes. Guests get the rows, but only a whitelisted set of columns
   (column-level GRANT). PostgREST then rejects `select=*` on profiles for
   anon, so guest-facing queries must name their columns (the app does).
   New public profile columns added later need adding to the GRANT below.

2. Admin reach (TC-00-02)
   - profiles had no admin UPDATE policy: approving a talent/coach matched
     0 rows and still reported success. Admin = is_admin() (super + regional).
   - companies admin UPDATE and enrollments admin SELECT/UPDATE were
     super_admin-only; regional admins now included via is_admin().
   - job_applications: admins can read them.

3. Insert / approval guards (TC-16-06), same pattern as 027
   - events: a creator can no longer move approval_status (insert -> pending,
     update -> unchanged) unless is_trusted_writer().
   - agencies: inserted as pending regardless of the payload.
   - team_collabs: inserted as open, never pre-matched.

4. Bookings (TC-06-03, TC-06-05)
   - Guests insert without RETURNING (the app generates the id), so no anon
     SELECT on bookings is needed.
   - bookings_no_clash: a booking (or confirming one) is rejected when the
     talent already has a *confirmed* session within one hour of that time.
     Message starts with BOOKING_SLOT_TAKEN so the UI can translate it.
   - get_talent_booked_slots(): the talent's upcoming confirmed times (times
     only, no client data) so the booking form can show what is taken.

Every statement is idempotent.
*/

-- Helper from 027, re-declared so this file applies on its own.
CREATE OR REPLACE FUNCTION is_trusted_writer()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_user NOT IN ('authenticated', 'anon') OR is_admin();
$$;

-- ---------------------------------------------------------------------------
-- 1. GUEST READ
-- ---------------------------------------------------------------------------

-- COMPANIES / JOBS: approved companies and their open jobs.
DROP POLICY IF EXISTS "select_companies_anon" ON companies;
CREATE POLICY "select_companies_anon" ON companies FOR SELECT
  TO anon USING (approval_status = 'approved');

DROP POLICY IF EXISTS "select_jobs_anon" ON jobs;
CREATE POLICY "select_jobs_anon" ON jobs FOR SELECT
  TO anon USING (
    status = 'open'
    AND EXISTS (SELECT 1 FROM companies c WHERE c.id = company_id AND c.approval_status = 'approved')
  );

-- PROJECTS (bids stay private). Same name/body as 031 so either order works.
DROP POLICY IF EXISTS "select_projects_anon" ON projects;
CREATE POLICY "select_projects_anon" ON projects FOR SELECT
  TO anon USING (true);

-- PROFILES: rows yes, private columns no.
DROP POLICY IF EXISTS "select_profiles_anon" ON profiles;
CREATE POLICY "select_profiles_anon" ON profiles FOR SELECT
  TO anon USING (true);

REVOKE SELECT ON profiles FROM anon;

DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name IN (
      'id', 'full_name', 'bio', 'avatar_url', 'location', 'current_job_status',
      'linkedin_url', 'calendly_url', 'is_coach', 'is_talent',
      'coach_approved', 'talent_approved', 'hourly_rate', 'created_at',
      'fields', 'experience_level', 'is_suspended', 'region_id'
    );
  IF cols IS NOT NULL THEN
    EXECUTE format('GRANT SELECT (%s) ON profiles TO anon', cols);
  END IF;
END $$;

-- SKILLS (shown on profiles and talent cards).
DROP POLICY IF EXISTS "select_skills_anon" ON skills;
CREATE POLICY "select_skills_anon" ON skills FOR SELECT
  TO anon USING (true);

DROP POLICY IF EXISTS "select_user_skills_anon" ON user_skills;
CREATE POLICY "select_user_skills_anon" ON user_skills FOR SELECT
  TO anon USING (true);

-- AGENCIES + their active services.
DROP POLICY IF EXISTS "select_agencies_anon" ON agencies;
CREATE POLICY "select_agencies_anon" ON agencies FOR SELECT
  TO anon USING (approval_status = 'approved');

DROP POLICY IF EXISTS "select_agency_services_anon" ON agency_services;
CREATE POLICY "select_agency_services_anon" ON agency_services FOR SELECT
  TO anon USING (
    is_active = true
    AND agency_id IN (SELECT id FROM agencies WHERE approval_status = 'approved')
  );

-- BUILDS (Builds + Spotlight).
DROP POLICY IF EXISTS "select_builds_anon" ON builds;
CREATE POLICY "select_builds_anon" ON builds FOR SELECT
  TO anon USING (true);

-- EVENTS (approved only) + regions they embed.
DROP POLICY IF EXISTS "select_events_anon" ON events;
CREATE POLICY "select_events_anon" ON events FOR SELECT
  TO anon USING (approval_status = 'approved');

DROP POLICY IF EXISTS "select_regions_anon" ON regions;
CREATE POLICY "select_regions_anon" ON regions FOR SELECT
  TO anon USING (true);

-- COURSES (catalogue only; modules/materials stay member-only).
DROP POLICY IF EXISTS "select_courses_anon" ON courses;
CREATE POLICY "select_courses_anon" ON courses FOR SELECT
  TO anon USING (true);

-- CASE STUDIES.
DROP POLICY IF EXISTS "select_case_studies_anon" ON case_studies;
CREATE POLICY "select_case_studies_anon" ON case_studies FOR SELECT
  TO anon USING (true);

-- APP SETTINGS: fee % and public payment links, needed by the guest booking form.
DROP POLICY IF EXISTS "select_app_settings_anon" ON app_settings;
CREATE POLICY "select_app_settings_anon" ON app_settings FOR SELECT
  TO anon USING (true);

-- ---------------------------------------------------------------------------
-- 2. ADMIN REACH
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "update_profiles_admin" ON profiles;
CREATE POLICY "update_profiles_admin" ON profiles FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_company_admin" ON companies;
CREATE POLICY "update_company_admin" ON companies FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "select_enrollments_admin" ON enrollments;
CREATE POLICY "select_enrollments_admin" ON enrollments FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "update_enrollments_admin" ON enrollments;
CREATE POLICY "update_enrollments_admin" ON enrollments FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "select_job_applications_admin" ON job_applications;
CREATE POLICY "select_job_applications_admin" ON job_applications FOR SELECT
  TO authenticated USING (is_admin());

-- ---------------------------------------------------------------------------
-- 3. INSERT / APPROVAL GUARDS
-- ---------------------------------------------------------------------------

-- EVENTS: approval is the admin's call. update_events lets the creator write
-- the row, and RLS cannot restrict columns, so the trigger pins the field.
CREATE OR REPLACE FUNCTION guard_event_approval()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  NEW.approval_status := CASE WHEN TG_OP = 'INSERT' THEN 'pending' ELSE OLD.approval_status END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_event_approval ON events;
CREATE TRIGGER guard_event_approval BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION guard_event_approval();

-- AGENCIES: guard_agency_approval (015) covers UPDATE; this covers INSERT.
CREATE OR REPLACE FUNCTION guard_agency_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  NEW.approval_status := 'pending';
  NEW.is_in_house := false;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_agency_insert ON agencies;
CREATE TRIGGER guard_agency_insert BEFORE INSERT ON agencies
  FOR EACH ROW EXECUTE FUNCTION guard_agency_insert();

-- TEAM_COLLABS: a listing starts open; matching is the admin's step.
CREATE OR REPLACE FUNCTION guard_team_collabs_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  NEW.status := 'open';
  NEW.matched_with := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_team_collabs_insert ON team_collabs;
CREATE TRIGGER guard_team_collabs_insert BEFORE INSERT ON team_collabs
  FOR EACH ROW EXECUTE FUNCTION guard_team_collabs_insert();

-- ---------------------------------------------------------------------------
-- 4. BOOKINGS: SCHEDULE CLASH + BOOKED SLOTS
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER: the caller (often a guest) cannot read other bookings.
-- Sessions are treated as one hour long.
CREATE OR REPLACE FUNCTION guard_booking_clash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_taken timestamptz;
BEGIN
  IF NEW.status IN ('cancelled', 'completed') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE'
     AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.scheduled_at IS NOT DISTINCT FROM OLD.scheduled_at
     AND NEW.talent_id IS NOT DISTINCT FROM OLD.talent_id THEN
    RETURN NEW;
  END IF;

  SELECT b.scheduled_at INTO v_taken
  FROM bookings b
  WHERE b.talent_id = NEW.talent_id
    AND b.id IS DISTINCT FROM NEW.id
    AND b.status = 'confirmed'
    AND b.scheduled_at > NEW.scheduled_at - interval '1 hour'
    AND b.scheduled_at < NEW.scheduled_at + interval '1 hour'
  LIMIT 1;

  IF v_taken IS NOT NULL THEN
    RAISE EXCEPTION 'BOOKING_SLOT_TAKEN: this talent already has a confirmed session at % (WIB). Please choose another time.',
      to_char(v_taken AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI')
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_no_clash ON bookings;
CREATE TRIGGER bookings_no_clash BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION guard_booking_clash();

CREATE INDEX IF NOT EXISTS idx_bookings_talent_schedule ON bookings(talent_id, scheduled_at);

CREATE OR REPLACE FUNCTION get_talent_booked_slots(p_talent_id uuid)
RETURNS TABLE (scheduled_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT b.scheduled_at
  FROM bookings b
  WHERE b.talent_id = p_talent_id
    AND b.status = 'confirmed'
    AND b.scheduled_at >= now() - interval '1 hour'
  ORDER BY b.scheduled_at
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION get_talent_booked_slots(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_talent_booked_slots(uuid) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
