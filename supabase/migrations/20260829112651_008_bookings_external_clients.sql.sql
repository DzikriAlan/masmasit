/*
# Allow external (non-logged-in) bookings

1. Modified Tables
- `bookings`: Added `client_name` (text, nullable) and `client_email` (text, nullable) columns.
- `bookings`: Made `client_id` nullable (was NOT NULL) so external clients without an account can book.
- `bookings`: Removed the `DEFAULT auth.uid()` on `client_id` so it defaults to NULL for external bookings.

2. Security
- Updated insert policy: `anon` role can now insert bookings when `client_id` is null but `client_name` and `client_email` are provided.
- `authenticated` users still insert with their own `client_id`.
- SELECT/UPDATE policies unchanged.

3. Important Notes
- This enables the PRD feature where external clients (not platform members) can book talent consultations.
- External bookings store client_name + client_email instead of a client_id reference.
*/

-- Add external client columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'client_name') THEN
    ALTER TABLE bookings ADD COLUMN client_name text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'client_email') THEN
    ALTER TABLE bookings ADD COLUMN client_email text;
  END IF;
END $$;

-- Make client_id nullable and remove default auth.uid()
ALTER TABLE bookings ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN client_id DROP DEFAULT;

-- Replace insert policy to allow both authenticated and anon inserts
DROP POLICY IF EXISTS "insert_own_booking" ON bookings;
CREATE POLICY "insert_own_booking" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (
    (auth.uid() = client_id) OR
    (client_id IS NULL AND client_name IS NOT NULL AND client_email IS NOT NULL)
  );
