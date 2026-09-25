# Catatan Perubahan Sesi (Session Changelog)

- **ID Sesi (Conversation ID)**: `54979dd5-cb05-4744-86ca-a0d7cc1ff3ae`
- **Waktu Pelaksanaan**: 26 September 2026, 00:40 WIB (UTC+7)
- **Lingkup Perubahan**: Penghapusan Input Redundan True/False, Standardisasi Label Kunci Jawaban, dan Implementasi Sistem WYSIWYG Rumus Matematika (KaTeX) Berdesain Taktil Duolingo
- **Status Build & Typecheck**: Passed (TypeScript `tsc -b && vite build`: 0 errors)

---

## Ringkasan Eksekutif

Sesi ini menyelesaikan rangkaian optimasi antarmuka dan penambahan sistem editor rumus matematika interaktif pada aplikasi **EduPlay Quiz Studio**:

1. **Eliminasi Redundansi Pernyataan True/False**: Menghapus kolom input textarea _"Teks Pernyataan / Soal"_ di dalam formulir editor _True or False_ (`TrueFalseEditor`) karena fungsi input teks pertanyaan sudah terpusat di kolom _"Pertanyaan"_ bagian atas kartu soal.
2. **Standardisasi Label "Kunci Jawaban"**: Menyeragamkan seluruh label masukan jawaban benar pada seluruh jenis/format soal (True/False, Pilihan Ganda, Anagram, Spell the Word, Hangman, Unjumble, Crossword, Wordsearch, Labelled Diagram, Sample) menjadi label konsisten **"Kunci Jawaban"**.
3. **Sistem Virtual Keyboard Palet Simbol Matematika (Tanpa Preset)**:
   - Mengubah modal rumus matematika [`MathFormulaModal.tsx`](file:///d:/Project/quiz-app/src/components/common/MathFormulaModal.tsx) menjadi papan tombol simbol interaktif dengan 3 tab: **Basic**, **Greek**, dan **Advance** (tanpa preset statis), dengan baris angka dan variabel instan.
   - Setiap klik tombol simbol langsung menyisipkan notasi LaTeX ke dalam input di posisi kursor secara otomatis.
4. **Pembersihan Header & Tombol Ikon Rumus Terapung (`fx`) di Textarea**:
   - Menghapus seluruh tombol chip di atas textarea (`½`, `x²`, `√x`, `π`, `±`, `×`, `÷`, `+ Rumus`).
   - Meletakkan tombol ikon tanpa teks **`fx`** di sudut kanan bawah bagian dalam textarea [`DuoMathTextarea.tsx`](file:///d:/Project/quiz-app/src/components/common/DuoMathTextarea.tsx) dengan styling taktil responsif.
5. **Mekanisme Edit Rumus Langsung (Click-to-Edit)**:
   - Pengguna cukup mengeklik rumus di dalam textarea atau di kotak _"Pratinjau Rumus"_ untuk langsung membuka modal dan mengedit rumus yang bersangkutan.
6. **Optimasi Visual Pratinjau & Penjajaran Ikon Tombol**:
   - Kontainer pratinjau rumus dibuat bersih (`bg-slate-50/90 rounded-xl`) tanpa outline maupun inner shadow, dengan font KaTeX lebih besar (`1.22em`).
   - Memastikan tombol aksi pada modal menyematkan ikon di sebelah kiri teks secara horizontal (`iconPosition="left"`).

## 1. Rincian Perubahan (Changes)

### A. Eliminasi Redundansi Form Soal True/False

- **Berkas**: [`src/plugins/questions/true-false/TrueFalseEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/true-false/TrueFalseEditor.tsx)
  - Menghapus komponen input textarea _"Teks Pernyataan / Soal"_ beserta teks panduannya.
  - Menghapus handler dan referensi state `statement` lokal.
  - Mengintegrasikan `DuoMathTextarea` untuk kolom penjelasan edukatif.
- **Berkas**: [`src/plugins/questions/true-false/types.ts`](file:///d:/Project/quiz-app/src/plugins/questions/true-false/types.ts)
  - Mengubah atribut `statement?: string` menjadi opsional pada interface `TrueFalseContent` untuk menjaga backward-compatibility kuis lama.
- **Berkas**: [`src/plugins/questions/true-false/index.ts`](file:///d:/Project/quiz-app/src/plugins/questions/true-false/index.ts)
  - Menghapus nilai default hardcoded pernyataan contoh (_"Matahari terbit dari arah timur."_) pada `defaultTrueFalseContent`.
- **Berkas**: [`src/plugins/questions/true-false/TrueFalsePlayer.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/true-false/TrueFalsePlayer.tsx)
  - Mengadaptasi pembacaan pernyataan dengan fallback cerdas ke `titlePrompt` dan merender menggunakan `DuoMathRenderer`.
- **Berkas**: [`src/features/presenter/PresenterKioskPage.tsx`](file:///d:/Project/quiz-app/src/features/presenter/PresenterKioskPage.tsx)
  - Memastikan opsi `_hideStatement` otomatis aktif saat `promptText` tampil pada layar utama Kiosk untuk mencegah duplikasi teks di area permainan.
- **Berkas**: [`src/features/builder/QuizBuilderPage.tsx`](file:///d:/Project/quiz-app/src/features/builder/QuizBuilderPage.tsx)
  - Meneruskan `titlePrompt` dan fallback `statement` pada mode pratinjau siswa (_Preview Runner_).

### B. Standardisasi Label Kunci Jawaban di Seluruh Format Soal

Seluruh label penentuan jawaban pada editor format soal kini menggunakan label seragam **"Kunci Jawaban"**:

- **True or False** ([`TrueFalseEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/true-false/TrueFalseEditor.tsx)): `Kunci Jawaban Yang Benar` &rarr; **`Kunci Jawaban`**
- **Pilihan Ganda** ([`MultipleChoiceEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/multiple-choice/MultipleChoiceEditor.tsx)): `Daftar Pilihan Jawaban` &rarr; **`Kunci Jawaban`**
- **Anagram** ([`AnagramEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/anagram/AnagramEditor.tsx)): `Kata Target Anagram` &rarr; **`Kunci Jawaban`**
- **Spell the Word** ([`SpellWordEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/spell-the-word/SpellWordEditor.tsx)): `Target Kata Benar` &rarr; **`Kunci Jawaban`**
- **Hangman** ([`HangmanEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/hangman/HangmanEditor.tsx)): `Kata Rahasia Tebakan` &rarr; **`Kunci Jawaban`**
- **Susun Kalimat (Unjumble)** ([`UnjumbleEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/unjumble/UnjumbleEditor.tsx)): `Kalimat Lengkap Yang Benar` &rarr; **`Kunci Jawaban`**
- **Teka-Teki Silang (Crossword)** ([`CrosswordEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/crossword/CrosswordEditor.tsx)): `Kata Kunci (Jawaban Huruf Kapital)` &rarr; **`Kunci Jawaban (Huruf Kapital)`**
- **Cari Kata (Wordsearch)** ([`WordsearchEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/wordsearch/WordsearchEditor.tsx)): `Daftar Kata Yang Harus Ditemukan` &rarr; **`Kunci Jawaban`**
- **Diagram Berlabel** ([`DiagramEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/labelled-diagram/DiagramEditor.tsx)): `Daftar Label Target` &rarr; **`Kunci Jawaban Pin`**
- **Sample Plugin** ([`_sample/index.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/_sample/index.tsx)): `Kunci Jawaban Yang Benar` &rarr; **`Kunci Jawaban`**

### C. Implementasi WYSIWYG Rumus Matematika (KaTeX & Duolingo Styling)

- **Komponen Baru**:
  - [`src/components/common/DuoMathRenderer.tsx`](file:///d:/Project/quiz-app/src/components/common/DuoMathRenderer.tsx): Parser dan renderer token teks & LaTeX KaTeX yang aman, cepat, dan responsif.
  - [`src/components/common/MathFormulaModal.tsx`](file:///d:/Project/quiz-app/src/components/common/MathFormulaModal.tsx): Modal interaktif penyusun rumus dengan 5 kategori templat rumus dan visual preview real-time.
  - [`src/components/common/DuoMathTextarea.tsx`](file:///d:/Project/quiz-app/src/components/common/DuoMathTextarea.tsx): Area teks soal bergaya WYSIWYG dengan tombol rumus cepat, tombol modal, switcher mode editor/preview, dan strip pratinjau otomatis.
- **Styling KaTeX Duolingo ([`src/index.css`](file:///d:/Project/quiz-app/src/index.css))**:
  - Rumus inline (`.duo-math-inline`): berbentuk pill halus bernuansa biru muda (`#f0f9ff`) dengan border 3D taktil (`border-b-[3px] border-b-sky-300`) dan font tebal kontras tinggi.
  - Rumus blok (`.duo-math-display`): kartu masif bernuansa gradien dengan border 3D (`border-b-[5px]`).
  - Adaptasi dinamis kartu berwarna: saat rumus berada di dalam kartu aktif (hijau, merah, biru), formula otomatis beradaptasi menjadi putih transparan (`bg-white/20 text-white`) tanpa tabrakan warna.
- **Pilihan Ganda Berumus**: Setiap baris opsi (A, B, C, D, E) pada [`MultipleChoiceEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/multiple-choice/MultipleChoiceEditor.tsx) kini memiliki tombol `∑` untuk menyisipkan rumus dan badge hasil pratinjau instan.

---

## 2. Berkas yang Terpengaruh (Files Impacted)

| Status     | Berkas                                                                                                                                                                     | Deskripsi                                                                      |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| **Baru**   | [`src/components/common/DuoMathRenderer.tsx`](file:///d:/Project/quiz-app/src/components/common/DuoMathRenderer.tsx)                                                       | Komponen renderer rumus KaTeX berdesain Duolingo dengan dukungan click-to-edit |
| **Baru**   | [`src/components/common/MathFormulaModal.tsx`](file:///d:/Project/quiz-app/src/components/common/MathFormulaModal.tsx)                                                     | Modal keyboard palet simbol matematika interaktif (Basic, Greek, Advance)      |
| **Baru**   | [`src/components/common/DuoMathTextarea.tsx`](file:///d:/Project/quiz-app/src/components/common/DuoMathTextarea.tsx)                                                       | Editor soal dengan tombol terapung `fx`, live preview, dan edit rumus          |
| **Baru**   | [`changelogs/CHANGELOG-session-54979dd5-cb05-4744-86ca-a0d7cc1ff3ae.md`](file:///d:/Project/quiz-app/changelogs/CHANGELOG-session-54979dd5-cb05-4744-86ca-a0d7cc1ff3ae.md) | Dokumentasi sesi perubahan lengkap                                             |
| **Diubah** | [`package.json`](file:///d:/Project/quiz-app/package.json)                                                                                                                 | Menambahkan dependency `katex` dan `@types/katex`                              |
| **Diubah** | [`src/index.css`](file:///d:/Project/quiz-app/src/index.css)                                                                                                               | Import CSS KaTeX & kelas styling taktil Duolingo math                          |
| **Diubah** | [`src/components/common/index.ts`](file:///d:/Project/quiz-app/src/components/common/index.ts)                                                                             | Export komponen math baru                                                      |
| **Diubah** | [`src/features/builder/QuizBuilderPage.tsx`](file:///d:/Project/quiz-app/src/features/builder/QuizBuilderPage.tsx)                                                         | Integrasi `DuoMathTextarea` untuk soal & render rumus di preview               |
| **Diubah** | [`src/plugins/questions/multiple-choice/MultipleChoiceEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/multiple-choice/MultipleChoiceEditor.tsx)             | Tombol rumus per opsi, live preview opsi, dan `DuoMathTextarea` pembahasan     |
| **Diubah** | [`src/plugins/questions/multiple-choice/MultipleChoicePlayer.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/multiple-choice/MultipleChoicePlayer.tsx)             | Render rumus pada teks opsi dan soal di player siswa                           |
| **Diubah** | [`src/plugins/questions/true-false/TrueFalseEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/true-false/TrueFalseEditor.tsx)                                 | Hapus textarea redundan, integrasi `DuoMathTextarea` pada penjelasan           |
| **Diubah** | [`src/plugins/questions/true-false/TrueFalsePlayer.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/true-false/TrueFalsePlayer.tsx)                                 | Render rumus pada pernyataan kuis                                              |
| **Diubah** | [`src/features/presenter/PresenterKioskPage.tsx`](file:///d:/Project/quiz-app/src/features/presenter/PresenterKioskPage.tsx)                                               | Render rumus pada layar proyektor kelas utama                                  |
| **Diubah** | [`src/features/builder/components/SortableQuestionItem.tsx`](file:///d:/Project/quiz-app/src/features/builder/components/SortableQuestionItem.tsx)                         | Render rumus pada judul soal di navigasi sidebar                               |
| **Diubah** | [`src/components/common/BottomSheetFeedback.tsx`](file:///d:/Project/quiz-app/src/components/common/BottomSheetFeedback.tsx)                                               | Render rumus pada pesan & pembahasan solusi                                    |
| **Diubah** | [`src/plugins/questions/true-false/types.ts`](file:///d:/Project/quiz-app/src/plugins/questions/true-false/types.ts)                                                       | Atribut `statement` menjadi opsional                                           |
| **Diubah** | [`src/plugins/questions/true-false/index.ts`](file:///d:/Project/quiz-app/src/plugins/questions/true-false/index.ts)                                                       | Reset default string pernyataan                                                |
| **Diubah** | [`src/plugins/questions/anagram/AnagramEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/anagram/AnagramEditor.tsx)                                           | Standardisasi label jadi "Kunci Jawaban"                                       |
| **Diubah** | [`src/plugins/questions/spell-the-word/SpellWordEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/spell-the-word/SpellWordEditor.tsx)                         | Standardisasi label jadi "Kunci Jawaban"                                       |
| **Diubah** | [`src/plugins/questions/hangman/HangmanEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/hangman/HangmanEditor.tsx)                                           | Standardisasi label jadi "Kunci Jawaban"                                       |
| **Diubah** | [`src/plugins/questions/unjumble/UnjumbleEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/unjumble/UnjumbleEditor.tsx)                                       | Standardisasi label jadi "Kunci Jawaban"                                       |
| **Diubah** | [`src/plugins/questions/crossword/CrosswordEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/crossword/CrosswordEditor.tsx)                                   | Standardisasi label jadi "Kunci Jawaban (Huruf Kapital)"                       |
| **Diubah** | [`src/plugins/questions/wordsearch/WordsearchEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/wordsearch/WordsearchEditor.tsx)                               | Standardisasi label jadi "Kunci Jawaban"                                       |
| **Diubah** | [`src/plugins/questions/labelled-diagram/DiagramEditor.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/labelled-diagram/DiagramEditor.tsx)                         | Standardisasi label jadi "Kunci Jawaban Pin"                                   |
| **Diubah** | [`src/plugins/questions/_sample/index.tsx`](file:///d:/Project/quiz-app/src/plugins/questions/_sample/index.tsx)                                                           | Standardisasi label jadi "Kunci Jawaban"                                       |

### D. Penyempurnaan Tampilan Editor & Pratinjau Rumus (Refinement)

1. **Penghapusan Toggle Tulis & WYSIWYG**:
   - Menghapus tab toggle switcher `Tulis` vs `WYSIWYG` pada [`DuoMathTextarea.tsx`](file:///d:/Project/quiz-app/src/components/common/DuoMathTextarea.tsx). Input textarea kini selalu aktif, dan pratinjau rumus otomatis muncul rapi di bawahnya saat teks memuat notasi rumus matematika (`$..$`).
2. **Optimasi Pratinjau & Radius Kontainer Rumus**:
   - Ukuran font rumus ditingkatkan (`font-size: 1.22em` pada KaTeX, `text-base sm:text-lg lg:text-xl` pada kontainer pratinjau).
   - Radius kontainer per rumus matematika diperkecil menjadi `0.375rem` (`rounded-md`).
   - Kontainer pratinjau dibuat bersih dan datar (`bg-slate-50/90 rounded-xl`) tanpa garis outline maupun inner shadow/box shadow.
3. **Pembersihan Ikon & Copywriting**:
   - Ikon bintang (`Sparkles`) di samping judul pratinjau dihilangkan sepenuhnya baik di editor soal maupun modal rumus.
   - Copywriting diseragamkan secara konsisten menjadi **"Pratinjau Rumus"**.

### E. Keyboard Palet Simbol Matematika, Tombol Ikon Terapung (Floating), & Mekanisme Klik untuk Mengedit Rumus

1. **Palet Simbol Interaktif / Virtual Keypad (Sesuai Referensi Gambar 1)**:
   - Menghapus sistem preset rumus di [`MathFormulaModal.tsx`](file:///d:/Project/quiz-app/src/components/common/MathFormulaModal.tsx).
   - Menyediakan 3 tab kategori utama: **Basic**, **Greek**, dan **Advance** dengan garis aksen aktif yang presisi.
   - Mengelompokkan tombol simbol:
     - _Basic_: Kolom Aljabar/Kalkulus ($a^2$, $a^x$, $a_x$, $\sqrt[n]{a}$, $\frac{a}{x}$, $\frac{dx}{dy}$, $\int$, $\sum$, dll.), Kolom Operator ($+$, $-$, $\pm$, $\times$, $\div$, $=$, $\neq$, $\le$, $\ge$, dll.), Kolom Geometri/Simbol ($\pi$, $\theta$, $\Delta$, $\nabla$, $\parallel$, $\perp$, $\angle$, $\infty$, dll.), dan Kolom Huruf Yunani Dasar ($\alpha$, $\beta$, $\gamma$, $\zeta$, $\lambda$, $\mu$, dll.).
     - _Greek_: Huruf Yunani lengkap (huruf kecil & huruf kapital).
     - _Advance_: Trigonometri ($\sin, \cos, \tan, \cot, \csc$), Himpunan & Logika ($\in, \notin, \subset, \cup, \cap, \forall, \exists$), Vektor & Matriks ($\vec{v}, \hat{u}, \begin{pmatrix} a & b \\ c & d \end{pmatrix}$).
   - Baris karakter cepat untuk angka dan variabel umum (`x`, `y`, `z`, `a`, `b`, `c`, `0-9`, tanda kurung).
   - Setiap tombol simbol langsung menyisipkan cuplikan LaTeX ke input di posisi kursor secara otomatis dengan efek suara `pop` yang memuaskan.

2. **Pembersihan Header & Tombol Ikon Terapung di Dalam Textarea (Sesuai Referensi Gambar 2)**:
   - Menghapus seluruh tombol chip yang sebelumnya ada di atas textarea (`½`, `x²`, `√x`, `π`, `±`, `×`, `÷`, `+ Rumus`).
   - Meletakkan tombol ikon tanpa teks **`fx`** tepat di sudut kanan bawah bagian dalam textarea [`DuoMathTextarea.tsx`](file:///d:/Project/quiz-app/src/components/common/DuoMathTextarea.tsx) dengan styling taktil (`absolute bottom-3 right-3`).
   - Padding textarea disesuaikan (`pb-12 pr-12`) agar teks tidak pernah tertimpa oleh tombol.

3. **Mekanisme Edit Rumus Langsung (Click-to-Edit)**:
   - **Di Textarea**: Saat pengguna mengeklik teks rumus (formula `$..$` atau `$$..$$`) di dalam textarea, sistem mendeteksi indeks kursor (`selectionStart`) dan secara otomatis membuka modal untuk mengedit rumus tersebut.
   - **Di Pratinjau Rumus**: Komponen [`DuoMathRenderer.tsx`](file:///d:/Project/quiz-app/src/components/common/DuoMathRenderer.tsx) kini mendukung prop `onFormulaClick`. Pengguna juga dapat langsung mengeklik rumus pada kotak pratinjau untuk membuka modal edit.
   - Saat disimpan di modal, rumus lama langsung digantikan dengan rumus hasil editan secara mulus.

4. **Koreksi Penjajaran Ikon Tombol Aksi (Horizontal Layout)**:
   - Memperbaiki pemanggilan `<TactileButton>` pada tombol simpan/perbarui rumus di [`MathFormulaModal.tsx`](file:///d:/Project/quiz-app/src/components/common/MathFormulaModal.tsx).
   - Menggunakan prop `icon={<Check className="w-4 h-4 stroke-[3]" />}` dan `iconPosition="left"` bawaan `TactileButton`, memastikan ikon `<Check>` selalu berada rapi sejajar secara horizontal di sisi kiri teks label tanpa pernah terputus atau bertumpuk di atas teks.
