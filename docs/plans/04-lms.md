# Fitur: LMS (Learning Management System)

Fitur ini yang paling erat dengan pertanyaan klien soal **admin LMS**.

## Kondisi Saat Ini

- Katalog kursus: `/courses` → `src/features/courses/components/CoursesList.tsx`
- Detail & belajar: `/courses/[id]` → `src/features/courses/components/CourseDetail.tsx`
- Panel coach: `/coach` → `src/features/coach/components/CoachDashboard.tsx`
- Sumber data: `courses`, `course_modules`, `course_materials`, `quizzes`,
  `quiz_questions`, `enrollments`, `module_completions`, `quiz_submissions`,
  `certificates`

## Tiga Peran dalam LMS

### 1. Admin LMS (`super_admin` / `regional_admin`)

Antarmuka: `/admin`

- Tab **Approvals** → menyetujui atau menolak pengajuan coach
  (`profiles.coach_approved`).
- Tab **Moderation** → menghapus kursus yang melanggar.
- Tab **Payments** → mengonfirmasi pembayaran `enrollments`
  (status `unpaid` → `awaiting_confirmation` → `paid`).
- Tab **Fee Management** → menyalakan/mematikan `lms_fee_active` dan
  mengatur tautan pembayaran `lynkid_courses_url`.

### 2. Pemasang Training (`coach`)

Antarmuka: `/coach`

- Mendaftar sebagai coach → `coach_approved = 'pending'`, menunggu admin.
- Setelah disetujui: membuat kursus (judul, deskripsi, level, kategori, harga).
- Menyusun modul berurutan, menandai modul gratis atau berbayar.
- Menambahkan materi per modul: teks, video, atau dokumen.
- Membuat kuis dengan nilai kelulusan, beserta soal pilihan ganda (A–D).
- Melihat jumlah peserta terdaftar per kursus.

### 3. Pengambil Training (member)

Antarmuka: `/courses` dan `/courses/[id]`

- Menelusuri katalog kursus.
- Mendaftar kursus; pendaftaran ganda ditolak.
- Membayar bila kursus berbayar (via `PaymentCard`).
- Membuka materi, menandai modul selesai, progres terhitung otomatis.
- Mengerjakan kuis dan melihat skor serta status lulus.
- Sertifikat terbit otomatis saat progres mencapai 100%.

## Celah yang Ditemukan

1. **Hasil kuis belum disimpan.** Tabel `quiz_submissions` sudah ada, tetapi
   `CourseDetail` hanya menyimpan skor di state komponen — hilang saat refresh.
2. **Penyelesaian modul belum tersimpan.** Tabel `module_completions` ada,
   tetapi `completedModules` hanya state lokal; progres tersimpan sebagai
   angka di `enrollments.progress` tanpa rincian modul mana yang selesai.
3. Coach belum bisa **mengubah atau menghapus kursus** yang sudah dibuat —
   hanya bisa membuat dan mengelola modul di dalamnya.
4. Belum ada halaman "Kursus Saya" untuk peserta.
5. Sertifikat terbit tanpa syarat lulus kuis.
6. Belum ada gating: modul berbayar masih bisa dibuka meski belum lunas.

## Rencana Kerja

> **Status per 9 September 2026** — item bertanda ✅ sudah diimplementasikan
> pada commit ini. Item bertanda ⬜ belum dikerjakan.

| No | Pekerjaan | Prioritas |
| --- | --- | --- |
| 1 | ✅ Jawaban dan skor tersimpan ke `quiz_submissions`, dimuat ulang saat dibuka | Tinggi |
| 2 | ✅ Penyelesaian modul tersimpan ke `module_completions` | Tinggi |
| 3 | ✅ Materi terkunci sampai lunas (`canAccess`) | Tinggi |
| 4 | ✅ Sertifikat terbit hanya bila semua kuis lulus | Sedang |
| 5 | ⬜ Edit dan hapus kursus untuk coach pemilik | Sedang |
| 6 | ✅ Tab "Kursus Saya" di `/activity` dengan progres dan status sertifikat | Sedang |
| 7 | ⬜ Dasbor coach: daftar peserta per kursus | Rendah |
