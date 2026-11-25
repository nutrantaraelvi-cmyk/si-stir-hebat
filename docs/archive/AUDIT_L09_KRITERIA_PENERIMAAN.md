# Audit L09 — Kriteria Penerimaan Risiko Rilis

Status: REVIEW — laporan audit, tanpa perubahan kode, migration, atau hosted
Tanggal: 15 November 2026
Penulis: Qoder
Ruang lingkup: S-01 mode demo, S-02/K4 Storage bukti supervisi, K1 tabel `todos`, K3 draf umpan balik, dan header keamanan Vercel.

Dokumen ini **tidak** menyatakan aplikasi aman atau siap operasional. Semua temuan di bawah adalah hasil telaah statis dan pemeriksaan repo; temuan yang memerlukan hosted atau akun nyata ditandai **belum terverifikasi**.

## 1. Ringkasan

| ID | Status | Temuan | Pemilik usulan | Penghalang |
| --- | --- | --- | --- | --- |
| S-01 | Sebagian termitigasi | Build produksi sudah gagal bila konfigurasi Supabase tidak valid, tetapi kode dan kredensial demo masih dibundel serta fallback demo tetap aktif setiap kali `supabase` bernilai `null`. | Copilot | Implementasi + tes bundel |
| S-02/K4 | **Terbuka (diperluas)** | Policy baca Storage bukti supervisi hanya memeriksa `stage = 4`; tidak membatasi kepala sekolah pemilik sesi, guru terkait, status publikasi, atau peran lain. | Copilot + Kilo | Migration baru + uji hosted |
| K1 | Terbuka | `todos` tidak memakai `begin/commit`, memberi DML penuh kepada `authenticated`, dan tidak dipakai UI. | Pemilik + Copilot | Keputusan drop/keep |
| K3 | Terbuka | Administrator dan kepala sekolah dapat membaca draf umpan balik, event draf, dan draf asesmen. | Pemilik + Copilot | Keputusan kebijakan |
| H-09 | Terbuka | `vercel.json` belum menetapkan CSP atau header keamanan lain. | Kilo + Copilot | Uji CSP di produksi |
| L14 | Celah bukti | `npm test` 109/109 lulus, tetapi log suite browser penuh terakhir yang tersimpan tidak lengkap. | Kilo | Log run penuh |

## 2. Bukti dan analisis

### S-01 — Mode demo dapat aktif tanpa konfigurasi Supabase

Bukti:

- `src/lib/supabase.ts:3-5` membuat `supabase = null` bila konfigurasi tidak valid.
- `src/app/Auth.tsx:13-18` langsung memakai `getDemoSession()` ketika `supabase` null.
- `src/app/Account.tsx:17-24` menerima login demo, dan `src/app/Account.tsx:38` menampilkan panel akun demo.
- `src/lib/demo-auth.ts:13-19` memuat lima akun dengan email dan kata sandi hardcoded.
- `vite.config.ts:25-29` sudah menghentikan `vite build` bila `VITE_SUPABASE_URL` atau `VITE_SUPABASE_PUBLISHABLE_KEY` tidak valid.
- `tests/config.test.mjs:5-21` sudah menguji validasi konfigurasi, tetapi belum menguji ketiadaan kode demo di bundel produksi.

Dampak: build produksi yang benar tidak bisa dibuat tanpa konfigurasi valid, sehingga risiko produksi lebih rendah daripada catatan audit sebelumnya. Namun kode demo dan kredensialnya tetap ikut ter-bundle, dan aplikasi tetap jatuh ke mode demo setiap kali `supabase` null pada runtime. Ini berbahaya bila `dist` lama diunggah ulang, deployment non-Vite dipakai, atau konfigurasi berubah setelah build.

Kriteria penerimaan:

| AC | Kriteria | Bukti yang harus dilampirkan |
| --- | --- | --- |
| AC-S01-1 | Jalur demo hanya aktif bila `import.meta.env.DEV` bernilai benar; pada build produksi `getDemoSession()` selalu null dan `signInDemo()` tidak dapat dijangkau. | Tes unit + tinjauan kode |
| AC-S01-2 | Build produksi tanpa env valid tetap gagal dengan pesan yang jelas. | `npm run build` tanpa env → exit non-zero |
| AC-S01-3 | Bundel produksi tidak memuat email/kata sandi demo (`admin@sdn03.sch.id`, `admin123`, dan empat akun lain). | Pemeriksaan `dist/assets/*.js` |
| AC-S01-4 | Pada preview produksi tanpa sesi, halaman login menampilkan pesan konfigurasi, bukan panel demo; tidak ada sesi demo di `localStorage`. | Tes browser desktop + ponsel |
| AC-S01-5 | Perilaku dev/test tetap dapat memakai akun demo; perubahan dicatat di `DECISIONS.md` dan README. | Tes demo-auth tetap lulus |

Pemilik: Copilot. Peninjau: Qoder. Tidak memerlukan keputusan pemilik kecuali ingin mempertahankan demo di produksi.

### S-02/K4 — Policy baca Storage bukti supervisi terlalu luas

Bukti:

- Migration `20261111082822_supervision_evidence.sql:19-22` membatasi **penulisan/penghapusan** bukti kepada profil berperan `principal`, sesi `stage = 4`, dan `published_at is null`.
- Migration yang sama baris `29-39` membuat policy baca `supervision_evidence_read` yang hanya memeriksa `bucket_id` dan `stage = 4`.
- Policy baca tersebut tidak memeriksa `auth.uid()`, relasi guru, `published_at`, atau peran pemanggil.
- Dokumentasi proyek menyatakan bukti hanya dapat diunduh kepala sekolah dan guru terkait setelah publikasi.

Dampak statis: setiap pengguna terautentikasi yang mengetahui nama objek berpotensi dapat membaca bukti pada sesi `stage = 4`, termasuk bukti yang belum dipublikasikan. Karena policy `select` juga dipakai untuk daftar objek Storage, enumerasi bucket berpotensi terbuka. Ini **belum diuji di hosted** dan tidak boleh disebut sebagai eksploitasi terkonfirmasi, tetapi selisih antara policy dan dokumentasi sudah cukup untuk membuka temuan.

Kriteria penerimaan:

| AC | Kriteria | Bukti yang harus dilampirkan |
| --- | --- | --- |
| AC-S02-1 | Policy baca hanya mengizinkan (a) kepala sekolah pemilik/pembuat sesi supervisi, dan (b) guru yang menjadi subjek sesi setelah `published_at is not null`. | Tes PGlite per peran |
| AC-S02-2 | Administrator, siswa, wali, pending, dan anonim tidak dapat membaca objek bukti, kecuali pemilik memutuskan akses pengawasan eksplisit dan keputusan itu tercatat. | Tes PGlite + keputusan di `DECISIONS.md` |
| AC-S02-3 | Bukti pada sesi yang belum dipublikasikan tidak dapat dibaca guru. | Tes PGlite |
| AC-S02-4 | Nama objek rusak, sesi lain, atau path di luar pola UUID ditolak. | Tes PGlite |
| AC-S02-5 | Penulisan/penghapusan tetap hanya untuk kepala sekolah pada `stage = 4` yang belum dipublikasikan; keputusan apakah harus pemilik sesi dicatat. | Tes PGlite |
| AC-S02-6 | Policy hosted diperiksa lewat `pg_policies`; unduhan lintas akun diuji oleh pemilik/penguji akun sekolah. | Log UAT + tangkapan hasil |

Pemilik: Copilot menulis migration baru (jangan mengubah migration lama); Kilo menyiapkan tes browser/UAT; Qoder meninjau policy. Penerapan hosted menunggu persetujuan pemilik.

### K1 — Tabel `todos` tidak dipakai dan tanpa transaksi

Bukti:

- `supabase/migrations/20261113074045_create_private_todos.sql` tidak memiliki `begin;`/`commit;`.
- Baris `13` memberi `select, insert, update, delete` kepada `authenticated`.
- Baris `15-30` membatasi setiap pengguna ke baris miliknya sendiri, sehingga tidak ada akses lintas pengguna.
- Pencarian repo hanya menemukan `todos` pada `scripts/check-supabase.mjs:25`; tidak ada rute atau API aplikasi yang memakainya.

Dampak: tabel contoh menambah permukaan serangan dan kebingungan operasional tanpa manfaat fitur. Karena RLS membatasi per baris, risikonya rendah, tetapi keputusan harus diambil pemilik.

Kriteria penerimaan:

| AC | Kriteria | Bukti yang harus dilampirkan |
| --- | --- | --- |
| AC-K1-1 | Pemilik memilih **drop** atau **keep**. | Keputusan tertulis di `DECISIONS.md` |
| AC-K1-2 | Jika drop: migration baru bertransaksi melakukan `revoke all` lalu `drop table public.todos`; daftar di `check-supabase.mjs` diperbarui. | SQL + `npm run check:supabase` |
| AC-K1-3 | Jika keep: tujuan tabel didokumentasikan dan grant DML dikurangi sesuai kebutuhan. | Keputusan + migration baru |
| AC-K1-4 | Tidak ada referensi kode yang rusak setelah perubahan. | `npm run check` |

Pemilik: pemilik proyek (keputusan), Copilot (migration lokal). Penerapan hosted hanya setelah persetujuan.

### K3 — Draf umpan balik terbaca administrator/kepala sekolah

Bukti:

- `supabase/migrations/20261111233649_task_feedback.sql:50-54` mengizinkan `administrator` dan `principal` membaca semua baris `task_feedback`, tanpa syarat `status = 'published'`.
- Baris `76-81` melakukan hal yang sama untuk `task_feedback_events`.
- UI tidak menampilkan draf kepada peran tersebut menurut audit sebelumnya, sehingga policy dan perilaku UI tidak selaras.
- Temuan terkait: `supabase/migrations/20261111234856_academic_assessments.sql:81-85` juga memberi administrator/kepala sekolah baca semua `assessments` tanpa syarat status, sedangkan modul ajar dan materi membatasi mereka ke non-draf. Konsistensi kebijakan draf perlu diputuskan bersama.

Dampak: guru dapat menganggap draf belum terlihat atasan, tetapi database mengizinkannya. Ini keputusan kebijakan, bukan eskalasi peran. Pola yang sama pada asesmen memperluas pertanyaan kebijakan ke semua draf akademik.

Kriteria penerimaan:

| AC | Kriteria | Bukti yang harus dilampirkan |
| --- | --- | --- |
| AC-K3-1 | Pemilik memilih (a) draf hanya untuk penulis, atau (b) akses baca institusional disengaja. | Keputusan tertulis di `DECISIONS.md` |
| AC-K3-2 | Jika (a): migration baru membatasi administrator/kepala sekolah ke `status = 'published'`; event draf hanya untuk penulis. | Tes PGlite |
| AC-K3-3 | Jika (b): akses draf didokumentasikan di README/DECISIONS dan diuji sebagai perilaku yang disengaja. | Tes + dokumen |
| AC-K3-4 | Guru penulis tetap dapat membaca draf sendiri; siswa/wali hanya hasil terbit. | Tes PGlite per peran |
| AC-K3-5 | Keputusan draf diterapkan konsisten pada umpan balik dan asesmen: administrator/kepala sekolah hanya membaca draf bila akses institusional disengaja. | Tes PGlite + keputusan di `DECISIONS.md` |

Pemilik: pemilik proyek (keputusan), Copilot (migration lokal). Peninjau: Qoder.

### H-09 — Header keamanan Vercel belum ada

Bukti: `vercel.json:1-5` hanya memuat `buildCommand`, `outputDirectory`, dan rewrite SPA; tidak ada `headers`.

Kriteria penerimaan:

| AC | Kriteria | Bukti yang harus dilampirkan |
| --- | --- | --- |
| AC-H09-1 | Header respons memuat `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`, `Permissions-Policy`, dan HSTS. | `curl -I` atau DevTools |
| AC-H09-2 | CSP membatasi `script-src`, `connect-src` ke Supabase, `img-src`/`font-src` sesuai kebutuhan, serta `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`. | Header + uji browser |
| AC-H09-3 | Alur login, dashboard, ekspor PDF/XLSX, unggah/unduh bukti, dan worker XLSX berjalan tanpa pelanggaran CSP di konsol. | Tes browser + catatan konsol |
| AC-H09-4 | Perubahan konfigurasi hosting diusulkan Kilo dan ditinjau Qoder; penerapan produksi oleh pemilik. | PR/berkas + persetujuan |

Catatan: nilai CSP tepat harus diuji, bukan disalin mentah. `blob:` dan `worker-src` kemungkinan diperlukan untuk unduhan/worker; jangan menambah `unsafe-eval`.

## 3. Definisi selesai L09

L09 baru dapat ditutup bila:

1. S-01, S-02, K1, K3, dan H-09 memiliki keputusan serta implementasi yang disetujui.
2. Semua AC di atas memiliki bukti tes lokal; temuan hosted memiliki bukti UAT.
3. Tidak ada temuan Tinggi terbuka pada laporan audit ulang.
4. `npm run check` lulus dan log suite browser penuh tersimpan.
5. Dokumen `SECURITY_REVIEW.md`, `AUDIT_RINGKASAN_PROYEK.md`, dan papan koordinasi diperbarui tanpa klaim “aman”.

## 4. Belum diverifikasi

- Perilaku policy Storage di hosted dan dengan akun sekolah nyata.
- CSP pada deployment produksi Vercel.
- Log suite browser penuh terbaru; `npx playwright test --list` menunjukkan 202 tes, tetapi log run terakhir yang tersimpan terpotong.
- Ketiadaan kredensial demo di bundel produksi aktual.

## 5. Keputusan pemilik yang diperlukan

1. K1: drop atau keep `todos`.
2. K3: draf umpan balik dan draf asesmen hanya penulis atau akses institusional.
3. S-02: apakah administrator boleh membaca bukti supervisi; apakah setiap kepala sekolah boleh menulis ke sesi kepala sekolah lain.
4. H-09: izin layanan pihak ketiga bila CSP memerlukan domain tambahan.
5. Lokasi dan versi resmi 7 dokumen acuan untuk L01.

## 6. Laporan sesi

```
Tugas: L09 | Agen: Qoder | Branch: working tree ai/codex-pdf-splitting (tidak ada commit)
Hasil: Audit ulang statis S-01, S-02/K4, K1, K3, dan header Vercel; S-02 ditemukan lebih luas dari catatan sebelumnya karena policy baca Storage hanya memeriksa stage=4.
Bukti: npm test 109/109 lulus (15 November 2026); npx playwright test --list 202 tes; telaah kode dan migration tanpa membaca data hosted.
Berkas: docs/AUDIT_L09_KRITERIA_PENERIMAAN.md, docs/AI_COORDINATION.md.
Belum diverifikasi: policy Storage hosted, CSP produksi, log suite browser penuh, bundel produksi aktual.
Butuh pemilik: keputusan K1, K3, S-02, H-09, dan lokasi 7 acuan L01.
```
