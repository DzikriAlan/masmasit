# Fitur: Admin Panel

Dokumen ini menjawab langsung pertanyaan klien:
*"Kalo gw daftar jadi coach, siapa admin yang kelola? Dan apa udah ada
interface adminnya?"*

## Kondisi Saat Ini

- Halaman: `/admin` → `src/features/admin/components/AdminDashboard.tsx`
- Akses: hanya `super_admin` dan `regional_admin`; peran lain dialihkan
  ke `/dashboard`.
- Pintu masuk: kartu Admin pada `/dashboard` (belum ada di navbar).

## Isi Panel Admin

| Tab | Fungsi |
| --- | --- |
| **Approvals** | Menyetujui/menolak pendaftaran perusahaan, **coach**, dan talent |
| **Payments** | Mengonfirmasi pembayaran booking, kursus, RSVP event, dan DP/pelunasan agency |
| **Agency Projects** | Memantau dan mengubah status permintaan proyek agency |
| **Analytics** | Grafik pertumbuhan anggota, distribusi peran, lowongan, lamaran, dan pendapatan |
| **Fee Management** | Persentase potongan talent dan agency, saklar biaya per modul, tautan pembayaran Lynk.id |
| **Moderation** | Menghapus job, project, course, dan event yang melanggar |

Kartu ringkasan di bagian atas menampilkan total anggota, lowongan aktif,
proyek aktif, kursus aktif, booking bulan ini, dan proyek agency bulan ini.

## Alur Approval Coach (Jawaban untuk Klien)

```
User          →  /coach, tekan "Daftar jadi Coach"
                 profiles.is_coach = true
                 profiles.coach_approved = 'pending'
                        ↓
Admin         →  /admin, tab Approvals
                 bagian "Coach & Talent Approvals"
                 tekan "Setujui Coach" atau "Tolak"
                        ↓
Sistem        →  profiles.coach_approved = 'approved'
                        ↓
Coach         →  /coach terbuka penuh:
                 buat kursus, modul, materi, kuis, dan soal
```

Yang mengelola adalah pemegang peran `super_admin` atau `regional_admin`.

## Celah yang Ditemukan

1. **Belum ada cara mengangkat admin lewat antarmuka.** Kebijakan RLS pada
   `user_roles` hanya mengizinkan user mendaftarkan diri pada peran `member`,
   `company`, `client`, `coach`, dan `talent`. Peran `regional_admin` dan
   `super_admin` harus dimasukkan manual lewat SQL.
2. **`regional_admin` belum benar-benar dibatasi per daerah.** Perannya
   melihat seluruh data platform, sama seperti `super_admin`, padahal tabel
   `regions` sudah tersedia.
3. Tidak ada jejak audit — tidak tercatat admin mana yang menyetujui apa
   dan kapan (kecuali pada konfirmasi pembayaran).
4. Belum ada tautan `/admin` di navbar.
5. Tab Approvals menampilkan seluruh coach dan talent, bukan hanya yang
   berstatus `pending`, sehingga daftar makin panjang seiring waktu.
6. Belum ada CRUD untuk `agency_services` dan `case_studies`
   (lihat [07-services.md](07-services.md)).

## Rencana Kerja

> **Status per 9 September 2026** — item bertanda ✅ sudah diimplementasikan
> pada commit ini. Item bertanda ⬜ belum dikerjakan.

| No | Pekerjaan | Prioritas |
| --- | --- | --- |
| 1 | ✅ Tab Peran + `POST/DELETE /api/v1/admin/roles`, dijaga `withSuperAdmin` | Tinggi |
| 2 | ✅ `user_roles.region_id`; antrean approval event disaring per daerah | Tinggi |
| 3 | ✅ Default hanya `pending`, ada tombol "Tampilkan semua" | Sedang |
| 4 | ✅ Tabel `audit_logs` + tab Catatan Audit | Sedang |
| 5 | ✅ Tautan Panel Admin di menu navbar untuk admin | Rendah |
