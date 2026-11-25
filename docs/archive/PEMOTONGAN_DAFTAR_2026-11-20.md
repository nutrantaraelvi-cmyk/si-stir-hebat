# Sinyal pemotongan daftar master - 20 November 2026

Menjawab "Permintaan Lintas AI" Codex → Qoder (X8 dashboard): daftar master ber-hard-cap tanpa limit+1/sinyal pemotongan.

## Perubahan

Semua daftar referensi kini meminta `limit(cap + 1)`. Jika baris melebihi batas, data tetap ditampilkan sampai batas dan pengguna melihat notifikasi eksplisit; sebelumnya halaman gagal total dengan pesan generik.

| Lokasi | Sebelum | Sesudah |
|---|---|---|
| `src/features/academic/Assessments.tsx` (opsi penugasan) | `limit(1000)`, lempar galat bila tepat 1.000 | `limit(1001)`, 1.000 pertama dipakai, `ReferenceNotice` tampil |
| `src/features/learning/ClassMaterials.tsx` (opsi penugasan) | idem | idem |
| `src/features/learning/TeachingModules.tsx` (opsi penugasan) | idem | idem |
| `src/features/schedule/Schedules.tsx` (opsi penugasan + filter kelas) | `limit(1000)` keduanya, galat bila 1.000 | `limit(1001)`, `ReferenceNotice` bila salah satu melebihi batas |
| `src/features/supervision/AcademicSupervision.tsx` (opsi guru) | `limit(1000)`, galat | `limit(1001)`, `ReferenceNotice` |
| `src/features/school/MasterData.tsx` (selector tahun ajaran) | `limit(200)` tanpa pemeriksaan | `limit(201)`, memakai `referencesTruncated` yang sudah ada |
| `src/features/attendance/Attendance.tsx` (riwayat perubahan absensi) | `limit(200)` hanya dengan teks statis | `limit(201)`, 200 pertama ditampilkan + status "Riwayat dipotong pada 200 perubahan terbaru…" |

`ReferenceNotice` (`src/components/ui/ReferenceNotice.tsx`) sudah dipakai Jurnal, Absensi, dan MasterData; tidak diubah. Tidak ada perubahan API, kontrak, RLS, migration, atau script.

## Tes

- Tes browser baru `truncated assignment options are announced instead of silently dropped` (`tests/browser/app.spec.ts`): mock 1.001 penugasan, memastikan status "Sebagian daftar referensi dipotong…" tampil, tombol "Buat asesmen" tetap aktif, dan combobox berisi 1.000 opsi + placeholder.
- Mock `mockAssessments` mendapat opsi `overflow`; perilaku default tidak berubah.

## Bukti

- `npm run check` Node v24.22.3 EXIT 0: 39 migration, lint/typecheck bersih, **137/137** tes unit/database, 26 berkas bundel (log `...\qoder-qa-2026-11-18\check-truncation.log`).
- `PLAYWRIGHT_PORT=5375 npx playwright test tests/browser/app.spec.ts`: **214/214 lulus** desktop + ponsel, 7,2 menit (log `...\browser-truncation-5375.log`).

## Batas jujur

- Notifikasi menandai pemotongan, bukan menyediakan halaman lanjutan untuk daftar referensi; untuk memilih baris di luar 1.000 pertama, administrator harus menyaring data atau memecah penugasan. Ini disebutkan di teks notifikasi.
- Angka batas adalah kebijakan tampilan, bukan pengaman otorisasi; RLS tetap penegak akses.
- Belum ada UAT akun sekolah nyata; tes memakai API tiruan.
- Entri `IMPLEMENTATION_LOG.md`/`AI_COORDINATION.md`/`PROJECT_STATUS.md` berada di worktree bersama dan tidak ikut commit Qoder.
