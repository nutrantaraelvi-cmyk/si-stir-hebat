
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
# Status SI STIR HEBAT

Pembaruan terakhir: 12 November 2026. Workspace: `D:/code/SI_STIR_HEBAT_Starter/si-stir-hebat`. Bagian audit fondasi merekam pemeriksaan awal 10 November; ringkasan berikut merupakan perkembangan terbaru.

## Rekap dan perkembangan akademik — 12 November 2026

Ekspor PDF kini tersedia dari hasil lengkap filter yang sama dengan CSV/Excel. PDF A4 lanskap memuat periode, filter, waktu pemuatan, status, kode/nama siswa, nilai, maksimum, persentase dan penanda skema sementara. Kepala tabel berulang, nomor halaman dan baris utuh mencegah pemotongan informasi saat laporan panjang. Generator/font dibundel lokal dan dimuat ketika ekspor dipakai. Tidak ada perubahan database atau pengiriman baris rekap ke layanan pembuat PDF.

Validasi PDF: `npm run check` Node 24 lulus dengan 99 tes. Dua belas tes browser rekap lulus; setelah perbaikan tata letak, dua tes unduhan desktop/ponsel lulus ulang. Isi PDF unduhan diperiksa dengan pypdf untuk memastikan hanya tiga hasil sesuai filter pada fixture. PDF sintetis 80 baris dirender memakai Poppler; seluruh 11 halaman diperiksa secara visual dan semua baris, karakter beraksen, nilai nol, status belum dinilai, header/footer serta margin horizontal diverifikasi. Ini bukan UAT data sekolah. Vite masih memberi peringatan ukuran untuk dua chunk PDF yang dimuat terpisah (sekitar 791 KB mesin dan 855 KB font sebelum gzip); vendor utama tetap sekitar 347 KB.

Panel rekap pada `/asesmen` memfilter tanggal inklusif, kelas, mata pelajaran, status publikasi untuk staf, dan siswa. Ekspor CSV/Excel mencakup semua halaman hasil filter yang lengkap, bukan hanya halaman tabel yang tampil. Nol tetap angka nol; nilai kosong tidak dinormalisasi menjadi nol; kode siswa tetap teks dan CSV menetralkan formula. Grafik batang menunjukkan persentase terhadap maksimum masing-masing asesmen untuk satu siswa/satu mata pelajaran, hanya hasil terbit dan maksimal 30 titik terbaru. Tidak menghitung rata-rata berbobot atau nilai rapor.

Pengguna menegaskan skema ini sementara sampai skema resmi diberikan; dicatat di DECISIONS.md dan antarmuka. Permintaan dibatasi maksimal 366 hari dan 500 hasil/500 header asesmen. Exact count dibandingkan dengan baris diterima; hasil terpotong, melebihi batas, atau gagal tidak ditampilkan/diekspor. Persempit tanggal/kelas/pelajaran jika batas tercapai. Pilihan siswa menggunakan ID dan snapshot nama terakhir; identitas mata pelajaran kini tersimpan agar pergantian nama tidak mencampur seri.

Migration `20261112051122_assessment_subject_identity` diterapkan. Backfill mengambil subject_id dari penugasan; metadata terverifikasi: kolom wajib, klien tidak dapat mengubahnya, RLS aktif, seluruh trigger aktif dan Security Advisor kosong. Tidak membaca baris data pribadi. `npm run check` pada Node 24.22.3 lulus (97 tes, lint, TypeScript, build). Setelah penambahan pengujian cakupan query rekap, 60 tes database lulus ulang; lint final lulus. Dua belas tes browser rekap desktop/ponsel lulus, termasuk pembacaan isi CSV/Excel hasil unduhan, data terpotong, batas jumlah, izin ditolak, akses wali dan URL langsung akun pending. Tes browser memakai API tiruan; UAT sekolah masih terbuka.

Pekerjaan terbuka akademik: aturan resmi penilaian, kewenangan khusus wali kelas, pengelolaan perubahan peserta dan UAT. PDF modul lain dan kebutuhan PRD lainnya juga belum seluruhnya selesai.

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

## Impor Excel ? tersedia

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

## Verifikasi ulang - 11 November 2026

Build yang sempat gagal akibat tipe sesi demo dan akses klien Supabase sudah diperbaiki. Lint, TypeScript, build, 81 tes unit/database, dan 86 tes browser desktop/ponsel dengan API tiruan lulus. Supabase kini memiliki sembilan migration, 16 tabel publik dengan RLS, dan 40 policy. Trigger jurnal serta kedua policy aktif. Data API menolak akses anonim ke seluruh 16 tabel dan Security Advisor tidak melaporkan temuan. Pengujian dengan akun sekolah masih tertunda.

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

## Jadwal pelajaran — 13 November 2026

Fondasi `/jadwal` tersedia: admin membuat/mengubah/menonaktifkan jadwal mingguan dengan rentang tanggal dalam tahun ajaran, penugasan tetap, alasan wajib, audit database, dan revisi optimistis. Server menolak bentrok guru atau kelas, memeriksa kejadian hari dalam irisan periode, serta mengunci transaksi penulisan jadwal. Guru membaca sesuai penugasan aktif; siswa dan wali sesuai kelas dan hubungan terverifikasi. Kepala sekolah membaca; pending dan anonim ditolak. Daftar dipaginasi 25 item; admin/kepala sekolah dapat melihat jadwal nonaktif melalui mode pengelolaan.

Migration `20261113000504_lesson_schedules` diterapkan dan riwayat dicocokkan. Pemeriksaan metadata memastikan RLS aktif pada dua tabel dan INSERT langsung klien ditolak. Tidak membaca data pribadi. Node 24 `npm run check` lulus: 100 tes, lint, tipe, build. Empat tes browser khusus jadwal desktop/ponsel lulus dengan API tiruan (ditambah dua regresi supervisi yang ikut filter). Belum UAT sekolah; uji konkurensi beberapa koneksi belum dilakukan. Peringatan ukuran chunk PDF lama tetap ada.

Pekerjaan berikutnya: usulan perubahan jadwal oleh guru sesuai PRD, tampilan riwayat pengaturan, dan UAT. Skema nilai tetap sementara; tidak menghitung rapor otomatis.





Hasil final rilis 13 November: pengulangan mobile lulus 82/82. Total cakupan akhir browser 164 skenario lulus (82 desktop + 82 mobile pada run terpisah setelah server tes awal berhenti). URL repo GitHub masih menunggu pengguna.
## Batas proyek dan tabel contoh Supabase — 13 November 2026

Folder `SI_STIR_HEBAT_Starter/si-stir-hebat` adalah satu-satunya root aplikasi utama untuk Codex: React/Vite, bukan Next.js. Demo Next.js terpisah `D:\code\my-app` bukan bagian dari aplikasi dan tidak boleh menjadi lokasi kerja lanjutan.

Migration remote `20261113074045_create_private_todos` dibuat atas permintaan pengguna untuk contoh data privat. File migration disimpan di `supabase/migrations`, RLS membatasi setiap baris kepada pemiliknya, dan `scripts/check-supabase.mjs` memeriksa penolakan akses anonim. Tabel ini kosong dan tidak digunakan oleh UI SI STIR HEBAT. Tidak ada migration yang diterapkan ulang.

## Persiapan rilis operasional — 13 November 2026

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

## Tes Storage supervisi - 14 November 2026

Tes PGlite diperluas untuk akses objek bukti oleh kepala sekolah, guru terkait sebelum dan sesudah publikasi, guru lain, administrator, siswa, wali, pending, dan anonim. Tes juga memeriksa tahap awal, nama/path rusak, bucket lain, penghapusan, dan penonaktifan guru. `npm run check` Node 24 lulus: lint, typecheck, 109 tes dan build. Fixture memakai tiruan `storage.objects`; akses Storage hosted dan UAT akun sekolah belum diverifikasi oleh tes ini. Tidak ada perubahan migration atau database hosted.
