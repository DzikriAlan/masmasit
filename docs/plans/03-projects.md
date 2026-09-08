# Fitur: Projects (Proyek & Penawaran)

## Kondisi Saat Ini

- Daftar: `/projects` → `src/features/projects/components/ProjectsList.tsx`
- Detail: `/projects/[id]` → `src/features/projects/components/ProjectDetail.tsx`
- Sumber data: tabel `projects`, `project_bids`, `project_reviews`, `profiles`

Fungsionalitas yang sudah berjalan:

- Memasang proyek (judul, deskripsi, rentang anggaran, tenggat).
- Pencarian dan filter status (debounce 300 ms).
- Mengajukan penawaran (bid) berisi nominal, proposal, dan estimasi hari.
- Bid ganda dari user yang sama ditolak.
- Pemilik proyek menerima satu bid; bid lain otomatis ditolak dan status
  proyek berubah menjadi `in_progress`.

## Peran

| Peran | Kewenangan |
| --- | --- |
| Member / Klien | Memasang proyek |
| Member / Talent | Mengajukan penawaran |
| Pemilik proyek | Menerima satu penawaran |
| Admin | Moderasi konten proyek di `/admin` tab Moderation |

## Celah yang Ditemukan

1. Penerimaan bid dijalankan dalam **tiga panggilan terpisah**
   (terima bid → tolak bid lain → ubah status proyek). Bila salah satu gagal
   di tengah, data bisa tidak konsisten.
2. Belum ada penyelesaian proyek (`completed`) dan pembayaran.
3. Tabel `project_reviews` sudah ada di database tetapi belum dipakai UI.
4. Belum ada pembatalan bid oleh pengaju.

## Rencana Kerja

> **Status per 9 September 2026** — item bertanda ✅ sudah diimplementasikan
> pada commit ini. Item bertanda ⬜ belum dikerjakan.

| No | Pekerjaan | Prioritas |
| --- | --- | --- |
| 1 | ✅ RPC `accept_project_bid` — satu transaksi, verifikasi pemilik proyek | Tinggi |
| 2 | ⬜ Status `completed` dan alur pembayaran proyek | Tinggi |
| 3 | ⬜ Aktifkan `project_reviews` | Sedang |
| 4 | ⬜ Pembatalan bid oleh pengaju | Rendah |
