import type { DemoAccount } from './demo-auth.ts'

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: 'demo-admin', email: 'admin@sdn03.sch.id', password: 'admin123', full_name: 'Admin Sekolah', role: 'administrator' },
  { id: 'demo-principal', email: 'kepsek@sdn03.sch.id', password: 'kepsek123', full_name: 'Kepala Sekolah', role: 'principal' },
  { id: 'demo-teacher', email: 'guru@sdn03.sch.id', password: 'guru123', full_name: 'Budi Santoso', role: 'teacher' },
  { id: 'demo-student', email: 'murid@sdn03.sch.id', password: 'murid123', full_name: 'Nia Ayu', role: 'student' },
  { id: 'demo-parent', email: 'ortu@sdn03.sch.id', password: 'ortu123', full_name: 'Sari Wulandari', role: 'parent' },
]
