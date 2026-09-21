/*
# Every new account gets a profile row the moment it exists

Migration 023 added foreign keys from every owner column to profiles(id), and
backfilled a profile for each account that existed at that moment. Nothing
creates one for accounts made AFTER it:

- Google sign-in goes through /auth/callback straight to the landing page,
  which never writes to profiles.
- Email sign-up writes the profile from the browser right after signUp(). When
  email confirmation is on there is no session yet, so RLS rejects that insert
  and the error is ignored.

Either way the account has no profile, and the first thing it tries to create
-- a team in Team Builder, a Spotlight submission, a build -- fails the new
foreign key with 23503. The UI only says "Failed".

The fix is the standard Supabase pattern: an AFTER INSERT trigger on
auth.users that creates the profile, filled exactly the way the 023 backfill
filled it. ON CONFLICT DO NOTHING keeps the browser-side insert in signUp()
and the upsert in onboarding working unchanged. The backfill is repeated for
any account created between 023 and this migration.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@unknown.local'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'member'), '@', 1)),
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

INSERT INTO profiles (id, email, full_name, created_at)
SELECT u.id,
       COALESCE(u.email, u.id::text || '@unknown.local'),
       COALESCE(u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email, 'member'), '@', 1)),
       COALESCE(u.created_at, now())
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT DO NOTHING;
