-- =========================================================================
-- SCRIPT 5 - HAPUS SEMUA DATA DUMMY DI PRODUCTION (sekali jalan)
-- =========================================================================
-- Jalankan di Supabase > SQL Editor SETELAH 00_BACKUP.sh sukses.
--
-- WAJIB isi satu baris di bawah: email akun ASLI yang akan jadi super_admin.
-- Satu-satunya admin sekarang adalah admin@demo.masmasit.online (akun dummy);
-- tanpa pengganti, tidak ada yang bisa masuk Panel Admin setelah dihapus.
-- Akun itu harus sudah pernah daftar/login di masmasit (ada di auth.users).
--
-- Yang dilakukan, dalam SATU transaksi (error = tidak ada yang berubah):
--   1. Akun email di atas dijadikan super_admin.
--   2. Perusahaan milik akun demo yang punya lowongan ASLI (dibuat lewat
--      aplikasi, bukan seed - mis. "MAS-MAS IT" / "Golang Developer")
--      dipindahkan ke akun admin baru, jadi perusahaan + lowongan itu TETAP ADA.
--   3. Semua data dummy dihapus: 30 akun @demo.masmasit.online dan semua
--      konten seed (jobs, projects, courses, events, builds, diskusi, ...).
--   4. Aktivitas akun asli pada konten dummy ikut terhapus karena kontennya
--      hilang (lamaran ke lowongan dummy, enrollment ke kursus dummy, bid ke
--      project dummy, reply di diskusi dummy, pesan ke akun demo).
--   5. Verifikasi: tidak boleh tersisa dummy, dan minimal ada 1 admin asli.
--
-- Tidak disentuh: skills, regions, app_settings, job_types, job_locations,
-- akun asli beserta datanya sendiri.
-- =========================================================================

BEGIN;

DROP TABLE IF EXISTS _cfg, _demo_users, _dummy, _kolateral, _admin_baru, _company_diselamatkan;

CREATE TEMP TABLE _cfg AS SELECT
  ''::text AS email_admin_baru,  -- <<< ISI: email akun ASLI calon super_admin, mis. 'nama@gmail.com'
  true AS hapus,
  true AS izinkan_kolateral;

-- -------------------------------------------------------------------------
-- 1. AKUN DEMO
-- -------------------------------------------------------------------------
CREATE TEMP TABLE _demo_users AS
SELECT id, email, last_sign_in_at
FROM auth.users
WHERE email ILIKE '%@demo.masmasit.online'
   OR id::text ~ '^[0-9a-f]{8}-0000-4000-a000-[0-9a-f]{12}$';

-- -------------------------------------------------------------------------
-- 1b. ADMIN PENGGANTI + SELAMATKAN PERUSAHAAN DENGAN LOWONGAN ASLI
-- -------------------------------------------------------------------------
CREATE TEMP TABLE _admin_baru (id uuid, email text);
CREATE TEMP TABLE _company_diselamatkan (id uuid, name text);

DO $$
DECLARE
  v_email text := btrim((SELECT email_admin_baru FROM _cfg));
  v_admin uuid;
BEGIN
  IF v_email = '' THEN
    RAISE EXCEPTION 'Dibatalkan: isi email_admin_baru di bagian _cfg dengan email akun ASLI calon super_admin.';
  END IF;

  SELECT id INTO v_admin FROM auth.users WHERE lower(email) = lower(v_email);
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Dibatalkan: akun % belum terdaftar. Daftar/login dulu di masmasit dengan email itu.', v_email;
  END IF;
  IF v_admin IN (SELECT id FROM _demo_users) THEN
    RAISE EXCEPTION 'Dibatalkan: % adalah akun demo; pakai akun asli.', v_email;
  END IF;

  INSERT INTO _admin_baru VALUES (v_admin, v_email);

  INSERT INTO profiles (id, email, full_name)
  SELECT v_admin, v_email, split_part(v_email, '@', 1)
  WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin);

  INSERT INTO user_roles (user_id, role) VALUES (v_admin, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Perusahaan akun demo yang punya lowongan bukan seed -> pindah ke admin baru.
  INSERT INTO _company_diselamatkan
  SELECT c.id, c.name FROM companies c
  WHERE c.user_id IN (SELECT id FROM _demo_users)
    AND EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.company_id = c.id
        AND j.id::text !~ '^[0-9a-f]{8}-0000-4000-a000-[0-9a-f]{12}$'
    );

  IF EXISTS (SELECT 1 FROM _company_diselamatkan) THEN
    UPDATE companies SET user_id = v_admin WHERE id IN (SELECT id FROM _company_diselamatkan);
    INSERT INTO user_roles (user_id, role) VALUES (v_admin, 'company')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- 2. BARIS DUMMY PER TABEL
-- -------------------------------------------------------------------------
CREATE TEMP TABLE _dummy (tbl text, id uuid, PRIMARY KEY (tbl, id));

DO $$
DECLARE
  t     record;
  actor text;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'id' AND a.atttypid = 'uuid'::regtype
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND c.relname NOT IN ('skills', 'regions', 'app_settings', 'job_types', 'job_locations')
  LOOP
    -- ID tetap dari seed
    EXECUTE format(
      'INSERT INTO _dummy SELECT %L, id FROM public.%I
       WHERE id::text ~ ''^[0-9a-f]{8}-0000-4000-a000-[0-9a-f]{12}$''
       ON CONFLICT DO NOTHING', t.relname, t.relname);

    -- Pelaku utama baris adalah akun demo
    SELECT u.col INTO actor
    FROM unnest(ARRAY['user_id','sender_id','coach_id','author_id','owner_id',
                      'created_by','reviewer_id','actor_id','client_id'])
         WITH ORDINALITY AS u(col, ord)
    WHERE EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = t.relname
                    AND column_name = u.col)
    ORDER BY u.ord LIMIT 1;

    IF t.relname = 'profiles' THEN
      actor := 'id';
    END IF;

    IF actor IS NOT NULL THEN
      EXECUTE format(
        'INSERT INTO _dummy SELECT %L, id FROM public.%I
         WHERE %I IN (SELECT id FROM _demo_users)
         ON CONFLICT DO NOTHING', t.relname, t.relname, actor);
    END IF;
  END LOOP;
END $$;

-- ID turunan md5 dari migration 020 dan 022. Migration 022 bersifat
-- "self-healing", jadi baris ini bisa menempel ke akun/konten ASLI
-- (mis. kursus untuk coach asli) - tetap dummy karena ID-nya buatan seed.
INSERT INTO _dummy
SELECT 'courses', id FROM courses
 WHERE id = md5('demo-course-' || coach_id)::uuid
UNION ALL
SELECT 'course_modules', id FROM course_modules
 WHERE id IN (SELECT md5('demo-mod-' || course_id || '-' || k)::uuid FROM generate_series(1, 4) k)
UNION ALL
SELECT 'course_materials', id FROM course_materials
 WHERE id IN (SELECT md5('demo-mat-' || module_id || '-' || k)::uuid FROM generate_series(1, 2) k)
UNION ALL
SELECT 'quizzes', id FROM quizzes
 WHERE id = md5('demo-quiz-' || module_id)::uuid
UNION ALL
SELECT 'quiz_questions', id FROM quiz_questions
 WHERE id IN (SELECT md5('demo-qq-' || quiz_id || '-' || k)::uuid FROM generate_series(1, 3) k)
UNION ALL
SELECT 'enrollments', id FROM enrollments
 WHERE id IN (md5('demo-enrol2-' || course_id || '-' || user_id)::uuid,
              md5('demo-enrol-' || user_id)::uuid)
UNION ALL
SELECT 'module_completions', id FROM module_completions
 WHERE id IN (md5('demo-mc2-' || enrollment_id || '-' || module_id)::uuid,
              md5('demo-mc3-' || enrollment_id)::uuid)
UNION ALL
SELECT 'quiz_submissions', id FROM quiz_submissions
 WHERE id = md5('demo-qs2-' || quiz_id || '-' || user_id)::uuid
UNION ALL
SELECT 'certificates', id FROM certificates
 WHERE id = md5('demo-cert-' || course_id)::uuid
UNION ALL
SELECT 'bookings', id FROM bookings
 WHERE id = md5('demo-book-' || talent_id)::uuid
UNION ALL
SELECT 'agency_services', id FROM agency_services
 WHERE id = md5('demo-svc-' || agency_id)::uuid
UNION ALL
SELECT 'agency_projects', id FROM agency_projects
 WHERE id IN (md5('demo-ap-' || service_id)::uuid,
              md5('demo-ap2-' || service_id)::uuid,
              md5('demo-ap-cancelled')::uuid)
UNION ALL
SELECT 'builds', id FROM builds
 WHERE id IN (md5('demo-abuild-' || agency_id)::uuid,
              md5('demo-abuild2-' || agency_id)::uuid,
              md5('demo-build-' || user_id)::uuid)
UNION ALL
SELECT 'team_collabs', id FROM team_collabs
 WHERE id = md5('demo-collab-closed')::uuid
UNION ALL
SELECT 'discussions', id FROM discussions
 WHERE id = md5('demo-disc-' || user_id)::uuid
UNION ALL
SELECT 'discussion_comments', id FROM discussion_comments
 WHERE id IN (SELECT md5('demo-cmt2-' || discussion_id || '-' || k)::uuid FROM generate_series(1, 3) k
              UNION ALL
              SELECT md5('demo-cmt-' || user_id || '-' || k)::uuid FROM generate_series(1, 3) k)
UNION ALL
SELECT 'job_applications', id FROM job_applications
 WHERE id = md5('demo-app-' || user_id)::uuid
UNION ALL
SELECT 'project_bids', id FROM project_bids
 WHERE id = md5('demo-bid-' || user_id)::uuid
UNION ALL
SELECT 'event_rsvps', id FROM event_rsvps
 WHERE id IN (SELECT md5('demo-rsvp-' || user_id || '-' || k)::uuid FROM generate_series(1, 3) k)
UNION ALL
SELECT 'messages', id FROM messages
 WHERE id IN (SELECT md5('demo-msg-' || sender_id || '-' || k)::uuid FROM generate_series(1, 3) k)
UNION ALL
SELECT 'experiences', id FROM experiences
 WHERE id IN (SELECT md5('demo-exp-' || user_id || '-' || k)::uuid FROM generate_series(1, 3) k)
UNION ALL
SELECT 'notifications', id FROM notifications
 WHERE id IN (SELECT md5('demo-notif-' || user_id || '-' || k)::uuid FROM generate_series(1, 3) k)
UNION ALL
SELECT 'team_members', id FROM team_members
 WHERE id = md5('demo-tm-' || user_id)::uuid
ON CONFLICT DO NOTHING;

-- Perusahaan yang diselamatkan bukan dummy lagi (lowongan seed di dalamnya
-- tetap terhapus karena ID-nya pola seed).
DELETE FROM _dummy WHERE tbl = 'companies' AND id IN (SELECT id FROM _company_diselamatkan);

-- -------------------------------------------------------------------------
-- 3. KOLATERAL: baris ASLI yang merujuk ke baris dummy / akun demo
-- -------------------------------------------------------------------------
-- Ikut tiap foreign key di schema public. "Asli" = barisnya sendiri tidak
-- tergolong dummy (tabel tanpa ID: user_id-nya bukan akun demo).
CREATE TEMP TABLE _kolateral (
  tabel text, kolom text, merujuk_ke text, aksi_fk text, nullable boolean, jumlah bigint
);

DO $$
DECLARE
  fk        record;
  n         bigint;
  parent_q  text;
  asli_q    text;
BEGIN
  FOR fk IN
    SELECT cl.relname AS child, a.attname AS col, NOT a.attnotnull AS nullable,
           pn.nspname || '.' || pc.relname AS parent, pc.relname AS parent_name,
           pn.nspname AS parent_schema,
           CASE c.confdeltype WHEN 'c' THEN 'CASCADE (ikut terhapus)'
                              WHEN 'n' THEN 'SET NULL (rujukan dikosongkan)'
                              WHEN 'r' THEN 'RESTRICT (menghalangi)'
                              WHEN 'a' THEN 'NO ACTION (menghalangi)'
                              ELSE c.confdeltype::text END AS aksi,
           EXISTS (SELECT 1 FROM pg_attribute x WHERE x.attrelid = cl.oid
                   AND x.attname = 'id' AND x.atttypid = 'uuid'::regtype) AS has_id
    FROM pg_constraint c
    JOIN pg_class cl      ON cl.oid = c.conrelid
    JOIN pg_namespace cn  ON cn.oid = cl.relnamespace
    JOIN pg_class pc      ON pc.oid = c.confrelid
    JOIN pg_namespace pn  ON pn.oid = pc.relnamespace
    JOIN pg_attribute a   ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
    WHERE c.contype = 'f' AND cn.nspname = 'public'
      AND cl.relname NOT IN ('skills', 'regions', 'app_settings', 'job_types', 'job_locations')
      -- Rujukan ke tabel referensi tidak pernah dummy (job_types pakai slug teks).
      AND NOT (pn.nspname = 'public' AND pc.relname IN ('skills', 'regions', 'app_settings', 'job_types', 'job_locations'))
  LOOP
    IF fk.parent IN ('auth.users', 'public.profiles') THEN
      parent_q := 'SELECT id FROM _demo_users';
    ELSIF fk.parent_schema = 'public' THEN
      parent_q := format('SELECT id FROM _dummy WHERE tbl = %L', fk.parent_name);
    ELSE
      CONTINUE;
    END IF;

    IF fk.has_id THEN
      asli_q := format('NOT EXISTS (SELECT 1 FROM _dummy d WHERE d.tbl = %L AND d.id = c.id)', fk.child);
    ELSE
      asli_q := 'c.user_id NOT IN (SELECT id FROM _demo_users)';
    END IF;

    EXECUTE format('SELECT count(*) FROM public.%I c WHERE c.%I IN (%s) AND %s',
                   fk.child, fk.col, parent_q, asli_q) INTO n;

    IF n > 0 THEN
      INSERT INTO _kolateral VALUES (fk.child, fk.col, fk.parent, fk.aksi, fk.nullable, n);
    END IF;
  END LOOP;
END $$;

-- -------------------------------------------------------------------------
-- 4. HAPUS (hanya bila hapus = true)
-- -------------------------------------------------------------------------
DO $$
DECLARE
  cfg      record;
  k        record;
  t        record;
  pass     int := 0;
  sisa     bigint;
  terhalang bigint;
  parent_q text;
BEGIN
  SELECT * INTO cfg FROM _cfg;
  IF NOT cfg.hapus THEN
    RETURN;
  END IF;

  SELECT count(*) INTO terhalang FROM _kolateral WHERE aksi_fk NOT LIKE 'SET NULL%';
  IF terhalang > 0 AND NOT cfg.izinkan_kolateral THEN
    RAISE EXCEPTION 'Dibatalkan: ada % rujukan dari data user asli ke data dummy. '
                    'Lihat laporan (jalankan dengan hapus = false), lalu set '
                    'izinkan_kolateral = true bila memang boleh ikut terhapus.', terhalang;
  END IF;

  -- Rujukan RESTRICT / NO ACTION dari baris asli: kosongkan bila boleh NULL,
  -- selain itu hapus barisnya (hanya sampai sini bila izinkan_kolateral).
  FOR k IN SELECT * FROM _kolateral
           WHERE aksi_fk LIKE 'RESTRICT%' OR aksi_fk LIKE 'NO ACTION%' LOOP
    IF k.merujuk_ke IN ('auth.users', 'public.profiles') THEN
      parent_q := 'SELECT id FROM _demo_users';
    ELSE
      parent_q := format('SELECT id FROM _dummy WHERE tbl = %L', split_part(k.merujuk_ke, '.', 2));
    END IF;
    IF k.nullable THEN
      EXECUTE format('UPDATE public.%I SET %I = NULL WHERE %I IN (%s)', k.tabel, k.kolom, k.kolom, parent_q);
    ELSE
      EXECUTE format('DELETE FROM public.%I WHERE %I IN (%s)', k.tabel, k.kolom, parent_q);
    END IF;
  END LOOP;

  -- Hapus baris dummy. Urutan antar tabel tidak dihitung manual: tabel yang
  -- masih dirujuk (FK RESTRICT) dicoba lagi pada putaran berikutnya.
  LOOP
    pass := pass + 1;
    FOR t IN SELECT DISTINCT tbl FROM _dummy LOOP
      BEGIN
        EXECUTE format('DELETE FROM public.%I WHERE id IN (SELECT id FROM _dummy WHERE tbl = %L)',
                       t.tbl, t.tbl);
      EXCEPTION WHEN foreign_key_violation THEN
        NULL;
      END;
    END LOOP;

    sisa := 0;
    FOR t IN SELECT DISTINCT tbl FROM _dummy LOOP
      EXECUTE format('SELECT %s + count(*) FROM public.%I WHERE id IN (SELECT id FROM _dummy WHERE tbl = %L)',
                     sisa, t.tbl, t.tbl) INTO sisa;
    END LOOP;
    EXIT WHEN sisa = 0;
    IF pass >= 10 THEN
      RAISE EXCEPTION 'Dibatalkan: % baris dummy tidak bisa dihapus setelah 10 putaran.', sisa;
    END IF;
  END LOOP;

  -- Akun demo terakhir: sisa baris miliknya (user_skills, build_likes,
  -- user_roles, auth.identities, ...) ikut lewat ON DELETE CASCADE.
  DELETE FROM auth.users WHERE id IN (SELECT id FROM _demo_users);

  -- Verifikasi: tidak boleh ada lagi ID pola seed atau akun demo.
  sisa := 0;
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'id' AND a.atttypid = 'uuid'::regtype
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND c.relname NOT IN ('skills', 'regions', 'app_settings', 'job_types', 'job_locations')
  LOOP
    EXECUTE format('SELECT %s + count(*) FROM public.%I
                    WHERE id::text ~ ''^[0-9a-f]{8}-0000-4000-a000-[0-9a-f]{12}$''',
                   sisa, t.relname) INTO sisa;
  END LOOP;
  sisa := sisa + (SELECT count(*) FROM auth.users WHERE email ILIKE '%@demo.masmasit.online');
  IF sisa > 0 THEN
    RAISE EXCEPTION 'Dibatalkan: verifikasi gagal, masih ada % baris dummy.', sisa;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'super_admin') THEN
    RAISE EXCEPTION 'Dibatalkan: tidak ada super_admin tersisa.';
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- 5. LAPORAN
-- -------------------------------------------------------------------------
SELECT bagian, tabel, keterangan, jumlah FROM (
  SELECT 0 AS urut, 'status' AS bagian, '' AS tabel,
         CASE WHEN (SELECT hapus FROM _cfg) THEN 'SUDAH DIHAPUS' ELSE 'PRATINJAU - belum ada yang dihapus' END AS keterangan,
         NULL::bigint AS jumlah
  UNION ALL
  SELECT 1, 'admin baru (super_admin)', 'user_roles', email, NULL FROM _admin_baru
  UNION ALL
  SELECT 1, 'perusahaan diselamatkan', 'companies', name || ' -> milik admin baru', NULL FROM _company_diselamatkan
  UNION ALL
  SELECT 1, 'akun demo', 'auth.users', '@demo.masmasit.online', count(*) FROM _demo_users
  UNION ALL
  SELECT 2, 'PERINGATAN: akun demo pernah dipakai login', 'auth.users',
         email || ' (terakhir ' || to_char(last_sign_in_at, 'YYYY-MM-DD') || ')', NULL
  FROM _demo_users WHERE last_sign_in_at IS NOT NULL
  UNION ALL
  SELECT 3, 'PERINGATAN: admin asli tersisa', 'user_roles',
         'akun admin non-demo (0 = tidak ada admin setelah dihapus)',
         (SELECT count(*) FROM user_roles WHERE role IN ('super_admin', 'regional_admin')
           AND user_id NOT IN (SELECT id FROM _demo_users))
  UNION ALL
  SELECT 4, 'dummy', tbl, 'baris dummy', count(*) FROM _dummy GROUP BY tbl
  UNION ALL
  SELECT 5, 'KOLATERAL (data asli)', tabel,
         kolom || ' -> ' || merujuk_ke || ' : ' || aksi_fk, jumlah
  FROM _kolateral
) r
ORDER BY urut, tabel, keterangan;

COMMIT;
