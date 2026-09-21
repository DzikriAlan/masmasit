/*
# Fix: sending a message fails with "record new has no field receiver_id"

## The bug
Migration 011 added an AFTER INSERT trigger on `messages` whose function reads
`NEW.receiver_id`. That column does not exist - migration 007 created the table
with `recipient_id`. plpgsql only resolves a record field at execution time, so
the function was created without complaint and then raised on the first insert.

The trigger is AFTER INSERT with no exception handling, so the error aborts the
statement: **every** attempt to send a message fails, for every user. The
messaging feature has been non-functional since 011 was applied.

## The fix
Redefine the function against the real column name. The trigger itself already
points at this function, so nothing else has to change.
*/

CREATE OR REPLACE FUNCTION trg_notify_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.recipient_id IS NOT NULL THEN
    PERFORM notify_user(NEW.recipient_id, 'message', 'New message', 'You have a new message', '/pesan');
  END IF;
  RETURN NEW;
END;
$$;
