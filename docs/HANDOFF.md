# HANDOFF

Dokumen ini adalah antrean kerja lintas agen untuk temuan audit 14 November 2026. Papan status utama tetap [AI_COORDINATION.md](AI_COORDINATION.md); ambil satu tugas, tulis kepemilikan di papan, dan jangan mengerjakan wilayah agen lain tanpa mencatatnya.

## Keadaan saat handoff

- Basis: `03b87c0` (`ai/codex-pdf-splitting`), Node 24.22.1.
- `npm run check` lulus: lint, TypeScript, 104/104 tes, build. Build masih memperingatkan `pdf-engine` 790,69 KB; font PDF 419,57 KB. Detail di [AUDIT_PERFORMA.md](AUDIT_PERFORMA.md).
- `npx playwright test --list` melaporkan 180 tes browser, tetapi **tidak ada log run penuh** di repo. Jangan menulis "180/180 lulus" tanpa artefak.
- Working tree memuat perubahan `tests/browser/app.spec.ts` milik agen lain (staged + unstaged) dan `test-results-t1.log`. Jangan menimpa, menghapus, atau meng-commit keduanya.
- 24 migration lokal; 23 hosted. Berkas ke-24 (`student_habits`) belum diterapkan dan tidak boleh diterapkan tanpa persetujuan pemilik.
- Laporan audit: [AUDIT_KEAMANAN.md](AUDIT_KEAMANAN.md), [AUDIT_ARSITEKTUR.md](AUDIT_ARSITEKTUR.md), [AUDIT_PERFORMA.md](AUDIT_PERFORMA.md), [AUDIT_DATA_ANAK.md](AUDIT_DATA_ANAK.md), [AUDIT_KONSISTENSI_DOKUMEN.md](AUDIT_KONSISTENSI_DOKUMEN.md).

## Antrean tugas

| ID | Prioritas | Tugas | Usulan pemilik | Berkas utama | Kriteria selesai |
| --- | --- | --- | --- | --- | --- |
| H-01 | Sedang | Batasi mode demo ke pengembangan; gagalkan build produksi tanpa konfigurasi Supabase valid; keluarkan kredensial demo dari bundel produksi | Codex + Cursor, keputusan pemilik | `src/lib/demo-auth.ts`, `src/lib/supabase.ts`, `src/app/Account.tsx`, skrip build | Build produksi tanpa env tidak menampilkan login demo; tes membuktikan; keputusan dicatat di `DECISIONS.md` |
| H-02 | Sedang | Tambah tes policy Storage `supervision-evidence` untuk kepala sekolah, guru terbit/belum terbit, guru lain, siswa, wali, pending, nama folder rusak | Codex/Copilot | `supabase/migrations/20261111082822_supervision_evidence.sql`, tes database | Tes gagal pada policy longgar dan lulus pada policy benar; hasil dilampirkan |
| H-03 | Mengikuti K1–K4 | Tindak lanjuti `SECURITY_REVIEW.md`: K1 `todos`, K2 `student_habits`, K3 draf umpan balik, K4 Storage | Codex | migration terkait | Setiap temuan ditutup atau keputusan risiko diterima pemilik; perubahan hosted hanya lewat persetujuan |
| H-04 | Sedang | Selaraskan navigasi dengan RLS: Materi/Tugas/Asesmen tidak ditampilkan untuk peran yang tidak mendapat baris; tambah helper izin per domain | Cursor | `src/app/Header.tsx`, `src/app/Dashboard.tsx`, `src/lib/*`, tes browser | Administrator/kepala sekolah tidak melihat tautan mati; tes per peran lulus |
| H-05 | Sedang | Perbaiki teks beranda yang menjanjikan kebiasaan siswa dan komunikasi | Cursor | `src/app/App.tsx:24-25` | Teks hanya menyebut fitur tersedia atau diberi label jelas; cocok dengan README |
| H-06 | Sedang | Rapikan dokumen: angka tes kanonik 104, urutan `PROJECT_STATUS`, judul mojibake, klaim "tujuh lampiran", baseline AGENTS | Qoder | `AGENTS.md`, `docs/PROJECT_STATUS.md`, `docs/AI_COORDINATION.md` | Tidak ada angka 101 sebagai status terkini; kronologi dan acuan konsisten |
| H-07 | Sedang | Putuskan dan dokumentasikan retensi/penghapusan/anonymisasi data siswa, termasuk bukti supervisi dan snapshot absensi | Pemilik + Codex | `docs/DECISIONS.md` | Keputusan tertulis per kategori data; prosedur operator dan pengujian lokal disetujui |
| H-08 | Sedang | Ukur lalu optimalkan 13 permintaan dashboard kepala sekolah; pertimbangkan indeks parsial atau RPC agregat | Codex | `src/app/Dashboard.tsx`, `SchoolOverview.tsx`, `PrincipalOverview.tsx`, migration baru | Ada `EXPLAIN` sebelum/sesudah dengan data perwakilan; tidak ada perubahan hosted tanpa persetujuan |
| H-09 | Rendah | Hapus folder fitur kosong, ekspor mati, dan pindahkan `schoolToday` ke utilitas bersama | Cursor | `src/features/*`, `src/lib`, `src/utils` | `tsc`/lint lulus; tidak ada impor rusak; perubahan terpisah dari fitur |
| H-10 | Rendah | Beri indikator saat daftar referensi 1000/200 terpotong | Cursor | `MasterData.tsx`, `Attendance.tsx`, `Journals.tsx` | Pengguna melihat peringatan pemotongan; batas tidak dinaikkan tanpa alasan |
| H-11 | Sedang | Lampirkan log/artefak run browser penuh untuk T1 dan samakan angka tes di ringkasan | Copilot | `tests/browser/app.spec.ts`, log run | Log run penuh tersimpan di repo/artefak; status papan diperbarui dengan bukti |
| H-12 | Rendah | Tinjau ulang audit setelah H-01/H-02/H-03/H-04 selesai | Qoder | `docs/AUDIT_*.md`, `HANDOFF.md` | Temuan yang berubah ditandai tertutup dengan bukti; tidak ada klaim aman |

## Aturan pengambilan tugas

1. Pilih satu ID, catat di baris papan `AI_COORDINATION.md` (pemilik + branch), lalu kerjakan di branch sendiri. Jangan commit ke `main`; hanya lead yang merge.
2. Jangan mengubah migration yang sudah ada atau database hosted. Migration baru: uji lokal, cocokkan riwayat hosted, minta persetujuan pemilik.
3. Jangan menyentuh `tests/browser/app.spec.ts` atau `test-results-t1.log` yang sedang dikerjakan Codex/Copilot. `tests/demo-auth.test.mjs` adalah wilayah tes Copilot.
4. Sertakan bukti (`npm run check`, tes browser, log) di ringkasan; jangan mengklaim lulus tanpa keluaran.
5. Perubahan di luar wilayah peran harus ditulis di bagian "Permintaan Lintas AI" pada papan, bukan dilakukan diam-diam.

## Catatan lintas agen

- Untuk H-01: keputusan mode demo adalah keputusan pemilik; jangan mengaktifkan blokir produksi tanpa memastikan deployment Vercel diisi env yang benar, agar aplikasi tidak tiba-tiba menolak semua login.
- Untuk H-03: K2 (`student_habits`) masih hanya lokal; 404 Data API sebelumnya bukan bukti aman, hanya bukti belum diterapkan.
- Untuk H-08: indeks dan RPC adalah usulan, bukan izin menerapkan. Ukur dulu; skala sekolah mungkin tidak membutuhkannya.
- Untuk H-11: 180 adalah jumlah tes terdaftar, bukan hasil run; angka 101 di ringkasan T1 sudah usang.

## Log sesi

### 14 November 2026 — Qoder (audit arsitektur/keamanan/performa/data)

- Basis `03b87c0`; branch audit dibuat dari basis ini; hanya `docs/AUDIT_*.md` dan `docs/HANDOFF.md` yang ditambahkan. Tidak ada perubahan `src/`, migration, konfigurasi, atau working tree agen lain.
- Dijalankan: `npm run check` (exit 0; 104/104; build dengan peringatan PDF), `npx playwright test --list` (180 tes terdaftar). Tidak dijalankan: suite browser penuh, `npm run check:supabase`, UAT akun nyata, probe hosted.
- Temuan baru utama: mode demo produksi (S-01), bukti uji Storage (S-02), navigasi yang tidak sesuai RLS (A-01), fan-out dashboard (P-01), kebijakan retensi data anak (D-01), teks beranda dan angka tes (C-01/C-02/C-03).
- Tidak ada klaim bahwa aplikasi aman atau siap operasional. Status migration hosted dan deployment mengikuti dokumen, tidak diverifikasi ulang.
