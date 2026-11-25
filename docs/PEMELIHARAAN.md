# Panduan Pemeliharaan SI STIR HEBAT

Status: panduan teknis untuk pemelihara. Terakhir diperbarui: 20 November 2026.
Angka dan bukti di dokumen ini adalah snapshot bertanggal; selalu perbarui setelah verifikasi baru.

## 1. Stack dan lingkungan

- React 19 + Vite 6 + TypeScript + React Router 7 + Supabase (`@supabase/supabase-js`).
  Stack terkunci; Next.js dilarang.
- Node.js **24** dipakai untuk gate (`npm run check`). Node versi lain tidak menjadi acuan angka.
- Variabel lingkungan frontend hanya boleh berisi **publishable** key:
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Jangan menaruh service-role key atau
  rahasia lain di variabel `VITE_*`, `.env.local`, log, atau dokumen.
- Mode demo hanya aktif saat `import.meta.env.DEV`. Build produksi tanpa konfigurasi valid harus
  gagal (D3); skrip build juga memeriksa bahwa bundel tidak memuat akun demo.

## 2. Perintah rutin

```bash
npm run dev          # server pengembangan (mode demo hanya di DEV)
npm run build        # tsc -b && vite build && cek bundel demo
npm run preview      # pratinjau hasil build
npm test             # tes unit/database (node --test tests/*.test.mjs)
npm run test:browser # Playwright, proyek desktop 1280x900 + ponsel 390x844
npm run check        # check-migrations + check-ci + lint + typecheck + test + build
npm run check:supabase  # pemeriksaan read-only terhadap proyek Supabase hosted
```

Untuk gate hijau tanpa menyentuh Supabase nyata, gunakan URL dan publishable key uji yang lolos
validasi `src/lib/config.ts`:

```bash
VITE_SUPABASE_URL=https://school-abc.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_..._uji \
npm run check
```

Jangan menjalankan `npm run build` dan `npm run test:browser` bersamaan. Untuk Playwright, pakai
port berbeda per agen: `PLAYWRIGHT_PORT=5368 npx playwright test --reporter=line --trace=off`.
Simpan log di luar repo (misalnya `%TEMP%\qoder-qa-<tanggal>\`).

## 3. Snapshot verifikasi terakhir (20 November 2026)

- `npm run check` Node v24.22.3: EXIT 0, **137/137** tes unit/database, **38** berkas migration,
  lint/typecheck bersih, bundel produksi 26 berkas JavaScript tanpa akun demo.
  Log: `...\qoder-qa-2026-11-18\check-audit.log`.
- Suite browser penuh: **296/296** lulus, 6,2 menit, port 5368, termasuk spec audit responsif.
  Log: `...\browser-audit-5368.log`.
- Build tanpa konfigurasi valid sengaja gagal (D3). Itu perilaku benar, bukan kerusakan.

## 4. Migration database

Aturan wajib (lihat juga `AGENTS.md` dan `docs/DECISIONS.md`):

1. Jangan mengubah atau menerapkan ulang migration yang sudah hosted. Hanya berkas baru.
2. Urutan: `20261114000139_student_habits` → `20261114083827_komunikasi` → migration baru
   berikutnya, tanpa melompati yang lebih awal.
3. Setiap migration dibungkus `begin; ... commit;` dan diuji lokal (PGlite atau Supabase lokal)
   sebelum hosted.
4. Sebelum penerapan hosted: cocokkan riwayat hosted dengan lokal, catat di
   `docs/MIGRATION_REVIEW_<tanggal>.md`.
5. Sesudah penerapan: `npm run check:supabase` dan Security Advisor harus bersih. Jika tidak,
   hentikan dan laporkan; jangan menutupi temuan.
6. Operasi destruktif (drop tabel/kolom, hapus data) hanya setelah dicatat di
   `docs/DECISIONS.md` dan diverifikasi (mis. jumlah baris = 0). Jangan reset database hosted.

Pada 20 November 2026: **23 hosted**, **38 lokal**, 15 belum hosted. Status hosted dapat berubah;
periksa ulang sebelum klaim.

## 5. Retensi dan siswa keluar

Ikuti `docs/PROSEDUR_RETENSI_OPERATOR.md`. Ringkas: registri/absensi/nilai/jurnal selama siswa
terdaftar + 5 tahun ajaran; audit 5 tahun; pesan komunikasi 1 tahun ajaran; bukti supervisi
2 tahun ajaran; tanpa penghapusan otomatis. Siswa keluar: nonaktifkan, lepas tautan akun, snapshot
tetap. Jangan mengubah peran akun untuk menonaktifkan akses.

## 6. Perubahan UI dan tes

- Rute dan peran mengikuti `src/lib/school.ts` (`canRead*`, `canAccessCommunication`) dan
  `src/app/Header.tsx`. Jangan menyembunyikan akses hanya lewat UI; RLS/grant adalah penegak.
- Halaman dimuat malas (`React.lazy` + `Suspense`); fallback memakai `role="status"`.
- Navigasi responsif: sidebar >=1000px; di bawahnya bottom nav 4 tujuan + drawer `role="dialog"`
  dengan Escape, klik latar, fokus kembali, dan `aria-expanded`/`aria-controls`.
- Token warna global ada di `src/styles/global.css`; jangan menambah hex baru di komponen.
  Kontras dan pemetaan palet: `docs/archive/PALETTE_D8_2026-11-20.md`.
- Tes browser memakai API tiruan; bukan UAT. Untuk halaman baru, tambah skenario desktop dan
  ponsel, termasuk state kosong, galat, dan kirim ulang aman.
- Audit luapan/aksesibilitas dasar: `tests/browser/audit-responsive.spec.ts`; jalankan ulang bila
  menambah rute atau mengubah navigasi.

## 7. Git dan workspace bersama

- Branch kerja: `ai/<agen>-<topik>`. Hanya pemilik/Codex yang merge ke `main`.
- Workspace ini dipakai beberapa agen. Jangan `git reset --hard`, jangan hapus branch, jangan
  `push --force`.
- Commit hanya berkas milik Anda dengan `git commit --only <path...>`. Jika identitas Git belum
  disetel, gunakan env sekali jalan (contoh): `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`,
  `GIT_COMMITTER_NAME`, `GIT_COMMITTER_EMAIL`; jangan mengubah `git config`.
- Sebelum commit, periksa `git status`; berkas bersama (papan koordinasi, log implementasi,
  `PROJECT_STATUS`, `QA_COVERAGE`, `AGENTS.md`) sering memuat perubahan agen lain yang belum
  di-commit.

## 8. Troubleshooting

| Gejala | Periksa |
|---|---|
| Build produksi gagal saat tanpa env | Disengaja (D3): isi URL dan publishable key valid, atau gunakan env uji untuk gate. |
| Playwright macet/font aneh | Tes memblokir `fonts.googleapis.com`/`fonts.gstatic.com`; itu normal. |
| Port bentrok | Set `PLAYWRIGHT_PORT` unik; jangan menjalankan build bersamaan. |
| `tsc -b` gagal menulis cache di sandbox | Arahkan cache TypeScript ke `%TEMP%`; jangan mengubah sumber hanya untuk ini. |
| Menu "hilang" di ponsel | Menu tambahan ada di drawer tombol **Lainnya**; periksa `aria-expanded`. |
| Data tampak kosong padahal ada | Cek RLS/grant dan filter peran; UI tidak boleh dipakai untuk menutupi penolakan. |
| Migrasi hosted ditolak | Cocokkan riwayat, urutan, dan bungkus transaksi; berhenti dan laporkan bila Advisor tidak bersih. |

## 9. Sebelum menyatakan REVIEW

1. `npm run check` hijau pada Node 24, dengan log tersimpan di luar repo.
2. Suite browser penuh hijau (desktop + ponsel) pada port unik, termasuk spec audit.
3. Dokumen diperbarui: entri implementasi, papan koordinasi, dan angka kanonik di dokumen status.
4. Tidak ada klaim "aman/siap operasional/lulus" tanpa bukti; UAT akun nyata dan pengaturan Auth
   hosted tetap tugas pemilik.
