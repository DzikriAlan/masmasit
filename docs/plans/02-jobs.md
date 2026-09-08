# Fitur: Jobs (Lowongan Kerja)

## Kondisi Saat Ini

- Daftar: `/jobs` → `src/features/jobs/components/JobsList.tsx`
- Detail: `/jobs/[id]` → `src/features/jobs/components/JobDetail.tsx`
- Pasang lowongan: `/jobs/post` → `src/features/jobs/components/PostJob.tsx`
- Sumber data: tabel `jobs`, `companies`, `job_applications`, `user_roles`

Fungsionalitas yang sudah berjalan:

- Pencarian judul/deskripsi, filter tipe pekerjaan dan lokasi (debounce 300 ms).
- Skor kecocokan (match score) dihitung dari skill user yang login.
- Pelamar mengirim lamaran beserta cover letter; lamaran ganda ditolak
  dengan pesan "Anda sudah melamar pekerjaan ini".

## Peran

| Peran | Kewenangan |
| --- | --- |
| Perusahaan (`company`) | Mendaftarkan perusahaan, lalu memasang lowongan setelah disetujui admin |
| Member | Melamar lowongan |
| Admin | Menyetujui atau menolak pendaftaran perusahaan di `/admin` tab Approvals |

### Alur Pemasang Lowongan

1. User membuka `/jobs/post` dan mengisi form perusahaan.
2. Sistem menyimpan ke `companies` dengan `approval_status = 'pending'`
   dan menambahkan peran `company` pada user.
3. Admin menyetujui di `/admin`.
4. Setelah `approval_status = 'approved'`, form pemasangan lowongan terbuka.

## Celah yang Ditemukan

1. Belum ada halaman bagi perusahaan untuk **melihat dan mengelola pelamar**
   pada lowongan miliknya.
2. Belum ada pengubahan atau penutupan lowongan setelah dipasang.
3. Daftar lokasi dan tipe pekerjaan masih hardcode di komponen.
4. Pelamar tidak bisa melihat status lamarannya.

## Rencana Kerja

> **Status per 9 September 2026** — item bertanda ✅ sudah diimplementasikan
> pada commit ini. Item bertanda ⬜ belum dikerjakan.

| No | Pekerjaan | Prioritas |
| --- | --- | --- |
| 1 | ✅ Halaman `/jobs/applicants` — lihat, tinjau, terima, tolak pelamar | Tinggi |
| 2 | ✅ Tab Lamaran di `/activity` menampilkan status tiap lamaran | Tinggi |
| 3 | ✅ Tutup/buka lowongan dari `/jobs/applicants` (edit isi lowongan ⬜) | Sedang |
| 4 | ⬜ Master lokasi dan tipe pekerjaan ke tabel referensi | Rendah |
