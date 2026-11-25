# Arsitektur aplikasi, server, dan UI/UX

Dokumen ini memetakan implementasi yang berjalan pada 24 November 2026. Aplikasi adalah satu proyek React 19 + Vite + TypeScript dengan React Router. Supabase menyediakan Auth, PostgreSQL, RLS/RPC, dan Storage privat. Tidak ada server aplikasi kedua atau migrasi Next.js pada baseline ini.

## Bentuk sistem

\`\`\`mermaid
flowchart LR
  B[Browser ponsel / desktop] --> S[src/app shell]
  S --> F[src/features per domain]
  F --> L[src/lib + src/utils]
  L --> A[Supabase Auth]
  L --> D[PostgreSQL + RLS/RPC]
  L --> T[Storage privat]
  G[GitHub Actions] --> V[lint, typecheck, unit, build, browser]
  V --> R[Vercel SPA setelah persetujuan rilis]
\`\`\`

\`src/app/App.tsx\` menjadi boundary routing dan lazy loading. \`AuthProvider\` memuat sesi, \`ProtectedRoute\` menangani rute terlindungi, dan \`src/components/auth/auth-context.tsx\` menjadi kontrak konteks untuk fitur. \`src/app/Header.tsx\` dan dashboard hanya menyajikan tautan yang sesuai dengan helper di \`src/utils/permissions.ts\`. RLS tetap merupakan keputusan otorisasi akhir.

## Modul dan dependensi

| Lapisan | Lokasi | Kontrak |
| --- | --- | --- |
| Shell | \`src/app/\` | router, auth, layout, dashboard, akun |
| UI bersama | \`src/components/ui/\` | error boundary, status kosong, kontrol dasar |
| Domain | \`src/features/<domain>/\` | halaman, model, API dan tipe domain |
| Integrasi | \`src/lib/\` | klien Supabase, konfigurasi runtime, auth context, API bersama |
| Utilitas | \`src/utils/\` | izin, tanggal, CSV, referensi |
| Data | \`supabase/migrations/\` | skema, constraint, trigger, RLS, RPC, Storage policy |
| Verifikasi | \`tests/\`, \`scripts/\` | unit/domain, PGlite, browser mock, guard rilis |

Fitur boleh memakai kontrak auth dan utilitas bersama. Fitur tidak boleh membaca tabel lewat kredensial rahasia, menetapkan peran dari input pengguna, atau menjadikan penyembunyian menu sebagai otorisasi. Query berulang harus memiliki batas dan sentinel yang terlihat ketika data terpotong. Mutasi yang dapat diulang memakai ID/revisi dan menangani respons yang hilang.

## Arsitektur server dan data

Pada versi ini “server” adalah batas layanan Supabase. Browser mengirim publishable key dan sesi Auth. PostgreSQL memeriksa \`auth.uid()\`, profil aktif, relasi anak terverifikasi, penugasan guru, status publikasi, dan revisi. RPC dipakai saat operasi perlu transaksi, idempotensi, audit, atau validasi lintas tabel. Storage menyimpan objek privat dengan path yang divalidasi terhadap entitas pemilik.

Perubahan skema selalu berupa migration baru yang diuji dengan PGlite dan direkonsiliasi terhadap riwayat hosted sebelum penerapan. Tidak ada migration lokal yang dianggap hosted secara otomatis. Backup/restore, Advisor, bootstrap operator, dan UAT akun sekolah adalah gerbang operasional pada [runbook](RUNBOOK_OPERASIONAL.md).

## UI/UX

Antarmuka mobile-first memakai token warna ungu tua, lilac, biru muda dan pink, dengan tipografi serta komponen global di \`src/styles/global.css\`. Setiap halaman memiliki judul, status memuat/kosong/gagal, label formulir, fokus keyboard, konfirmasi mutasi, dan pesan yang dapat dipahami. Rute penting dapat dibuka langsung, tetapi status akses dijelaskan saat peran tidak sesuai. Ponsel diuji pada 390×844 dan desktop pada 1280×900 melalui Playwright. Ekspor menyatakan cakupan halaman atau filter yang dipakai.

## CI/CD dan operasi

Workflow [verify.yml](../.github/workflows/verify.yml) menjalankan Node 24, instalasi lockfile, guard environment, \`npm run check\`, instalasi browser dan suite Playwright. \`npm run build\` menolak konfigurasi Supabase yang kosong atau tidak valid, kemudian pemeriksaan bundle memastikan akun demo tidak masuk build produksi. Vercel hanya menerima artefak SPA setelah gate lokal/CI, rekonsiliasi hosted, backup/restore, Security Advisor dan UAT disetujui.

## Aturan review

Review dimulai dari kontrak PRD dan [matriks RBAC](RBAC_MATRIX.md), dilanjutkan dengan rute langsung, API domain, migration/RLS, tes unit/database, tes browser desktop/ponsel, lint, typecheck dan build. Temuan yang memerlukan keputusan sekolah dicatat di \`DECISIONS.md\`, bukan disamarkan sebagai implementasi. Sumber status dan bukti verifikasi dirawat di \`PROJECT_STATUS.md\` dan \`IMPLEMENTATION_LOG.md\`.
