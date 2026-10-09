-- =========================================================================
-- SCRIPT 6 - HOTFIX: tombol Approve / Reject di Panel Admin tidak berefek
-- =========================================================================
-- Gejala: admin klik "Approve Talent" / "Approve Coach", muncul sukses, tapi
-- status tetap "pending" dan talent tidak muncul di /talents.
--
-- Penyebab: tabel profiles hanya punya policy UPDATE "update_own_profile"
-- (user mengubah profilnya sendiri). Admin tidak punya izin mengubah profil
-- orang lain, jadi update-nya mengenai 0 baris tanpa error.
--
-- Script ini HANYA menambah izin untuk admin (super_admin & regional_admin):
--   - profiles  : admin boleh update (approve / reject coach & talent)
--   - companies : regional_admin juga boleh approve perusahaan
-- Tidak mengubah data apa pun, cocok dengan kode production sekarang, dan
-- aman dijalankan ulang. Sama persis dengan bagian ini di migration 028.
--
-- Jalankan di Supabase > SQL Editor, lalu klik Approve lagi di Panel Admin.
-- =========================================================================

BEGIN;

DROP POLICY IF EXISTS "update_profiles_admin" ON profiles;
CREATE POLICY "update_profiles_admin" ON profiles FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_company_admin" ON companies;
CREATE POLICY "update_company_admin" ON companies FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

COMMIT;

-- Cek: harus muncul update_profiles_admin dan update_company_admin.
SELECT tablename, policyname FROM pg_policies
WHERE policyname IN ('update_profiles_admin', 'update_company_admin');
