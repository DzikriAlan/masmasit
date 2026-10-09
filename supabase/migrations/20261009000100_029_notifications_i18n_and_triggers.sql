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
