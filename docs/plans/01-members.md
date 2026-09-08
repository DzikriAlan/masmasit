# Fitur: Members (Direktori Anggota)

## Kondisi Saat Ini

- Halaman daftar: `/directory` → `src/features/directory/components/DirectoryList.tsx`
- Halaman detail: `/directory/[id]` → `src/features/directory/components/DirectoryDetail.tsx`
- Sumber data: tabel `profiles`, `user_skills`, `skills`, `experiences`

Fungsionalitas yang sudah berjalan:

- Pencarian berdasarkan nama dan bio (debounce 300 ms).
- Filter lokasi, status kerja, dan skill.
- Kartu anggota menampilkan avatar, lokasi, status, dan tiga skill teratas.
- Halaman detail menampilkan skill lengkap, riwayat pengalaman, badge
  Coach/Talent, serta tombol chat dan booking.
- Enam data dummy ikut ditampilkan agar direktori tidak kosong saat awal.

## Peran

| Peran | Kewenangan |
| --- | --- |
| Publik / semua user login | Melihat direktori dan detail profil |
| Pemilik profil | Mengubah datanya sendiri lewat `/profile` dan `/onboarding` |
| Admin | Belum ada moderasi khusus untuk profil |

## Celah yang Ditemukan

1. Filter skill disaring **di sisi klien**, hanya terhadap 60 baris yang
   sudah terambil. Anggota dengan skill tersebut di luar 60 baris pertama
   tidak akan muncul.
2. Data dummy bercampur dengan data asli tanpa penanda visual.
3. Belum ada paginasi; query dibatasi 60 baris.
4. Belum ada moderasi admin untuk profil yang melanggar.

## Rencana Kerja

> **Status per 9 September 2026** — item bertanda ✅ sudah diimplementasikan
> pada commit ini. Item bertanda ⬜ belum dikerjakan.

| No | Pekerjaan | Prioritas |
| --- | --- | --- |
| 1 | ✅ Filter skill dipindah ke query lewat inner join `user_skills` | Tinggi |
| 2 | ✅ Paginasi 24 per halaman dengan tombol Sebelumnya/Berikutnya | Sedang |
| 3 | ✅ Data dummy kini hanya tampil di halaman 1 tanpa filter | Sedang |
| 4 | ⬜ Aksi moderasi profil di Panel Admin | Rendah |
