/*
# Messaging System & Skill Enhancements

1. New Tables
- `messages` — real-time chat between members, and between clients and talents/agency_ops
  - id (uuid PK)
  - sender_id (uuid, references auth.users, the logged-in user)
  - recipient_id (uuid, references auth.users, the message receiver)
  - body (text, the message content)
  - read (boolean, default false, tracks if recipient has read it)
  - created_at (timestamptz, default now())
2. Modified Tables
- `user_skills` — added `years_experience` (integer, default 0) and `verification_status` (text, default 'self_declared', check constraint for valid values)
3. Security
- Enable RLS on `messages`
- Owner-scoped policies: users can only see messages they sent or received
  - SELECT: auth.uid() = sender_id OR auth.uid() = recipient_id
  - INSERT: auth.uid() = sender_id
  - UPDATE: auth.uid() = recipient_id (for marking as read)
  - DELETE: auth.uid() = sender_id OR auth.uid() = recipient_id
4. Indexes
- Index on recipient_id + read for unread count queries
- Index on sender_id for conversation history
- Index on (sender_id, recipient_id) for conversation threads
5. Notes
- The `verification_status` field supports the spec's Self-declared / Peer-endorsed / Coach-certified progression
- `years_experience` is a numeric field as required by the spec
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages" ON messages FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "update_own_messages" ON messages;
CREATE POLICY "update_own_messages" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_own_messages" ON messages;
CREATE POLICY "delete_own_messages" ON messages FOR DELETE
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread ON messages(recipient_id) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(sender_id, recipient_id, created_at DESC);

-- Add years_experience and verification_status to user_skills
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_skills' AND column_name = 'years_experience') THEN
    ALTER TABLE user_skills ADD COLUMN years_experience integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_skills' AND column_name = 'verification_status') THEN
    ALTER TABLE user_skills ADD COLUMN verification_status text NOT NULL DEFAULT 'self_declared'
      CHECK (verification_status IN ('self_declared', 'peer_endorsed', 'coach_certified'));
  END IF;
END $$;
