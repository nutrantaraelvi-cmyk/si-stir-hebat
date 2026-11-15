import type { Session } from '@supabase/supabase-js'
import { getPublicSupabaseConfig } from './config.ts'
import { DEMO_ACCOUNTS } from './demo-accounts.ts'

export type DemoRole = 'administrator' | 'principal' | 'teacher' | 'student' | 'parent'

export type DemoAccount = {
  id: string
  email: string
  password: string
  full_name: string
  role: DemoRole
}

const viteEnv = (import.meta as ImportMeta & { env?: { DEV?: boolean; VITE_SUPABASE_URL?: string; VITE_SUPABASE_PUBLISHABLE_KEY?: string } }).env
const isDevRuntime = viteEnv ? viteEnv.DEV === true : true
const hasSupabaseConfig = getPublicSupabaseConfig(viteEnv?.VITE_SUPABASE_URL, viteEnv?.VITE_SUPABASE_PUBLISHABLE_KEY) !== null

export { DEMO_ACCOUNTS }

const SESSION_KEY = 'si-stir-hebat-demo-session'
const PROFILE_KEY = 'si-stir-hebat-demo-profiles'

export function isDemoModeEnabled() {
  return !hasSupabaseConfig && isDevRuntime
}

function readProfiles(): DemoAccount[] {
  if (!isDemoModeEnabled()) return []
  if (typeof window === 'undefined') return DEMO_ACCOUNTS
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY)
    if (!raw) return DEMO_ACCOUNTS
    const parsed = JSON.parse(raw) as DemoAccount[]
    return Array.isArray(parsed) && parsed.length ? parsed : DEMO_ACCOUNTS
  } catch {
    return DEMO_ACCOUNTS
  }
}

function writeProfiles(profiles: DemoAccount[]) {
  if (!isDemoModeEnabled() || typeof window === 'undefined') return
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles))
}

export function getDemoProfiles() {
  return isDemoModeEnabled() ? readProfiles() : []
}

export function getDemoProfile(userId: string) {
  if (!isDemoModeEnabled()) return null
  return getDemoProfiles().find((account) => account.id === userId) ?? null
}

export function signInDemo(email: string, password: string) {
  if (!isDemoModeEnabled()) return null
  const account = getDemoProfiles().find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password)
  if (!account) return null
  const session: Session = {
    access_token: `demo-access-${account.id}`,
    refresh_token: `demo-refresh-${account.id}`,
    expires_in: 3600,
    expires_at: Math.floor((Date.now() + 60 * 60 * 1000) / 1000),
    token_type: 'bearer',
    user: {
      id: account.id,
      email: account.email,
      app_metadata: {},
      user_metadata: { full_name: account.full_name, role: account.role },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      role: 'authenticated',
    },
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: account.id }))
  }

  return session
}

export function getDemoSession(): Session | null {
  if (!isDemoModeEnabled() || typeof window === 'undefined') return null
  const saved = window.localStorage.getItem(SESSION_KEY)
  if (!saved) return null

  try {
    const parsed = JSON.parse(saved) as { userId?: string }
    const account = parsed.userId ? getDemoProfile(parsed.userId) : null
    if (!account) return null
    return signInDemo(account.email, account.password)
  } catch {
    return null
  }
}

export function clearDemoSession() {
  if (!isDemoModeEnabled() || typeof window === 'undefined') return
  window.localStorage.removeItem(SESSION_KEY)
}

export function updateDemoProfile(userId: string, fullName: string) {
  if (!isDemoModeEnabled()) return
  const profiles = getDemoProfiles()
  const next = profiles.map((profile) => profile.id === userId ? { ...profile, full_name: fullName } : profile)
  writeProfiles(next)
}

export function updateDemoPassword(userId: string, newPassword: string) {
  if (!isDemoModeEnabled()) return
  const profiles = getDemoProfiles()
  const next = profiles.map((profile) => profile.id === userId ? { ...profile, password: newPassword } : profile)
  writeProfiles(next)
}

export function getDemoAnnouncements() {
  if (!isDemoModeEnabled()) return []
  return [
    {
      id: 'demo-ann-1',
      title: 'Pekan Literasi SDN 03 Wonosari',
      body: 'Pada minggu depan, seluruh siswa akan mengikuti kegiatan literasi membaca 15 menit sebelum pembelajaran dimulai. Guru dan orang tua diharapkan mendukung kebiasaan membaca di rumah.',
      status: 'published',
      created_at: '2026-11-05T08:00:00.000Z',
    },
    {
      id: 'demo-ann-2',
      title: 'Pendaftaran ekstrakurikuler dibuka',
      body: 'Ekstrakurikuler musik, pramuka, dan robotika dibuka untuk siswa kelas IV–VI. Formulir pendaftaran dapat diunduh di ruang guru atau dikirim melalui wali kelas.',
      status: 'published',
      created_at: '2026-11-03T09:30:00.000Z',
    },
    {
      id: 'demo-ann-3',
      title: 'Rapat evaluasi semester',
      body: 'Rapat evaluasi semester akan dilaksanakan pada hari Jumat pukul 14.00 di ruang guru. Semua wali kelas diharapkan hadir.',
      status: 'draft',
      created_at: '2026-11-01T12:00:00.000Z',
    },
  ]
}
