-- =========================================================================
-- 036 - push notification ke HP & browser lewat Firebase Cloud Messaging
-- =========================================================================
-- Setiap baris notifications yang baru (dari trigger 011/029 dan seterusnya)
-- juga dikirim ke perangkat penerimanya sebagai push FCM, jadi notifikasi
-- tetap muncul walau MasmasIT sedang tertutup.
--
-- Alurnya:
--   notifications INSERT
--     -> trigger dispatch_notification_push (pg_net, async, tidak memblokir)
--     -> POST {push_dispatch_url}  body { notification_id }
--     -> /api/v1/push/dispatch kirim ke FCM untuk setiap token user tsb.
--
-- ## Tabel
-- - push_tokens: satu baris per browser/HP. `token` adalah FCM registration
--   token; `lang` bahasa UI terakhir di perangkat itu, supaya push memakai
--   title_id/body_id saat 'id'.
--
-- ## RPC (dipanggil dari browser)
-- - register_push_token(p_token, p_lang): upsert milik auth.uid(). Token yang
--   sama berpindah pemilik saat akun lain login di browser yang sama.
-- - unregister_push_token(p_token): dipanggil saat logout.
--
-- ## Konfigurasi (Vault) - trigger diam (no-op) sampai keduanya diisi:
--   select vault.create_secret('https://masmasit.com/api/v1/push/dispatch', 'push_dispatch_url');
--   select vault.create_secret('<sama dengan PUSH_DISPATCH_SECRET>', 'push_dispatch_secret');
--
-- Idempotent: menjalankan ulang file ini tidak mengubah apa pun.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- 1. Tabel token
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS push_tokens (
  token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lang text NOT NULL DEFAULT 'en' CHECK (lang IN ('en', 'id')),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);

-- Hanya baca/hapus milik sendiri. Tulis lewat RPC di bawah, karena upsert
-- token yang dipegang akun lain akan ditolak RLS.
DROP POLICY IF EXISTS "select_own_push_tokens" ON push_tokens;
CREATE POLICY "select_own_push_tokens" ON push_tokens FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_push_tokens" ON push_tokens;
CREATE POLICY "delete_own_push_tokens" ON push_tokens FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. RPC
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION register_push_token(p_token text, p_lang text DEFAULT 'en', p_user_agent text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_token IS NULL OR length(p_token) < 20 OR length(p_token) > 4096 THEN
    RAISE EXCEPTION 'invalid token' USING ERRCODE = '22P02';
  END IF;
  INSERT INTO push_tokens (token, user_id, lang, user_agent)
  VALUES (
    p_token,
    auth.uid(),
    CASE WHEN p_lang = 'id' THEN 'id' ELSE 'en' END,
    left(p_user_agent, 512)
  )
  ON CONFLICT (token) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    lang = EXCLUDED.lang,
    user_agent = EXCLUDED.user_agent,
    updated_at = now();
END;
$$;

-- Memegang token sudah cukup bukti: token hanya ada di perangkat itu.
CREATE OR REPLACE FUNCTION unregister_push_token(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM push_tokens WHERE token = p_token;
$$;

REVOKE ALL ON FUNCTION register_push_token(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION unregister_push_token(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION register_push_token(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION unregister_push_token(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Trigger: notifications INSERT -> /api/v1/push/dispatch
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION dispatch_notification_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dispatch_url text;
  dispatch_secret text;
BEGIN
  -- Tidak ada perangkat terdaftar: tidak perlu memanggil server.
  IF NOT EXISTS (SELECT 1 FROM push_tokens WHERE user_id = NEW.user_id) THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO dispatch_url
    FROM vault.decrypted_secrets WHERE name = 'push_dispatch_url';
  SELECT decrypted_secret INTO dispatch_secret
    FROM vault.decrypted_secrets WHERE name = 'push_dispatch_secret';
  IF dispatch_url IS NULL OR dispatch_secret IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := dispatch_url,
    body := jsonb_build_object('notification_id', NEW.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || dispatch_secret
    ),
    timeout_milliseconds := 10000
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Push itu bonus: gagal kirim tidak boleh menggagalkan notifikasinya.
  RAISE WARNING 'dispatch_notification_push: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dispatch_notification_push ON notifications;
CREATE TRIGGER trg_dispatch_notification_push
  AFTER INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION dispatch_notification_push();
