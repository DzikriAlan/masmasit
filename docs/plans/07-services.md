# Fitur: Services (Layanan Agency)

## Kondisi Saat Ini

- Halaman: `/services` → `src/features/services/components/ServicesList.tsx`
- Sumber data: `agency_services`, `agency_projects`

Fungsionalitas yang sudah berjalan:

- Menampilkan layanan aktif (`is_active = true`), dikelompokkan per kategori:
  SaaS, AI Solutions, Creative Services, HR Solutions.
- Form permintaan proyek: nama, email, perusahaan, ruang lingkup, anggaran.
- Permintaan tersimpan ke `agency_projects` dan muncul di Panel Admin.
- Bisa diisi **tanpa login** — cocok untuk klien dari luar komunitas.

## Peran

| Peran | Kewenangan |
| --- | --- |
| Klien / publik | Mengirim permintaan proyek |
| Admin | Melihat permintaan di `/admin` tab Agency Projects, mengubah status, mengonfirmasi DP dan pelunasan |

## Celah yang Ditemukan

1. **Belum ada CRUD `agency_services` di Panel Admin.** Katalog layanan hanya
   bisa diubah lewat SQL. Admin tidak bisa menambah, mengubah harga, atau
   menonaktifkan layanan dari antarmuka.
2. Klien tidak menerima nomor referensi dan tidak bisa memantau status
   permintaannya.
3. Tidak ada notifikasi email saat permintaan masuk.
4. Tabel `case_studies` (`/case-studies`) belum punya CRUD admin juga.

## Rencana Kerja

> **Status per 9 September 2026** — item bertanda ✅ sudah diimplementasikan
> pada commit ini. Item bertanda ⬜ belum dikerjakan.

| No | Pekerjaan | Prioritas |
| --- | --- | --- |
| 1 | ✅ Tab Katalog di Panel Admin — CRUD `agency_services` | Tinggi |
| 2 | ⬜ Pelacakan status permintaan untuk klien | Sedang |
| 3 | ✅ CRUD `case_studies` di tab Katalog | Sedang |
| 4 | ⬜ Notifikasi email | Rendah |
