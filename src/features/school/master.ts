export type MasterKind = 'school_settings' | 'academic_years' | 'semesters' | 'subjects' | 'school_classes' | 'teachers' | 'students' | 'class_enrollments' | 'teacher_assignments'
export type MasterRow = { id: string | boolean; [key: string]: string | number | boolean }
export type ReferenceTable = 'teachers' | 'students' | 'school_classes' | 'subjects'
export type MasterField = { key: string; label: string; type: 'text' | 'date' | 'number' | 'checkbox' | 'year' | 'textarea' | 'reference'; reference?: ReferenceTable; required?: boolean; maxLength?: number; min?: number; max?: number }
export type MasterDefinition = { label: string; singular: string; fields: MasterField[] }
const year: MasterField = { key: 'academic_year_id', label: 'Tahun ajaran', type: 'year', required: true }
const active: MasterField = { key: 'is_active', label: 'Aktif', type: 'checkbox' }
const dates: MasterField[] = [{ key: 'starts_on', label: 'Tanggal mulai', type: 'date', required: true }, { key: 'ends_on', label: 'Tanggal selesai', type: 'date', required: true }]
const personFields: MasterField[] = [
  { key: 'code', label: 'Kode sekolah (huruf besar, angka, _ atau -)', type: 'text', required: true, maxLength: 30 },
  { key: 'name', label: 'Nama lengkap', type: 'text', required: true, maxLength: 120 }, active,
]
export const masterDefinitions: Record<MasterKind, MasterDefinition> = {
  school_settings: { label: 'Identitas sekolah', singular: 'identitas sekolah', fields: [
    { key: 'name', label: 'Nama sekolah', type: 'text', required: true, maxLength: 160 },
    { key: 'npsn', label: 'NPSN (8 digit, opsional)', type: 'text', maxLength: 8 },
    { key: 'address', label: 'Alamat sekolah', type: 'textarea', maxLength: 500 },
    { key: 'whatsapp_number', label: 'Nomor WhatsApp sekolah (contoh 6281234567890, opsional)', type: 'text', maxLength: 15 },
  ] },
  academic_years: { label: 'Tahun ajaran', singular: 'tahun ajaran', fields: [
    { key: 'name', label: 'Nama tahun ajaran', type: 'text', required: true, maxLength: 40 }, ...dates, active,
  ] },
  semesters: { label: 'Semester', singular: 'semester', fields: [year, { key: 'number', label: 'Semester (1 atau 2)', type: 'number', min: 1, max: 2, required: true }, ...dates, active] },
  subjects: { label: 'Mata pelajaran', singular: 'mata pelajaran', fields: [
    { key: 'code', label: 'Kode (huruf besar, angka, _ atau -)', type: 'text', required: true, maxLength: 20 },
    { key: 'name', label: 'Nama mata pelajaran', type: 'text', required: true, maxLength: 120 }, active,
  ] },
  school_classes: { label: 'Kelas', singular: 'kelas', fields: [year,
    { key: 'name', label: 'Nama kelas', type: 'text', required: true, maxLength: 60 },
    { key: 'grade', label: 'Tingkat (1–6)', type: 'number', required: true, min: 1, max: 6 },
    { key: 'capacity', label: 'Kapasitas', type: 'number', required: true, min: 1, max: 100 }, active,
  ] },
  teachers: { label: 'Guru', singular: 'guru', fields: personFields },
  students: { label: 'Siswa', singular: 'siswa', fields: personFields },
  class_enrollments: { label: 'Anggota kelas', singular: 'keanggotaan kelas', fields: [
    { key: 'student_id', label: 'Siswa', type: 'reference', reference: 'students', required: true },
    { key: 'class_id', label: 'Kelas', type: 'reference', reference: 'school_classes', required: true }, active,
  ] },
  teacher_assignments: { label: 'Penugasan guru', singular: 'penugasan guru', fields: [
    { key: 'teacher_id', label: 'Guru', type: 'reference', reference: 'teachers', required: true },
    { key: 'class_id', label: 'Kelas', type: 'reference', reference: 'school_classes', required: true },
    { key: 'subject_id', label: 'Mata pelajaran', type: 'reference', reference: 'subjects', required: true }, active,
  ] },
}

export function canReadMasterData(kind: MasterKind, role: string | null) {
  if (role === 'administrator' || role === 'principal') return true
  if (kind === 'teachers') return role === 'teacher'
  if (kind === 'students') return role === 'student' || role === 'teacher'
  if (kind === 'teacher_assignments') return role === 'teacher'
  if (kind === 'class_enrollments') return role === 'teacher' || role === 'student'
  return ['teacher', 'student', 'parent'].includes(role ?? '')
}

export function validateMaster(kind: MasterKind, values: Record<string, string>): string {
  for (const field of masterDefinitions[kind].fields) {
    const value = (values[field.key] ?? '').trim()
    if (field.required && !value) return `${field.label} wajib diisi.`
    if (field.maxLength && value.length > field.maxLength) return `${field.label} terlalu panjang.`
    if (field.type === 'number' && (!Number.isInteger(Number(value)) || Number(value) < field.min! || Number(value) > field.max!)) return `${field.label} di luar batas yang diizinkan.`
    if (field.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) return `${field.label} tidak valid.`
  }
  if (values.starts_on && values.ends_on && values.ends_on <= values.starts_on) return 'Tanggal selesai harus setelah tanggal mulai.'
  if (kind === 'school_settings' && values.npsn && !/^\d{8}$/.test(values.npsn)) return 'NPSN harus berisi tepat 8 digit.'
  if (kind === 'school_settings' && values.whatsapp_number && !/^62\d{8,13}$/.test(values.whatsapp_number)) return 'Nomor WhatsApp harus diawali 62 dan berisi 10–15 digit, tanpa spasi atau tanda plus.'
  if (kind === 'subjects' && !/^[A-Z0-9_-]{1,20}$/.test(values.code ?? '')) return 'Kode hanya boleh berisi huruf besar, angka, _ atau -.'
  if ((kind === 'teachers' || kind === 'students') && !/^[A-Z0-9_-]{1,30}$/.test(values.code ?? '')) return 'Kode sekolah hanya boleh berisi huruf besar, angka, _ atau -.'
  return ''
}

export function masterPayload(kind: MasterKind, values: Record<string, string>) {
  return Object.fromEntries(masterDefinitions[kind].fields.map(field => [field.key,
    field.type === 'checkbox' ? values[field.key] === 'true' : field.type === 'number' ? Number(values[field.key]) : (values[field.key] ?? '').trim(),
  ]))
}
