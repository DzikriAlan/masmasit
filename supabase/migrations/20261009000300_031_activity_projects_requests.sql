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
