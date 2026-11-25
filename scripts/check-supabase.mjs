// Run with Node.js 22.18+: node --env-file=.env.local scripts/check-supabase.mjs
import { getPublicSupabaseConfig } from '../src/lib/config.ts'
import { isDatabasePermissionDenied } from './database-denial.mjs'
const config = getPublicSupabaseConfig(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY)

async function check() {
  if (!config) {
    throw new Error('Isi Project URL dan publishable key yang valid pada .env.local terlebih dahulu.')
  }
  const { url, key } = config
  const response = await fetch(new URL('/auth/v1/settings', url), {
    headers: { apikey: key }, signal: AbortSignal.timeout(15000), redirect: 'error',
  })
  if (!response.ok) throw new Error(`Layanan Auth menolak koneksi (HTTP ${response.status}). Periksa URL, key, dan status proyek.`)
  const settings = await response.json()
  if (typeof settings.external?.email !== 'boolean') throw new Error('Respons bukan konfigurasi Supabase Auth yang dikenali.')
  console.log('Koneksi Supabase Auth berhasil. Email login: ' + (settings.external.email ? 'aktif' : 'nonaktif'))
  for (const table of [
    'profiles', 'announcements', 'school_settings', 'academic_years', 'semesters', 'subjects',
    'school_classes', 'teachers', 'students', 'class_enrollments', 'teacher_assignments',
    'attendance_sessions', 'attendance_records', 'attendance_changes', 'attendance_imports',
    'teaching_journals', 'parent_student_relationships', 'account_relationship_events',
    'teaching_modules', 'teaching_module_events', 'academic_supervisions', 'academic_supervision_events',
    'class_materials', 'task_submissions', 'task_feedback', 'task_feedback_events',
    'assessments', 'assessment_results', 'assessment_result_events',
    'lesson_schedules', 'lesson_schedule_events', 'schedule_proposals',
    'habit_records', 'habit_events', 'habit_catalog', 'guardian_absence_reports', 'notifications', 'school_documents',
    'document_categories', 'document_versions', 'document_reviews', 'school_document_events',
    'teacher_attendance', 'teacher_attendance_corrections', 'teacher_attendance_events',
  ]) {
    const column = table === 'parent_student_relationships' ? 'student_id' : 'id'
    const result = await fetch(new URL(`/rest/v1/${table}?select=${column}&limit=0`, url), {
      headers: { apikey: key }, signal: AbortSignal.timeout(15000), redirect: 'error',
    })
    if (![401, 403].includes(result.status)) throw new Error(`Tabel ${table}: harapkan penolakan akses anonim, mendapat HTTP ${result.status}. Periksa migration dan izin tabel.`)
    if (!await isDatabasePermissionDenied(result)) throw new Error(`Tabel ${table}: penolakan belum dapat dikonfirmasi sebagai izin database.`)
    console.log(`Tabel ${table}: Data API menolak akses anonim sesuai rancangan.`)
  }
  const dashboardRpc = await fetch(new URL('/rest/v1/rpc/dashboard_overview', url), {
    method: 'POST', headers: { apikey: key, 'content-type': 'application/json' }, body: '{}',
    signal: AbortSignal.timeout(15000), redirect: 'error',
  })
  if (![401, 403].includes(dashboardRpc.status)) throw new Error(`RPC dashboard_overview: harapkan penolakan akses anonim, mendapat HTTP ${dashboardRpc.status}. Periksa grant dan migration.`)
  if (!await isDatabasePermissionDenied(dashboardRpc)) throw new Error('RPC dashboard_overview: penolakan belum dapat dikonfirmasi sebagai izin database.')
  console.log('RPC dashboard_overview: Data API menolak akses anonim sesuai rancangan.')
  console.log('Pemeriksaan ini tidak membaca baris data. Alur email dan sesi pengguna tetap perlu pengujian dengan akun sekolah.')
}

check().catch(error => {
  // Avoid printing URLs, keys, response bodies, or request internals.
  console.error(error instanceof TypeError ? 'Koneksi gagal. Periksa format URL, jaringan, dan status proyek.' : error.message)
  process.exitCode = 1
})
