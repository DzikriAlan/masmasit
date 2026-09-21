/*
# Enforce app_settings as a singleton

app_settings is read with maybeSingle() in four places (admin settings, and
the lynk.id payment link lookups for courses, events and bookings). That
helper raises when it gets more than one row, so a second settings row takes
those screens down rather than being merely untidy.

Migration 006 could produce exactly that: its INSERT generated a fresh uuid
each run, so ON CONFLICT never fired and every replay appended another row.
006 is now guarded, but any database that already ran it twice still holds
the duplicates.

This collapses them to the oldest row and makes a second row impossible.
*/

-- Keep the oldest row; anything the app already points at stays valid.
DELETE FROM app_settings a
USING app_settings b
WHERE a.ctid > b.ctid;

-- A unique index on a constant permits exactly one row, forever.
CREATE UNIQUE INDEX IF NOT EXISTS app_settings_singleton ON app_settings ((true));
