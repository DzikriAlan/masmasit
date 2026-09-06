/*
# Allow any authenticated user to create events

## Changes
- Replaces the insert_events_admin policy so any authenticated user can create events (not just regional_admin/super_admin).
- This enables the event creation flow for all signed-in community members.
*/

DROP POLICY IF EXISTS "insert_events_admin" ON events;
DROP POLICY IF EXISTS "insert_events_authenticated" ON events;

CREATE POLICY "insert_events_authenticated"
ON events FOR INSERT
TO authenticated
WITH CHECK (true);
