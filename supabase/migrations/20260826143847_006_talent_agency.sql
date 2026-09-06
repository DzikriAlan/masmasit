/*
# Talent & Agency: Bookings, Agency Services, Agency Projects, Case Studies, Settings

1. New Tables
- `bookings` — talent booking (consultation/mentoring) with admin fee percentage
- `agency_services` — service listings by category (SaaS, AI, Creative, HR)
- `agency_projects` — client project requests with DP, admin fee, and revenue share
- `case_studies` — showcase completed projects (challenge, solution, result)
- `app_settings` — configurable fee percentages and module activation flags (singleton)

2. Security
- bookings: talent can SELECT bookings for themselves; client can SELECT own; client can INSERT; talent can UPDATE status.
- agency_services: any authenticated user can SELECT; super_admin can INSERT/UPDATE/DELETE.
- agency_projects: any authenticated user can SELECT; any authenticated user can INSERT; super_admin can UPDATE.
- case_studies: any authenticated user can SELECT; super_admin can INSERT/UPDATE/DELETE.
- app_settings: any authenticated user can SELECT; super_admin can UPDATE.
*/

-- BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_type text NOT NULL CHECK (booking_type IN ('consultation','mentoring')),
  scheduled_at timestamptz NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  amount integer NOT NULL DEFAULT 0,
  admin_fee_percentage numeric(5,2) NOT NULL DEFAULT 15.00,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_bookings" ON bookings;
CREATE POLICY "select_bookings" ON bookings FOR SELECT
  TO authenticated USING (
    auth.uid() = talent_id OR auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "insert_own_booking" ON bookings;
CREATE POLICY "insert_own_booking" ON bookings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "update_booking_talent" ON bookings;
CREATE POLICY "update_booking_talent" ON bookings FOR UPDATE
  TO authenticated USING (
    auth.uid() = talent_id OR auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

-- AGENCY SERVICES
CREATE TABLE IF NOT EXISTS agency_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('SaaS','AI Solutions','Creative Services','HR Solutions')),
  title text NOT NULL,
  description text NOT NULL,
  base_price integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agency_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_agency_services" ON agency_services;
CREATE POLICY "select_agency_services" ON agency_services FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_services_admin" ON agency_services;
CREATE POLICY "insert_services_admin" ON agency_services FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "update_services_admin" ON agency_services;
CREATE POLICY "update_services_admin" ON agency_services FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_services_admin" ON agency_services;
CREATE POLICY "delete_services_admin" ON agency_services FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- AGENCY PROJECTS
CREATE TABLE IF NOT EXISTS agency_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_company text,
  service_id uuid NOT NULL REFERENCES agency_services(id) ON DELETE RESTRICT,
  scope text NOT NULL,
  budget integer,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','in_review','approved','in_progress','completed','cancelled')),
  dp_amount integer,
  admin_fee_percentage numeric(5,2) NOT NULL DEFAULT 10.00,
  revenue_share_percentage numeric(5,2) NOT NULL DEFAULT 10.00,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agency_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_agency_projects" ON agency_projects;
CREATE POLICY "select_agency_projects" ON agency_projects FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_agency_projects" ON agency_projects;
CREATE POLICY "insert_agency_projects" ON agency_projects FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_agency_projects_admin" ON agency_projects;
CREATE POLICY "update_agency_projects_admin" ON agency_projects FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

-- CASE STUDIES
CREATE TABLE IF NOT EXISTS case_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  client_name text NOT NULL,
  challenge text NOT NULL,
  solution text NOT NULL,
  result text NOT NULL,
  image_url text,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_case_studies" ON case_studies;
CREATE POLICY "select_case_studies" ON case_studies FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_case_studies_admin" ON case_studies;
CREATE POLICY "insert_case_studies_admin" ON case_studies FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "update_case_studies_admin" ON case_studies;
CREATE POLICY "update_case_studies_admin" ON case_studies FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_case_studies_admin" ON case_studies;
CREATE POLICY "delete_case_studies_admin" ON case_studies FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- APP SETTINGS (singleton)
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_admin_fee_percentage numeric(5,2) NOT NULL DEFAULT 15.00,
  agency_admin_fee_percentage numeric(5,2) NOT NULL DEFAULT 10.00,
  agency_revenue_share_percentage numeric(5,2) NOT NULL DEFAULT 10.00,
  job_fee_active boolean NOT NULL DEFAULT false,
  project_fee_active boolean NOT NULL DEFAULT false,
  lms_fee_active boolean NOT NULL DEFAULT false,
  event_fee_active boolean NOT NULL DEFAULT false
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_app_settings" ON app_settings;
CREATE POLICY "select_app_settings" ON app_settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_app_settings_admin" ON app_settings;
CREATE POLICY "update_app_settings_admin" ON app_settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

-- Seed default settings row
INSERT INTO app_settings (id, talent_admin_fee_percentage, agency_admin_fee_percentage, agency_revenue_share_percentage)
VALUES (gen_random_uuid(), 15.00, 10.00, 10.00)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_bookings_talent ON bookings(talent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_agency_services_category ON agency_services(category);
