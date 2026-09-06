/*
# Events: Regions, Events, RSVPs

1. New Tables
- `regions` — regional community areas with assigned admin
- `events` — events created by regional admins (location, date, capacity, paid flag)
- `event_rsvps` — member registrations and check-ins

2. Security
- regions: any authenticated user can SELECT; super_admin can INSERT/UPDATE.
- events: any authenticated user can SELECT; regional_admin (region owner) or super_admin can INSERT/UPDATE/DELETE.
- event_rsvps: user can SELECT own; user can INSERT/UPDATE own RSVP.
*/

CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_regions" ON regions;
CREATE POLICY "select_regions" ON regions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_regions_admin" ON regions;
CREATE POLICY "insert_regions_admin" ON regions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "update_regions_admin" ON regions;
CREATE POLICY "update_regions_admin" ON regions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  event_type text NOT NULL DEFAULT 'meetup' CHECK (event_type IN ('meetup','workshop','conference','hackathon','webinar')),
  location text NOT NULL,
  event_date timestamptz NOT NULL,
  max_capacity integer NOT NULL DEFAULT 50,
  is_paid boolean NOT NULL DEFAULT false,
  price integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_events" ON events;
CREATE POLICY "select_events" ON events FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_events_admin" ON events;
CREATE POLICY "insert_events_admin" ON events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('regional_admin','super_admin'))
  );

DROP POLICY IF EXISTS "update_events_admin" ON events;
CREATE POLICY "update_events_admin" ON events FOR UPDATE
  TO authenticated USING (
    auth.uid() = (SELECT admin_user_id FROM regions WHERE id = region_id)
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_events_admin" ON events;
CREATE POLICY "delete_events_admin" ON events FOR DELETE
  TO authenticated USING (
    auth.uid() = (SELECT admin_user_id FROM regions WHERE id = region_id)
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- EVENT RSVPS
CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','checked_in','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_rsvps" ON event_rsvps;
CREATE POLICY "select_own_rsvps" ON event_rsvps FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('regional_admin','super_admin'))
  );

DROP POLICY IF EXISTS "insert_own_rsvp" ON event_rsvps;
CREATE POLICY "insert_own_rsvp" ON event_rsvps FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_rsvp" ON event_rsvps;
CREATE POLICY "update_own_rsvp" ON event_rsvps FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_rsvp_admin" ON event_rsvps;
CREATE POLICY "update_rsvp_admin" ON event_rsvps FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('regional_admin','super_admin'))
  ) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_events_region ON events(region_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event ON event_rsvps(event_id);
