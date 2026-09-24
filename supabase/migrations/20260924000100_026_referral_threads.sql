/*
# Referral source, with Threads

The onboarding popup asks where the member heard about MasmasIT, now
including Threads. Databases that applied an earlier 025 (before the
referral columns were added to it) do not have these columns yet, so this
migration creates them itself and then (re)defines both constraints. Safe
to run whether or not the current 025 has been applied.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS referral_note text;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_referral_source_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_referral_source_check
  CHECK (referral_source IS NULL OR referral_source IN
    ('instagram','threads','tiktok','linkedin','x','youtube','google','friend','community','other'));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_referral_note_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_referral_note_check
  CHECK (referral_note IS NULL OR length(referral_note) <= 100);

NOTIFY pgrst, 'reload schema';
