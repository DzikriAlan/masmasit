# masmasit.online — PRD Update (Final, Ringkas)

**Struktur Navigasi Final, Fitur Baru & Bagian Utama yang Perlu Diupdate**

Live saat ini: masmasit.vercel.app · Untuk: Developer, Designer & seluruh Stakeholder · Versi: 4.0 (Final Ringkas) · 10 Sept 2026

> **Cara baca dokumen ini:** Ini rangkuman akhir dari seluruh diskusi struktur & fitur sebelumnya, dipadatkan jadi satu referensi tunggal. Detail teknis (skema database, RLS, dsb) ada di prompt Bolt.new terpisah — dokumen ini fokus ke apa yang dibangun dan kenapa, supaya semua pihak (bukan cuma dev) paham gambaran besarnya.

> *Catatan editorial: file sumber dokumen ini adalah teks hasil ekspor yang datar (satu paragraf panjang tanpa jeda baris, dengan beberapa sel tabel tersisip di luar urutan akibat page-break). Isi di bawah ini sudah dirapikan jadi heading/list/tabel untuk keterbacaan — tidak ada kalimat yang dihapus atau ditambah, hanya disusun ulang strukturnya. Baris terakhir dokumen ("...alur Agency Owner (Bagian 8") terpotong di sumber aslinya; tanda kurung ditutup di sini karena polanya konsisten dengan item checklist lain.*

---

## 1. Struktur Navigasi Final (Header) — Revisi: Tanpa "Home"

**Nav utama:**

`About` · `Product ▾` · `Ecosystem ▾` · `Discover` · `Contact Us`

**Kanan header** (terpisah dari nav utama): `Search` · `EN/ID` · `Sign in` · **`Get Started`** (tombol paling menonjol — lihat Bagian 5)

### Perubahan dari versi sebelumnya

1. **Home dihapus** — logo di kiri sudah cukup jadi jalur pulang ke landing page, tidak perlu diulang sebagai menu teks.
2. **About naik jadi item berdiri sendiri** (sebelumnya sub-bagian di dalam Discover) — supaya pengunjung baru langsung dapat orientasi "ini platform apa" tanpa harus masuk ke Discover dulu.
3. **"Fitur" diganti nama jadi "Product"** — lebih universal & konsisten dengan konvensi umum (mis. Circle.so juga pakai "Product" sebagai dropdown pertama).
4. **Community digabung jadi kolom ke-4 di dalam mega menu Ecosystem** (bukan dropdown terpisah lagi) — hasilnya cuma 2 dropdown (Product, Ecosystem) + 3 link langsung (About, Discover, Contact Us), jauh lebih ringan secara visual.

### Urutan Menu

| # | Menu | Tipe | Isi |
|---|------|------|-----|
| 1 | **About** | Link langsung | Siapa masmasit, untuk siapa, value utama — versi singkat (identitas platform) |
| 2 | **Product** | Dropdown ringan, 2 item | Team Builder (rename dari "Smartmatching") + Spotlight (rename dari "Show Product Case") |
| 3 | **Ecosystem** | Mega menu, 4 kolom | Jobs, Talent, Projects, Team Collabs, Agency, Courses, Services + kolom Community (Discussions, Members, Builds, Events) |
| 4 | **Discover** | Link langsung | Article, Case Study, Tulisan Member (About sudah pindah jadi item sendiri di urutan 1) |
| 5 | **Contact Us** | Link/tombol | Redirect WhatsApp |

### Kenapa urutan ini yang paling nyaman (UX flow kiri → kanan)

1. **About di posisi pertama** — pengunjung baru yang belum kenal masmasit butuh orientasi identitas dulu sebelum diarahkan ke fitur; pola umum di hampir semua marketing site (identity → value → depth).
2. **Product di posisi kedua** — begitu tahu "ini platform apa", langsung tunjukkan diferensiator utama (Team Builder, Spotlight) sebagai value proposition, sebelum masuk ke daftar fitur teknis di Ecosystem.
3. **Ecosystem di tengah** — ini "isi" utama platform (11 item total), wajar di posisi paling mudah dijangkau, dan sudah mencakup Community sehingga item yang saling berkaitan (mis. Events dengan Projects) ada di satu dropdown yang sama.
4. **Discover setelah Ecosystem** — sifatnya konten/editorial (bacaan), prioritas lebih rendah dari fitur inti, logis di posisi ke-4.
5. **Contact Us paling kanan dari nav utama** — sifatnya aksi/penutup eksplorasi, natural bersebelahan dengan Sign in/Get Started di sisi paling kanan header.

---

## 2. Fitur Baru — Detail Singkat

| | Team Builder | Spotlight |
|---|---|---|
| **Cara Kerja** | Member bikin tim, sistem generate grade otomatis (Junior/Mid/Senior) untuk tiap role berdasarkan data profil (skill, pengalaman, sertifikat) | Showcase produk/jasa — data ditarik dari Builds (Community) + submission langsung dari Solo Builder & Agency |
| **Output** | Tim bisa redirect ambil Client Project atau daftar ke Team Collabs (buat R&D) | Hot Rank (produk trending), exposure lebih tinggi buat brand member |

---

## 3. Homepage — Tambahan Section "About Community"

Ditambahkan langsung di bawah Hero (sebelum section lain) — cukup 2–3 kalimat: siapa masmasit, untuk siapa (praktisi IT Indonesia), dan value utamanya (community + ecosystem jadi satu). Ini teaser singkat saja; versi lengkap ada di halaman About (nav item tersendiri, lihat Bagian 1). Diakhiri 1 CTA **"Pelajari Lebih Lanjut"** → link ke halaman About.

---

## 4. Ecosystem (Termasuk Community) — Rincian Isi 11 Item

### Kolom 1–3: Kerja, Talent, Bisnis (7 item)

| Item | Status |
|---|---|
| Jobs | LIVE |
| Projects | LIVE |
| Team Collabs | BARU |
| Talent | LIVE |
| Courses | LIVE |
| Agency | EXTEND — jadi halaman tersendiri, lihat Bagian 7 |
| Services | LIVE |

### Kolom 4: Community (4 item, sebagian baru)

| Item | Status |
|---|---|
| Members | LIVE (directory) |
| Events | LIVE |
| Discussions | BARU — forum ringan (topik + komentar) |
| Builds | BARU — feed "lagi bangun apa", sumber data Spotlight |

---

## 5. Aturan Akses & Kenapa "Get Started" Harus Menonjol

- Tidak bisa akses fitur inti tanpa akun. User bisa browsing publik di About/Ecosystem/Discover, tapi begitu klik aksi apapun (apply, bid, join tim, booking, beli), langsung kena login wall.
- Karena hampir semua eksplorasi berujung ke sini, tombol **"Get Started"** di header harus dibuat paling menonjol secara visual (warna solid kontras, bukan outline) — ini bukan CTA sekunder, ini jalur utama.

---

## 6. Alur Pembayaran & Alur Match — Kedua Butuh Transparansi

### 6.1 Pembayaran → Redirect ke GoAkal

- User klik "Beli" → Tampilkan notice jelas "akan diarahkan ke GoAkal"
- Berlaku untuk: beli produk member (putus/one-time), course, dan booking 1-on-1 talent.
- Transparansi penting supaya user tidak kaget pindah platform saat checkout.

### 6.2 Match Proyek ↔ Tim → Redirect WhatsApp (Human-in-the-Loop)

**Alur:** Client & Tim Matched → Redirect checkout GoAkal → Status: **"Matched — lanjut ke WhatsApp"** → Kedua pihak chat Tri → Tri buatkan grup WA manual

- Ini proses manual, bukan instant booking seperti Talents/Services yang self-serve.
- Di halaman Team Collabs/Projects, status **"Matched"** harus terlihat jelas beda dari status booking biasa — supaya user paham prosesnya butuh 1×24 jam, bukan otomatis.

---

## 7. 4 Jalur Jasa & Halaman Agency (Recap Penting)

Ada 4 sumber jasa berbeda di platform, semua bermuara ke satu mekanisme hire:

| | Solo Builder | Agency | Freelancer | Community |
|---|---|---|---|---|
| **Sumber** | Showcase produk pribadi | Katalog jasa tim/perusahaan (termasuk agency in-house & agency member lain) | Talent individu | Tim hasil Team Builder |
| **Discovery** | Spotlight | `/agency` (halaman baru) + tampil di Spotlight | Talents (existing) | Team Collabs |

Halaman `/agency` baru: listing semua agency approved (termasuk agency in-house masmasit sendiri, tidak dispesialkan) + halaman detail per-agency berisi katalog jasa mereka.

Pendaftaran agency lewat dashboard user → approval admin (pola sama seperti approval company).

---

## 8. Onboarding & Data User

Setiap akun (member, talent, coach, company, agency owner — role baru) wajib lewat onboarding setelah login pertama sebelum akses fitur inti: pilih peran (multi-select, bisa lebih dari satu), isi nama & avatar, dan jika pilih **"Agency Owner"** ada sub-step tambahan (nama agency, logo, deskripsi).

Prinsipnya: tidak ada user tanpa identitas & role jelas yang muncul di Talents, Agency, atau Team Builder.

---

## 9. Prioritas Eksekusi

- [ ] Rebuild header sesuai struktur final Bagian 1 (About, Product, Ecosystem+Community, Discover, Contact Us + Get Started menonjol, tanpa Home)
- [ ] Bangun halaman Team Builder & Spotlight (Bagian 2)
- [ ] Tambah section "About Community" di homepage (Bagian 3)
- [ ] Bangun Discussions, Builds, Team Collabs (item baru di dalam mega menu Ecosystem)
- [ ] Bangun halaman `/agency` + form pendaftaran + approval admin (Bagian 7)
- [ ] Bangun halaman About tersendiri (identitas platform) + rebuild Discover jadi 1 halaman gabungan Article/Case Study/Tulisan Member
- [ ] Pasang notice transparansi GoAkal di semua tombol beli + status "Matched → WhatsApp" di Team Collabs/Projects (Bagian 6)
- [ ] Perluas onboarding: multi-role select + alur Agency Owner (Bagian 8)
