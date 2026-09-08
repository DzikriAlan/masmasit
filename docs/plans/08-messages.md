# Fitur: Messages (Pesan)

## Kondisi Saat Ini

- Halaman: `/pesan` → `src/features/messages/components/MessagesInbox.tsx`
- Sumber data: tabel `messages`, `profiles`

Fungsionalitas yang sudah berjalan:

- Daftar percakapan diurutkan dari pesan terbaru, lengkap dengan jumlah
  pesan belum dibaca.
- Pencarian anggota untuk memulai percakapan baru (minimal 2 huruf).
- Pesan masuk real-time lewat Supabase Realtime pada tabel `messages`.
- Pesan otomatis ditandai terbaca saat percakapan dibuka.
- Bisa dibuka langsung ke lawan bicara lewat `?to=<user_id>`, dipakai oleh
  tombol Chat di halaman profil dan talent.

## Peran

| Peran | Kewenangan |
| --- | --- |
| Semua user login | Mengirim dan menerima pesan ke sesama anggota |
| Admin | Belum ada moderasi pesan |

## Celah yang Ditemukan

1. `getMessagesConversations` mengambil profil lawan bicara **satu per satu
   di dalam loop**. Semakin banyak percakapan, semakin banyak query.
2. Belum ada lampiran berkas atau gambar.
3. Belum ada blokir dan pelaporan pengguna.
4. Belum ada notifikasi pesan baru di luar halaman `/pesan`.

## Rencana Kerja

> **Status per 9 September 2026** — item bertanda ✅ sudah diimplementasikan
> pada commit ini. Item bertanda ⬜ belum dikerjakan.

| No | Pekerjaan | Prioritas |
| --- | --- | --- |
| 1 | ✅ Loop N+1 diganti satu query `in(...)` | Tinggi |
| 2 | ⬜ Notifikasi pesan baru pada lonceng | Sedang |
| 3 | ⬜ Blokir dan laporkan pengguna | Sedang |
| 4 | ⬜ Lampiran berkas | Rendah |
