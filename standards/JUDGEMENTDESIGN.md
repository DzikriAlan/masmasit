# Design Judgement Checklist (666 Listing)

Checklist umum untuk menilai kualitas desain dan menghindari hasil generik/"AI slop". Gunakan sebagai daftar periksa saat membuat atau me-review desain.

## 1. Prinsip Umum & Filosofi Desain
- [ ] Desain punya satu ide utama yang jelas, bukan tumpukan tren tanpa arah
- [ ] Setiap elemen punya alasan keberadaan, bukan sekadar "biar rame"
- [ ] Desain menyelesaikan masalah pengguna, bukan cuma terlihat estetik
- [ ] Ada sudut pandang/POV unik, bukan rata-rata dari referensi Pinterest
- [ ] Batasan (constraint) proyek dijadikan bahan kreatif, bukan dihindari
- [ ] Konteks bisnis dan audiens dipahami sebelum mendesain
- [ ] Desain tidak meniru mentah-mentah template populer tanpa adaptasi
- [ ] Ada keputusan sadar yang bisa dijelaskan, bukan tebakan acak
- [ ] Kesederhanaan dipilih karena disengaja, bukan karena kehabisan ide
- [ ] Detail kecil (micro-detail) tidak dikorbankan demi kecepatan
- [ ] Tidak semua tren baru langsung dipakai tanpa dipertimbangkan relevansinya
- [ ] Desain punya kepribadian yang konsisten dengan brand
- [ ] Fungsi dan bentuk berjalan seimbang, tidak berat sebelah
- [ ] Referensi dipakai untuk inspirasi, bukan untuk disalin persis
- [ ] Desain diuji dengan pertanyaan "kenapa harus begini" di tiap keputusan
- [ ] Ada keberanian membuang elemen yang tidak perlu
- [ ] Orisinalitas dijaga meski memakai pola desain yang sudah umum
- [ ] Desain dievaluasi ulang setelah beberapa hari, bukan hanya sekali lihat

## 2. Tipografi
- [ ] Maksimal 2-3 font family dipakai dalam satu produk/dokumen
- [ ] Hierarki font (H1-H6, body, caption) jelas dan konsisten
- [ ] Line-height cukup lega (1.4-1.6 untuk body text)
- [ ] Line-length dibatasi ±45-75 karakter per baris untuk keterbacaan
- [ ] Ukuran font minimum 14-16px untuk body text di layar
- [ ] Font default sistem (Arial/Times New Roman tanpa modifikasi) dihindari kecuali disengaja
- [ ] Letter-spacing tidak dipaksakan renggang tanpa alasan
- [ ] Font weight dipakai secara fungsional (bold untuk penekanan, bukan dekorasi acak)
- [ ] Kontras ukuran antar level heading cukup signifikan agar hierarki terasa
- [ ] Huruf kapital semua (ALL CAPS) dipakai secukupnya, tidak untuk paragraf panjang
- [ ] Font pairing punya kontras karakter (serif vs sans), bukan dua font mirip
- [ ] Teks tidak diregangkan atau dipepetkan secara paksa demi muat ruang
- [ ] Alignment teks konsisten (rata kiri untuk body, bukan rata tengah semua)
- [ ] Widow/orphan (baris tunggal terpisah paragraf) dihindari
- [ ] Ukuran font responsif menyesuaikan breakpoint layar
- [ ] Tipografi custom/branded dipertimbangkan untuk elemen kunci, bukan generic default
- [ ] Kombinasi italic, bold, underline tidak ditumpuk berlebihan
- [ ] Spasi antar paragraf konsisten dan tidak memakai enter ganda manual

## 3. Warna
- [ ] Palet warna dibatasi (1 primary, 1-2 secondary, netral, aksen)
- [ ] Kontras warna teks vs background memenuhi standar keterbacaan (rasio ≥4.5:1)
- [ ] Warna punya makna/fungsi konsisten (misal merah = error, bukan acak)
- [ ] Gradient tidak dipakai berlebihan di semua elemen sekaligus
- [ ] Warna netral (abu-abu, putih, hitam) tidak plain default browser
- [ ] Palet warna diuji di kondisi buta warna (color blindness)
- [ ] Warna brand konsisten di semua touchpoint, bukan beda-beda per halaman
- [ ] Warna aksen dipakai secukupnya untuk menarik perhatian, bukan di mana-mana
- [ ] Dark mode punya palet sendiri, bukan sekadar invert warna light mode
- [ ] Warna disesuaikan dengan konteks budaya/psikologi target pengguna
- [ ] Tidak memakai warna "ungu-biru gradient AI generik" tanpa alasan brand
- [ ] Warna disabled state jelas beda dari state aktif
- [ ] Saturasi warna tidak berlebihan sampai menyilaukan mata
- [ ] Warna background dan foreground diuji di berbagai perangkat/layar
- [ ] Sistem warna didokumentasikan dengan token/nama, bukan hex acak berulang
- [ ] Warna hover/active/focus state didefinisikan secara konsisten
- [ ] Warna untuk data visualisasi dipilih agar mudah dibedakan, bukan asal cerah
- [ ] Warna tidak jadi satu-satunya penanda informasi penting (aksesibilitas)

## 4. Layout & Struktur
- [ ] Struktur layout mengikuti alur baca alami (F-pattern/Z-pattern) sesuai konten
- [ ] Ada fokus visual utama (focal point) yang jelas di tiap section
- [ ] Layout tidak simetris kaku di semua bagian tanpa variasi
- [ ] Section-section punya identitas visual berbeda tapi tetap satu sistem
- [ ] Konten penting tidak terkubur di bawah scroll tanpa alasan
- [ ] Struktur grid dipakai konsisten, bukan elemen mengambang bebas
- [ ] Layout menyesuaikan panjang konten aktual, bukan lorem ipsum placeholder
- [ ] Elemen dekoratif tidak mengganggu keterbacaan konten utama
- [ ] Rasio ukuran antar blok konten proporsional (tidak semua sama besar)
- [ ] Layout diuji dengan konten edge-case (teks sangat panjang/pendek)
- [ ] Whitespace negatif dipakai sebagai elemen desain, bukan ruang kosong sisa
- [ ] Struktur halaman punya urutan prioritas informasi yang jelas
- [ ] Layout tidak meniru template generic "hero-3 kolom-testimoni-footer" tanpa modifikasi
- [ ] Elemen sticky/fixed tidak menutupi konten penting
- [ ] Struktur konsisten antar halaman yang sejenis
- [ ] Layout mempertimbangkan titik potong (breakpoint) yang realistis
- [ ] Blok konten tidak terlalu banyak nested/dibungkus tanpa perlu
- [ ] Struktur visual mencerminkan struktur informasi/data yang sebenarnya

## 5. Grid & Alignment
- [ ] Semua elemen sejajar pada garis grid yang konsisten
- [ ] Margin kiri-kanan halaman konsisten di semua breakpoint
- [ ] Kolom grid punya gutter yang proporsional dan konsisten
- [ ] Elemen tidak "hampir sejajar" (miselignment beberapa piksel)
- [ ] Optical alignment dipakai saat alignment matematis terlihat salah secara visual
- [ ] Ukuran elemen mengikuti skala grid (8pt/4pt grid system)
- [ ] Baseline grid dipakai untuk konsistensi vertikal teks
- [ ] Elemen ikon dan teks sejajar secara vertikal (vertical-align) dengan tepat
- [ ] Grid responsif beradaptasi jumlah kolom sesuai lebar layar
- [ ] Tidak ada elemen yang keluar grid tanpa alasan visual yang kuat
- [ ] Alignment tabel dan data numerik rata kanan/desimal, bukan rata kiri
- [ ] Spacing antar kolom grid seragam di seluruh halaman
- [ ] Container max-width konsisten agar tidak melebar berlebihan di layar besar
- [ ] Elemen full-bleed dipakai secara sengaja, bukan tidak sengaja terpotong
- [ ] Grid dipakai sebagai kerangka, bukan penjara kaku yang membatasi kreativitas
- [ ] Alignment ikon dalam tombol konsisten center secara visual, bukan geometris kaku
- [ ] Ada breakpoint khusus untuk konten yang butuh layout berbeda
- [ ] Grid divalidasi dengan overlay/guide sebelum final

## 6. Spacing & White Space
- [ ] Sistem spacing memakai skala konsisten (4px/8px based)
- [ ] Spacing antar elemen terkait lebih rapat dari elemen tidak terkait
- [ ] Padding internal komponen konsisten di semua instance sejenis
- [ ] Whitespace cukup di sekitar CTA agar menonjol
- [ ] Tidak ada elemen yang terlalu mepet/berdesakan
- [ ] Spacing vertikal antar section punya jarak yang jelas dan bertahap
- [ ] Margin dan padding tidak dicampur tanpa aturan yang konsisten
- [ ] Spacing menyesuaikan ukuran layar (lebih rapat di mobile, lega di desktop)
- [ ] Ruang kosong dipakai untuk mengelompokkan informasi (proximity principle)
- [ ] Tidak ada spacing acak hasil trial-error tanpa sistem
- [ ] Line spacing dan paragraph spacing dibedakan secara jelas
- [ ] Spacing dalam list/menu konsisten antar item
- [ ] Area sentuh (touch target) minimal 44x44px di mobile
- [ ] Spacing tidak membuat elemen terlihat mengambang tanpa konteks
- [ ] Container padding proporsional dengan ukuran layar
- [ ] Spacing token didokumentasikan dan dipakai ulang, bukan nilai hardcode acak
- [ ] Jarak antar CTA dan elemen lain cukup agar tidak salah klik
- [ ] Ruang kosong tidak disalahartikan sebagai "kosong belum selesai"

## 7. Hierarki Visual
- [ ] Ada urutan baca yang jelas dari elemen paling penting ke kurang penting
- [ ] Ukuran, warna, dan posisi dipakai bersama untuk membangun hierarki
- [ ] Tidak semua elemen diberi bobot visual yang sama (semua bold/besar)
- [ ] CTA utama menonjol jelas dari CTA sekunder
- [ ] Informasi kritikal tidak tenggelam oleh elemen dekoratif
- [ ] Hierarki tetap konsisten di berbagai ukuran layar
- [ ] Kontras ukuran font antar level cukup untuk membedakan pentingnya
- [ ] Hierarki visual selaras dengan hierarki informasi/bisnis
- [ ] Elemen sekunder tidak bersaing visual dengan elemen primer
- [ ] Warna dipakai untuk memperkuat hierarki, bukan mengacaukannya
- [ ] Hierarki tetap terlihat jelas walau dilihat sekilas (5 detik test)
- [ ] Tidak lebih dari satu elemen "paling menonjol" per layar/section
- [ ] Hierarki disesuaikan berdasarkan tujuan halaman (konversi vs informasi)
- [ ] Icon dan label dibedakan bobotnya sesuai kepentingan fungsinya
- [ ] Hierarki dipertahankan konsisten walau konten berubah dinamis
- [ ] Bagian yang kurang penting diberi visual weight rendah tapi tetap terbaca
- [ ] Grouping visual mencerminkan hubungan logis antar elemen
- [ ] Hierarki diuji dengan blur test (lihat layout buram, cek apa yang tetap menonjol)

## 8. Kontras & Keterbacaan
- [ ] Rasio kontras teks dan background memenuhi WCAG AA minimal
- [ ] Teks di atas gambar/foto punya overlay atau shadow agar tetap terbaca
- [ ] Ukuran teks disesuaikan jarak baca (mobile vs signage vs desktop)
- [ ] Kontras cukup tapi tidak menyilaukan (hindari hitam pekat di putih murni untuk long text)
- [ ] Elemen interaktif (link, tombol) kontras jelas dari elemen statis
- [ ] Placeholder text di form tidak terlalu pudar sampai sulit terbaca
- [ ] Disabled state tetap terbaca meski secara visual redup
- [ ] Kontras diuji di kondisi cahaya terang (outdoor/siang hari)
- [ ] Warna teks pada background gambar dinamis diberi fallback aman
- [ ] Ukuran ikon cukup besar dan kontras untuk dikenali cepat
- [ ] Border/divider punya kontras cukup untuk terlihat tapi tidak mengganggu
- [ ] Teks penting tidak ditaruh di area low-contrast demi estetika semata
- [ ] Kontras dites dengan tools (contrast checker), bukan hanya kira-kira
- [ ] Ukuran font kecil (caption/label) tetap terbaca di layar resolusi rendah
- [ ] Link teks dibedakan dari teks biasa (warna/underline), bukan hanya warna
- [ ] Kontras dipertahankan konsisten di dark mode dan light mode
- [ ] Elemen dengan makna penting tidak memakai kontras rendah demi "elegan"
- [ ] Teks pada tombol punya kontras kuat terhadap warna tombol

## 9. Komponen UI (Umum)
- [ ] Komponen dibuat reusable dan konsisten, bukan dibuat ulang tiap halaman
- [ ] Setiap komponen punya state jelas (default, hover, active, disabled, focus)
- [ ] Komponen mengikuti pola interaksi yang familiar bagi pengguna
- [ ] Ukuran komponen konsisten dengan sistem skala yang dipakai
- [ ] Komponen tidak terlalu banyak variasi tanpa alasan fungsional
- [ ] Nama komponen dan penggunaannya didokumentasikan
- [ ] Komponen dites di berbagai konten (teks panjang, kosong, error)
- [ ] Border-radius komponen konsisten dalam satu sistem desain
- [ ] Shadow/elevation komponen konsisten dan tidak berlebihan
- [ ] Komponen dibuat modular, tidak hardcode untuk satu konteks saja
- [ ] Komponen responsif terhadap ukuran container/layar
- [ ] Interaksi antar komponen (dropdown dalam modal, dst) diuji tidak konflik
- [ ] Komponen memiliki batas ukuran maksimum/minimum yang wajar
- [ ] Komponen custom dibuat hanya jika komponen standar tidak cukup
- [ ] Setiap komponen dites aksesibilitasnya (keyboard, screen reader)
- [ ] Perilaku animasi antar state komponen halus dan tidak tiba-tiba
- [ ] Komponen tidak meniru mentah UI kit populer tanpa penyesuaian brand
- [ ] Dependency antar komponen didokumentasikan agar mudah dipelihara

## 10. Tombol & CTA
- [ ] Hanya ada satu CTA primer yang jelas per layar/section
- [ ] Label tombol jelas dan actionable (bukan "Klik di sini")
- [ ] Ukuran tombol cukup besar untuk area sentuh yang nyaman
- [ ] Tombol primer dan sekunder dibedakan secara visual jelas
- [ ] State disabled tombol punya alasan yang jelas bagi pengguna
- [ ] Tombol tidak terlalu banyak dalam satu area (button fatigue)
- [ ] Warna tombol CTA konsisten dengan sistem warna brand
- [ ] Loading state pada tombol ditampilkan saat proses berjalan
- [ ] Tombol destructive (hapus, dsb) dibedakan visualnya dari tombol biasa
- [ ] Urutan tombol (misal Cancel-Confirm) konsisten dan mengikuti konvensi platform
- [ ] Tombol tidak memakai bayangan/gradient berlebihan yang terlihat generic
- [ ] Ukuran tombol proporsional dengan pentingnya aksi
- [ ] Tombol icon-only punya label aksesibilitas (aria-label/tooltip)
- [ ] Hover dan active state tombol terasa responsif, tidak kaku
- [ ] Tombol tidak berpindah posisi drastis antar state (layout shift)
- [ ] CTA copy spesifik terhadap aksi ("Mulai Coba Gratis" bukan "Submit")
- [ ] Jarak antar tombol cukup untuk mencegah salah klik
- [ ] Tombol penting tetap terlihat tanpa harus scroll berlebihan

## 11. Form & Input
- [ ] Label field jelas dan selalu terlihat (bukan hanya placeholder)
- [ ] Field wajib diisi ditandai jelas (bukan hanya warna merah samar)
- [ ] Pesan error spesifik dan membantu, bukan generic "Invalid input"
- [ ] Validasi dilakukan real-time tanpa mengganggu alur pengisian
- [ ] Urutan field logis mengikuti alur mental pengguna
- [ ] Ukuran input field cukup besar untuk diklik/disentuh
- [ ] Autofill dan autocomplete didukung untuk mempercepat pengisian
- [ ] Form panjang dipecah jadi beberapa step jika perlu (progressive disclosure)
- [ ] Placeholder tidak dipakai sebagai pengganti label
- [ ] Keyboard yang sesuai muncul otomatis di mobile (numeric untuk angka, dst)
- [ ] Field disabled/readonly dibedakan jelas dari field aktif
- [ ] Pesan sukses/error muncul dekat dengan field terkait, bukan jauh terpisah
- [ ] Form tidak meminta informasi yang tidak perlu (minimalisir friksi)
- [ ] Tombol submit nonaktif sampai form valid, dengan indikasi jelas kenapa
- [ ] Dropdown/select dipakai hanya jika opsi banyak, bukan untuk 2 pilihan saja
- [ ] Form mendukung navigasi keyboard penuh (tab order logis)
- [ ] Progress indikator ditampilkan untuk form multi-step
- [ ] Data yang sudah diisi tidak hilang saat terjadi error validasi

## 12. Navigasi
- [ ] Struktur navigasi mencerminkan arsitektur informasi yang logis
- [ ] Item navigasi tidak lebih dari 7±2 pilihan utama (aturan umum, kontekstual)
- [ ] Halaman aktif ditandai jelas di navigasi (active state)
- [ ] Navigasi konsisten posisinya di semua halaman
- [ ] Breadcrumb disediakan untuk struktur konten yang dalam
- [ ] Label navigasi jelas dan tidak ambigu
- [ ] Navigasi mobile (hamburger menu) mudah diakses dan jelas ikonnya
- [ ] Search disediakan jika konten/produk banyak
- [ ] Navigasi tidak menyembunyikan fitur penting terlalu dalam
- [ ] Dropdown navigasi tidak terlalu kompleks (mega menu yang membingungkan)
- [ ] Kembali ke halaman utama selalu mudah diakses (logo linkable)
- [ ] Navigasi punya feedback visual saat hover/klik
- [ ] Urutan menu mengikuti prioritas kebutuhan pengguna, bukan struktur internal tim
- [ ] Navigasi sekunder dibedakan jelas dari navigasi primer
- [ ] Sticky navigation tidak memakan terlalu banyak ruang layar
- [ ] Navigasi mendukung keyboard shortcut untuk power user jika relevan
- [ ] Link footer tetap relevan dan tidak sekadar filler
- [ ] Navigasi diuji dengan skenario pengguna baru yang belum familiar produk

## 13. Kartu (Cards) & Blok Konten
- [ ] Ukuran card konsisten dalam satu grid/list
- [ ] Informasi dalam card diprioritaskan (judul, gambar, aksi jelas urutannya)
- [ ] Card tidak overload informasi hingga sulit dipindai
- [ ] Area klik card jelas (seluruh card atau hanya judul)
- [ ] Card punya state hover yang menandakan bisa diklik
- [ ] Rasio gambar dalam card konsisten agar grid rapi
- [ ] Card kosong/tanpa gambar punya fallback visual yang layak
- [ ] Shadow/border card konsisten dengan sistem desain keseluruhan
- [ ] Teks dalam card di-truncate dengan wajar (ellipsis) jika terlalu panjang
- [ ] Card tidak terlalu banyak variasi style dalam satu grid yang sama
- [ ] Konten card menyesuaikan panjang teks nyata, bukan hanya placeholder pendek
- [ ] Card responsif menyesuaikan jumlah kolom di layar kecil
- [ ] Elemen aksi dalam card (like, share) tidak terlalu ramai/berdesakan
- [ ] Card grid punya gutter yang konsisten dan proporsional
- [ ] Card interaktif punya indikasi jelas dibanding card statis
- [ ] Urutan card dalam grid punya logika (terbaru, populer, dst) yang jelas
- [ ] Card yang sedang loading punya skeleton state, bukan blank kosong
- [ ] Card penting (featured) dibedakan visual dari card biasa secara proporsional

## 14. Ikon
- [ ] Gaya ikon konsisten (outline semua atau filled semua, tidak campur)
- [ ] Ukuran ikon konsisten dalam satu sistem (mengikuti grid ikon)
- [ ] Ikon punya makna universal atau disertai label teks jika ambigu
- [ ] Ikon custom dibuat dengan stroke width yang konsisten
- [ ] Ikon tidak dipakai hanya untuk dekorasi tanpa fungsi/makna
- [ ] Ikon interaktif punya area klik yang cukup besar
- [ ] Ikon disertai tooltip/label untuk aksesibilitas
- [ ] Set ikon berasal dari satu sumber/sistem yang konsisten, bukan campur berbagai library
- [ ] Warna ikon konsisten dengan sistem warna keseluruhan
- [ ] Ikon tidak terlalu detail/rumit di ukuran kecil hingga jadi buram
- [ ] Ikon status (sukses, error, warning) memakai bentuk yang mudah dibedakan (bukan hanya warna)
- [ ] Ikon disesuaikan optical alignment-nya dengan teks di sebelahnya
- [ ] Ikon tidak dipilih hanya karena "kelihatan keren" tapi tidak relevan makna
- [ ] Konsistensi sudut membulat (rounded) vs tajam (sharp) di seluruh set ikon
- [ ] Ikon custom brand dibuat unik, bukan hasil generate tanpa kurasi
- [ ] Ikon di dark mode tetap kontras dan jelas
- [ ] Ikon animasi (jika ada) halus dan tidak mengganggu fokus pengguna
- [ ] Ikon diuji keterbacaannya di ukuran terkecil yang akan dipakai

## 15. Fotografi & Ilustrasi
- [ ] Gambar yang dipakai relevan dan bukan stok foto generik tanpa konteks
- [ ] Gaya ilustrasi konsisten di seluruh produk (warna, bentuk, proporsi)
- [ ] Resolusi gambar cukup tinggi untuk semua ukuran layar (retina-ready)
- [ ] Rasio aspek gambar konsisten dalam satu grid/section
- [ ] Gambar dioptimasi ukuran filenya untuk performa loading
- [ ] Foto orang/produk terasa autentik, bukan terlalu "stock photo" klise (senyum berlebihan, dsb)
- [ ] Ilustrasi custom dipertimbangkan untuk memperkuat identitas brand
- [ ] Alt text disediakan untuk semua gambar bermakna
- [ ] Crop gambar tidak memotong bagian penting (wajah, teks, produk)
- [ ] Gambar dengan teks di dalamnya dihindari kecuali perlu (sulit responsif & aksesibilitas)
- [ ] Ilustrasi tidak terlihat generik "AI-generated look" (proporsi aneh, gaya campur aduk)
- [ ] Gaya fotografi/ilustrasi selaras dengan tone brand (playful, serius, dst)
- [ ] Placeholder image diganti gambar asli sebelum rilis final
- [ ] Gambar latar tidak mengganggu keterbacaan teks di atasnya
- [ ] Watermark/logo pada gambar stok dihindari di produk final
- [ ] Ilustrasi/foto merepresentasikan keberagaman audiens secara wajar
- [ ] Format gambar modern (WebP/AVIF) dipakai untuk efisiensi
- [ ] Lazy loading diterapkan untuk gambar di luar viewport awal

## 16. Animasi & Motion
- [ ] Animasi punya tujuan fungsional (feedback, transisi konteks), bukan sekadar hiasan
- [ ] Durasi animasi singkat dan wajar (150-400ms untuk UI dasar)
- [ ] Easing curve terasa natural, bukan linear kaku
- [ ] Animasi tidak menghambat pengguna yang ingin cepat menyelesaikan tugas
- [ ] Ada opsi "reduce motion" untuk pengguna sensitif animasi
- [ ] Animasi loading berbeda dari animasi transisi biasa
- [ ] Animasi konsisten gaya dan timing-nya di seluruh produk
- [ ] Elemen yang muncul/hilang punya transisi halus, bukan tiba-tiba (jump cut)
- [ ] Animasi parallax dipakai secukupnya, tidak mengganggu keterbacaan
- [ ] Animasi hover tidak berlebihan sampai terasa mengganggu
- [ ] Page transition tidak memperlambat perceived performance
- [ ] Animasi tidak dipakai berlebihan hanya karena terlihat "canggih"
- [ ] Animasi loop (misal skeleton loading) tidak terlalu cepat/menyilaukan
- [ ] Micro-animasi memberi feedback yang jelas atas aksi pengguna
- [ ] Animasi disesuaikan platform (native feel di iOS/Android berbeda)
- [ ] Timing animasi diuji langsung di device nyata, bukan hanya preview desain
- [ ] Animasi kompleks (Lottie, dsb) dioptimasi agar tidak berat
- [ ] Urutan animasi (staggered) dipakai wajar untuk memandu perhatian, bukan berlebihan

## 17. Micro-interaction
- [ ] Setiap aksi pengguna mendapat feedback visual langsung
- [ ] Toggle/switch punya transisi state yang jelas
- [ ] Interaksi drag & drop punya indikator visual yang jelas
- [ ] Hover state memberi petunjuk elemen bisa diinteraksi
- [ ] Konfirmasi aksi (like, save) punya micro-feedback yang memuaskan tapi ringkas
- [ ] Interaksi tidak butuh usaha berlebihan (banyak klik) untuk aksi sederhana
- [ ] Gesture di mobile (swipe, pull-to-refresh) terasa natural dan responsif
- [ ] Micro-interaction tidak mengalihkan fokus dari tugas utama
- [ ] Copy-to-clipboard atau aksi cepat lain punya feedback instan
- [ ] Error kecil (misal input salah format) langsung terlihat tanpa submit
- [ ] Cursor berubah sesuai konteks interaksi (pointer, grab, dst) di web
- [ ] Sound/haptic feedback (jika dipakai) proporsional, tidak mengganggu
- [ ] Undo action disediakan untuk aksi yang mudah salah/tidak sengaja
- [ ] Skeleton/shimmer dipakai saat data sedang dimuat, bukan spinner terus-menerus
- [ ] Interaksi hover disesuaikan untuk touch device (tidak bergantung hover saja)
- [ ] Feedback error dan sukses dibedakan jelas secara visual dan verbal
- [ ] Transisi antar state micro-interaction halus dan tidak patah-patah
- [ ] Detail kecil ini diuji dengan pengguna nyata, bukan asumsi tim desain saja

## 18. Aksesibilitas (a11y)
- [ ] Semua elemen interaktif bisa diakses lewat keyboard (tab, enter, esc)
- [ ] Focus indicator terlihat jelas saat navigasi keyboard
- [ ] Kontras warna memenuhi standar WCAG minimal AA
- [ ] Semua gambar bermakna punya alt text yang deskriptif
- [ ] Struktur heading (H1-H6) logis dan tidak diloncat sembarangan
- [ ] Form field punya label yang terhubung secara programatik (for/id atau aria)
- [ ] Elemen tidak hanya mengandalkan warna untuk menyampaikan informasi
- [ ] Ukuran teks bisa di-zoom hingga 200% tanpa merusak layout
- [ ] ARIA role dipakai dengan benar, tidak berlebihan atau salah konteks
- [ ] Video/audio punya caption atau transkrip
- [ ] Animasi berbahaya (flashing) dihindari untuk mencegah photosensitive seizure
- [ ] Screen reader diuji langsung untuk alur utama produk
- [ ] Target sentuh cukup besar dan berjarak untuk pengguna dengan keterbatasan motorik
- [ ] Bahasa dokumen/halaman dideklarasikan dengan benar (lang attribute)
- [ ] Skip-to-content link disediakan untuk halaman dengan navigasi panjang
- [ ] Error form disampaikan secara teks, tidak hanya warna merah
- [ ] Modal/dialog mengelola focus trap dengan benar
- [ ] Order tab (tab index) mengikuti urutan visual yang logis

## 19. Responsif & Adaptif
- [ ] Layout diuji di breakpoint utama (mobile, tablet, desktop, large screen)
- [ ] Konten diprioritaskan ulang (bukan hanya ditumpuk) saat layar mengecil
- [ ] Ukuran font dan spacing menyesuaikan skala layar secara proporsional
- [ ] Gambar responsif tidak terdistorsi di berbagai rasio layar
- [ ] Navigasi berubah bentuk secara wajar di mobile (bukan dipaksa sama persis)
- [ ] Elemen horizontal scroll dipakai secukupnya dan disengaja
- [ ] Orientasi layar (portrait/landscape) dipertimbangkan untuk mobile
- [ ] Touch target diperbesar otomatis di perangkat sentuh
- [ ] Tidak ada elemen terpotong atau overflow tak terduga di layar kecil
- [ ] Desain diuji di perangkat nyata, bukan hanya simulator
- [ ] Konten yang tidak relevan di mobile disembunyikan/disederhanakan, bukan dipaksakan
- [ ] Layout desktop tidak sekadar diperlebar dari desain mobile tanpa penyesuaian
- [ ] Container fluid dipakai agar layout adaptif pada layar sangat lebar
- [ ] Modal dan popup menyesuaikan ukuran layar kecil (fullscreen di mobile jika perlu)
- [ ] Font-size dan line-height diuji tetap nyaman dibaca di semua ukuran
- [ ] Elemen fixed/sticky tidak menutupi konten penting di layar kecil
- [ ] Grid kolom berkurang secara logis sesuai lebar layar yang tersedia
- [ ] Performa dan loading time dipertimbangkan khusus untuk koneksi mobile lambat

## 20. Mobile-specific
- [ ] Ukuran tombol minimal 44x44pt sesuai guideline platform
- [ ] Thumb zone (area mudah dijangkau jempol) dipertimbangkan untuk aksi utama
- [ ] Bottom navigation dipakai untuk aksi/fitur utama yang sering diakses
- [ ] Gesture umum (swipe back, pull to refresh) didukung dan konsisten
- [ ] Keyboard on-screen tidak menutupi field yang sedang diisi
- [ ] Safe area (notch, home indicator) dihormati dalam layout
- [ ] Font minimal 16px untuk mencegah zoom otomatis saat fokus input di iOS
- [ ] Konten kritikal tidak diletakkan di ujung atas/bawah ekstrem layar
- [ ] Orientasi rotasi ditangani dengan baik jika didukung
- [ ] Notifikasi push dirancang tidak mengganggu/berlebihan
- [ ] Ukuran file aplikasi dan aset dioptimasi untuk device low-end
- [ ] Mode offline/koneksi lambat punya fallback UI yang jelas
- [ ] Ikon aplikasi dan splash screen konsisten dengan identitas brand
- [ ] Interaksi one-handed use dipertimbangkan untuk layar besar
- [ ] Haptic feedback dipakai wajar untuk aksi penting
- [ ] Perbedaan konvensi iOS vs Android dihormati (back button, dsb)
- [ ] Ukuran teks mengikuti pengaturan aksesibilitas sistem (dynamic type)
- [ ] Performa scroll tetap mulus (60fps) di perangkat menengah ke bawah

## 21. Konten & Copywriting
- [ ] Copy jelas, singkat, dan langsung ke poin (tidak bertele-tele)
- [ ] Tone of voice konsisten di seluruh produk sesuai brand
- [ ] Istilah teknis dijelaskan atau dihindari jika audiens awam
- [ ] Copy tombol dan label actionable, bukan generic
- [ ] Tidak ada typo atau kesalahan tata bahasa di konten final
- [ ] Copy menghindari jargon pemasaran berlebihan ("revolusioner", "game-changer" tanpa bukti)
- [ ] Pesan error ditulis dengan empati, bukan menyalahkan pengguna
- [ ] Konten diprioritaskan berdasarkan kebutuhan pengguna, bukan ego bisnis
- [ ] Heading dan subheading informatif, bukan hanya menarik tanpa isi
- [ ] Copy konsisten menggunakan istilah yang sama untuk konsep yang sama
- [ ] Kalimat panjang dipecah agar mudah dipindai (scannable)
- [ ] Call-to-action jelas apa yang akan terjadi setelah diklik
- [ ] Konten legal/privasi ditulis jelas, tidak hanya copy-paste template generik
- [ ] Nada bahasa disesuaikan konteks (formal untuk enterprise, santai untuk konsumen muda)
- [ ] Microcopy (tooltip, helper text) membantu tanpa berlebihan
- [ ] Konten tidak terasa hasil auto-generate tanpa sentuhan editorial manusia
- [ ] Angka dan data dalam copy diverifikasi akurat
- [ ] Copy diuji dibaca lantang untuk cek kealamian dan ritme kalimat

## 22. Empty State, Error, Loading State
- [ ] Empty state punya ilustrasi/pesan yang membantu, bukan halaman kosong polos
- [ ] Empty state menyertakan aksi jelas untuk langkah selanjutnya
- [ ] Error state menjelaskan apa yang salah dan cara memperbaikinya
- [ ] Loading state punya skeleton/placeholder yang menyerupai konten asli
- [ ] Loading yang lama diberi indikator progres, bukan spinner tanpa akhir
- [ ] Error 404/500 dirancang khusus, tidak default browser polos
- [ ] Pesan error tidak menyalahkan pengguna atau bernada teknis membingungkan
- [ ] Empty state pertama kali (first-time use) berbeda dari empty state karena filter/pencarian
- [ ] State kosong akibat pencarian menyarankan alternatif atau koreksi
- [ ] Timeout/koneksi gagal punya opsi retry yang jelas
- [ ] Loading state singkat (<300ms) tidak perlu spinner agar tidak flicker
- [ ] Error kritikal (kehilangan data) punya konfirmasi sebelum aksi destruktif
- [ ] State transisi (loading ke sukses/error) halus, tidak tiba-tiba berubah
- [ ] Semua kemungkinan state (loading, empty, error, sukses, partial) dirancang, bukan hanya happy path
- [ ] Loading state konsisten gaya visualnya di seluruh produk
- [ ] Error state menyediakan cara menghubungi bantuan jika perlu
- [ ] Empty state karena permission/akses ditulis jelas alasannya
- [ ] State disederhanakan agar tidak menambah kebingungan saat sudah terjadi masalah

## 23. Notifikasi & Feedback
- [ ] Notifikasi sukses/error muncul konsisten posisi dan durasinya
- [ ] Toast/snackbar tidak menghalangi elemen penting lain
- [ ] Notifikasi kritikal tidak hilang otomatis terlalu cepat
- [ ] Bisa dibedakan jelas antara notifikasi info, sukses, warning, error (warna & ikon)
- [ ] Jumlah notifikasi tidak berlebihan hingga mengganggu (notification fatigue)
- [ ] Notifikasi push relevan secara personal/kontekstual
- [ ] Badge notifikasi akurat mencerminkan jumlah item yang belum dibaca
- [ ] Notifikasi bisa di-dismiss dengan mudah
- [ ] Feedback sistem diberikan untuk setiap aksi penting pengguna
- [ ] Notifikasi in-app tidak duplikat dengan push notification untuk hal sama
- [ ] Pesan konfirmasi aksi destruktif jelas dan tidak ambigu
- [ ] Sound notifikasi (jika ada) bisa dimatikan dan tidak mengganggu
- [ ] Notifikasi tidak mengandung informasi sensitif di lock screen
- [ ] Riwayat notifikasi tersedia untuk direview ulang pengguna
- [ ] Frekuensi notifikasi bisa diatur pengguna (preferences)
- [ ] Notifikasi error backend diterjemahkan jadi bahasa yang dipahami pengguna awam
- [ ] Loading dan feedback progress ditampilkan untuk proses yang lama (upload, dsb)
- [ ] Konfirmasi visual singkat muncul setelah aksi berhasil (misal centang hijau)

## 24. Data Visualisasi / Chart
- [ ] Jenis chart dipilih sesuai jenis data (bar untuk kategori, line untuk tren, dst)
- [ ] Skala sumbu tidak dimanipulasi hingga menyesatkan pembaca
- [ ] Warna data dibedakan jelas dan konsisten dengan legenda
- [ ] Chart punya label sumbu dan satuan yang jelas
- [ ] Data penting di-highlight, bukan semua data diberi bobot visual sama
- [ ] Tooltip data menampilkan informasi rinci saat hover
- [ ] Chart tetap terbaca dalam grayscale/mode aksesibilitas
- [ ] Jumlah kategori dalam satu chart dibatasi agar tidak membingungkan
- [ ] Chart kosong/data tidak tersedia punya state yang jelas
- [ ] Grid/gridline pada chart tidak mendominasi, hanya sebagai bantuan visual
- [ ] Chart responsif menyesuaikan ukuran layar tanpa merusak keterbacaan
- [ ] Anotasi ditambahkan untuk menjelaskan anomali data penting
- [ ] Chart 3D dihindari kecuali benar-benar diperlukan (rawan distorsi persepsi)
- [ ] Urutan data dalam chart logis (kronologis, terbesar-terkecil, dst)
- [ ] Interaktivitas chart (filter, zoom) dirancang intuitif
- [ ] Warna chart dipilih ramah untuk buta warna
- [ ] Sumber data dicantumkan untuk kredibilitas
- [ ] Dashboard tidak overload terlalu banyak chart dalam satu layar

## 25. Dark Mode & Theming
- [ ] Dark mode dirancang khusus, bukan sekadar invert warna light mode
- [ ] Kontras tetap terjaga di dark mode (hindari teks abu-abu di hitam pekat)
- [ ] Warna brand tetap konsisten teridentifikasi di kedua mode
- [ ] Shadow disesuaikan di dark mode (biasanya diganti elevation/border)
- [ ] Gambar dan ilustrasi punya varian atau penyesuaian untuk dark mode
- [ ] Warna pure black (#000) dihindari untuk background luas (gunakan dark grey)
- [ ] Ikon dan grafik tetap terbaca jelas di kedua tema
- [ ] Preferensi tema pengguna (sistem/manual) dihormati dan disimpan
- [ ] Transisi antar tema halus, tidak flicker
- [ ] Semua state komponen (hover, disabled, error) diuji ulang di dark mode
- [ ] Elemen custom/ilustratif diuji tidak pecah di kedua tema
- [ ] Warna semantik (error, sukses) tetap jelas maknanya di dark mode
- [ ] Kontras kode warna diuji ulang, tidak sekadar asumsi otomatis dari light mode
- [ ] Tema custom (jika didukung) tetap menjaga keterbacaan minimal
- [ ] Toggle tema mudah ditemukan dan diakses
- [ ] Dark mode diuji di berbagai jenis layar (OLED vs LCD)
- [ ] Elemen dengan opacity/transparency diuji ulang kontrasnya
- [ ] Sistem token warna mendukung kedua tema tanpa duplikasi kode berlebihan

## 26. Branding & Identitas Visual
- [ ] Logo dipakai konsisten sesuai brand guideline (ukuran, clear space, warna)
- [ ] Identitas visual (warna, font, gaya) konsisten di semua materi
- [ ] Elemen visual mencerminkan nilai dan kepribadian brand
- [ ] Logo tidak didistorsi (diregangkan, diputar sembarangan)
- [ ] Variasi logo (monokrom, ikon saja) disediakan untuk konteks berbeda
- [ ] Tone visual disesuaikan dengan positioning brand (premium, playful, dsb)
- [ ] Konsistensi brand dijaga lintas platform (web, app, media sosial)
- [ ] Elemen visual unik brand (pattern, ikon khas) dipakai untuk diferensiasi
- [ ] Guideline brand didokumentasikan dan mudah diakses tim
- [ ] Brand tidak terlihat generik/mirip kompetitor tanpa diferensiasi jelas
- [ ] Penggunaan warna brand konsisten di produk fisik dan digital
- [ ] Font brand didaftarkan lisensinya untuk semua platform yang dipakai
- [ ] Brand voice dalam visual dan copy saling melengkapi
- [ ] Aset brand (logo, ikon) disimpan dalam format vektor untuk skalabilitas
- [ ] Sub-brand/produk turunan tetap terasa satu keluarga visual dengan induknya
- [ ] Perubahan brand (rebranding) dilakukan dengan mempertimbangkan ekuitas brand lama
- [ ] Elemen visual brand diuji dalam berbagai ukuran (favicon hingga billboard)
- [ ] Brand mempunyai signature detail yang membedakannya dari yang lain

## 27. Konsistensi & Design System
- [ ] Token desain (warna, spacing, tipografi) terdokumentasi dan dipakai konsisten
- [ ] Komponen di design system sinkron dengan implementasi kode aktual
- [ ] Perubahan pada design system dikomunikasikan ke seluruh tim
- [ ] Tidak ada duplikasi komponen dengan fungsi sama tapi style berbeda
- [ ] Naming convention komponen dan token konsisten dan mudah dipahami
- [ ] Design system punya dokumentasi penggunaan (do's and don'ts)
- [ ] Versi design system dikelola agar tidak breaking tanpa notifikasi
- [ ] Konsistensi dijaga antara desain di Figma dan hasil akhir produk
- [ ] Pattern library mencakup skenario umum (form, list, empty state, dst)
- [ ] Audit desain berkala dilakukan untuk temukan inkonsistensi
- [ ] Design system mendukung theming/multi-brand jika diperlukan
- [ ] Kontribusi ke design system melalui proses review, bukan sembarangan
- [ ] Aksesibilitas sudah built-in di level komponen design system
- [ ] Contoh penggunaan nyata (bukan hanya isolated component) disediakan
- [ ] Komponen legacy yang sudah tidak dipakai dibersihkan secara berkala
- [ ] Skala responsif komponen didefinisikan dalam sistem, bukan ad-hoc
- [ ] Perubahan visual besar diuji dampaknya ke seluruh produk sebelum rilis
- [ ] Tim desain dan developer punya sumber kebenaran (source of truth) yang sama

## 28. Onboarding & First-run Experience
- [ ] Onboarding menjelaskan value produk secara singkat, bukan tur fitur panjang
- [ ] Pengguna bisa skip onboarding jika ingin langsung eksplorasi
- [ ] Langkah onboarding minimal dan tidak memaksa terlalu banyak input di awal
- [ ] Progress onboarding ditampilkan jika terdiri dari beberapa langkah
- [ ] Tooltip kontekstual dipakai untuk fitur kompleks, bukan semua dijelaskan sekaligus
- [ ] Onboarding disesuaikan dengan tipe pengguna (baru vs kembali)
- [ ] Ekspektasi pengguna di awal (apa yang bisa dilakukan) disampaikan jelas
- [ ] Onboarding tidak menghalangi akses cepat ke fitur inti produk
- [ ] Ada momen "quick win" di awal agar pengguna merasakan value cepat
- [ ] Permintaan izin (notifikasi, lokasi) diminta dengan konteks jelas, bukan langsung di awal
- [ ] Empty state pertama kali diarahkan untuk mendorong aksi awal
- [ ] Onboarding diuji dengan pengguna yang benar-benar baru, bukan tim internal
- [ ] Bahasa onboarding ramah dan tidak teknis berlebihan
- [ ] Onboarding bisa diakses ulang dari pengaturan jika pengguna butuh mengingat
- [ ] Checklist onboarding (jika ada) memberi rasa progres dan pencapaian
- [ ] Onboarding tidak mengulang informasi yang sudah jelas dari konteks
- [ ] Waktu yang dibutuhkan untuk onboarding realistis dan dihormati
- [ ] Onboarding disesuaikan device (mobile vs desktop) sesuai perilaku pengguna

## 29. Performa & Perceived Performance
- [ ] Waktu loading halaman dioptimasi (di bawah 2-3 detik idealnya)
- [ ] Skeleton screen dipakai agar loading terasa lebih cepat secara persepsi
- [ ] Aset gambar dikompresi tanpa mengorbankan kualitas signifikan
- [ ] Font dimuat secara efisien (font-display: swap, subset font)
- [ ] Animasi tidak menyebabkan lag atau jank pada perangkat low-end
- [ ] Critical content dimuat lebih dulu (above the fold priority)
- [ ] Lazy loading diterapkan untuk konten di luar layar awal
- [ ] Ukuran bundle/kode dioptimasi agar tidak membebani waktu muat
- [ ] Transisi halaman terasa instan dengan teknik optimistic UI jika relevan
- [ ] Cache dipakai secara strategis untuk konten yang jarang berubah
- [ ] Interaksi utama tetap responsif meski data sedang dimuat di background
- [ ] Prioritas resource (CSS, JS) diatur agar rendering tidak terhambat
- [ ] Perceived performance diuji nyata di jaringan lambat (3G/throttled)
- [ ] Elemen non-kritikal dimuat belakangan tanpa mengganggu interaksi awal
- [ ] Feedback instan diberikan meski proses backend masih berjalan
- [ ] Ukuran video dioptimasi dan disediakan dalam format modern
- [ ] Monitoring performa dilakukan berkala, bukan hanya sekali saat rilis
- [ ] Trade-off antara visual kaya dan performa dipertimbangkan secara sadar

## 30. Shadow, Depth & Elevasi
- [ ] Sistem elevasi/shadow konsisten dan berjenjang (level 1, 2, 3, dst)
- [ ] Shadow dipakai untuk menunjukkan hierarki/interaktivitas, bukan dekorasi acak
- [ ] Arah cahaya shadow konsisten di seluruh produk
- [ ] Shadow tidak terlalu tebal/gelap hingga terlihat berat/kotor
- [ ] Elemen elevated (modal, dropdown) punya shadow yang membedakannya dari background
- [ ] Shadow disesuaikan intensitasnya antara light dan dark mode
- [ ] Blur radius shadow proporsional dengan ukuran elemen
- [ ] Tidak semua elemen diberi shadow tanpa alasan fungsional
- [ ] Elevasi dipakai konsisten untuk menunjukkan urutan layer (z-index logis)
- [ ] Shadow tidak menyebabkan elemen terlihat mengambang tanpa konteks jelas
- [ ] Neumorphism/skeuomorphism dipakai dengan sangat hati-hati karena rawan masalah aksesibilitas
- [ ] Shadow pada teks (text-shadow) dipakai secukupnya, hanya jika perlu keterbacaan
- [ ] Elevasi komponen konsisten dengan komponen sejenis lainnya
- [ ] Border dipakai sebagai alternatif shadow saat performa jadi prioritas
- [ ] Efek depth tidak berlebihan hingga mengganggu fokus konten utama
- [ ] Shadow diuji terlihat baik di berbagai kondisi background
- [ ] Sistem elevasi didokumentasikan dengan token, bukan nilai custom tiap komponen
- [ ] Shadow tidak dipakai untuk menutupi masalah kontras yang seharusnya diperbaiki

## 31. Border, Radius & Bentuk
- [ ] Border-radius konsisten dalam satu sistem desain (misal skala 4/8/12/16px)
- [ ] Bentuk sudut (tajam vs membulat) mencerminkan kepribadian brand secara konsisten
- [ ] Border tidak terlalu tebal hingga terasa berat secara visual
- [ ] Warna border kontras cukup untuk terlihat tapi tidak mendominasi
- [ ] Border dipakai secukupnya, tidak semua elemen diberi outline
- [ ] Radius komponen serupa (card, button, input) konsisten satu sama lain
- [ ] Bentuk custom/organik dipakai secara konsisten jika jadi bagian gaya visual
- [ ] Sudut tajam vs membulat tidak dicampur tanpa alasan dalam satu grup elemen
- [ ] Border dipakai untuk memisahkan konten secara logis, bukan sekadar dekorasi
- [ ] Radius elemen besar (card, modal) proporsional dengan ukurannya
- [ ] Border style (solid, dashed) dipakai konsisten sesuai maknanya
- [ ] Elemen dengan radius berbeda tidak bertabrakan visual saat bersebelahan
- [ ] Shape language konsisten antara ikon, ilustrasi, dan komponen UI
- [ ] Border tidak dipakai berlebihan sebagai pengganti spacing yang seharusnya
- [ ] Radius disesuaikan dengan ukuran layar (kadang dikurangi di mobile)
- [ ] Bentuk custom diuji tetap jelas fungsinya, tidak sekadar estetika
- [ ] Border pada input form jelas menandai area yang bisa diisi
- [ ] Konsistensi radius dipertahankan across dark/light mode

## 32. Gradient & Tekstur
- [ ] Gradient dipakai dengan tujuan jelas (kedalaman, penekanan), bukan tren semata
- [ ] Kombinasi warna gradient tetap sesuai palet brand, bukan asal terlihat "keren"
- [ ] Gradient tidak dipakai berlebihan di semua elemen sekaligus
- [ ] Kontras teks tetap terjaga di atas background gradient
- [ ] Tekstur (noise, grain) dipakai halus dan tidak mengganggu keterbacaan
- [ ] Gradient tidak membuat elemen terlihat generic "AI SaaS landing page" tanpa diferensiasi
- [ ] Transisi warna gradient halus, tidak banding/patah
- [ ] Tekstur dipakai konsisten sebagai elemen brand, bukan sekali pakai
- [ ] Gradient diuji tetap terlihat baik di berbagai ukuran layar
- [ ] Penggunaan glassmorphism (jika ada) mempertimbangkan kontras dan performa
- [ ] Tekstur background tidak mengurangi keterbacaan konten di atasnya
- [ ] Gradient dipakai secukupnya sebagai aksen, bukan mendominasi seluruh halaman
- [ ] Kombinasi gradient dan shadow tidak membuat elemen terlihat berlebihan/norak
- [ ] Tekstur file dioptimasi ukurannya agar tidak membebani performa
- [ ] Gradient arah dan sudutnya konsisten antar elemen sejenis
- [ ] Efek visual berat (blur, glow) dipakai hemat dan bertujuan
- [ ] Gradient diuji tidak berubah drastis persepsinya di dark mode
- [ ] Tekstur dan gradient tidak dipakai untuk menutupi lemahnya konsep desain dasar

## 33. Anti-Pola "AI Slop" — Tampilan Generik
- [ ] Hindari kombinasi warna ungu-biru gradient generik tanpa alasan brand
- [ ] Hindari font default (Inter/Roboto tanpa kustomisasi) jika ingin identitas kuat
- [ ] Hindari ilustrasi 3D blob/abstract generik tanpa relevansi konten
- [ ] Hindari layout hero section yang seragam dengan ribuan landing page SaaS lain
- [ ] Hindari ikon emoji berlebihan sebagai pengganti ilustrasi/ikon proper
- [ ] Hindari copy generik penuh buzzword tanpa substansi ("Unlock your potential")
- [ ] Hindari elemen glassmorphism dipakai hanya karena sedang tren tanpa fungsi
- [ ] Hindari susunan testimoni-fitur-pricing yang templated tanpa penyesuaian brand
- [ ] Hindari penggunaan stok foto orang tersenyum berlebihan tanpa konteks nyata
- [ ] Hindari pattern dekoratif (dots, grid lines) yang dipakai hanya untuk "mengisi ruang kosong"
- [ ] Hindari drop shadow berlebihan di semua kartu/tombol tanpa hierarki jelas
- [ ] Hindari bentuk blob/organic shape acak tanpa makna terhadap brand
- [ ] Hindari header besar dengan gradient tanpa konten substantif di baliknya
- [ ] Hindari ikon centang/checklist generik untuk semua fitur tanpa diferensiasi visual
- [ ] Hindari tipografi terlalu besar tanpa hierarki yang jelas hanya demi "bold statement"
- [ ] Hindari elemen desain yang terlihat seperti hasil template generator tanpa kurasi manusia
- [ ] Hindari penggunaan gradient mesh sebagai background default tanpa relevansi
- [ ] Hindari desain yang terlihat "aman" dan tidak berani mengambil sikap visual

## 34. Anti-Pola "AI Slop" — Layout & Struktur Klise
- [ ] Hindari struktur "3 kolom fitur dengan ikon di atas" tanpa variasi untuk semua section
- [ ] Hindari pengulangan pola yang sama persis di setiap section tanpa ritme visual
- [ ] Hindari padding/margin seragam di semua elemen tanpa mempertimbangkan konten
- [ ] Hindari layout simetris sempurna di semua section hingga terasa monoton
- [ ] Hindari CTA yang diulang identik di setiap section tanpa variasi konteks
- [ ] Hindari struktur "problem-solution-benefit" yang terlalu formulaic tanpa nuansa
- [ ] Hindari section testimoni dengan 3 card identik tanpa keberagaman format
- [ ] Hindari footer generik dengan struktur kolom yang sama persis di semua situs
- [ ] Hindari section FAQ accordion default tanpa penyesuaian visual dengan brand
- [ ] Hindari penggunaan angka statistik besar tanpa sumber/konteks yang jelas
- [ ] Hindari struktur pricing table 3 kolom klise tanpa diferensiasi strategi bisnis
- [ ] Hindari section "logo klien" generik tanpa kurasi relevansi logo yang ditampilkan
- [ ] Hindari transisi antar section yang selalu sama (fade-in dari bawah) tanpa variasi
- [ ] Hindari struktur konten yang dipaksa sama walau kebutuhan tiap halaman berbeda
- [ ] Hindari mengisi ruang kosong dengan elemen dekoratif tanpa makna hanya demi "terlihat penuh"
- [ ] Hindari duplikasi struktur competitor tanpa mempertimbangkan konteks bisnis sendiri
- [ ] Hindari section yang terasa ditempel untuk memenuhi checklist "landing page lengkap"
- [ ] Hindari keputusan layout yang diambil karena "biasanya begitu" tanpa validasi kebutuhan nyata

## 35. Anti-Pola "AI Slop" — Copy & Konten Klise
- [ ] Hindari copy generik "Revolutionizing the way you..." tanpa bukti konkret
- [ ] Hindari penggunaan kata "seamless", "empower", "unlock" berlebihan tanpa makna nyata
- [ ] Hindari headline yang bisa dipakai brand manapun tanpa spesifik ke produk sendiri
- [ ] Hindari testimoni yang terdengar terlalu sempurna/tidak natural
- [ ] Hindari statistik tanpa konteks/sumber ("99% pengguna puas" tanpa data pendukung)
- [ ] Hindari CTA generik "Get Started" tanpa menjelaskan apa yang didapat
- [ ] Hindari deskripsi fitur yang hanya mengulang nama fitur tanpa manfaat jelas
- [ ] Hindari bahasa terlalu formal/kaku yang tidak sesuai audiens produk
- [ ] Hindari konten yang terasa hasil generate tanpa proofread/editing manusia
- [ ] Hindari penggunaan superlatif berlebihan ("terbaik", "nomor satu") tanpa bukti
- [ ] Hindari struktur kalimat yang berulang pola sama di setiap paragraf
- [ ] Hindari micro-copy yang generik seperti template tanpa suara brand
- [ ] Hindari deskripsi produk yang terlalu panjang tanpa poin utama yang jelas
- [ ] Hindari FAQ yang isinya pertanyaan template tanpa relevansi nyata ke produk
- [ ] Hindari penggunaan tagline yang terdengar seperti dari brand lain
- [ ] Hindari klaim tanpa bukti yang bisa diverifikasi (transparansi rendah)
- [ ] Hindari nada bicara yang berubah-ubah/tidak konsisten antar halaman
- [ ] Hindari konten filler yang hanya menambah panjang halaman tanpa nilai informasi

## 36. Review, Testing & Validasi Desain
- [ ] Desain direview minimal oleh satu orang lain sebelum dianggap final
- [ ] Desain diuji dengan pengguna nyata (usability testing), bukan hanya tim internal
- [ ] Feedback dikumpulkan secara terstruktur, bukan hanya opini subjektif
- [ ] Desain diuji di berbagai perangkat dan browser sebelum rilis
- [ ] A/B testing dipertimbangkan untuk keputusan desain berdampak besar
- [ ] Heuristic evaluation (10 usability heuristics Nielsen) dipakai sebagai acuan review
- [ ] Desain diuji dengan skenario error dan edge case, bukan hanya happy path
- [ ] Ada sesi "cold review" (dilihat orang yang belum tahu konteks) untuk validasi kejelasan
- [ ] Metrik keberhasilan desain didefinisikan sebelum implementasi (bukan setelah)
- [ ] Desain diuji aksesibilitasnya dengan tools otomatis dan manual
- [ ] Perbedaan implementasi vs desain asli (design QA) dicek sebelum rilis
- [ ] Desain diuji ulang setelah perubahan konten nyata dimasukkan
- [ ] Feedback dari review didokumentasikan dan ditindaklanjuti, bukan diabaikan
- [ ] Desain divalidasi tidak hanya estetis tapi juga terhadap tujuan bisnis
- [ ] Versi desain disimpan (versioning) agar bisa dibandingkan/rollback
- [ ] Desain diuji dalam kondisi nyata (data asli, koneksi lambat, dst)
- [ ] Ada proses sign-off yang jelas sebelum desain dianggap release-ready
- [ ] Kritik dan masukan diterima secara objektif tanpa defensif berlebihan

## 37. Etika & Tanggung Jawab dalam Desain
- [ ] Desain tidak memakai dark pattern untuk memaksa pengguna (misal subscription trap)
- [ ] Consent (persetujuan) pengguna diminta secara jujur dan jelas, bukan manipulatif
- [ ] Desain tidak menyembunyikan opsi penting (unsubscribe, hapus akun) secara sengaja
- [ ] Data pribadi pengguna diperlakukan dengan transparansi yang jelas dalam UI
- [ ] Desain tidak mengeksploitasi bias psikologis pengguna secara tidak etis
- [ ] Konten sensitif ditangani dengan hati-hati dan tidak dieksploitasi demi engagement
- [ ] Desain mempertimbangkan dampak terhadap kelompok rentan (anak-anak, lansia, dst)
- [ ] Notifikasi tidak dirancang untuk memicu kecanduan/urgensi palsu
- [ ] Desain inklusif mempertimbangkan keberagaman kemampuan dan latar belakang pengguna
- [ ] Klaim visual/copy tidak menyesatkan (misalkan diskon palsu, harga coret manipulatif)
- [ ] Desain tidak menyulitkan pengguna secara sengaja demi metrik bisnis semata (misal cancel flow rumit)
- [ ] Privasi by design diterapkan sejak awal proses desain
- [ ] Dampak lingkungan (misal ukuran data, energi) dipertimbangkan dalam desain digital
- [ ] Desain mempertimbangkan konteks budaya lokal agar tidak menyinggung
- [ ] Transparansi algoritma (misal rekomendasi, personalisasi) dikomunikasikan wajar ke pengguna
- [ ] Desain tidak memanfaatkan urgensi palsu (fake countdown, fake stock) untuk konversi
- [ ] Tim desain punya proses untuk mempertanyakan etika keputusan produk, bukan hanya eksekusi
- [ ] Desain akhir dievaluasi juga dari sisi dampak jangka panjang ke pengguna, bukan hanya konversi jangka pendek

---

**Kesimpulan:** Desain yang baik = keputusan sadar + konsistensi sistem (tipografi, warna, spacing, komponen) + validasi nyata (aksesibilitas, testing, etika) — bukan tumpukan tren visual generik tanpa alasan. Pakai checklist ini sebagai filter sebelum desain dianggap selesai.