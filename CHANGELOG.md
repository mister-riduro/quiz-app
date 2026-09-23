# Changelog

Semua perubahan penting pada proyek **EduPlay Quiz Studio** didokumentasikan dalam berkas ini.

Format berkas ini mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan mengikuti kaidah [Semantic Versioning](https://semver.org/lang/id/).

## [1.2.0] - 2026-09-23

### Ditambahkan (Added)

- **Left Navigation Drawer pada Dashboard (`NavigationDrawer.tsx`)**:
  - Mengubah sistem tata letak navigasi Dashboard dari bar horizontal atas menjadi **Left Navigation Drawer (Sidebar Samping Kiri)** permanen bertema Duolingo pada layar desktop/tablet (`lg:flex fixed inset-y-0 left-0`).
  - **Penyelarasan Visual Menu Aktif**: Menyesuaikan highlight item menu aktif agar tidak terlalu mencolok (_less prominent_), menggunakan warna latar hijau muda lembut (`#E5FAD2`) berpadu dengan garis tepi (_stroke_) hijau yang sedikit lebih gelap (`#A2E865`) serta bevel taktil bawah (`#85D641`), menghadirkan nuansa yang tenang, seimbang, dan ramah di mata.
  - **Pemusatan Aksi Buat Kuis**: Menghapus tombol duplikat "Buat Kuis Baru" pada kartu sambutan selamat datang di [`QuizDashboardPage`](file:///d:/Project/quiz-app/src/features/dashboard/QuizDashboardPage.tsx), dan memusatkannya pada tombol di drawer samping dengan perilaku yang identik (membuka dialog formulir [`CreateQuizModal`](file:///d:/Project/quiz-app/src/features/dashboard/components/CreateQuizModal.tsx) untuk mengatur judul, kategori, dan deskripsi kuis).
  - **Dukungan Responsif Mobile**: Pada layar ponsel/tablet sempit, drawer dapat dibuka secara mulus dari samping kiri melalui tombol menu hamburger di header atas dengan backdrop interaktif dan animasi pegas (_spring physics_).
  - **Isolasi Penuh Presenter Kiosk**: Mode proyektor kelas (`PresenterKioskPage`) tetap 100% _full-screen standalone_ tanpa ada drawer, sidebar, ataupun offset layout, menjaga fokus panggung proyektor kelas.
- **Fitur Lupa Kata Sandi / Pemulihan Akun Pengajar (`ForgotPasswordPage.tsx`)**:
  - Menghadirkan alur pemulihan kata sandi bagi guru yang lupa kata sandi akunnya via Supabase Auth (`resetPasswordForEmail`).
  - Menyediakan formulir permintaan tautan reset kata sandi dengan validasi email dan notifikasi konfirmasi ramah pengguna.
  - Menyediakan formulir penetapan kata sandi baru (`updateUser`) dengan validasi keamanan minimal 6 karakter dan konfirmasi kata sandi saat guru membuka tautan pemulihan.
  - Mengintegrasikan tautan "Lupa kata sandi?" langsung di bawah input kata sandi pada [`LoginPage.tsx`](file:///d:/Project/quiz-app/src/features/auth/LoginPage.tsx) serta di dalam [`AuthModal.tsx`](file:///d:/Project/quiz-app/src/features/auth/AuthModal.tsx).
- **Mode Simulasi & Deteksi Konfigurasi Supabase (`isSupabaseConfigured`)**:
  - Mengatasi kendala kegagalan DNS (`net::ERR_NAME_NOT_RESOLVED`) saat berkas `.env` belum diisi atau masih menggunakan domain placeholder.
  - Mengaktifkan simulasi pengujian lokal pada alur Lupa Kata Sandi sehingga pengembang dapat langsung menguji permintaan pemulihan hingga penetapan kata sandi baru secara mulus.

### Diubah (Changed)

- **Segmented Tab Filter Dashboard Menggunakan Status Aktif Putih Bersih**:
  - Menyeragamkan status terpilih (_selected state_) pada tab filter kuis (_Semua_, _Dipublikasikan_, _Draft_) di [`QuizDashboardPage`](file:///d:/Project/quiz-app/src/features/dashboard/QuizDashboardPage.tsx) menjadi warna putih bersih bertema Duolingo (`bg-white text-duo-dark shadow-sm border-b-2 border-b-slate-300`) untuk seluruh opsi, menggantikan highlight warna hijau/kuning sebelumnya agar visual dashboard lebih tenang, seragam, dan rapi.
  - Menerapkan konsistensi serupa pada tab segmented switch autentikasi (_Masuk Guru_ vs _Daftar Akun Guru_) di [`App.tsx`](file:///d:/Project/quiz-app/src/App.tsx).
- **Tampilan List View & View Switcher (Grid vs List) pada Dashboard**:
  - Menghadirkan format tampilan **List View** untuk daftar kuis kelas dan katalog komunitas di [`QuizCard.tsx`](file:///d:/Project/quiz-app/src/features/dashboard/components/QuizCard.tsx) dan [`QuizDashboardPage.tsx`](file:///d:/Project/quiz-app/src/features/dashboard/QuizDashboardPage.tsx). Kuis ditampilkan dalam baris horizontal yang ringkas dan efisien: thumbnail sampul kompak di sisi kiri, metadata lencana (_Dipublikasikan/Draft, Kategori, Jumlah Butir Soal, Guru_) serta judul dan deskripsi di tengah, dan tombol aksi (_Host / Mainkan, Edit, Menu Opsi_) di sisi kanan.
  - Menyediakan tombol pemilih tampilan taktil (**View Mode Switcher**) dengan ikon Grid (`LayoutGrid`) dan List (`List`) bertema Duolingo di samping judul daftar kuis, dengan preferensi tersimpan otomatis di `localStorage` (`eduplay_quiz_view_mode`) dan secara default aktif pada mode **List**.
  - Mengatur posisi menu dropdown opsi kuis ("...") agar konsisten terbuka ke atas card (`bottom-full mb-2`) dengan penataan konteks tumpukan (_stacking context_) `z-40`/`z-50`, sehingga menu tampil utuh dan tidak terpotong atau tertutup oleh baris kuis lainnya.

### Dihapus (Removed)

- **Pembersihan Seluruh Kuis Mock / Sampel Bawaan**:
  - Menghapus seluruh kuis tiruan / data sampel demo bawaan (`quiz-1`, `quiz-2`, draf mock lawas) dari penyimpanan browser (`localStorage`).
  - Mengintegrasikan fungsi pendeteksi dan pembersihan otomatis (`isMockQuiz` serta migrasi skema penyimpanan Zustand) untuk memastikan daftar kuis di Dashboard bersih dan sepenuhnya bersumber dari database Supabase pengguna atau kuis nyata yang dibuat oleh pengajar.

---

## [1.1.0] - 2026-09-20

### Ditambahkan (Added)

- **Dukungan Clipboard Paste (Ctrl + V / ⌘ + V) pada Media Uploader**:
  - Pengguna dapat langsung menempelkan tangkapan layar (_screenshot_ dari Windows Snipping Tool `Win + Shift + S`, PrtSc, atau menu _Copy Image_ peramban) ke dalam uploader media soal tanpa perlu menyimpan berkas ke harddisk terlebih dahulu.
  - Mendukung penempelan berkas gambar yang disalin langsung dari File Explorer (Ctrl + C lalu Ctrl + V).
  - Mendukung penempelan tautan gambar langsung (_direct image URL_) berakhiran `.png`, `.jpg`, `.webp`, atau tautan data base64.
  - **Smart Input Detection**: Mempertahankan fungsionalitas penempelan teks standar pada input formulir dan `<textarea>` judul soal jika clipboard berisi teks. Jika clipboard berisi data gambar, sistem secara otomatis menangkapnya dan mengarahkannya ke uploader media aktif.
  - **Aksesibilitas & Navigasi Keyboard**: Area dropzone kini dapat difokuskan via keyboard (`tabIndex={0}`), dengan ring fokus bertema Duolingo serta dukungan tombol `Enter` / `Spasi` untuk membuka dialog penjelajah berkas.
  - **Indikator Visual Shortcut**: Menambahkan badge shortcut keyboard bertema taktil (`Ctrl + V` pada Windows/Linux dan `⌘ + V` pada macOS) pada area dropzone serta label bantuan ganti cepat pada status pratinjau gambar.
  - **Penggantian Cepat (_Quick Replace_)**: Menempelkan gambar baru saat gambar sebelumnya sudah ada akan langsung mengompresi dan menggantikan gambar lama secara mulus.

### Diubah (Changed)

- **Unifikasi Alert & Notifikasi Hasil Soal (Hanya Bottom Sheet)**:
  - Menghapus seluruh banner notifikasi / alert evaluasi ganda (_redundant inline post-submission banners_) yang sebelumnya dirender di bawah tombol periksa jawaban pada komponen pemain kuis (`AnagramPlayer`, `SpellWordPlayer`, `DiagramPlayer`, `UnjumblePlayer`, `WordsearchPlayer`, `HangmanPlayer`, dan `TrueFalsePlayer`).
  - Seluruh status jawaban (Benar, Salah, maupun Waktu Habis) kini hanya ditampilkan melalui satu pintu di lembar bawah bergaya Duolingo (`BottomSheetFeedback`), menjaga tampilan panggung kuis tetap bersih, fokus, dan bebas dari informasi yang bertumpuk.
- **Petunjuk Soal Default Kosong**: Seluruh plugin tipe pertanyaan (Anagram, Hangman, Spell the Word, Labelled Diagram, Unjumble, Word Search, Crossword) kini menginisialisasi petunjuk (_hint_ / konteks / kategori soal) sebagai string kosong secara default. Hal ini mencegah munculnya tombol petunjuk dengan teks contoh dummy pada Presenter Kiosk dan lembar kuis jika pembuat kuis tidak mengisinya.
- **Penyelarasan Atas (_Align to Top_) Panggung Presenter Kiosk**: Mengubah tata letak panggung utama Presenter Kiosk dari posisi tengah vertikal (_vertical center_) menjadi rata atas (_align to top / items-start_), sehingga judul soal, lencana, gambar ilustrasi materi, dan komponen kuis sejajar rapi di bagian atas panggung proyektor.
- **Optimasi Balok Huruf Anagram (Fill-Container & Tinggi Lebih Besar)**: Balok huruf pada modul Anagram kini lebih tinggi dan mantap (tinggi $64\text{px}$–$94\text{px}$), karakter huruf di dalamnya mengisi ruang balok secara maksimal (_fill-container_) dengan tipografi tegas berbobot, serta ukuran balok dan font otomatis menyesuaikan secara cerdas (sedikit lebih kecil ketika jumlah huruf banyak agar tetap proporsional dan muat sempurna).
- `QuizBuilderPage`: Menyembunyikan uploader media generik secara otomatis ketika tipe soal adalah `labelled_diagram`, guna menghindari duplikasi uploader dan redundansi dengan kanvas diagram interaktif `DiagramEditor`.

### Diperbaiki (Fixed)

- **Persistensi Waktu & Sesi Presenter Kiosk Saat Refresh**:
  - Mengatasi masalah di mana ketika peramban di-refresh (F5), status waktu (baik durasi global kuis maupun sisa waktu per soal) ter-reset kembali ke durasi awal, serta mode Presenter terlempar ke Dashboard.
  - Mengintegrasikan penyimpanan sesi `sessionStorage` sinkron untuk data kuis aktif, daftar soal, nomor soal yang sedang aktif (`currentIndex`), riwayat jawaban/evaluasi, serta sisa waktu hitungan mundur (`globalTimeLeft` dan `questionTimeLeft`).
  - Saat terjadi refresh, waktu menghitung sisa detik secara akurat berdasarkan selisih waktu simpan (`savedAt`) dan melanjutkan hitungan mundur secara mulus tanpa mengulang dari awal.
- **Pemberian Label "SISA WAKTU:" pada Badge Timer**:
  - Menambahkan teks label eksplisit `SISA WAKTU:` di sebelah ikon jam dan nilai timer pada lencana panggung Presenter Kiosk agar lebih jelas terbaca oleh guru dan peserta didik di layar proyektor kelas.
- **Pencegahan Seleksi Otomatis pada Balok Anagram Pasca-Drag**:
  - Mengatasi masalah di mana setelah balok huruf digeser (_drag-and-drop_) dan dilepaskan, balok tersebut otomatis terpilih (_selected_) dengan cincin fokus biru karena adanya intersepsi event `click` sintetis dari peramban setelah `dragEnd`.
  - Menerapkan penjaga waktu drag (`dragEndTimeRef` dan `isDraggingRef`), sehingga event klik yang terjadi sesaat setelah pelepasan drag diabaikan, sementara fitur _Tap-to-Swap_ tetap berfungsi responsif ketika balok memang sengaja diklik/ditekan tanpa diseret.
- **Indikator Badge Waktu Presenter Kiosk Saat Waktu Habis**:
  - Memperbaiki logika `formatTimerBadge` di mana ketika hitungan mundur selesai (`timeLeft <= 0`) pada kuis/soal yang memiliki batas waktu, lencana di header panggung sebelumnya keliru menampilkan teks "TANPA BATAS".
  - Kini lencana secara akurat menampilkan teks "WAKTU HABIS" dengan aksen warna merah menyala dan animasi berkedip (_pulse_), selaras dengan status di lembar evaluasi panggung.
- **Koreksi & Kunci Jawaban Otomatis Saat Waktu Habis**:
  - Mengatasi masalah di mana ketika waktu habis, kartu evaluasi "Koreksi / Jawaban Benar" di lembar bawah (_BottomSheetFeedback_) hanya menampilkan teks generik dummy (`Silakan lanjutkan ke soal berikutnya.`) tanpa adanya jawaban yang benar.
  - Mengintegrasikan pemanggilan `getQuestionSolution` secara otomatis saat batas waktu per-soal maupun batas waktu kuis global berakhir, sehingga kartu koreksi menyajikan kunci jawaban yang benar secara transparan (misal: kata target anagram, kata ejaan, kata rahasia hangman, susunan kalimat unjumble, dsb.) beserta pembahasan edukatifnya.
- **Fisika Drag Balok Anagram Linear & Sinkron 1:1**:
  - Mengatasi pergerakan seret balok yang terasa mengambang / tidak linear dengan kursor mouse.
  - Menghapus kelas CSS `transition-all` pada elemen seret (yang sebelumnya memicu interpolasi bezier 150ms pada `transform`), menyetel `dragMomentum={false}`, `dragElastic={0}`, serta membatasi animasi pegas hanya pada reposisi balok tetangga (`layout transition`), sehingga pergerakan balok terkunci 100% instan dan linear mengikuti koordinat kursor.
- **Balok Anagram Terpotong pada Kata Panjang (>8 Huruf)**:
  - Mengatasi masalah terpotongnya huruf balok anagram pada ujung kiri (huruf pertama) dan ujung kanan (huruf terakhir) yang disebabkan oleh kombinasi `overflow-hidden`, `justify-center`, dan ukuran balok statis.
  - Menerapkan **skala balok adaptif (_responsive auto-scaling_)** berdasarkan panjang kata: kata dengan 10+ huruf otomatis mengecil secara proporsional agar muat dalam layar proyektor / tablet.
  - Mengaktifkan pengguliran horizontal aman (_safe horizontal scroll_) dengan pembungkus `min-w-fit mx-auto` agar balok tidak pernah terpotong ke koordinat negatif.
  - Menambahkan fitur **Tap-to-Swap (Ketuk 2 Balok untuk Menukar)** selain fitur seret (_drag-and-drop_), mempermudah interaksi pada layar sentuh proyektor interaktif kelas.
  - **Konsistensi Sudut Sudut (_Rounded Corners_)**: Menstandarkan `rounded-2xl` dan `rounded-xl` pada seluruh konfigurasi panjang huruf agar balok selalu memiliki sudut melengkung halus (_Duolingo squircle_) dan tidak ada yang menjadi kotak bersudut tajam (_sharp corners_).

---

## [1.0.0] - 2026-09-17

### Ditambahkan (Added)

- **EduPlay Quiz Studio Core Platform**:
  - Studio pembuatan kuis interaktif dengan antarmuka bertema visual taktil _Duolingo-style_ (bevel 3D, bayangan datar berbobot, animasi responsif).
  - 8 Plugin Tipe Pertanyaan:
    1. **True or False** (Benar / Salah)
    2. **Spell the Word** (Mengeja Kata)
    3. **Anagram** (Menyusun Huruf)
    4. **Hangman** (Tebak Kata Rahasia)
    5. **Crossword** (Teka-Teki Silang Interaktif)
    6. **Word Search** (Matriks Pencarian Kata)
    7. **Labelled Diagram** (Penancapan Pin Diagram Interaktif)
    8. **Unjumble** (Menyusun Frasa & Kalimat)
  - **Client-side WebP Compressor**: Kompresi otomatis berbasis kanvas HTML5 (resolusi maksimal 1200px, kualitas 0.8) sebelum unggah ke Supabase Storage `quiz-media` guna menghemat kuota dan mempercepat loading proyektor kelas.
  - **Presenter Kiosk Mode**: Layar proyektor kelas resolusi tinggi dengan papan skor dinamis, pengatur waktu kuis, dan efek suara Web Audio API/Howler.
  - **State Management & Persistence**: Integrasi Zustand store dengan penyimpanan lokal dan sinkronisasi basis data Supabase.
