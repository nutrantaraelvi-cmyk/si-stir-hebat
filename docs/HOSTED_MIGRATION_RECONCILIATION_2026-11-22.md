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

Objek yang belum ditemukan termasuk `habit_records`, `habit_events`, `communication_messages`, `guardian_absence_reports`, `notifications`, `school_documents`, `school_document_versions`, `habit_weekly_summaries`, dan `teacher_attendance`/`teacher_attendance_corrections`.

## Gate dan langkah lanjutan

- `npm run check:supabase` pada 22 November: Auth email aktif dan pemeriksaan anonim lolos untuk tabel lama; berhenti gagal ketika `habit_records` memberi HTTP 404. Jadi gate ini belum lulus.
- Security Advisor masih memberi WARN `auth_leaked_password_protection` (aktifkan pemeriksaan kata sandi bocor melalui pengaturan Auth, lalu jalankan ulang Advisor).
- Performance Advisor mencatat 15 FK tanpa indeks, 63 indeks belum terpakai, serta satu WARN kebijakan SELECT permisif ganda pada `students`. Ini perlu ditinjau, tetapi jangan menghapus indeks hanya dari sinyal “unused”.
- Backup/restore teruji dan stack Supabase lokal belum memiliki bukti pada catatan proyek. `AGENTS.md` melarang perubahan live tanpa persetujuan eksplisit; keputusan proyek juga mensyaratkan gate hosted bersih.
- Jangan menandai versi migrasi sebagai diterapkan hanya untuk menutupi selisih, dan jangan mengirim ulang migrasi pembuat objek yang sudah ada. Buat snapshot schema lengkap (termasuk constraint, index, policy, grant, trigger, function dan storage), backup/restore, uji replay lokal, lalu siapkan migrasi rekonsiliasi bertahap untuk objek yang drift. Setelah gate disetujui/lulus, terapkan satu per satu dalam urutan timestamp, verifikasi setelah tiap migrasi, kemudian cocokkan ulang daftar hosted.
