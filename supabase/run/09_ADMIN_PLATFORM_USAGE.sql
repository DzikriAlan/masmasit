-- =========================================================================
-- 037 - admin_platform_usage(): pemakaian kuota paket Free untuk Admin Panel
-- =========================================================================
-- Hanya membaca angka agregat dari database, tidak mengubah data apa pun dan
-- tidak mengembalikan email atau identitas user. Khusus super_admin.
--
-- emails_* adalah PERKIRAAN, bisa lebih tinggi atau lebih rendah dari Resend:
-- auth.users hanya menyimpan waktu kirim terakhir per jenis email, dan juga
-- mencatat email yang tidak lewat Resend. Angka pasti ada di dashboard Resend.
--
-- Aman dijalankan ulang. Jalankan di Supabase > SQL Editor.
-- =========================================================================

CREATE OR REPLACE FUNCTION admin_platform_usage()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  month_start timestamptz := date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  result jsonb;
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Super admin access required' USING ERRCODE = '42501';
  END IF;

  WITH sent AS (
    SELECT confirmation_sent_at AS sent_at FROM auth.users WHERE confirmation_sent_at >= month_start
    UNION ALL
    SELECT recovery_sent_at FROM auth.users WHERE recovery_sent_at >= month_start
    UNION ALL
    SELECT email_change_sent_at FROM auth.users WHERE email_change_sent_at >= month_start
    UNION ALL
    SELECT invited_at FROM auth.users WHERE invited_at >= month_start
  )
  SELECT jsonb_build_object(
    'database_bytes', pg_database_size(current_database()),
    'storage_bytes', (
      SELECT COALESCE(SUM((metadata->>'size')::bigint), 0) FROM storage.objects
    ),
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'monthly_active_users', (
      SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at >= month_start
    ),
    'emails_last_hour', (SELECT COUNT(*) FROM sent WHERE sent_at >= now() - interval '1 hour'),
    'emails_today', (SELECT COUNT(*) FROM sent WHERE sent_at >= day_start),
    'emails_this_month', (SELECT COUNT(*) FROM sent)
  )
  INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION admin_platform_usage() FROM public;
GRANT EXECUTE ON FUNCTION admin_platform_usage() TO authenticated;
