// Personalisasi ruang peran: pintasan yang disematkan dan layanan terakhir dibuka.
// Disimpan di perangkat per akun dan per peran. Ini hanya preferensi tampilan:
// daftar yang ditampilkan selalu disaring ulang terhadap layanan yang diizinkan
// untuk peran tersebut, sehingga tautan usang atau hasil rekayasa tidak muncul.

// custom = true setelah pengguna mengatur pintasan sendiri; sebelum itu pintasan awal peran yang dipakai.
export type WorkspacePreferences = { pinned: string[]; recent: string[]; custom: boolean }

export const MAX_PINNED = 6
export const MAX_RECENT = 3

const empty = (): WorkspacePreferences => ({ pinned: [], recent: [], custom: false })

export const preferencesKey = (userId: string, role: string) => `si-stir:ruang:${role}:${userId}`

function paths(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item === 'string' && item.startsWith('/') && !item.startsWith('//') && item.length <= 80) seen.add(item)
    if (seen.size >= limit) break
  }
  return [...seen]
}

export function parsePreferences(raw: string | null): WorkspacePreferences {
  if (!raw) return empty()
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return empty()
    const record = value as Record<string, unknown>
    return { pinned: paths(record.pinned, MAX_PINNED), recent: paths(record.recent, MAX_RECENT), custom: record.custom === true }
  } catch { return empty() }
}

export function togglePinned(prefs: WorkspacePreferences, path: string): WorkspacePreferences {
  if (prefs.pinned.includes(path)) return { ...prefs, pinned: prefs.pinned.filter(item => item !== path) }
  if (prefs.pinned.length >= MAX_PINNED) return prefs
  return { ...prefs, pinned: [...prefs.pinned, path] }
}

export function movePinned(prefs: WorkspacePreferences, path: string, offset: -1 | 1): WorkspacePreferences {
  const index = prefs.pinned.indexOf(path)
  const target = index + offset
  if (index < 0 || target < 0 || target >= prefs.pinned.length) return prefs
  const pinned = [...prefs.pinned]
  ;[pinned[index], pinned[target]] = [pinned[target], pinned[index]]
  return { ...prefs, pinned }
}

export function recordVisit(prefs: WorkspacePreferences, path: string): WorkspacePreferences {
  return { ...prefs, recent: [path, ...prefs.recent.filter(item => item !== path)].slice(0, MAX_RECENT) }
}

// Hanya kembalikan layanan yang masih tersedia, dengan urutan sesuai preferensi.
export function pickAllowed<T extends { to: string }>(order: string[], services: T[]): T[] {
  const byPath = new Map(services.map(service => [service.to, service]))
  return order.flatMap(path => byPath.get(path) ?? [])
}

export function greetingFor(date: Date): string {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Jakarta' }).format(date))
  if (hour >= 4 && hour < 11) return 'Selamat pagi'
  if (hour >= 11 && hour < 15) return 'Selamat siang'
  if (hour >= 15 && hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export function todayLabel(date: Date): string {
  return date.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function storage(): Storage | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage } catch { return undefined }
}

export function loadPreferences(userId: string, role: string): WorkspacePreferences {
  try { return parsePreferences(storage()?.getItem(preferencesKey(userId, role)) ?? null) } catch { return empty() }
}

export function savePreferences(userId: string, role: string, prefs: WorkspacePreferences) {
  try { storage()?.setItem(preferencesKey(userId, role), JSON.stringify(prefs)) } catch { /* penyimpanan penuh atau diblokir: abaikan */ }
}
