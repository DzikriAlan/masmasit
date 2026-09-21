/*
# Give PostgREST the relationships the app has always assumed

Every owner column in this schema references auth.users(id). profiles.id also
references auth.users(id), but there is no foreign key from those tables TO
profiles -- and PostgREST can only embed across a real foreign key.

So every query shaped like

    .from('projects').select('*, profiles(full_name)')

failed at runtime with PGRST200, "no foreign key relationship between
'projects' and 'profiles'". The browse page then rendered its error state,
which reads as "could not load" rather than "this is misconfigured". Twenty
such queries were failing across projects, discussions, builds, spotlight,
courses, the member directory, talent bookings, job applicants and six admin
screens.

The fix is a second foreign key on the same column, pointing at profiles.
Both constraints can coexist: profiles.id is a subset of auth.users.id, so
satisfying the new one always satisfies the old one. auth is not an exposed
schema, so PostgREST sees exactly one candidate relationship and no
ambiguity. Where two columns of one table point at profiles (bookings), the
app already disambiguates with the profiles:column form.

ON DELETE is matched to whatever the original auth.users constraint used, so
deletion behaviour does not change.

Step 1 backfills a profile for any account that never finished onboarding,
because the new constraints cannot be created while a row points at a user
with no profile.
*/

-- ---------------------------------------------------------------------------
-- 1. BACKFILL: every auth user needs a profile row before the FKs can exist
-- ---------------------------------------------------------------------------
INSERT INTO profiles (id, email, full_name, created_at)
SELECT u.id,
       COALESCE(u.email, u.id::text || '@unknown.local'),
       COALESCE(u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email, 'member'), '@', 1)),
       COALESCE(u.created_at, now())
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. THE FOREIGN KEYS
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  fk record;
  cname text;
BEGIN
  FOR fk IN
    SELECT * FROM (VALUES
      ('user_roles','user_id','CASCADE'),
      ('user_skills','user_id','CASCADE'),
      ('experiences','user_id','CASCADE'),
      ('companies','user_id','CASCADE'),
      ('job_applications','user_id','CASCADE'),
      ('projects','user_id','CASCADE'),
      ('project_bids','user_id','CASCADE'),
      ('project_reviews','reviewer_id','CASCADE'),
      ('project_reviews','reviewee_id','CASCADE'),
      ('courses','coach_id','CASCADE'),
      ('enrollments','user_id','CASCADE'),
      ('certificates','user_id','CASCADE'),
      ('module_completions','user_id','CASCADE'),
      ('quiz_submissions','user_id','CASCADE'),
      ('event_rsvps','user_id','CASCADE'),
      ('bookings','talent_id','CASCADE'),
      ('bookings','client_id','CASCADE'),
      ('messages','sender_id','CASCADE'),
      ('messages','recipient_id','CASCADE'),
      ('notifications','user_id','CASCADE'),
      ('teams','owner_id','CASCADE'),
      ('team_members','user_id','CASCADE'),
      ('team_collabs','created_by','CASCADE'),
      ('discussions','user_id','CASCADE'),
      ('discussion_comments','user_id','CASCADE'),
      ('builds','user_id','CASCADE'),
      ('build_likes','user_id','CASCADE'),
      ('regions','admin_user_id','SET NULL'),
      ('events','created_by','SET NULL'),
      ('audit_logs','actor_id','SET NULL'),
      ('agencies','owner_id','SET NULL'),
      ('articles','author_id','SET NULL')
    ) AS v(tbl, col, on_delete)
  LOOP
    cname := fk.tbl || '_' || fk.col || '_profiles_fkey';

    CONTINUE WHEN EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = cname
    );
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = fk.tbl AND column_name = fk.col
    );

    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES profiles(id) ON DELETE %s',
      fk.tbl, cname, fk.col, fk.on_delete
    );
  END LOOP;
END $$;

-- PostgREST caches the schema. Without this the new relationships stay
-- invisible until the API restarts on its own.
NOTIFY pgrst, 'reload schema';
