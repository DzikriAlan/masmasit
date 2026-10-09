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
