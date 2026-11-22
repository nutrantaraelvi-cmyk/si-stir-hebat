// Dipetakan dari docs/RBAC_MATRIX.md (policy RLS aktual). Hak akses UI tidak
// menggantikan RLS: fungsi di sini hanya menyembunyikan tindakan yang tidak bermakna.

export type SchoolRole = 'administrator' | 'principal' | 'teacher' | 'student' | 'parent' | 'pending'
type RoleInput = string | null | undefined

function has(role: RoleInput, ...allowed: SchoolRole[]) {
  return role != null && allowed.includes(role as SchoolRole)
}

export const isAdministrator = (role: RoleInput): role is 'administrator' => role === 'administrator'
export const isPrincipal = (role: RoleInput): role is 'principal' => role === 'principal'
export const isTeacher = (role: RoleInput): role is 'teacher' => role === 'teacher'
export const isStudent = (role: RoleInput): role is 'student' => role === 'student'
export const isParent = (role: RoleInput): role is 'parent' => role === 'parent'
export const isPending = (role: RoleInput) => role == null || role === 'pending'

export const isStaff = (role: RoleInput) => has(role, 'administrator', 'principal', 'teacher')

export const canReadRegistry = (role: RoleInput) =>
  has(role, 'administrator', 'principal', 'teacher', 'student')
export const canManageRegistry = isAdministrator
export const canReadAccountLinks = isAdministrator

export const canReadJournals = isStaff
export const canWriteJournals = isTeacher

export const canReadTeachingModules = isStaff
export const canWriteTeachingModules = isTeacher
export const canReviewTeachingModules = isPrincipal

export const canReadLearning = (role: RoleInput) => has(role, 'teacher', 'student', 'parent')
export const canWriteLearning = isTeacher
// RLS memberi baca materi kepada kelima peran; menu disembunyikan untuk administrator
// dan kepala sekolah karena tidak ada tindakan pengelolaan di sana (temuan A-01/A-02).
export const canReadLearningData = (role: RoleInput) =>
  has(role, 'administrator', 'principal', 'teacher', 'student', 'parent')

export const canReadAssessments = canReadLearning
export const canReadAssessmentData = canReadLearningData
export const canWriteAssessments = isTeacher

export const canReadSchedules = (role: RoleInput) =>
  has(role, 'administrator', 'principal', 'teacher', 'student', 'parent')
export const canManageSchedules = isAdministrator
export const canProposeSchedules = isTeacher
export const canReadScheduleHistory = (role: RoleInput) => has(role, 'administrator', 'principal')

export const canReadAttendance = (role: RoleInput) =>
  has(role, 'administrator', 'principal', 'teacher', 'student')
export const canWriteAttendance = isTeacher

// Absensi guru: guru check-in/out dan mengajukan koreksi; kepala sekolah menyetujui;
// administrator membaca.
export const canReadTeacherAttendance = (role: RoleInput) => has(role, 'administrator', 'principal', 'teacher')
export const canCheckInTeacherAttendance = isTeacher
export const canReviewTeacherAttendance = isPrincipal

export const canReadSupervision = (role: RoleInput) => has(role, 'principal', 'teacher')
export const canManageSupervision = isPrincipal

export const canAccessCommunication = (role: RoleInput) => has(role, 'teacher', 'parent')

export const canReadAbsenceReports = (role: RoleInput) =>
  has(role, 'administrator', 'principal', 'teacher', 'parent')
export const canSubmitAbsenceReport = isParent
export const canReviewAbsenceReports = isTeacher

export const canReadGuardianPortal = isParent

// Dokumen: kepala sekolah mengelola dan menyetujui, administrator teknis tanpa
// persetujuan, guru mengunggah dokumen miliknya; siswa/wali tanpa akses.
export const canReadSchoolDocuments = isStaff
export const canUploadSchoolDocuments = isTeacher
export const canReviewSchoolDocuments = isPrincipal

export const canReadNotifications = (role: RoleInput) =>
  has(role, 'administrator', 'principal', 'teacher', 'student', 'parent')
export const canReadHabits = canReadNotifications
export const canSubmitHabits = isParent
export const canValidateHabits = isTeacher

export const canReadDashboardOverview = (role: RoleInput) => has(role, 'administrator', 'principal')
