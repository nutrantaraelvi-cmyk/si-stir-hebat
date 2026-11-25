# Hosted schema snapshot (read-only inventory)

As of 20 November 2026, 16:46 WIB (Asia/Jakarta). Source: Supabase MCP `list_tables`, verbose, schema `public`. No school rows were selected or recorded. The hosted project has 23 migrations through `20261113074045`.

This is a metadata inventory for recovery planning, **not a SQL dump, backup, or restore test**. RLS is enabled on all listed public tables. The tool's foreign-key summary included inbound constraints and could be misattributed per table, so it is omitted here. Row counts and row data are omitted.

| Table | Primary key | Columns (name: type) |
| --- | --- | --- |
| `profiles` | `id` | id: uuid, full_name: text, role: text, created_at: timestamptz |
| `announcements` | `id` | id: uuid, title: text, body: text, status: text, created_by: uuid, created_at: timestamptz |
| `school_settings` | `id` | id: boolean, name: text, npsn: text, address: text, created_at: timestamptz |
| `academic_years` | `id` | id: uuid, name: text, starts_on: date, ends_on: date, is_active: boolean, created_at: timestamptz |
| `semesters` | `id` | id: uuid, academic_year_id: uuid, number: smallint, starts_on: date, ends_on: date, is_active: boolean, created_at: timestamptz |
| `subjects` | `id` | id: uuid, code: text, name: text, is_active: boolean, created_at: timestamptz |
| `school_classes` | `id` | id: uuid, academic_year_id: uuid, name: text, grade: smallint, capacity: smallint, is_active: boolean, created_at: timestamptz |
| `teachers` | `id` | id: uuid, code: text, name: text, is_active: boolean, profile_id: uuid, created_by: uuid, created_at: timestamptz |
| `students` | `id` | id: uuid, code: text, name: text, is_active: boolean, profile_id: uuid, created_by: uuid, created_at: timestamptz |
| `class_enrollments` | `id` | id: uuid, student_id: uuid, class_id: uuid, academic_year_id: uuid, is_active: boolean, created_by: uuid, created_at: timestamptz |
| `teacher_assignments` | `id` | id: uuid, teacher_id: uuid, class_id: uuid, subject_id: uuid, academic_year_id: uuid, is_active: boolean, created_by: uuid, created_at: timestamptz |
| `attendance_sessions` | `id` | id: uuid, class_id: uuid, held_on: date, created_by: uuid, created_at: timestamptz |
| `attendance_records` | `id` | id: uuid, session_id: uuid, enrollment_id: uuid, student_id: uuid, student_code: text, student_name: text, status: text, revision: integer, updated_by: uuid, updated_at: timestamptz |
| `attendance_changes` | `id` | id: uuid, record_id: uuid, old_status: text, new_status: text, reason: text, actor_id: uuid, created_at: timestamptz |
| `attendance_imports` | `id` | id: uuid, session_id: uuid, source_name: text, source_sha256: text, changes_sha256: text, row_count: integer, changed_count: integer, actor_id: uuid, created_at: timestamptz |
| `teaching_journals` | `id` | id: uuid, assignment_id: uuid, held_on: date, topic: text, activities: text, reflection: text, class_name: text, subject_name: text, teacher_name: text, academic_year_name: text, created_by: uuid, created_at: timestamptz |
| `parent_student_relationships` | `parent_profile_id, student_id` | parent_profile_id: uuid, student_id: uuid, verified_at: timestamptz, verified_by: uuid |
| `account_relationship_events` | `id` | id: bigint, relationship_kind: text, registry_id: uuid, profile_id: uuid, active: boolean, actor_id: uuid, reason: text, created_at: timestamptz |
| `teaching_modules` | `id` | id: uuid, assignment_id: uuid, author_id: uuid, title: text, objectives: text, activities: text, status: text, review_note: text, revision: integer, updated_at: timestamptz |
| `teaching_module_events` | `id` | id: bigint, module_id: uuid, actor_id: uuid, status: text, review_note: text, created_at: timestamptz |
| `academic_supervisions` | `id` | id: uuid, teacher_id: uuid, created_by: uuid, scheduled_on: date, stage: smallint, focus: text, preparation: text, planning_score: smallint, instruction_score: smallint, assessment_score: smallint, observation_notes: text, reflection: text, feedback: text, follow_up_plan: text, target_on: date, follow_up_status: text, follow_up_evaluation: text, published_at: timestamptz, revision: integer, updated_at: timestamptz |
| `academic_supervision_events` | `id` | id: bigint, supervision_id: uuid, actor_id: uuid, stage: smallint, follow_up_status: text, published: boolean, created_at: timestamptz |
| `class_materials` | `id` | id: uuid, assignment_id: uuid, class_id: uuid, author_id: uuid, class_name: text, subject_name: text, title: text, body: text, status: text, published_at: timestamptz, updated_at: timestamptz, revision: integer, kind: text, due_on: date |
| `task_submissions` | `id` | id: uuid, task_id: uuid, student_id: uuid, submitted_by: uuid, student_name: text, answer: text, submitted_at: timestamptz |
| `task_feedback` | `id` | id: uuid, submission_id: uuid, task_id: uuid, student_id: uuid, student_name: text, author_id: uuid, feedback: text, status: text, revision: integer, updated_at: timestamptz, published_at: timestamptz |
| `task_feedback_events` | `id` | id: uuid, feedback_id: uuid, actor_id: uuid, feedback: text, status: text, revision: integer, created_at: timestamptz |
| `assessments` | `id` | id: uuid, assignment_id: uuid, class_id: uuid, author_id: uuid, title: text, assessment_type: text, held_on: date, maximum_score: numeric, class_name: text, subject_name: text, status: text, revision: integer, student_count: integer, graded_count: integer, published_at: timestamptz, updated_at: timestamptz, subject_id: uuid |
| `assessment_results` | `id` | id: uuid, assessment_id: uuid, student_id: uuid, student_code: text, student_name: text, score: numeric, feedback: text, change_reason: text, revision: integer, updated_at: timestamptz |
| `assessment_result_events` | `id` | id: uuid, result_id: uuid, actor_id: uuid, old_score: numeric, score: numeric, feedback: text, change_reason: text, revision: integer, created_at: timestamptz |
| `lesson_schedules` | `id` | id: uuid, assignment_id: uuid, teacher_id: uuid, class_id: uuid, class_name: text, teacher_name: text, subject_name: text, weekday: integer, start_minute: integer, end_minute: integer, effective_from: date, effective_until: date, is_active: boolean, revision: integer, updated_at: timestamptz, created_by: uuid |
| `lesson_schedule_events` | `id` | id: uuid, schedule_id: uuid, actor_id: uuid, old_values: jsonb, new_values: jsonb, reason: text, created_at: timestamptz |
| `schedule_proposals` | `id` | id: uuid, schedule_id: uuid, author_id: uuid, base_revision: integer, original: jsonb, weekday: integer, start_minute: integer, end_minute: integer, effective_from: date, effective_until: date, reason: text, status: text, decision_reason: text, decided_by: uuid, decided_at: timestamptz, created_at: timestamptz |
| `todos` | `id` | id: uuid, user_id: uuid, name: text, created_at: timestamptz |

## Read-only gates at snapshot time

- Security Advisor: one WARN, `auth_leaked_password_protection` (Leaked Password Protection Disabled).
- `public.todos` remained present on hosted at snapshot time. The earlier read-only count was zero; the local guarded drop migration has not been applied.
- No hosted migration or data write occurred during this metadata read.
- Before migration: create and test a real backup/restore, reconcile exact migration list, run local Supabase tests and `npm run check:supabase`, and require a clean Security Advisor.
