-- =========================================================================
-- SCRIPT 4 - TERAPKAN MIGRATION 026 s/d 034 SEKALIGUS
-- =========================================================================
-- Untuk production yang sekarang (migration 001-025 sudah ada).
-- Jalankan SEKALI di Supabase > SQL Editor: paste seluruh isi file ini, Run.
--
-- - Satu transaksi: kalau ada satu error, TIDAK ADA yang berubah.
-- - Aman dijalankan ulang (semua langkah idempotent).
-- - Tidak menghapus data; hanya menambah kolom, tabel, policy, trigger,
--   function. Satu-satunya rename: app_settings.lynkid_*_url -> goakal_*_url.
-- - Jalankan 00_BACKUP.sh dulu.
-- - Setelah sukses, baru merge branch feat/brief-test-cases ke main.
--
-- Isi (urut): 026, 027, 028, 029, 029b, 030, 031, 032, 033, 034.
-- File ini digabung otomatis dari supabase/migrations; jangan diedit manual.
-- =========================================================================

BEGIN;

-- =========================================================================
-- 20260924000100_026_referral_threads.sql
-- =========================================================================

/*
# Referral source, with Threads

The onboarding popup asks where the member heard about MasmasIT, now
including Threads. Databases that applied an earlier 025 (before the
referral columns were added to it) do not have these columns yet, so this
migration creates them itself and then (re)defines both constraints. Safe
to run whether or not the current 025 has been applied.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS referral_note text;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_referral_source_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_referral_source_check
  CHECK (referral_source IS NULL OR referral_source IN
    ('instagram','threads','tiktok','linkedin','x','youtube','google','friend','community','other'));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_referral_note_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_referral_note_check
  CHECK (referral_note IS NULL OR length(referral_note) <= 100);

NOTIFY pgrst, 'reload schema';

-- =========================================================================
-- 20260929000000_027_guard_privileged_columns.sql
-- =========================================================================

/*
# Guard privileged columns against self-service writes

RLS decides which rows a member may write, not which columns. Several
"own row" policies therefore let a member set fields that only an admin
(or the other party) should control. Each of these worked straight from
the browser with the anon key and a normal session:

- profiles        coach_approved / talent_approved -> self-approved badge
- companies       approval_status                  -> self-approved company
- enrollments     payment_status = 'paid'          -> paid course for free
- event_rsvps     payment_status = 'paid'          -> paid event for free
- bookings        payment_status, amount, parties  -> client rewrites the deal
- project_bids    status = 'accepted'              -> bidder accepts own bid
- builds          likes_count                      -> inflated Hot Rank
- agency_projects status / payment / fee fields    -> self-approved request
- messages        WITH CHECK (true)                -> recipient rewrites body,
                                                      sender or recipient
- discussions     WITH CHECK (true)                -> author hands a thread
                                                      to another member

The guards below reset those fields instead of raising, so existing app
writes (payment_status 'awaiting_confirmation', talent confirming a
booking, project owner accepting a bid, marking a message read) keep
working unchanged.

Trusted writers pass through untouched: admins, and any code that is not
running as the PostgREST request role — SECURITY DEFINER RPCs such as
accept_project_bid / create_event_rsvp, the likes-count trigger, the
auth trigger from 024 and the service role. That is why these trigger
functions are SECURITY INVOKER: current_user must still be the caller.
*/

CREATE OR REPLACE FUNCTION is_trusted_writer()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_user NOT IN ('authenticated', 'anon') OR is_admin();
$$;

-- PROFILES: approval flags are the admin's call.
CREATE OR REPLACE FUNCTION guard_profile_approvals()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.coach_approved := 'pending';
    NEW.talent_approved := 'pending';
  ELSE
    NEW.coach_approved := OLD.coach_approved;
    NEW.talent_approved := OLD.talent_approved;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_approvals ON profiles;
CREATE TRIGGER guard_profile_approvals BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION guard_profile_approvals();

-- COMPANIES: approval_status is the admin's call.
CREATE OR REPLACE FUNCTION guard_company_approval()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  NEW.approval_status := CASE WHEN TG_OP = 'INSERT' THEN 'pending' ELSE OLD.approval_status END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_company_approval ON companies;
CREATE TRIGGER guard_company_approval BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION guard_company_approval();

-- ENROLLMENTS / EVENT_RSVPS / BOOKINGS: a member may report a payment
-- (awaiting_confirmation) or reset it, never confirm it.
CREATE OR REPLACE FUNCTION guard_payment_confirmation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.payment_status = 'paid' THEN NEW.payment_status := 'unpaid'; END IF;
    NEW.payment_confirmed_at := NULL;
    NEW.payment_confirmed_by := NULL;
  ELSE
    IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
      NEW.payment_status := OLD.payment_status;
    END IF;
    NEW.payment_confirmed_at := OLD.payment_confirmed_at;
    NEW.payment_confirmed_by := OLD.payment_confirmed_by;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_payment_confirmation ON enrollments;
CREATE TRIGGER guard_payment_confirmation BEFORE INSERT OR UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION guard_payment_confirmation();

DROP TRIGGER IF EXISTS guard_payment_confirmation ON event_rsvps;
CREATE TRIGGER guard_payment_confirmation BEFORE INSERT OR UPDATE ON event_rsvps
  FOR EACH ROW EXECUTE FUNCTION guard_payment_confirmation();

DROP TRIGGER IF EXISTS guard_payment_confirmation ON bookings;
CREATE TRIGGER guard_payment_confirmation BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION guard_payment_confirmation();

-- BOOKINGS: once created, the price, the parties and the admin fee are
-- fixed; talent and client only move status along.
CREATE OR REPLACE FUNCTION guard_booking_terms()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  NEW.amount := OLD.amount;
  NEW.admin_fee_percentage := OLD.admin_fee_percentage;
  NEW.talent_id := OLD.talent_id;
  NEW.client_id := OLD.client_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_booking_terms ON bookings;
CREATE TRIGGER guard_booking_terms BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION guard_booking_terms();

-- PROJECT_BIDS: the bidder owns the offer, the project owner owns the
-- decision. Neither may touch the other's half.
CREATE OR REPLACE FUNCTION guard_bid_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
  ELSIF auth.uid() = OLD.user_id THEN
    NEW.status := OLD.status;
  ELSE
    NEW.user_id := OLD.user_id;
    NEW.project_id := OLD.project_id;
    NEW.amount := OLD.amount;
    NEW.proposal := OLD.proposal;
    NEW.eta_days := OLD.eta_days;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_bid_status ON project_bids;
CREATE TRIGGER guard_bid_status BEFORE INSERT OR UPDATE ON project_bids
  FOR EACH ROW EXECUTE FUNCTION guard_bid_status();

-- BUILDS: likes_count is maintained by trg_build_likes_count only.
CREATE OR REPLACE FUNCTION guard_build_likes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  NEW.likes_count := CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE OLD.likes_count END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_build_likes ON builds;
CREATE TRIGGER guard_build_likes BEFORE INSERT OR UPDATE ON builds
  FOR EACH ROW EXECUTE FUNCTION guard_build_likes();

-- AGENCY_PROJECTS: a request always starts as a plain request; status,
-- payments and the fee split are set by admins.
CREATE OR REPLACE FUNCTION guard_agency_project_request()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  NEW.status := 'requested';
  NEW.dp_amount := NULL;
  NEW.admin_fee_percentage := 10.00;      -- column defaults
  NEW.revenue_share_percentage := 10.00;
  NEW.dp_payment_status := 'unpaid';
  NEW.final_payment_status := 'unpaid';
  NEW.dp_payment_confirmed_at := NULL;
  NEW.dp_payment_confirmed_by := NULL;
  NEW.final_payment_confirmed_at := NULL;
  NEW.final_payment_confirmed_by := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_agency_project_request ON agency_projects;
CREATE TRIGGER guard_agency_project_request BEFORE INSERT ON agency_projects
  FOR EACH ROW EXECUTE FUNCTION guard_agency_project_request();

-- MESSAGES: the recipient may only mark a message read.
DROP POLICY IF EXISTS "update_own_messages" ON messages;
CREATE POLICY "update_own_messages" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

CREATE OR REPLACE FUNCTION guard_message_edit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  NEW.sender_id := OLD.sender_id;
  NEW.recipient_id := OLD.recipient_id;
  NEW.body := OLD.body;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_message_edit ON messages;
CREATE TRIGGER guard_message_edit BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION guard_message_edit();

-- DISCUSSIONS: authors edit their own threads, they cannot re-assign them.
DROP POLICY IF EXISTS "update_own_discussions" ON discussions;
CREATE POLICY "update_own_discussions" ON discussions FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- ENROLLMENTS: unlike bookings/event_rsvps, this table never got an admin
-- policy, so the admin payment queue could neither list course payments nor
-- confirm them — the update matched 0 rows and still reported success.
DROP POLICY IF EXISTS "select_enrollments_admin" ON enrollments;
CREATE POLICY "select_enrollments_admin" ON enrollments FOR SELECT
  TO authenticated USING (is_super_admin());

DROP POLICY IF EXISTS "update_enrollments_admin" ON enrollments;
CREATE POLICY "update_enrollments_admin" ON enrollments FOR UPDATE
  TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

-- =========================================================================
-- 20261009000000_028_public_read_and_admin_policies.sql
-- =========================================================================

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

-- =========================================================================
-- 20261009000100_029_notifications_i18n_and_triggers.sql
-- =========================================================================

/*
# 029 - Bilingual notifications + full notification coverage (BRIEF 11)

## Columns
- notifications.title_id, notifications.body_id (text, nullable): Indonesian
  copy. The bell shows them when the UI language is 'id' and falls back to
  title/body (English) otherwise, so rows written before this migration and
  rows from callers that only pass English keep rendering.

## Contract
- notify_user_i18n(target_uid, n_type, title_en, body_en, title_id, body_id, n_link)
  SECURITY DEFINER. Every trigger below goes through it; later migrations
  (030+) call it for the features they add. EXECUTE is revoked from client
  roles so a member cannot RPC arbitrary notifications into another inbox -
  triggers and SECURITY DEFINER functions run as the owner and keep access.

## Triggers (all AFTER, all bilingual)
- messages INSERT                         -> recipient            (/pesan)
- job_applications INSERT                 -> company owner        (/jobs/applicants)
- job_applications status change          -> applicant            (/dashboard)
- bookings status / payment paid          -> client + talent      (/dashboard)
- project_bids status accepted / rejected -> bidder               (/projects/{id})
  (accept_project_bid from 014 updates row by row, so the winner and every
  other bidder each get one notification)
- companies approval_status               -> owner                (/jobs/post)
- agencies approval_status                -> owner                (/agency/manage)
- events approval_status                  -> creator              (/events)
- profiles coach_approved/talent_approved -> that user            (/coach, /profile)
- team_collabs status -> 'matched'        -> team owner           (/team-collabs)
- discussion_comments INSERT              -> discussion author    (/discussions/{id}), self-replies skipped
- build_likes INSERT                      -> build author, grouped per build per day
- enrollments payment_status -> paid      -> student              (/courses/{id})
- event_rsvps payment_status -> paid      -> attendee             (/events)
- agency_projects dp/final payment -> paid -> client, matched by client_email
  against auth.users (agency_projects has no user column, see 006)

## Realtime
- messages and notifications are added to the supabase_realtime publication
  (idempotent).

Every statement is idempotent: re-running the file is a no-op.
*/

-- ---------------------------------------------------------------------------
-- 1. Columns + helper
-- ---------------------------------------------------------------------------

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title_id text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body_id text;

CREATE OR REPLACE FUNCTION notify_user_i18n(
  target_uid uuid,
  n_type text,
  title_en text,
  body_en text,
  title_id text,
  body_id text,
  n_link text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF target_uid IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO notifications (user_id, type, title, body, title_id, body_id, link)
  VALUES (
    target_uid,
    n_type,
    notify_user_i18n.title_en,
    notify_user_i18n.body_en,
    notify_user_i18n.title_id,
    notify_user_i18n.body_id,
    n_link
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION notify_user_i18n(uuid, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;

-- English status word -> Indonesian, for "status: X" style bodies.
CREATE OR REPLACE FUNCTION notif_status_id(s text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE s
    WHEN 'pending' THEN 'menunggu'
    WHEN 'reviewing' THEN 'sedang ditinjau'
    WHEN 'accepted' THEN 'diterima'
    WHEN 'rejected' THEN 'ditolak'
    WHEN 'approved' THEN 'disetujui'
    WHEN 'confirmed' THEN 'dikonfirmasi'
    WHEN 'completed' THEN 'selesai'
    WHEN 'cancelled' THEN 'dibatalkan'
    ELSE s
  END;
$$;

CREATE OR REPLACE FUNCTION notif_display_name(uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(NULLIF(trim(full_name), ''), 'A member') FROM profiles WHERE id = uid;
$$;

REVOKE EXECUTE ON FUNCTION notif_display_name(uuid) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Rewrites of the 011/016 triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_notify_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := COALESCE(notif_display_name(NEW.sender_id), 'A member');
BEGIN
  IF NEW.recipient_id IS NOT NULL AND NEW.recipient_id <> NEW.sender_id THEN
    PERFORM notify_user_i18n(
      NEW.recipient_id, 'message',
      'New message', 'From ' || v_name,
      'Pesan baru', 'Dari ' || v_name,
      '/pesan'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_insert ON messages;
CREATE TRIGGER on_message_insert AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION trg_notify_message();

CREATE OR REPLACE FUNCTION trg_notify_job_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT title INTO v_job FROM jobs WHERE id = NEW.job_id;
    v_job := COALESCE(v_job, 'a job');
    PERFORM notify_user_i18n(
      NEW.user_id, 'job_application',
      'Application update', 'Your application for "' || v_job || '" is now ' || NEW.status,
      'Update lamaran', 'Lamaran kamu untuk "' || v_job || '" sekarang ' || notif_status_id(NEW.status),
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_job_application_update ON job_applications;
CREATE TRIGGER on_job_application_update AFTER UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION trg_notify_job_application();

CREATE OR REPLACE FUNCTION trg_notify_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.client_id IS NOT NULL THEN
      PERFORM notify_user_i18n(
        NEW.client_id, 'booking',
        'Booking update', 'Your booking is now ' || NEW.status,
        'Update booking', 'Booking kamu sekarang ' || notif_status_id(NEW.status),
        '/dashboard'
      );
    END IF;
    PERFORM notify_user_i18n(
      NEW.talent_id, 'booking',
      'Booking update', 'Booking status: ' || NEW.status,
      'Update booking', 'Status booking: ' || notif_status_id(NEW.status),
      '/dashboard'
    );
  END IF;
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status AND NEW.payment_status = 'paid' THEN
    IF NEW.client_id IS NOT NULL THEN
      PERFORM notify_user_i18n(
        NEW.client_id, 'payment',
        'Payment confirmed', 'Your booking payment has been confirmed',
        'Pembayaran dikonfirmasi', 'Pembayaran booking kamu sudah dikonfirmasi',
        '/dashboard'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_update ON bookings;
CREATE TRIGGER on_booking_update AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION trg_notify_booking();

-- ---------------------------------------------------------------------------
-- 3. New applicant -> company owner (TC-02-16)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_notify_job_applicant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_job text;
  v_name text := COALESCE(notif_display_name(NEW.user_id), 'A member');
BEGIN
  SELECT c.user_id, j.title INTO v_owner, v_job
  FROM jobs j JOIN companies c ON c.id = j.company_id
  WHERE j.id = NEW.job_id;

  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    PERFORM notify_user_i18n(
      v_owner, 'job_applicant',
      'New applicant', v_name || ' applied for "' || COALESCE(v_job, 'your job') || '"',
      'Pelamar baru', v_name || ' melamar "' || COALESCE(v_job, 'lowongan kamu') || '"',
      '/jobs/applicants'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_job_application_insert_notify ON job_applications;
CREATE TRIGGER on_job_application_insert_notify AFTER INSERT ON job_applications
  FOR EACH ROW EXECUTE FUNCTION trg_notify_job_applicant();

-- ---------------------------------------------------------------------------
-- 4. Bids accepted / rejected (TC-03-09)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_notify_project_bid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  SELECT title INTO v_title FROM projects WHERE id = NEW.project_id;
  v_title := COALESCE(v_title, 'a project');

  IF NEW.status = 'accepted' THEN
    PERFORM notify_user_i18n(
      NEW.user_id, 'bid_accepted',
      'Bid accepted', 'Your bid on "' || v_title || '" was accepted',
      'Bid diterima', 'Bid kamu untuk "' || v_title || '" diterima',
      '/projects/' || NEW.project_id
    );
  ELSIF NEW.status = 'rejected' THEN
    PERFORM notify_user_i18n(
      NEW.user_id, 'bid_rejected',
      'Bid not selected', 'Your bid on "' || v_title || '" was not selected',
      'Bid tidak terpilih', 'Bid kamu untuk "' || v_title || '" tidak terpilih',
      '/projects/' || NEW.project_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_project_bid_status_notify ON project_bids;
CREATE TRIGGER on_project_bid_status_notify AFTER UPDATE OF status ON project_bids
  FOR EACH ROW EXECUTE FUNCTION trg_notify_project_bid();

-- ---------------------------------------------------------------------------
-- 5. Approval decisions: companies, agencies, events, coach/talent
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_notify_company_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    IF NEW.approval_status = 'approved' THEN
      PERFORM notify_user_i18n(
        NEW.user_id, 'company_approval',
        'Company approved', '"' || NEW.name || '" is approved. You can now post jobs.',
        'Perusahaan disetujui', '"' || NEW.name || '" sudah disetujui. Kamu sekarang bisa memasang lowongan.',
        '/jobs/post'
      );
    ELSIF NEW.approval_status = 'rejected' THEN
      PERFORM notify_user_i18n(
        NEW.user_id, 'company_approval',
        'Company not approved', '"' || NEW.name || '" was not approved by the admin.',
        'Perusahaan tidak disetujui', '"' || NEW.name || '" tidak disetujui oleh admin.',
        '/jobs/post'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_company_approval_notify ON companies;
CREATE TRIGGER on_company_approval_notify AFTER UPDATE OF approval_status ON companies
  FOR EACH ROW EXECUTE FUNCTION trg_notify_company_approval();

CREATE OR REPLACE FUNCTION trg_notify_agency_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status AND NEW.owner_id IS NOT NULL THEN
    IF NEW.approval_status = 'approved' THEN
      PERFORM notify_user_i18n(
        NEW.owner_id, 'agency_approval',
        'Agency approved', '"' || NEW.name || '" is approved and now listed publicly.',
        'Agency disetujui', '"' || NEW.name || '" sudah disetujui dan tampil di publik.',
        '/agency/manage'
      );
    ELSIF NEW.approval_status = 'rejected' THEN
      PERFORM notify_user_i18n(
        NEW.owner_id, 'agency_approval',
        'Agency not approved', '"' || NEW.name || '" was not approved by the admin.',
        'Agency tidak disetujui', '"' || NEW.name || '" tidak disetujui oleh admin.',
        '/agency/manage'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_agency_approval_notify ON agencies;
CREATE TRIGGER on_agency_approval_notify AFTER UPDATE OF approval_status ON agencies
  FOR EACH ROW EXECUTE FUNCTION trg_notify_agency_approval();

CREATE OR REPLACE FUNCTION trg_notify_event_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status AND NEW.created_by IS NOT NULL THEN
    IF NEW.approval_status = 'approved' THEN
      PERFORM notify_user_i18n(
        NEW.created_by, 'event_approval',
        'Event approved', '"' || NEW.title || '" is approved and now published.',
        'Event disetujui', '"' || NEW.title || '" sudah disetujui dan dipublikasikan.',
        '/events'
      );
    ELSIF NEW.approval_status = 'rejected' THEN
      PERFORM notify_user_i18n(
        NEW.created_by, 'event_approval',
        'Event not approved', '"' || NEW.title || '" was not approved by the admin.',
        'Event tidak disetujui', '"' || NEW.title || '" tidak disetujui oleh admin.',
        '/events'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_event_approval_notify ON events;
CREATE TRIGGER on_event_approval_notify AFTER UPDATE OF approval_status ON events
  FOR EACH ROW EXECUTE FUNCTION trg_notify_event_approval();

CREATE OR REPLACE FUNCTION trg_notify_profile_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.coach_approved IS DISTINCT FROM OLD.coach_approved THEN
    IF NEW.coach_approved = 'approved' THEN
      PERFORM notify_user_i18n(
        NEW.id, 'coach_approval',
        'Coach application approved', 'You are now an approved coach. You can start creating courses.',
        'Pengajuan coach disetujui', 'Kamu sekarang coach terverifikasi. Kamu bisa mulai membuat kursus.',
        '/coach'
      );
    ELSIF NEW.coach_approved = 'rejected' THEN
      PERFORM notify_user_i18n(
        NEW.id, 'coach_approval',
        'Coach application not approved', 'Your coach application was not approved by the admin.',
        'Pengajuan coach tidak disetujui', 'Pengajuan coach kamu tidak disetujui oleh admin.',
        '/coach'
      );
    END IF;
  END IF;

  IF NEW.talent_approved IS DISTINCT FROM OLD.talent_approved THEN
    IF NEW.talent_approved = 'approved' THEN
      PERFORM notify_user_i18n(
        NEW.id, 'talent_approval',
        'Talent profile approved', 'Your talent profile is approved and can now receive bookings.',
        'Profil talent disetujui', 'Profil talent kamu sudah disetujui dan bisa menerima booking.',
        '/talents/' || NEW.id
      );
    ELSIF NEW.talent_approved = 'rejected' THEN
      PERFORM notify_user_i18n(
        NEW.id, 'talent_approval',
        'Talent profile not approved', 'Your talent profile was not approved by the admin.',
        'Profil talent tidak disetujui', 'Profil talent kamu tidak disetujui oleh admin.',
        '/profile'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_approval_notify ON profiles;
CREATE TRIGGER on_profile_approval_notify AFTER UPDATE OF coach_approved, talent_approved ON profiles
  FOR EACH ROW EXECUTE FUNCTION trg_notify_profile_approval();

-- ---------------------------------------------------------------------------
-- 6. Team collab matched (TC-04-11)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_notify_team_collab_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_team text;
  v_partner text := COALESCE(NULLIF(trim(NEW.matched_with), ''), 'another team');
  v_partner_id text := COALESCE(NULLIF(trim(NEW.matched_with), ''), 'tim lain');
BEGIN
  IF NEW.status = 'matched' AND OLD.status IS DISTINCT FROM 'matched' THEN
    SELECT owner_id, name INTO v_owner, v_team FROM teams WHERE id = NEW.team_id;
    v_owner := COALESCE(v_owner, NEW.created_by);
    PERFORM notify_user_i18n(
      v_owner, 'team_collab_matched',
      'Matched with ' || v_partner,
      'Your collab listing "' || NEW.focus || '" was matched with ' || v_partner || '.',
      'Cocok dengan ' || v_partner_id,
      'Listing kolaborasi "' || NEW.focus || '" sudah dicocokkan dengan ' || v_partner_id || '.',
      '/team-collabs'
    );
    IF NEW.created_by IS DISTINCT FROM v_owner THEN
      PERFORM notify_user_i18n(
        NEW.created_by, 'team_collab_matched',
        'Matched with ' || v_partner,
        'Your collab listing "' || NEW.focus || '" was matched with ' || v_partner || '.',
        'Cocok dengan ' || v_partner_id,
        'Listing kolaborasi "' || NEW.focus || '" sudah dicocokkan dengan ' || v_partner_id || '.',
        '/team-collabs'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_team_collab_match_notify ON team_collabs;
CREATE TRIGGER on_team_collab_match_notify AFTER UPDATE OF status ON team_collabs
  FOR EACH ROW EXECUTE FUNCTION trg_notify_team_collab_match();

-- ---------------------------------------------------------------------------
-- 7. Discussion reply (TC-09-05)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_notify_discussion_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author uuid;
  v_title text;
  v_name text := COALESCE(notif_display_name(NEW.user_id), 'A member');
BEGIN
  SELECT user_id, title INTO v_author, v_title FROM discussions WHERE id = NEW.discussion_id;
  IF v_author IS NOT NULL AND v_author <> NEW.user_id THEN
    PERFORM notify_user_i18n(
      v_author, 'discussion_reply',
      'New reply', v_name || ' replied to "' || COALESCE(v_title, 'your topic') || '"',
      'Balasan baru', v_name || ' membalas "' || COALESCE(v_title, 'topik kamu') || '"',
      '/discussions/' || NEW.discussion_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_discussion_comment_notify ON discussion_comments;
CREATE TRIGGER on_discussion_comment_notify AFTER INSERT ON discussion_comments
  FOR EACH ROW EXECUTE FUNCTION trg_notify_discussion_comment();

-- ---------------------------------------------------------------------------
-- 8. Build likes, grouped per build per day (TC-09-09)
--    The link carries the build id so today's unread row for that build can
--    be found and its count bumped instead of inserting a new one.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_notify_build_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author uuid;
  v_title text;
  v_link text := '/builds?build=' || NEW.build_id;
  v_count integer;
  v_existing uuid;
BEGIN
  SELECT user_id, title INTO v_author, v_title FROM builds WHERE id = NEW.build_id;
  IF v_author IS NULL OR v_author = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_count FROM build_likes
  WHERE build_id = NEW.build_id AND user_id <> v_author AND created_at >= date_trunc('day', now());
  v_count := GREATEST(v_count, 1);

  SELECT id INTO v_existing FROM notifications
  WHERE user_id = v_author AND type = 'build_like' AND link = v_link
    AND is_read = false AND created_at >= date_trunc('day', now())
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    UPDATE notifications SET
      body = v_count || ' people liked "' || v_title || '" today',
      body_id = v_count || ' orang menyukai "' || v_title || '" hari ini'
    WHERE id = v_existing;
  ELSE
    PERFORM notify_user_i18n(
      v_author, 'build_like',
      'Your build got a like',
      CASE WHEN v_count = 1
        THEN COALESCE(notif_display_name(NEW.user_id), 'A member') || ' liked "' || v_title || '"'
        ELSE v_count || ' people liked "' || v_title || '" today' END,
      'Build kamu disukai',
      CASE WHEN v_count = 1
        THEN COALESCE(notif_display_name(NEW.user_id), 'Seorang member') || ' menyukai "' || v_title || '"'
        ELSE v_count || ' orang menyukai "' || v_title || '" hari ini' END,
      v_link
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_build_like_notify ON build_likes;
CREATE TRIGGER on_build_like_notify AFTER INSERT ON build_likes
  FOR EACH ROW EXECUTE FUNCTION trg_notify_build_like();

-- ---------------------------------------------------------------------------
-- 9. Payments confirmed: courses (TC-07-08), event RSVPs, agency projects
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_notify_enrollment_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
    SELECT title INTO v_title FROM courses WHERE id = NEW.course_id;
    PERFORM notify_user_i18n(
      NEW.user_id, 'payment',
      'Course payment confirmed', 'Your payment for "' || COALESCE(v_title, 'your course') || '" is confirmed. Happy learning!',
      'Pembayaran kursus dikonfirmasi', 'Pembayaran untuk "' || COALESCE(v_title, 'kursus kamu') || '" sudah dikonfirmasi. Selamat belajar!',
      '/courses/' || NEW.course_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_enrollment_paid_notify ON enrollments;
CREATE TRIGGER on_enrollment_paid_notify AFTER UPDATE OF payment_status ON enrollments
  FOR EACH ROW EXECUTE FUNCTION trg_notify_enrollment_paid();

CREATE OR REPLACE FUNCTION trg_notify_event_rsvp_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
    SELECT title INTO v_title FROM events WHERE id = NEW.event_id;
    PERFORM notify_user_i18n(
      NEW.user_id, 'payment',
      'Event payment confirmed', 'Your ticket for "' || COALESCE(v_title, 'the event') || '" is confirmed. See you there!',
      'Pembayaran event dikonfirmasi', 'Tiket kamu untuk "' || COALESCE(v_title, 'event') || '" sudah dikonfirmasi. Sampai jumpa!',
      '/events'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_event_rsvp_paid_notify ON event_rsvps;
CREATE TRIGGER on_event_rsvp_paid_notify AFTER UPDATE OF payment_status ON event_rsvps
  FOR EACH ROW EXECUTE FUNCTION trg_notify_event_rsvp_paid();

-- agency_projects stores the client as name + email only (006), so the
-- recipient is the account registered with that email, if any.
CREATE OR REPLACE FUNCTION trg_notify_agency_project_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_client uuid;
BEGIN
  IF NOT (
    (NEW.dp_payment_status = 'paid' AND OLD.dp_payment_status IS DISTINCT FROM 'paid')
    OR (NEW.final_payment_status = 'paid' AND OLD.final_payment_status IS DISTINCT FROM 'paid')
  ) THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_client FROM auth.users WHERE lower(email) = lower(NEW.client_email) LIMIT 1;
  IF v_client IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.dp_payment_status = 'paid' AND OLD.dp_payment_status IS DISTINCT FROM 'paid' THEN
    PERFORM notify_user_i18n(
      v_client, 'payment',
      'Down payment confirmed', 'The down payment for your agency project is confirmed. Work can begin.',
      'DP dikonfirmasi', 'DP untuk proyek agency kamu sudah dikonfirmasi. Pengerjaan bisa dimulai.',
      '/dashboard'
    );
  END IF;
  IF NEW.final_payment_status = 'paid' AND OLD.final_payment_status IS DISTINCT FROM 'paid' THEN
    PERFORM notify_user_i18n(
      v_client, 'payment',
      'Final payment confirmed', 'The final payment for your agency project is confirmed. Thank you!',
      'Pelunasan dikonfirmasi', 'Pelunasan untuk proyek agency kamu sudah dikonfirmasi. Terima kasih!',
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_agency_project_paid_notify ON agency_projects;
CREATE TRIGGER on_agency_project_paid_notify AFTER UPDATE OF dp_payment_status, final_payment_status ON agency_projects
  FOR EACH ROW EXECUTE FUNCTION trg_notify_agency_project_paid();

-- ---------------------------------------------------------------------------
-- 10. Realtime publication (TC-11-05)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- =========================================================================
-- 20261009000150_029b_message_attachments.sql
-- =========================================================================

/*
# 029b - Message attachments (TC-11-03)

## Columns on messages (all nullable)
- attachment_url  text    - object path inside the `message-attachments`
                             bucket, e.g. "{sender_id}/{recipient_id}/{uuid}-{file}".
                             The bucket is private, so the client resolves it
                             to a short-lived signed URL when rendering.
- attachment_name text    - original file name, shown on the bubble
- attachment_type text    - MIME type; image/... renders as a preview
- attachment_size integer - bytes, capped at 5 MB

## Storage
- Private bucket `message-attachments`, 5 MB per object (bucket-level limit
  as well as the column check, so an oversized upload is refused by Storage
  even if the UI check is bypassed).
- INSERT: only into a path whose first folder is the uploader's uid.
- SELECT: the sender (first folder) or the recipient (second folder).

## Guard
- guard_message_edit (027) is redefined to also freeze the attachment
  columns, so a recipient marking a message read cannot swap the file.

Idempotent.
*/

ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_size integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_attachment_size_check') THEN
    ALTER TABLE messages ADD CONSTRAINT messages_attachment_size_check
      CHECK (attachment_size IS NULL OR (attachment_size >= 0 AND attachment_size <= 5242880));
  END IF;
END $$;

-- Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('message-attachments', 'message-attachments', false, 5242880)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 5242880;

DROP POLICY IF EXISTS "message_attachments_insert_own" ON storage.objects;
CREATE POLICY "message_attachments_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "message_attachments_select_participants" ON storage.objects;
CREATE POLICY "message_attachments_select_participants" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'message-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (storage.foldername(name))[2] = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "message_attachments_delete_own" ON storage.objects;
CREATE POLICY "message_attachments_delete_own" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Freeze attachment columns on UPDATE (extends 027's guard).
CREATE OR REPLACE FUNCTION guard_message_edit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  NEW.sender_id := OLD.sender_id;
  NEW.recipient_id := OLD.recipient_id;
  NEW.body := OLD.body;
  NEW.created_at := OLD.created_at;
  NEW.attachment_url := OLD.attachment_url;
  NEW.attachment_name := OLD.attachment_name;
  NEW.attachment_type := OLD.attachment_type;
  NEW.attachment_size := OLD.attachment_size;
  RETURN NEW;
END;
$$;

-- =========================================================================
-- 20261009000200_030_admin_moderation.sql
-- =========================================================================

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

-- PostgREST caches the schema; the new columns must be visible immediately.
NOTIFY pgrst, 'reload schema';

-- =========================================================================
-- 20261009000300_031_activity_projects_requests.sql
-- =========================================================================

/*
# 031 — Activity, projects lifecycle, service requests, reviews

Runs after 029 (notify_user_i18n) and 027 (guard triggers / is_trusted_writer).
Everything here is idempotent.

1. PROFILES: owner may withdraw a coach/talent application (TC-01-24).
   guard_profile_approvals (027) kept the approval flag frozen, so an
   approved talent who withdrew stayed listed on /talents (that page filters
   talent_approved only) and re-applying kept the old verdict. Turning
   is_talent / is_coach off now resets the flag to 'pending'. Nothing else
   about the guard changes: a member still cannot approve themselves.
   user_roles: a member may drop their own 'talent' / 'coach' role row.

2. PROJECTS
   - guests (anon) can read projects (ProjectDetail guest view).
   - project_bids.status gains 'cancelled'; the bidder may move their own
     bid pending -> cancelled and nothing else (TC-03-08). A cancelled bid
     stays cancelled even when accept_project_bid rejects the others.
   - owner marking a project completed notifies the owner and the winning
     bidder so both can rate each other (TC-03-06 / 07).
   - project_reviews: insert limited to the two parties of a completed
     project, reviewing each other; reviewer may update own review;
     readable by guests; reviewee is notified.

3. BOOKING_REVIEWS (TC-06-06): client rates the talent after a completed
   booking. One review per booking. Public read.

4. AGENCY_PROJECTS (TC-05-10 / 05-11)
   - client_user_id (auth.users + profiles FK, default auth.uid(), forced
     to the caller on insert by non-trusted writers).
   - select-own policy (the 006 open policy is left as-is for admin pages).
   - report_agency_project_payment(): the client cannot UPDATE the row
     (admin-only policy), so "Already paid? Let us know" goes through this
     RPC, which can only move unpaid -> awaiting_confirmation.
   - trigger notifies the client when status, DP amount or DP / final
     payment status change (skipped when the client made the change).
     Replaces 029's on_agency_project_paid_notify (paid-only, email match),
     keeping its email fallback for older rows.
*/

-- ---------------------------------------------------------------------------
-- 1. PROFILES: self-withdraw
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_profile_approvals()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.coach_approved := 'pending';
    NEW.talent_approved := 'pending';
  ELSE
    NEW.coach_approved := OLD.coach_approved;
    NEW.talent_approved := OLD.talent_approved;
    -- Withdrawing (or re-applying after a withdrawal) always lands on
    -- 'pending' — a downgrade only, never an approval.
    IF OLD.is_talent AND NOT NEW.is_talent THEN NEW.talent_approved := 'pending'; END IF;
    IF OLD.is_coach AND NOT NEW.is_coach THEN NEW.coach_approved := 'pending'; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "delete_own_optional_roles" ON user_roles;
CREATE POLICY "delete_own_optional_roles" ON user_roles FOR DELETE
  TO authenticated USING (auth.uid() = user_id AND role IN ('talent','coach'));

-- ---------------------------------------------------------------------------
-- 2. PROJECTS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "select_projects_anon" ON projects;
CREATE POLICY "select_projects_anon" ON projects FOR SELECT
  TO anon USING (true);

ALTER TABLE project_bids DROP CONSTRAINT IF EXISTS project_bids_status_check;
ALTER TABLE project_bids ADD CONSTRAINT project_bids_status_check
  CHECK (status IN ('pending','accepted','rejected','cancelled'));

CREATE OR REPLACE FUNCTION guard_bid_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
  ELSIF auth.uid() = OLD.user_id THEN
    -- The bidder's only status move: withdraw a bid still pending.
    IF NOT (OLD.status = 'pending' AND NEW.status = 'cancelled') THEN
      NEW.status := OLD.status;
    END IF;
  ELSE
    NEW.user_id := OLD.user_id;
    NEW.project_id := OLD.project_id;
    NEW.amount := OLD.amount;
    NEW.proposal := OLD.proposal;
    NEW.eta_days := OLD.eta_days;
    -- Cancelling is the bidder's call, not the owner's.
    IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- accept_project_bid rejects "all other bids"; a withdrawn bid stays withdrawn.
CREATE OR REPLACE FUNCTION keep_cancelled_bid()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'cancelled' THEN NEW.status := 'cancelled'; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS keep_cancelled_bid ON project_bids;
CREATE TRIGGER keep_cancelled_bid BEFORE UPDATE ON project_bids
  FOR EACH ROW EXECUTE FUNCTION keep_cancelled_bid();

-- Completion notice to both parties.
CREATE OR REPLACE FUNCTION trg_notify_project_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bidder uuid;
  v_link text := '/projects/' || NEW.id;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    PERFORM notify_user_i18n(
      NEW.user_id, 'project',
      'Project completed', '"' || NEW.title || '" is marked completed. Rate the freelancer you worked with.',
      'Proyek selesai', '"' || NEW.title || '" ditandai selesai. Beri rating untuk freelancer Anda.',
      v_link
    );
    SELECT user_id INTO v_bidder FROM project_bids
      WHERE project_id = NEW.id AND status = 'accepted' LIMIT 1;
    IF v_bidder IS NOT NULL THEN
      PERFORM notify_user_i18n(
        v_bidder, 'project',
        'Project completed', '"' || NEW.title || '" is marked completed. Rate the project owner.',
        'Proyek selesai', '"' || NEW.title || '" ditandai selesai. Beri rating untuk pemilik proyek.',
        v_link
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_project_completed ON projects;
CREATE TRIGGER trg_notify_project_completed AFTER UPDATE OF status ON projects
  FOR EACH ROW EXECUTE FUNCTION trg_notify_project_completed();

-- Reviews: only the two parties of a completed project, about each other.
DROP POLICY IF EXISTS "select_project_reviews" ON project_reviews;
CREATE POLICY "select_project_reviews" ON project_reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_review" ON project_reviews;
CREATE POLICY "insert_own_review" ON project_reviews FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1
      FROM projects p
      JOIN project_bids b ON b.project_id = p.id AND b.status = 'accepted'
      WHERE p.id = project_reviews.project_id
        AND p.status = 'completed'
        AND (
          (p.user_id = auth.uid() AND b.user_id = project_reviews.reviewee_id)
          OR (b.user_id = auth.uid() AND p.user_id = project_reviews.reviewee_id)
        )
    )
  );

DROP POLICY IF EXISTS "update_own_review" ON project_reviews;
CREATE POLICY "update_own_review" ON project_reviews FOR UPDATE
  TO authenticated USING (auth.uid() = reviewer_id) WITH CHECK (auth.uid() = reviewer_id);

CREATE OR REPLACE FUNCTION guard_review_parties()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  -- An edit may change the rating and comment, never who / what is reviewed.
  NEW.project_id := OLD.project_id;
  NEW.reviewer_id := OLD.reviewer_id;
  NEW.reviewee_id := OLD.reviewee_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_review_parties ON project_reviews;
CREATE TRIGGER guard_review_parties BEFORE UPDATE ON project_reviews
  FOR EACH ROW EXECUTE FUNCTION guard_review_parties();

CREATE INDEX IF NOT EXISTS idx_project_reviews_reviewee ON project_reviews(reviewee_id);

CREATE OR REPLACE FUNCTION trg_notify_project_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM notify_user_i18n(
    NEW.reviewee_id, 'review',
    'New review', 'You received a ' || NEW.rating || '/5 rating on a project.',
    'Ulasan baru', 'Anda menerima rating ' || NEW.rating || '/5 untuk sebuah proyek.',
    '/projects/' || NEW.project_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_project_review ON project_reviews;
CREATE TRIGGER trg_notify_project_review AFTER INSERT ON project_reviews
  FOR EACH ROW EXECUTE FUNCTION trg_notify_project_review();

-- ---------------------------------------------------------------------------
-- 3. BOOKING REVIEWS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  talent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE booking_reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_reviews_reviewer_id_profiles_fkey') THEN
    ALTER TABLE booking_reviews ADD CONSTRAINT booking_reviews_reviewer_id_profiles_fkey
      FOREIGN KEY (reviewer_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_reviews_talent_id_profiles_fkey') THEN
    ALTER TABLE booking_reviews ADD CONSTRAINT booking_reviews_talent_id_profiles_fkey
      FOREIGN KEY (talent_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_booking_reviews_talent ON booking_reviews(talent_id);

DROP POLICY IF EXISTS "select_booking_reviews" ON booking_reviews;
CREATE POLICY "select_booking_reviews" ON booking_reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_booking_review" ON booking_reviews;
CREATE POLICY "insert_own_booking_review" ON booking_reviews FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_reviews.booking_id
        AND b.client_id = auth.uid()
        AND b.talent_id = booking_reviews.talent_id
        AND b.status = 'completed'
    )
  );

DROP POLICY IF EXISTS "update_own_booking_review" ON booking_reviews;
CREATE POLICY "update_own_booking_review" ON booking_reviews FOR UPDATE
  TO authenticated USING (auth.uid() = reviewer_id) WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "delete_own_booking_review" ON booking_reviews;
CREATE POLICY "delete_own_booking_review" ON booking_reviews FOR DELETE
  TO authenticated USING (auth.uid() = reviewer_id);

CREATE OR REPLACE FUNCTION guard_booking_review_parties()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  NEW.booking_id := OLD.booking_id;
  NEW.reviewer_id := OLD.reviewer_id;
  NEW.talent_id := OLD.talent_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_booking_review_parties ON booking_reviews;
CREATE TRIGGER guard_booking_review_parties BEFORE UPDATE ON booking_reviews
  FOR EACH ROW EXECUTE FUNCTION guard_booking_review_parties();

CREATE OR REPLACE FUNCTION trg_notify_booking_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM notify_user_i18n(
    NEW.talent_id, 'review',
    'New review', 'A client rated your session ' || NEW.rating || '/5.',
    'Ulasan baru', 'Klien memberi rating ' || NEW.rating || '/5 untuk sesi Anda.',
    '/talents/' || NEW.talent_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_booking_review ON booking_reviews;
CREATE TRIGGER trg_notify_booking_review AFTER INSERT ON booking_reviews
  FOR EACH ROW EXECUTE FUNCTION trg_notify_booking_review();

-- ---------------------------------------------------------------------------
-- 4. AGENCY PROJECTS (service requests)
-- ---------------------------------------------------------------------------
ALTER TABLE agency_projects
  ADD COLUMN IF NOT EXISTS client_user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agency_projects_client_user_id_profiles_fkey') THEN
    ALTER TABLE agency_projects ADD CONSTRAINT agency_projects_client_user_id_profiles_fkey
      FOREIGN KEY (client_user_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agency_projects_client_user ON agency_projects(client_user_id);

DROP POLICY IF EXISTS "select_own_agency_projects" ON agency_projects;
CREATE POLICY "select_own_agency_projects" ON agency_projects FOR SELECT
  TO authenticated USING (client_user_id = auth.uid());

-- A member can only file a request as themselves.
CREATE OR REPLACE FUNCTION guard_agency_project_client()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  NEW.client_user_id := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_agency_project_client ON agency_projects;
CREATE TRIGGER guard_agency_project_client BEFORE INSERT ON agency_projects
  FOR EACH ROW EXECUTE FUNCTION guard_agency_project_client();

-- Client-side "Already paid? Let us know" for the DP or final payment.
CREATE OR REPLACE FUNCTION report_agency_project_payment(p_project_id uuid, p_stage text, p_note text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_stage NOT IN ('dp','final') THEN
    RAISE EXCEPTION 'Unknown payment stage.' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM agency_projects WHERE id = p_project_id AND client_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Request not found.' USING ERRCODE = '42501';
  END IF;

  IF p_stage = 'dp' THEN
    UPDATE agency_projects
      SET dp_payment_status = 'awaiting_confirmation', dp_payment_note = p_note
      WHERE id = p_project_id AND dp_payment_status = 'unpaid';
  ELSE
    UPDATE agency_projects
      SET final_payment_status = 'awaiting_confirmation', final_payment_note = p_note
      WHERE id = p_project_id AND final_payment_status = 'unpaid';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION report_agency_project_payment(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION report_agency_project_payment(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION trg_notify_agency_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_link text := '/activity?tab=requests';
  v_client uuid := NEW.client_user_id;
BEGIN
  -- Requests filed before this migration have no client_user_id; fall back
  -- to the account registered with the request email (as 029 did).
  IF v_client IS NULL THEN
    SELECT id INTO v_client FROM auth.users WHERE lower(email) = lower(NEW.client_email) LIMIT 1;
  END IF;
  IF v_client IS NULL OR v_client = auth.uid() THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM notify_user_i18n(
      v_client, 'agency_request',
      'Service request update', 'Your service request is now: ' || replace(NEW.status, '_', ' ') || '.',
      'Update permintaan layanan', 'Status permintaan layanan Anda sekarang: ' || replace(NEW.status, '_', ' ') || '.',
      v_link
    );
  END IF;

  IF NEW.dp_amount IS NOT NULL AND NEW.dp_amount IS DISTINCT FROM OLD.dp_amount THEN
    PERFORM notify_user_i18n(
      v_client, 'payment',
      'Down payment invoice ready', 'A down payment is ready for your service request.',
      'Tagihan DP siap', 'Tagihan DP untuk permintaan layanan Anda sudah siap.',
      v_link
    );
  END IF;

  IF NEW.dp_payment_status IS DISTINCT FROM OLD.dp_payment_status THEN
    PERFORM notify_user_i18n(
      v_client, 'payment',
      'Down payment update', 'Down payment status: ' || replace(NEW.dp_payment_status, '_', ' ') || '.',
      'Update DP', 'Status pembayaran DP: ' || replace(NEW.dp_payment_status, '_', ' ') || '.',
      v_link
    );
  END IF;

  IF NEW.final_payment_status IS DISTINCT FROM OLD.final_payment_status THEN
    PERFORM notify_user_i18n(
      v_client, 'payment',
      'Final payment update', 'Final payment status: ' || replace(NEW.final_payment_status, '_', ' ') || '.',
      'Update pelunasan', 'Status pelunasan: ' || replace(NEW.final_payment_status, '_', ' ') || '.',
      v_link
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Supersedes 029's paid-only trigger (it would send a second notice).
DROP TRIGGER IF EXISTS on_agency_project_paid_notify ON agency_projects;

DROP TRIGGER IF EXISTS trg_notify_agency_project ON agency_projects;
CREATE TRIGGER trg_notify_agency_project AFTER UPDATE ON agency_projects
  FOR EACH ROW EXECUTE FUNCTION trg_notify_agency_project();

NOTIFY pgrst, 'reload schema';

-- =========================================================================
-- 20261009000400_032_teams_agency_owner.sql
-- =========================================================================

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

-- =========================================================================
-- 20261009000500_033_community_content.sql
-- =========================================================================

/*
# Community content: edits, build galleries, article slugs

1. discussion_comments had INSERT/DELETE policies but no UPDATE, so a
   reply could never be edited by its author (TC-09-03). Adds an author-only
   UPDATE policy plus a guard so an edit cannot move the reply to another
   thread or hand it to another member. (discussions already has
   update_own_discussions = author OR is_admin(), from 015/027, which is
   also what lets an admin flip is_featured - guard_discussion_featured
   keeps that column admin-only.)

2. builds.image_urls text[] - up to 4 images per build (TC-09-08).
   image_url stays for back-compat; the app writes image_urls[1] there too.
   Existing image_url values are copied into image_urls once.

3. articles.slug - unique, URL-safe, backfilled from title. A BEFORE INSERT
   (and BEFORE UPDATE when slug is blank) trigger fills it, so the admin
   article form keeps working without sending a slug (TC-10-03). Slugs do
   not follow later title edits, so shared links keep working.
   Published articles also get an anon SELECT policy so /articles/{slug}
   (and its server-side metadata) renders for guests.

Idempotent: safe to re-run.
*/

-- ---------------------------------------------------------------------------
-- 1. DISCUSSION REPLIES - author edits own reply
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "update_own_discussion_comments" ON discussion_comments;
CREATE POLICY "update_own_discussion_comments" ON discussion_comments FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE OR REPLACE FUNCTION guard_discussion_comment_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.discussion_id := OLD.discussion_id;
  NEW.user_id := OLD.user_id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_discussion_comment_owner ON discussion_comments;
CREATE TRIGGER guard_discussion_comment_owner BEFORE UPDATE ON discussion_comments
  FOR EACH ROW EXECUTE FUNCTION guard_discussion_comment_owner();

-- ---------------------------------------------------------------------------
-- 2. BUILDS - image gallery (max 4)
-- ---------------------------------------------------------------------------

ALTER TABLE builds ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

UPDATE builds
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url <> '' AND cardinality(image_urls) = 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'builds_image_urls_max_4') THEN
    ALTER TABLE builds ADD CONSTRAINT builds_image_urls_max_4 CHECK (cardinality(image_urls) <= 4);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. ARTICLES - slug
-- ---------------------------------------------------------------------------

ALTER TABLE articles ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION slugify_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(
      left(trim(BOTH '-' FROM regexp_replace(lower(COALESCE(input, '')), '[^a-z0-9]+', '-', 'g')), 80),
      ''
    ),
    'article'
  );
$$;

CREATE OR REPLACE FUNCTION unique_article_slug(base text, self_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate text := base;
  n integer := 1;
BEGIN
  WHILE EXISTS (SELECT 1 FROM articles WHERE slug = candidate AND id IS DISTINCT FROM self_id) LOOP
    n := n + 1;
    candidate := base || '-' || n;
  END LOOP;
  RETURN candidate;
END;
$$;

-- Backfill, oldest first so the original article keeps the bare slug.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id, title FROM articles WHERE slug IS NULL OR slug = '' ORDER BY created_at, id LOOP
    UPDATE articles SET slug = unique_article_slug(slugify_text(r.title), r.id) WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_key ON articles(slug);

CREATE OR REPLACE FUNCTION set_article_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := unique_article_slug(slugify_text(NEW.title), NEW.id);
  ELSE
    NEW.slug := unique_article_slug(slugify_text(NEW.slug), NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Insert: always derive (from the given slug, else the title). Update: only
-- when the caller touches slug, so a title edit keeps the published URL.
DROP TRIGGER IF EXISTS set_article_slug ON articles;
DROP TRIGGER IF EXISTS set_article_slug_insert ON articles;
CREATE TRIGGER set_article_slug_insert BEFORE INSERT ON articles
  FOR EACH ROW EXECUTE FUNCTION set_article_slug();

DROP TRIGGER IF EXISTS set_article_slug_update ON articles;
CREATE TRIGGER set_article_slug_update BEFORE UPDATE OF slug ON articles
  FOR EACH ROW
  WHEN (NEW.slug IS DISTINCT FROM OLD.slug OR NEW.slug IS NULL OR btrim(NEW.slug) = '')
  EXECUTE FUNCTION set_article_slug();

-- Guests read published articles (detail page + server-side metadata).
DROP POLICY IF EXISTS "select_articles_published_public" ON articles;
CREATE POLICY "select_articles_published_public" ON articles FOR SELECT
  TO anon, authenticated USING (is_published = true);

-- =========================================================================
-- 20261009000600_034_courses_events.sql
-- =========================================================================

/*
# 034 - Courses, events, job references, GoAkal settings

Idempotent: every statement can be replayed on a database that already ran it.

1. Certificates are issued by the server (TC-07-04)
   - issue_certificate(p_course_id) checks, from the database and not from the
     browser: the caller is enrolled (and paid, for a paid course), every module
     of the course is completed, and every quiz has a submission whose answers
     re-grade at or above the passing grade. Only then is the row inserted.
   - The member's own INSERT policy on certificates is dropped, so the RPC is
     the only way in.
   - Coaches may read certificates for their own courses (participant list).

2. Courses (TC-07-06)
   - A course with any paid enrollment cannot be deleted (BEFORE DELETE
     trigger). Trusted writers (service role, cascades from account deletion)
     pass through, as with the 027 guards.

3. Events (TC-08-04 / TC-08-05)
   - events.status ('active' | 'cancelled').
   - RSVPs to a cancelled event are rejected (BEFORE INSERT trigger on
     event_rsvps, so create_event_rsvp keeps working unchanged).
   - Cancelling an event notifies every RSVP'd member through
     notify_user_i18n (from 029).
   - get_event_attendees(p_event_id): name, email and payment status for the
     organiser (events.created_by) or an admin only. Organisers have no SELECT
     on other members' RSVP rows, and the email is read server-side here.
   - approval_status is never touched here; 028 guards it.

4. Jobs (TC-02-04 / TC-02-17)
   - job_types and job_locations reference tables, seeded, readable by anon
     and authenticated. jobs.job_type now references job_types(slug) instead
     of a hard-coded CHECK.
   - jobs.skills text[]: skill names a role asks for, used for the match score.

5. app_settings (TC-13-04)
   - lynkid_*_url columns renamed to goakal_*_url.
*/

-- ---------------------------------------------------------------------------
-- 1. CERTIFICATES
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "insert_own_certificates" ON certificates;

DROP POLICY IF EXISTS "select_certificates_coach" ON certificates;
CREATE POLICY "select_certificates_coach" ON certificates FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.coach_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION issue_certificate(p_course_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_price integer;
  v_enrollment_id uuid;
  v_payment text;
  v_total_modules integer;
  v_done_modules integer;
  v_cert_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in.' USING ERRCODE = '42501';
  END IF;

  SELECT price INTO v_price FROM courses WHERE id = p_course_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found.' USING ERRCODE = 'P0002';
  END IF;

  -- Already issued: hand back the existing certificate.
  SELECT id INTO v_cert_id FROM certificates WHERE course_id = p_course_id AND user_id = v_uid;
  IF v_cert_id IS NOT NULL THEN
    RETURN v_cert_id;
  END IF;

  SELECT id, payment_status INTO v_enrollment_id, v_payment
  FROM enrollments WHERE course_id = p_course_id AND user_id = v_uid;
  IF v_enrollment_id IS NULL THEN
    RETURN NULL;
  END IF;
  -- Payment only matters while the LMS fee is switched on (app_settings.lms_fee_active).
  IF COALESCE(v_price, 0) > 0
     AND COALESCE((SELECT lms_fee_active FROM app_settings LIMIT 1), false)
     AND v_payment IS DISTINCT FROM 'paid' THEN
    RETURN NULL;
  END IF;

  -- Progress 100%: every module of the course completed on this enrollment.
  SELECT count(*) INTO v_total_modules FROM course_modules WHERE course_id = p_course_id;
  IF v_total_modules = 0 THEN
    RETURN NULL;
  END IF;

  SELECT count(DISTINCT mc.module_id) INTO v_done_modules
  FROM module_completions mc
  JOIN course_modules cm ON cm.id = mc.module_id
  WHERE mc.enrollment_id = v_enrollment_id AND cm.course_id = p_course_id;

  IF v_done_modules < v_total_modules THEN
    RETURN NULL;
  END IF;

  -- Every quiz passed. The stored `passed` flag comes from the browser, so the
  -- stored answers are re-graded against quiz_questions here.
  IF EXISTS (
    SELECT 1
    FROM quizzes q
    JOIN course_modules cm ON cm.id = q.module_id
    WHERE cm.course_id = p_course_id
      AND EXISTS (SELECT 1 FROM quiz_questions qq WHERE qq.quiz_id = q.id)
      AND NOT EXISTS (
        SELECT 1
        FROM quiz_submissions s
        WHERE s.quiz_id = q.id
          AND s.user_id = v_uid
          AND (
            SELECT round(
              100.0 * count(*) FILTER (WHERE s.answers ->> qq.id::text = qq.correct_answer)
              / NULLIF(count(*), 0)
            )
            FROM quiz_questions qq WHERE qq.quiz_id = q.id
          ) >= q.passing_grade
      )
  ) THEN
    RETURN NULL;
  END IF;

  INSERT INTO certificates (course_id, user_id)
  VALUES (p_course_id, v_uid)
  ON CONFLICT (course_id, user_id) DO NOTHING
  RETURNING id INTO v_cert_id;

  IF v_cert_id IS NULL THEN
    SELECT id INTO v_cert_id FROM certificates WHERE course_id = p_course_id AND user_id = v_uid;
  END IF;

  UPDATE enrollments SET progress = 100, status = 'completed' WHERE id = v_enrollment_id;

  RETURN v_cert_id;
END;
$$;

REVOKE ALL ON FUNCTION issue_certificate(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION issue_certificate(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. COURSES: no delete once someone has paid
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION course_has_paid_enrollments(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM enrollments WHERE course_id = p_course_id AND payment_status = 'paid'
  );
$$;

-- SECURITY INVOKER on purpose: current_user must still be the caller so
-- trusted writers (service role, account-deletion cascades) pass through.
CREATE OR REPLACE FUNCTION guard_course_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN OLD;
  END IF;
  IF course_has_paid_enrollments(OLD.id) THEN
    RAISE EXCEPTION 'This course has paid participants and cannot be deleted.'
      USING ERRCODE = '23514';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS guard_course_delete ON courses;
CREATE TRIGGER guard_course_delete BEFORE DELETE ON courses
  FOR EACH ROW EXECUTE FUNCTION guard_course_delete();

-- ---------------------------------------------------------------------------
-- 3. EVENTS
-- ---------------------------------------------------------------------------

ALTER TABLE events ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_status_check') THEN
    ALTER TABLE events ADD CONSTRAINT events_status_check
      CHECK (status IN ('active', 'cancelled'));
  END IF;
END $$;

-- RSVPs to a cancelled event are refused, whichever path inserts them.
CREATE OR REPLACE FUNCTION guard_rsvp_cancelled_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM events WHERE id = NEW.event_id AND status = 'cancelled') THEN
    RAISE EXCEPTION 'This event has been cancelled.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_rsvp_cancelled_event ON event_rsvps;
CREATE TRIGGER guard_rsvp_cancelled_event BEFORE INSERT ON event_rsvps
  FOR EACH ROW EXECUTE FUNCTION guard_rsvp_cancelled_event();

-- Cancelling notifies everyone who RSVP'd.
CREATE OR REPLACE FUNCTION trg_notify_event_cancelled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_date text := to_char(NEW.event_date AT TIME ZONE 'Asia/Jakarta', 'DD Mon YYYY HH24:MI');
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    FOR r IN
      SELECT DISTINCT user_id FROM event_rsvps
      WHERE event_id = NEW.id AND status <> 'cancelled'
    LOOP
      PERFORM notify_user_i18n(
        r.user_id,
        'event_cancelled',
        'Event cancelled',
        format('"%s" on %s WIB has been cancelled by the organiser.', NEW.title, v_date),
        'Event dibatalkan',
        format('"%s" pada %s WIB dibatalkan oleh penyelenggara.', NEW.title, v_date),
        '/events/' || NEW.id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_event_cancelled ON events;
CREATE TRIGGER on_event_cancelled AFTER UPDATE OF status ON events
  FOR EACH ROW EXECUTE FUNCTION trg_notify_event_cancelled();

-- Attendee list for the organiser. Emails live on profiles (copied from
-- auth.users by 024); auth.users is the fallback.
DROP FUNCTION IF EXISTS get_event_attendees(uuid);
CREATE FUNCTION get_event_attendees(p_event_id uuid)
RETURNS TABLE (
  rsvp_id uuid,
  user_id uuid,
  full_name text,
  email text,
  rsvp_status text,
  payment_status text,
  registered_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in.' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM events e WHERE e.id = p_event_id AND (e.created_by = auth.uid() OR is_admin())
  ) THEN
    RAISE EXCEPTION 'Only the organiser can see attendees.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.user_id,
    p.full_name,
    COALESCE(p.email, u.email)::text,
    r.status,
    r.payment_status,
    r.created_at
  FROM event_rsvps r
  LEFT JOIN profiles p ON p.id = r.user_id
  LEFT JOIN auth.users u ON u.id = r.user_id
  WHERE r.event_id = p_event_id
  ORDER BY r.created_at;
END;
$$;

REVOKE ALL ON FUNCTION get_event_attendees(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_event_attendees(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. JOBS: reference tables and required skills
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS job_types (
  slug text PRIMARY KEY,
  label_en text NOT NULL,
  label_id text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);
ALTER TABLE job_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_job_types" ON job_types;
CREATE POLICY "select_job_types" ON job_types FOR SELECT
  TO anon, authenticated USING (true);

INSERT INTO job_types (slug, label_en, label_id, sort_order) VALUES
  ('full-time',  'Full-time',  'Penuh Waktu', 1),
  ('part-time',  'Part-time',  'Paruh Waktu', 2),
  ('contract',   'Contract',   'Kontrak',     3),
  ('internship', 'Internship', 'Magang',      4),
  ('remote',     'Remote',     'Remote',      5)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS job_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0
);
ALTER TABLE job_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_job_locations" ON job_locations;
CREATE POLICY "select_job_locations" ON job_locations FOR SELECT
  TO anon, authenticated USING (true);

INSERT INTO job_locations (name, sort_order) VALUES
  ('Jakarta', 1), ('Bandung', 2), ('Surabaya', 3), ('Yogyakarta', 4),
  ('Medan', 5), ('Makassar', 6), ('Bali', 7), ('Remote', 8)
ON CONFLICT (name) DO NOTHING;

-- job_type values now come from job_types instead of a hard-coded CHECK.
INSERT INTO job_types (slug, label_en, label_id, sort_order)
SELECT DISTINCT j.job_type, initcap(replace(j.job_type, '-', ' ')), initcap(replace(j.job_type, '-', ' ')), 99
FROM jobs j
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_job_type_check;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_job_type_fkey') THEN
    ALTER TABLE jobs ADD CONSTRAINT jobs_job_type_fkey
      FOREIGN KEY (job_type) REFERENCES job_types(slug) ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- 5. APP_SETTINGS: lynkid_*_url -> goakal_*_url
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_kind text;
BEGIN
  FOREACH v_kind IN ARRAY ARRAY['bookings', 'agency', 'courses', 'events'] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'app_settings'
        AND column_name = 'lynkid_' || v_kind || '_url'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'app_settings'
        AND column_name = 'goakal_' || v_kind || '_url'
    ) THEN
      EXECUTE format('ALTER TABLE app_settings RENAME COLUMN %I TO %I',
        'lynkid_' || v_kind || '_url', 'goakal_' || v_kind || '_url');
    ELSIF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'app_settings'
        AND column_name = 'goakal_' || v_kind || '_url'
    ) THEN
      EXECUTE format('ALTER TABLE app_settings ADD COLUMN %I text', 'goakal_' || v_kind || '_url');
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Muat ulang cache schema PostgREST supaya kolom/tabel baru langsung terbaca API.
NOTIFY pgrst, 'reload schema';
