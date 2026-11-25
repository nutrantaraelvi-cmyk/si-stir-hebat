export const schoolRoleLabels: Record<string, string> = {
  pending: 'Menunggu penetapan peran', administrator: 'Administrator',
  principal: 'Kepala Sekolah', teacher: 'Guru', student: 'Murid', parent: 'Orang Tua',
}

export { canAccessCommunication, canReadAssessments, canReadAttendance, canReadJournals, canReadLearning, canReadSchedules } from '../utils/permissions.ts'
