# Rekonsiliasi migrasi hosted - 22 November 2026

## Target dan hasil baca-saja

Target dari `supabase/config.toml` cocok dengan proyek Supabase `ysworvoaqqwppwcrnmqk` (ACTIVE_HEALTHY, PostgreSQL 17.11, region ap-northeast-2). Riwayat hosted saat audit berisi 23 migrasi, sampai `20261113074045_create_private_todos`; repository memiliki 39. Tidak ada DDL atau perubahan konfigurasi hosted dilakukan.

Migrasi lokal yang belum tercatat di riwayat hosted:

1. `20261114000139_student_habits.sql`
2. `20261114083827_komunikasi.sql`
3. `20261114083828_security_foundation.sql`
4. `20261118000100_student_habits_validation.sql`
5. `20261118000200_guardian_absence_reports.sql`
6. `20261118000300_notifications.sql`
7. `20261118000400_school_documents.sql`
8. `20261120040847_school_document_versions_reviews.sql`
9. `20261120041123_habit_weekly_summary.sql`
10. `20261120041306_notification_event_fanout.sql`
11. `20261120041637_habits_catalog_and_validation_reset.sql`
12. `20261120042600_teacher_attendance_with_approval.sql`
13. `20261120043317_school_document_draft_cleanup.sql`
14. `20261120044500_dashboard_overview.sql`
15. `20261120050000_guardian_absence_attendance.sql`
16. `20261121090000_school_configuration.sql`

## Bukti drift / objek parsial

Metadata `information_schema` read-only menemukan objek di bawah sudah ada walau migrasi pembuatnya belum tercatat, dan bentuk hosted berbeda dari SQL lokal:

- `grading_settings`: hosted memiliki `created_by` dan `created_at` tambahan.
- `retention_policies`: hosted memiliki `created_by`/`created_at`; `retention_years` nullable, sedangkan migration lokal menyatakan NOT NULL.
- `teacher_attendance_status_types`: hosted memiliki `sort_order`, `created_by`, `created_at`, `updated_by`, `updated_at` tambahan.
- `teacher_document_types`: hosted memiliki `is_required`, `period`, `retain_old_versions_years`, serta kolom audit tambahan.
- `school_calendar_events`: hosted memiliki kolom audit `updated_by` dan `updated_at` tambahan.
- `deletion_requests` sudah ada (14 kolom); definisi constraint/policy/function belum dibandingkan penuh.

Audit constraint dan isi policy menegaskan bahwa ini bukan sekadar kolom audit tambahan:

- `retention_policies` hosted menerima kategori seperti `assessment`, `learning`, `communication`, `habits`, dan `teacher_documents`; migration lokal memakai `grades`, `journals`, dan `communications`. Hosted menerima action `anonymize`, sementara migration lokal memakai `retain`. Hosted mengizinkan `retention_years` NULL dan minimal 1, sedangkan migration lokal mewajibkan NOT NULL dan mengizinkan 0. Ini mengubah pilihan retensi dan perlu diputuskan terhadap keputusan pemilik sebelum rekonsiliasi.
- `school_calendar_events` hosted membatasi `kind` menjadi `hari_besar/libur/kegiatan`, deskripsi maksimal 1.000 karakter dan kolom audit created/updated opsional; migration lokal juga mengizinkan `akademik/lainnya`, deskripsi 2.000 karakter, dan mewajibkan `created_by`.
- `teacher_attendance_status_types` hosted membatasi pola kode/label lebih ketat, memiliki sort order/audit dan kebijakan SELECT hanya admin/kepala sekolah/guru; migration lokal mengizinkan format kode lebih luas dan SELECT juga orang tua.
- `teacher_document_types` memakai himpunan kategori berbeda; hosted mempunyai periode/retensi versi/wajib dan kolom audit tambahan, migration lokal mendefinisikan kategori berbeda.
- `deletion_requests` hosted menerima `guardian`, sedangkan migration lokal menerima `parent`; batas hosted lebih pendek (reason 5–500, uraian subjek sampai 300, catatan 5–300) dan CHECK status/audit tidak sama dengan invariant status lokal. Policy hosted menyatukan baca admin/kepala sekolah serta memakai helper `school_private.config_role()`; migration lokal memiliki policy terpisah. Fungsi keputusan hosted ada pada `school_private`, sementara SQL lokal mendefinisikan fungsi `public`.
- `grading_settings` memiliki kolom audit tambahan, tetapi nilai KKM dan izin policy tampak searah secara fungsi; tetap perlu memeriksa trigger dan grants sebelum menyatakan ekuivalen.
- Policy `teacher_attendance_status_types` hosted tidak sama cakupannya dengan migration lokal (tidak memberi SELECT ke orang tua). Untuk feedback tugas, nama policy cocok tetapi predikat harus diuji terhadap keputusan terbaru bahwa draft hanya dibaca penulis.

Pemeriksaan lanjutan katalog `pg_proc`, `pg_policies`, `pg_indexes`, `information_schema.triggers`, dan `storage.buckets` memberi gambaran berikut (nama objek saja, tanpa data baris):

| Migrasi tertinggal | Perbandingan metadata hosted |
| --- | --- |
| `20261114000139_student_habits` | `habit_records`, `habit_events`, helper, policy, index, dan trigger belum ada. |
| `20261114083827_komunikasi` | `communication_messages`, helper/penerima, index, dan policy belum ada. |
| `20261114083828_security_foundation` | Objek yang diubah sebagian berada: `todos` masih ada; policy feedback hosted bernama `task_feedback_read`/`task_feedback_events_read` sedangkan migration mengganti policy bernama sama itu. Perlu cek isi policy dan status `todos` sebelum eksekusi. |
| `20261118000100_student_habits_validation` | Bergantung pada `habit_records` yang belum ada; tak dapat berdiri sendiri. |
| `20261118000200_guardian_absence_reports` | Tabel, helper, policy, index, dan trigger laporan wali belum ada. |
| `20261118000300_notifications` | Tabel, index, policy dan RPC notifikasi belum ada. |
| `20261118000400_school_documents` | Tabel/fungsi dokumen dan bucket `school-documents` belum ada. Bucket Storage yang ada hanya `supervision-evidence` (private). |
| `20261120040847_school_document_versions_reviews` | Bergantung pada tabel dokumen yang belum ada; belum dapat diterapkan mandiri. |
| `20261120041123_habit_weekly_summary` | Bergantung pada tabel kebiasaan yang belum ada; RPC rekap mingguan juga belum ada. |
| `20261120041306_notification_event_fanout` | Bergantung pada notifikasi, dokumen, komunikasi, dan laporan wali yang belum ada; trigger fan-out belum ada. |
| `20261120041637_habits_catalog_and_validation_reset` | `habit_catalog` dan policy/helper terkait belum ada; bergantung pada tabel kebiasaan. |
| `20261120042600_teacher_attendance_with_approval` | Tabel kehadiran guru, helper, event, policy dan RPC belum ada. |
| `20261120043317_school_document_draft_cleanup` | RPC pembersihan draf belum ada dan tabel dokumen yang dirujuk juga belum ada. |
| `20261120044500_dashboard_overview` | RPC `dashboard_overview` belum ada. Dua index bernama dashboard yang ditambahkan migration belum ada. |
| `20261120050000_guardian_absence_attendance` | RPC review laporan wali yang diganti belum ada karena tabel/fitur laporan wali belum ada. |
| `20261121090000_school_configuration` | Lima tabel konfigurasi + `deletion_requests` sudah ada, tetapi definisi kolom berbeda; nama policy hosted juga berbeda (mis. `grading_read`/`grading_update`, `calendar_read`/`calendar_insert`/`calendar_update`/`calendar_delete`, dan `deletion_read`/`deletion_insert` terhadap nama policy lokal). Index konfigurasi sebagian tidak ada; fungsi keputusan penghapusan sudah ada dengan nama schema berbeda (`school_private.*` hosted vs `public.*` di migration lokal). Ini memerlukan rekonsiliasi forward-only, bukan menjalankan ulang file pembuat tabel. |

Dengan demikian, migrasi tidak dapat dicocokkan hanya lewat timestamp: baseline hosted mengandung objek dari jalur schema lain yang mengubah semantik retensi, kalender, daftar tipe, dan permintaan penghapusan. Migrasi konfigurasi terakhir pasti tidak aman untuk diterapkan apa adanya. Untuk migrasi 1–15, tabel utama yang dibutuhkan fitur kebanyakan belum ada, tetapi setiap objek turunan dan kontrak otorisasi tetap harus direplay/diuji terhadap schema snapshot terlebih dahulu. Hasil saat ini adalah inventaris metadata, bukan klaim bahwa migrasi sudah diterapkan atau seluruhnya aman.

Objek yang belum ditemukan termasuk `habit_records`, `habit_events`, `communication_messages`, `guardian_absence_reports`, `notifications`, `school_documents`, `school_document_versions`, `habit_weekly_summaries`, dan `teacher_attendance`/`teacher_attendance_corrections`.

## Gate dan langkah lanjutan

- `npm run check:supabase` pada 22 November: Auth email aktif dan pemeriksaan anonim lolos untuk tabel lama; berhenti gagal ketika `habit_records` memberi HTTP 404. Jadi gate ini belum lulus.
- Security Advisor masih memberi WARN `auth_leaked_password_protection` (aktifkan pemeriksaan kata sandi bocor melalui pengaturan Auth, lalu jalankan ulang Advisor).
- Performance Advisor mencatat 15 FK tanpa indeks, 63 indeks belum terpakai, serta satu WARN kebijakan SELECT permisif ganda pada `students`. Ini perlu ditinjau, tetapi jangan menghapus indeks hanya dari sinyal “unused”.
- Backup/restore teruji dan stack Supabase lokal belum memiliki bukti pada catatan proyek. `AGENTS.md` melarang perubahan live tanpa persetujuan eksplisit; keputusan proyek juga mensyaratkan gate hosted bersih.
- Jangan menandai versi migrasi sebagai diterapkan hanya untuk menutupi selisih, dan jangan mengirim ulang migrasi pembuat objek yang sudah ada. Buat snapshot schema lengkap (termasuk constraint, index, policy, grant, trigger, function dan storage), backup/restore, uji replay lokal, lalu siapkan migrasi rekonsiliasi bertahap untuk objek yang drift. Setelah gate disetujui/lulus, terapkan satu per satu dalam urutan timestamp, verifikasi setelah tiap migrasi, kemudian cocokkan ulang daftar hosted.
