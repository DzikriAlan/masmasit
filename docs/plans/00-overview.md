# Overview Rencana Fitur masmasit

Dokumen ini merangkum kondisi platform per 9 September 2026 dan menjawab
pertanyaan klien soal peran admin LMS, pihak yang memasang (poster) dan
pihak yang mengambil (taker) project/training/event.

## Jawaban Ringkas untuk Pertanyaan Klien

> "Fungsi fungsi ini — admin lms / selaku yang post project/training/event /
> selaku yang ambil project/training/event"

Ketiga fungsi itu **sudah ada** dan dipisahkan lewat tabel `user_roles`
(satu user boleh punya banyak peran):

| Peran | Nilai di DB | Bisa memasang | Bisa mengambil |
| --- | --- | --- | --- |
| Member | `member` | Project | Job, Project, Course, Event |
| Perusahaan | `company` | Job (setelah disetujui admin) | — |
| Klien | `client` | Project, permintaan Agency Service | — |
| Coach | `coach` | Course + Modul + Kuis (setelah disetujui admin) | — |
| Talent | `talent` | Slot konsultasi (setelah disetujui admin) | — |
| Admin Daerah | `regional_admin` | — | Approval, moderasi, pembayaran |
| Super Admin | `super_admin` | — | Semua kewenangan admin |

> "Kalo gw daftar jadi coach, siapa admin yang kelola?
> Dan apa udah ada interface adminnya?"

**Sudah ada.** Alurnya:

1. User membuka `/coach`, menekan tombol daftar coach.
   Sistem menulis `profiles.is_coach = true` dan `coach_approved = 'pending'`.
2. Pengajuan masuk ke **Panel Admin** di `/admin`, tab **Approvals**,
   bagian *Coach & Talent Approvals*.
3. Yang berwenang menyetujui adalah user dengan peran `super_admin`
   atau `regional_admin`. Peran lain otomatis dialihkan ke `/dashboard`.
4. Setelah disetujui (`coach_approved = 'approved'`), menu pengelolaan
   kursus di `/coach` terbuka: buat course, modul, materi, kuis, dan soal.

Panel Admin yang sudah berjalan mencakup enam tab: Approvals, Payments,
Agency Projects, Analytics, Fee Management, dan Moderation.

## Siapa yang Mengangkat Admin

**Sudah tersedia.** Panel Admin punya tab **Peran**: pemegang `super_admin`
dapat mengangkat dan mencabut peran, termasuk `regional_admin` yang wajib
dikaitkan ke satu daerah. Endpoint `POST`/`DELETE /api/v1/admin/roles`
dijaga `withSuperAdmin` dan setiap perubahan tercatat di `audit_logs`.

> **Super admin pertama** tetap harus dimasukkan manual ke tabel `user_roles`
> lewat database, karena tidak ada yang bisa mengangkatnya dari dalam aplikasi.
> Setelah itu, seluruh pengelolaan peran bisa dilakukan dari antarmuka.

## Status Fitur

| Fitur | Halaman | Status | Catatan |
| --- | --- | --- | --- |
| Members | `/directory` | Berjalan | Lihat [01-members.md](01-members.md) |
| Jobs | `/jobs` | Berjalan | Lihat [02-jobs.md](02-jobs.md) |
| Projects | `/projects` | Berjalan | Lihat [03-projects.md](03-projects.md) |
| LMS | `/courses`, `/coach` | Berjalan | Lihat [04-lms.md](04-lms.md) |
| Events | `/events` | Berjalan, ada celah izin | Lihat [05-events.md](05-events.md) |
| Talents | `/talents` | Berjalan | Lihat [06-talents.md](06-talents.md) |
| Services | `/services` | Berjalan, kurang CRUD admin | Lihat [07-services.md](07-services.md) |
| Messages | `/pesan` | Berjalan | Lihat [08-messages.md](08-messages.md) |
| Admin | `/admin` | Berjalan | Lihat [09-admin.md](09-admin.md) |
| Aktivitas Saya | `/activity` | Baru | Lamaran, kursus, dan booking dalam satu halaman |
| Pelamar | `/jobs/applicants` | Baru | Perusahaan meninjau pelamar |

## Hasil Audit Kode terhadap CODE.md

Audit dan perbaikannya dicatat di [10-audit-code-standard.md](10-audit-code-standard.md).
