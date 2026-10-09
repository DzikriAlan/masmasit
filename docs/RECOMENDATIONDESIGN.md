# Design Recommendations (666 Listing)

Ini adalah pasangan dari `design.md`. Jika `design.md` berisi *checklist judgement* (pertanyaan untuk menilai), file ini berisi *keputusan/rekomendasi konkret* yang sudah "dicentang" — pilihan desain aktif yang direkomendasikan untuk menghindari hasil generik/AI slop. Gunakan sebagai daftar pilihan default saat membuat keputusan desain.

## 1. Prinsip Umum & Filosofi Desain
- [x] Tentukan satu ide/konsep inti sebelum membuka software desain
- [x] Tulis 1 kalimat "big idea" dan tempel di sisi kanvas selama proses desain
- [x] Ambil satu sudut pandang berani, bukan rata-rata dari 10 referensi
- [x] Jadikan batasan proyek (waktu, budget, teknis) sebagai bahan ide, bukan alasan menyerah
- [x] Riset audiens dan kompetitor dulu sebelum sketsa pertama
- [x] Buat moodboard yang menolak referensi paling umum di industri tersebut
- [x] Tentukan 3 kata sifat yang harus terasa dari desain ini
- [x] Uji tiap elemen dengan "apa yang hilang kalau ini dibuang"
- [x] Buat versi minimal dulu, baru tambahkan lapisan detail bertahap
- [x] Simpan alasan tiap keputusan besar dalam catatan desain
- [x] Pilih 1-2 tren yang benar-benar relevan, tolak sisanya
- [x] Selaraskan kepribadian visual dengan nilai brand secara eksplisit
- [x] Prioritaskan fungsi lebih dulu, lalu perkaya bentuknya
- [x] Modifikasi referensi minimal 30% agar tidak terasa jiplakan
- [x] Jadwalkan review ulang desain setelah jeda 1-2 hari
- [x] Berani menghapus elemen favorit jika tidak mendukung tujuan
- [x] Pertahankan satu benang merah visual di semua turunan aset
- [x] Uji ulang keputusan desain dengan pertanyaan "kenapa" tiga kali berturut

## 2. Tipografi
- [x] Pilih 2 font: satu display berkarakter, satu teks yang sangat mudah dibaca
- [x] Tetapkan skala tipografi modular (misal rasio 1.25 atau 1.333)
- [x] Set line-height 1.5 untuk body text sebagai default
- [x] Batasi lebar kolom teks ke 60-75 karakter per baris
- [x] Gunakan ukuran dasar 16px untuk body text di web
- [x] Pilih font dengan karakter kuat (bukan Arial/Times polos) untuk identitas
- [x] Gunakan letter-spacing negatif tipis pada heading besar agar rapat elegan
- [x] Terapkan font-weight 600-700 khusus untuk elemen penekanan
- [x] Buat lompatan ukuran signifikan antar level heading (misal 2x lipat ke H1)
- [x] Batasi teks kapital penuh hanya untuk label pendek (button, tag)
- [x] Pasangkan serif ekspresif dengan sans-serif netral untuk kontras
- [x] Biarkan teks bernapas — jangan pernah memaksa "justify" tanpa hyphenation
- [x] Rata kiri sebagai default alignment body text
- [x] Cek manual widow/orphan sebelum final dan sisipkan non-breaking space
- [x] Skalakan ukuran font dengan clamp()/rem agar adaptif di semua layar
- [x] Investasikan satu font custom/lisensi untuk elemen kunci brand
- [x] Batasi pemakaian italic hanya untuk penekanan kutipan/istilah asing
- [x] Standarkan margin-bottom paragraf lewat token, bukan enter manual

## 3. Warna
- [x] Tentukan 1 warna primary, 1 secondary, 3-5 netral, 1-2 aksen
- [x] Uji kontras teks-background dengan target rasio 4.5:1 ke atas
- [x] Petakan makna tiap warna (sukses, error, warning, info) secara eksplisit
- [x] Batasi gradient hanya untuk 1-2 elemen hero, bukan seluruh halaman
- [x] Racik warna netral sendiri (sedikit tint warna brand) alih-alih abu-abu default
- [x] Simulasikan palet di color-blind simulator sebelum finalisasi
- [x] Kunci hex/token warna brand di satu sumber (design tokens)
- [x] Gunakan aksen warna hanya pada 1 elemen fokus per layar
- [x] Bangun palet dark mode terpisah dari nol, bukan hasil invert
- [x] Riset psikologi warna sesuai budaya target pasar utama
- [x] Pilih warna khas yang jarang dipakai kompetitor langsung sebagai identitas
- [x] Turunkan opacity/tint warna disabled state secara konsisten (misal 40%)
- [x] Jaga saturasi warna besar di bawah 80% untuk kenyamanan mata
- [x] Kalibrasi warna di monitor berbeda sebelum kirim ke produksi
- [x] Beri nama semantik token warna (color-primary, color-danger, dst)
- [x] Definisikan warna hover sedikit lebih gelap/terang (±10%) dari base
- [x] Pilih skema warna kategorikal yang mudah dibedakan untuk chart
- [x] Sertakan ikon/pola selain warna untuk menandai status penting

## 4. Layout & Struktur
- [x] Rancang alur baca eksplisit berdasarkan pola F/Z sesuai konten
- [x] Tetapkan satu focal point besar per section
- [x] Variasikan lebar/posisi blok antar section untuk ritme visual
- [x] Beri tiap section identitas kecil (warna aksen/ikon berbeda) dalam satu sistem
- [x] Naikkan konten paling penting ke atas viewport pertama
- [x] Bangun di atas grid 12 kolom sebagai kerangka dasar
- [x] Isi layout dengan draft konten asli sejak tahap wireframe
- [x] Batasi elemen dekoratif agar tidak menutupi/menabrak konten
- [x] Variasikan ukuran blok sesuai bobot informasinya (bukan grid seragam)
- [x] Stress-test layout dengan teks terpanjang dan terpendek yang realistis
- [x] Gunakan whitespace besar secara sengaja di sekitar elemen kunci
- [x] Urutkan section berdasarkan prioritas kebutuhan pengguna, bukan struktur internal
- [x] Modifikasi pola "hero-fitur-testimoni-footer" dengan elemen unik brand
- [x] Beri ruang aman (offset) untuk elemen sticky agar tidak menutup konten
- [x] Terapkan pola struktur yang sama untuk halaman-halaman sejenis
- [x] Tentukan breakpoint dari kebutuhan konten nyata, bukan angka standar semata
- [x] Batasi nesting wrapper maksimal 3-4 level dalam satu komponen
- [x] Cocokkan struktur visual dengan struktur data/informasi aslinya

## 5. Grid & Alignment
- [x] Aktifkan grid overlay di software desain sepanjang proses kerja
- [x] Tetapkan margin halaman konsisten (misal 24px mobile, 80px desktop)
- [x] Gunakan gutter grid proporsional (misal 16-24px)
- [x] Cek alignment dengan smart guide, bukan estimasi mata
- [x] Sesuaikan alignment optis manual untuk bentuk bulat/segitiga
- [x] Bangun skala ukuran dari grid 8pt (8, 16, 24, 32, 40...)
- [x] Tetapkan baseline grid untuk blok teks panjang
- [x] Sejajarkan ikon dan teks dengan optical centering, bukan math centering
- [x] Definisikan jumlah kolom per breakpoint (4/8/12)
- [x] Beri alasan eksplisit untuk tiap elemen yang keluar grid
- [x] Rata-kanankan angka dalam tabel/kolom finansial
- [x] Samakan gutter kolom di seluruh halaman lewat token spacing
- [x] Tetapkan container max-width (misal 1200-1440px) untuk layar besar
- [x] Gunakan full-bleed hanya untuk elemen visual yang disengaja
- [x] Perlakukan grid sebagai kerangka fleksibel, bukan aturan mutlak
- [x] Selaraskan ikon dalam tombol dengan optical alignment
- [x] Tambahkan breakpoint khusus untuk konten unik (tabel lebar, dsb)
- [x] Validasi grid dengan overlay sebelum handoff ke developer

## 6. Spacing & White Space
- [x] Bangun skala spacing token (4, 8, 12, 16, 24, 32, 48, 64)
- [x] Buat jarak lebih rapat untuk elemen berkaitan, lebih renggang untuk tidak berkaitan
- [x] Standarkan padding internal per jenis komponen
- [x] Beri whitespace generous di sekitar CTA utama
- [x] Longgarkan spacing elemen yang terasa padat saat review
- [x] Buat skala jarak vertikal antar section (misal 64/96/128px)
- [x] Pisahkan token margin dan padding dengan aturan pemakaian jelas
- [x] Perbesar spacing di desktop, perketat proporsional di mobile
- [x] Kelompokkan elemen terkait lewat jarak yang lebih dekat (proximity)
- [x] Dokumentasikan sistem spacing agar tidak ada nilai acak baru
- [x] Bedakan margin antar baris dan antar paragraf secara eksplisit
- [x] Samakan spacing antar item list/menu lewat token
- [x] Tetapkan target sentuh minimal 44x44px di semua tombol mobile
- [x] Beri konteks visual (garis/background) untuk elemen yang butuh berdiri sendiri
- [x] Skala-kan padding container mengikuti breakpoint layar
- [x] Simpan token spacing di satu file agar dipakai ulang tim
- [x] Beri jarak aman antar CTA berdekatan (misal minimal 8-16px)
- [x] Isi ruang kosong dengan konten atau biarkan sengaja sebagai jeda visual

## 7. Hierarki Visual
- [x] Petakan urutan baca dari paling penting ke kurang penting sebelum desain detail
- [x] Kombinasikan ukuran + warna + posisi untuk membangun satu hierarki jelas
- [x] Beri hanya 1-2 elemen bobot visual "paling berat" per layar
- [x] Buat CTA utama minimal 20-30% lebih menonjol dari CTA sekunder
- [x] Naikkan kontras/ukuran informasi kritikal di atas elemen dekoratif
- [x] Uji hierarki tetap konsisten saat resize ke mobile
- [x] Buat lompatan ukuran font signifikan antar level heading
- [x] Selaraskan hierarki visual dengan prioritas bisnis yang disepakati
- [x] Turunkan bobot visual elemen sekunder agar tidak bersaing dengan primer
- [x] Pakai warna aksen hanya untuk elemen yang ingin ditonjolkan
- [x] Jalankan "5 second test" untuk validasi elemen paling menonjol
- [x] Tegaskan satu elemen fokus utama per section, sisanya pendukung
- [x] Sesuaikan hierarki berbeda untuk halaman konversi vs halaman informasi
- [x] Beri bobot visual berbeda antara ikon utama dan ikon pendukung
- [x] Pertahankan hierarki sama saat konten berubah dinamis (CMS, dsb)
- [x] Beri visual weight rendah namun tetap terbaca untuk info sekunder
- [x] Kelompokkan elemen berdasarkan hubungan logis lewat kedekatan/warna
- [x] Jalankan blur-test pada mockup untuk validasi elemen dominan

## 8. Kontras & Keterbacaan
- [x] Jadikan rasio kontras AA (4.5:1) sebagai syarat minimum rilis
- [x] Tambahkan overlay gradasi gelap di bawah teks pada foto
- [x] Sesuaikan ukuran teks dengan jarak baca konteks pemakaian
- [x] Gunakan abu-abu gelap (bukan hitam murni) untuk body text panjang
- [x] Beri warna dan underline berbeda untuk link dari teks biasa
- [x] Naikkan opacity placeholder ke level yang tetap terbaca (~60%)
- [x] Pastikan disabled state tetap punya kontras terbaca (bukan hilang total)
- [x] Uji kontras langsung di layar HP di bawah sinar matahari
- [x] Siapkan warna teks fallback aman untuk background gambar dinamis
- [x] Besarkan ukuran ikon fungsional minimal 16-24px
- [x] Beri border/divider kontras cukup tanpa mendominasi
- [x] Tempatkan info penting hanya di area kontras tinggi
- [x] Jalankan contrast checker otomatis di tiap kombinasi warna baru
- [x] Perbesar ukuran caption/label minimal 12-13px
- [x] Bedakan link dari teks lewat warna + underline, bukan warna saja
- [x] Uji ulang kontras spesifik untuk dark mode, jangan warisi dari light mode
- [x] Hindari kontras rendah pada elemen bermakna penting demi estetika
- [x] Perkuat kontras tombol teks terhadap warna latar tombol

## 9. Komponen UI (Umum)
- [x] Bangun komponen di design system sebelum dipakai berulang di halaman
- [x] Definisikan state lengkap tiap komponen: default/hover/active/disabled/focus
- [x] Ikuti pola interaksi platform yang sudah familiar pengguna
- [x] Skalakan ukuran komponen dari sistem token yang sama
- [x] Batasi varian komponen hanya untuk kebutuhan fungsional nyata
- [x] Tulis dokumentasi singkat pemakaian tiap komponen
- [x] Uji komponen dengan konten ekstrem (teks panjang, kosong, error)
- [x] Standarkan radius komponen dari token global
- [x] Standarkan level shadow/elevasi komponen dari token global
- [x] Bangun komponen modular yang menerima props/variasi konten
- [x] Buat komponen responsif otomatis terhadap lebar container
- [x] Uji kombinasi komponen bertumpuk (dropdown dalam modal, dst)
- [x] Tetapkan batas ukuran maksimum/minimum wajar per komponen
- [x] Buat komponen custom hanya setelah komponen standar terbukti tidak cukup
- [x] Uji tiap komponen dengan keyboard dan screen reader
- [x] Beri transisi halus antar state komponen (150-250ms)
- [x] Sesuaikan komponen dari UI kit populer dengan detail unik brand
- [x] Dokumentasikan dependency antar komponen untuk maintenance

## 10. Tombol & CTA
- [x] Tetapkan satu CTA primer paling menonjol per layar
- [x] Tulis label tombol yang actionable dan spesifik ("Mulai Uji Coba", bukan "Klik")
- [x] Set ukuran tombol minimal tinggi 44px untuk kenyamanan sentuh
- [x] Bedakan gaya visual tombol primer vs sekunder vs tersier
- [x] Sertakan penjelasan singkat kenapa tombol disabled (tooltip/helper text)
- [x] Batasi jumlah tombol per area agar tidak membingungkan
- [x] Kunci warna CTA dari token warna brand
- [x] Tampilkan spinner/loading state saat tombol memproses aksi
- [x] Beri warna berbeda (merah/oranye) untuk tombol aksi destruktif
- [x] Ikuti konvensi platform untuk urutan tombol (Cancel-Confirm)
- [x] Sederhanakan gaya tombol, hindari shadow/gradient berlebihan
- [x] Skalakan ukuran tombol sesuai tingkat kepentingan aksi
- [x] Tambahkan aria-label untuk tombol icon-only
- [x] Rancang hover/active state yang terasa responsif dan halus
- [x] Kunci ukuran tombol agar tidak bergeser antar state
- [x] Tulis CTA yang menyebut hasil konkret, bukan kata generik
- [x] Beri jarak minimal 8-16px antar tombol berdekatan
- [x] Tempatkan CTA penting tetap terlihat tanpa scroll berlebihan

## 11. Form & Input
- [x] Tampilkan label permanen di atas/samping field, bukan hanya placeholder
- [x] Tandai field wajib dengan simbol/warna yang jelas dan konsisten
- [x] Tulis pesan error yang spesifik dan actionable
- [x] Validasi input secara real-time saat pengguna mengetik/keluar field
- [x] Urutkan field mengikuti alur mental pengguna (nama-kontak-alamat, dst)
- [x] Set tinggi input minimal 44px agar mudah disentuh
- [x] Aktifkan autocomplete/autofill untuk field standar (nama, email, dst)
- [x] Pecah form panjang jadi beberapa step dengan progress jelas
- [x] Sertakan label eksplisit meski placeholder juga ada
- [x] Set attribute keyboard type sesuai konten (numeric, email, dst)
- [x] Beri gaya visual jelas beda antara field disabled dan aktif
- [x] Letakkan pesan sukses/error tepat di dekat field terkait
- [x] Pangkas field yang tidak esensial dari form
- [x] Nonaktifkan tombol submit dengan indikasi jelas syarat yang belum terpenuhi
- [x] Gunakan dropdown hanya saat opsi lebih dari ~5 pilihan
- [x] Susun tab order form mengikuti urutan visual logis
- [x] Tampilkan progress bar/step indicator untuk form multi-step
- [x] Pertahankan data terisi saat terjadi error validasi

## 12. Navigasi
- [x] Susun arsitektur informasi dari riset/card sorting, bukan asumsi
- [x] Batasi menu utama ke 5-7 item paling penting
- [x] Tandai halaman aktif dengan visual state yang jelas
- [x] Kunci posisi navigasi konsisten di semua halaman
- [x] Sertakan breadcrumb untuk struktur konten berlapis
- [x] Tulis label navigasi dengan kata yang familiar bagi pengguna
- [x] Desain hamburger menu dengan ikon dan label yang jelas
- [x] Sediakan fitur search jika koleksi konten/produk besar
- [x] Naikkan fitur penting ke level navigasi utama, bukan tersembunyi
- [x] Sederhanakan mega menu agar tidak overload informasi
- [x] Jadikan logo selalu linkable ke halaman utama
- [x] Beri feedback visual jelas saat hover/klik item navigasi
- [x] Urutkan menu berdasarkan riset kebutuhan pengguna
- [x] Bedakan gaya visual navigasi primer dan sekunder
- [x] Batasi tinggi sticky navigation agar tidak memakan ruang berlebih
- [x] Sediakan keyboard shortcut untuk aksi yang sering dipakai power user
- [x] Kurasi link footer agar tetap relevan dan berguna
- [x] Uji navigasi dengan pengguna yang belum pernah pakai produk

## 13. Kartu (Cards) & Blok Konten
- [x] Kunci ukuran card seragam dalam satu grid
- [x] Susun urutan info dalam card: visual-judul-deskripsi-aksi
- [x] Batasi jumlah info per card agar mudah dipindai
- [x] Perjelas seluruh area klik card lewat hover state
- [x] Tambahkan efek hover halus yang menandakan card bisa diklik
- [x] Kunci rasio gambar card (misal 4:3 atau 16:9) di seluruh grid
- [x] Siapkan fallback visual bermerek untuk card tanpa gambar
- [x] Standarkan shadow/border card dari token desain
- [x] Terapkan text-truncate + ellipsis untuk judul/deskripsi panjang
- [x] Kunci satu gaya card konsisten per grid/list
- [x] Uji card dengan panjang teks nyata dari data produksi
- [x] Kurangi jumlah kolom card secara responsif di layar kecil
- [x] Batasi ikon aksi dalam card maksimal 2-3 agar tidak ramai
- [x] Kunci gutter grid card dari token spacing
- [x] Beri indikator visual jelas (kursor, hover) untuk card interaktif
- [x] Urutkan card dengan logika jelas (terbaru/populer/relevan)
- [x] Tampilkan skeleton card saat data sedang dimuat
- [x] Bedakan card unggulan secara visual namun tetap proporsional

## 14. Ikon
- [x] Kunci satu gaya ikon (outline atau filled) di seluruh produk
- [x] Standarkan ukuran ikon dari grid ikon (misal 16/20/24px)
- [x] Sertakan label teks untuk ikon dengan makna ambigu
- [x] Buat ikon custom dengan stroke width konsisten
- [x] Gunakan ikon hanya saat mendukung fungsi/makna, bukan hiasan
- [x] Besarkan area klik ikon interaktif minimal 32-44px
- [x] Tambahkan tooltip/aria-label pada ikon fungsional
- [x] Ambil seluruh set ikon dari satu library/sistem yang sama
- [x] Kunci warna ikon dari token warna sistem
- [x] Sederhanakan detail ikon agar tetap jelas di ukuran kecil
- [x] Bedakan bentuk ikon status (bukan hanya warna) untuk aksesibilitas
- [x] Sejajarkan ikon dengan teks lewat optical alignment
- [x] Pilih ikon berdasarkan relevansi makna, bukan sekadar tampilan menarik
- [x] Konsistenkan sudut membulat/tajam di seluruh set ikon
- [x] Kurasi/kustomisasi ikon brand agar unik, bukan hasil generate mentah
- [x] Uji kontras ikon tetap jelas di dark mode
- [x] Buat animasi ikon halus dan tidak mengalihkan fokus berlebihan
- [x] Uji keterbacaan ikon di ukuran terkecil sebelum dipakai

## 15. Fotografi & Ilustrasi
- [x] Kurasi gambar yang relevan dengan konteks nyata produk/brand
- [x] Kunci gaya ilustrasi (warna, bentuk, proporsi) dalam satu panduan
- [x] Sediakan aset gambar resolusi tinggi (2x/3x) untuk layar retina
- [x] Kunci rasio aspek gambar seragam dalam satu grid
- [x] Kompres dan optimasi ukuran file gambar sebelum dipakai
- [x] Pilih foto yang terasa autentik, hindari pose stok klise berlebihan
- [x] Investasikan ilustrasi custom untuk memperkuat identitas brand
- [x] Tulis alt text deskriptif untuk semua gambar bermakna
- [x] Crop gambar dengan menjaga subjek utama tetap utuh
- [x] Hindari menaruh teks penting di dalam file gambar
- [x] Kurasi ilustrasi agar proporsional dan konsisten gayanya (hindari kesan acak/AI-generated)
- [x] Selaraskan gaya visual foto/ilustrasi dengan tone brand
- [x] Ganti semua placeholder dengan gambar asli sebelum rilis
- [x] Beri overlay/gradasi agar teks di atas gambar tetap terbaca
- [x] Hindari watermark stok foto pada aset final
- [x] Kurasi representasi visual yang mencerminkan keberagaman audiens
- [x] Konversi gambar ke format modern (WebP/AVIF) untuk efisiensi
- [x] Terapkan lazy loading untuk gambar di luar viewport awal

## 16. Animasi & Motion
- [x] Gunakan animasi hanya untuk feedback atau transisi konteks yang jelas
- [x] Kunci durasi animasi UI dasar di rentang 150-400ms
- [x] Pilih easing curve natural (ease-out/ease-in-out), hindari linear
- [x] Percepat/pangkas animasi yang menghambat penyelesaian tugas
- [x] Sediakan pengaturan "reduce motion" untuk aksesibilitas
- [x] Bedakan gaya animasi loading dari animasi transisi navigasi
- [x] Standarkan gaya dan timing animasi lewat token motion
- [x] Gunakan transisi fade/slide halus untuk elemen muncul-hilang
- [x] Batasi efek parallax agar tidak mengganggu keterbacaan
- [x] Kurangi intensitas animasi hover agar tetap halus, tidak berlebihan
- [x] Percepat page transition agar tidak menghambat perceived speed
- [x] Pertimbangkan motion sebagai fungsi, bukan sekadar gimmick "canggih"
- [x] Sesuaikan kecepatan loop animasi loading agar nyaman dilihat
- [x] Rancang micro-animasi yang memberi feedback jelas atas aksi
- [x] Sesuaikan gaya animasi dengan konvensi native platform (iOS/Android)
- [x] Uji timing animasi langsung di perangkat nyata
- [x] Optimasi file animasi kompleks (Lottie) agar ringan
- [x] Gunakan staggered animation secukupnya untuk memandu perhatian

## 17. Micro-interaction
- [x] Beri feedback visual instan untuk setiap aksi pengguna
- [x] Rancang transisi jelas untuk toggle/switch antar state
- [x] Tambahkan indikator visual jelas untuk drag & drop
- [x] Rancang hover state yang menandakan elemen bisa diklik
- [x] Beri micro-feedback ringkas namun memuaskan untuk aksi like/save
- [x] Sederhanakan interaksi agar aksi umum cukup 1-2 klik
- [x] Rancang gesture mobile (swipe, pull-to-refresh) yang responsif
- [x] Jaga micro-interaction tetap ringkas, tidak mengalihkan fokus tugas utama
- [x] Beri feedback instan untuk aksi copy-to-clipboard/quick action
- [x] Tampilkan validasi kecil langsung saat input salah format
- [x] Ubah cursor sesuai konteks interaksi di desktop
- [x] Jaga sound/haptic feedback tetap proporsional dan bisa dimatikan
- [x] Sediakan opsi undo untuk aksi yang rawan salah
- [x] Gunakan skeleton/shimmer saat memuat data, bukan spinner terus-menerus
- [x] Rancang interaksi non-hover yang setara untuk perangkat sentuh
- [x] Bedakan feedback sukses dan error secara visual dan verbal
- [x] Buat transisi antar state micro-interaction mulus, tidak patah
- [x] Uji detail micro-interaction langsung dengan pengguna nyata

## 18. Aksesibilitas (a11y)
- [x] Pastikan semua elemen interaktif bisa dinavigasi lewat keyboard
- [x] Tampilkan focus indicator yang jelas dan kontras saat navigasi keyboard
- [x] Penuhi standar kontras WCAG AA sebagai baseline
- [x] Tulis alt text deskriptif untuk semua gambar bermakna
- [x] Susun struktur heading logis tanpa loncat level
- [x] Hubungkan label form ke field secara programatik (for/id atau aria)
- [x] Sertakan penanda non-warna (ikon/teks) untuk info penting
- [x] Pastikan layout tetap utuh saat teks di-zoom hingga 200%
- [x] Gunakan ARIA role sesuai konteks yang benar, secukupnya
- [x] Sediakan caption/transkrip untuk konten video/audio
- [x] Hindari animasi flashing yang berisiko photosensitive seizure
- [x] Uji alur utama produk langsung dengan screen reader
- [x] Perbesar target sentuh untuk pengguna dengan keterbatasan motorik
- [x] Deklarasikan atribut bahasa (lang) pada dokumen/halaman
- [x] Sediakan skip-to-content link untuk halaman dengan navigasi panjang
- [x] Sampaikan error form secara tekstual, bukan hanya warna
- [x] Uji tampilan di mode high-contrast/grayscale untuk validasi non-warna
- [x] Kelola focus trap dengan benar pada modal/dialog

## 19. Responsif & Adaptif
- [x] Uji layout di breakpoint utama: mobile, tablet, desktop, large screen
- [x] Prioritaskan ulang konten (bukan hanya ditumpuk) di layar kecil
- [x] Skalakan font dan spacing secara proporsional antar breakpoint
- [x] Pakai gambar responsif (srcset/object-fit) agar tidak terdistorsi
- [x] Sesuaikan bentuk navigasi secara wajar untuk mobile
- [x] Gunakan horizontal scroll hanya secara sengaja dan terbatas
- [x] Pertimbangkan orientasi portrait/landscape untuk konten mobile
- [x] Perbesar otomatis touch target di perangkat sentuh
- [x] Cek dan perbaiki semua potensi overflow di layar kecil
- [x] Uji desain langsung di perangkat fisik, bukan hanya simulator
- [x] Sederhanakan/sembunyikan konten kurang relevan di mobile
- [x] Sesuaikan ulang layout desktop, jangan sekadar melebarkan versi mobile
- [x] Gunakan container fluid untuk layar sangat lebar
- [x] Rancang modal fullscreen di mobile bila diperlukan
- [x] Uji kenyamanan baca font-size/line-height di semua ukuran
- [x] Pastikan elemen fixed/sticky tidak menutup konten penting di layar kecil
- [x] Kurangi jumlah kolom grid secara logis sesuai lebar layar
- [x] Optimasi loading khusus untuk koneksi mobile lambat

## 20. Mobile-specific
- [x] Set ukuran tombol minimal 44x44pt sesuai guideline platform
- [x] Tempatkan aksi utama di thumb zone yang mudah dijangkau
- [x] Gunakan bottom navigation untuk fitur yang sering diakses
- [x] Dukung gesture umum (swipe back, pull to refresh) secara konsisten
- [x] Geser viewport otomatis agar keyboard tidak menutupi field aktif
- [x] Hormati safe area (notch, home indicator) dalam layout
- [x] Set font minimal 16px pada input untuk mencegah auto-zoom iOS
- [x] Tempatkan konten kritikal jauh dari ujung ekstrem layar
- [x] Tangani rotasi layar dengan baik jika didukung
- [x] Rancang notifikasi push yang relevan dan tidak berlebihan
- [x] Optimasi ukuran aset agar ringan di perangkat low-end
- [x] Sediakan fallback UI jelas untuk mode offline/koneksi lambat
- [x] Selaraskan ikon aplikasi dan splash screen dengan identitas brand
- [x] Rancang interaksi nyaman untuk penggunaan satu tangan
- [x] Gunakan haptic feedback secukupnya untuk aksi penting
- [x] Ikuti konvensi platform (back button dst) sesuai iOS/Android
- [x] Dukung dynamic type/pengaturan ukuran teks sistem
- [x] Optimasi scroll agar tetap 60fps di perangkat menengah

## 21. Konten & Copywriting
- [x] Tulis copy singkat, jelas, dan langsung ke poin
- [x] Kunci tone of voice konsisten lewat panduan brand voice
- [x] Jelaskan istilah teknis atau ganti dengan bahasa awam
- [x] Tulis label tombol yang actionable dan spesifik
- [x] Proofread seluruh konten sebelum rilis final
- [x] Ganti jargon pemasaran dengan klaim konkret berbukti
- [x] Tulis pesan error dengan nada empatik dan solutif
- [x] Prioritaskan konten berdasarkan riset kebutuhan pengguna
- [x] Tulis heading yang informatif sekaligus menarik
- [x] Standarkan istilah yang sama untuk konsep yang sama di seluruh produk
- [x] Pecah kalimat panjang agar mudah dipindai
- [x] Jelaskan hasil konkret di tiap CTA
- [x] Sesuaikan konten legal/privasi dengan bahasa yang jelas dan manusiawi
- [x] Sesuaikan nada bahasa dengan konteks dan segmen audiens
- [x] Tulis microcopy (tooltip, helper text) yang ringkas dan membantu
- [x] Edit ulang konten hasil draf otomatis dengan sentuhan editorial manusia
- [x] Verifikasi akurasi semua angka dan data dalam copy
- [x] Baca ulang copy dengan suara lantang untuk cek ritme kalimat

## 22. Empty State, Error, Loading State
- [x] Rancang ilustrasi dan pesan khusus untuk tiap empty state
- [x] Sertakan CTA jelas di setiap empty state
- [x] Jelaskan penyebab error dan langkah perbaikannya
- [x] Bangun skeleton loading yang menyerupai bentuk konten asli
- [x] Tampilkan progress indikator untuk proses loading yang lama
- [x] Rancang halaman 404/500 khusus sesuai identitas brand
- [x] Tulis pesan error dengan bahasa yang jelas, tidak menyalahkan pengguna
- [x] Bedakan empty state pertama kali dari empty state hasil filter/pencarian
- [x] Sarankan alternatif/koreksi saat hasil pencarian kosong
- [x] Sediakan tombol retry yang jelas saat koneksi/timeout gagal
- [x] Lewati spinner untuk loading super singkat (<300ms)
- [x] Tampilkan konfirmasi sebelum aksi destruktif yang berisiko kehilangan data
- [x] Buat transisi halus antar state (loading-sukses-error)
- [x] Rancang seluruh kemungkinan state, bukan hanya happy path
- [x] Standarkan gaya visual loading state di seluruh produk
- [x] Sertakan jalur bantuan di error state kritikal
- [x] Jelaskan alasan jelas pada empty state akibat permission/akses
- [x] Sederhanakan pesan state agar tidak menambah kebingungan saat error

## 23. Notifikasi & Feedback
- [x] Standarkan posisi dan durasi tampil notifikasi sukses/error
- [x] Posisikan toast/snackbar agar tidak menghalangi elemen penting
- [x] Perpanjang durasi tampil untuk notifikasi kritikal
- [x] Bedakan warna dan ikon untuk info/sukses/warning/error
- [x] Batasi frekuensi notifikasi agar tidak mengganggu (hindari fatigue)
- [x] Personalisasi notifikasi push sesuai konteks pengguna
- [x] Sinkronkan badge notifikasi dengan jumlah item belum dibaca yang akurat
- [x] Sediakan tombol dismiss yang mudah dijangkau
- [x] Berikan feedback sistem untuk setiap aksi penting
- [x] Hindari duplikasi notifikasi in-app dan push untuk kejadian sama
- [x] Tulis pesan konfirmasi aksi destruktif secara jelas dan tegas
- [x] Sediakan opsi mematikan sound notifikasi
- [x] Sembunyikan info sensitif dari notifikasi di lock screen
- [x] Sediakan riwayat notifikasi yang bisa direview ulang
- [x] Beri pengguna kontrol atas frekuensi notifikasi (preferences)
- [x] Terjemahkan error backend ke bahasa yang dipahami pengguna awam
- [x] Tampilkan progress jelas untuk proses panjang (upload, dst)
- [x] Tampilkan konfirmasi visual singkat setelah aksi berhasil

## 24. Data Visualisasi / Chart
- [x] Pilih jenis chart sesuai jenis data (bar/line/pie sesuai konteks)
- [x] Mulai skala sumbu dari nol kecuali ada alasan kuat dan dijelaskan
- [x] Sertakan legenda yang konsisten dengan warna data
- [x] Beri label sumbu dan satuan yang jelas
- [x] Highlight data terpenting, redupkan data pendukung
- [x] Tampilkan tooltip detail saat hover pada titik data
- [x] Uji chart tetap terbaca dalam grayscale
- [x] Batasi jumlah kategori per chart agar tetap terbaca
- [x] Rancang state kosong yang jelas untuk chart tanpa data
- [x] Redupkan gridline agar hanya jadi bantuan visual, bukan dominan
- [x] Buat chart responsif menyesuaikan ukuran layar
- [x] Tambahkan anotasi untuk menjelaskan anomali data penting
- [x] Hindari chart 3D kecuali benar-benar diperlukan
- [x] Urutkan data secara logis (kronologis/besar-kecil)
- [x] Rancang interaksi filter/zoom yang intuitif
- [x] Pilih palet warna chart yang ramah buta warna
- [x] Cantumkan sumber data untuk kredibilitas
- [x] Batasi jumlah chart per dashboard agar tidak overload

## 25. Dark Mode & Theming
- [x] Rancang palet dark mode dari nol, bukan hasil invert otomatis
- [x] Gunakan abu-abu gelap (bukan hitam pekat) sebagai background utama
- [x] Pertahankan identitas warna brand tetap dikenali di kedua mode
- [x] Ganti shadow dengan elevation/border di dark mode
- [x] Sediakan varian gambar/ilustrasi untuk dark mode
- [x] Hindari pure black (#000) untuk area background luas
- [x] Uji ikon dan grafik tetap kontras di kedua tema
- [x] Simpan dan hormati preferensi tema pengguna (sistem/manual)
- [x] Buat transisi antar tema halus tanpa flicker
- [x] Uji ulang semua state komponen di dark mode
- [x] Uji elemen custom/ilustratif agar tidak pecah di kedua tema
- [x] Pertahankan kejelasan warna semantik (error/sukses) di dark mode
- [x] Uji ulang kontras warna secara manual, bukan hanya asumsi otomatis
- [x] Jaga keterbacaan minimal pada tema custom yang didukung
- [x] Tempatkan toggle tema di lokasi yang mudah ditemukan
- [x] Uji dark mode di layar OLED dan LCD
- [x] Uji ulang kontras elemen dengan opacity/transparency
- [x] Bangun token warna yang mendukung kedua tema tanpa duplikasi kode

## 26. Branding & Identitas Visual
- [x] Ikuti brand guideline untuk ukuran, clear space, dan warna logo
- [x] Terapkan warna, font, dan gaya visual konsisten di semua materi
- [x] Selaraskan elemen visual dengan nilai dan kepribadian brand
- [x] Jaga proporsi logo, jangan pernah diregangkan/diputar sembarangan
- [x] Siapkan varian logo (monokrom, ikon saja) untuk berbagai konteks
- [x] Sesuaikan tone visual dengan positioning brand
- [x] Jaga konsistensi brand lintas platform (web, app, media sosial)
- [x] Kembangkan elemen visual khas (pattern/ikon) sebagai diferensiasi
- [x] Dokumentasikan brand guideline dan sebarkan ke seluruh tim
- [x] Bangun diferensiasi visual yang jelas dari kompetitor
- [x] Jaga konsistensi warna brand di produk fisik dan digital
- [x] Daftarkan lisensi font brand untuk semua platform yang dipakai
- [x] Selaraskan brand voice dalam visual dan copy
- [x] Simpan aset brand dalam format vektor untuk skalabilitas
- [x] Jaga sub-brand tetap terasa satu keluarga visual dengan induknya
- [x] Pertimbangkan ekuitas brand lama saat melakukan rebranding
- [x] Uji elemen visual brand di berbagai ukuran (favicon-billboard)
- [x] Kembangkan signature detail unik yang membedakan brand

## 27. Konsistensi & Design System
- [x] Dokumentasikan token desain (warna, spacing, tipografi) secara terpusat
- [x] Sinkronkan komponen design system dengan kode implementasi aktual
- [x] Komunikasikan setiap perubahan design system ke seluruh tim
- [x] Audit dan hilangkan duplikasi komponen dengan fungsi sama
- [x] Standarkan naming convention komponen dan token
- [x] Sertakan panduan do's and don'ts di dokumentasi design system
- [x] Kelola versi design system agar perubahan tidak breaking tanpa notifikasi
- [x] Jaga konsistensi antara desain di tool desain dan hasil akhir produk
- [x] Sertakan pattern umum (form, list, empty state) di pattern library
- [x] Jadwalkan audit desain berkala untuk temukan inkonsistensi
- [x] Bangun dukungan theming/multi-brand jika dibutuhkan
- [x] Terapkan proses review untuk setiap kontribusi ke design system
- [x] Bangun aksesibilitas sejak level komponen design system
- [x] Sertakan contoh penggunaan nyata, bukan hanya komponen terisolasi
- [x] Bersihkan komponen legacy yang sudah tidak terpakai secara berkala
- [x] Definisikan skala responsif komponen dalam sistem
- [x] Uji dampak perubahan visual besar sebelum rilis ke seluruh produk
- [x] Satukan sumber kebenaran (source of truth) desain dan developer

## 28. Onboarding & First-run Experience
- [x] Jelaskan value produk secara singkat di awal onboarding
- [x] Sediakan opsi skip onboarding bagi pengguna yang ingin eksplorasi
- [x] Minimalkan langkah dan input yang diminta di awal
- [x] Tampilkan progress jelas untuk onboarding multi-langkah
- [x] Gunakan tooltip kontekstual untuk fitur kompleks
- [x] Sesuaikan onboarding untuk pengguna baru vs pengguna kembali
- [x] Sampaikan ekspektasi jelas tentang apa yang bisa dilakukan produk
- [x] Beri akses cepat ke fitur inti tanpa terhalang onboarding panjang
- [x] Rancang momen "quick win" di awal pengalaman
- [x] Minta izin (notifikasi/lokasi) dengan konteks yang jelas
- [x] Arahkan empty state pertama kali untuk mendorong aksi awal
- [x] Uji onboarding langsung dengan pengguna baru sungguhan
- [x] Tulis bahasa onboarding yang ramah dan tidak teknis berlebihan
- [x] Sediakan akses ulang onboarding dari menu pengaturan
- [x] Bangun checklist onboarding untuk rasa progres dan pencapaian
- [x] Hilangkan pengulangan informasi yang sudah jelas dari konteks
- [x] Sesuaikan durasi onboarding dengan realita waktu pengguna
- [x] Sesuaikan alur onboarding dengan perilaku device (mobile/desktop)

## 29. Performa & Perceived Performance
- [x] Targetkan waktu muat halaman di bawah 2-3 detik
- [x] Gunakan skeleton screen untuk mempercepat persepsi loading
- [x] Kompres aset gambar tanpa mengorbankan kualitas signifikan
- [x] Optimasi pemuatan font (font-display: swap, subsetting)
- [x] Uji animasi tetap lancar di perangkat low-end
- [x] Prioritaskan pemuatan konten above the fold
- [x] Terapkan lazy loading untuk konten di luar viewport awal
- [x] Optimasi ukuran bundle kode agar loading lebih cepat
- [x] Terapkan optimistic UI untuk transisi yang terasa instan
- [x] Manfaatkan cache untuk konten yang jarang berubah
- [x] Jaga interaksi utama tetap responsif saat data dimuat di background
- [x] Atur prioritas resource (CSS/JS kritikal dulu)
- [x] Uji perceived performance di kondisi jaringan lambat (throttled)
- [x] Tunda pemuatan elemen non-kritikal tanpa mengganggu interaksi awal
- [x] Beri feedback instan meski proses backend masih berjalan
- [x] Sediakan video dalam format dan ukuran yang dioptimasi
- [x] Pantau metrik performa secara berkala pasca-rilis
- [x] Timbang sadar trade-off antara visual kaya dan kecepatan

## 30. Shadow, Depth & Elevasi
- [x] Bangun sistem elevasi berjenjang (level 1-5) dari token
- [x] Gunakan shadow untuk menandai hierarki/interaktivitas, bukan hiasan
- [x] Kunci arah sumber cahaya shadow konsisten di seluruh produk
- [x] Ringankan intensitas shadow agar tidak terlihat berat/kotor
- [x] Beri shadow jelas pada elemen elevated (modal, dropdown, popover)
- [x] Kurangi intensitas shadow di dark mode
- [x] Sesuaikan blur radius shadow dengan ukuran elemen
- [x] Batasi pemakaian shadow hanya untuk elemen yang butuh penekanan
- [x] Terapkan elevasi konsisten untuk urutan layer (z-index terstruktur)
- [x] Beri konteks jelas agar elemen berbayang tidak terlihat mengambang
- [x] Gunakan neumorphism secara sangat selektif dan uji aksesibilitasnya
- [x] Gunakan text-shadow secukupnya, hanya untuk keterbacaan
- [x] Samakan level elevasi antar komponen sejenis
- [x] Ganti shadow dengan border saat performa jadi prioritas
- [x] Batasi efek depth agar tidak mengganggu fokus konten utama
- [x] Uji shadow di berbagai kondisi background sebelum final
- [x] Dokumentasikan sistem elevasi lewat token, bukan nilai custom
- [x] Perbaiki masalah kontras di akarnya, jangan andalkan shadow untuk menutupinya

## 31. Border, Radius & Bentuk
- [x] Tetapkan skala radius konsisten (4/8/12/16px)
- [x] Pilih karakter sudut (tajam/membulat) yang mencerminkan brand
- [x] Ringankan ketebalan border agar tidak terasa berat
- [x] Pilih warna border dengan kontras cukup tanpa mendominasi
- [x] Gunakan border hanya saat perlu memisahkan konten secara fungsional
- [x] Samakan radius antar komponen sejenis (card, button, input)
- [x] Konsistenkan bentuk organik/custom sebagai bagian gaya visual
- [x] Jaga konsistensi sudut tajam/membulat dalam satu grup elemen
- [x] Gunakan border untuk memisahkan konten secara logis
- [x] Sesuaikan besar radius elemen besar dengan ukurannya secara proporsional
- [x] Terapkan border style (solid/dashed) sesuai maknanya secara konsisten
- [x] Uji elemen radius berbeda tidak bertabrakan visual saat bersebelahan
- [x] Selaraskan shape language antara ikon, ilustrasi, dan komponen
- [x] Gunakan border sebagai pemisah, bukan pengganti spacing yang seharusnya
- [x] Kurangi sedikit radius di mobile bila diperlukan untuk kepadatan layar
- [x] Uji bentuk custom tetap jelas fungsinya, tidak sekadar estetika
- [x] Perjelas border input form sebagai penanda area yang bisa diisi
- [x] Pertahankan konsistensi radius di dark dan light mode

## 32. Gradient & Tekstur
- [x] Gunakan gradient dengan tujuan jelas (kedalaman/penekanan)
- [x] Racik warna gradient tetap dalam palet brand
- [x] Batasi gradient hanya pada 1-2 elemen kunci per halaman
- [x] Jaga kontras teks tetap terjaga di atas gradient
- [x] Buat tekstur (noise/grain) halus dan tidak mengganggu keterbacaan
- [x] Kustomisasi gradient agar unik, hindari kesan "template SaaS generik"
- [x] Halusakan transisi warna gradient agar tidak banding
- [x] Jadikan tekstur elemen brand yang konsisten dipakai, bukan sekali pakai
- [x] Uji gradient tetap terlihat baik di berbagai ukuran layar
- [x] Pertimbangkan kontras dan performa saat memakai glassmorphism
- [x] Jaga keterbacaan konten di atas tekstur background
- [x] Batasi gradient sebagai aksen, bukan mendominasi seluruh halaman
- [x] Seimbangkan kombinasi gradient dan shadow agar tidak berlebihan
- [x] Optimasi ukuran file tekstur agar ringan
- [x] Konsistenkan arah dan sudut gradient antar elemen sejenis
- [x] Gunakan efek berat (blur/glow) secara hemat dan bertujuan
- [x] Uji persepsi gradient tetap sesuai di dark mode
- [x] Perkuat konsep desain dasar tanpa bergantung pada tekstur/gradient

## 33. Anti "AI Slop" — Pilihan Visual Otentik
- [x] Pilih palet warna khas brand, bukan gradient ungu-biru generik
- [x] Gunakan font dengan kustomisasi/karakter, bukan default polos tanpa olahan
- [x] Rancang ilustrasi yang relevan dengan cerita brand, bukan blob abstrak acak
- [x] Bangun struktur hero section yang punya sudut pandang berbeda dari kompetitor
- [x] Gunakan ikon/ilustrasi proper, batasi pemakaian emoji sebagai pengganti
- [x] Tulis copy spesifik dan berbukti, hindari buzzword kosong
- [x] Pakai glassmorphism hanya saat mendukung fungsi, bukan sekadar tren
- [x] Sesuaikan susunan testimoni-fitur-pricing dengan kebutuhan brand sendiri
- [x] Gunakan foto yang menunjukkan konteks nyata, bukan stok senyum klise
- [x] Beri makna/fungsi pada pattern dekoratif, bukan sekadar pengisi ruang
- [x] Batasi shadow pada elemen yang benar-benar butuh penekanan hierarki
- [x] Rancang bentuk custom yang punya makna terhadap identitas brand
- [x] Isi header besar dengan konten substantif, bukan hanya visual kosong
- [x] Diferensiasikan visual checklist/fitur antar item, bukan seragam generik
- [x] Bangun hierarki tipografi yang jelas, hindari "bold besar" tanpa struktur
- [x] Kurasi setiap elemen desain secara manual, bukan asal comot template
- [x] Gunakan gradient mesh hanya saat relevan dengan konsep visual
- [x] Ambil sikap visual yang berani sesuai kepribadian brand

## 34. Anti "AI Slop" — Struktur yang Disengaja
- [x] Variasikan struktur tiap section agar tidak identik "3 kolom + ikon" semua
- [x] Bangun ritme visual dengan variasi pola antar section
- [x] Sesuaikan padding/margin dengan kebutuhan konten spesifik tiap area
- [x] Pecahkan simetri sesekali untuk menghindari kesan monoton
- [x] Variasikan konteks dan penempatan CTA antar section
- [x] Sesuaikan alur "problem-solution-benefit" dengan nuansa cerita brand
- [x] Ragamkan format section testimoni, tidak selalu 3 kartu identik
- [x] Kustomisasi struktur footer sesuai kebutuhan informasi produk
- [x] Sesuaikan visual accordion FAQ dengan identitas brand
- [x] Sertakan sumber/konteks jelas untuk setiap statistik yang ditampilkan
- [x] Rancang pricing table sesuai strategi bisnis, bukan template 3 kolom baku
- [x] Kurasi logo klien yang benar-benar relevan ditampilkan
- [x] Variasikan gaya transisi antar section, tidak selalu fade-in dari bawah
- [x] Sesuaikan struktur konten dengan kebutuhan unik tiap halaman
- [x] Isi ruang kosong dengan konten bermakna atau biarkan sebagai jeda sengaja
- [x] Kembangkan struktur sendiri, gunakan kompetitor hanya sebagai referensi awal
- [x] Rancang tiap section dengan tujuan jelas, bukan sekadar melengkapi checklist
- [x] Validasi tiap keputusan layout dengan kebutuhan nyata, bukan kebiasaan umum

## 35. Anti "AI Slop" — Copy yang Spesifik & Jujur
- [x] Ganti headline generik dengan klaim konkret dan terukur
- [x] Batasi pemakaian kata "seamless/empower/unlock" kecuali benar-benar relevan
- [x] Tulis headline yang hanya cocok untuk produk ini, bukan produk manapun
- [x] Tulis testimoni yang terdengar natural dan spesifik, bukan sempurna berlebihan
- [x] Sertakan sumber/konteks untuk setiap klaim statistik
- [x] Tulis CTA yang menjelaskan hasil konkret, bukan generik "Get Started"
- [x] Jelaskan manfaat nyata di tiap deskripsi fitur, bukan hanya nama fitur
- [x] Sesuaikan bahasa dengan nada natural audiens, bukan kaku formal berlebihan
- [x] Edit ulang seluruh konten hasil draf dengan proofread manusia
- [x] Ganti superlatif kosong dengan bukti/data pendukung
- [x] Variasikan struktur kalimat antar paragraf agar tidak monoton
- [x] Tulis micro-copy dengan suara khas brand, bukan template umum
- [x] Ringkas deskripsi produk ke poin utama yang jelas
- [x] Susun FAQ dari pertanyaan nyata pengguna, bukan template generik
- [x] Kembangkan tagline yang unik dan sulit ditiru brand lain
- [x] Sertakan bukti yang bisa diverifikasi untuk setiap klaim besar
- [x] Jaga konsistensi nada bicara di seluruh halaman produk
- [x] Hilangkan konten filler yang tidak menambah nilai informasi

## 36. Review, Testing & Validasi Desain
- [x] Jadwalkan review desain oleh minimal satu rekan sebelum final
- [x] Lakukan usability testing dengan pengguna nyata sebelum rilis
- [x] Kumpulkan feedback secara terstruktur (survei/skala), bukan hanya opini
- [x] Uji desain di berbagai perangkat dan browser sebelum rilis
- [x] Jalankan A/B testing untuk keputusan desain berdampak besar
- [x] Gunakan 10 usability heuristics Nielsen sebagai acuan review
- [x] Uji skenario error dan edge case, bukan hanya happy path
- [x] Lakukan cold review dari orang yang belum tahu konteks proyek
- [x] Definisikan metrik keberhasilan desain sebelum implementasi
- [x] Jalankan audit aksesibilitas otomatis dan manual
- [x] Lakukan design QA untuk cek kesesuaian implementasi vs desain asli
- [x] Uji ulang desain setelah konten nyata dimasukkan
- [x] Dokumentasikan dan tindak lanjuti setiap feedback dari review
- [x] Validasi desain terhadap tujuan bisnis, bukan hanya estetika
- [x] Simpan versi desain (versioning) untuk perbandingan/rollback
- [x] Uji desain dalam kondisi nyata (data asli, koneksi lambat)
- [x] Terapkan proses sign-off jelas sebelum rilis
- [x] Terima kritik secara objektif dan tindak lanjuti tanpa defensif

## 37. Etika & Tanggung Jawab dalam Desain
- [x] Hindari dark pattern yang memaksa pengguna (subscription trap, dst)
- [x] Minta consent pengguna secara jujur dan jelas
- [x] Tampilkan opsi penting (unsubscribe, hapus akun) dengan mudah diakses
- [x] Jelaskan penggunaan data pribadi secara transparan dalam UI
- [x] Hindari mengeksploitasi bias psikologis pengguna secara tidak etis
- [x] Tangani konten sensitif dengan hati-hati, bukan demi engagement semata
- [x] Pertimbangkan dampak desain terhadap kelompok rentan
- [x] Rancang notifikasi tanpa memicu urgensi/kecanduan palsu
- [x] Rancang desain inklusif untuk beragam kemampuan pengguna
- [x] Pastikan klaim visual/copy akurat dan tidak menyesatkan
- [x] Sederhanakan alur pembatalan/cancel, jangan dipersulit sengaja
- [x] Terapkan privasi by design sejak awal proses
- [x] Pertimbangkan dampak lingkungan (ukuran data, energi) dalam desain digital
- [x] Sesuaikan desain dengan konteks budaya lokal agar tidak menyinggung
- [x] Komunikasikan transparansi algoritma personalisasi ke pengguna
- [x] Hindari elemen urgensi palsu (fake countdown, fake stock)
- [x] Bangun proses tim untuk mempertanyakan etika keputusan produk
- [x] Evaluasi dampak jangka panjang desain ke pengguna, bukan hanya konversi jangka pendek

---

**Kesimpulan:** File ini adalah versi "sudah diputuskan" dari `design.md` — 666 pilihan desain konkret dan positif yang secara langsung menolak pola generik/AI slop (gradient ungu-biru default, copy buzzword kosong, layout template SaaS seragam). Pakai sebagai default keputusan, bukan sekadar pertanyaan evaluasi.