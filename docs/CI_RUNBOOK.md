# CI/CD dan keputusan rilis SI STIR HEBAT

Diperbarui 24 November 2026. Workflow GitHub Actions memverifikasi setiap push dan pull request dari root aplikasi. Promosi frontend ke Vercel dan penerapan migrasi Supabase merupakan tindakan operator dengan persetujuan pemilik. Konfigurasi repositori dapat diperiksa di [workflow](../.github/workflows/verify.yml), [package.json](../package.json), dan [vercel.json](../vercel.json).

## Alur CI

| Tahap | Input dan perintah | Keluaran yang diperiksa |
| --- | --- | --- |
| Persiapan | Checkout revisi, Ubuntu, Node 24, cache npm, `npm ci` | Dependensi mengikuti `package-lock.json`. Job memakai `permissions.contents: read`. |
| Konfigurasi | `node scripts/guard-env.mjs` | GitHub Actions menjalankan `CI_FIXTURE=1` dengan pasangan URL dan kunci publishable sintetis yang ditetapkan. |
| Kontrak repositori | `npm run check` mulai dengan `check-migrations.mjs` dan `check-ci.mjs` | Penamaan, urutan dan duplikasi migrasi diperiksa. Pemeriksaan statis memeriksa langkah workflow dan nama skrip. |
| Kode dan database | Lint, TypeScript, kemudian `npm test` | Tes unit, smoke dengan server sintetis, dan pengujian database. PGlite memutar ulang migrasi dengan kontrak Auth/Storage untuk tes. |
| Build verifikasi | `npm run build:isolated` melalui `npm run check` | Vite menulis ke `dist-check/`. Audit menelusuri hasil build untuk penanda akun demo. |
| Antarmuka | Instal Chromium dengan dependensi OS, lalu `npm run test:browser` | Playwright membuka Vite dev server di loopback. Proyek desktop dan ponsel memakai API tiruan. |

Job `verify` gagal bila salah satu langkah keluar dengan status gagal. Selidiki dari langkah gagal pertama. Setelah perbaikan, jalankan kembali pemeriksaan pada revisi yang akan dirilis. Status GitHub Actions dan branch protection perlu dilihat pada repositori tujuan. Bila pemilik menerapkan perlindungan branch, pilih status `verify` dari workflow ini.

## Menyamakan pemeriksaan lokal

Jalankan dari direktori yang berisi `package.json` dengan Node 24. Siapkan konfigurasi publishable melalui `.env.local` untuk Vite sesuai `.env.example`, atau lewat environment proses. Pastikan proses tes diizinkan memakai loopback.

```powershell
npm ci
npm run check
npx playwright install chromium
$env:PLAYWRIGHT_CHANNEL = 'chromium'
$env:PLAYWRIGHT_PORT = '5191'
npm run test:browser
```

Playwright memakai Edge sebagai default di Windows jika `PLAYWRIGHT_CHANNEL` kosong. Pada Linux CI, workflow memasang Chromium dengan `--with-deps`. Port harus bebas karena server tes meminta `strictPort`. Bukti eksekusi terbaru dicatat di [status proyek](PROJECT_STATUS.md).

## Pengiriman dan pemulihan

1. Catat revisi kandidat, hasil CI dan versi migrasi yang dibutuhkan. Untuk distribusi sumber, jalankan `node scripts/prepare-release.mjs` dan gunakan direktori baru yang dicetak saat sukses. Skrip menyalin sumber, tes, workflow, dan skrip build dari daftar yang dipilih.
2. Cocokkan kontrak backend dengan target. Untuk perubahan skema, rekonsiliasi versi serta definisi objek, uji Supabase lokal, periksa Security Advisor, bukti backup/restore, dan pemeriksaan anonim. Tinjau hasil menurut syarat pemilik sebelum menerapkan migrasi. [Rekonsiliasi hosted](HOSTED_MIGRATION_RECONCILIATION_2026-11-22.md)
3. Setelah rilis disetujui, build revisi yang sama di Vercel dengan Node 24, `npm run build` dan dua variabel publishable milik target. `prebuild` membaca environment proses. Build menghasilkan `dist/` yang diaudit lagi. Gunakan environment Preview milik proyek uji untuk UAT sebelum promosi.
4. Catat ID deployment, status smoke, hasil UAT, dan versi skema. Bila smoke atau alur sekolah gagal, hentikan promosi. Untuk deployment yang sudah aktif, pilih deployment sehat terakhir yang kompatibel dengan skema. Perbaikan database memakai migrasi maju atau prosedur pemulihan yang telah diuji. [Runbook operasional](RUNBOOK_OPERASIONAL.md)

## CD Preview otomatis

Job `deploy-preview` di `.github/workflows/verify.yml` berjalan pada push ke `main` setelah job `verify` lulus, lalu men-deploy ke **Preview** Vercel (bukan produksi) dengan `vercel@65.14.0` (`pull` → `build` → `deploy --prebuilt`). URL Preview tampil di ringkasan run dan environment `preview` GitHub. Tanpa secret, job dilewati dengan pemberitahuan sehingga CI tetap hijau.

Penyiapan satu kali oleh pemilik:

1. Vercel → Account Settings → Tokens: buat token khusus CI.
2. GitHub repo → Settings → Secrets and variables → Actions: tambahkan `VERCEL_TOKEN`, `VERCEL_ORG_ID`, dan `VERCEL_PROJECT_ID`. Dua ID terakhir ada di `.vercel/project.json` setelah `vercel link`, atau di Project Settings Vercel.
3. Vercel → Project → Settings → Environment Variables: isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` untuk environment **Preview**. Tanpa keduanya build ditolak oleh `prebuild`.

Produksi sengaja tidak otomatis: kode `main` membutuhkan migration yang belum diterapkan ke Supabase hosted. Promosikan Preview ke produksi secara manual setelah gerbang migration, smoke, dan UAT di atas terpenuhi.

Konfigurasi CI memakai fixture dan tidak menerbitkan `dist-check/` ke layanan hosted. Bukti produksi berasal dari deployment, smoke serta UAT peran dan email pada target yang disetujui. [Aktivasi operator](AKTIVASI_DAN_RILIS.md)
