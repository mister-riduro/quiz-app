# Catatan Perubahan Sesi (Session Changelog)

- **ID Sesi (Conversation ID)**: `dc6415e3-d399-4f35-9a80-512dd180b08b`
- **Waktu Pelaksanaan**: 25 September 2026, 23:55 WIB (UTC+7)
- **Lingkup Perubahan**: Sistem Dropdown Universal, Modal Tambah Soal Mini-Game, Penyelarasan Tipografi, dan Perapian Visual Pengaturan Soal
- **Status Build & Typecheck**: Passed (TypeScript `tsc -b --noEmit` & Vite Production Build: 0 errors)

---

## Ringkasan Eksekutif

Sesi ini berfokus pada standardisasi seluruh elemen dropdown dalam aplikasi kuis **EduPlay Quiz Studio** agar memiliki gaya taktil Duolingo yang konsisten, menggantikan elemen bawaan `<select>` browser dengan komponen kustom `DuoDropdown`, mengubah sistem pemilihan tipe soal baru menjadi dialog modal yang lapang dan informatif, serta menyelaraskan hierarki tipografi dan palet warna kontrol antarmuka.

---

## 1. Penambahan (Added)

### Komponen Reusable Baru: `DuoDropdown` ([`src/components/ui/DuoDropdown.tsx`](file:///d:/Project/quiz-app/src/components/ui/DuoDropdown.tsx))

- **Arsitektur Taktil**: Komponen dropdown modular berbasis gaya desain Duolingo untuk menggantikan native HTML `<select>` di seluruh modul aplikasi.
- **Outline & State Interaktif**:
  - _Not Clicked (Default)_: Garis tepi halus seragam `border-slate-200` dengan efek hover `hover:border-slate-400`.
  - _Clicked / Active_: Berubah menjadi hitam tegas `border-duo-dark` dengan ring glow netral `ring-4 ring-duo-dark/15` ketika sedang terbuka (`isOpen`) atau mendapatkan fokus keyboard.
- **Tipografi Semibold**: Menggunakan bobot **`font-semibold`** (600) untuk label trigger dan item pilihan menu sehingga teks terlihat tegap dan mudah dibaca tanpa berlebihan.
- **Fleksibilitas Ikon (Selective Icons)**:
  - Format soal menampilkan ikon mini-game bernuansa biru (`bg-duo-blue/10 text-duo-blue` dan `bg-duo-blue text-white` saat dipilih).
  - Poin soal, durasi waktu kuis, dan kategori mata pelajaran tampil bersih rata kiri **tanpa memaksakan ikon**, sesuai preferensi pengguna.
- **Aksesibilitas & UX**:
  - Penutupan otomatis saat klik di luar area (_click outside_) dan penekanan tombol `Escape`.
  - Navigasi keyboard penuh (`ArrowDown`, `ArrowUp`, `Enter`, `Space`).
  - _Smart Placement_: Menghitung ruang vertikal layar secara otomatis untuk menentukan arah menu (drop-down atau drop-up) agar tidak terpotong saat berada di bagian bawah viewport.
  - Efek suara taktil terintegrasi (`playTap()` saat membuka, `playPop()` saat memilih opsi).

### Komponen Modal Baru: `AddQuestionModal` ([`src/features/builder/components/AddQuestionModal.tsx`](file:///d:/Project/quiz-app/src/features/builder/components/AddQuestionModal.tsx))

- **Dialog Pilihan Mini-Game Lapang**: Menggantikan dropdown sempit di sidebar navigasi kiri menjadi dialog modal terpusat berbingkai rounded-3xl `border-2 border-b-4 border-b-slate-300 shadow-2xl`.
- **Deskripsi Lengkap Tanpa Terpotong (_No Truncate_)**: Menampilkan seluruh 8 format mini-game interaktif dalam grid kartu responsif (2 kolom di desktop/tablet, 1 kolom di mobile) dengan teks deskripsi lengkap yang nyaman dibaca oleh guru.
- **Kartu Pilihan Interaktif**: Setiap kartu dilengkapi badge ikon mini-game, judul format, deskripsi alur permainan, dan indikator panah dinamis dengan efek suara `playPop()` saat dipilih.
- **Dukungan Pintasan**: Dapat ditutup dengan tombol Escape, backdrop click, atau tombol close (X).

### Modularisasi Panel: `QuestionSettingsDrawer` ([`src/features/builder/components/QuestionSettingsDrawer.tsx`](file:///d:/Project/quiz-app/src/features/builder/components/QuestionSettingsDrawer.tsx))

- Memisahkan drawer konfigurasi butir soal menjadi berkas komponen terdedikasi untuk meningkatkan keterbacaan kode `QuizBuilderPage.tsx`.
- Mengintegrasikan `DuoDropdown` untuk pemilihan format mini-game, penentuan poin jawaban, serta batas durasi butir soal.

---

## 2. Perubahan (Changed)

### Penyeragaman Seluruh Dropdown Aplikasi

- **Batas Waktu Total Kuis (Global)** ([`QuizBuilderPage.tsx`](file:///d:/Project/quiz-app/src/features/builder/QuizBuilderPage.tsx#L221-L250)): Menggantikan elemen `<select>` native dengan `DuoDropdown<number>`, menggunakan outline netral `border-slate-200` dan state aktif hitam.
- **Seragamkan Durasi Semua Soal (Bulk)** ([`QuizBuilderPage.tsx`](file:///d:/Project/quiz-app/src/features/builder/QuizBuilderPage.tsx#L254-L287)): Menggantikan elemen `<select>` native dengan `DuoDropdown<string>`, menghilangkan outline warna hijau/amber dan menyelaraskannya ke outline standar.
- **Poin Jawaban Butir Soal** ([`QuestionSettingsDrawer.tsx`](file:///d:/Project/quiz-app/src/features/builder/components/QuestionSettingsDrawer.tsx#L140-L160)): Menggantikan `<select>` native dengan `DuoDropdown<number>` bersih tanpa ikon.
- **Batas Waktu Butir Soal** ([`QuestionSettingsDrawer.tsx`](file:///d:/Project/quiz-app/src/features/builder/components/QuestionSettingsDrawer.tsx#L220-L230)): Menggantikan `<select>` native dengan `DuoDropdown<number>`, menghapus varian hijau untuk menyelaraskan dengan warna outline netral.
- **Mata Pelajaran / Kategori** ([`CreateQuizModal.tsx`](file:///d:/Project/quiz-app/src/features/dashboard/components/CreateQuizModal.tsx#L138-L151)): Menggantikan `<select>` formulir kuis dengan `DuoDropdown<string>` berukuran sedang (`size="md"`).

### Penyelarasan Switcher Mode Waktu Kuis ([`QuizBuilderPage.tsx`](file:///d:/Project/quiz-app/src/features/builder/QuizBuilderPage.tsx#L189-L212))

- Mengubah teks opsi aktif pada tombol switcher **Global (Total)** dan **Per Butir Soal** menjadi teks hitam (**`text-duo-dark`**) menggantikan warna biru dan hijau sebelumnya.
- Opsi tidak aktif menggunakan warna abu-abu netral (`text-slate-500 hover:text-duo-dark`).

### Penyeragaman Warna Ikon Expand & Collapse Panel Pengaturan ([`QuizBuilderPage.tsx`](file:///d:/Project/quiz-app/src/features/builder/QuizBuilderPage.tsx#L630-L642))

- Mengubah ikon buka panel samping (`PanelRightOpen`) yang sebelumnya berwarna biru menjadi abu-abu netral (**`text-slate-400 hover:text-duo-dark`**), selaras 100% dengan ikon tutup panel samping (`PanelRightClose`).

### Optimasi Web Font Nunito ([`index.html`](file:///d:/Project/quiz-app/index.html#L18))

- Menambahkan varian bobot `500` (`wght@0,500;1,500`) ke link Google Fonts Nunito untuk melengkapi spektrum tipografi aplikasi (400, 500, 600, 700, 800, 900).

---

## 3. Penghapusan (Removed)

- **Elemen Native `<select>` Browser**: Seluruh 5 elemen native `<select>` yang tidak konsisten secara visual telah dihapus dari antarmuka:
  - 2 di `QuizBuilderPage.tsx` (Global Time Limit & Bulk Question Time Limit).
  - 2 di `QuestionSettingsDrawer.tsx` (Poin Soal & Waktu Per Soal).
  - 1 di `CreateQuizModal.tsx` (Kategori Mata Pelajaran).
- **Dropdown Sempit Tambah Soal**: Menghapus dropdown popover di sidebar kiri (`isAddDropdownOpen`, `addDropdownRef`, dan listener `handleClickOutside` terkait) yang sebelumnya membatasi keterbacaan deskripsi format soal.
- **Outline Warna Terpisah**: Menghapus border biru (`border-duo-blue/40`), hijau (`border-duo-green/50`), dan amber (`border-amber-300`) dari dropdown agar seluruh kontrol memiliki identitas visual yang tenang dan terpadu.

---

## 4. Berkas yang Terpengaruh (Files Impacted)

| Status     | Berkas                                                                                                                                                                     | Deskripsi Perubahan                                                                      |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| **Baru**   | [`src/components/ui/DuoDropdown.tsx`](file:///d:/Project/quiz-app/src/components/ui/DuoDropdown.tsx)                                                                       | Komponen dropdown taktil dengan outline netral/hitam & teks semibold                     |
| **Baru**   | [`src/features/builder/components/AddQuestionModal.tsx`](file:///d:/Project/quiz-app/src/features/builder/components/AddQuestionModal.tsx)                                 | Modal dialog pemilihan format mini-game baru dengan deskripsi lengkap                    |
| **Baru**   | [`src/features/builder/components/QuestionSettingsDrawer.tsx`](file:///d:/Project/quiz-app/src/features/builder/components/QuestionSettingsDrawer.tsx)                     | Modularisasi panel pengaturan soal dengan integrasi `DuoDropdown`                        |
| **Baru**   | [`changelogs/CHANGELOG-session-dc6415e3-d399-4f35-9a80-512dd180b08b.md`](file:///d:/Project/quiz-app/changelogs/CHANGELOG-session-dc6415e3-d399-4f35-9a80-512dd180b08b.md) | Berkas rangkuman perubahan khusus sesi ini                                               |
| **Diubah** | [`src/components/ui/index.ts`](file:///d:/Project/quiz-app/src/components/ui/index.ts)                                                                                     | Mengekspor komponen `DuoDropdown`                                                        |
| **Diubah** | [`src/features/builder/QuizBuilderPage.tsx`](file:///d:/Project/quiz-app/src/features/builder/QuizBuilderPage.tsx)                                                         | Integrasi dropdown timer, teks switcher hitam, modal tambah soal, dan ikon panel abu-abu |
| **Diubah** | [`src/features/dashboard/components/CreateQuizModal.tsx`](file:///d:/Project/quiz-app/src/features/dashboard/components/CreateQuizModal.tsx)                               | Integrasi `DuoDropdown` kategori dengan outline netral & aktif hitam                     |
| **Diubah** | [`index.html`](file:///d:/Project/quiz-app/index.html)                                                                                                                     | Penyempurnaan link font Nunito dengan bobot 500                                          |
