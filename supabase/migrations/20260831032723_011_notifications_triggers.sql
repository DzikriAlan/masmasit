/*
# Notifications table + triggers

## Tables
- notifications: id, user_id, type, title, body, link, is_read, created_at

## RLS
- User can SELECT/UPDATE only their own rows
- INSERT via triggers (SECURITY DEFINER functions)

## Triggers
- New message → notify receiver
- Job application status change → notify applicant
- Booking status change → notify client and talent
- Agency project status change → notify (no client_id, so we skip — admin handles externally)
*/
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- Function to insert a notification (callable from triggers)
CREATE OR REPLACE FUNCTION notify_user(target_uid uuid, n_type text, n_title text, n_body text, n_link text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (target_uid, n_type, n_title, n_body, n_link);
END;
$$;

-- Trigger: new message → notify receiver
CREATE OR REPLACE FUNCTION trg_notify_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.receiver_id IS NOT NULL THEN
    PERFORM notify_user(NEW.receiver_id, 'message', 'New message', 'You have a new message', '/pesan');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_insert ON messages;
CREATE TRIGGER on_message_insert AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION trg_notify_message();

-- Trigger: job application status change → notify applicant
CREATE OR REPLACE FUNCTION trg_notify_job_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM notify_user(NEW.user_id, 'job_application', 'Application update', 'Your job application status: ' || NEW.status, '/dashboard');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_job_application_update ON job_applications;
CREATE TRIGGER on_job_application_update AFTER UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION trg_notify_job_application();

-- Trigger: booking status change → notify client and talent
CREATE OR REPLACE FUNCTION trg_notify_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.client_id IS NOT NULL THEN
      PERFORM notify_user(NEW.client_id, 'booking', 'Booking update', 'Your booking status: ' || NEW.status, '/dashboard');
    END IF;
    PERFORM notify_user(NEW.talent_id, 'booking', 'Booking update', 'Booking status: ' || NEW.status, '/dashboard');
  END IF;
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status AND NEW.payment_status = 'paid' THEN
    IF NEW.client_id IS NOT NULL THEN
      PERFORM notify_user(NEW.client_id, 'payment', 'Payment confirmed', 'Your payment has been confirmed', '/dashboard');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_update ON bookings;
CREATE TRIGGER on_booking_update AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION trg_notify_booking();
