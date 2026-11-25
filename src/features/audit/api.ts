import type { SupabaseClient } from '@supabase/supabase-js'

export type AuditModule =
  | 'keamanan' | 'peran' | 'tautan_akun' | 'supervisi' | 'nilai' | 'absensi' | 'kebiasaan'
  | 'jadwal' | 'dokumen' | 'umpan_balik' | 'absensi_guru' | 'modul_ajar'

export type AuditEntry = {
  module: AuditModule
  action: string
  record_id: string | null
  actor_id: string | null
  occurred_at: string
}

export const AUDIT_PAGE_SIZE = 25

export const auditModuleLabels: Record<AuditModule, string> = {
  keamanan: 'Keamanan akun',
  peran: 'Perubahan peran',
  tautan_akun: 'Tautan akun',
  supervisi: 'Supervisi',
  nilai: 'Nilai',
  absensi: 'Absensi murid',
  kebiasaan: '7 Kebiasaan',
  jadwal: 'Jadwal',
  dokumen: 'Dokumen sekolah',
  umpan_balik: 'Umpan balik tugas',
  absensi_guru: 'Absensi guru',
  modul_ajar: 'Modul ajar',
}

export const securityActionLabels: Record<string, string> = {
  login: 'Masuk',
  logout: 'Keluar',
  logout_all: 'Keluar dari semua perangkat',
  sessions_revoked: 'Sesi dicabut administrator',
}

export async function daftarAudit(client: SupabaseClient, page: number, module: AuditModule | '' = ''): Promise<{ items: AuditEntry[]; hasMore: boolean }> {
  if (!Number.isSafeInteger(page) || page < 0 || page > 10000) throw new Error('Halaman audit tidak valid.')
  if (module && !(module in auditModuleLabels)) throw new Error('Modul audit tidak valid.')
  let query = client.from('audit_log').select('module,action,record_id,actor_id,occurred_at')
  if (module) query = query.eq('module', module)
  const from = page * AUDIT_PAGE_SIZE
  const { data, error } = await query.order('occurred_at', { ascending: false }).range(from, from + AUDIT_PAGE_SIZE)
  if (error) throw error
  const rows = (data ?? []) as AuditEntry[]
  return { items: rows.slice(0, AUDIT_PAGE_SIZE), hasMore: rows.length > AUDIT_PAGE_SIZE }
}

export async function namaPelaku(client: SupabaseClient, ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids)].slice(0, 100)
  if (unique.length === 0) return {}
  const { data, error } = await client.rpc('audit_actor_names', { actor_ids: unique })
  if (error) throw error
  return Object.fromEntries(((data ?? []) as { id: string; full_name: string }[]).map(row => [row.id, row.full_name]))
}

export async function cabutSesi(client: SupabaseClient, profileId: string): Promise<number> {
  if (!/^[0-9a-f-]{36}$/i.test(profileId)) throw new Error('Identitas akun tidak valid.')
  const { data, error } = await client.rpc('admin_revoke_sessions', { target: profileId })
  if (error) throw error
  return Number(data ?? 0)
}
