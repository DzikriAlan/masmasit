-- =========================================================================
-- 035 - batasi ukuran & tipe file di semua bucket Storage
-- =========================================================================
-- Pelajaran findurspark: Supabase membengkak karena file tidak dibatasi.
-- Di production, bucket avatars, company-logos, portfolios, certificates
-- belum punya batas apa pun, jadi siapa pun yang login bisa mengunggah file
-- berukuran dan bertipe apa saja lewat API (batas di UI bisa dilewati).
--
-- Script ini memasang batas di SERVER (ditolak oleh Supabase Storage):
--   avatars, company-logos, portfolios : maks 2 MB, hanya JPG / PNG / WebP
--   certificates                       : maks 2 MB, JPG / PNG / WebP / PDF
--   message-attachments (kalau ada)    : maks 5 MB
--
-- - Tidak menghapus atau mengubah file yang sudah ada; batas berlaku untuk
--   upload berikutnya.
-- - Cocok dengan kode production: aplikasi sudah membatasi upload ke 2 MB
--   JPG/PNG/WebP dan kini mengompres gambar ke WebP sebelum upload.
-- - Aman dijalankan ulang.
--
-- =========================================================================


UPDATE storage.buckets
SET file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id IN ('avatars', 'company-logos', 'portfolios');

UPDATE storage.buckets
SET file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
WHERE id = 'certificates';

UPDATE storage.buckets
SET file_size_limit = 5242880
WHERE id = 'message-attachments';

