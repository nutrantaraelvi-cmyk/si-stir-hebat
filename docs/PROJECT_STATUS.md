# Status SI STIR HEBAT

## Pemeriksaan workspace - 24 November 2026

- Baseline lokal memiliki 42 migration berurutan. Lint, typecheck, seluruh 152 unit/database/smoke test, dan build terisolasi lulus dengan Node 24.22.3. Smoke test menggunakan server preview loopback dan verifikasi penolakan REST anonim.
- Tes browser terfokus untuk dashboard/RBAC lulus 12/12 pada desktop dan ponsel. Tes unduhan berkas aktif dan versi historis lulus 2/2. Suite browser penuh tetap memakai mock API dan belum menjadi UAT akun sekolah.
- Dokumen arsitektur aktif: [arsitektur database](ARSITEKTUR_DATABASE.md), [arsitektur aplikasi/server/UI/UX](ARSITEKTUR_APLIKASI.md), [matriks RBAC](RBAC_MATRIX.md), [PRD operasional](PRD_OPERASIONAL.md), [runbook CI/CD](CI_RUNBOOK.md), dan [runbook operasional](RUNBOOK_OPERASIONAL.md).
- Hosted belum berubah. Rekonsiliasi 23 migration hosted dengan migration lokal, Security Advisor, backup/restore, bootstrap administrator, konfigurasi redirect Auth, dan UAT sekolah tetap merupakan gate sebelum deployment atau penerapan migration.

## Pemeriksaan workspace - 22 November 2026

- Tidak ada konflik Git aktif atau penanda konflik pada berkas sumber. Ekspektasi tes validasi kebiasaan disesuaikan untuk memeriksa perubahan status terlarang dan pembaruan yang ditolak RLS. `npm run check` lulus: 149 tes, lint, typecheck, dan build terisolasi. Ini bukan audit menyeluruh seluruh kode atau UAT hosted.

## Gaya bersama Tailwind - 22 November 2026

- Plugin Tailwind Vite diaktifkan dan gaya bersama diterapkan pada halaman fitur, formulir, tabel, status, fokus, dan konfirmasi. Build terisolasi, lint, dan typecheck lulus; tampilan setiap halaman belum ditinjau visual. `npm run check` gagal pada tes database kebiasaan di `tests/database.test.mjs:1257` (ekspektasi penolakan tidak terjadi), sehingga rangkaian lengkap belum lulus.

## Daftar kebiasaan ruang murid - 22 November 2026

- Dashboard murid menampilkan tujuh kebiasaan sebagai daftar interaktif sementara, dengan penghitung dan animasi kemajuan. Pilihan hanya berlaku selama halaman terbuka; catatan resmi tetap diisi wali dan divalidasi guru.

## Formulir saat data kosong - 22 November 2026

- Formulir asesmen, materi, tugas, modul ajar, jurnal, dan laporan ketidakhadiran dapat dibuka meskipun penugasan atau hubungan anak belum tersedia. Penyimpanan tetap memerlukan data dan izin yang sah. Halaman lain belum diaudit seluruhnya untuk kebutuhan ini.

## Penetapan peran akun - 22 November 2026

- Halaman operator menyediakan pencarian nama/email, tombol muat ulang, petunjuk akun yang belum muncul, dan konfirmasi pencocokan identitas sebelum peran ditetapkan.

- Dashboard administrator dan navigasi kini memuat halaman Akun sekolah untuk menetapkan peran pada akun `pending` dengan email terverifikasi. Admin mencocokkan nama/email, memilih guru, kepala sekolah, murid, atau orang tua/wali, lalu mengonfirmasi perubahan.
- Migration lokal `20261122000200_admin_role_assignment.sql` menambahkan RPC yang memeriksa role administrator di database, menolak akun belum terverifikasi atau sudah diproses, membatasi role yang dapat ditetapkan, dan mencatat perubahan peran. Akun administrator pertama tetap perlu bootstrap operator karena belum ada admin yang dapat membuka halaman.
- Migration belum diterapkan ke Supabase hosted sesuai gate proyek. Perlu bootstrap administrator pertama dan penerapan migration setelah semua gate hosted lolos. Verifikasi otomatis belum dijalankan.

## Ruang kepala sekolah dan orang tua - 22 November 2026

Dashboard kepala sekolah dan orang tua kini dipersonalisasi dengan panel sambutan, tindakan utama, dan layanan terkelompok sesuai kewenangan. Fitur wali menegaskan hubungan anak harus sudah tertaut; keputusan laporan izin tetap dilakukan guru. Typecheck/lint lulus; browser/UAT belum dijalankan.

## Ruang guru - 22 November 2026

Dashboard guru memiliki panel kerja personal dan pintasan terkelompok untuk pembelajaran, kegiatan kelas, kegiatan profesional, serta akun. Tautan menjelaskan fungsi ringkas dan tetap mengikuti permission guru yang berlaku. Gaya responsif dan animasi mendukung reduced motion. Typecheck/lint lulus; browser/UAT belum dijalankan.

## Ruang murid - 22 November 2026

Dashboard murid dipersonalisasi dengan sapaan nama, sambutan belajar, pintasan materi/tugas, serta layanan terkelompok untuk belajar, keseharian, informasi, dan akun. Gaya responsif dengan gerakan reduced-motion. Typecheck, lint, dan pemeriksaan diff lulus; browser/UAT belum dijalankan.

## Pergantian akun untuk UAT peran - 22 November 2026

Halaman login dan daftar kini memberi tindakan keluar saat sesi masih aktif, agar akun uji lain dapat digunakan dari browser yang sama. Role tetap berasal dari `profiles.role`; label peran pada form hanya tampilan, sementara pendaftaran mandiri berstatus `pending`. Typecheck/lint lulus. UAT hosted belum dijalankan.

## Dashboard administrator - 22 November 2026

Dashboard administrator kini menyediakan pusat kendali dengan pencarian layanan, filter kategori, kartu akses responsif, dan interaksi ringan yang menghormati reduced motion. Daftar mengikuti layanan yang sudah tersedia untuk administrator; otorisasi aplikasi/database tidak berubah. Typecheck, lint, dan pemeriksaan diff lulus. Tes browser untuk perubahan ini belum dijalankan.

## Infrastruktur dan kapasitas - 22 November 2026

## Pendaftaran akun mandiri - 22 November 2026

- Ditambahkan halaman `/daftar` untuk nama, email, dan kata sandi; tautan tersedia dari beranda dan login. Pendaftaran menggunakan Supabase Auth `signUp` dan meminta verifikasi email.
- Migration lokal `20261122000100_signup_profile_name.sql` menyimpan nama profil dari metadata Auth yang diberikan pengguna dan selalu membuat peran `pending`; metadata role yang dikirim pengguna diabaikan. Sekolah tetap harus memverifikasi/mengaitkan akun ke data siswa/guru melalui alur tautan akun.
- Ini mengurangi pembuatan akun Auth manual, tetapi belum menghapus kebutuhan verifikasi/tautan oleh admin. Migration baru belum diterapkan ke Supabase hosted sesuai gate proyek. Lint/typecheck lulus; tes otomatis hasil lengkap belum diperoleh.

## Penyelesaian fitur yang belum lengkap secara hosted - 22 November 2026

- Kebiasaan kini mengikuti D6: wali yang mengisi, murid hanya membaca catatan dan rekap sendiri, guru memvalidasi. Hak submit UI dan fungsi RLS lokal sudah wali saja; tes database memastikan murid tidak dapat INSERT.
- Dokumen sekolah kini menyediakan unduhan berkas aktif dan tiap versi historis melalui Storage privat, dengan pemeriksaan bahwa path satu tingkatnya berada di folder dokumen tersebut. Uji upload versi lulus; uji unduhan browser belum tuntas karena route mock Storage SDK tidak menangkap request.
- Komunikasi, notifikasi, laporan wali, absensi guru dan sebagian besar administrasi dokumen sudah memiliki route/API, migration lokal, serta tes browser terdahulu. Cakupan yang belum ada tetap tercantum di `QA_COVERAGE.md`.
- Hosted belum berubah: tabel keenam fitur tidak ada di project Supabase, perbedaan konfigurasi sekolah/deletion request memerlukan rekonsiliasi, Security Advisor masih memperingatkan perlindungan password bocor nonaktif, Supabase lokal dan bukti backup/restore belum tersedia. Oleh karena itu migration tidak dijalankan remote.

- **Rekonsiliasi migrasi hosted 22 November 2026:** metadata katalog Supabase kini dicocokkan untuk semua 16 file lokal yang tidak tercatat—tabel/kolom, constraint, policy, fungsi, index, trigger, dan bucket. Objek fitur kebiasaan/komunikasi/laporan wali/notifikasi/dokumen/absensi guru belum ada; lima tabel konfigurasi plus `deletion_requests` sudah ada dengan semantik dan constraint berbeda. `npm run check:supabase` mengonfirmasi Auth aktif dan penolakan anonim tabel lama, lalu gagal HTTP 404 pada `habit_records`. Tidak ada DDL/metadata migration hosted ditulis. Rincian, perbandingan semantik, dan gate tersisa: [HOSTED_MIGRATION_RECONCILIATION_2026-11-22.md](HOSTED_MIGRATION_RECONCILIATION_2026-11-22.md). Migrasi hosted masih tertahan oleh drift, Advisor, dan backup/restore + Supabase lokal yang belum terverifikasi.

Frontend Vite statis memakai CDN global Vercel; cache satu tahun untuk asset build ber-hash dikonfigurasi di `vercel.json`. Cache publik tidak diterapkan pada data Data API/RPC yang bergantung pada pengguna atau RLS. Supabase terhubung berada di paket Free, region Seoul, PostgreSQL 17.11.0.018. Snapshot statistik menunjukkan tabel operasional hampir kosong dan log 24 jam bervolume kecil, sehingga belum ada bukti untuk menaikkan compute atau membuat read replica.

Performance Advisor melaporkan 15 foreign key tanpa indeks penutup dan 63 indeks belum terpakai. Tidak ada indeks database yang diubah: riwayat hosted 23 migration sampai `20261113074045` tidak cocok dengan 39 migration lokal, dan metadata hosted untuk konfigurasi sekolah berbeda dari migration lokal. Rekonsiliasi skema dan verifikasi backup/restore wajib sebelum DDL hosted. Read replica/load balancer Supabase memerlukan paket berbayar dan compute Small; belum dibuat. Rincian: [INFRA_SCALING_CACHE_DB.md](INFRA_SCALING_CACHE_DB.md).

- **Restyling UI 22 November 2026:** token warna/typografi disatukan, lima variasi ruang peran tersedia, halaman fitur diremajakan, dan komponen dashboard/formulir/status mendapat interaksi ringan dengan dukungan `prefers-reduced-motion`. Audit warna menyesuaikan angka penanda bagian dan kartu ke warna ungu berkontras memadai. `npm run check` Node 24 EXIT 0: 39 migration, lint, typecheck, **149/149** tes, build terisolasi 1.792 modul dan 30 bundel JavaScript tanpa akun demo (peringatan chunk PDF 790,69 kB). Suite browser penuh **420/420 lulus** di desktop dan ponsel, port 5191. Screenshot beranda dan login diperiksa pada 1280×900 dan 390×844; tidak ada overflow horizontal. Gerakan pita nonaktif pada reduced motion; tes keyboard/fokus turut lulus. Browser memakai API tiruan, bukan UAT akun sekolah. Catatan pola referensi: `docs/UI_REFERENSI_NOTES.md`.

- **Login sesuai ruang peran:** halaman masuk kini menyediakan pilihan Murid, Orang tua, Guru, Kepala Sekolah, dan Administrator. Pilihan mengganti sapaan, ikon, dan aksen panel; akun Supabase serta profil tetap menentukan sesi dan hak akses. Ruang Murid memakai ikon dan ornamen ceria responsif. Belum diuji secara visual/browser pada perubahan ini.

- **Beranda terinspirasi ITS dan Kemendikdasmen:** hero ilustratif dan pita layanan bergerak dipadukan dengan struktur informasi sekolah dan kartu ruang peran. Tautan peran membuka login dengan pilihan ruang yang cocok. Pratinjau desktop sudah ditinjau pada Vite lokal port 5173; tes responsif otomatis dan UAT belum dijalankan.

- **Vite:** konfigurasi kosong dipulihkan dari Git; server lokal yang sudah berjalan pada port 5173 merespons HTTP 200. Tes aplikasi belum dijalankan.

Diperbarui: 22 November 2026 (Asia/Jakarta). Workspace: `D:/code/SI_STIR_HEBAT_Starter/si-stir-hebat`.

## Ringkasan

- **Ruang peran:** dashboard lokal menampilkan ruang guru, murid, orang tua, dan kepala sekolah sesuai peran profil, dengan tautan layanan yang mengikuti pemeriksaan izin yang sudah ada. Lint, typecheck, dan build terisolasi lulus; akses memakai akun sekolah nyata belum diuji.

- **Styling 21 November 2026:** Tailwind CSS dan plugin Vite ditambahkan; tema bersama mencakup navigasi, halaman, formulir, tabel, status, dan dialog. Lint, typecheck, dan build terisolasi lulus. Peninjauan visual per fitur dan akun sekolah belum dilakukan; merge Git masih belum selesai.

- **Check lokal:** `npm run check` Node v24.22.3 EXIT 0 pada 21 November: migration/CI check, lint, typecheck, **140/140** tes unit/database, build terisolasi 1.789 modul, audit **30 bundel JavaScript tanpa akun demo**. Log [check-2026-11-21-node24.log](logs/check-2026-11-21-node24.log); peringatan chunk PDF 790,69 kB. Build release `npm run build` juga EXIT 0 pada 21 November: 1.789 modul, 30 bundel JS diaudit tanpa akun demo, output `dist/` berhasil diganti.
- **Check fase konfigurasi sekolah:** `npm run check` EXIT 0 pada 21 November 2026, **149/149** tes unit/database, 39 migration, build terisolasi 1.789 modul, 30 bundel JavaScript tanpa akun demo. Termasuk 9 test PGlite baru untuk konfigurasi sekolah. Peringatan chunk PDF 790,69 kB tetap ada.
- **Browser:** suite penuh terbaru **420/420 lulus**, port 5191, 7,1 menit, EXIT 0, satu worker, desktop + mobile; memakai Vite eksternal yang direuse untuk mencegah proses child tertinggal saat cleanup. Ringkasan di [browser-full-2026-11-21-port5191-reuse.log](logs/browser-full-2026-11-21-port5191-reuse.log). API tiruan, bukan UAT akun sekolah. Suite 402/402 port 5472 adalah bukti historis untuk tree sebelumnya.
- **Validasi terdahulu:** run Qoder sebelumnya 137/137 unit/database dan 312/312 browser (port 5401). Angka itu historis, bukan bukti untuk tree sekarang.
- **Migration:** 39 berkas lokal menurut `node scripts/check-migrations.mjs`, 23 tercatat hosted berdasarkan pemeriksaan read-only terakhir, 16 belum hosted. Migration baru `20261121090000_school_configuration.sql` belum hosted. Tidak ada migration hosted diterapkan.
- **Hosted:** pemeriksaan read-only 21 November 2026 08:52 WIB mengonfirmasi 23 migration sampai `20261113074045`; Security Advisor WARN `auth_leaked_password_protection`. Inventaris metadata skema tersimpan di [HOSTED_SCHEMA_SNAPSHOT_2026-11-20.md](HOSTED_SCHEMA_SNAPSHOT_2026-11-20.md); bukan backup/restore. Tidak ada migration hosted diterapkan.
- **check:supabase:** gagal sebelum HTTP Auth check karena DNS `ENOTFOUND`. Validasi lokal memastikan format konfigurasi benar dan hostname cocok dengan project tersambung; nilai konfigurasi tidak dibaca/dicatat. Periksa resolver/jaringan lokal sebelum mengulang.
- **Belum terverifikasi:** clean install `npm ci` (EPERM pada binary Windows terkunci; dependency pulih lewat install non-clean), build release yang menimpa `dist/`, Supabase lokal, backup/restore, deploy, dan UAT akun sekolah.

## Riwayat pembaruan

## Migration konfigurasi sekolah - 21 November 2026

- Ditambahkan migration lokal `20261121090000_school_configuration.sql` dan 9 test PGlite pada `tests/school-configuration.test.mjs`. Mencakup pengaturan KKM, retensi, katalog absensi guru, jenis dokumen, kalender sekolah, dan permintaan penghapusan dengan RLS/grant minimal.
- Retensi bukti supervisi diperbarui sesuai revisi pemilik 21 November 2026 menjadi 1 tahun ajaran. `execute_deletion_request` hanya mencatat bahwa operator melakukan tindakan; tidak ada penghapusan otomatis.
- `npm run check` Node v24.22.3 EXIT 0: 39 migration, lint, typecheck, **149/149** tes, build terisolasi 1.789 modul, 30 bundle JS tanpa akun demo. Peringatan PDF 790,69 kB.
- Belum hosted: 16 migration lokal berikut belum tercatat hosted. Advisor WARN dan seluruh gerbang hosted tetap berlaku; tidak ada write remote.

## Pembaruan build release — 21 November 2026

- `npm run build` dijalankan dengan Node v24.22.3 dan konfigurasi Supabase sintetis sementara pada proses build; guard `prebuild` lulus, Vite membangun 1.789 modul, lalu `scripts/check-demo-bundle.mjs dist` memeriksa 30 berkas JavaScript dan tidak menemukan akun demo. Exit 0; output release `dist/` berhasil ditimpa. Peringatan chunk PDF 790,69 kB tetap ada.
- Tidak ada credential yang dicatat. Ini verifikasi build lokal, bukan deploy atau UAT.

## Pembaruan Codex — 21 November 2026

- `npm run check` Node v24.22.3 EXIT 0 setelah pembaruan docs: 38 migration, CI workflow, lint, typecheck, 140/140 unit/database, isolated build 1.789 modul, 30 JavaScript tanpa akun demo. Peringatan chunk PDF 790,69 kB.
- `npm run check:supabase` (21 Nov) validasi config lokal lulus tetapi DNS gagal `ENOTFOUND` sebelum request; project URL/key tidak dicetak. Tidak dianggap hasil verifikasi tabel hosted.
- Browser run bersih pada tree ini: 420/420 EXIT 0; catatan run cleanup yang tidak bersih sudah superseded.
- Kontrak API dan keputusan role absensi guru/dokumen diperjelas. Hosted masih 23/38 migration dan Advisor WARN; Supabase lokal, `check:supabase`, backup/restore teruji, UAT, merge, dan deploy belum terpenuhi.
- Merge belum dapat ditinjau: Git lokal di `ai/codex-foundation` tidak memiliki remote; 163 path bercampur staged/unstaged/untracked dari pekerjaan lintas agen. GitHub read-only mengonfirmasi remote repo dengan default `main`, tetapi branch `ai/codex-foundation` dan PR belum ada. Perubahan dipertahankan tanpa commit.

## Pembaruan 20 November 2026

- **Tes kanonik pada snapshot sebelum konsolidasi:** `npm run check` EXIT 0: 137/137 tes, 39 migration, build 1.781 modul dan audit 26 JS. Angka itu historis; hasil terkini 140/140 tes dan 38 migration ada pada Ringkasan.
- **Browser:** suite penuh **312/312 lulus** di desktop dan ponsel (port 5401, 8,8 menit, EXIT 0; log `%TEMP%\qoder-qa-2026-11-18\browser-full-5401.log`). Run 311/312 sebelumnya gagal pada satu tes impor XLSX; tes kini menunggu pratinjau tampil. Run lain tidak valid karena OOM Vite (port 5389) dan diulang dengan heap 4 GB. Semua tes memakai API tiruan, bukan UAT.
- **Migration/hosted:** 23 versi hosted cocok dengan 23 migration lokal pertama; 15 migration lokal belum hosted sesudah konsolidasi. `public.todos` telah dihapus di migration lokal `security_foundation`; pemeriksaan read-only 13:29 WIB mencatat `todos_count=0`. Security Advisor tetap WARN `auth_leaked_password_protection`, sehingga **tidak ada migration hosted diterapkan**.
- **Backend:** X8 `dashboard_overview()` dan sinyal pemotongan daftar (limit+1) terintegrasi; dua partial index diuji PGlite EXPLAIN ANALYZE atas 50.000 modul sintetis, bukan benchmark hosted. X9 Supabase lokal tertahan (Docker/WSL tidak tersedia). X10 preflight Vercel tanpa CLI/variabel lingkungan, tidak ada deploy. X11 review/merge tertahan karena branch dan worktree bercampur.
- **UI Qoder:** helper izin per domain, `AuthProvider` di `src/components/auth/`, halaman `ConfigMissing` tanpa cabang demo, token desain + komponen bersama (PageHeader/StatusBadge/DataTable/ConfirmDialog/PendingState), dan rute lazy dengan fallback sudah terpasang. Verifikasi memakai tes terfokus; adopsi komponen ke halaman lama belum menyeluruh.
- **Q8/Q9 (kualitas & aksesibilitas):** semua halaman modul hari ini memakai API asli tanpa data tiruan di `src/`; penolakan lintas peran diuji per halaman (termasuk siswa dan akun menunggu tanpa pembacaan tabel pada dokumen dan absensi guru). Perbaikan Q9 terpasang: paginasi `aria-live="polite"` (7 tempat), tombol muat ulang dasbor `type="button"`, dan `ConfirmDialog` dengan jebakan Tab/pemulihan fokus yang kini dipakai alur arsip dokumen (fokus tombol konfirmasi, Escape membatalkan tanpa PATCH). Bukti terfokus ada di `docs/Q9_A11Y_FIX_LIST_2026-11-20.md`; verifikasi ulang Q9 dan suite penuh tetap menunggu S3 Codex, sedangkan handoff API asli (S2) belum tercatat di papan.
- **Dokumen (Q6):** `docs/RBAC_MATRIX.md` disusun ulang dari policy 38 migration lokal dengan kode V/C/U/D/A/E; PROJECT_STATUS diurutkan kronologis dengan satu header tanggal; README, AGENTS, dan QA_COVERAGE diselaraskan dengan angka kanonik; konflik stack PRD (Next.js/Tailwind/Zod/monorepo) dicatat di `docs/DECISIONS.md`.
- **Modul hari ini:** laporan ketidakhadiran wali, pusat notifikasi, rekap mingguan 7 Kebiasaan, administrasi dokumen (versi/review), absensi guru dengan persetujuan koreksi, dan dashboard per peran. Rincian ada pada entri di bawah.
- **Sisa risiko:** S-02 bukti supervisi masih terbaca semua akun login; K3 draf asesmen belum diputuskan; UAT akun sekolah, email nyata, CI hosted, restore backup, dan kesiapan operasional belum diverifikasi.

## Laporan ketidakhadiran wali — 20 November 2026

- Rute `/laporan-ketidakhadiran` (`src/features/parents/AbsenceReports.tsx`) memakai API `src/features/parents/api/absence-reports` tanpa mengubah API atau migration. Wali memilih anak tertaut, tanggal (tidak boleh mendatang), dan alasan; guru kelas melihat laporan kelas penugasan dan memutuskan `confirmed`/`rejected` lewat RPC dengan catatan wajib; admin/kepala sekolah baca-saja.
- Pengiriman menyimpan ID permintaan; bila respons hilang, tombol "Kirim ulang laporan" mengirim ID yang sama. Kode `23505` ditampilkan sebagai laporan yang sudah ada untuk anak dan tanggal itu. Konflik revisi `40001` meminta muat ulang daftar dan mempertahankan catatan.
- Daftar 25 baris per halaman dengan sentinel; nama murid diambil dari RPC `habit_students` (baca-saja). Bila RPC tidak tersedia, nama diganti label "Murid terhubung" tanpa mengarang identitas.
- Verifikasi: typecheck dan lint fokus lulus; `tests/browser/absence-reports.spec.ts` 4/4 lulus (desktop + ponsel); angka kanonik mengikuti ringkasan di atas. Belum dijalankan akun sekolah nyata; migration `20261118000200_guardian_absence_reports` belum hosted.

## Pusat notifikasi — 20 November 2026

- Rute `/notifikasi` menampilkan notifikasi milik akun sendiri (RLS `notifications_read_own`), 25 baris per halaman dengan sentinel, label kategori/prioritas berbahasa Indonesia, penanda "Belum dibaca", serta tombol "Tandai sudah dibaca" yang memanggil `mark_notification_read`.
- Galat tanda-baca tidak menghilangkan notifikasi: pesan galat menyebut judul yang gagal, tombol tetap aktif, dan percobaan ulang memakai ID yang sama.
- Halaman memakai `daftarNotifikasi`/`tandaiNotifikasiDibaca` dari `src/features/notifications/api` tanpa mengubah API atau migration. Status kontrak API belum ditandai REVIEW di papan koordinasi; UI hanya membaca kontrak yang sudah ada.
- Verifikasi: typecheck dan lint fokus lulus; 4/4 skenario Playwright baru lulus (desktop 1280x900 + ponsel 390x844) dan angka kanonik mengikuti ringkasan di atas. Belum dijalankan akun sekolah nyata.

## Kondisi `55000` konfirmasi laporan wali — 20 November 2026

`src/features/parents/AbsenceReports.tsx` kini membedakan galat revisi `40001`, kondisi `55000` (tidak ada tepat satu sesi/roster absensi untuk tanggal laporan), dan galat lain. Pada `55000` guru melihat pesan bahwa laporan belum dikonfirmasi dan status absensi tidak berubah, tombol "Kembali ke daftar laporan", tanpa pesan sukses, dengan catatan pemeriksa tetap dipertahankan. Tes baru di `tests/browser/absence-reports.spec.ts`; fokus 6/6 port 5376; `npm run check` EXIT 0 (137/137). Rincian: `docs/ABSENSI_55000_2026-11-20.md`. Perilaku RPC diuji lewat API tiruan; hosted belum diuji.

## Sinyal pemotongan daftar master — 20 November 2026

Daftar referensi berbatas (opsi penugasan di Asesmen, Materi, Tugas, Modul, Jadwal; opsi guru Supervisi; filter kelas; tahun ajaran 200; riwayat absensi 200) kini meminta `cap + 1` baris, menampilkan sampai batas, dan memberi notifikasi pemotongan alih-alih menggagalkan halaman. Bukti: `npm run check` EXIT 0 (137/137, 39 migration); `tests/browser/app.spec.ts` 214/214 port 5375. Batas adalah kebijakan tampilan, bukan otorisasi. Rincian: `docs/PEMOTONGAN_DAFTAR_2026-11-20.md`.

## Dashboard per peran — 20 November 2026

- Dashboard administrator/kepala sekolah memakai satu RPC `dashboard_overview()` melalui `getDashboardOverview(client)` (`src/lib/dashboard-overview.ts`, kontrak Codex): registri aktif (siswa/guru/kelas), tahapan supervisi 1–4, status modul ajar (perlu ditinjau/dikembalikan), dan tiga pengumuman terbaru beserta jumlah terbit/draf. Komponen `SchoolOverview.tsx`/`PrincipalOverview.tsx` dihapus.
- Kegagalan RPC menampilkan alert "Ringkasan dashboard belum dapat dimuat. Pilih Muat ulang untuk mencoba lagi." tanpa data palsu; tombol "Muat ulang" mengulang profil + RPC. Guru, siswa, wali, dan pending tetap memakai jalur pengumuman (tanpa RPC).
- Verifikasi: `npm run check` Node v24.22.3 EXIT 0 (39 migration, 137/137, 26 bundel); suite penuh port 5372 300 tes, 299 lulus dengan satu timeout 30 dtk [mobile] yang lulus 2/2 saat diulang terpisah port 5373; run terfokus 56/56 port 5371. Rincian: `docs/DASHBOARD_Q10_2026-11-20.md`. RPC belum hosted; sampai migration `20261120044500` diterapkan aplikasi tersambung menampilkan galat yang bisa dipulihkan.

## 7 Kebiasaan harian — 20 November 2026

- Rute `/kebiasaan` (`src/features/student-habits/StudentHabits.tsx`) kini memakai `src/features/student-habits/api` (`daftarKebiasaan`, `simpanKebiasaan`, `validasiKebiasaan`) tanpa mengubah API atau migration. Daftar murid berasal dari RPC baca-saja `habit_students`; siswa memakai baris siswa sendiri bila RPC tidak tersedia.
- Murid/wali menandai tujuh indikator lewat tombol besar (min. 56px, `aria-pressed`), menyimpan per tanggal, dan melihat riwayat 25 baris per halaman. Tanggal mendatang ditolak oleh validasi API.
- Guru penugasan wajib menulis catatan validasi (1-1.000 karakter); validasi memakai revisi yang dimuat dan menampilkan pesan muat ulang bila baris berubah. Admin/kepala sekolah baca-saja; peran pending ditolak.
- Verifikasi: `tests/browser/habits.spec.ts` 4/4 lulus (desktop 1280x900 + ponsel 390x844, tanpa overflow horizontal); angka kanonik mengikuti ringkasan di atas. Belum dijalankan akun sekolah nyata; migration `20261114000139_student_habits` dan `20261118000100_student_habits_validation` belum hosted. Pembeda "belum diisi" vs "tidak dilakukan" tetap PD-12.
- Rekap 7 catatan terakhir (per indikator, tanpa perbandingan antar siswa) terverifikasi dalam suite browser 304/304 pada port 5203 (20 November 2026). Perbaikan harness memakai host dan kunci uji yang lolos validasi `src/lib/config.ts`; tidak ada perubahan kode aplikasi pada tugas harness tersebut.
- Rekap minggu ini — 20 November 2026: halaman `/kebiasaan` kini memakai RPC `habit_weekly_summary` yang sudah ada untuk menampilkan hari terisi/terlewat dan hitungan per indikator bagi murid terpilih, dengan label "belum diisi, bukan berarti tidak dilakukan" dan "bukan peringkat". Wali dengan beberapa anak mendapat rekap anak yang sedang dipilih. API, RPC, dan migration tidak diubah. Bukti fokus: `tests/browser/habits.spec.ts` 10/10 desktop + ponsel, port 5413, EXIT 0 (log `%TEMP%\qoder-qa-2026-11-18\habits-5413.log`); typecheck dan lint bersih. Suite penuh 312/312 port 5401 dijalankan sebelum perubahan ini.

## Polish halaman Akun — 20 November 2026

- `/akun` memperlihatkan profil, email, ID akun yang sudah ada, peran, tautan kata sandi, tautan pengumuman, dan tindakan keluar dalam susunan yang responsif.
- Desktop memakai dua kolom; ponsel memakai satu kolom. Tautan dan kontrol mempertahankan target sentuh minimal 44px serta fokus keyboard.
- Verifikasi: `npm run typecheck` lulus, lint terfokus dua berkas lulus, dan 14 skenario Playwright terpilih desktop/mobile lulus dengan API tiruan.
- Belum dijalankan suite browser penuh dan belum ada UAT akun sekolah nyata pada perubahan ini.

Catatan: entri bertanggal di bawah adalah riwayat. Angka pada entri lama adalah angka run saat itu; angka tersebut tidak otomatis menggantikan baseline di atas.

## Pengamanan bundel demo dan Komunikasi — 15 November 2026

Mode demo kini hanya aktif ketika Vite menyatakan `DEV === true` dan Supabase tidak terkonfigurasi. Build produksi mengganti modul demo dengan implementasi kosong dan memeriksa semua berkas JavaScript terbangun agar penanda akun demo tidak ikut terbundel. `npm run check` lulus; 7 berkas JavaScript diperiksa tanpa temuan akun demo.

UI Komunikasi kini mempertahankan ID dan isi permintaan saat hasil kirim belum diketahui, memeriksa ID pesan sebelum mengirim ulang, serta memverifikasi pesan yang tersimpan setelah galat jaringan. Daftar pesan memakai pagination 25 baris dengan sentinel agar tidak melewatkan pesan di batas halaman. Tes unit dan browser menutup alur respons hilang serta perpindahan halaman.

Batas verifikasi: suite penuh browser berakhir 212/216 karena empat galat penutupan trace, bukan assertion aplikasi; empat skenario lulus ketika diulang sendiri. Tes memakai API tiruan. Migration komunikasi belum hosted, dan UAT sekolah nyata belum dilakukan.

## Perbaikan demo forgot-password — 15 November 2026

Perbaikan keamanan dan UX pada mode demo: pencarian profil untuk reset kata sandi kini memakai email, bukan `userId` kosong, sehingga validasi akun demo bekerja secara case-insensitive untuk alamat seperti `ADMIN@SDN03.SCH.ID`. Fungsi baru `getDemoProfileByEmail()` dipakai di form lupa kata sandi, dan pengujian regresi ditambahkan untuk validasi email serta perubahan profil/password di mode demo. Validasi: `npm run typecheck` dan `node --test tests/demo-auth.test.mjs` lulus.

## UI komunikasi guru-wali — 15 November 2026

Peta rute baru menambahkan halaman `/komunikasi` untuk guru dan orang tua. Guru dapat memilih wali/murid yang masih aktif dan mengirim pesan teks; wali dapat membaca pesan yang masuk untuk murid terverifikasi. Konten mengikuti kontrak API lokal: pesan append-only, tunggal dan dibatasi 1-4.000 karakter, serta hanya menampilkan relasi yang masih aktif. Validasi: `npm run check` lulus (lint, TypeScript, 109 tes, build). UI belum menggantikan UAT akun sekolah nyata atau penerapan hosted.

## Audit kesesuaian workspace — 14 November 2026

Pemeriksaan langsung pada root aplikasi: npm run check lulus (lint, TypeScript, 101 tes, build). Build memberi peringatan chunk mesin PDF 790,69 KB dan font 855,16 KB. Browser dan UAT akun sekolah tidak diulang pada audit ini.

Fitur yang terkonfirmasi dalam kode mencakup asesmen, laporan akademik dan usulan jadwal. Pernyataan historis bahwa usulan jadwal masih pekerjaan berikutnya sudah tertinggal. Folder docs/references serta berkas PRD/RBAC tidak ditemukan dalam workspace starter, sehingga kesesuaian penuh terhadap dokumen asli belum dapat diverifikasi.

Git yang ditemukan masih repository induk D:/code, tanpa commit, dengan proyek my-app dan berkas induk lain ikut tercakup. Root aplikasi tetap D:/code/SI_STIR_HEBAT_Starter/si-stir-hebat sesuai AGENTS.md. Penataan repository perlu diselesaikan sebelum publikasi. Tabel contoh todos tercatat terpisah dan tidak memiliki alur UI sekolah.

Tanggal sekolah masih memakai Asia/Jakarta pada frontend dan migration. Konfirmasi zona waktu operasional sekolah diperlukan sebelum mengubah aturan tanggal/tenggat bersama-sama. Skema asesmen tetap sementara sesuai keputusan pengguna. Modul dokumen, kehadiran guru, fitur perkembangan siswa dan UAT masih perlu dituntaskan berdasarkan acuan resmi.
14 November 2026: Repo https://github.com/mariomagfii-sys/si-stir-hebat berhasil di-clone ke D:/code/SI_STIR_HEBAT_Starter/github-release. Paket rilis 108 berkas diunggah ke main, commit 86fe0e79224d4d607afdd30cfeb633a24b8a5fa9; git ls-remote cocok dengan HEAD lokal. Tidak menyertakan .env.local, .env, .vercel atau lampiran pribadi. CI GitHub belum diverifikasi (konektor memberi 404; Git CLI berhasil). Deployment Vercel dan aktivasi admin tetap belum selesai.
14 November 2026: Login Vercel berhasil melalui device authorization; proyek si-stir-hebat dibuat dan deployment CLI produksi READY (dpl_DHXi8ktz5chWQQji1wTJQdrLMjEk). URL publik https://si-stir-hebat-blue.vercel.app. Empat route HTTP 200; browser headless mobile memverifikasi login nyata (bukan demo), redirect /jadwal tanpa sesi, tidak meluber dan tidak ada pageerror. Hanya akses anonim, tidak membaca data pribadi. Node24 diselaraskan package/lock (push b07638d). Panduan produksi/aktivasi diunggah commit36f8c53. GitHub auto-deploy belum terhubung karena Vercel meminta GitHub Login Connection. Site URL/redirect Auth, aktivasi admin, login/email nyata dan UAT tetap belum terverifikasi. Tujuan PRD penuh belum selesai.

## Ringkasan sekolah dashboard — 14 November 2026

PRD 5.1 ditindaklanjuti: admin/kepala sekolah melihat jumlah siswa, guru dan kelas berstatus aktif. Query HEAD dengan exact count, bukan mengunduh baris atau menghitung halaman; RLS tabel tetap berlaku. Label menjelaskan kelas mencakup seluruh tahun ajaran dan siswa berasal dari registri, bukan enrollment. Nol, belum dimuat dan gagal dibedakan. Partial failure mempertahankan jumlah yang berhasil; retry tersedia. Tidak ada query ringkasan pada guru/siswa/wali/pending. Tautan menuju data master terkait tersedia.

npm run check Node24 lulus 101 tes, lint, tipe dan build. Sepuluh tes browser khusus ringkasan desktop/ponsel lulus, meliputi jumlah1205, nol, missing count, retry dan pembatasan permintaan peran. Tidak ada perubahan database atau pembacaan data pribadi. Commit eb1d4f8 sudah dipush; deployment produksi baru sedang diverifikasi. Dashboard PRD masih perlu progres supervisi, administrasi, aktivitas/notifikasi dan ringkasan spesifik guru/keluarga; jangan menganggap bagian5.1 selesai penuh.
Deployment ringkasan dashboard dpl_BWAUuwkXSpGnB84RPsjVr4nPdehm terverifikasi READY dan alias produksi aktif. Smoke browser anonim produksi lulus ulang setelah deployment.

## Pembaruan antarmuka dan regresi browser — 14 November 2026

Beranda tidak lagi menyatakan bahwa aplikasi belum menggunakan data sekolah sebenarnya. Pesan sekarang menjelaskan bahwa layanan mengikuti peran akun dan pengguna perlu masuk dengan akun sekolah yang perannya sudah ditetapkan. Render halaman beranda dan route login terverifikasi di browser lokal. `npm run check` lulus: lint, TypeScript, 101 tes, dan build produksi.

Run browser penuh menjalankan 174 skenario desktop/ponsel: 172 lulus dan dua gagal pada selector tes jaringan pengumuman yang ambigu karena dashboard kini juga menampilkan error ringkasan. Selector diperbaiki agar menargetkan pesan pengumuman; tes terfokus lulus pada desktop dan ponsel (2/2). Suite browser penuh belum dijalankan ulang setelah perbaikan selector. Peringatan ukuran chunk PDF tetap dipertahankan: mesin 790,69 KB dan font 855,16 KB; pemuatan PDF tetap dinamis.

UAT akun sekolah, URL Auth hosted, dan aktivasi admin masih memerlukan verifikasi pada proyek/akun pemilik. Tidak ada perubahan database, konfigurasi hosted, atau data sekolah nyata dalam pembaruan ini.

## Context loop proyek — 14 November 2026

`PROJECT_CONTEXT.md` dan `PROGRESS.md` dibuat di root aplikasi untuk meneruskan konteks lintas sesi. Isinya mengikuti React/Vite, fitur yang benar-benar tersedia, dan palet Neo-Tactile Edu proyek; bukan contoh stack/tema generik. Prioritas modul baru kini diblokir sampai dokumen PRD/RBAC/database/UI-UX tersedia kembali: `docs/references/` tidak ada, dan indeks arsip starter lokal yang diperiksa juga tidak memuat dokumen acuan tersebut. UAT nyata tetap memerlukan pemilik akun sekolah.

## Ringkasan kebutuhan dan arah desain — 14 November 2026

Pengguna memberikan target peran: supervisi/pengendalian administrasi untuk kepala sekolah; perangkat, absensi, asesmen, dan hasil supervisi untuk guru; 7 Kebiasaan, kelas 1–6, PJOK/PAI untuk murid; pemberitahuan ketidakhadiran ke sekolah/guru untuk wali. Arahan desain terbaru adalah mobile-first, ungu tua/lilac/biru muda/pink, font profesional-playful. `PROJECT_CONTEXT.md` dan `AGENTS.md` diselaraskan untuk fitur baru/polish yang diminta; halaman selesai tidak dirombak.

Ringkasan ini belum menetapkan proses persetujuan, siklus pencatatan kebiasaan, visibilitas data anak, atau kanal dan alur pemberitahuan absen. Tidak ada migration atau implementasi fitur baru dibuat sampai detail tersebut atau acuan lengkap tersedia.

## Dashboard kepala sekolah — 14 November 2026

Dashboard menampilkan hitungan baca-saja supervisi berdasarkan tahap terakhir dan modul ajar berstatus diajukan/perlu revisi. Query memakai exact count HEAD terhadap tabel yang sudah ada, mengikuti RLS kepala sekolah, dan hanya berjalan untuk peran `principal`; draf pribadi guru tidak dihitung. Jika hitungan tidak tersedia, UI membedakannya dari nol, menjelaskan kegagalan, dan menyediakan retry. Ringkasan tidak mengambil nama, catatan supervisi, atau isi modul. Gaya kartu mengikuti palet ungu/lilac/biru/pink tanpa merombak halaman yang selesai.

Validasi: `npm run check` lulus (lint, TypeScript, 101 tes unit/database, build); enam tes browser terfokus desktop/ponsel lulus untuk jumlah tahap/status, pembatasan peran, nol versus kegagalan, retry, dan overflow horizontal. Tidak ada migration atau perubahan hosted. Tahap backlog berikutnya, 7 Kebiasaan, masih menunggu keputusan pencatatan, frekuensi, validasi, dan visibilitas data.

## Optimasi font PDF - 14 November 2026

Build hanya menyertakan font Roboto normal dan tebal yang digunakan rekap akademik, tetap dimuat dinamis saat ekspor. Chunk font berkurang dari 855,16 KB menjadi 419,57 KB (gzip 465,45 ke 225,08 KB); mesin PDF 790,69 KB masih memicu peringatan. Jika laporan memakai italic, varian font perlu ditambahkan kembali. Node 24 `npm run check` lulus (104 tes, lint, typecheck, build); tes unduhan PDF desktop dan ponsel lulus dengan API tiruan. UAT akun sekolah belum dilakukan.

## Daftar pekerjaan prioritas sementara - 14 November 2026

Ini daftar dari kode dan catatan proyek, bukan hasil pencocokan lengkap PRD: `docs/references/` dan dokumen PRD/RBAC asli tidak tersedia. Prioritas dan kewenangan harus ditinjau kembali setelah acuan tersedia.

| Prioritas | Celah atau verifikasi | Bukti dan batas |
| --- | --- | --- |
| 1 | UAT per peran, Auth/redirect, email dan aktivasi admin | Panduan ada; akun sekolah dan pengaturan hosted belum diverifikasi. Aktivasi oleh pemilik. |
| 2 | Komunikasi guru-wali dan administrasi dokumen | Tidak ada rute atau modul khusus pada `src/app/App.tsx`; kontrak pesan, penerima, akses dan persetujuan belum dikonfirmasi. |
| 3 | Kebiasaan siswa | Ada folder fitur dan migration lokal, tetapi tidak ada rute UI; penerapan hosted belum terverifikasi pada sesi ini. |
| 4 | Dashboard dan alur perkembangan/administrasi lain | Catatan proyek menyebut ringkasan khusus peran dan progres belum lengkap; diperlukan PRD untuk mengukur cakupan. |
| 5 | Aturan nilai resmi dan zona waktu sekolah | Keputusan sementara dan tanggal Asia/Jakarta masih perlu dikonfirmasi; tidak menyimpulkan aturan rapor. |

Telaah penuh C3 terblokir oleh ketiadaan dokumen acuan; daftar ini tidak menetapkan persyaratan resmi.

## Fondasi komunikasi lokal - 14 November 2026

Migration `20261114083827_komunikasi` dan API bertipe membatasi pesan teks append-only ke guru dan wali dengan penugasan, keanggotaan, dan relasi aktif. Pencabutan akses diuji di PGlite; `npm run check` Node 24 lulus 108 tes, lint, tipe dan build. Migration belum diterapkan ke hosted; `student_habits` yang lebih awal juga belum tercatat di riwayat hosted. UI, verifikasi hosted, UAT serta aturan resmi retensi dan pengawasan masih terbuka.

## Persiapan rilis operasional — 13 November 2026

Permintaan pengguna: kerjakan hingga web dapat digunakan, buat repo GitHub baru lalu deploy ke Vercel. Pengguna kemudian memilih membuat repo privat sendiri dan mengirim URL. Konektor GitHub belum menampilkan repository; Computer Use ke Chrome ditolak oleh alat. Belum ada push atau deployment publik. Akun admin belum tersedia; pengguna meminta panduan aktivasi, bukan pembuatan akun pribadi.

Perubahan: dashboard memperlihatkan layanan sesuai peran; gaya formulir workspace responsif ditambahkan; build produksi menolak konfigurasi Supabase kosong/tidak valid. Panduan docs/AKTIVASI_DAN_RILIS.md mencakup aktivasi admin pending melalui SQL dengan UUID tertentu, urutan data sekolah, variabel Vercel, redirect Auth, email, UAT dan operasi. Workflow aplikasi mandiri memakai Node 24 dan fixture CI. Paket source 108 berkas di release/si-stir-hebat dibuat menggunakan allowlist; tidak menyertakan .env.local, dokumen referensi pribadi, metadata hosted, node_modules, atau artefak tes. Repository lokal paket terpisah, branch codex/initial-release, commit fc1ddf8, belum memiliki remote. ZIP source tersedia di release/si-stir-hebat-source-20261113.zip. Workspace induk tidak di-commit.

Validasi sejauh ini: npm run check lulus 101 tes, lint, tipe dan build; build tanpa konfigurasi diuji dan ditolak. npm audit --omit=dev melaporkan nol kerentanan yang diketahui. Tes awal seluruh browser 155/156 lulus; satu kegagalan preview impor Excel tidak terulang dalam 18 tes pengulangan. Pemeriksaan desktop rilis terbaru lulus seluruh 82 skenario. Server tes berhenti saat bagian mobile (ERR_CONNECTION_REFUSED); mobile diulang terpisah. Screenshot dashboard mobile diperiksa, tidak meluber horizontal. Preview build lokal berjalan pada http://127.0.0.1:4173; lima URL SPA diuji HTTP 200. Semua uji browser memakai API tiruan, bukan kredensial/data pribadi sekolah.

Rilis publik tetap menunggu URL repo privat dan koneksi deployment. Belum dapat diklaim siap operasional hingga akun admin, login/pemulihan email nyata, konfigurasi hosting dan UAT sekolah selesai. Cakupan PRD lanjutan tetap terbuka; skema nilai sementara tidak berubah. Peringatan ukuran chunk PDF tetap ada.

## Filter kelas jadwal — 13 November 2026

Filter kelas `/jadwal` diterapkan di query server sebelum pagination, bersama filter tanggal/hari atau mode pengelolaan. Perubahan pilihan mereset halaman dan formulir agar hasil halaman sebelumnya tidak tertinggal. Opsi menggunakan ID kelas dan label tahun ajaran, termasuk kelas nonaktif untuk pemeriksaan historis. Data master kelas memang dapat dibaca semua peran sekolah menurut policy yang ada; isi jadwal tetap mengikuti RLS penugasan/enrollment/relasi wali. UI menjelaskan cakupan ini serta bahwa filter tidak mengubah daftar usulan. Opsi dibatasi kurang dari 1000; kegagalan atau batas tercapai menampilkan error, bukan daftar parsial.

Node 24 npm run check lulus: 101 tes, lint, tipe, build. Dua belas tes browser jadwal desktop/ponsel lulus, ditambah dua regresi supervisi. Skenario baru menguji filter server dari halaman kedua, reset halaman, kelas bernama sama berbeda tahun ajaran, serta tidak adanya kontrol audit pada wali. Tes browser menggunakan API tiruan. Tidak ada migrasi atau pembacaan data pribadi; UAT sekolah tetap terbuka. Peringatan ukuran chunk PDF yang sudah ada tetap muncul.

## Riwayat jadwal — 13 November 2026

Admin dan kepala sekolah dapat membuka riwayat per jadwal pada `/jadwal`: snapshot sebelum/sesudah, jam, periode, status aktif, revisi, waktu audit berlabel WIB dan alasan. Pembuatan awal dibedakan dari perubahan. Pagination 20 baris, retry dan pembatalan request menjaga tampilan ketika pindah halaman. Memakai tabel audit/RLS yang ada; tidak ada migrasi atau akses data pribadi.

Validasi: Node 24 npm run check lulus (101 tes, lint, tipe, build). Delapan tes browser jadwal sebelumnya lulus, dua skenario riwayat desktop/ponsel lulus setelah fixture kegagalan dibuat persisten agar tidak tertutupi retry otomatis klien. Tes regresi supervisi, absensi dan asesmen yang ikut filter juga lulus. Browser memakai API tiruan; UAT sekolah masih terbuka. Peringatan chunk PDF lama tetap ada. Riwayat menampilkan alasan dan waktu; nama pelaku belum ditampilkan.

## Usulan perubahan jadwal — 13 November 2026

Guru dapat mengusulkan perubahan hari, jam, dan periode jadwal aktif miliknya melalui `/jadwal`. Usulan menyimpan snapshot jadwal asal dan revisi, alasan wajib, serta satu usulan pending per jadwal. Admin melihat perbandingan semula/usulan lalu menyetujui dan menerapkan atau menolak dengan alasan. Kepala sekolah hanya membaca. Usulan dan keputusan tidak dibuka kepada siswa/wali. Penugasan aktif tetap diperlukan bagi guru untuk membaca usulannya.

Penerapan keputusan dan perubahan jadwal dilakukan dalam satu transaksi melalui pemeriksaan bentrok yang sama dengan penyuntingan admin. Revisi usang, jadwal nonaktif, atau penugasan pengusul yang dicabut menggagalkan persetujuan. Usulan usang masih dapat ditolak, lalu guru mengajukan ulang. Keputusan terminal tidak dapat diedit langsung. Kebijakan tahap ini: perubahan mengganti seluruh rentang jadwal, bukan memecahnya menjadi periode lama/baru; dijelaskan dalam UI. Penarikan usulan oleh guru belum tersedia.

Migration `20261113061010_schedule_proposals` diterapkan; total 22 migration. Metadata RLS, larangan INSERT/UPDATE langsung, serta larangan RPC anonim terverifikasi; Security Advisor kosong. Pemeriksaan tidak membaca data pribadi. `npm run check` Node 24 lulus dengan 101 tes, lint, tipe dan build. Tes database mencakup batas peran, duplikasi, konflik dengan rollback, revisi usang, pencabutan penugasan dan keputusan tunggal. Delapan tes browser jadwal desktop/ponsel lulus dengan API tiruan, ditambah dua regresi supervisi. Kegagalan awal pemilih label tes diperbaiki menggunakan combobox berdasarkan accessible name; tidak memerlukan perubahan UI. Peringatan ukuran chunk PDF tetap ada. UAT akun sekolah dan uji konkurensi multikoneksi belum dilakukan.

## Jadwal pelajaran — 13 November 2026

Fondasi `/jadwal` tersedia: admin membuat/mengubah/menonaktifkan jadwal mingguan dengan rentang tanggal dalam tahun ajaran, penugasan tetap, alasan wajib, audit database, dan revisi optimistis. Server menolak bentrok guru atau kelas, memeriksa kejadian hari dalam irisan periode, serta mengunci transaksi penulisan jadwal. Guru membaca sesuai penugasan aktif; siswa dan wali sesuai kelas dan hubungan terverifikasi. Kepala sekolah membaca; pending dan anonim ditolak. Daftar dipaginasi 25 item; admin/kepala sekolah dapat melihat jadwal nonaktif melalui mode pengelolaan.

Migration `20261113000504_lesson_schedules` diterapkan dan riwayat dicocokkan. Pemeriksaan metadata memastikan RLS aktif pada dua tabel dan INSERT langsung klien ditolak. Tidak membaca data pribadi. Node 24 `npm run check` lulus: 100 tes, lint, tipe, build. Empat tes browser khusus jadwal desktop/ponsel lulus dengan API tiruan (ditambah dua regresi supervisi yang ikut filter). Belum UAT sekolah; uji konkurensi beberapa koneksi belum dilakukan. Peringatan ukuran chunk PDF lama tetap ada.

Pekerjaan berikutnya: usulan perubahan jadwal oleh guru sesuai PRD, tampilan riwayat pengaturan, dan UAT. Skema nilai tetap sementara; tidak menghitung rapor otomatis.





Hasil final rilis 13 November: pengulangan mobile lulus 82/82. Total cakupan akhir browser 164 skenario lulus (82 desktop + 82 mobile pada run terpisah setelah server tes awal berhenti). URL repo GitHub masih menunggu pengguna.

## Batas proyek dan tabel contoh Supabase — 13 November 2026

Folder `SI_STIR_HEBAT_Starter/si-stir-hebat` adalah satu-satunya root aplikasi utama untuk Codex: React/Vite, bukan Next.js. Demo Next.js terpisah `D:\code\my-app` bukan bagian dari aplikasi dan tidak boleh menjadi lokasi kerja lanjutan.

Migration remote `20261113074045_create_private_todos` dibuat atas permintaan pengguna untuk contoh data privat. File migration disimpan di `supabase/migrations`, RLS membatasi setiap baris kepada pemiliknya, dan `scripts/check-supabase.mjs` memeriksa penolakan akses anonim. Tabel ini kosong dan tidak digunakan oleh UI SI STIR HEBAT. Tidak ada migration yang diterapkan ulang.

## Persiapan rilis operasional — 13 November 2026

## Rekap dan perkembangan akademik — 12 November 2026

Ekspor PDF kini tersedia dari hasil lengkap filter yang sama dengan CSV/Excel. PDF A4 lanskap memuat periode, filter, waktu pemuatan, status, kode/nama siswa, nilai, maksimum, persentase dan penanda skema sementara. Kepala tabel berulang, nomor halaman dan baris utuh mencegah pemotongan informasi saat laporan panjang. Generator/font dibundel lokal dan dimuat ketika ekspor dipakai. Tidak ada perubahan database atau pengiriman baris rekap ke layanan pembuat PDF.

Validasi PDF: `npm run check` Node 24 lulus dengan 99 tes. Dua belas tes browser rekap lulus; setelah perbaikan tata letak, dua tes unduhan desktop/ponsel lulus ulang. Isi PDF unduhan diperiksa dengan pypdf untuk memastikan hanya tiga hasil sesuai filter pada fixture. PDF sintetis 80 baris dirender memakai Poppler; seluruh 11 halaman diperiksa secara visual dan semua baris, karakter beraksen, nilai nol, status belum dinilai, header/footer serta margin horizontal diverifikasi. Ini bukan UAT data sekolah. Vite masih memberi peringatan ukuran untuk dua chunk PDF yang dimuat terpisah (sekitar 791 KB mesin dan 855 KB font sebelum gzip); vendor utama tetap sekitar 347 KB.

Panel rekap pada `/asesmen` memfilter tanggal inklusif, kelas, mata pelajaran, status publikasi untuk staf, dan siswa. Ekspor CSV/Excel mencakup semua halaman hasil filter yang lengkap, bukan hanya halaman tabel yang tampil. Nol tetap angka nol; nilai kosong tidak dinormalisasi menjadi nol; kode siswa tetap teks dan CSV menetralkan formula. Grafik batang menunjukkan persentase terhadap maksimum masing-masing asesmen untuk satu siswa/satu mata pelajaran, hanya hasil terbit dan maksimal 30 titik terbaru. Tidak menghitung rata-rata berbobot atau nilai rapor.

Pengguna menegaskan skema ini sementara sampai skema resmi diberikan; dicatat di DECISIONS.md dan antarmuka. Permintaan dibatasi maksimal 366 hari dan 500 hasil/500 header asesmen. Exact count dibandingkan dengan baris diterima; hasil terpotong, melebihi batas, atau gagal tidak ditampilkan/diekspor. Persempit tanggal/kelas/pelajaran jika batas tercapai. Pilihan siswa menggunakan ID dan snapshot nama terakhir; identitas mata pelajaran kini tersimpan agar pergantian nama tidak mencampur seri.

Migration `20261112051122_assessment_subject_identity` diterapkan. Backfill mengambil subject_id dari penugasan; metadata terverifikasi: kolom wajib, klien tidak dapat mengubahnya, RLS aktif, seluruh trigger aktif dan Security Advisor kosong. Tidak membaca baris data pribadi. `npm run check` pada Node 24.22.3 lulus (97 tes, lint, TypeScript, build). Setelah penambahan pengujian cakupan query rekap, 60 tes database lulus ulang; lint final lulus. Dua belas tes browser rekap desktop/ponsel lulus, termasuk pembacaan isi CSV/Excel hasil unduhan, data terpotong, batas jumlah, izin ditolak, akses wali dan URL langsung akun pending. Tes browser memakai API tiruan; UAT sekolah masih terbuka.

Pekerjaan terbuka akademik: aturan resmi penilaian, kewenangan khusus wali kelas, pengelolaan perubahan peserta dan UAT. PDF modul lain dan kebutuhan PRD lainnya juga belum seluruhnya selesai.

## Pemeriksaan workspace — 12 November 2026

Antarmuka TaskSubmissions sudah tersedia dan terhubung dari halaman tugas. Siswa dapat mengirim jawaban teks, sedangkan guru dapat membaca jawaban dengan pagination. Penerapan migration task_submissions di remote dan pengujian browser alur pengumpulan belum diverifikasi pada pemeriksaan ini.

npm run check berhasil: lint, TypeScript, 87 tes lokal dan build produksi lulus. Hasil ini tidak membuktikan seluruh kebutuhan PRD telah selesai. Pekerjaan terbuka tetap meliputi verifikasi pengumpulan, umpan balik dan penilaian, jadwal, administrasi dokumen, kehadiran guru, serta UAT akun sekolah.

Migration 20261111232717_task_submissions menambah pengumpulan satu jawaban teks per siswa sebelum akhir hari tenggat (WIB). Siswa dapat membaca jawaban sendiri dan guru penulis tugas dengan penugasan aktif dapat membaca jawaban siswa. Jawaban terkirim tidak dapat diubah. RLS aktif, akses anonim ditolak menurut metadata, dan Security Advisor tidak melaporkan temuan. Build dan 87 tes lokal lulus. Uji browser khusus dan uji akun sekolah belum dijalankan.

## Asesmen akademik — 12 November 2026

Rute `/asesmen` tersedia bagi guru, kepala sekolah, admin, siswa dan wali sesuai RLS. Guru membuat asesmen formatif, sumatif, proyek, praktik/keterampilan atau sikap/karakter untuk penugasannya, dengan tanggal dalam tahun ajaran dan nilai maksimum positif per asesmen (maksimal dua desimal). Pengguna secara eksplisit menyetujui fondasi ini serta publikasi manual oleh guru tanpa perhitungan rapor otomatis.

Daftar peserta disalin dari keanggotaan kelas aktif saat pembuatan. Nilai awal kosong, berbeda dari nol. Guru dapat mengedit metadata draf dan mengisi nilai/catatan. Publikasi wajib menunggu seluruh peserta dinilai dan tanggal asesmen tidak di masa depan. Metadata terbit dikunci; koreksi nilai terbit memerlukan alasan pada setiap permintaan dan dicatat bersama nilai lama/baru, catatan, aktor, waktu serta revisi. Guru/admin/kepala sekolah dapat membaca riwayat; siswa/wali hanya hasil terbaru yang terbit sesuai identitas/tautan anak aktif. Admin/kepala sekolah tidak dapat menulis nilai atau menerbitkan hasil.

Migration `20261111234856_academic_assessments` diterapkan; tiga tabel memakai RLS, SELECT anonim ditolak dan Security Advisor kosong. `npm run check` lulus dengan 93 tes; setelah memperkuat alasan koreksi, 60 tes database dijalankan ulang dan lulus. Sepuluh tes browser terfokus diverifikasi di desktop/ponsel: delapan lulus awal dan dua alur guru lulus setelah memperbaiki selector combobox dalam tes. Pemeriksaan API dengan `limit=0` lulus untuk semua tabel yang tercantum, tanpa membaca baris data.

Rekap/filter/ekspor CSV/Excel/PDF serta grafik perkembangan telah ditambahkan pada tahap berikutnya. Kewenangan khusus wali kelas, pengelolaan perubahan daftar peserta dan UAT akun sekolah masih terbuka. Tes lokal memakai PostgreSQL terisolasi dan tes browser memakai layanan tiruan; belum membuktikan UAT produksi atau uji beban serentak. Perhitungan rapor otomatis tidak termasuk fondasi sementara yang disetujui.

## Umpan balik tugas — 12 November 2026

Guru penulis tugas dengan penugasan aktif dapat menyimpan dan mengedit draf umpan balik per jawaban, kemudian meninjau dan menerbitkan draf tersimpan. Hasil terbit dikunci. Siswa hanya membaca hasil terbit miliknya; wali hanya hasil anak yang terhubung dan aktif. Admin/kepala sekolah memiliki akses baca pengawasan melalui RLS, tanpa hak mengubah. Riwayat isi, status, aktor, waktu dan revisi dicatat di `task_feedback_events`; riwayat draf tidak terbuka untuk siswa/wali. Tampilan riwayat dan pengawasan belum dibuat.

Migration `20261111233649_task_feedback` diterapkan; dua tabel memakai RLS dan menolak SELECT anonim. Security Advisor tidak melaporkan temuan. `npm run check` lulus dengan 88 tes. Sepuluh skenario browser desktop/ponsel lulus melalui eksekusi awal dan pengulangan dua tes guru setelah pemilih elemen tes diperbaiki. Cakupan meliputi draf/edit/publikasi, akses wali, serta regresi pengumpulan normal/respons hilang/duplikat. Browser menggunakan layanan tiruan; UAT akun sekolah masih diperlukan. Asesmen numerik terpisah kini tersedia sesuai keputusan pengguna, dengan maksimum per asesmen dan publikasi manual. Laporan akademik dan koreksi umpan balik tugas terbit masih terbuka.

## Verifikasi pengumpulan tugas — 12 November 2026

Pemeriksaan ulang langsung pada riwayat Supabase mengonfirmasi migration `20261111232717_task_submissions` sudah diterapkan. Metadata tabel mengonfirmasi RLS aktif dan izin SELECT anonim ditolak. Ini mengoreksi catatan sebelumnya yang menyatakan penerapan belum terverifikasi; tidak ada baris data pribadi yang dibaca.

Lint, TypeScript, 87 tes lokal dan build produksi lulus. Enam tes browser (desktop dan ponsel) lulus untuk pengiriman normal, respons pengiriman hilang, serta konflik pengiriman ganda. Ketika respons hilang, tombol kirim dikunci sampai status berhasil dimuat ulang; teks jawaban tetap tersedia. Pengujian browser menggunakan layanan tiruan dan belum menggantikan UAT akun sekolah. Umpan balik tugas dan asesmen akademik terpisah telah ditambahkan pada tahap berikutnya; lihat bagian terkait di atas.

## Verifikasi ulang - 11 November 2026

Build yang sempat gagal akibat tipe sesi demo dan akses klien Supabase sudah diperbaiki. Lint, TypeScript, build, 81 tes unit/database, dan 86 tes browser desktop/ponsel dengan API tiruan lulus. Supabase kini memiliki sembilan migration, 16 tabel publik dengan RLS, dan 40 policy. Trigger jurnal serta kedua policy aktif. Data API menolak akses anonim ke seluruh 16 tabel dan Security Advisor tidak melaporkan temuan. Pengujian dengan akun sekolah masih tertunda.

## Arsip fondasi (10–13 November 2026)

## Sumber kebutuhan

Tujuh lampiran diterima dan ditelaah pada 11 November 2026. Keputusan sebelum dokumen tersedia dicatat dalam DECISIONS.md. Pemetaan kebutuhan terbaru ada pada bagian Rekonsiliasi acuan.

## Audit fondasi

- React 19, React Router 7, TypeScript 5.8, Vite 6, Supabase JS, Lucide, dan CSS responsif sudah tersedia; proyek dilanjutkan tanpa membuat ulang struktur.
- Lingkungan audit: Node 26.13.0, npm 11.20.0, Git 2.56.0; minimum Node proyek 22.18, CI menggunakan Node 24.
- Source berada di `src`, bukan `dist`. Build dipisah menjadi chunk aplikasi, vendor, dan Supabase.
- Konfigurasi Supabase menggunakan publishable key di `.env.local` yang diabaikan Git. Tidak ada secret dalam laporan ini.
- Perubahan workspace belum di-commit. Tidak ada commit, push, reset, penghapusan data, atau deployment publik dilakukan.

## Selesai dengan batas verifikasi

- Login, logout, pemulihan sesi, proteksi route, profil sendiri, dashboard peran, pengumuman dengan draf/terbit/arsip dan pagination.
- Dua migration remote diterapkan dengan persetujuan pengguna: `20261110075255_profiles` dan `20261110075305_announcements`; metadata tabel, RLS, policy, grants, trigger dan riwayat diverifikasi.
- Koneksi Supabase Auth dan penolakan akses anonim Data API diverifikasi langsung tanpa membaca baris data.
- Pada fase registri: lint, TypeScript, 43 tes unit/database, 36 tes browser dan build lulus. Pada fase relasi berikutnya: 50 tes unit/database dan 42 tes browser lulus; verifikasi terakhir dirinci di log implementasi. Browser menggunakan API tiruan, bukan login akun sekolah sesungguhnya.
- Konfigurasi Vercel/Netlify dan workflow GitHub Actions tersedia; hosting dan CI remote belum dijalankan.

## Sebagian selesai

- Fondasi: ESLint 10/TypeScript/React Hooks, komponen feedback reusable, dan error boundary global sudah ditambahkan; script `check` serta CI mencakup lint/typecheck.
- Autentikasi: alur browser teruji dengan tiruan API; pengiriman email dan login akun sekolah tetap memerlukan verifikasi pemilik akun.
- RBAC: hak profil dan pengumuman teruji; matriks resmi per modul belum tersedia.
- Data master sekolah: identitas, tahun ajaran, semester, mata pelajaran, dan kelas memiliki alur tambah/ubah, validasi, pagination, konfirmasi aktivasi periode, state kegagalan, serta ekspor halaman CSV. Administrator mengelola; peran sekolah lain hanya membaca. Kewenangan ini sementara sampai RBAC resmi tersedia.
- Registri guru/siswa tersedia untuk tambah/ubah/status aktif, pagination dan ekspor halaman. Keanggotaan kelas dan penugasan guru telah diimplementasikan serta diuji lokal dengan pilihan nama/kode/tahun dan konfirmasi. Penghubungan akun yang terverifikasi dan data wali belum tersedia di UI.

## Database fase ini

Dengan persetujuan eksplisit pengguna, dua migration tambahan diterapkan:

- `20261110081258_school_master_data`: lima tabel administratif, FK, constraint, indeks periode aktif tunggal, RLS, izin kolom, dan trigger batas kalender.
- `20261110081303_restrict_auto_rls_execution`: membatasi execute fungsi event-trigger bawaan tanpa mengubah fungsi atau event trigger.
- `20261110082821_people_registry`: tabel guru/siswa, kode unik, FK profil/penulis, izin kolom dan RLS. Diterapkan setelah persetujuan eksplisit; tidak membuat data pribadi atau mengubah akun.

Verifikasi remote: sembilan tabel memiliki RLS, total 26 policy; kalender memiliki dua trigger pembatas; kolom ID/audit/peran tidak diberi izin update klien. Pada guru/siswa, insert/update klien hanya diizinkan untuk kode, nama dan status aktif; `profile_id` tidak dapat diklaim melalui klien. Advisor keamanan mengembalikan `lints: []`. Auth aktif dan kesembilan tabel menolak akses anonim melalui Data API. Tidak ada data contoh dimasukkan remote. Lima migration lokal mengikuti versi aktual remote.

`npm audit` terakhir melaporkan 0 vulnerability. Dependensi transitif minimatch dipin melalui override ke versi perbaikan 11.0.1; alasannya dicatat di log. Hasil audit bukan jaminan bebas seluruh risiko.

## Migration relasi — diterapkan dengan persetujuan

`20261110084348_class_enrollments_assignments.sql` menambahkan dua tabel, RLS, invariant kapasitas dan keanggotaan aktif tunggal per tahun, serta helper izin di schema privat. Patch UI mempertahankan identitas relasi tersimpan; hanya status aktif yang dapat diubah. Perpindahan menyimpan riwayat dengan menonaktifkan relasi lama dan membuat relasi baru.

Migration telah diterapkan setelah persetujuan bubble dan pemeriksaan konflik. Versi lokal diselaraskan dengan riwayat remote. Kini ada 11 tabel publik dengan RLS dan total 33 policy; kedua relasi hanya memberi update kolom `is_active`. Helper berada di schema privat; anon tidak dapat mengeksekusinya. Advisor keamanan sesudah migration: `lints: []`. Tidak ada data di-seed atau akun dihubungkan.

## Absensi manual — tahap awal tersedia

Absensi manual tersedia: sesi hari ini, snapshot peserta, status, koreksi beralasan, rekap sesi dan audit atomik. Migration `20261110091137_attendance_core.sql` diterapkan setelah persetujuan. Lint, TypeScript, build, 62 tes unit/database dan 56 tes browser penuh lulus. Catatan/audit tidak dapat ditulis langsung oleh klien; RPC publik bukan SECURITY DEFINER dan anon tidak mendapat execute. Batas tahap ini tercatat di `DECISIONS.md`.

Status database terbaru: 14 tabel publik dengan RLS, 37 policy, tujuh migration terselaraskan; pemeriksaan penolakan anonim Data API seluruh tabel lulus. Advisor keamanan terakhir tidak melaporkan temuan. Absensi nyata dan akun tetap tidak diubah.

## Belum selesai

Penghubungan akun guru/siswa di UI, data wali dan hubungan wali-anak terverifikasi; materi/modul ajar; jurnal; asesmen dan hasil belajar; supervisi empat tahap; backdate dan persetujuan koreksi; tujuh kebiasaan dan prestasi; Storage privat, versioning/persetujuan dokumen; laporan dan audit lintas modul. Relasi kelas/penugasan dan absensi manual sudah memiliki migration hosted.

## Batas otoritas dan blocker

- Pengguna memilih agar peran akun tidak diubah. Tidak ada bootstrap administrator otomatis.
- Tujuh belas migration yang sudah diterapkan tidak diubah lagi. Perubahan skema berikutnya memerlukan migration baru dan persetujuan baru.
- Akses guru berdasarkan penugasan telah diuji. Hubungan wali terverifikasi masih diperlukan sebelum data anak dapat dibuka kepada orang tua.
- Tidak ada data siswa nyata, password atau token dimasukkan ke laporan, fixture, atau kode sumber.

## Prioritas

1. Cocokkan keputusan administratif sementara dengan PRD/blueprint/matriks RBAC ketika tersedia.
2. Lengkapi penghubungan akun terverifikasi dan relasi wali-anak tanpa memberikan hak administrator otomatis.
3. Rekap rentang tanggal tersedia; siapkan interval keanggotaan sebelum mendukung backdate dan rancang persetujuan koreksi.
4. Lanjutkan pembelajaran, supervisi, kebiasaan, Storage privat dan persetujuan dokumen; jangan menganggap dashboard umum sebagai implementasi modul-modul ini.

## Impor Excel — tersedia

Template XLSX terikat sesi, validasi/preview sebelum konfirmasi, koreksi beralasan, penyimpanan atomik/idempoten dan riwayat metadata sudah tersedia. File asli tidak disimpan. Batas: 2 MB, satu sheet, 100 peserta; formula/makro/external workbook ditolak. Baris kosong atau tidak disertakan tidak mengubah status.

Migration `20261110093304_attendance_imports.sql` diterapkan setelah persetujuan dan pemeriksaan konflik. Status terbaru: delapan migration, 15 tabel publik dengan RLS dan 38 policy. Verifikasi live Auth serta penolakan akses anonim seluruh tabel lulus; advisor keamanan tanpa temuan. Tidak mengimpor absensi nyata atau mengubah akun/peran.

Lint, TypeScript, build, 72 tes unit/database dan 62 tes browser desktop/ponsel lulus. Tes browser memakai API tiruan dan tes SQL memakai PostgreSQL lokal terisolasi; belum menggantikan login serta impor dengan akun sekolah. Audit dependensi melaporkan 0 vulnerability.

## Rekap rentang tanggal - tersedia

Rekap baca saja dan ekspor CSV pada `/absensi`, maksimal 31 hari per kelas, mengikuti RLS. Agregasi memakai ID siswa dan snapshot terbaru; status kosong tetap Belum diisi. Query per sesi menghindari pemotongan 1.000 baris. Jika satu query gagal, hasil dan ekspor dibatalkan. Tidak ada migration atau perubahan akun/peran. Batas konsistensi beberapa query dijelaskan di UI dan DECISIONS.md.

Lint, TypeScript, build, 74 tes unit/database dan 68 tes browser desktop/ponsel lulus. Browser memakai API tiruan; pengujian akun sekolah nyata belum dilakukan.

## Jurnal mengajar - tersedia di Supabase

Rute `/jurnal`, formulir dengan konfirmasi, snapshot referensi server, retry ID stabil, daftar/pagination dan ekspor CSV tersedia. Kebijakan awal: guru bertugas mencatat hari ini dan membaca catatan sendiri; kepala sekolah/administrator hanya membaca; siswa/parent/pending/anonim ditolak. Catatan tidak dapat diubah/dihapus oleh klien. Ini tahap awal jurnal, belum mencakup persetujuan/koreksi atau modul ajar.

Migration jurnal diuji di PostgreSQL terisolasi dan diterapkan di Supabase setelah persetujuan. Versi hosted `20261111070725_teaching_journals.sql` sudah diselaraskan dengan nama berkas lokal.

Lint, TypeScript, build dan 80 tes unit/database lulus. Seluruh 18 tes jurnal desktop/ponsel lulus; regresi browser penuh final 86/86 lulus (1,8 menit). Pengujian browser menggunakan API tiruan, bukan akun sekolah sesungguhnya.

## Rekonsiliasi acuan

PRD v1.0 menetapkan cakupan fitur. RBAC matriks menetapkan kewenangan dan cakupan data. Database Blueprint dan API Specification menjadi acuan kontrak teknis. UI/UX Blueprint menetapkan alur, navigasi menurut peran, kondisi halaman, dan desain responsif. Implementation serta kerangka app menetapkan urutan kerja dan arsitektur.

| Kebutuhan | Kondisi dan pekerjaan berikutnya |
| --- | --- |
| Autentikasi dan pengelolaan akses | Login dan profil sendiri tersedia. Navigasi utama kini menampilkan tautan berdasarkan peran. Pengaitan akun guru/siswa serta pencatatan dan pencabutan relasi wali tersedia untuk administrator. Manajemen penetapan peran dan tampilan riwayat audit masih diperlukan. |
| Data sekolah | Kalender, kelas, mapel, registri dan penugasan tersedia. Relasi wali terverifikasi tersedia. Registri wali dan alur impor data master masih diperlukan. |
| Pembelajaran | Jurnal dasar dan alur penyusunan serta pemeriksaan modul ajar tersedia. Publikasi materi teks tersedia. Publikasi tugas dengan tenggat tersedia. Pengumpulan tugas, jadwal, lampiran privat dan hasil asesmen masih diperlukan. |
| Supervisi akademik | Empat tahap, penjadwalan, penilaian awal, publikasi kepada guru terkait dan laporan CSV tersedia. Penyimpanan otomatis observasi tersedia. Bukti privat tersedia. Instrumen resmi masih diperlukan. |
| Dokumen sekolah | Implementasikan Storage privat, versi, riwayat pemeriksaan dan persetujuan KSP, RKT, RKAS serta SK. |
| Kehadiran | Absensi siswa hari ini, impor XLSX dan rekap CSV serta XLSX tersedia. Kehadiran guru dan alur koreksi yang disetujui masih diperlukan. |
| Ruang murid dan wali | Pembatasan absensi siswa sendiri tersedia. Wali dapat melihat kehadiran anak aktif dengan tautan terverifikasi melalui Ruang Orang Tua. Materi, asesmen yang diizinkan, portofolio, prestasi dan tujuh kebiasaan masih perlu dibuat. |
| Operasional | Pengumuman dan audit absensi tersedia. Target penerima, laporan lintas modul, audit tambahan, UAT dan verifikasi operasional masih diperlukan. |

Database Blueprint, kerangka app dan API Specification memakai nama relasi wali yang berbeda. Implementasi perlu menetapkan satu kontrak database dan mempertahankan kompatibilitas skema yang sudah berjalan. RBAC memisahkan hak baca, perubahan, persetujuan dan ekspor. Kebijakan rinci yang belum ditetapkan diperlakukan sebagai keputusan produk terbuka.

Tahap berikutnya melanjutkan perangkat ajar, supervisi, administrasi dokumen dan laporan serta memperluas portal wali seiring tersedianya data yang diizinkan. Fitur dikembangkan dan diverifikasi per tahap.

## Tautan akun dan verifikasi wali

Administrator dapat mengaitkan dan mencabut akun guru, siswa, atau wali melalui /tautan-akun dengan kode registri, ID akun yang sudah memiliki peran sesuai, dan alasan. Sistem menyimpan audit setiap perubahan yang berhasil. Verifikasi identitas dilakukan oleh sekolah sebelum administrator mengonfirmasi tautan. Manajemen penetapan peran belum tersedia. Akses wali ke kehadiran anak dijelaskan pada bagian Ruang Orang Tua.

Migration 20261111074620_account_relationships sudah diterapkan. RLS aktif pada kedua tabel baru dan akses anonim melalui Data API ditolak. Tidak ada akun nyata yang dikaitkan pada tahap ini. Lint, TypeScript, build, 82 tes lokal dan empat tes browser khusus lulus. Security Advisor belum dapat diperbarui karena pembaruan token konektor gagal.

## Ruang Orang Tua

Rute /ruang-orang-tua menampilkan anak aktif dengan tautan terverifikasi dan hingga 30 catatan kehadiran terbaru per anak. Status kosong tampil sebagai Belum diisi. Pencabutan tautan menghapus akses pada permintaan berikutnya. RPC hanya mengembalikan identitas ringkas anak, tanggal dan status. Catatan koreksi dan data staf tetap mengikuti kebijakan internal absensi.

Migration 20261111075356_guardian_attendance diterapkan dan diselaraskan dengan berkas lokal. Eksekusi anonim ditolak, pemanggilan tanpa identitas mengembalikan daftar kosong, dan Security Advisor tidak melaporkan temuan. Tidak ada akun wali nyata yang digunakan dalam pengujian.

## Modul Ajar

Guru dengan penugasan aktif dapat menyusun draf, mengedit modul yang dikembalikan, dan mengajukan modul melalui /modul-ajar. Kepala sekolah dapat mengembalikan pengajuan dengan catatan, menyetujui atau mengarsipkan. Administrator dapat membaca pengajuan. Perubahan status tercatat dalam audit. Modul berisi judul, tujuan dan kegiatan. Lampiran privat, versi isi dokumen dan publikasi materi untuk murid masih diperlukan.

Migration 20261111080033_teaching_modules sudah diterapkan. RLS dan trigger terverifikasi, Security Advisor tidak melaporkan temuan, serta 84 tes lokal dan dua tes browser terfokus lulus. Pengujian menggunakan akun sekolah masih tertunda.

## Supervisi Akademik

Rute /supervisi memberi kepala sekolah alur pra-observasi, observasi, pasca-observasi dan tindak lanjut. Database memeriksa kelengkapan sebelum naik tahap dan mencatat jadwal, tahapan, status tindak lanjut serta publikasi. Hasil dipublikasikan setelah evaluasi tindak lanjut selesai dan hanya dapat dibaca guru terkait. Hasil terbit dikunci. Tiga indikator dan skala 1–4 ditampilkan sebagai usulan sampai instrumen resmi disahkan.

Migration 20261111080735_academic_supervision diterapkan dan versi lokal diselaraskan. Kedua tabel memakai RLS dan menolak akses anonim menurut metadata. Dua trigger aktif, dan Security Advisor tidak melaporkan temuan. Build, 85 tes lokal dan dua tes browser terfokus lulus. Instrumen resmi masih diperlukan.

Kepala sekolah dapat memfilter jadwal dan progres supervisi berdasarkan rentang tanggal inklusif dan mengunduh CSV. Laporan menampilkan maksimal 500 sesi dan meminta rentang lebih sempit jika batas terlampaui. Skor dan catatan naratif tidak dimuat untuk rekap. Laporan menggunakan aturan akses supervisi yang sudah ada.

Pada tahap Observasi, skor dan catatan disimpan otomatis setelah 1,2 detik tanpa perubahan. Penyimpanan memakai revisi baris yang dimuat dan tidak menimpa versi dari tab lain. Jika penyimpanan gagal, isian tetap di formulir. Kepala sekolah dapat mencoba lagi atau membuang perubahan dan memuat ulang.

Pada tahap Tindak Lanjut, kepala sekolah dapat mengunggah, mengunduh dan menghapus bukti sebelum publikasi. Setelah publikasi, kepala sekolah dan guru terkait dapat mengunduh bukti. Bucket privat menerima PDF, JPEG dan PNG hingga 10 MB per berkas. Migration 20261111082822_supervision_evidence diterapkan. Pengujian lokal memeriksa RLS dan dua tes browser memakai Storage tiruan. Uji unggah dengan akun sekolah masih tertunda.

## Materi Kelas

Guru dapat membuat dan mengedit draf materi teks, menerbitkannya untuk kelas penugasan, lalu mengarsipkannya melalui /materi. Siswa dengan keanggotaan aktif dan wali terverifikasi dapat membaca materi terbit dari kelas terkait. Arsip tidak lagi tampil untuk siswa dan wali. Lampiran dan hasil asesmen memerlukan alur lanjutan. Publikasi tugas tersedia di /tugas.

Migration 20261111092126_class_materials diterapkan dan versi lokal diselaraskan. Metadata mengonfirmasi RLS, tiga policy dan penolakan baca anonim. Security Advisor tidak melaporkan temuan. Build, 86 tes lokal dan dua tes browser publikasi lulus dengan data contoh. Pengujian dengan akun sekolah masih tertunda.

## Tugas Kelas

Guru dapat menyusun, menerbitkan dan mengarsipkan tugas teks dengan tenggat di /tugas. Siswa dan wali melihat tugas terbit sesuai akses kelas yang sudah berlaku. Tenggat wajib diisi dan tidak dapat diubah setelah terbit. Database menolak publikasi untuk tenggat sebelum hari sekolah saat ini. Pengumpulan jawaban teks dan umpan balik tersedia. Asesmen akademik tersedia terpisah; pengaitan nilai asesmen dengan tugas masih memerlukan alur lanjutan.

Migration 20261111092744_class_tasks sudah diterapkan. Metadata mengonfirmasi RLS, constraint dan trigger tenggat. Security Advisor tidak melaporkan temuan. Build, 87 tes lokal dan empat tes browser lulus dengan data contoh.
