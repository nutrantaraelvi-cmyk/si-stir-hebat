-- Index penutup untuk foreign key yang belum memiliki index (temuan Performance Advisor
-- dan audit PGlite tests/schema-guards.test.mjs). Mempercepat join/filter RLS dan
-- mencegah scan penuh saat baris induk dihapus/diubah. Idempoten (if not exists).
begin;
create index if not exists class_enrollments_class_id_academic_year_id_fk_idx on public.class_enrollments (class_id,academic_year_id);
create index if not exists deletion_requests_created_by_fk_idx on public.deletion_requests (created_by);
create index if not exists deletion_requests_decided_by_fk_idx on public.deletion_requests (decided_by);
create index if not exists deletion_requests_executed_by_fk_idx on public.deletion_requests (executed_by);
create index if not exists document_reviews_reviewer_profile_id_fk_idx on public.document_reviews (reviewer_profile_id);
create index if not exists document_versions_uploaded_by_fk_idx on public.document_versions (uploaded_by);
create index if not exists grading_settings_updated_by_fk_idx on public.grading_settings (updated_by);
create index if not exists guardian_absence_reports_teacher_id_fk_idx on public.guardian_absence_reports (teacher_id);
create index if not exists habit_records_validated_by_fk_idx on public.habit_records (validated_by);
create index if not exists profile_role_changes_changed_by_fk_idx on public.profile_role_changes (changed_by);
create index if not exists profile_role_changes_profile_id_fk_idx on public.profile_role_changes (profile_id);
create index if not exists retention_policies_updated_by_fk_idx on public.retention_policies (updated_by);
create index if not exists school_calendar_events_created_by_fk_idx on public.school_calendar_events (created_by);
create index if not exists school_document_events_actor_profile_id_fk_idx on public.school_document_events (actor_profile_id);
create index if not exists school_documents_category_fk_idx on public.school_documents (category);
create index if not exists teacher_assignments_class_id_academic_year_id_fk_idx on public.teacher_assignments (class_id,academic_year_id);
create index if not exists teacher_attendance_corrections_attendance_id_fk_idx on public.teacher_attendance_corrections (attendance_id);
create index if not exists teacher_attendance_corrections_reviewed_by_fk_idx on public.teacher_attendance_corrections (reviewed_by);
create index if not exists teacher_attendance_events_actor_profile_id_fk_idx on public.teacher_attendance_events (actor_profile_id);
create index if not exists teacher_attendance_events_correction_id_fk_idx on public.teacher_attendance_events (correction_id);
commit;
