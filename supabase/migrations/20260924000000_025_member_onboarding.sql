/*
# Member onboarding answers

Google sign-in never passes through /onboarding: the auto-profile trigger
(024) fills full_name, and the landing check treats a named profile as
finished. So most members have no field, level or goals on record, and the
admin panel cannot say who the community actually is.

A short popup now asks every member six questions. Location and
current_job_status already exist on profiles; skills already live in
user_skills. This adds the rest:

- fields               what they work on (frontend, backend, ...), multi-select
- experience_level     student / junior / mid / senior / lead
- join_goals           why they joined; drives Discover personalisation
- onboarding_completed_at   set once the popup is submitted
- onboarding_snoozed_until  "Later" hides the popup until this time; stored
                            here rather than in the browser so it holds
                            across devices

The existing update_own_profile policy already lets members write these.
Admins read them through the existing select_profiles policy.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS fields text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience_level text,
  ADD COLUMN IF NOT EXISTS join_goals text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_snoozed_until timestamptz;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_fields_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_fields_check
  CHECK (fields <@ ARRAY['frontend','backend','mobile','uiux','data','devops','qa','pm']::text[]);

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_experience_level_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_experience_level_check
  CHECK (experience_level IS NULL OR experience_level IN ('student','junior','mid','senior','lead'));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_join_goals_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_join_goals_check
  CHECK (join_goals <@ ARRAY['find_job','find_team','learn','networking','hire']::text[]);

CREATE INDEX IF NOT EXISTS profiles_onboarding_completed_at_idx ON profiles (onboarding_completed_at);

/*
referral_source: where the member heard about MasmasIT, asked in the popup.
referral_note holds the free text when they pick other.
*/
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS referral_note text;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_referral_source_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_referral_source_check
  CHECK (referral_source IS NULL OR referral_source IN
    ('instagram','tiktok','linkedin','x','youtube','google','friend','community','other'));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_referral_note_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_referral_note_check
  CHECK (referral_note IS NULL OR length(referral_note) <= 100);

/*
ensure_skills(names): the skill input lets members type a skill that is not
in the catalogue yet. skills only allows admin inserts, so rather than open
that up, this function looks each name up case-insensitively and creates
only the missing ones, then returns every matching row. Names are trimmed,
inner whitespace collapsed, capped at 40 chars and 30 per call.
*/
CREATE OR REPLACE FUNCTION ensure_skills(names text[])
RETURNS SETOF skills
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n text;
  clean text[] := '{}';
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;
  IF coalesce(array_length(names, 1), 0) > 30 THEN
    RAISE EXCEPTION 'too many skills';
  END IF;

  FOREACH n IN ARRAY coalesce(names, '{}') LOOP
    n := btrim(regexp_replace(n, '\s+', ' ', 'g'));
    CONTINUE WHEN n = '' OR length(n) > 40;
    clean := clean || n;
    IF NOT EXISTS (SELECT 1 FROM skills s WHERE lower(s.name) = lower(n)) THEN
      INSERT INTO skills (name) VALUES (n) ON CONFLICT (name) DO NOTHING;
    END IF;
  END LOOP;

  RETURN QUERY
    SELECT s.* FROM skills s
    WHERE lower(s.name) IN (SELECT lower(x) FROM unnest(clean) x);
END;
$$;

REVOKE ALL ON FUNCTION ensure_skills(text[]) FROM public;
GRANT EXECUTE ON FUNCTION ensure_skills(text[]) TO authenticated;
