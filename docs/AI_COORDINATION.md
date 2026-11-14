# Papan Koordinasi AI

Status: TODO | DOING | REVIEW | DONE | BLOCKED

| ID | Tugas | Pemilik | Status | Branch | Catatan |
|----|-------|---------|--------|--------|---------|
| C1 | Modul Komunikasi (pesan/pemberitahuan guru–wali): migration + RLS + API | Codex | TODO | | |
| C2 | Modul Administrasi Dokumen (metadata dokumen, kategori, akses per peran) | Codex | TODO | | |
| C3 | Telaah celah PRD vs fitur terpasang, urutkan prioritas | Codex | TODO | | |
| C4 | Perkecil chunk PDF (dynamic import/code splitting) | Codex | TODO | | |
| U1 | UI modul Komunikasi (setelah C1 REVIEW) | Cursor | TODO | | |
| U2 | UI modul Administrasi Dokumen (setelah C2 REVIEW) | Cursor | TODO | | |
| U3 | Audit responsif & aksesibilitas semua halaman | Cursor | DOING | ai/cursor-akses-status | Cursor |
| U4 | Konsistensi empty/loading/error state | Cursor | DOING | ai/cursor-akses-status | Cursor |
| T1 | Perbaiki 2 tes browser dengan selector alert ambigu, jalankan ulang penuh | Copilot | REVIEW | ai/copilot-fix-browser-alerts | 180/180 browser pass; npm run check lulus. Selector spesifik sudah ada, tidak perlu diff tambahan. |
| T2 | Tambah tes unit untuk util/validator yang belum tercakup | Copilot | REVIEW | ai/copilot-fix-browser-alerts | 3 tes demo-auth baru; npm run check lulus (104 tes). |
| T3 | Tes browser untuk Komunikasi & Dokumen (setelah UI REVIEW) | Copilot | TODO | | |
| Q1 | Review keamanan RLS/grant semua migration (laporan, bukan perubahan) | Qoder | REVIEW | ai/qoder-review-qa | Laporan `docs/SECURITY_REVIEW.md`; tidak ada klaim aman. |
| Q2 | Rapikan README (kritis: hapus info usang/duplikat jumlah migration) | Qoder | DOING | ai/qoder-review-qa | Dikerjakan berurutan Q1→Q4. |
| Q3 | Panduan UAT per peran (admin, kepala sekolah, guru, siswa, wali) | Qoder | DOING | ai/qoder-review-qa | Dikerjakan berurutan Q1→Q4. |
| Q4 | Review PR dari AI lain sebelum merge | Qoder | DOING | ai/qoder-review-qa | Dikerjakan berurutan Q1→Q4. |

## Permintaan Lintas AI
(tulis di sini: dari → ke, apa yang dibutuhkan)

## Urutan merge
Codex (backend) → Cursor (UI) → Copilot (tes) → Qoder (docs). Hanya Codex yang merge ke main.

### T1 — Verifikasi selector alert

1. Suite Playwright penuh: 180/180 lulus pada desktop dan ponsel; tidak ada kegagalan selector.
2. `npm run check`: lint, typecheck, 101/101 tes unit/database, dan build lulus.
3. Selector dashboard yang sebelumnya ambigu sudah menggunakan pencocokan nama exact; tidak perlu mengubah perilaku atau menambah diff tes.

File ditinjau: `tests/browser/app.spec.ts` (tidak diubah pada tugas T1 ini).

### T2 — Tes unit utilitas autentikasi demo

1. `demo-auth.ts` belum memiliki tes; XLSX, CSV, dan tanggal Asia/Jakarta sudah tercakup, jadi tes baru menutup celah utilitas ini.
2. Tiga tes memeriksa normalisasi email dan password exact, sesi/profil rusak, serta persistensi perubahan profil/password dan penghapusan sesi.
3. Tes baru lulus 3/3; `npm run check` lulus dengan 104 tes, lint, typecheck, dan build. Tidak ada perubahan perilaku aplikasi.

File: `tests/demo-auth.test.mjs`.

### Ringkasan Q1 — Telaah keamanan migration

1. Diperiksa 24 berkas migration: tidak ada grant ke `anon`/`public`, 39/39 fungsi SECURITY DEFINER memakai `search_path`, 35/35 tabel ber-RLS; grant kolom mencegah perubahan peran/`profile_id`.
2. Temuan perlu tindakan: `todos` tanpa transaksi + DML penuh (K1), draf umpan balik terbaca admin/kepala sekolah (K3), `habit_students()` dan status hosted migration ke-24 (K2), bukti RLS Storage terbatas (K4). Laporan tidak menyatakan database "aman".
3. File: `docs/SECURITY_REVIEW.md`, `docs/AI_COORDINATION.md`; `npm run check:supabase` dijalankan (anon ditolak, tanpa membaca baris data).
