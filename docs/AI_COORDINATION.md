# Papan koordinasi AI

Papan ini sengaja pendek. Riwayat lengkap sampai 21 November 2026 (Codex, Qoder, Copilot, Kilo, Cursor) ada di [archive/AI_COORDINATION_RIWAYAT_sd_2026-11-21.md](archive/AI_COORDINATION_RIWAYAT_sd_2026-11-21.md). Angka tes dan status terkini hanya ditulis di [PROJECT_STATUS.md](PROJECT_STATUS.md), bukan di sini.

## Aturan kerja bersama

1. **Satu agen, satu branch, satu area.** Tulis klaim di tabel di bawah sebelum mulai, dan hapus klaim itu setelah merge. Jangan menyunting berkas dalam area agen lain yang masih aktif.
2. **Root kanonis** adalah `D:\code\SI_STIR_HEBAT_Starter\si-stir-hebat`. Jangan bekerja di repo induk `D:\code` atau di clone `si-stir-hebat-copilot`, `si-stir-hebat-qoder`, `github-release`. Isinya sudah usang.
3. **Remote resmi** (keputusan D11) adalah `origin` (`nutrantaraelvi-cmyk/si-stir-hebat`, CI `verify`). Push hanya ke remote ini. Remote `mariomagfii` (`mariomagfii-sys/si-stir-hebat`) hanya arsip; akun pemilik tidak punya akses tulis ke sana. Nama remote diubah 25 November 2026: `nutrantaraelvi` → `origin`, `origin` lama → `mariomagfii`.
4. Tidak ada migration hosted, deploy produksi, atau push tanpa persetujuan pemilik. Ikuti [RUNBOOK_STAGING_DAN_MIGRASI.md](RUNBOOK_STAGING_DAN_MIGRASI.md). Sejak 25 November 2026 project produksi adalah `rsvoodhdxyrrprqogwop` (46 migration sudah diterapkan). `ysworvoaqqwppwcrnmqk` adalah project lama, jangan dijadikan target. Migration baru harus diberi timestamp setelah `20261125090200`.
5. Sebelum menyatakan selesai: `npm run check` (Node 24, lihat `.nvmrc`) dan tes browser yang relevan. Catat hasil nyata di PROJECT_STATUS. Jangan menyalin angka lama.
6. Permintaan lintas agen ditulis di bagian "Permintaan terbuka" dengan format `Pengirim → Penerima: isi`, lalu dihapus setelah selesai.

## Klaim area aktif

| Agen | Branch | Area | Sejak |
| --- | --- | --- | --- |
| Claude | `ai/claude-roadmap-2-7` | Kerapian repo/dokumen, karantina drift + indeks FK, header keamanan, audit log/sesi, absensi offline, WhatsApp sekolah, pemecahan Dashboard, pembersihan CSS | 25 Nov 2026 |

## Permintaan terbuka

- Claude → Copilot: repo induk `D:\code` (branch `ai/copilot-fix-browser-alerts`) memuat salinan berkas proyek ini, termasuk `tests/demo-auth.test.mjs` dan papan koordinasi lama. Pindahkan pekerjaan itu ke branch di repo kanonis agar tidak tertimpa.
