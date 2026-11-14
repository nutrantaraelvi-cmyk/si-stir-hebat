# Audit Performa

Tanggal: 14 November 2026. Auditor: Qoder. Basis: `03b87c0`, Node 24.22.1, build Vite 6.4.6.
Sifat: pengukuran lokal dari build dan pembacaan query; tidak ada perubahan kode, database, atau konfigurasi.

## Baseline build (terukur)

Perintah: `npm run check` (lint, TypeScript, 104/104 tes, build). Exit 0. Aset produksi:

| Aset | Ukuran | Gzip | Catatan |
| --- | ---: | ---: | --- |
| `index-*.js` | 176,31 KB | 46,09 KB | Semua route diimpor statis. |
| `vendor-*.js` | 346,45 KB | 106,44 KB | React/Router/Ikon. |
| `supabase-*.js` | 222,64 KB | 58,05 KB | Klien Supabase. |
| `pdf-fonts-*.js` | 419,57 KB | 225,08 KB | Dimuat dinamis saat ekspor PDF (C4). |
| `pdf-engine-*.js` | 790,69 KB | 296,59 KB | Dimuat dinamis; memicu peringatan Vite >500 KB. |
| `xlsx.worker-*.js` | 58,37 KB | — | Worker impor/ekspor Excel. |
| `academic-report-pdf-*.js` | 2,71 KB | 1,40 KB | Pembungkus laporan. |
| CSS | 13,15 KB | 3,34 KB | — |

Total yang diunduh untuk halaman awal (tanpa PDF/Excel): sekitar 745 KB mentah / 210 KB gzip, termasuk vendor dan Supabase. Ini wajar untuk aplikasi dashboard, tetapi route fitur belum dipisah.

## Ringkasan prioritas

| ID | Tingkat | Temuan | Usulan pemilik |
| --- | --- | --- | --- |
| P-01 | Sedang | Dashboard kepala sekolah memicu 13 permintaan PostgREST, mayoritas `count: exact`, tanpa indeks pendukung untuk filter yang dipakai | Codex |
| P-02 | Rendah | Route fitur diimpor statis; bundel awal memuat seluruh halaman | Cursor |
| P-03 | Rendah | `pdf-engine` 790,69 KB tetap memicu peringatan; hanya dimuat saat ekspor | Codex |
| P-04 | Rendah | Rekap absensi memakai fan-out 32 permintaan (dibatasi 4 paralel); masih wajar pada skala sekolah | Codex |
| P-05 | Rendah | Daftar referensi dibatasi 1000/200 baris tanpa indikator pemotongan | Cursor |

## Rincian

### P-01 — Fan-out dashboard dan count exact (Sedang)

Saat kepala sekolah membuka `/dashboard`:

- `src/app/Dashboard.tsx:55-68`: profil, 3 pengumuman terbit terbaru, `count` pengumuman terbit, dan `count` draf = 4 permintaan.
- `src/app/SchoolOverview.tsx:23`: 3 `count` (`students`, `teachers`, `school_classes` dengan `is_active=true`).
- `src/app/PrincipalOverview.tsx:10-28`: 6 `count` (empat tahap `academic_supervisions` + dua status `teaching_modules`).

Total 13 permintaan per muat ulang. Semuanya paralel dan memakai `AbortSignal`/`Promise.allSettled`, serta gagal secara jujur (angka `—`, bukan nol), jadi masalahnya bukan korelasi kebenaran melainkan beban jaringan dan `count exact`. `count exact` memaksa pemindaian yang sesuai filter.

Indeks yang belum ada untuk filter tersebut:

| Tabel | Filter | Indeks saat ini |
| --- | --- | --- |
| `announcements` | `status` | hanya `created_at desc, id` dan `created_by` |
| `academic_supervisions` | `stage` | hanya `teacher_id`, `created_by`, `updated_at` |
| `teaching_modules` | `status` | hanya `assignment_id`, `author_id`, `updated_at` |
| `students`, `teachers`, `school_classes` | `is_active` | hanya `created_by` (registri) |

Saran:

1. Ukur dulu dengan data perwakilan memakai `EXPLAIN (ANALYZE, BUFFERS)` sebelum menambah indeks.
2. Bila terbukti perlu, tambahkan indeks parsial di migration **baru** oleh Codex, misalnya `academic_supervisions(stage)`, `teaching_modules(status)`, `students(is_active)`, `teachers(is_active)`, `school_classes(is_active)`, dan `announcements(status)`. Uji lokal, cocokkan riwayat hosted, lalu minta persetujuan pemilik; jangan menerapkan langsung.
3. Alternatif yang lebih hemat permintaan: satu RPC `dashboard_overview()` yang mengembalikan JSON agregat untuk peran terkait, atau gabungkan hitungan per tabel. Perubahan ini mengubah kontrak UI dan perlu tes RLS, jadi lakukan hanya bila pengukuran menunjukkan kebutuhan.

Pada skala satu sekolah (ratusan siswa, puluhan guru/kelas), 13 permintaan ringan masih dapat diterima; temuan ini menjadi penting bila data bertambah atau dashboard dibuka berulang.

### P-02 — Belum ada pemisahan route (Rendah)

`src/app/App.tsx` mengimpor 19 komponen route secara statis. Akibatnya `index` 176,31 KB memuat halaman yang jarang dibuka (misalnya `AcademicReport`, `Attendance`, `AcademicSupervision`) sebelum pengguna membutuhkannya. Impor dinamis hanya dipakai untuk penulis Excel, `pdfmake`, laporan PDF, dan worker XLSX.

Saran: `React.lazy` + `Suspense` untuk route fitur berat, dengan fallback status yang aksesibel. Ukur ulang setelah perubahan; jangan memecah hanya demi angka bila biaya kompleksitas lebih besar. Perhatikan bahwa `Header`/`Dashboard` tetap membutuhkan helper bersama.

### P-03 — Chunk PDF (Rendah)

`pdf-engine` 790,69 KB (gzip 296,59 KB) dan `pdf-fonts` 419,57 KB hanya diunduh saat ekspor. Peringatan Vite dapat diterima sebagai konsekuensi fitur, tetapi jangan menaikkan `chunkSizeWarningLimit` untuk menyembunyikannya. Bila ekspor PDF menjadi sering, pertimbangkan memuat font sesuai kebutuhan laporan atau menghasilkan PDF di server pada iterasi terpisah.

### P-04 — Fan-out rekap absensi (Rendah)

`AttendanceReport.tsx:40-52` mengambil maksimal 32 sesi (limit 33), lalu catatan per sesi (limit 101) dalam kelompok 4 paralel. Ini pola N+1 yang dibatasi: maksimal 32 permintaan catatan, bukan per siswa. Untuk satu kelas dan 31 hari, hasilnya tetap wajar; RPC agregat dapat dipertimbangkan bila rekap lintas kelas dibutuhkan kelak. Semua permintaan memakai `AbortSignal` dan hasil parsial tidak ditampilkan.

### P-05 — Batas daftar (Rendah)

Batas 1000/200 pada dropdown referensi mencegah pengambilan tak terbatas, tetapi bila data melebihi batas, daftar tidak lengkap tanpa peringatan. Saran: minta `limit + 1`, deteksi kelebihan, dan tampilkan pesan; atau paginasi pencarian. Jangan menaikkan batas tanpa kebutuhan.

## Aspek positif

- 75 pernyataan `create index` sudah ada; kunci unik `(class_id, held_on)`, `(session_id, enrollment_id)`, dan `(assessment_id, student_id)` menopang lookup utama.
- Dashboard dan ringkasan memakai permintaan paralel dengan pembatalan saat unmount; kegagalan tidak berubah menjadi angka nol.
- Daftar utama memakai paginasi; impor/ekspor menggunakan worker dan batas ukuran.
- Tidak ditemukan pengambilan seluruh tabel tanpa batas pada halaman daftar yang diperiksa.

## Batas audit

Tidak ada profiling runtime, Lighthouse, atau pengukuran dengan data sekolah nyata. Ukuran build berasal dari Vite pada mesin ini dan dapat berbeda di CI. Angka permintaan dashboard dihitung dari kode, bukan dari log jaringan browser.
