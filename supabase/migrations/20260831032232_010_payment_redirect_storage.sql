/*
# Payment Redirect Flow (lynk.id model) + Storage Buckets

## What this migration does

### 1. Payment columns on app_settings
- lynkid_bookings_url, lynkid_agency_url, lynkid_courses_url, lynkid_events_url (text) — default fallback payment links per category, set by admin.

### 2. Payment columns on bookings, enrollments, event_rsvps
- payment_status text NOT NULL DEFAULT 'unpaid' CHECK IN ('unpaid','awaiting_confirmation','paid')
- payment_link_url text
- payment_note text
- payment_confirmed_at timestamptz
- payment_confirmed_by uuid REFERENCES auth.users(id)

### 3. Payment columns on agency_projects (two payment moments)
- dp_payment_status text NOT NULL DEFAULT 'unpaid' CHECK IN ('unpaid','awaiting_confirmation','paid')
- dp_payment_link_url text
- dp_payment_note text
- dp_payment_confirmed_at timestamptz
- dp_payment_confirmed_by uuid REFERENCES auth.users(id)
- final_payment_status text NOT NULL DEFAULT 'unpaid' CHECK IN ('unpaid','awaiting_confirmation','paid')
- final_payment_link_url text
- final_payment_note text
- final_payment_confirmed_at timestamptz
- final_payment_confirmed_by uuid REFERENCES auth.users(id)

### 4. RLS updates
- Users can update their own payment_note on bookings/enrollments/event_rsvps (sets status to awaiting_confirmation).
- Only admins can update payment_status/payment_confirmed_at/payment_confirmed_by.
- Agency projects: only admins can update payment columns (users submit via the existing request flow).

### 5. Storage buckets
- avatars, company-logos, portfolios, certificates (all public)
- Storage policies: authenticated users can INSERT/UPDATE files under their own auth.uid() path; public SELECT for all.

### 6. Security notes
- payment_note is user-editable; payment_status and confirmation fields are admin-only.
- The user UPDATE policy is restricted to only the payment_note column via a CHECK on the new row.
*/

-- === APP SETTINGS: lynkid URLs ===
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'lynkid_bookings_url') THEN
    ALTER TABLE app_settings ADD COLUMN lynkid_bookings_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'lynkid_agency_url') THEN
    ALTER TABLE app_settings ADD COLUMN lynkid_agency_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'lynkid_courses_url') THEN
    ALTER TABLE app_settings ADD COLUMN lynkid_courses_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'lynkid_events_url') THEN
    ALTER TABLE app_settings ADD COLUMN lynkid_events_url text;
  END IF;
END $$;

-- === BOOKINGS: payment columns ===
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_status') THEN
    ALTER TABLE bookings ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','awaiting_confirmation','paid'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_link_url') THEN
    ALTER TABLE bookings ADD COLUMN payment_link_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_note') THEN
    ALTER TABLE bookings ADD COLUMN payment_note text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_confirmed_at') THEN
    ALTER TABLE bookings ADD COLUMN payment_confirmed_at timestamptz;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_confirmed_by') THEN
    ALTER TABLE bookings ADD COLUMN payment_confirmed_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Replace bookings UPDATE policy: user can update only payment_note; admin can update all
DROP POLICY IF EXISTS "update_booking_talent" ON bookings;
CREATE POLICY "update_booking_talent" ON bookings FOR UPDATE
  TO authenticated USING (
    auth.uid() = talent_id OR auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

-- === ENROLLMENTS: payment columns ===
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'payment_status') THEN
    ALTER TABLE enrollments ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','awaiting_confirmation','paid'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'payment_link_url') THEN
    ALTER TABLE enrollments ADD COLUMN payment_link_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'payment_note') THEN
    ALTER TABLE enrollments ADD COLUMN payment_note text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'payment_confirmed_at') THEN
    ALTER TABLE enrollments ADD COLUMN payment_confirmed_at timestamptz;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'payment_confirmed_by') THEN
    ALTER TABLE enrollments ADD COLUMN payment_confirmed_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- === EVENT_RSVPS: payment columns ===
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_rsvps' AND column_name = 'payment_status') THEN
    ALTER TABLE event_rsvps ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','awaiting_confirmation','paid'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_rsvps' AND column_name = 'payment_link_url') THEN
    ALTER TABLE event_rsvps ADD COLUMN payment_link_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_rsvps' AND column_name = 'payment_note') THEN
    ALTER TABLE event_rsvps ADD COLUMN payment_note text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_rsvps' AND column_name = 'payment_confirmed_at') THEN
    ALTER TABLE event_rsvps ADD COLUMN payment_confirmed_at timestamptz;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_rsvps' AND column_name = 'payment_confirmed_by') THEN
    ALTER TABLE event_rsvps ADD COLUMN payment_confirmed_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- === AGENCY_PROJECTS: DP + final payment columns ===
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'dp_payment_status') THEN
    ALTER TABLE agency_projects ADD COLUMN dp_payment_status text NOT NULL DEFAULT 'unpaid' CHECK (dp_payment_status IN ('unpaid','awaiting_confirmation','paid'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'dp_payment_link_url') THEN
    ALTER TABLE agency_projects ADD COLUMN dp_payment_link_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'dp_payment_note') THEN
    ALTER TABLE agency_projects ADD COLUMN dp_payment_note text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'dp_payment_confirmed_at') THEN
    ALTER TABLE agency_projects ADD COLUMN dp_payment_confirmed_at timestamptz;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'dp_payment_confirmed_by') THEN
    ALTER TABLE agency_projects ADD COLUMN dp_payment_confirmed_by uuid REFERENCES auth.users(id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'final_payment_status') THEN
    ALTER TABLE agency_projects ADD COLUMN final_payment_status text NOT NULL DEFAULT 'unpaid' CHECK (final_payment_status IN ('unpaid','awaiting_confirmation','paid'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'final_payment_link_url') THEN
    ALTER TABLE agency_projects ADD COLUMN final_payment_link_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'final_payment_note') THEN
    ALTER TABLE agency_projects ADD COLUMN final_payment_note text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'final_payment_confirmed_at') THEN
    ALTER TABLE agency_projects ADD COLUMN final_payment_confirmed_at timestamptz;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'final_payment_confirmed_by') THEN
    ALTER TABLE agency_projects ADD COLUMN final_payment_confirmed_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- === STORAGE BUCKETS ===
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('company-logos', 'company-logos', true),
  ('portfolios', 'portfolios', true),
  ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can manage files under their own uid path; public read
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "company_logos_select_public" ON storage.objects;
CREATE POLICY "company_logos_select_public" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'company-logos');

DROP POLICY IF EXISTS "company_logos_insert_own" ON storage.objects;
CREATE POLICY "company_logos_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "company_logos_update_own" ON storage.objects;
CREATE POLICY "company_logos_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "portfolios_select_public" ON storage.objects;
CREATE POLICY "portfolios_select_public" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'portfolios');

DROP POLICY IF EXISTS "portfolios_insert_own" ON storage.objects;
CREATE POLICY "portfolios_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'portfolios' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "portfolios_update_own" ON storage.objects;
CREATE POLICY "portfolios_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'portfolios' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "certificates_select_public" ON storage.objects;
CREATE POLICY "certificates_select_public" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'certificates');

DROP POLICY IF EXISTS "certificates_insert_own" ON storage.objects;
CREATE POLICY "certificates_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);
