## Rerun lokal dan prasyarat - 20 November 2026, 16:45 WIB

- Node v24.22.3: lint/typecheck dan 140/140 tes lulus; `npm run check` exit 1 saat build Vite gagal membersihkan `dist/assets` yang terkunci (`EPERM`). Log: `docs/logs/check-2026-11-20-current-node24.log`. Build sementara 1.788 modul + audit 29 JS tanpa demo lulus; output sementara dibersihkan, dist belum diganti.
- `npm ci` gagal karena Windows mengunci binary esbuild/Rollup (`EPERM`). Pemulihan non-clean `npm install --ignore-scripts --prefer-offline --no-audit --no-fund` exit 0; package-lock tidak berubah.
- Hosted belum ditulis; Advisor WARN, `check:supabase`, Supabase lokal, dan backup/restore masih belum lolos/terverifikasi.

## Revalidasi hosted dan lokal - 21 November 2026, 08:52 WIB

- Read-only Supabase MCP: tetap 23 migration sampai `20261113074045`; Security Advisor tetap satu WARN `auth_leaked_password_protection`. Tidak ada hosted migration diterapkan.
- `npm run check` Node v24.22.3 EXIT 0: 140/140, 38 migration, build terisolasi 1.789 modul, audit 30 JavaScript bersih; log `docs/logs/check-2026-11-21-node24.log`.
- `check:supabase` tidak mencapai Auth: konfigurasi lokal valid/cocok dengan project, tetapi DNS gagal `ENOTFOUND`. Tidak membaca baris data atau mencetak konfigurasi.
- Browser 420 case tidak punya summary/exit 0 karena cleanup macet; jangan hitung sebagai suite hijau. Snapshot skema 20 November tetap inventaris metadata, bukan backup/restore.

## Snapshot hosted read-only - 20 November 2026, 16:46 WIB

- Supabase MCP kembali mengonfirmasi 23 migration sampai `20261113074045` dan satu Security Advisor WARN `auth_leaked_password_protection`.
- `list_tables` verbose membaca metadata schema `public` saja. Snapshot nama tabel, kolom, primary key, dan status RLS ada di [HOSTED_SCHEMA_SNAPSHOT_2026-11-20.md](HOSTED_SCHEMA_SNAPSHOT_2026-11-20.md). Tidak ada baris data yang dipilih atau dicatat.
- Inventaris ini bukan SQL dump atau backup dan belum membuktikan restore. Tidak ada hosted DDL/DML.

## Addendum hosted read-only (20 November 2026, 16:32 WIB)

Pemeriksaan hosted baca-saja terbaru mengonfirmasi 23 migration hingga `20261113074045`; Security Advisor tetap WARN `auth_leaked_password_protection`. Tidak ada migration hosted diterapkan. Check lokal terbaru 140/140 dan suite browser 402/402 (trace off) tercatat di `docs/PROJECT_STATUS.md` dan `docs/IMPLEMENTATION_LOG.md`. Penerapan masih tertahan sampai Advisor bersih, `npm run check:supabase`, Supabase lokal, serta bukti backup/restore tersedia.

# Paket review migration lokal

Status: REVIEW paket lokal; **tidak diterapkan ke hosted**.

## Terverifikasi pada sesi 20 November 2026

- Baseline awal `git status --short --branch`: branch `ai/qoder-docs-sync`, dengan banyak file staged/unstaged (diff awal tercatat 871 insertions/373 deletions unstaged dan 362 insertions/30 deletions staged). Perubahan sesi ini dibatasi ke penambahan tes di `tests/database.test.mjs` dan pembaruan dokumen ini; file lain dipertahankan.
- Menambahkan tes PGlite `habit_students returns only the caller’s authorized student names` di `tests/database.test.mjs`. Tes memeriksa bentuk `id,name`; siswa hanya melihat dirinya; guru berpenugasan hanya melihat murid dari kelas tugasnya; guru tanpa registrasi/penugasan mendapat hasil kosong; wali tertaut hanya melihat anaknya; kepala sekolah dan administrator mengikuti cakupan baca institusional; pending mendapat hasil kosong; anonim ditolak.
- Tes PGlite database lulus 69/69 pada Node v24.22.3, termasuk `habit_students()` dan `school document storage follows owner and review access`.
- Setelah pemilik menyetujui penggantian output build, `npm.cmd run check` lulus exit 0: migration/CI checks, lint, typecheck, 125/125 tes, build 1.781 modul, dan audit bundel 26 JS tanpa akun demo. Log penuh: `%TEMP%\\si-stir-hebat-check-2026-11-20.log`. Peringatan chunk PDF 790,69 kB tetap ada.
- Pemeriksaan status akses hosted: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `DATABASE_URL`, `VITE_SUPABASE_URL`, dan `VITE_SUPABASE_PUBLISHABLE_KEY` tidak tersedia di environment. Tidak mencari file kredensial.
- Node 24.22.3 tersedia dari binary yang sudah berada di cache npm; tidak mengubah instalasi global atau kebijakan eksekusi. `npm.cmd --version` = `11.20.0`.
- Tidak menjalankan perintah tulis hosted, migration push, link, reset, maupun SQL ke hosted.
- Revalidasi setelah persetujuan pemilik: `npm.cmd run check` menyelesaikan pemeriksaan lengkap termasuk build; output `dist/assets` yang ada diganti sesuai persetujuan. Build menghasilkan 26 aset JavaScript yang lolos pemeriksaan bundel demo.

## Belum diverifikasi / terblokir

- `npm run check:supabase` tidak dijalankan karena file `.env.local` dan konfigurasi hosted tidak tersedia pada environment proses. File kredensial tidak dicari atau dibaca, sesuai batasan.
- Security Advisor hosted belum diperiksa.
- Riwayat hosted belum dapat direkonsiliasi. Perintah baca-saja yang perlu dijalankan pemilik dicantumkan di bawah.
- Security Advisor hosted baseline, bukti backup/pemulihan, metadata hosted RLS/grant, dan policy bucket hosted belum diperiksa.

## Cakupan dan urutan

Workspace memuat 29 file migration dengan timestamp naik (diverifikasi `node scripts/check-migrations.mjs`, exit 0). Catatan hosted yang tersedia di repo terakhir menyebut 23 migration; belum ada verifikasi hosted pada sesi ini. Enam migration terbaru berikutnya yang tampak belum tercatat adalah:

1. `20261114000139_student_habits.sql`
2. `20261114083827_komunikasi.sql`
3. `20261118000100_student_habits_validation.sql`
4. `20261118000200_guardian_absence_reports.sql`
5. `20261118000300_notifications.sql`
6. `20261118000400_school_documents.sql`

Urutan penerapan harus diperiksa terhadap `supabase_migrations.schema_migrations` hosted persis sebelum tindakan apa pun. Jangan menerapkan hanya sebagian atau melompati timestamp yang belum ada. Pemilik telah memberi izin umum terdahulu untuk migration lokal setelah backup/prasyarat dan konfirmasi akhir; konfirmasi akhir untuk migration tertentu belum diberikan dalam sesi ini.

## Ringkasan isi dan bukti lokal

- `student_habits`: catatan tujuh nilai boolean per siswa/tanggal, audit event, RLS, pembacaan sesuai akses siswa. Fungsi `habit_students()` SECURITY DEFINER hanya memberi `id,name` pada siswa yang lolos `can_read_habits`; perlu dicatat bahwa siklus, frekuensi, dan visibilitas fitur masih skema sementara.
- `komunikasi`: pesan append-only guru–wali dengan hubungan aktif, penugasan dan keanggotaan; RPC penerima memaginasi hasil. API bertipe tersedia.
- `student_habits_validation`: status validasi guru atas catatan kebiasaan dan event terkait.
- `guardian_absence_reports`: laporan wali terverifikasi dengan `request_id`, alasan, revisi dan tinjauan guru; laporan tidak otomatis membuat catatan absensi.
- `notifications`: penerima privat, kategori/prioritas, status baca dan RPC tandai dibaca.
- `school_documents`: metadata dan lifecycle dokumen dengan RLS/grant kolom; policy Storage memerlukan bukti hosted tersendiri.

Pemeriksaan statis menemukan keenam file tersebut berawal `begin;` dan berakhir `commit;`. `scripts/check-migrations.mjs` memeriksa nama/timestamp naik dan urutan `student_habits` sebelum `komunikasi`. `scripts/check-supabase.mjs` saat ini menyertakan `habit_records`, `habit_events`, `communication_messages`, `guardian_absence_reports`, `notifications`, dan `school_documents` untuk pemeriksaan penolakan anonim tanpa membaca baris.

Tes PGlite lintas peran mencakup kebiasaan, laporan absen, notifikasi, dan Storage. Tes `supervision-evidence` mencakup kepala sekolah, guru pemilik sebelum/sesudah publikasi, guru lain, siswa, wali, pending dan path cacat. Tes sesi ini menambah cakupan `habit_students()` serta bucket `school-documents`, termasuk role dan folder cacat serta konfigurasi privasi, ukuran dan MIME. Seluruh 69 tes database lulus pada Node v24.22.3; hasil PGlite tidak membuktikan policy hosted.

## Temuan dan keputusan pemilik

- K1/todos — keputusan pemilik D1 (sementara): UI tidak menggunakan tabel ini; migration baru `20261120035616_drop_empty_private_todos` memeriksa tabel kosong dan membatalkan transaksi bila ada baris sebelum `REVOKE ALL` + `DROP TABLE`. Read-only hosted menghasilkan count 0. Migration lokal dan guard diuji PGlite; migration belum diterapkan hosted.
- K2/habit_students — tes role-scope di `tests/database.test.mjs` lulus dalam tes database 69/69 dan suite penuh 125/125. Definisi `SECURITY DEFINER`, `search_path=''`, dan filter `can_read_habits` ada di `supabase/migrations/20261114000139_student_habits.sql:13`; cakupan role di helper diperketat migration validasi `20261118000100_student_habits_validation.sql`. Kepala sekolah/admin punya cakupan institusional di helper tersebut; guru dibatasi penugasan jurnal. Tetap tandai aturan siklus/frekuensi/visibilitas kebiasaan sebagai sementara. Migration tidak diterapkan.
- K3/draf umpan balik — keputusan pemilik D2 (sementara): draf dan event draf hanya dapat dibaca penulis; admin/kepala sekolah hanya membaca yang sudah diterbitkan. Migration lokal baru `20261120035618_feedback_author_only_drafts` mengganti policy dan dites PGlite; belum diterapkan hosted.
- K4/storage — tes PGlite yang meniru `storage.objects` mencakup bucket `supervision-evidence` (kepala sekolah, guru pemilik sebelum/sesudah publikasi, guru lain, siswa, wali, pending, path cacat) dan bucket `school-documents` (pemilik, kepala sekolah, administrator, guru lain, siswa, wali, pending, anon, folder cacat, privasi bucket, batas ukuran dan MIME). Ini bukti simulasi saja, bukan bukti policy aktual di hosted.

## Perintah dan hasil verifikasi sesi

- `node --version` (binary Node dari cache npm) → exit 0, `v24.22.3`.
- `npm.cmd --version` → exit 0, `11.20.0`.
- `node scripts/check-migrations.mjs` → exit 0: `Migration OK: 29 berkas, timestamp unik dan naik.` Node v24.22.3.
- `node --test tests/database.test.mjs` → exit 0: 69/69 lulus, 0 gagal. Node v24.22.3.
- Tiga iterasi awal tes `habit_students()` gagal karena ekspektasi tes belum sesuai aturan migration validasi (siswa hanya boleh membaca dirinya) dan urutan keluaran alfabetis. Setelah memeriksa migration 26, tes diselaraskan dan lulus; tidak ada migration diubah.
- Percobaan pertama `npm.cmd run check` exit 1 pada typecheck dengan `TS5033 EPERM` menulis cache `*.tsbuildinfo`. Percobaan ulang mengarahkan cache TypeScript ke `%TEMP%` lewat perubahan sementara pada dua tsconfig yang kemudian dipulihkan; typecheck dan seluruh tes lulus.
- `npm.cmd run check` setelah persetujuan pemilik untuk mengganti output build → exit 0; migration check, CI check, lint, typecheck, 125/125 tes, build 1.781 modul, dan pemeriksaan bundel produksi 26 berkas lulus. Log: `%TEMP%\\si-stir-hebat-check-2026-11-20.log`.
- `vite build --outDir "$env:TEMP\\si-stir-hebat-build-20261120" --emptyOutDir` → exit 0 ke output sementara; peringatan chunk PDF 790,69 kB tetap muncul.
- Skrip proyek `scripts/check-demo-bundle.mjs` berjalan sebagai bagian dari `npm.cmd run check` dan mengonfirmasi 26 berkas JavaScript tanpa akun demo.
- `git diff --check -- tests/database.test.mjs` → exit 0.
- `npm run check:supabase` dan Security Advisor tidak dijalankan karena konfigurasi/kredensial tidak tersedia di environment; tidak ada hosted check.
- Tidak membaca baris data sekolah dan tidak mengubah hosted.

## Rencana verifikasi setelah persetujuan penerapan

1. **Runtime dan tes lokal:** aktifkan Node 24.x pada proses/sesi saja; jalankan `node --version`, `npm.cmd --version`, `node scripts/check-migrations.mjs`, `node --test tests/database.test.mjs`, dan `npm.cmd run check` dari root. Simpan exit code, jumlah tes serta output yang tidak memuat secret.
2. **Hosted read-only:** pemilik menjalankan `supabase migration list --linked` dari workspace yang telah terhubung benar (jangan menjalankan `link`) atau query `SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;` dengan kredensial read-only. Kirim kembali daftar version saja; bandingkan terhadap 29 timestamp lokal dan pastikan tidak ada selisih/urutan berbeda pada enam migration di atas.
3. **Backup:** operator/pemilik mencatat waktu, metode backup, lokasi aman, identitas project, dan hasil pemulihan teruji ke lingkungan terisolasi. Jangan menaruh kredensial atau dump berisi data anak dalam repo/log.
4. **Security baseline:** sebelum perubahan, ekspor metadata hasil Security Advisor dan metadata `pg_class.relrowsecurity`, `pg_policies`, grants tabel/kolom, fungsi/trigger untuk enam migration terkait; tanpa membaca baris aplikasi. Simpan timestamp dan project ref yang tidak rahasia.
5. **Catatan historis (digantikan keputusan pemilik D1/D2):** izin umum menerapkan migration baru berlaku setelah seluruh gate teknis dipenuhi. Jangan melakukan write hosted jika Advisor, rekonsiliasi, backup/restore, atau pemeriksaan lokal belum bersih.
6. **Rencana penerapan setelah persetujuan:** terapkan timestamp yang telah disepakati satu per satu dalam urutan lokal: habits → komunikasi → habits validation → guardian absence reports → notifications → school documents; berhenti jika timestamp hosted berbeda atau satu migration gagal. Jangan reset.
7. **Rollback per migration:** migration memakai DDL/transaksi, tetapi efek rollback setelah commit perlu migration kompensasi dan persetujuan baru. Jika harus membatalkan seluruh batch, urutan balik dan dampak awalnya:

   | Migration | Rencana kompensasi untuk ditinjau sebelum penerapan | Risiko utama |
   | --- | --- | --- |
   | `20261118000400_school_documents` | Hapus policy `storage.objects` yang ditambah migration; pertahankan bucket dan file sampai operator memindahkan/menghapus objek dengan prosedur terpisah; kemudian drop tabel, trigger, helper, dan indeks hanya jika tidak ada konsumen. | Drop tabel menghapus metadata; menghapus bucket/objek dapat menghilangkan berkas permanen. |
   | `20261118000300_notifications` | Drop trigger/notifikasi yang ditambah, RPC, tabel, indeks, dan helper baru setelah memastikan tidak ada referensi modul lain. | Menghapus baris notifikasi serta riwayat baca. |
   | `20261118000200_guardian_absence_reports` | Drop trigger, RPC/helper, tabel, dan indeks yang dibuat migration setelah memastikan tidak ada dependensi baru. | Menghapus laporan wali dan riwayat tinjau append-only. |
   | `20261118000100_student_habits_validation` | Pulihkan policy lama dari migration 24, lalu drop fungsi validasi dan kolom validasi/event yang ditambah; periksa data sebelum menghapus kolom. | Kehilangan status dan catatan validasi yang telah dibuat setelah penerapan. |
   | `20261114083827_komunikasi` | Drop wrapper/RPC, helper, policy, grant, tabel, serta indeks yang didefinisikan migration. | Menghapus semua pesan guru–wali yang tersimpan. |
   | `20261114000139_student_habits` | Hanya setelah validation dibalik: drop trigger, policy/grant, helper, tabel dan indeks yang dibuat migration. | Menghapus semua catatan kebiasaan dan event/audit. |

   DDL transaksional hanya memberi rollback atomik saat migration itu sendiri gagal sebelum commit; setelah commit, jangan mengandalkan `ROLLBACK` biasa atau menjalankan `DROP` otomatis. Perubahan kompensasi perlu ditulis/ditinjau sebagai migration baru, mempertimbangkan data dan dependensi aktual, serta didahului backup yang pemulihannya sudah diuji.
8. **Verifikasi pasca tiap migration:** cocokkan version pada `schema_migrations`; periksa metadata RLS, policies, grant kolom, fungsi dan trigger yang relevan; jalankan `npm run check:supabase` dan Security Advisor setelah semua target diterapkan. Untuk storage, uji akun sintetis pada bucket privat di environment terisolasi dan periksa policy `storage.objects`; PGlite bukan bukti hosted.

Format hasil rekonsiliasi yang diminta dari pemilik: `hosted_versions=[timestamp saja, satu per baris]`, `local_count=29`, `project_ref=<non-secret ref>`, `backup_time=<zona waktu>`, `restore_test=<hasil ringkas>`, `advisor_baseline=<jumlah/kategori temuan>`.

## Keputusan yang masih diminta dari pemilik (catatan historis; D1/D2 kemudian diputuskan)

1. K1: pertahankan tabel `todos` contoh privat, atau hapus dengan migration baru revoke + drop? Rekomendasi: pertahankan sampai tiada konsumen eksternal dikonfirmasi.
2. K3: pilih opsi (a) draf hanya terbaca penulis, atau (b) administrator/kepala sekolah juga dapat membaca draf tanpa hak edit/publikasi? Rekomendasi: (a), tertutup sampai final.
3. Verifikasi lokal lengkap lulus. Paket belum siap meminta konfirmasi penerapan hosted sampai riwayat migration, backup/pemulihan, metadata RLS/grant, dan Security Advisor baseline direkonsiliasi. Tes Storage lokal sudah mencakup bucket sekolah, tetapi belum membuktikan policy hosted. Persetujuan akhir untuk timestamp migration yang tepat tetap diperlukan sebelum penerapan.

## Pembaruan hasil audit — 20 November 2026 (Codex)

Koreksi catatan preflight di atas berdasarkan pemeriksaan read-only langsung pada proyek `ysworvoaqqwppwcrnmqk`:

- Riwayat hosted berisi 23 versi tepat sampai `20261113074045`; seluruhnya sama dengan 23 file lokal awal. `todos` hosted masih ada dan `SELECT count(*)::bigint FROM public.todos` menghasilkan **0**. Tidak ada write hosted.
- Security Advisor sebelum perubahan migration menghasilkan **1 WARN**: `auth_leaked_password_protection` / Leaked Password Protection Disabled. Karena syarat keras pemilik meminta Advisor bersih setelah penerapan, tidak ada migration hosted yang diterapkan. Pemilik perlu menyelesaikan setelan Auth dan meminta recheck Advisor.
- Snapshot lokal pada saat catatan historis ini dibuat berisi **39 migration**
  1. `20261114000139_student_habits`
  2. `20261114083827_komunikasi`
  3. `20261118000100_student_habits_validation`
  4. `20261118000200_guardian_absence_reports`
  5. `20261118000300_notifications`
  6. `20261118000400_school_documents`
  7. `20261120035616_drop_empty_private_todos`
  8. `20261120035618_feedback_author_only_drafts`
  9. `20261120040847_school_document_versions_reviews`
  10. `20261120041123_habit_weekly_summary`
  11. `20261120041306_notification_event_fanout`
  12. `20261120041637_habits_catalog_and_validation_reset`
- Tambahan ke daftar di atas: `20261120042600_teacher_attendance_with_approval`, `20261120043317_school_document_draft_cleanup`.
- Tambahan terbaru: `20261120044500_dashboard_overview` (RPC dashboard untuk administrator/kepala sekolah).
- Tambahan X6: `20261120050000_guardian_absence_attendance` mengganti RPC verifikasi agar konfirmasi guru mengisi attendance `absent` melalui helper audit/revisi; hanya bila ada tepat satu sesi+record roster pada tanggal laporan.
- Dengan 23 versi hosted, **16 migration lokal belum hosted**. Perintah `node scripts/check-migrations.mjs` → `Migration OK: 39 berkas, timestamp unik dan naik.`
- PGlite memakai migration berurutan; tes database + API terfokus terakhir **75/75** dan `npm test` penuh **137/137 lulus** pada Node v24.22.3. Pemeriksaan terkini `npm run check` EXIT 0 mencakup 39 migration, check-ci, lint, typecheck, 137/137 tes, build 1.781 modul dan audit bundel 26 JS tanpa akun demo. Build memakai URL/kunci publishable sintetis proses-lokal, cache TS sementara `%TEMP%` (konfigurasi dipulihkan byte-identik), dan mengganti `dist/` dengan izin pemilik. Peringatan chunk PDF 790,69 kB.
- Build negatif Vite tanpa URL/key valid berhenti sebelum compile, sesuai gerbang D3. Build positif hanya menggunakan nilai sintetis; tidak ada kredensial hosted yang dipakai.
- Perubahan lokal baru belum diterapkan hosted. Perlu backup/restore teruji, preflight migration metadata aktual, Advisor bersih, lalu ulangi `npm run check:supabase` dan Advisor sesudah penerapan sesuai urutan. Jangan menghapus/menimpa riwayat hosted.
- Perintah read-only yang diverifikasi: daftar melalui Supabase `list_migrations`; `SELECT count(*)::bigint AS todos_count FROM public.todos` → `0`; Security Advisor → satu WARN di atas. Informasi ini tidak berisi credential atau baris siswa.

### Addendum lokal — 20 November 2026 (Codex)

- X2 migration policy drop `todos`, draft feedback, storage evidence PGlite; X4 versions/reviews + safe draft cleanup; X5 notification fanout; X6 teacher attendance; X7 catalog/weekly summary; X9 synthetic retention-order test sudah ditambahkan lokal dan diuji PGlite/API.
- Snapshot awal X4 tes API/dokumen sekolah memperluas suite menjadi **134/134**. Qoder kemudian menjalankan check penuh 137/137 dan membangun `dist` pada 12:04; tidak ada migration hosted diterapkan.
- Addendum X8: migration `20261120044500_dashboard_overview` diuji bersama semua migration via PGlite; API aggregate diuji. Benchmark EXPLAIN ANALYZE dengan 50.000 modul sintetis (submitted/returned masing-masing 1%) menunjukkan hitung submitted sekitar 8,46 ms → 1,24 ms dan returned 7,08 ms → 1,53 ms setelah partial index. Partial index stage=4 dipilih planner sebagai bitmap scan tetapi lebih lambat (12,95 ms → 17,98 ms); index active students tidak dipakai (95% baris aktif). Maka hanya indeks submitted/returned dimasukkan; tidak ada indeks stage/is_active. Hasil adalah simulasi PGlite, bukan estimasi hosted. Setelah assertion kedua nama index ditambahkan, `node scripts/check-migrations.mjs` lulus (38) dan `npm test` lulus **137/137**; lint/typecheck terakhir juga lulus.
- Addendum X6: D7 dipenuhi melalui aksi konfirmasi guru eksplisit. Pengiriman laporan wali tidak mengubah absensi; konfirmasi hanya mencatat `absent` lewat attendance helper yang menaikkan revision dan menulis `attendance_changes`. Jika sesi/record roster tepat tanggal tidak ada atau ambigu, RPC mengembalikan `55000` dan transaksi membuat status laporan tetap submitted. PGlite menguji konfirmasi, audit, stale revision, tidak ada sesi (rollback), invalid decision, dan pencabutan relasi wali. Full check pasca-migration 39 sekarang lulus EXIT 0 pada 137/137 tes; build ulang 1.781 modul mengganti `dist/` dan audit 26 berkas tanpa akun demo; suite browser yang mencakup UI X6 lulus 304/304.
- Tes retensi Auth sintetis hanya mencakup profil tanpa FK audit historis. FK aktor audit dapat menghalangi penghapusan Auth; prosedur operator mengharuskan berhenti bila FK masih menunjuk dan mempertahankan atribusi.
- Supabase CLI lokal v3.1.0 tersedia, tetapi Docker tidak ditemukan di PATH/lokasi instalasi standar host; X9 belum diuji pada Supabase lokal.

### Pemeriksaan hosted read-only ulang — 20 November 2026, 13:29 WIB

- Supabase MCP `list_migrations` mengembalikan 23 versi hosted, berurutan dari `20261110075255` sampai `20261113074045`; semua cocok dengan 23 migration lokal pertama. Lokal tetap 39 migration, sehingga 16 berikutnya belum diterapkan.
- Supabase MCP menjalankan `SELECT count(*)::bigint AS todos_count FROM public.todos` dalam mode baca saja dan menghasilkan `0`.
- Supabase MCP Security Advisor masih menemukan satu WARN eksternal: `auth_leaked_password_protection` (Leaked Password Protection Disabled). Gerbang X3 tetap tertahan; tidak ada migration, DDL, atau write hosted yang dijalankan.
- Verifikasi ini hanya mencakup riwayat migration, jumlah baris `todos`, dan Security Advisor. `npm run check:supabase`, metadata RLS/grant/policy Storage hosted, dan backup/restore belum diverifikasi pada sesi ini.

### Koreksi status dan hasil pemeriksaan Codex terbaru — 20 November 2026

- Keputusan pemilik D1 dan D2 telah ditetapkan sementara: `todos` dihapus lewat migration yang menolak jika tabel tidak kosong; draf umpan balik dan event draf hanya terbaca penulis. Bagian lama “Keputusan yang masih diminta” dan “Titik konfirmasi” di atas adalah catatan historis dan tidak lagi meminta keputusan tersebut.
- Izin pemilik untuk menerapkan migration baru sudah diberikan. Izin itu tidak menghapus gerbang teknis: hosted tetap tidak boleh ditulis sebelum verifikasi lokal, rekonsiliasi riwayat, backup/pemulihan, dan Security Advisor bersih.
- Pemeriksaan terbaru: 39 migration lokal; 23 migration hosted cocok dengan 23 migration lokal pertama; `todos_count=0`; tidak ada migration hosted diterapkan. Security Advisor masih memiliki satu WARN `auth_leaked_password_protection` (perlindungan kata sandi bocor dinonaktifkan). `npm run check:supabase` berhenti sebelum pemeriksaan karena konfigurasi Supabase lokal yang valid tidak tersedia. Tidak ada `.env.local` dibaca atau dicatat.
- Perintah baca saja yang dapat dijalankan pemilik dari Dashboard SQL Editor setelah memilih project yang benar:

  ```sql
  select version, name
  from supabase_migrations.schema_migrations
  order by version;

  select count(*)::bigint as todos_count
  from public.todos;
  ```

- Pemilik dapat membandingkan daftar version saja (tanpa mengirim kredensial), mengaktifkan Leaked Password Protection melalui Auth settings, lalu meminta pemeriksaan ulang Advisor. CLI resmi untuk rekonsiliasi migration memakai `supabase migration list --remote`; pada CLI v3, pemeriksaan harus diarahkan eksplisit ke remote. `npm run check:supabase` dapat dijalankan lokal menggunakan `.env.local` milik pemilik tanpa membagikan nilainya. Jangan menerapkan migration bila salah satu gerbang tersebut belum terpenuhi.
- Tes terbaru setelah penambahan assertion fan-out notifikasi: `node --test tests/database.test.mjs` pada Node v24.22.3, exit 0, **73/73**. `npm run check` pada Node v24.22.3 exit 0, termasuk **137/137** tes, 39 migration, lint, typecheck, build 1.781 modul dan audit 26 berkas JS tanpa akun demo. Build memakai endpoint/kunci publishable sintetis proses-lokal dan membangun ulang `dist/`; tidak menggunakan konfigurasi hosted. Peringatan chunk PDF 790,69 kB tetap ada.
- Riwayat browser port 5397/5398: run awal tidak dapat dihitung hijau; port 5398 308/312 karena cleanup trace dan resources. Setelah trace dimatikan, suite penuh 402/402 lulus; lihat addendum terbaru.
- Tidak ada backup/restore hosted yang diverifikasi, Docker/Podman/WSL tidak tersedia untuk X9 Supabase lokal, dan Vercel CLI/project link tidak tersedia untuk X10. Karena itu hosted migration, X9 lokal-Supabase, deploy, smoke test produksi, commit, dan merge masih belum selesai.

### Addendum konsolidasi lokal Codex — 20 November 2026

- Migration lokal D1/D2/FK profil/review `habit_students()` kini satu berkas berurutan: `20261114083828_security_foundation.sql`. Dua migration keamanan sebelumnya telah digabung dan dihapus lokal sebelum pernah diterapkan hosted. Migration melakukan `LOCK TABLE`, menolak drop bila ada baris, revoke lalu drop `todos`, memperbarui FK profil menjadi `ON DELETE SET NULL`, dan memasang policy baca draft author-only.
- Hitungan terkini: **38 migration lokal, 23 hosted, 15 belum hosted**. Rekonsiliasi hosted sebelumnya read-only dan berakhir pada `20261113074045`; belum ada hosted write.
- Snapshot historis: PGlite penuh sesudah konsolidasi dan `npm run check` lulus
- Migration belum memenuhi gerbang hosted karena Security Advisor masih WARN, backup/restore belum diverifikasi, `npm run check:supabase` tidak dijalankan, dan Supabase lokal tidak tersedia. Tidak ada migration hosted diterapkan.
- Advisor terakhir masih WARN `auth_leaked_password_protection`; `npm run check:supabase`, backup/restore, dan Supabase lokal belum terverifikasi. Jangan terapkan migration hosted.

### Pemeriksaan hosted baca-saja terbaru — 20 November 2026, 15:57 WIB

- Supabase MCP `list_migrations` kembali menunjukkan 23 migration hosted; versi terakhir `20261113074045`, sesuai 23 migration lokal pertama. Tidak ada migration hosted baru dan tidak ada perubahan skema yang diterapkan.
- Security Advisor masih menghasilkan satu WARN eksternal `auth_leaked_password_protection`. Gerbang hosted tetap tertahan.
- Pemeriksaan ini hanya membaca riwayat migration dan Security Advisor; tidak membaca baris data atau memakai kredensial yang dicatat.
