
## Batas proyek Codex dan pencatatan migration — 13 November 2026

Pengguna menetapkan aplikasi React/Vite yang ada sebagai satu-satunya aplikasi utama SI STIR HEBAT. `AGENTS.md` dan README kini menetapkan folder ini sebagai root kerja Codex dan menandai demo Next.js di luar folder sebagai non-kanonis. Migration hosted `20261113074045_create_private_todos` dicatat di `supabase/migrations` dengan RLS pemilik; tabel contoh kosong dan tidak dipakai UI aplikasi. `scripts/check-supabase.mjs` memasukkan tabel itu dalam pemeriksaan penolakan akses anonim. Advisor keamanan tidak melaporkan lint; migration dan policy diverifikasi melalui metadata tanpa membaca data pengguna.

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
# Catatan implementasi

## 10 November 2026 — Audit berdasarkan master prompt

Proyek yang sudah ada dipertahankan. Pemeriksaan mencakup source, routing, konfigurasi TypeScript/Vite/Supabase, migration, dependensi, Git, dan dokumen referensi. Tidak ditemukan dokumen PRD/blueprint/RBAC/API yang disebutkan. Git menunjukkan perubahan workspace belum di-commit.

Hasil sebelum perubahan fase ini: 20 tes unit/database, 18 tes browser, dan build lulus pada pekerjaan sebelumnya. Migrasi profil/pengumuman sudah diterapkan dengan persetujuan. Hak akun tidak diubah sesuai instruksi pengguna.

## Fondasi pemeriksaan

- `eslint.config.js`: pemeriksaan JavaScript, TypeScript, dan aturan inti React Hooks.
- `package.json` / lockfile: dependensi lint dipin; script lint/typecheck akan dimasukkan ke alur check.
- `docs/PROJECT_STATUS.md`: status terpisah untuk selesai, sebagian, belum dibuat, blocker, dan prioritas.
- `docs/DECISIONS.md`: asumsi sementara saat dokumen sumber belum tersedia.

Hasil fase berikutnya dicatat setelah pemeriksaan dijalankan; tidak menganggap instalasi atau penulisan source sebagai bukti fitur telah berfungsi.

## Fondasi — hasil

- `eslint.config.js`, script `lint`, `typecheck`, dan `check` terpasang. CI menambahkan lint dan typecheck sebelum tes/build.
- `src/components/ui/Feedback.tsx`: komponen loading, empty, dan pesan kesalahan dengan retry.
- `src/components/ui/ErrorBoundary.tsx`: fallback ketika render gagal; tidak mencetak props, data sesi, atau input pribadi.
- Dependensi lint menggunakan ESLint 10 dan plugin dengan peer dependency yang sesuai. Audit instalasi mengungkap advisori minimatch transitif. Override `minimatch: 11.0.1` ditambahkan sesuai [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), kemudian lint dan tes dijalankan. `npm audit` terakhir: 0 vulnerability. Tidak menjalankan `audit fix --force`.

## Data master administratif

- `src/features/school/master.ts`: registry kolom/form dan validator. Payload membatasi mutasi hanya ke kolom yang diizinkan; bilangan, checkbox, tanggal, NPSN, dan kode mata pelajaran divalidasi.
- `src/features/school/MasterData.tsx`: identitas sekolah, tahun ajaran, semester, mata pelajaran, kelas; tambah/ubah, pagination, kalender, konfirmasi aktivasi, status loading/empty/error, dan ekspor halaman.
- `src/app/App.tsx`, `src/styles/global.css`: rute `/sekolah/:kind?`, navigasi, tabel dengan scroll internal pada layar kecil, label dan nama tombol yang dapat dibaca pembaca layar.
- `src/utils/csv.ts`: CSV UTF-8/BOM dengan escaping serta mitigasi formula spreadsheet; hanya mengekspor baris halaman yang sedang terlihat.
- `tests/master.test.mjs`, `tests/csv.test.mjs`, `tests/database.test.mjs`, dan `tests/browser/app.spec.ts`: validasi, payload whitelist, CSV, RLS semua peran, kalender, periode aktif tunggal, edit, konfirmasi, unduhan, dan kondisi backend belum tersedia.

## Migration remote — disetujui dan diverifikasi

Pemeriksaan konflik menemukan hanya tabel profil/pengumuman dari riwayat sebelumnya. Pengguna menyetujui lima tabel master baru dan pencabutan izin eksekusi fungsi bawaan. Native MCP digunakan; tidak menggunakan secret key frontend atau mengubah peran akun.

| Versi remote | Nama | Hasil |
| --- | --- | --- |
| `20261110081258` | `school_master_data` | diterapkan |
| `20261110081303` | `restrict_auto_rls_execution` | diterapkan |

SQL lokal yang belum diterapkan sebelumnya diganti nama mengikuti versi aktual remote. Isi dua migration lama yang sudah ada tidak diubah. Data master tidak di-seed.

Verifikasi metadata: tujuh tabel, seluruhnya RLS aktif; 20 policy; dua trigger kalender; update kolom dibatasi; `anon` dan `authenticated` tidak dapat mengeksekusi `rls_auto_enable()`. Fungsi tersebut bertipe event-trigger, sehingga advisory tidak otomatis membuktikan dapat dipanggil sebagai RPC biasa; pembatasan grant dilakukan sebagai penguatan izin. Advisor sesudahnya: `lints: []`.

`scripts/check-supabase.mjs` diperluas untuk ketujuh tabel. Pemeriksaan live lulus: Auth email aktif dan akses anonim ditolak, tanpa mengambil baris data sekolah.

## Verifikasi terakhir

- `npm run check`: lint tanpa warning, TypeScript, 34 tes unit/database, production build lulus.
- Pengujian browser awal: 24/28 lulus; empat gagal karena selector nama sel juga cocok dengan nama tombol edit. Selector diperbaiki menggunakan `exact: true`, lalu empat skenario tersebut lulus pada rerun terarah.
- Setelah penambahan unduhan CSV, seluruh suite browser dijalankan ulang: **28/28 lulus**, desktop dan ponsel, dalam 59,9 detik.
- Pengujian remote menggunakan metadata dan akses anonim. Tidak mengklaim pengiriman email, login akun sekolah, atau alur akademik yang belum dibangun telah diuji langsung.

## Registri guru/siswa — 10 November 2026

- `src/features/school/master.ts`: definisi guru/siswa, validasi kode/nama, payload whitelist, dan fungsi izin yang memisahkan data orang dari master nonpribadi.
- `src/features/school/MasterData.tsx`: tab sesuai peran, tambah/ubah dan ekspor menggunakan komponen yang ada; akses langsung ke URL terlarang tetap ditolak. UI tidak menampilkan input UUID, penghubung akun, atau perubahan peran.
- `supabase/migrations/20261110082821_people_registry.sql`: diterapkan setelah persetujuan pengguna dan pemeriksaan konflik; nama lokal diselaraskan dengan versi remote. Menambahkan dua tabel dengan RLS, tiga policy per tabel, unique kode/profil, FK dan indeks penulis.
- `tests/database.test.mjs`: administrator mengelola tanpa hak penghubungan akun; kepala sekolah hanya membaca; guru/siswa hanya membaca baris terhubung; akses lintas registri, baris lain, orang tua/pending/anonim, penulisan metadata, duplikasi dan kode tidak valid diuji.
- `tests/master.test.mjs` dan `tests/browser/app.spec.ts`: izin tab/route, validasi/payload, tambah/edit siswa dan status aktif, daftar guru terhubung serta penolakan akses.
- `scripts/check-supabase.mjs`: mencakup sembilan tabel, tetap tanpa membaca baris data pribadi.

Hasil: `npm run check` lulus (lint, TypeScript, **43 tes unit/database**, build). Suite browser desktop/ponsel **36/36 lulus**. Advisor keamanan remote: `lints: []`. Grant metadata mengonfirmasi insert/update klien hanya pada kode/nama/status; semua kolom ID, profil, penulis dan tanggal pembuatan dilindungi. Data API menolak akses anonim di kesembilan tabel.

Tidak ada akun dibuat, peran diubah, penghubungan profil, atau data guru/siswa nyata dimasukkan. Penugasan, keanggotaan kelas dan verifikasi wali masih pekerjaan berikutnya.

## Keanggotaan dan penugasan — implementasi lokal berikutnya

- Migration `20261110084348_class_enrollments_assignments.sql`: relasi kelas per tahun dan penugasan kelas/mata pelajaran; FK komposit menjaga riwayat tahun kelas, indeks unik parsial membatasi kelas aktif siswa, dan trigger memeriksa kapasitas serta status aktif.
- `school_private.can_read_assigned_student(uuid)` memeriksa pengguna/peran di dalam fungsi privat dan menghindari siklus RLS antara siswa/keanggotaan. Akses guru mengikuti penugasan dan status aktif; guru tidak mendapat izin menulis data siswa atau relasi.
- `src/features/school/master.ts` / `MasterData.tsx`: jenis referensi, opsi nama/kode/tahun, pengambilan lookup mengikuti RLS, empty/error state, konfirmasi perubahan relasi, serta pemeliharaan identitas riwayat. Update relasi hanya mengirim status aktif; pemindahan menggunakan relasi baru.
- `tests/database.test.mjs`: kapasitas, kelas aktif ganda, perpindahan lintas tahun, perlindungan metadata/identitas, guru tanpa penugasan, akses terbatas pada kelas yang ditugaskan, pencabutan status, siswa sendiri, kepala sekolah, orang tua/pending/anonim, dan perubahan tahun kelas yang memiliki riwayat.
- `tests/browser/app.spec.ts`: keanggotaan dan penugasan menggunakan label manusia, konfirmasi/batal, prasyarat kosong, penguncian pilihan pada relasi tersimpan dan payload status saja.

Hasil: **50 tes unit/database lulus**, suite penuh **42 tes browser lulus**. Setelah penguncian identitas riwayat, **empat tes relasi terarah lulus**, termasuk pemeriksaan pilihan tidak dapat diubah serta payload update hanya status. Lint, TypeScript dan build terakhir lulus. PGlite menguji invariant secara sekuensial, bukan stress test multikoneksi.

Pengguna menyetujui melalui bubble. Pemeriksaan menemukan 9 tabel lama dan tidak ada konflik nama relasi. Native MCP menerapkan versi `20261110084348`, kemudian metadata mengonfirmasi RLS dan tiga policy pada setiap tabel baru, policy tambahan siswa untuk guru bertugas, serta grant update hanya `is_active`. Helper SECURITY DEFINER berada di schema `school_private` yang tidak diekspos Data API, memiliki pemeriksaan identitas/peran internal, dan tidak memberikan execute kepada anon. Advisor keamanan: `lints: []`. Tidak mengubah peran, membuat data, atau menghubungkan akun.

## Absensi manual — implementasi lokal

- `src/features/attendance/Attendance.tsx`: sesi per kelas, salinan peserta hari ini, editor status tanpa hadir otomatis, konfirmasi, alasan koreksi, rekap, CSV tersimpan, riwayat dan pesan konflik revisi.
- `src/features/attendance/attendance-model.ts`: tipe, label, ringkasan yang memisahkan belum diisi dari alpa, validasi koreksi dan tanggal aplikasi. Nama file model dibedakan dari komponen agar resolusi modul Windows tidak bertabrakan.
- `src/app/App.tsx` / CSS: rute `/absensi`, navigasi dan tampilan responsif.
- Migration `20261110091137_attendance_core.sql`: tiga tabel, snapshot peserta saat membuat sesi, RLS, helper privat, serta wrapper RPC SECURITY INVOKER ke penyimpan privat yang memvalidasi aktor, penugasan, status, alasan dan revisi. Update catatan dan audit berjalan dalam satu transaksi.
- Tes menemukan masalah SELECT-policy pada INSERT RETURNING: helper STABLE tidak melihat sesi yang baru disisipkan dalam snapshot statement yang sama. Policy guru diperbaiki untuk memeriksa `class_id` baris langsung, tanpa mengendurkan hak. Kolom juga dikualifikasi eksplisit untuk menghindari benturan nama `id` profil/sesi. Lihat [snapshot fungsi PostgreSQL](https://www.postgresql.org/docs/current/xfunc-volatility.html).
- `tests/database.test.mjs`: snapshot, larangan backdate/future date, kelas kosong, audit, rollback batch, revisi usang, alasan koreksi, pemalsuan ID, akses siswa sendiri, larangan catat bagi admin/kepala sekolah, akses lintas kelas, dan pencabutan penugasan.
- `tests/attendance.test.mjs` dan tes browser: status awal kosong, ringkasan, tanggal, konfirmasi, koreksi, ekspor, read-only peran, konflik yang mempertahankan draft sampai reload eksplisit, dan pembuatan sesi.

Verifikasi: **62 tes unit/database**, lint, TypeScript dan build lulus; **14 tes browser absensi** dan kemudian suite penuh **56/56 tes browser** lulus setelah perubahan navigasi/pemilihan sesi baru. Pengujian browser menggunakan API tiruan; tidak mengklaim login atau absensi akun sekolah sungguhan sudah diuji langsung.

Pengguna menyetujui migration melalui bubble. Pemeriksaan konflik menemukan 11 tabel lama dan tidak ada fungsi absensi dengan nama yang bentrok. Native MCP menerapkan versi `20261110091137`; file lokal diselaraskan dengan versi remote. Verifikasi metadata: RLS aktif pada tiga tabel baru, catatan/audit tidak memiliki grant tulis langsung bagi klien, insert sesi hanya untuk kolom kelas/tanggal, dan RPC publik SECURITY INVOKER tidak dapat dieksekusi anon. Advisor keamanan: `lints: []`. Pemeriksaan live Auth serta penolakan akses anonim ke 14 tabel lulus tanpa membaca baris data. Tidak mengisi absensi, menghubungkan akun atau mengubah peran.

## Impor XLSX — 10 November 2026

- Dependensi runtime dipin: `read-excel-file`, `write-excel-file`, dan `unzipit`. API aktual diperiksa dari tipe versi terpasang, termasuk `.toBuffer()`/`.toFile()` dan pembacaan workbook berisi sheet/data.
- `import-model.ts`: template dengan identitas sesi; validasi kode teks, duplikasi, cakupan peserta, status, alasan, jumlah baris; blank/omitted bukan alpa. Preview mengikat revisi status yang tersimpan.
- `read-attendance-xlsx.ts`, `xlsx.worker.ts`, `xlsx-client.ts`: preflight metadata ZIP, larangan formula/makro/external workbook, satu sheet, batas isi/file/baris, worker yang dapat dihentikan dan timeout. Parser membaca file lokal tanpa upload.
- `AttendanceImport.tsx`: unduh template, pilih file, preview, blokir seluruh file jika ada kesalahan, konfirmasi, retry memakai request ID yang sama, dan riwayat metadata. Integrasi Attendance mengunci operasi lain saat pemrosesan serta menolak impor saat draft manual belum disimpan.
- Migration `20261110093304_attendance_imports.sql` diterapkan setelah persetujuan bubble dan pemeriksaan konflik. Native MCP memverifikasi RLS, grant hanya baca pada log, RPC publik SECURITY INVOKER, penyimpan privat dengan pemeriksaan penugasan dan tanpa hak anonim. Advisor keamanan: `lints: []`. Tidak memasukkan data impor/absensi nyata.
- `tests/attendance-import.test.mjs`: XLSX nyata round-trip, preservasi kode `001`, rumus/multi-sheet/ZIP invalid, sesi/header salah, kode asing/ganda, alasan dan batas input.
- Tes database: sekali simpan meskipun retry identik, penolakan reuse request ID dengan isi berbeda, rollback tanpa log sukses pada revisi usang, metadata invalid, larangan manipulasi log, akses antarperan/kelas.
- Tes browser XLSX awal 5/6 lulus; satu tes mengisi file saat input masih dinonaktifkan selama unduhan template. Tes disinkronkan untuk menunggu input aktif. Rerun **6/6 lulus**, termasuk preview sebelum mutasi, file invalid dan respons tidak pasti setelah commit yang dicoba ulang dengan request ID sama.

`npm run check` lulus dengan **72 tes unit/database**, lint, TypeScript dan build. Suite browser penuh **62/62 lulus** pada desktop dan ponsel. Pemeriksaan live Auth dan penolakan akses anonim seluruh 15 tabel lulus; npm audit melaporkan 0 vulnerability. Perubahan mengatasi transisi pemilihan sesi agar tidak mendereferensikan sesi yang belum ada pada daftar ketika sesi baru baru saja dibuat.

## Rekap rentang tanggal - 10 November 2026

- Audit AGENTS.md, kode, migration dan Git: dokumen referensi resmi tetap tidak tersedia; perubahan lama dipertahankan. Tidak mengubah skema atau akun/peran.
- Changelog resmi Supabase dan dokumentasi filter/range diperiksa; query memakai klien sesi pengguna serta RLS yang sudah ada. Advisor keamanan hosted mengembalikan lints kosong. Tidak membaca baris data sekolah nyata.
- AttendanceReport.tsx: filter satu kelas, tanggal inklusif maksimal 31 hari; query sesi berurutan dengan batas sentinel dan roster terpisah per sesi, empat bersamaan, untuk menghindari pemotongan 1.000 baris. Kegagalan meniadakan hasil/ekspor; perubahan filter membersihkan hasil lama.
- report-model.ts: validasi tanggal kalender/rentang dan agregasi berdasarkan ID siswa dengan snapshot terbaru. Belum diisi tidak dihitung alpa. Tidak menghitung persentase tanpa kalender hari efektif.
- Ekspor CSV memakai hasil tersimpan dan sanitasi formula yang tersedia. UI menjelaskan batas akses serta konsistensi beberapa query. Komponen menghentikan request saat dilepas; filter mempunyai label, fieldset dan status/error.
- Dua tes unit baru memeriksa batas tanggal, tahun kabisat, identitas siswa, snapshot berubah dan status kosong. npm run check lulus 74 tes unit/database, lint, TypeScript dan build.
- Enam kasus browser baru (desktop/ponsel): 1.100 catatan dengan query terfilter dan ekspor total, rentang invalid, kegagalan salah satu roster tanpa hasil parsial, serta cakupan siswa sendiri. Ekspektasi CSV diperbaiki untuk kolom berkutip. Fixture kegagalan 503 awal memicu retry otomatis SDK melebihi timeout assertion; fixture diganti pencabutan izin 403 setelah satu roster berhasil. Regresi penuh dengan fixture final lulus 68/68 tes browser (1,7 menit). Lint dan build final juga lulus setelah penataan form responsif.

## Jurnal mengajar - 10 November 2026

- Audit kode dan instruksi proyek; PRD/RBAC belum tersedia. Memakai keputusan konservatif staff-only, append-only tanpa persetujuan akademik.
- Skill Supabase/Postgres, dokumentasi RLS resmi dan aturan privilege/index diperiksa. CLI migration new membuat draft `20261110095054_teaching_journals.sql`; belum diterapkan remote. CLI awal dibatasi sandbox pada file telemetri pengguna; dijalankan kembali dengan izin eskalasi untuk pembuatan berkas lokal.
- Tabel jurnal dengan FK penugasan/penulis, snapshot nama, tanggal/topik/kegiatan/refleksi dan indeks; RLS select/insert, helper privat SECURITY DEFINER dengan auth.uid internal, trigger SECURITY INVOKER. Grant kolom menolak pemalsuan penulis/waktu/snapshot. Tidak ada update/delete atau RPC publik baru.
- JournalWorkspace: profil sendiri, pilihan penugasan aktif, form/konfirmasi, UUID stabil, deteksi retry identik melalui pembacaan catatan ber-ID sama, plain text, pagination 20 dan CSV halaman. Route terlindungi, tautan navigasi dan akses cepat dashboard ditambahkan. Backend hilang memberi state persiapan.
- Tes database: penulis/snapshot, metadata forgery, immutable, tanggal/kalender/isi, lintas peran/guru, pencabutan penugasan/guru/kelas/mapel dan pencabutan peran. Tes awal memakai parameter date + unknown; cast integer eksplisit memperbaiki query tes. Migration tidak diubah untuk mengatasi kegagalan query tes tersebut.
- Dua tes model validasi/payload dan 18 tes browser jurnal lulus. npm run check lulus 80 tes unit/database, lint, TypeScript dan build. Regresi browser penuh final 86/86 lulus (1,8 menit).
- Pemeriksaan metadata hosted: nama tabel/helper/trigger belum ada. Advisor security mengembalikan lints kosong. Tidak membaca data orang nyata atau menerapkan migrasi tanpa persetujuan.

Regresi penuh pertama fase jurnal: 83/86 lulus. Dua assertion status jurnal terlalu luas saat pesan sukses dan indikator reload muncul bersamaan; locator diperjelas berdasarkan isi sukses. Satu tes XLSX lama tidak menghasilkan preview karena pemilihan file terjadi pada transisi kontrol; tes sekarang menunggu tombol template aktif dan menggunakan file chooser dengan pemeriksaan actionability. Tidak menambahkan sleep atau mengubah parser untuk mengatasi tes tersebut. Regresi final lulus 86/86 tes browser desktop/ponsel (1,8 menit). Lint final dan git diff --check lulus. Migration tetap belum diterapkan, menunggu persetujuan bubble.

## Pemulihan build dan persiapan migration jurnal - 11 November 2026

- Menyelaraskan tipe sesi demo dengan SDK dan mempertahankan pemeriksaan klien pada pemuatan profil, dashboard, dan pengumuman.
- Pengunjung demo tanpa sesi diarahkan ke halaman masuk oleh rute terlindungi. Penyimpanan sesi demo hanya dibaca saat konfigurasi Supabase tidak tersedia.
- npm run check lulus, termasuk 81 tes unit/database. Seluruh 86 tes browser desktop/ponsel lulus setelah menjalankan Playwright dengan akses ke server lokal dan Edge.
- Pembacaan riwayat hosted mengonfirmasi delapan migration. Pemeriksaan metadata mengonfirmasi tabel dan dua fungsi jurnal belum ada. Tidak ada perubahan remote.

## Penerapan migration jurnal - 11 November 2026

- Migration jurnal diterapkan ke Supabase setelah persetujuan pengguna. Versi hosted 20261111070725 diselaraskan dengan nama berkas lokal.
- Metadata mengonfirmasi RLS, policy baca dan insert, trigger validasi aktif, serta pembatasan izin kolom. Security Advisor tidak melaporkan temuan.
- npm test lulus 81 tes. npm run check:supabase mengonfirmasi Auth aktif dan Data API menolak akses anonim ke seluruh 16 tabel. Pengujian menggunakan akun sekolah masih tertunda.

## Rekonsiliasi dokumen dan navigasi peran

- Menelaah tujuh lampiran dan mencatat kesenjangan fitur pada status proyek.
- Navigasi memakai peran profil sendiri, menandai halaman aktif, dan menampilkan tautan untuk modul yang dapat dibuka oleh pengguna. Pemeriksaan di modul dan Supabase tetap berlaku.
- npm run check lulus dengan 81 tes unit/database. Enam tes navigasi Playwright untuk guru, siswa dan orang tua lulus pada desktop dan ponsel dengan API tiruan.

## Tautan akun dan verifikasi wali

- Migration 20261111074620_account_relationships membuat relasi wali dan audit perubahan. RPC memvalidasi peran administrator dan kecocokan peran target, mencegah penggantian akun tanpa pencabutan, serta mencatat perubahan dalam transaksi yang sama. Retry identik tidak menambah audit.
- UI admin meninjau registri berdasarkan kode dan mengonfirmasi ID akun serta alasan sebelum menyimpan. Tidak ada perubahan akun atau data sekolah nyata saat penerapan migration.
- 82 tes lokal, empat tes browser desktop/ponsel dan pemeriksaan Data API anonim pada 18 tabel lulus. Pemeriksaan Security Advisor tertunda karena refresh OAuth konektor gagal.

## Ruang Orang Tua dan kehadiran anak

- RPC guardian_attendance memakai profil wali dan relasi terverifikasi pada setiap permintaan. Hasil hanya memuat nama anak aktif serta tanggal dan status hingga 30 catatan per anak.
- Migration 20261111075356_guardian_attendance diterapkan dan versi lokal diselaraskan. Eksekusi anonim ditolak, panggilan tanpa identitas kosong, dan Security Advisor tidak melaporkan temuan.
- Lint, TypeScript, build, 83 tes lokal dan dua tes browser portal wali lulus. Tes database memverifikasi pembatasan anak dan pencabutan. Tes browser memakai API tiruan di desktop dan ponsel.

## Penyusunan dan pemeriksaan modul ajar

- Menambah alur draf, pengajuan, revisi, persetujuan, dan arsip. Akses guru mengikuti penugasan aktif. Kepala sekolah berwenang memeriksa, sementara administrator memiliki akses baca atas modul yang sudah diajukan.
- Database mengendalikan transisi dan mencatat audit status. UI menyertakan versi baris saat menyimpan untuk mendeteksi perubahan serentak.
- Migration 20261111080033_teaching_modules diterapkan dan berkas lokal diselaraskan. Build, 84 tes lokal dan dua tes browser desktop/ponsel lulus. Security Advisor tidak melaporkan temuan.

## Supervisi Akademik

- Mengimplementasikan empat tahap, validasi skor dan kelengkapan, versi baris untuk perubahan serentak, audit transisi, serta publikasi hasil ke guru terkait.
- Migration 20261111080735_academic_supervision diterapkan dan diselaraskan. RLS, dua trigger dan pembatasan akses anonim diperiksa. Security Advisor tidak melaporkan temuan.
- Build, 85 tes lokal dan dua tes browser penjadwalan lulus. Port Playwright dapat diatur dengan PLAYWRIGHT_PORT ketika port bawaan dipakai proses lain.

## Laporan Supervisi

- Menambahkan laporan khusus kepala sekolah dengan filter tanggal di server, status tahap, target tindak lanjut, status publikasi dan CSV. Perubahan filter menghapus hasil sebelumnya.
- npm run check lulus dengan 85 tes lokal. Empat tes browser desktop dan ponsel untuk laporan, unduhan dan penjadwalan lulus dengan API tiruan.

## Penyimpanan otomatis observasi

- Menyimpan skor dan catatan setelah jeda input. Simpan manual dan otomatis memakai satu pengunci permintaan serta filter revisi yang sama.
- Isian tetap di formulir bila penyimpanan tidak dikonfirmasi. Pengguna dapat mencoba lagi atau memuat versi terbaru setelah membuang isian.
- Lint, TypeScript, build, 85 tes lokal dan enam tes browser supervisi lulus. Tidak memerlukan migration.

## Bukti privat supervisi

- Menambah bucket privat dengan kebijakan baca sesuai RLS sesi supervisi dan pembatasan unggah serta hapus pada tindak lanjut yang belum dipublikasikan.
- Migration 20261111082822_supervision_evidence diterapkan dan diselaraskan. Metadata bucket, batas ukuran, tiga policy dan Security Advisor diperiksa.
- Build, 85 tes lokal termasuk pembatasan RLS bukti, serta dua tes unggah browser desktop dan ponsel lulus.

## Ekspor Excel rekap absensi

- CSV dan XLSX memakai hasil rekap tersimpan yang sama. Workbook menyimpan kode dan nama sebagai teks, serta jumlah kehadiran sebagai angka.
- Build, 85 tes lokal dan enam tes browser rekap lulus. Tes browser membuka kembali hasil unduhan dan memeriksa jumlah baris, nol di awal kode, teks mirip rumus dan total numerik. Tidak memerlukan migration.

## Publikasi materi kelas

- Menambah draf materi teks dengan snapshot kelas dan mapel, konfirmasi publikasi, arsip dan filter versi baris. RLS membaca keanggotaan kelas dan relasi wali saat permintaan.
- Migration 20261111092126_class_materials diterapkan. RLS dan Security Advisor diverifikasi. Build, 86 tes lokal dan dua tes browser desktop/ponsel lulus.

## Publikasi tugas kelas

- Menambah jenis tugas dan tenggat pada alur kelas yang sudah ada. Materi lama tetap tampil di /materi.
- Migration 20261111092744_class_tasks diterapkan. RLS, constraint, trigger dan Security Advisor diperiksa. Build, 87 tes lokal dan empat tes browser lulus.

## Pemeriksaan workspace — 12 November 2026

Antarmuka TaskSubmissions sudah tersedia dan terhubung dari halaman tugas. Siswa dapat mengirim jawaban teks, sedangkan guru dapat membaca jawaban dengan pagination. Penerapan migration task_submissions di remote dan pengujian browser alur pengumpulan belum diverifikasi pada pemeriksaan ini.

npm run check berhasil: lint, TypeScript, 87 tes lokal dan build produksi lulus. Hasil ini tidak membuktikan seluruh kebutuhan PRD telah selesai. Pekerjaan terbuka tetap meliputi verifikasi pengumpulan, umpan balik dan penilaian, jadwal, administrasi dokumen, kehadiran guru, serta UAT akun sekolah.

## Pengumpulan jawaban tugas

- Menambahkan jawaban teks melalui /tugas. Database memvalidasi publikasi, tenggat WIB, identitas dan keanggotaan kelas saat pengiriman serta mencegah pengiriman ganda.
- Migration 20261111232717_task_submissions diterapkan. Build dan 87 tes lokal lulus, termasuk pembatasan akses guru, siswa dan wali. Security Advisor tidak melaporkan temuan.

## Verifikasi pengumpulan tugas — 12 November 2026

Riwayat Supabase diperiksa langsung: migration task_submissions belum diterapkan. Seluruh 87 tes lokal lulus, termasuk pengumpulan, pengiriman ganda dan pembatasan akses. Tes browser baru memeriksa pengiriman jawaban serta pemuatan ulang halaman. Eksekusi browser belum berhasil diverifikasi karena server pengujian tidak mencapai kondisi siap. Penerapan remote dan verifikasi browser masih tertunda.
# Verifikasi pengumpulan dan pemulihan koneksi — 12 November 2026

- Mengonfirmasi migration `20261111232717_task_submissions` pada riwayat Supabase; metadata menunjukkan RLS aktif dan akses SELECT anonim ditolak. Tidak membaca data pengguna.
- Mengunci pengiriman ulang ketika hasil permintaan belum diketahui sampai pemeriksaan status berhasil. Isian jawaban dipertahankan ketika koneksi gagal.
- Menambahkan skenario browser untuk respons hilang dan konflik unik, termasuk pemeriksaan hanya satu permintaan pengiriman dan jawaban tetap tampil setelah halaman dimuat ulang.
- Validasi: `npm run check` lulus (87 tes, lint, TypeScript, build); enam tes browser terfokus lulus di Edge desktop dan ponsel pada port pengujian 5193.
- Mengoreksi catatan status migrasi yang bertentangan. UAT akun sekolah dan implementasi penilaian/umpan balik masih terbuka.

# Umpan balik tugas — 12 November 2026

- Rekonsiliasi PRD bagian 5.7/5.8, RBAC, API dan blueprint database: umpan balik tugas wajib; siswa/wali hanya membaca hasil terbit. Skema nilai resmi belum ditetapkan dalam PRD sehingga tahap ini tidak mengasumsikan skala angka.
- Menambahkan `TaskFeedback` pada jawaban siswa/guru dan panel baca wali. Draf memakai pemeriksaan revisi, publikasi memerlukan tinjauan draf tersimpan, kegagalan simpan meminta pemuatan ulang, hasil terbit dikunci.
- Menambahkan `task_feedback` dan `task_feedback_events`, pembatasan hak kolom, RLS, validasi guru penulis dengan penugasan aktif, pemeriksaan siswa/wali terverifikasi, serta riwayat draf yang hanya terbaca pihak berwenang.
- Migrasi diterapkan dan nama lokal diselaraskan ke `20261111233649_task_feedback`. Metadata menunjukkan RLS aktif/anon ditolak pada kedua tabel; Security Advisor kosong. Tidak mengakses data pribadi.
- Validasi: lint, TypeScript, 88 tes lokal dan build lulus. Delapan tes browser lulus pada eksekusi pertama; dua tes guru gagal karena selector mencocokkan paragraf dan textarea, diperbaiki lalu keduanya lulus. Total sepuluh skenario terfokus diverifikasi pada desktop/ponsel.
- Terbuka: UI riwayat/pengawasan, koreksi hasil terbit, asesmen numerik sesuai skema sekolah, laporan akademik dan UAT.

# Asesmen akademik — 12 November 2026

- Mengikuti keputusan eksplisit pengguna: nilai maksimum per asesmen dan publikasi manual guru sesuai penugasan, tanpa perhitungan rapor otomatis.
- Membuat halaman `/asesmen`: daftar berhalaman, pembuatan, metadata draf, daftar peserta, nilai/catatan per siswa, tinjauan publikasi, koreksi beralasan serta riwayat. Siswa/wali mendapat tampilan baca hasil terbit; admin/kepala sekolah hanya pengawasan.
- Menambahkan `assessments`, `assessment_results`, `assessment_result_events`, snapshot peserta aktif, validasi angka/tanggal, RLS dan hak kolom. Nilai kosong tidak dihitung sebagai nol. Publikasi memerlukan seluruh peserta dinilai. Perubahan nilai menaikkan revisi asesmen; koreksi dan publikasi memakai kunci baris asesmen. Setiap alasan koreksi dikonsumsi untuk satu mutasi dan tersimpan dalam audit.
- Menemukan dan memperbaiki policy SELECT yang semula tidak mengenali baris baru saat INSERT RETURNING; akses guru pada baris baru kini memakai atribut baris langsung, sementara pembacaan hasil keluarga tetap menggunakan pemeriksaan identitas/tautan terverifikasi.
- Migration diterapkan sebagai `20261111234856_academic_assessments`; nama lokal diselaraskan. Metadata RLS/izin dan Security Advisor diperiksa. Skrip pemeriksaan API diperluas untuk tabel tugas, umpan balik dan asesmen; seluruh pemeriksaan `limit=0` lulus tanpa membaca baris pengguna.
- Validasi: `npm run check` (93 tes, lint, TypeScript, build) lulus. Setelah memperkuat alasan koreksi, 60 tes database lulus ulang. Sepuluh tes browser desktop/ponsel diverifikasi melalui eksekusi awal dan pengulangan dua tes guru setelah perbaikan selector pengujian. Tes mencakup nilai nol, publikasi, koreksi, riwayat, konflik revisi, serta kontrol baca siswa/wali/kepala sekolah.
- Pekerjaan lanjutan: rekap/ekspor dan grafik akademik, hak wali kelas, perubahan peserta dan UAT. Tidak mengklaim seluruh PRD selesai.

# Rekap akademik dan skema sementara — 12 November 2026

- Menambahkan panel rekap di halaman asesmen: tanggal inklusif, kelas, mata pelajaran, publikasi untuk staf dan pilihan siswa berdasarkan ID. Ekspor CSV/Excel memakai hasil lengkap filter lintas halaman; grafik batang hanya nilai terbit untuk satu siswa dan pelajaran.
- Mempertahankan nilai nol, nilai belum diisi dan kode siswa berawalan nol. Persentase hanya skor/maksimum, tanpa perhitungan rapor atau bobot. Pengguna secara eksplisit menegaskan skema sementara menunggu aturan resmi; keputusan dan antarmuka diperbarui.
- Membatasi pemuatan 366 hari/500 baris, memeriksa exact count agar pemotongan API tidak menghasilkan laporan parsial, membatalkan permintaan lama saat filter berubah dan menghapus hasil/ekspor lama. Grafik menampilkan maksimal 30 asesmen terbit terbaru, tabel berhalaman 25.
- Migration `20261112051122_assessment_subject_identity` menambah FK subject_id dari penugasan, backfill transaksional, indeks dan trigger pengisian. Metadata hosted memastikan guard kembali aktif, RLS aktif, kolom wajib dan tidak dapat diubah klien. Security Advisor tidak melaporkan temuan.
- Menggunakan skill proyek SI STIR HEBAT dan akses data; membaca panduan rekap/berkas. Menyiapkan Node 24.22.3 dalam cache npm agar pemeriksaan sesuai runtime CI. Tidak mengubah Node sistem atau dependensi aplikasi.
- Validasi Node 24: `npm run check` lulus dengan 97 tes; 60 tes database dijalankan ulang setelah tambahan query join RLS dan lint final lulus. Dua belas tes Playwright desktop/ponsel lulus dengan API tiruan, termasuk membaca workbook yang diunduh. Mock awal perlu header CORS expose Content-Range dan skenario 403 untuk penolakan izin; setelah diperbaiki semua skenario lulus.
- Menyelaraskan README dengan fitur dan 20 migration aktual. Tidak membaca baris data pribadi, membuat akun nyata, atau melakukan deployment. PDF dan UAT tetap terbuka.

# PDF rekap akademik — 12 November 2026

- Menambahkan unduhan PDF lokal dari hasil rekap lengkap yang sudah dibatasi RLS dan filter. Semua bidang ekspor CSV/Excel dipertahankan dalam tujuh kolom gabungan, dengan periode/filter/waktu data dan penanda skema sementara. Tidak mengubah kontrak penilaian atau membuat migrasi.
- Memasang versi tetap pdfmake 0.3.14 dan @types/pdfmake 0.3.3 setelah memeriksa dokumentasi/release resmi. Audit npm saat instalasi tidak melaporkan kerentanan. Font dibundel, tanpa mengambil font atau mengirim data ke layanan PDF eksternal.
- Memisahkan mesin/font PDF di Vite agar dependensi besar tidak masuk vendor utama. Pemeriksaan statis build memastikan chunk non-PDF tidak mengimpor mesin/font PDF secara statis. Dua chunk PDF masih melewati ambang peringatan ukuran Vite; vendor utama sekitar 347 KB, keduanya hanya diperlukan saat ekspor.
- Memakai skill PDF untuk pemeriksaan artefak: fixture 80 baris dari `scripts/qa-academic-pdf.mjs`, ekstraksi pypdf/pdfplumber dan render Poppler. Menemukan header maksimum terbungkus dan baris terbelah, lalu memperbaiki label dan dontBreakRows. Semua 11 halaman final diperiksa, 80 baris serta margin dan header/footer tervalidasi.
- `npm run check` Node 24: 99 tes, lint, tipe dan build lulus. Dua belas tes browser rekap lulus; dua tes unduhan diulang setelah perbaikan tata letak dan lulus. PDF hasil browser diperiksa hanya memuat tiga hasil sesuai filter fixture, termasuk nol, kode berawalan nol dan belum dinilai. Hasil QA berada di test-results yang diabaikan Git.
- UAT akun sekolah, skema resmi, kewenangan wali kelas, perubahan peserta dan modul PRD lain tetap terbuka.


## Jadwal pelajaran — 13 November 2026

Fondasi `/jadwal` tersedia: admin membuat/mengubah/menonaktifkan jadwal mingguan dengan rentang tanggal dalam tahun ajaran, penugasan tetap, alasan wajib, audit database, dan revisi optimistis. Server menolak bentrok guru atau kelas, memeriksa kejadian hari dalam irisan periode, serta mengunci transaksi penulisan jadwal. Guru membaca sesuai penugasan aktif; siswa dan wali sesuai kelas dan hubungan terverifikasi. Kepala sekolah membaca; pending dan anonim ditolak. Daftar dipaginasi 25 item; admin/kepala sekolah dapat melihat jadwal nonaktif melalui mode pengelolaan.

Migration `20261113000504_lesson_schedules` diterapkan dan riwayat dicocokkan. Pemeriksaan metadata memastikan RLS aktif pada dua tabel dan INSERT langsung klien ditolak. Tidak membaca data pribadi. Node 24 `npm run check` lulus: 100 tes, lint, tipe, build. Empat tes browser khusus jadwal desktop/ponsel lulus dengan API tiruan (ditambah dua regresi supervisi yang ikut filter). Belum UAT sekolah; uji konkurensi beberapa koneksi belum dilakukan. Peringatan ukuran chunk PDF lama tetap ada.

Pekerjaan berikutnya: usulan perubahan jadwal oleh guru sesuai PRD, tampilan riwayat pengaturan, dan UAT. Skema nilai tetap sementara; tidak menghitung rapor otomatis.





Hasil final rilis 13 November: pengulangan mobile lulus 82/82. Total cakupan akhir browser 164 skenario lulus (82 desktop + 82 mobile pada run terpisah setelah server tes awal berhenti). URL repo GitHub masih menunggu pengguna.

## Audit kesesuaian workspace — 14 November 2026

Pemeriksaan langsung pada root aplikasi: npm run check lulus (lint, TypeScript, 101 tes, build). Build memberi peringatan chunk mesin PDF 790,69 KB dan font 855,16 KB. Browser dan UAT akun sekolah tidak diulang pada audit ini.

Fitur yang terkonfirmasi dalam kode mencakup asesmen, laporan akademik dan usulan jadwal. Pernyataan historis bahwa usulan jadwal masih pekerjaan berikutnya sudah tertinggal. Folder docs/references serta berkas PRD/RBAC tidak ditemukan dalam workspace starter, sehingga kesesuaian penuh terhadap dokumen asli belum dapat diverifikasi.

Git yang ditemukan masih repository induk D:/code, tanpa commit, dengan proyek my-app dan berkas induk lain ikut tercakup. Root aplikasi tetap D:/code/SI_STIR_HEBAT_Starter/si-stir-hebat sesuai AGENTS.md. Penataan repository perlu diselesaikan sebelum publikasi. Tabel contoh todos tercatat terpisah dan tidak memiliki alur UI sekolah.

Tanggal sekolah masih memakai Asia/Jakarta pada frontend dan migration. Konfirmasi zona waktu operasional sekolah diperlukan sebelum mengubah aturan tanggal/tenggat bersama-sama. Skema asesmen tetap sementara sesuai keputusan pengguna. Modul dokumen, kehadiran guru, fitur perkembangan siswa dan UAT masih perlu dituntaskan berdasarkan acuan resmi.
14 November 2026: Repo https://github.com/mariomagfii-sys/si-stir-hebat berhasil di-clone ke D:/code/SI_STIR_HEBAT_Starter/github-release. Paket rilis 108 berkas diunggah ke main, commit 86fe0e79224d4d607afdd30cfeb633a24b8a5fa9; git ls-remote cocok dengan HEAD lokal. Tidak menyertakan .env.local, .env, .vercel atau lampiran pribadi. CI GitHub belum diverifikasi (konektor memberi 404; Git CLI berhasil). Deployment Vercel dan aktivasi admin tetap belum selesai.
14 November 2026: Login Vercel berhasil melalui device authorization; proyek si-stir-hebat dibuat dan deployment CLI produksi READY (dpl_DHXi8ktz5chWQQji1wTJQdrLMjEk). URL publik https://si-stir-hebat-blue.vercel.app. Empat route HTTP 200; browser headless mobile memverifikasi login nyata (bukan demo), redirect /jadwal tanpa sesi, tidak meluber dan tidak ada pageerror. Hanya akses anonim, tidak membaca data pribadi. Node24 diselaraskan package/lock (push b07638d). Panduan produksi/aktivasi diunggah commit36f8c53. GitHub auto-deploy belum terhubung karena Vercel meminta GitHub Login Connection. Site URL/redirect Auth, aktivasi admin, login/email nyata dan UAT tetap belum terverifikasi. Tujuan PRD penuh belum selesai.

## Ringkasan sekolah dashboard � 14 November 2026

PRD 5.1 ditindaklanjuti: admin/kepala sekolah melihat jumlah siswa, guru dan kelas berstatus aktif. Query HEAD dengan exact count, bukan mengunduh baris atau menghitung halaman; RLS tabel tetap berlaku. Label menjelaskan kelas mencakup seluruh tahun ajaran dan siswa berasal dari registri, bukan enrollment. Nol, belum dimuat dan gagal dibedakan. Partial failure mempertahankan jumlah yang berhasil; retry tersedia. Tidak ada query ringkasan pada guru/siswa/wali/pending. Tautan menuju data master terkait tersedia.

npm run check Node24 lulus 101 tes, lint, tipe dan build. Sepuluh tes browser khusus ringkasan desktop/ponsel lulus, meliputi jumlah1205, nol, missing count, retry dan pembatasan permintaan peran. Tidak ada perubahan database atau pembacaan data pribadi. Commit eb1d4f8 sudah dipush; deployment produksi baru sedang diverifikasi. Dashboard PRD masih perlu progres supervisi, administrasi, aktivitas/notifikasi dan ringkasan spesifik guru/keluarga; jangan menganggap bagian5.1 selesai penuh.
Deployment ringkasan dashboard terverifikasi READY; smoke produksi anonim lulus ulang. Tidak menguji akun admin nyata.


## Optimasi font PDF - 14 November 2026

Build hanya menyertakan Roboto normal dan tebal untuk rekap akademik, tetap dimuat saat ekspor. Chunk font 855,16 ke 419,57 KB (gzip 465,45 ke 225,08 KB); mesin PDF masih 790,69 KB. Node 24 `npm run check` lulus (104 tes, lint, typecheck, build); tes unduhan desktop dan ponsel lulus dengan API tiruan. Varian italic perlu ditambahkan jika kelak digunakan. UAT sekolah belum dilakukan.


## Fondasi komunikasi lokal - 14 November 2026

Migration 20261114083827 dan API pesan/penerima dibuat dengan RLS, penugasan dan relasi aktif, serta pesan append-only. Tes PGlite mencakup peran dan pencabutan; npm run check Node 24 lulus 108 tes, lint, tipe, build. Migration belum diterapkan: riwayat hosted belum mencatat student_habits yang lebih awal. UI, advisor dan UAT belum dilakukan.

## Stabilisasi suite browser dan checklist UAT - 14 November 2026 (Kilo/QA)

- Selector alert dipersempit ke `getByRole('alert').filter({ hasText })` di seluruh suite agar tidak ambigu ketika beberapa `alert` tampil bersamaan.
- Uji impor XLSX desktop memakai `setInputFiles` langsung (bukan dialog file natif) dan batas 15 detik untuk preview yang diproses di worker.
- `vite.config.ts` menonaktifkan watcher HMR hanya ketika `VITE_TEST_NO_WATCH=1` (disetel oleh `playwright.config.ts`); ini menghentikan crash `EBUSY` yang sebelumnya mematikan server tes dan memicu `ERR_CONNECTION_REFUSED` massal.
- Ditambahkan 7 skenario penolakan lintas peran: `/tautan-akun` untuk guru/siswa/wali/pending dan `/supervisi` untuk siswa/wali/pending; dipastikan pesan penolakan tampil dan tidak ada tombol aksi.
- `docs/UAT_CHECKLIST.md` dibuat sebagai daftar periksa siap isi per peran (langkah, hasil diharapkan, L/G, catatan), melengkapi `PANDUAN_UAT.md`.
- Verifikasi: tiga run browser penuh berturut-turut 194/194 lulus (desktop + ponsel) dengan API tiruan; `npm run check` Node 24 lulus 109 tes, lint, typecheck, build (peringatan chunk PDF tetap).
- Batas: belum diuji dengan akun sekolah nyata, email pemulihan, maupun UI komunikasi (belum ada). Tidak ada perubahan migration atau data hosted.

## Cakupan modul materi/tugas - 14 November 2026 (Kilo/QA)

- Menambah dua skenario browser: siswa membaca materi terbit tanpa kontrol penulisan, dan guru membuat draf tugas dengan penugasan, judul, instruksi, serta tenggat.
- Memastikan muatan POST memuat `kind: task`, `assignment_id`, `due_on`, dan pesan "Draf tugas tersimpan." setelah respons terkonfirmasi.
- Verifikasi: `npm run lint` bersih; suite penuh 198/198 lulus pada desktop dan ponsel (API tiruan). Belum diuji dengan akun sekolah nyata.

## Cakupan modul ajar - 14 November 2026 (Kilo/QA)

- Menambah skenario guru menyimpan draf modul ajar: pemilihan penugasan aktif, judul, tujuan, dan kegiatan; memastikan muatan POST serta pesan "Modul ajar tersimpan." dan modul tampil di daftar.
- Verifikasi: `npm run lint` bersih; suite penuh 200/200 lulus pada desktop dan ponsel (API tiruan). Belum diuji dengan akun sekolah nyata.

## Pengajuan modul ajar dan matriks cakupan - 14 November 2026 (Kilo/QA)

- Menambah skenario guru mengajukan draf modul: PATCH `status: submitted` dengan revisi, pesan "Status modul diperbarui." dan status daftar menjadi "Diajukan".
- Menambah `docs/QA_COVERAGE.md`: matriks modul terhadap skenario yang sudah ada dan yang belum tercakup.
- Verifikasi: skenario baru lulus terarah di desktop (1/1). Suite penuh **belum** diverifikasi ulang: run terakhir (log `test-results-kilo-8.log`) baru mencapai 36/202 saat sesi dijeda. `npm run lint` bersih. UAT akun sekolah tetap terbuka.
