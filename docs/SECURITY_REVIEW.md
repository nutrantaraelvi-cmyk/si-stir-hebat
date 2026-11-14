# Telaah Keamanan Migration

Status: REVIEW — laporan, tanpa perubahan kode atau migration
Tanggal: 14 November 2026
Penulis: Qoder
Ruang lingkup: seluruh berkas `supabase/migrations/*.sql` (24 berkas di repo; 23 tercatat terpasang di hosted)

Laporan ini **tidak** menyatakan database "aman". Yang dapat dibuktikan secara statis dan lewat pemeriksaan baca-saja dicatat di §3. Temuan yang masih perlu tindakan ada di §2 dan §6.

## 1. Ringkasan temuan

| ID | Tingkat | Berkas:baris | Temuan | Saran singkat |
|----|---------|--------------|--------|----------------|
| K1 | Rendah | `20261113074045_create_private_todos.sql:1-30` (khususnya :13) | Migration contoh tanpa `begin`/`commit`; `grant select, insert, update, delete` penuh ke `authenticated` pada tabel `todos` yang tidak dipakai UI. RLS membatasi tiap pengguna ke baris miliknya sendiri. | Codex mengonfirmasi pemakaian; jika tidak dipakai, migration baru untuk `revoke all` + `drop table` (dengan persetujuan pemilik). Bungkus semua migration baru dengan transaksi. |
| K2 | Rendah | `20261114000139_student_habits.sql:13-16, 76-78` | Fungsi `public.habit_students()` SECURITY DEFINER dapat dieksekusi `authenticated` dan mengembalikan id+nama siswa yang boleh dibaca pemanggil; gerbang `school_private.can_read_habits` (baris 2-11) membatasi ke administrator, kepala sekolah, wali terhubung, dan guru dengan penugasan. Migration **belum** terpasang di hosted. | Jangan terapkan sebelum skema kebiasaan disetujui. Saat akan diterapkan: tinjau ulang kebutuhan mengekspos daftar id+nama, tambahkan tes PGlite, dan catat skema sebagai sementara. |
| K3 | Rendah | `20261111233649_task_feedback.sql:50-54, 76-81` | Administrator dan kepala sekolah dapat membaca **draf** umpan balik guru (dan event draf). Bukan eskalasi peran, tetapi celah privasi draf. | Putuskan dan dokumentasikan: batasi draf ke penulis, atau nyatakan sebagai akses baca institusional. Perubahan hanya oleh Codex. |
| K4 | Rendah (bukti tidak lengkap) | `20261111082822_supervision_evidence.sql:3-5, 29-46` | Kebijakan bucket `supervision-evidence` hanya diuji terhadap tabel `storage.objects` tiruan di PGlite. Perilaku RLS Storage hosted belum diverifikasi pada telaah ini; bucket dideklarasikan privat (`public=false`). | Verifikasi di hosted memakai `pg_policies` untuk `storage.objects` dan uji unduh dengan akun guru lain. Jadwalkan pada UAT (lihat `docs/PANDUAN_UAT.md`). |
| K5 | Info | seluruh migration | Tidak ada grant ke `anon` atau `public`; 39 fungsi SECURITY DEFINER semuanya menetapkan `search_path`; 35 tabel memiliki RLS (28 eksplisit + 7 lewat `do $$ ... execute format`). | Pertahankan pola; jalankan ulang skrip audit setiap ada migration baru. |

## 2. Rincian temuan

### K1 — `todos` contoh: transaksi tidak ada dan DML penuh

Bukti:

- `20261113074045_create_private_todos.sql` tidak memiliki `begin;`/`commit;` (satu-satunya berkas tanpa transaksi).
- Baris 13: `grant select, insert, update, delete on table public.todos to authenticated;`
- Baris 15-30: empat policy RLS membatasi baca/tulis/hapus ke `user_id = auth.uid()`.
- `npm run check:supabase` (14 November 2026) mencantumkan `todos` dan mendapat penolakan akses anonim, sehingga tabel ini ada di hosted.

Dampak: tidak ada akses lintas pengguna karena RLS. Pengguna terautentikasi dapat membuat baris tak terbatas untuk dirinya sendiri; tabel tidak dipakai UI Vite sehingga hanya menambah permukaan serangan dan kebingungan operasional. Migration tanpa transaksi dapat tertinggal setengah jalan jika gagal.

Saran untuk Codex: konfirmasi apakah tabel ini masih diperlukan. Jika tidak, buat migration baru (bukan mengubah yang lama) untuk `revoke all` lalu `drop table public.todos`, setelah persetujuan pemilik. Untuk migration berikutnya, gunakan satu transaksi eksplisit.

### K2 — `habit_students()` dan status migration ke-24

Bukti:

- Berkas `20261114000139_student_habits.sql` ada di repo tetapi tidak termasuk 23 migration hosted pada README.
- Pemeriksaan baca-saja ke Data API hosted (tanpa membaca baris) menghasilkan `404 PGRST205` untuk `habit_records` dan `habit_events`, jadi tabel kebiasaan belum ada di hosted.
- Baris 13-16: `public.habit_students()` SECURITY DEFINER, `set search_path=''`, mengembalikan `id` dan `name` siswa yang lolos `can_read_habits`.
- Baris 76-78: fungsi tersebut di-revoke dari `public, anon, authenticated` lalu di-grant ke `authenticated`.
- Baris 2-11: `can_read_habits` membatasi ke administrator/kepala sekolah, wali yang terhubung, atau guru dengan penugasan pada kelas siswa yang aktif.

Dampak: tidak ada dampak hosted saat ini. Jika diterapkan, daftar id+nama siswa terbuka bagi peran yang memang berwenang membaca siswa; ini konsisten dengan kebijakan baca lain, tetapi menambah satu titik enumerasi nama. Modul ini belum memiliki UI dan aturan kebiasaan belum disetujui pengguna.

Saran: tahan penerapan; sertakan tes PGlite saat modul dibangun; catat skema sebagai sementara di `docs/DECISIONS.md`. Perbarui hitungan migration di README (sudah dilakukan pada Q2) agar tidak muncul drift 23 vs 24.

### K3 — Draf umpan balik terbaca administrator/kepala sekolah

Bukti: `20261111233649_task_feedback.sql:50-54` menambahkan `p.role in ('administrator','principal')` pada policy baca; baris 76-81 melakukan hal yang sama untuk event. UI tidak menampilkan draf kepada peran tersebut, tetapi RLS mengizinkan.

Dampak: guru mungkin menganggap draf belum terlihat atasan. Bukan eskalasi peran dan tidak membuka data siswa di luar kewenangan baca yang sudah ada, tetapi merupakan keputusan kebijakan yang perlu eksplisit.

Saran: pilih salah satu—(a) batasi draf ke penulis, publikasi saja yang dibaca peran lain, atau (b) dokumentasikan bahwa admin/kepala sekolah memiliki akses baca penuh. Perubahan policy hanya oleh Codex.

### K4 — Bukti RLS Storage terbatas

Bukti: migration `20261111082822_supervision_evidence.sql` membuat bucket privat (baris 3-5) dan policy pada `storage.objects` (baris 29-46). Tes database menyimulasikan `storage.objects` (lihat `tests/database.test.mjs`), bukan skema Storage hosted. Telaah ini tidak menjalankan uji akses Storage dengan akun nyata.

Dampak: ketidakpastian bukti, bukan bukti celah. Verifikasi diperlukan sebelum menyatakan modul bukti privat siap operasional.

Saran: pada UAT, unggah bukti sebagai guru/kepala sekolah lalu coba unduh dengan akun guru lain dan akun tanpa peran; periksa juga `pg_policies` hosted untuk `storage.objects`.

## 3. Kontrol yang terbukti

1. **Tidak ada akses anonim di tingkat grant.** Pencarian seluruh migration: 0 grant `to anon` dan 0 grant `to public`. `npm run check:supabase` pada 14 November 2026 mengonfirmasi penolakan anonim untuk 33 tabel yang diperiksa, tanpa membaca baris.
2. **`search_path` pada SECURITY DEFINER.** Skrip audit lokal menemukan 39 fungsi SECURITY DEFINER dan 0 yang tanpa `search_path`. Contoh: `public.create_school_profile()` (`20261110075255_profiles.sql:25-35`), helper `school_private` absensi, `guardian_attendance()` (`20261111075356_guardian_attendance.sql:3-32`), `set_account_relationship` (`20261111074620_account_relationships.sql:45`).
3. **RLS pada semua tabel.** 35 tabel; 28 `enable row level security` eksplisit + 7 lewat loop tetap: `school_settings`, `academic_years`, `semesters`, `subjects`, `school_classes` (`20261110081258_school_master_data.sql:82-94`) serta `teachers`, `students` (`20261110082821_people_registry.sql:28-35`). GRANT saja tidak cukup; policy tetap membatasi peran.
4. **Kolom sensitif tidak dapat ditulis klien.** `profiles` hanya `grant update (full_name)` (baris 17) sehingga peran tidak dapat diubah dari klien. Registri guru/siswa hanya `insert/update (code,name,is_active)` (baris 35) sehingga `profile_id` dan metadata pembuatan tidak dapat diisi klien. `assessment_results` tidak memiliki grant insert/delete; peserta diisi trigger SECURITY DEFINER.
5. **Identitas pelaku tidak berasal dari klien.** Fungsi definer memakai `auth.uid()`; tidak ada parameter identitas pemanggil. Import absensi memakai request ID + fingerprint server; penyimpanan absensi memeriksa revisi dan alasan koreksi; usulan jadwal memakai advisory lock.
6. **Master data hanya ditulis administrator.** Grant `insert` ke `authenticated` tetap dibatasi policy `master_insert`/`master_update` yang mensyaratkan peran `administrator` (`20261110081258_school_master_data.sql:90-91`); kepala sekolah hanya membaca.

## 4. Status migration ke-24 (bukti hosted)

| Pemeriksaan | Hasil |
|-------------|-------|
| `GET /rest/v1/habit_records?select=id&limit=0` dengan publishable key, tanpa header Authorization | `404` `PGRST205` "Could not find the table 'public.habit_records' in the schema cache" |
| `GET /rest/v1/habit_events?select=id&limit=0` | `404` `PGRST205` untuk `public.habit_events` |
| `npm run check:supabase` | Auth aktif; semua tabel pada daftar skrip ditolak untuk anonim; `todos` ada |

Kesimpulan: hosted saat ini berisi 23 migration sesuai README; berkas ke-24 hanya lokal dan belum terpasang. Cache skema dapat tertinggal, tetapi 404 pada dua tabel baru adalah bukti kuat ketidakhadiran. Konfirmasi akhir tetap milik Codex/pemilik proyek.

## 5. Batas telaah

- Telaah statis tidak membuktikan perilaku RLS untuk setiap kombinasi peran; itu tugas UAT dengan akun sekolah.
- Telaah ini tidak mengubah hosted, Auth, Storage, secret, atau migration.
- Kebijakan Storage, Site URL, pengiriman email, dan advisor keamanan hosted tidak diperiksa ulang di sini.
- `npm run check:supabase` hanya memeriksa daftar tabel tetap; tambahkan tabel baru (termasuk kebiasaan, jika kelak diterapkan) ke skrip tersebut.
- Loop `do $$ ... execute format` memakai nama objek konstan di dalam migration. Pola ini aman selama tidak pernah menyisipkan input pengguna ke SQL dinamis.

## 6. Rekomendasi untuk Codex (prioritas)

1. Konfirmasi dan bereskan `todos` (K1): putuskan dipakai atau dihapus lewat migration baru.
2. Putuskan kebijakan draf umpan balik (K3) dan catat di `docs/DECISIONS.md`.
3. Tahan `student_habits` sampai skema disetujui; tambahkan tes database saat modul dibangun (K2).
4. Gunakan `begin; ... commit;` pada seluruh migration baru.
5. Verifikasi RLS Storage hosted dan lakukan UAT bukti privat sebelum rilis (K4).

## 7. Lampiran — berkas yang ditelaah

`20261110075255_profiles.sql`, `20261110075305_announcements.sql`, `20261110081258_school_master_data.sql`, `20261110081303_restrict_auto_rls_execution.sql`, `20261110082821_people_registry.sql`, `20261110084348_class_enrollments_assignments.sql`, `20261110091137_attendance_core.sql`, `20261110093304_attendance_imports.sql`, `20261111070725_teaching_journals.sql`, `20261111074620_account_relationships.sql`, `20261111075356_guardian_attendance.sql`, `20261111080033_teaching_modules.sql`, `20261111080735_academic_supervision.sql`, `20261111082822_supervision_evidence.sql`, `20261111092126_class_materials.sql`, `20261111092744_class_tasks.sql`, `20261111232717_task_submissions.sql`, `20261111233649_task_feedback.sql`, `20261111234856_academic_assessments.sql`, `20261112051122_assessment_subject_identity.sql`, `20261113000504_lesson_schedules.sql`, `20261113061010_schedule_proposals.sql`, `20261113074045_create_private_todos.sql`, `20261114000139_student_habits.sql` (lokal, belum diterapkan).
