# Status SI STIR HEBAT

Satu-satunya sumber angka dan status terkini. Riwayat lengkap 10–25 November 2026 ada di [archive/PROJECT_STATUS_RIWAYAT_2026-11-10_sd_2026-11-25.md](archive/PROJECT_STATUS_RIWAYAT_2026-11-10_sd_2026-11-25.md). Perbarui bagian di bawah ini; jangan menambah entri bertanggal panjang. Rincian perubahan masuk ke [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md).

Diperbarui: 25 November 2026 (Asia/Jakarta). Branch `ai/claude-roadmap-2-7` (belum di-commit).

## Verifikasi lokal terakhir

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run check` | EXIT 0: 46 migration, CI check, lint, typecheck, **170/170** tes unit/database, build terisolasi 1.814 modul, 34 bundel JavaScript tanpa akun demo |
| Suite browser penuh (desktop + ponsel, API tiruan) | **444/444 lulus** (8,5 menit), termasuk 16 tes baru untuk audit log, sesi, dan absensi offline |
| CSP di Chromium terhadap `vite preview` build sintetis | Tidak ada pelanggaran di beranda/login. Service worker terdaftar. Halaman login tetap terbuka saat dimuat ulang offline. |

Mesin ini memakai Node 26. `engines` dan CI memakai Node 24 (`.nvmrc`). Tes browser memakai API tiruan dan **bukan UAT akun sekolah**.

## Database

- Lokal: 46 migration (`node scripts/check-migrations.mjs`).
- **Produksi baru (`rsvoodhdxyrrprqogwop`), keputusan pemilik 25 November:** pemilik menjalankan `supabase db push` dari database kosong. Ke-46 migration diterapkan tanpa error. `supabase migration list` (25 November) menunjukkan Local = Remote untuk ke-46 migration. Belum ada data dan belum ada administrator.
- Produksi lama (`ysworvoaqqwppwcrnmqk`): 23 migration sampai `20261113074045` (pemeriksaan read-only terakhir 22 November). Sudah tidak menjadi target. Belum diputuskan apakah datanya akan dipindahkan atau project-nya diarsipkan.
- Drift enam tabel konfigurasi ditangani `20261121085900_quarantine_hosted_config_drift`. Di project baru migration ini tidak berpengaruh karena tabel drift-nya tidak ada. Langkah D12 ([runbook](RUNBOOK_STAGING_DAN_MIGRASI.md) bagian 5) hanya relevan kalau data project lama dipindahkan.
- Security Advisor di project baru **belum dijalankan**. Di project lama ada WARN `auth_leaked_password_protection`. Pengaturan ini per project, jadi perlu diaktifkan lagi di project baru.

## Gate sebelum produksi (urut)

1. Aktifkan leaked password protection, lalu jalankan Security Advisor sampai bersih.
2. Backup produksi dan **uji restore** ke project staging ([runbook](RUNBOOK_STAGING_DAN_MIGRASI.md) langkah 2–3).
3. `supabase db push` ke staging, `npm run check:supabase` terhadap staging.
4. UAT lima peran di staging ([PANDUAN_UAT.md](PANDUAN_UAT.md)), termasuk administrator pertama dan redirect URL Auth.
5. Persetujuan tertulis pemilik, lalu langkah yang sama di produksi dan deploy Vercel.

Status 25 November: atas keputusan pemilik, migration langsung diterapkan ke produksi baru `rsvoodhdxyrrprqogwop`. Gate 2–3 (backup, uji restore, staging) dilewati karena database-nya masih kosong. Gate 1, 4, dan 5 (Advisor, UAT lima peran, dan deploy Vercel yang memakai URL/anon key project baru) masih terbuka. Sebaiknya UAT dijalankan sebelum data sekolah asli dimasukkan. Agen AI tidak memegang kredensial database.

## Keputusan pemilik terbaru (25 November 2026)

Dicatat sebagai D9–D12 di [DECISIONS.md](DECISIONS.md):

- **D9:** pendaftaran mandiri diizinkan. Akun baru berstatus `pending` sampai email terverifikasi dan administrator menetapkan peran. Alur ini sudah ada di kode.
- **D10:** login memakai email, bukan NISN/NIP.
- **D11:** remote resmi `origin` = `nutrantaraelvi-cmyk/si-stir-hebat` (`remote.pushDefault` sudah diatur di repo lokal; remote lama `mariomagfii-sys` bernama `mariomagfii`, hanya arsip).
- **D12:** data drift: retensi memakai nilai lokal (komunikasi dan bukti supervisi 1 tahun ajaran); `deletion_requests` dipindahkan dengan `guardian` → `parent`. Langkah operator ada di runbook bagian 5.

Tidak ada keputusan produk yang tertunda saat ini. Gate operasional di atas tetap berlaku.

## Fitur PRD: status ringkas

Sudah ada (lokal, tes API tiruan): autentikasi/profil, dashboard per peran, pengumuman, data master, absensi murid (manual, impor Excel, **antrean offline**), absensi guru dan koreksi, jurnal, tautan akun, portal dan laporan ketidakhadiran wali, modul ajar, supervisi empat tahap, materi/tugas/umpan balik, asesmen dan rekap (CSV/Excel/PDF), komunikasi guru–wali, notifikasi, 7 Kebiasaan, dokumen sekolah, **audit log**, **logout otomatis 30 menit**, **keluar dari semua perangkat**, **pencabutan sesi oleh admin**, dan **tombol WhatsApp sekolah**.

Belum ada: jumlah notifikasi belum dibaca di navigasi, notifikasi otomatis dari semua modul, lampiran materi dan laporan wali, integrasi Google Drive/Sheets, dan WhatsApp Business API (fase lanjutan).

Batasan mode offline: halaman absensi harus sudah dibuka saat masih online. Data daftar hadir tidak disimpan di perangkat; hanya perubahan yang belum terkirim yang disimpan.

## Utang teknis yang tersisa

- Sekitar 85 panggilan `supabase.from()` langsung di komponen. Lapisan `features/*/api` baru dipakai sebagian modul.
- Pengambilan peran profil masih diulang di sekitar 12 halaman. `useOwnRole` (`src/components/auth/use-own-role.ts`) sudah tersedia, tetapi baru dipakai halaman audit.
- Lima berkas CSS bertumpuk (sekitar 130 KB) ditambah Tailwind. Aturan mati sudah dihapus, tetapi penyatuan token belum dilakukan.
- Chunk PDF 790 kB dan font PDF 420 kB (dimuat hanya saat ekspor).
- Repo induk `D:\code` dan clone `si-stir-hebat-copilot`/`-qoder`/`github-release` masih ada di disk. Jangan dipakai (lihat [AI_COORDINATION.md](AI_COORDINATION.md)).
