# SI STIR HEBAT

Aplikasi sekolah SDN 03 Wonosari menggunakan React, Vite, TypeScript, dan Supabase.

## Status saat ini

Alur yang tersedia: autentikasi/profil, dashboard per peran (termasuk ringkasan `dashboard_overview()`), pengumuman, data sekolah, registri guru/siswa, keanggotaan kelas, penugasan guru, absensi manual/impor Excel, jurnal, tautan akun terverifikasi, portal kehadiran wali, laporan ketidakhadiran wali, modul ajar, supervisi empat tahap dengan bukti privat, materi/tugas, pengumpulan dan umpan balik, komunikasi guru–wali, pusat notifikasi, 7 Kebiasaan beserta rekap mingguan, administrasi dokumen dengan versi/review, absensi guru dengan persetujuan koreksi, serta asesmen dengan publikasi dan koreksi beralasan. Rekap akademik mendukung filter, CSV/Excel/PDF dan grafik perkembangan. Cakupan dan batas verifikasi tiap modul ada dalam status proyek. Beberapa migration modul baru belum hosted, dan UAT akun sekolah belum dilakukan.

## Batas proyek untuk Codex

Folder ini adalah root utama SI STIR HEBAT. Aplikasi utamanya tetap React/Vite; jangan membuat atau mengubah proyek di luar folder ini, dan jangan mengubah stack ke Next.js tanpa permintaan eksplisit. Instruksi kerja lengkap ada di [AGENTS.md](AGENTS.md). `D:\code\my-app` adalah contoh Next.js terpisah, bukan bagian dari aplikasi ini.

Laporan rinci: [Status proyek](docs/PROJECT_STATUS.md), [Log implementasi](docs/IMPLEMENTATION_LOG.md), [Keputusan sementara](docs/DECISIONS.md), [Telaah keamanan migration](docs/SECURITY_REVIEW.md), dan [Panduan UAT](docs/PANDUAN_UAT.md). Tujuh dokumen acuan tersedia sebagai Markdown di [`docs/references/`](docs/references/README.md), lengkap dengan hash dan hierarki otoritas; salinan tersebut belum disahkan sebagai acuan resmi. Skema nilai maksimum per asesmen dan publikasi manual guru merupakan keputusan sementara; skema resmi akan diberikan pengguna. Tidak ada perhitungan rapor otomatis.

Koneksi Supabase sudah dikonfigurasi di workspace ini. Email login aktif. Read-only terakhir mengonfirmasi 23 migration hosted hingga 13 November 2026; repository kini memuat **42 berkas migration lokal** menurut `node scripts/check-migrations.mjs`, sehingga 19 berkas belum hosted. Jangan menganggap berkas lokal sudah diterapkan:

| Versi | Migration |
| --- | --- |
| `20261110075255` | `profiles` |
| `20261110075305` | `announcements` |
| `20261110081258` | `school_master_data` |
| `20261110081303` | `restrict_auto_rls_execution` |
| `20261110082821` | `people_registry` |
| `20261110084348` | `class_enrollments_assignments` |
| `20261110091137` | `attendance_core` |
| `20261110093304` | `attendance_imports` |
| `20261111070725` | `teaching_journals` |
| `20261111074620` | `account_relationships` |
| `20261111075356` | `guardian_attendance` |
| `20261111080033` | `teaching_modules` |
| `20261111080735` | `academic_supervision` |
| `20261111082822` | `supervision_evidence` |
| `20261111092126` | `class_materials` |
| `20261111092744` | `class_tasks` |
| `20261111232717` | `task_submissions` |
| `20261111233649` | `task_feedback` |
| `20261111234856` | `academic_assessments` |
| `20261112051122` | `assessment_subject_identity` |
| `20261113000504` | `lesson_schedules` |
| `20261113061010` | `schedule_proposals` |
| `20261113074045` | `create_private_todos` (contoh privat; tidak dipakai UI Vite) |

RLS, izin dan trigger modul diverifikasi melalui metadata remote sebagaimana dicatat pada status proyek. Data API anonim diuji sesuai daftar tabel pada `scripts/check-supabase.mjs`, tanpa membaca baris data. Nama berkas migration yang tercatat mengikuti versi aktual remote. Jangan menerapkan ulang migration ini pada proyek tersebut. Tes lokal terbaru memakai Node 24; pengujian browser memakai API tiruan dan tidak menggantikan UAT akun sekolah.

Migration lokal setelah baseline hosted meliputi kebiasaan, komunikasi, laporan wali, notifikasi, dokumen, konfigurasi sekolah, penetapan peran, dan validasi koreksi kebiasaan. Semuanya harus direkonsiliasi, diuji pada Supabase lokal, dan mendapat persetujuan sebelum penerapan berurutan ke hosted. Telaah keamanan dan drift ada di [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md), [docs/HOSTED_MIGRATION_RECONCILIATION_2026-11-22.md](docs/HOSTED_MIGRATION_RECONCILIATION_2026-11-22.md), dan [docs/ARSITEKTUR_DATABASE.md](docs/ARSITEKTUR_DATABASE.md).

Akun administrator belum diaktifkan. Aplikasi sudah tersedia di https://si-stir-hebat-blue.vercel.app; Site URL/redirect Supabase Auth, login dengan akun sekolah, email pemulihan, dan UAT masih perlu diverifikasi oleh pemilik akun. Deployment ini tidak berarti aplikasi sudah siap operasional.

## Menjalankan aplikasi

Gunakan Node.js 24.x sesuai `engines` dan pemeriksaan CI. Dari folder `si-stir-hebat`:

```powershell
npm ci
npm run dev
```

Buka `http://127.0.0.1:5173`. Port dibuat tetap agar konfigurasi pemulihan tidak berubah diam-diam.

Untuk membuka hasil produksi:

```powershell
npm run build
npm run preview
```

Buka `http://127.0.0.1:4173`. File `dist/index.html` memerlukan server HTTP; membuka file tersebut langsung dari File Explorer tidak menjalankan aplikasi dengan benar. Ubah kode di `src`, lalu build ulang untuk memperbarui `dist`.

## Konfigurasi Supabase

File `.env.local` workspace ini sudah berisi URL proyek dan publishable key, serta diabaikan Git. Pada checkout baru, salin `.env.example` ke `.env.local` dan isi nilai berikut:

```dotenv
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Gunakan publishable key untuk frontend. Jangan masukkan secret key, service role key, password database, atau personal access token ke variabel `VITE_*`. Konfigurasi kosong, placeholder, URL tidak valid, dan key berprivilege yang dikenali tidak dipakai untuk terhubung ke Supabase; dalam kondisi itu aplikasi berjalan dalam **mode demo lokal** dengan akun sintetis dan data contoh di `localStorage`. Mode demo bukan untuk operasional: pastikan kedua variabel terisi pada build produksi. Restart server setelah mengubah konfigurasi; konfigurasi hosting memerlukan build ulang.

```powershell
npm run check:supabase
```

Pemeriksaan ini menguji Supabase Auth dan penolakan akses anonim Data API tanpa membaca baris data. Pemeriksaan tersebut tidak mengirim email atau memvalidasi sesi pengguna sungguhan.

### Akun dan peran

Akun dibuat melalui Supabase Authentication oleh pengelola. Trigger memberikan profil `pending` kepada akun baru. Profil akun lama telah di-backfill dengan persetujuan pengguna. Setiap pengguna hanya dapat membaca profil sendiri dan mengubah nama; peran tidak berasal dari metadata yang dapat diedit pengguna.

Operator tepercaya dapat menetapkan peran melalui SQL Editor setelah mendapat persetujuan pemilik proyek:

```sql
update public.profiles
set role = 'teacher'
where id = 'UUID-PENGGUNA';
```

Peran yang tersedia: `pending`, `administrator`, `principal`, `teacher`, `student`, dan `parent`. Peran administrator/kepala sekolah memberi akses mengelola pengumuman, bukan akses menyeluruh ke semua profil.

### Pemulihan kata sandi

Pada pengaturan Authentication proyek hosted, sesuaikan Site URL dengan alamat aplikasi dan tambahkan redirect yang dipakai, misalnya:

- `http://127.0.0.1:5173/kata-sandi` untuk server pengembangan.
- `http://127.0.0.1:4173/kata-sandi` untuk preview build.
- `https://DOMAIN-SEKOLAH/kata-sandi` untuk hosting.

Pengaturan redirect hosted dan layanan pengiriman email perlu diperiksa oleh pengelola proyek. Konfigurasi lokal `supabase/config.toml` tidak otomatis memperbarui pengaturan hosted. Untuk akun yang hanya dibuat pengelola, nonaktifkan pendaftaran pengguna baru di pengaturan Auth hosted.

Tautan lupa kata sandi membuka `/lupa-kata-sandi`; email pemulihan mengarah ke `/kata-sandi`. Formulir menunggu sesi Supabase, memerlukan minimal 8 karakter dan konfirmasi yang sama, serta tetap mengikuti kebijakan Auth server. Pengguna yang sudah masuk juga dapat mengubah kata sandi dari akun. Pesan permintaan pemulihan tidak mengungkap apakah email terdaftar.

## Dashboard dan pengumuman

Login berhasil mengarah ke `/dashboard`. Dashboard memuat nama, peran, tiga pengumuman terbit terbaru, jumlah pengumuman terbit, dan akses cepat. Pengelola juga melihat jumlah draf. Data yang gagal dimuat tidak ditampilkan sebagai angka nol.

Pada `/pengumuman`:

- Administrator dan kepala sekolah dapat membuat, mengubah, menerbitkan, dan mengarsipkan.
- Guru, murid, dan orang tua hanya dapat membaca pengumuman terbit.
- Akun `pending` tidak dapat membaca pengumuman; profil dan keamanan akun tetap tersedia.
- Draf dan arsip hanya terlihat oleh pengelola. Isi dirender sebagai teks biasa.
- Daftar menampilkan 10 pengumuman per halaman, terbaru lebih dahulu.

Akses ditegakkan oleh RLS database, selain kontrol tampilan frontend. Pengumuman menggunakan arsip tanpa hapus permanen. Referensi penulis dipertahankan, sehingga penghapusan akun yang masih memiliki pengumuman memerlukan penanganan referensi oleh operator.

## Data master sekolah

Buka `/sekolah` untuk identitas sekolah; tab lainnya mencakup tahun ajaran, semester, mata pelajaran dan kelas. Administrator dapat menambah/mengubah; kepala sekolah, guru, murid dan orang tua membaca data administratif nonpribadi. Akun pending ditolak. Ini merupakan kebijakan sementara yang dicatat di `docs/DECISIONS.md`, bukan matriks RBAC resmi yang belum tersedia.

Isi tahun ajaran sebelum membuat semester atau kelas. Tanggal semester harus berada dalam kalender tahun ajaran; satu tahun ajaran aktif secara global dan satu semester aktif per tahun diizinkan. Nonaktifkan periode lama sebelum mengaktifkan periode baru; aktivasi meminta konfirmasi. Kelas menggunakan tingkat 1–6 dan kapasitas 1–100 sebagai batas teknis sementara yang dapat ditinjau setelah blueprint tersedia. Tidak ada data sekolah yang diisi otomatis.

Ekspor CSV hanya mencakup halaman yang sedang terlihat (maksimal 20 baris), bukan seluruh database. File menggunakan UTF-8/BOM untuk Excel, escaping karakter khusus, dan perlindungan formula spreadsheet. Penugasan, relasi wali serta rekap akademik belum disediakan oleh fitur ekspor ini.

### Data guru dan siswa

Rute `/sekolah/teachers` dan `/sekolah/students` menyediakan kode internal sekolah, nama, dan status aktif. Administrator dapat menambah/mengubah; kepala sekolah membaca. Guru/siswa hanya membaca catatan yang telah dihubungkan dengan profilnya oleh operator tepercaya dan sesuai peran saat ini. Akses orang tua ditutup sampai relasi wali-anak terverifikasi diimplementasikan; pending dan anonim ditolak.

Registri tidak membuat akun login atau mengubah peran. UI dan grant kolom klien tidak mengizinkan pengisian/pengubahan `profile_id` maupun metadata pembuatan. Penghubungan akun memerlukan verifikasi operator dan persetujuan tersendiri; alurnya belum tersedia di UI. Tidak ada data orang nyata atau akun yang dihubungkan pada implementasi ini. Kode guru/siswa adalah kode internal sekolah, bukan klaim NIP/NISN resmi.

## Keanggotaan kelas dan penugasan

Rute `/sekolah/class_enrollments` dan `/sekolah/teacher_assignments` sudah tersedia. Migration `20261110084348_class_enrollments_assignments.sql` telah diterapkan setelah persetujuan dan pemeriksaan konflik. Tidak ada data sekolah yang diisi otomatis atau akun yang dihubungkan.

Administrator memilih siswa/guru, kelas, dan mata pelajaran lewat nama/kode; tahun ajaran diturunkan dari kelas. Satu siswa hanya boleh memiliki satu kelas aktif per tahun; kapasitas dan status aktif juga diperiksa di database. Perubahan relasi meminta konfirmasi. Identitas relasi tersimpan dikunci; untuk perpindahan, nonaktifkan relasi lama lalu buat relasi baru.

Guru yang akunnya sudah terhubung hanya dapat membaca siswa aktif pada kelas penugasannya yang aktif. Penonaktifan penugasan/kelas/siswa menutup akses pada permintaan berikutnya. Kepala sekolah hanya membaca; siswa membaca keanggotaan sendiri; orang tua/pending/anonim ditolak. Penghubungan akun tetap memerlukan proses verifikasi terpisah dan tidak dilakukan otomatis.

## Absensi manual

Rute `/absensi` menyediakan sesi harian per kelas. Guru dengan akun terhubung dan penugasan aktif dapat membuat sesi **hari ini** (Asia/Jakarta) dalam kalender tahun ajaran kelas. Database menyalin peserta aktif dan nama/kodenya saat sesi dibuat; seluruh status awal belum diisi, bukan hadir/alpa otomatis. Satu kelas hanya memiliki satu sesi per hari. Pembuatan sesi lampau belum tersedia karena riwayat anggota belum memiliki interval tanggal berlaku.

Guru mengisi Hadir/Sakit/Izin/Alpa lalu mengonfirmasi penyimpanan. Koreksi status terisi memerlukan alasan 5–300 karakter. Penyimpanan batch atomik dan memakai revisi; konflik meminta reload eksplisit sehingga perubahan tidak saling menimpa diam-diam. Riwayat mencatat pelaku, waktu, status lama/baru dan alasan. Klien tidak dapat mengubah tabel catatan atau audit secara langsung.

Administrator/kepala sekolah hanya membaca rekap dan riwayat; siswa hanya membaca catatan sendiri tanpa catatan koreksi staf. Orang tua/pending/anonim ditolak. Pencabutan penugasan menutup akses guru pada permintaan berikutnya. Daftar sesi dipaginasi, rekap/CSV mengikuti data yang diizinkan, dan riwayat menampilkan maksimal 200 perubahan terbaru. CSV berisi status tersimpan, bukan draft.

### Impor Excel absensi

Pada sesi di `/absensi`, guru bertugas dapat mengunduh template XLSX, mengisi status/alasan koreksi, memilih file, memeriksa preview, lalu mengonfirmasi impor. Kode siswa harus tetap berupa teks; status kosong atau baris yang tidak disertakan tidak mengubah catatan. Kesalahan pada satu baris memblokir seluruh impor. Simpan atau batalkan draft manual sebelum mengimpor.

File dibatasi 2 MB, satu sheet dan 100 peserta; formula, makro serta external workbook ditolak. Template terikat pada sesi yang dipilih. Koreksi tetap memerlukan alasan dan pemeriksaan revisi. Penyimpanan atomik memakai request ID yang sama saat retry setelah respons tidak pasti; konflik revisi memerlukan muat ulang dan preview baru. Riwayat menampilkan 20 impor terbaru bagi staf yang berwenang. File asli tidak diunggah atau disimpan; database menyimpan metadata, hash dan audit perubahan.

Backdate dan persetujuan koreksi belum dibuat. Detail asumsi dan batas parser tersedia di `docs/DECISIONS.md` dan `docs/IMPLEMENTATION_LOG.md`.

### Rekap rentang tanggal

Di `/absensi`, pilih kelas serta tanggal awal/akhir, lalu **Tampilkan rekap**. Batas satu kelas dan 31 hari inklusif. Rekap menghitung status tersimpan per siswa, termasuk Belum diisi; hari tanpa sesi tidak menjadi alpa. Nama/kode memakai snapshot terakhir dalam rentang. Siswa hanya memperoleh catatan sendiri; guru sesuai penugasan; administrator/kepala sekolah membaca sesuai RLS.

Hasil dapat diekspor sebagai CSV setelah seluruh query berhasil. Perubahan filter membersihkan hasil lama; kegagalan query tidak menampilkan hasil parsial. Laporan memakai beberapa query dan tidak menjamin snapshot transaksi tunggal. Waktu pemuatan ditampilkan; tampilkan kembali untuk memperbarui setelah koreksi. Fitur ini tidak mengubah database atau peran.

## Jurnal mengajar

Rute `/jurnal` menyediakan catatan topik, kegiatan dan refleksi guru. Guru memilih penugasan aktif, mengisi jurnal hari ini (Asia/Jakarta), memeriksa dan mengonfirmasi. Penulis/waktu serta nama referensi disalin server. Catatan tersimpan belum dapat diedit/dihapus; backdate dan persetujuan belum tersedia.

Guru membaca catatan sendiri selama penugasan terkait aktif. Administrator/kepala sekolah hanya membaca. Siswa/orang tua/pending/anonim ditolak. Daftar dipaginasi 20 catatan; CSV mengikuti halaman terlihat. Retry memakai ID catatan yang sama; periksa daftar sebelum membuat catatan baru setelah respons tidak pasti.

## Pengujian

`npm run check` mencakup ESLint, TypeScript, tes unit/database dan build. ESLint 10 memerlukan Node yang kompatibel; gunakan Node 24 sesuai CI.

```powershell
npm run check
npm run test:browser
npm run check:supabase
```

`npm run check` menjalankan tes unit/database dan build. PGlite menjalankan PostgreSQL terisolasi dengan kontrak Auth minimal untuk menguji migration, trigger, batas isi, izin kolom, dan RLS tanpa mengubah database remote.

Tes browser menggunakan API tiruan serta akun sintetis untuk memeriksa login salah/benar, pemulihan sesi, logout, profil, dashboard, peran pending/pembaca/pengelola, membuat/mengubah/mengarsipkan pengumuman, pagination, penanganan jaringan gagal, dan validasi kata sandi. Tes berjalan pada viewport desktop dan ponsel. Windows menggunakan Edge; platform lain menggunakan Chromium. Jika diperlukan:

```powershell
npx playwright install chromium
```

Pada Windows, gunakan `$env:PLAYWRIGHT_CHANNEL='chromium'` untuk memilih Chromium yang dipasang Playwright. Pada CI Linux, browser dipasang otomatis. Pengujian browser tiruan tidak menggantikan pengujian email dan login Supabase sungguhan.

Baseline 20 November 2026: `npm run check` pada Node v24.22.3 EXIT 0 dengan **140/140 tes unit/database**, lint, typecheck, build 1.787 modul, dan audit bundel 29 JavaScript tanpa akun demo. Suite browser penuh terakhir yang tercatat Qoder **312/312 lulus** (port 5401, 8,8 menit) dengan API tiruan, tetapi run Codex pada tree ini **308/312** dengan empat kegagalan yang belum ditriase; angka 312 karena itu historis sampai ada run ulang yang hijau. Rincian di [cakupan uji](docs/QA_COVERAGE.md). Angka 109 tes, 137/137, 194/216, 228/228, dan 306/306 adalah riwayat, bukan status terkini. Build masih memperingatkan chunk PDF besar. `npm run check:supabase` pada 14 November 2026 mengonfirmasi Auth aktif dan penolakan akses anonim pada tabel yang diperiksa, tanpa membaca baris. Pengujian akun sekolah nyata belum dilakukan. Workflow GitHub Actions tersedia di `.github/workflows/verify.yml`; workflow hosted belum diverifikasi.

## Deployment

Publikasikan folder `dist` melalui hosting SPA. Pada Vercel, pilih root proyek `SI_STIR_HEBAT_Starter/si-stir-hebat`; konfigurasi `vercel.json` sudah tersedia. Pada Netlify, gunakan build `npm run build` dan publish directory `dist` relatif terhadap base directory proyek; aturan fallback tersedia di `public/_redirects` dan ikut tersalin ke build.

Deployment Vercel saat ini: https://si-stir-hebat-blue.vercel.app. Untuk deployment ulang, atur kedua variabel `VITE_SUPABASE_*` sebelum build dan pertahankan rewrite SPA. Site URL dan redirect Auth produksi tetap perlu diperiksa pada Supabase. Verifikasi route publik/protected, login/logout dengan akun sekolah, serta email pemulihan sebelum menyatakan aplikasi siap operasional.

## CLI, MCP, dan migration berikutnya

Supabase CLI tersedia sebagai dev dependency. Stack lokal memerlukan Docker aktif. MCP dan CLI memiliki autentikasi terpisah; kemampuan MCP bergantung pada autentikasi serta izin yang diberikan. Jangan melakukan perubahan hosted tanpa persetujuan eksplisit.

Daftar dan jumlah migration hosted ada pada bagian [Status saat ini](#status-saat-ini). Jangan mengubah atau menerapkan ulang migration yang sudah tercatat. Untuk perubahan berikutnya, buat migration baru, uji lokal, cocokkan riwayat hosted, lalu minta persetujuan sebelum menerapkannya. Jangan menjalankan reset pada database hosted untuk menyalin konfigurasi lokal.

Jadwal pelajaran dan usulan perubahan guru tersedia di `/jadwal`. Admin dapat menyetujui/menerapkan atau menolak dengan alasan; lihat pembaruan 13 November 2026 dalam [status proyek](docs/PROJECT_STATUS.md).

Panduan aktivasi administrator dan deployment: [Aktivasi dan rilis](docs/AKTIVASI_DAN_RILIS.md). Workflow pada .github/workflows/verify.yml ditujukan untuk repository aplikasi mandiri.

## Status terbaru backend — 20 November 2026

Stack tetap React 19 + Vite + TypeScript + React Router + Supabase. Status dan batas bukti saat ini tercatat di [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md), keputusan terbaru pemilik di [`docs/DECISIONS.md`](docs/DECISIONS.md), dan koordinasi kerja di [`docs/AI_COORDINATION.md`](docs/AI_COORDINATION.md). Jangan menganggap perubahan migration lokal sudah hosted: hosted masih 23 versi, Advisor baseline memiliki satu WARN perlindungan kata sandi bocor, dan tidak ada migration baru yang diterapkan.
