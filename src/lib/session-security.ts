import type { SupabaseClient } from '@supabase/supabase-js'

// PRD 6.3: sesi berakhir setelah tidak ada aktivitas. Waktu aktivitas terakhir
// disimpan di localStorage agar semua tab berbagi satu penghitung.
export const IDLE_LIMIT_MS = 30 * 60 * 1000
export const IDLE_WARNING_MS = 60 * 1000
const ACTIVITY_KEY = 'si-stir:last-activity'

export type IdleState = 'active' | 'warning' | 'expired'

export function idleState(lastActivity: number, now: number, limit = IDLE_LIMIT_MS, warning = IDLE_WARNING_MS): IdleState {
  const idle = now - lastActivity
  if (idle >= limit) return 'expired'
  if (idle >= limit - warning) return 'warning'
  return 'active'
}

function storage(): Storage | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage } catch { return undefined }
}

export function readLastActivity(): number | null {
  const value = Number(storage()?.getItem(ACTIVITY_KEY))
  return Number.isFinite(value) && value > 0 ? value : null
}

export function markActivity(now = Date.now()) {
  try { storage()?.setItem(ACTIVITY_KEY, String(now)) } catch { /* mode privat: penghitung tetap per tab */ }
}

// Alasan logout otomatis disimpan sementara agar halaman login tetap dapat
// menjelaskannya, apa pun rute yang dipakai saat sesi hilang (ProtectedRoute juga
// mengalihkan ke /login tanpa parameter).
const LOGOUT_REASON_KEY = 'si-stir:logout-reason'

export function setIdleLogoutReason() {
  try { window.sessionStorage.setItem(LOGOUT_REASON_KEY, 'idle') } catch { /* tanpa penyimpanan: cukup parameter URL */ }
}

export function hasIdleLogoutReason(): boolean {
  try { return window.sessionStorage.getItem(LOGOUT_REASON_KEY) === 'idle' } catch { return false }
}

export function clearIdleLogoutReason() {
  try { window.sessionStorage.removeItem(LOGOUT_REASON_KEY) } catch { /* diabaikan */ }
}

export type AuthAuditEvent = 'login' | 'logout' | 'logout_all'

// Catatan audit bersifat best effort: kegagalan (mis. migration belum diterapkan)
// tidak boleh menghalangi login atau logout.
// Batas waktu mencegah koneksi lambat menahan login/logout.
export async function recordAuthEvent(client: SupabaseClient, event: AuthAuditEvent, timeoutMs = 2000): Promise<void> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try { await client.rpc('record_auth_event', { event }).abortSignal(controller.signal) } catch { /* diabaikan */ }
  finally { clearTimeout(timer) }
}
