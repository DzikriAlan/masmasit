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
