import type { AttendanceChange, AttendanceStatus } from './attendance-model.ts'

// PRD 5.4D dan 8.2: absensi dapat dicatat saat koneksi terputus. Perubahan
// disimpan di perangkat per akun, ditandai "belum tersinkron", lalu dikirim
// ulang lewat RPC yang sama sehingga otorisasi dan validasi server tetap berlaku.
// Revisi per catatan menjadi pendeteksi duplikasi/konflik saat sinkronisasi.

export type QueuedAttendance = {
  id: string
  sessionId: string
  sessionLabel: string
  changes: AttendanceChange[]
  queuedAt: string
  state: 'pending' | 'conflict' | 'rejected'
}

export type SyncOutcome = 'synced' | 'duplicate' | 'conflict' | 'rejected' | 'retry'

type ErrorLike = { code?: unknown; message?: unknown } | null | undefined

const keyFor = (userId: string) => `si-stir:absensi-offline:${userId}`
const MAX_ENTRIES = 50

function storage(): Storage | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage } catch { return undefined }
}

function isChange(value: unknown): value is AttendanceChange {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string' && typeof item.status === 'string' && Number.isInteger(item.revision) && typeof item.reason === 'string'
}

export function parseQueue(raw: string | null): QueuedAttendance[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    return value.filter((entry): entry is QueuedAttendance => Boolean(entry) && typeof entry === 'object'
      && typeof entry.id === 'string' && typeof entry.sessionId === 'string' && typeof entry.sessionLabel === 'string'
      && typeof entry.queuedAt === 'string' && ['pending', 'conflict', 'rejected'].includes(entry.state)
      && Array.isArray(entry.changes) && entry.changes.length > 0 && entry.changes.every(isChange))
  } catch { return [] }
}

export function readQueue(userId: string): QueuedAttendance[] {
  return parseQueue(storage()?.getItem(keyFor(userId)) ?? null)
}

export function writeQueue(userId: string, entries: QueuedAttendance[]) {
  const store = storage()
  if (!store) throw new Error('Penyimpanan perangkat tidak tersedia.')
  if (entries.length === 0) store.removeItem(keyFor(userId))
  else store.setItem(keyFor(userId), JSON.stringify(entries))
}

export function enqueueAttendance(userId: string, entry: Omit<QueuedAttendance, 'id' | 'queuedAt' | 'state'>, now = new Date()): QueuedAttendance {
  const queue = readQueue(userId)
  if (queue.length >= MAX_ENTRIES) throw new Error('Antrean offline penuh. Sinkronkan dulu sebelum mencatat lagi.')
  const queued: QueuedAttendance = { ...entry, id: crypto.randomUUID(), queuedAt: now.toISOString(), state: 'pending' }
  writeQueue(userId, [...queue, queued])
  return queued
}

export function isNetworkFailure(error: ErrorLike, online = typeof navigator === 'undefined' ? true : navigator.onLine): boolean {
  if (!online) return true
  if (!error) return false
  const code = typeof error.code === 'string' ? error.code : ''
  const message = typeof error.message === 'string' ? error.message : ''
  return code === '' && /failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(message)
}

// Menentukan nasib satu entri setelah dicoba dikirim.
// `current` adalah status tersimpan saat ini (dibaca ulang setelah 40001).
export function classifySync(error: ErrorLike, changes: AttendanceChange[], current?: Record<string, AttendanceStatus | null>, online?: boolean): SyncOutcome {
  if (!error) return 'synced'
  if (isNetworkFailure(error, online)) return 'retry'
  if (error.code === '40001') {
    if (current && changes.every(change => current[change.id] === change.status)) return 'duplicate'
    return 'conflict'
  }
  return 'rejected'
}
