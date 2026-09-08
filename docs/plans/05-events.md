# Fitur: Events (Event Komunitas)

## Kondisi Saat Ini

- Halaman: `/events` → `src/features/events/components/EventsList.tsx`
- Sumber data: `events`, `event_rsvps`, `regions`, `app_settings`

Fungsionalitas yang sudah berjalan:

- Daftar event terbagi menjadi "akan datang" dan "sudah lewat".
- Filter daerah dan tipe event (meetup, workshop, hackathon, conference)
  serta pencarian judul/deskripsi.
- Membuat event: judul, deskripsi, tipe, lokasi, tanggal, kapasitas,
  daerah, dan opsi berbayar beserta harga.
- RSVP; RSVP ganda ditolak dengan pesan "Sudah terdaftar".
- Event berbayar memunculkan `PaymentCard` setelah RSVP.

## Peran

| Peran | Kewenangan |
| --- | --- |
| Semua user login | Membuat event **dan** melakukan RSVP |
| Admin | Moderasi event di `/admin` tab Moderation, konfirmasi pembayaran RSVP |

## Celah yang Ditemukan

1. **Celah izin.** Kebijakan RLS `012_allow_authenticated_insert_events`
   memakai `WITH CHECK (true)`, sehingga **setiap user yang login bisa
   membuat event** tanpa persetujuan siapa pun. Tidak ada pembatasan peran
   dan tidak ada alur approval seperti pada Job atau Course.
2. Kapasitas dijaga **hanya di antarmuka** — tombol RSVP disembunyikan saat
   `spotsLeft` habis. Tidak ada validasi di sisi server, sehingga RSVP
   bersamaan atau panggilan API langsung tetap bisa melewati kuota.
3. Pembuat event tidak bisa mengubah atau membatalkan eventnya.
4. Tidak ada daftar peserta bagi penyelenggara.

## Rencana Kerja

> **Status per 9 September 2026** — item bertanda ✅ sudah diimplementasikan
> pada commit ini. Item bertanda ⬜ belum dikerjakan.

| No | Pekerjaan | Prioritas |
| --- | --- | --- |
| 1 | ✅ RLS `WITH CHECK (true)` diganti; event wajib `created_by = auth.uid()` dan berstatus `pending` | Tinggi |
| 2 | ✅ `events.approval_status` + tab Approvals admin; hanya event `approved` yang tayang | Tinggi |
| 3 | ✅ RPC `create_event_rsvp` mengunci baris event dan menolak bila penuh | Tinggi |
| 4 | ⬜ Edit dan batalkan event oleh penyelenggara (RLS sudah mengizinkan) | Sedang |
| 5 | ⬜ Daftar peserta dan ekspor | Rendah |
