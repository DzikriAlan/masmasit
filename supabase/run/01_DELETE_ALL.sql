-- =========================================================================
-- SCRIPT 1 dari 2 - HAPUS SEMUA
-- =========================================================================
-- MENGHAPUS SELURUH DATA DAN TIDAK BISA DIBATALKAN.
--   - semua tabel di schema public beserta isinya
--   - semua function, trigger, policy, index dan view milik public
--   - SEMUA akun login di auth.users, termasuk akun kamu sendiri
-- File di storage tidak tersentuh.
-- Setelah ini jalankan 02_MIGRATE_ALL.sql
-- =========================================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL   ON SCHEMA public TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES    TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

COMMENT ON SCHEMA public IS 'standard public schema';

DELETE FROM auth.users;
