# Delivery Gate — Q1 UI (A-06/P-05, A-07, P-02, A-03/A-04)

Tanggal: 20 November 2026. Penulis: Qoder.
Cakupan: perubahan UI/struktur pada working tree `ai/qoder-docs-sync` (pesan pemotongan referensi, pemindahan konteks auth, rute lazy + Suspense, pembersihan folder/ekspor mati). Tidak mencakup modul baru yang belum berstatus REVIEW atau UAT akun sekolah.
Arah desain: `docs/DESIGN_READ.md` (ENERGY 2 / RHYTHM 2 / MOTION 1).

> Catatan status (ditambahkan Qoder, 20 November 2026): angka eksekusi di bawah adalah bukti run saat dokumen ini dibuat (216/216 port 5349, lalu 228/228 port 5358). Angka kanonik terkini adalah `npm run check` EXIT 0 Node v24.22.3 dengan 137/137 unit/database, 39 migration, build 1.781 modul (log `...\check-5401.log`) dan suite browser penuh **312/312** port 5401 (`...\browser-full-5401.log`); rincian di `docs/QA_COVERAGE.md`.

## Bukti eksekusi

- `npm run check` (Node v24.22.3, 20 November 2026): `Migration OK: 32 berkas`, lint, typecheck, **127/127** tes unit/database, build, `Bundel produksi OK: 26 berkas JavaScript tanpa akun demo`. Log: `C:\Users\axioo\AppData\Local\Temp\qoder-qa-2026-11-18\check-2026-11-20-brief-env.log`.
- Suite browser penuh (Node v24.22.3, `PLAYWRIGHT_PORT=5349`, `--trace=off`): **216/216 lulus** dalam 6,1 menit; tidak ada `ENOENT`. Log: `C:\Users\axioo\AppData\Local\Temp\qoder-qa-2026-11-18\browser-2026-11-20-node24-port5349.log`.
- Selama run suite tidak ada perubahan pada `src/` atau `supabase/` (diperiksa dengan `find -newermt`).

## Block 1 — Hard Gate

Semua jawaban **tidak**:

- R-02 PASS: tidak ada karakter em dash pada `src/**/*.ts` dan `src/**/*.tsx` (grep kosong). Catatan 20 November 2026: satu em dash pada legenda formulir `/kebiasaan` ditemukan setelah gate ini ditulis dan sudah diganti titik dua (commit `419f812`); `src` kini bersih dan `habits.spec.ts` lulus 10/10 port 5417.
- R-03 PASS: tidak ada overflow horizontal; suite desktop 1280×900 dan ponsel 390×844 lulus, termasuk skenario tabel absensi dan laporan akademik.
- R-17 PASS: tidak ada statistik pemasaran; angka di layar berasal dari data Supabase atau label `N/A`/`Belum diisi`.
- R-18 PASS: tidak ada testimoni fiktif.
- R-23 PASS: tidak ada aset visual baru; logo berupa blok huruf "S" di Header, tanpa gambar hasil generate.
- R-24 PASS: tautan navigasi menuju rute yang terdaftar; tes beranda yang diperbarui memeriksa tautan 7 Kebiasaan yang kini nyata dan lulus.
- R-25 PASS: `ReferenceNotice` memakai teks `--ink` di atas `--sand` dengan rasio **11,62:1**; token lain sudah AA pada sesi sebelumnya.
- R-26 PASS: tidak ada kontrol mati; suite mengeklik alur masuk, keluar, simpan, terbitkan, dan impor.
- R-27 PASS: setiap halaman memakai `LoadingState`, `ErrorNotice`, dan `EmptyState`; pesan pemotongan daftar memakai `role="status"`.
- R-28 PASS: tidak ada FAQ.
- R-32 PASS: kontrol memakai elemen native (button, a, select, input), tanpa jebakan fokus, dan `:focus-visible` 3px aksen pada `src/styles/global.css:39`.
- R-33 PASS: tidak ada patch lewat skrip eksternal; perubahan ada di sumber.
- R-34 PASS: tidak ada toggle tema; `color-scheme` dikunci terang dengan alasan di `docs/DESIGN_READ.md`.
- R-35 PASS: build dijalankan dan seluruh 216 skenario browser dieksekusi dengan log.
- R-36 PASS: tidak ada klaim keamanan, kepatuhan, atau performa tanpa sumber.
- R-37 PASS: arah desain terdokumentasi (brief pemilik, komentar sistem desain, `docs/DESIGN_READ.md`); dial dinyatakan eksplisit.
- R-38 PASS: konten contoh berlabel "Data Contoh"/mock API; tidak ada data sekolah nyata.
- R-39 PASS: `lang="id"` dan `<title>` ada di `index.html`; kontrol native dengan label dan nama aksesibel; tanpa animasi lebih dari 5 detik.
- R-40 PASS: tidak ada media baru; tidak ada klaim performa yang tidak diukur.

## Block 2 — Purpose-Gate

- R-01 PASS: tanpa gradien/glow.
- R-04 PASS dengan alasan: ikon Lucide menandai jenis layanan pada navigasi dan kartu (buku, kalender, centang, pesan); alasan tertulis di `docs/DESIGN_READ.md`.
- R-06 PASS dengan alasan: label `eyebrow` huruf kapital berjarak lebar meniru kicker buku catatan sekolah; bagian dari motif ledger, bukan pilihan default.
- R-07 PASS: tanpa pola grid/dot.
- R-08 PASS: tanpa panah dekoratif pada tombol.
- R-09 PASS: lencana hanya untuk status data (terbit/arsip), bukan label pemasaran.
- R-10 PASS: tanpa glassmorphism.
- R-12 PASS dengan alasan: bayangan offset 3-5px meniru tumpukan kertas ledger; diterapkan pada kartu utama dan tombol tindakan, bukan setiap elemen.
- R-13 PASS: tanpa glow.
- R-14 PASS dengan alasan: kartu peran berukuran seragam karena berfungsi sebagai baris ledger yang dapat dipindai cepat (RHYTHM 2).
- R-19 PASS: tanpa animasi template.
- R-22 PASS: tanpa ilustrasi generik.

## Block 3 — Liveliness

- Dial eksplisit: ya, `docs/DESIGN_READ.md` (ENERGY 2 / RHYTHM 2 / MOTION 1).
- Konsisten dengan dial: ya, tanpa animasi, blok berulang, aksen tunggal terakota.
- Titik fokus per layar: ya, judul board/hero dan satu aksi utama.
- Whitespace struktural: ya, `board` dan `spaces` memisahkan blok.
- Satu aksen: ya, `--accent` terakota.
- Motif identitas: ya, garis 2px + bayangan offset + kicker ledger.
- Design Read dideklarasikan: ya, `docs/DESIGN_READ.md`.

## Block 4 — Craftsmanship & Quality Locks

Semua jawaban **tidak**:

- C-1/C-2/C-3 PASS: setiap elemen punya fungsi dan sumber konten; pesan pemotongan muncul hanya saat batas tercapai.
- C-4 PASS: suite desktop dan ponsel lulus; tanpa tema ganda; navigasi tanpa tetikus memakai kontrol native dan fokus terlihat.
- C-5 PASS: tidak ada testimoni/statistik/klaim fabrikasi.
- R-05 PASS: struktur mengikuti ledger sekolah, bukan template hero+cards+3 langkah.
- R-11 PASS: radius bervariasi (tombol 14px, kartu 18-20px, lencana 20px).
- R-15 PASS: label aksi spesifik dan berbahasa Indonesia ("Mulai sesi hari ini", "Terbitkan materi").
- R-16 PASS: tanpa istilah pemasaran AI.
- R-20 PASS: identitas ledger sekolah tetap terbaca tanpa logo.
- R-21 PASS: tanpa mode gelap paksa; tanpa toggle yang diminta brief.
- R-29 PASS: ink/paper/mist + satu aksen terakota; warna status semantik terbatas.
- R-30 PASS: bukan tiruan produk populer.
- R-31 PASS: keputusan visual utama dijelaskan satu baris di `docs/DESIGN_READ.md`.

## Lampiran — Pusat notifikasi dan Laporan ketidakhadiran (20 November 2026)

- Cakupan tambahan: rute `/notifikasi` (`src/features/notifications/NotificationCenter.tsx`), tautan navigasi Header, dan `tests/browser/notifications.spec.ts` (2 tes × desktop + ponsel).
- Cakupan tambahan: rute `/laporan-ketidakhadiran` (`src/features/parents/AbsenceReports.tsx`) memakai `src/features/parents/api/absence-reports` dan RPC baca-saja `habit_students` untuk nama murid; `tests/browser/absence-reports.spec.ts` (2 tes × desktop + ponsel).
- Bukti: angka kanonik mengikuti bagian Pembaruan di bawah; run awal gate tercatat sebagai riwayat tanpa dipakai untuk klaim baru.
- R-02 PASS: tidak ada em dash pada berkas baru. R-03 PASS: skenario baru lulus di 1280×900 dan 390×844. R-17 PASS: tidak ada angka rekaan; isi berasal dari tabel `notifications`/`guardian_absence_reports` atau label kosong. Status loading, kosong, galat, dan sukses tersedia; galat tanda-baca dan kirim laporan mempertahankan data serta ID percobaan; konflik revisi pemeriksaan 40001 meminta muat ulang.
- Belum: pembuatan notifikasi oleh modul lain belum diuji end-to-end; kontrak API notifications dan absence-reports belum bertanda REVIEW di papan koordinasi; migration terkait belum hosted.

## Lampiran — 7 Kebiasaan harian (20 November 2026)

- Cakupan: `/kebiasaan` (`src/features/student-habits/StudentHabits.tsx`) memakai `src/features/student-habits/api`; tombol kebiasaan 56px dengan `aria-pressed`, pemilihan murid lewat RPC baca-saja `habit_students`, validasi guru wajib catatan, dan riwayat 25 baris per halaman. Tes: `tests/browser/habits.spec.ts` (2 tes × desktop + ponsel).
- Bukti: `npm run check` 127/127 dengan 32 migration (log `...\check-2026-11-20-brief-env.log`); suite penuh **228/228** lulus (port 5358, log `...\browser-2026-11-20-brief-5358.log`).
- R-02 PASS: tanpa em dash pada berkas baru. R-03 PASS: skenario lulus di 1280×900 dan 390×844 tanpa overflow horizontal. R-15/R-17 PASS: label aksi berbahasa Indonesia; tidak ada angka rekaan. Status loading, kosong, galat, dan sukses tersedia; galat simpan/validasi mempertahankan isian dan catatan.
- Pembaruan 20 November 2026: harness browser diperbaiki memakai host dan kunci publishable uji yang lolos validasi config. Rekap 7 catatan terakhir kini terverifikasi browser; gate mengacu pada run 228/228 port 5358. UAT akun sekolah tetap belum dijalankan.
- Belum: pembeda "belum diisi" vs "tidak dilakukan" (PD-12); kontrak `student-habits` belum bertanda REVIEW; migration terkait belum hosted; UAT akun nyata.

## Status

**PASS** untuk cakupan di atas, termasuk lampiran Pusat notifikasi, Laporan ketidakhadiran, dan 7 Kebiasaan. Gate ini tidak menyatakan UAT akun sekolah, kesiapan operasional, atau keamanan hosted; hal tersebut tetap terbuka.
