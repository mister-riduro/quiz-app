# Catatan Perubahan Sesi (Session Changelog)

- **ID Sesi (Conversation ID)**: `b03e67e6-ea97-42e4-b764-eee5386843e5`
- **Waktu Pelaksanaan**: 26 September 2026, 06:55 WIB (UTC+7)
- **Lingkup Perubahan**: Redesain Layout Teka-Teki Silang (Crossword) 2 Kolom dengan Tema Duolingo Asli, Validasi Input Alfabet Murni, Keyboard Virtual Manual, Verifikasi Otomatis, Pembersihan Form Soal di Builder, dan Fitur Select/Deselect Interaktif di Editor
- **Status Build & Typecheck**: Passed (TypeScript `tsc -b && vite build`: 0 errors)

---

## Ringkasan Eksekutif

Sesi ini menyelesaikan rangkaian penyempurnaan menyeluruh pada mini-game **Teka-Teki Silang (Crossword / TTS)** baik pada sisi panggung pemain ([`CrosswordPlayer`](file:///d:/Project/quiz-app/src/plugins/questions/crossword/CrosswordPlayer.tsx)), panggung kiosk ([`PresenterKioskPage`](file:///d:/Project/quiz-app/src/features/presenter/PresenterKioskPage.tsx)), studio pembuat kuis ([`QuizBuilderPage`](file:///d:/Project/quiz-app/src/features/builder/QuizBuilderPage.tsx) & [`SortableQuestionItem`](file:///d:/Project/quiz-app/src/features/builder/components/SortableQuestionItem.tsx)), hingga editor pembuat kata TTS ([`CrosswordEditor`](file:///d:/Project/quiz-app/src/plugins/questions/crossword/CrosswordEditor.tsx)):

1. **Restorasi Gaya Visual Duolingo Asli dengan Layout 2 Kolom**:
   - Menerapkan tata letak 2 kolom proporsional (sisi kiri: Banner Petunjuk Aktif, Grid Interaktif TTS, dan Kontrol; sisi kanan: Daftar Petunjuk Mendatar/Across & Menurun/Down).
   - Menghapus sepenuhnya seluruh warna pink (`pink-*`) dan font serif dari referensi eksternal, mengembalikannya ke sistem desain Duolingo murni: kartu tebal (`border-2 border-duo-gray border-b-4 border-b-slate-200 rounded-2xl`), sorotan biru Duo (`bg-duo-blue-light/60 border-duo-blue text-duo-dark`), dan centang hijau Duo (`bg-duo-green text-white` & `CheckCircle2`).
2. **Tipografi Soal Lebih Besar & Kontras**:
   - Memperbesar ukuran teks petunjuk soal pada kartu samping dari `text-xs` (12px) menjadi `text-sm sm:text-[15px]` tebal dengan penjarakan baris yang nyaman dibaca di layar presentasi.
   - Memperbesar kotak badge nomor soal menjadi `w-6 h-6` (`text-xs font-black`) serta teks petunjuk aktif di atas grid menjadi `text-base sm:text-lg font-black`.
3. **Aturan Input Keyboard Ketat (Hanya Huruf A–Z)**:
   - Kotak blok TTS hanya menerima karakter alfabet `A–Z`.
   - Tombol `Tab` dan `Alt` ditolak secara eksplisit (`preventDefault`) agar tidak memindahkan fokus atau memunculkan menu browser.
   - Tombol `Backspace` tidak mengetikkan teks, melainkan secara eksklusif mengeksekusi penghapusan huruf dan mundur ke kotak sebelumnya. Tombol `Delete` membersihkan huruf kotak aktif.
4. **Keyboard Virtual Mengambang Sesuai Permintaan (On-Demand Floating Keyboard)**:
   - Mematikan perilaku muncul otomatis saat menyentuh/mengklik kotak grid atau kata.
   - Keyboard virtual hanya akan muncul ketika pengguna secara sengaja mengeklik tombol toggle _"Keyboard Virtual"_ pada baris kontrol di bawah grid.
   - Menghapus opsi checkbox _"Buka otomatis"_ dan melengkapinya dengan tombol tutup silang (`X`) serta tombol huruf taktil 3D Duolingo (`border-b-4`).
5. **Verifikasi Otomatis & Penghapusan Tombol "Periksa Jawaban"**:
   - Menghapus tombol besar "Periksa Jawaban" untuk menciptakan UI yang bersih dan pengalaman bermain layaknya puzzle modern.
   - Kata yang selesai diketik benar langsung diverifikasi instan (suara `ding!` dan centang hijau).
   - Saat seluruh kotak terpecahkan dengan benar, kuis secara otomatis merayakan kemenangan dan mengirimkan jawaban (`playVictory()` & `onAnswerSubmit()`).
   - Baris aksi di bawah grid dirampingkan menjadi dua tombol ringkas berdampingan: **Reset Jawaban** dan **Keyboard Virtual**.
6. **Pembersihan Form Khusus Crossword di Quiz Builder**:
   - Menyembunyikan input soal umum (`DuoMathTextarea`) dan media uploader gambar (`ImageUploader`) pada `QuizBuilderPage.tsx` ketika tipe butir soal adalah `crossword`.
   - Pada panel drawer navigasi kuis (`SortableQuestionItem.tsx`), soal TTS secara cerdas menampilkan jumlah kata (misalnya _"5 Kata Teka-Teki Silang"_) alih-alih label miring _"Belum ada pertanyaan"_.
7. **Fitur Select & Deselect (Toggle) pada Crossword Editor**:
   - Pada daftar kata (Mendatar & Menurun): Mengklik kata akan memilih (_select_) dan menyorot kata di grid; mengklik kembali kata yang sama akan membatalkan pilihan (**deselect**) dan membersihkan sorotan biru.
   - Pada kanvas Grid 2D: Mengklik kotak berisi kata akan memilih kata tersebut; mengklik kembali kotak yang sama akan men-**deselect** kata tersebut.
   - Pada kotak kosong: Mengklik kotak kosong menandainya sebagai posisi awal (`→`/`↓`); mengklik kembali kotak kosong yang sama akan men-**deselect** tanda tersebut sehingga tidak meninggalkan indikator yang membingungkan saat berpindah fokus.

---

## 1. Rincian Perubahan (Detailed Changes)

### A. Komponen Pemain Crossword (`CrosswordPlayer.tsx`)

- Mengatur grid kolom pembungkus `grid-cols-1 lg:grid-cols-12` dengan pembagian `lg:col-span-7` untuk area teka-teki kiri dan `lg:col-span-5` untuk area daftar petunjuk kanan.
- Mengembalikan gaya styling kartu asli Duolingo pada petunjuk Mendatar dan Menurun.
- Menghapus `autoOpenKeyboard` agar keyboard virtual tidak otomatis terbuka saat memilih sel atau kata.
- Menambahkan state dan tombol toggle untuk membuka/menutup keyboard virtual secara manual.
- Mengubah fungsi `handleKeyDown` agar hanya merespons alfabet `a-z`/`A-Z`, mengabaikan `Tab` dan `Alt`, serta mempertahankan `Backspace` dan `Delete` khusus untuk penghapusan karakter.
- Menghapus fungsi `handleSubmitCheck` beserta tombol `TactileButton` "Periksa Jawaban".
- Menyederhanakan kontrol aksi menjadi tombol _Reset Jawaban_ dan _Keyboard Virtual_.

### B. Komponen Editor Crossword (`CrosswordEditor.tsx`)

- Menambahkan state `selectedCellCoord` untuk melacak koordinat sel yang sedang dipilih pada grid.
- Memperbarui fungsi `handleCellClick`:
  - Jika sel kata yang sudah terpilih diklik kembali, kata tersebut di-deselect (`setSelectedWordId(null)`).
  - Jika sel kosong yang sudah terpilih diklik kembali, posisi awal di-deselect (`setSelectedCellCoord(null)`).
- Menambahkan fungsi `handleToggleSelectWord` untuk memfasilitasi aksi select/deselect pada daftar kata Mendatar dan Menurun.
- Memperbarui penanda `isStartPos` pada grid agar hanya muncul ketika ada sel kosong yang aktif dipilih pengguna.
- Membersihkan import ikon `Check` yang tidak digunakan.

### C. Halaman Studio Pembuat Kuis (`QuizBuilderPage.tsx` & `SortableQuestionItem.tsx`)

- Pada [`QuizBuilderPage.tsx`](file:///d:/Project/quiz-app/src/features/builder/QuizBuilderPage.tsx):
  - Menyembunyikan kolom input `DuoMathTextarea` bertuliskan _"Soal"_ khusus untuk tipe `crossword`.
  - Menyembunyikan uploader media gambar `ImageUploader` khusus untuk tipe `crossword`.
  - Menghilangkan garis pemisah atas `border-t` saat komponen editor crossword berada di posisi paling atas kartu.
  - Menyembunyikan teks pertanyaan di atas pratinjau siswa untuk crossword.
- Pada [`SortableQuestionItem.tsx`](file:///d:/Project/quiz-app/src/features/builder/components/SortableQuestionItem.tsx):
  - Jika tipe soal adalah `crossword` dan `titlePrompt` kosong, item di sidebar menampilkan jumlah kata (misalnya `X Kata Teka-Teki Silang`) dengan teks tegas bukan miring, menghindari teks default `(Belum ada pertanyaan)`.

### D. Layar Proyektor Presenter (`PresenterKioskPage.tsx`)

- Menyembunyikan judul pertanyaan `<h2>` di bawah bar status kuis khusus tipe `crossword`.
- Memperlebar kontainer panggung presenter menjadi `max-w-6xl xl:max-w-7xl` agar layout dua kolom TTS tertata leluasa tanpa berdesakan.
- Menyesuaikan penjarakan atas panggung presenter menjadi `pt-6` (24px) sesuai panduan desain.

---

## 2. Berkas yang Terpengaruh (Files Impacted)

| Status     | Berkas                                                                                                                                                                     | Deskripsi                                                                                                                    |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **Baru**   | [`changelogs/CHANGELOG-session-b03e67e6-ea97-42e4-b764-eee5386843e5.md`](file:///d:/Project/quiz-app/changelogs/CHANGELOG-session-b03e67e6-ea97-42e4-b764-eee5386843e5.md) | Berkas catatan perubahan sesi lengkap                                                                                        |
| **Diubah** | [`src/plugins/questions/crossword/CrosswordPlayer.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/crossword/CrosswordPlayer.tsx)                                   | Layout 2 kolom Duo asli, font lebih besar, kontrol keyboard ketat, keyboard virtual manual, eliminasi tombol periksa jawaban |
| **Diubah** | [`src/plugins/questions/crossword/CrosswordEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/crossword/CrosswordEditor.tsx)                                   | Fitur select & deselect (toggle) pada daftar kata dan kanvas grid, pembersihan import                                        |
| **Diubah** | [`src/features/builder/QuizBuilderPage.tsx`](file:///d:/Project/quiz-app/src/features/builder/QuizBuilderPage.tsx)                                                         | Menyembunyikan input soal dan upload gambar untuk crossword                                                                  |
| **Diubah** | [`src/features/builder/components/SortableQuestionItem.tsx`](file:///d:/Project/quiz-app/src/features/builder/components/SortableQuestionItem.tsx)                         | Label jumlah kata TTS cerdas di drawer navigasi kuis                                                                         |
| **Diubah** | [`src/features/presenter/PresenterKioskPage.tsx`](file:///d:/Project/quiz-app/src/features/presenter/PresenterKioskPage.tsx)                                               | Sembunyikan heading prompt soal untuk crossword dan perluas lebar panggung                                                   |
