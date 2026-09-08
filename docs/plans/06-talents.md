# Fitur: Talents (Penyewaan Talent)

## Kondisi Saat Ini

- Daftar: `/talents` → `src/features/talents/components/TalentsList.tsx`
- Booking: `/talents/[id]` → `src/features/talents/components/TalentBooking.tsx`
- Sumber data: `profiles`, `bookings`, `app_settings`

Fungsionalitas yang sudah berjalan:

- Hanya menampilkan profil dengan `is_talent = true` dan
  `talent_approved = 'approved'`.
- Pencarian nama dan bio.
- Form booking: tipe sesi, jadwal, catatan, dan nominal.
- Persentase potongan admin diambil dari `app_settings.talent_admin_fee_percentage`;
  nominal bersih untuk talent ditampilkan langsung di form.
- **Klien eksternal tanpa akun** tetap bisa booking dengan mengisi nama dan email.
- Setelah booking dibuat, `PaymentCard` muncul untuk penyelesaian pembayaran.
- Lima data dummy ditampilkan agar halaman tidak kosong.

## Peran

| Peran | Kewenangan |
| --- | --- |
| Member | Mendaftar jadi talent lewat `/profile` → `talent_approved = 'pending'` |
| Talent (disetujui) | Muncul di direktori dan menerima booking |
| Klien / publik | Memesan sesi, termasuk tanpa akun |
| Admin | Menyetujui talent di `/admin` tab Approvals, konfirmasi pembayaran booking |

## Celah yang Ditemukan

1. Talent tidak punya halaman untuk **melihat booking yang masuk** dan
   menerima atau menolaknya. Status `bookings.status` selalu `pending`.
2. Talent tidak bisa menentukan tarif sendiri — nominal diisi oleh pemesan
   dengan nilai awal Rp500.000.
3. Tidak ada pengecekan bentrok jadwal.
4. Tabel `project_reviews` belum dipakai untuk menilai talent.

## Rencana Kerja

> **Status per 9 September 2026** — item bertanda ✅ sudah diimplementasikan
> pada commit ini. Item bertanda ⬜ belum dikerjakan.

| No | Pekerjaan | Prioritas |
| --- | --- | --- |
| 1 | ✅ Tab Booking di `/activity`: terima, tolak, tandai selesai | Tinggi |
| 2 | ✅ `profiles.hourly_rate` + field di `/profile`, jadi nominal awal booking | Tinggi |
| 3 | ⬜ Validasi bentrok jadwal | Sedang |
| 4 | ⬜ Rating dan ulasan | Rendah |
