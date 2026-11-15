# Runbook CI/CD

Status: 15 November 2026 (Kilo/QA)
Cakupan: L08 (CI/CD & VC) pada master prompt multi-AI.

## 1. Apa yang dijalankan GitHub Actions

`.github/workflows/verify.yml` (sama pada repo aplikasi dan repo rilis mandiri):

| Langkah | Alasan |
| --- | --- |
| `actions/checkout@v4` | mengambil kode |
| `actions/setup-node@v4` dengan `node-version: '24'` | sesuai `engines` |
| `npm ci` | instalasi deterministik dari lockfile |
| `npm run check` | gerbang utama (lihat bagian 2) |
| `npx playwright install --with-deps chromium` | browser untuk CI Linux |
| `npm run test:browser` | suite desktop + ponsel dengan API tiruan |

Env `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` disetel sebagai nilai contoh. Ini wajib: sejak `vite.config.ts` menolak build tanpa konfigurasi Supabase, tanpa env ini langkah `npm run check` gagal.

## 2. Gerbang yang dijalankan `npm run check`

1. `node scripts/check-migrations.mjs` — nama berkas `<14 digit>_<nama>.sql`, timestamp unik dan naik, serta aturan `student_habits` sebelum `komunikasi`.
2. `node scripts/check-ci.mjs` — workflow memakai Node 24, `npm ci`, `npm run check`, pemasangan Playwright, `test:browser`, env Supabase, dan `permissions: contents: read`; setiap `npm run <skrip>` di workflow benar-benar ada di `package.json`.
3. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## 3. Menjalankan langkah CI di lokal

```powershell
# Node 24, dari SI_STIR_HEBAT_Starter/si-stir-hebat
npm ci
npm run check

# Suite browser pada port sendiri agar tidak bentrok dengan agen lain
$env:PLAYWRIGHT_PORT = '5191'
npm run test:browser
```

Catatan: jangan menjalankan `test:browser` bersamaan dengan `vite build` atau run browser agen lain. Pada RAM 7,6 GB, dua run paralel membuat peluncuran Edge melewati batas 180 detik.

## 4. Bukti pemeriksaan (15 November 2026)

```
$ node scripts/check-migrations.mjs
Migration OK: 25 berkas, timestamp unik dan naik.

$ node scripts/check-ci.mjs
Workflow CI OK: 1 berkas valid dan memakai skrip yang tersedia.
```

Uji negatif (bukti bahwa gerbang benar-benar menolak):

| Kasus | Hasil |
| --- | --- |
| Dua berkas dengan timestamp sama + nama berkas salah | keluar dengan 3 pesan galat, exit 1 |
| `komunikasi` lebih dulu daripada `student_habits` | keluar dengan pesan urutan, exit 1 |

`npm run check` penuh **belum** dapat dinyatakan lulus pada 15 November 2026: `src/app/Password.tsx` sedang disunting agen lain dan gagal typecheck (`TS6133`, `TS2304`). Gerbang baru (migration + workflow) sendiri lulus.

## 5. Belum terverifikasi

- **Run GitHub Actions**: repo privat dan `gh` tidak tersedia pada mesin ini, jadi status run tidak dapat dibaca. Tidak ada push dilakukan.
- **Branch protection**: setelan repositori tidak dapat diubah dari mesin ini.
- **Secret/Environment Vercel**: hanya dapat diperiksa pemilik.

## 6. Rekomendasi branch protection (dipasang pemilik)

Pada `main` (dan bila ada, `release`):

1. Wajibkan pull request sebelum merge; minimal 1 approval.
2. Wajibkan status `verify` (job pada workflow `Verify application`) lulus sebelum merge.
3. Wajibkan branch mutakhir sebelum merge.
4. Larang force push dan penghapusan branch.
5. Tandai `verify` sebagai status yang diperlukan, bukan pemeriksaan opsional.

## 7. Yang dibutuhkan pemilik

- Memasang branch protection sesuai bagian 6.
- Mengonfirmasi run `Verify application` pertama hijau, lalu menautkan lognya di `docs/AI_COORDINATION.md`.
- Menambahkan `mariomagfii-sys/si-stir-hebat` sebagai remote branch terlindungi bila repo rilis mandiri dipisah.