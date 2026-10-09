/*
# 029b - Message attachments (TC-11-03)

## Columns on messages (all nullable)
- attachment_url  text    - object path inside the `message-attachments`
                             bucket, e.g. "{sender_id}/{recipient_id}/{uuid}-{file}".
                             The bucket is private, so the client resolves it
                             to a short-lived signed URL when rendering.
- attachment_name text    - original file name, shown on the bubble
- attachment_type text    - MIME type; image/... renders as a preview
- attachment_size integer - bytes, capped at 10 MB

## Storage
- Private bucket `message-attachments`, 10 MB per object (bucket-level limit
  as well as the column check, so an oversized upload is refused by Storage
  even if the UI check is bypassed).
- INSERT: only into a path whose first folder is the uploader's uid.
- SELECT: the sender (first folder) or the recipient (second folder).

## Guard
- guard_message_edit (027) is redefined to also freeze the attachment
  columns, so a recipient marking a message read cannot swap the file.

Idempotent.
*/

ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_size integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_attachment_size_check') THEN
    ALTER TABLE messages ADD CONSTRAINT messages_attachment_size_check
      CHECK (attachment_size IS NULL OR (attachment_size >= 0 AND attachment_size <= 10485760));
  END IF;
END $$;

-- Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('message-attachments', 'message-attachments', false, 10485760)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 10485760;

DROP POLICY IF EXISTS "message_attachments_insert_own" ON storage.objects;
CREATE POLICY "message_attachments_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "message_attachments_select_participants" ON storage.objects;
CREATE POLICY "message_attachments_select_participants" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'message-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (storage.foldername(name))[2] = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "message_attachments_delete_own" ON storage.objects;
CREATE POLICY "message_attachments_delete_own" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Freeze attachment columns on UPDATE (extends 027's guard).
CREATE OR REPLACE FUNCTION guard_message_edit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_trusted_writer() THEN RETURN NEW; END IF;
  NEW.sender_id := OLD.sender_id;
  NEW.recipient_id := OLD.recipient_id;
  NEW.body := OLD.body;
  NEW.created_at := OLD.created_at;
  NEW.attachment_url := OLD.attachment_url;
  NEW.attachment_name := OLD.attachment_name;
  NEW.attachment_type := OLD.attachment_type;
  NEW.attachment_size := OLD.attachment_size;
  RETURN NEW;
END;
$$;
