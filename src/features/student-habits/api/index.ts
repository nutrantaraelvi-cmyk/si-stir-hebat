import type { SupabaseClient } from '@supabase/supabase-js'

export const habitLabels = ['Bangun pagi', 'Beribadah', 'Berolahraga', 'Makan sehat', 'Gemar belajar', 'Bermasyarakat', 'Tidur cepat'] as const
export type HabitValue = (typeof habitLabels)[number]
export type HabitRecord = {
  id: string
  student_id: string
  record_date: string
  habits: boolean[]
  notes: string
  validation_status: 'pending' | 'validated'
  validated_by: string | null
  validated_at: string | null
  validation_note: string
  revision: number
  updated_at: string
}
export type HabitDraft = Pick<HabitRecord, 'student_id' | 'record_date' | 'habits' | 'notes'>
export type HabitWeeklySummary = {
  student_id: string
  student_name: string
  days_expected: number
  days_filled: number
  days_missing: number
  bangun_pagi: number
  beribadah: number
  berolahraga: number
  makan_sehat: number
  gemar_belajar: number
  bermasyarakat: number
  tidur_cepat: number
}

const columns = 'id,student_id,record_date,habits,notes,validation_status,validated_by,validated_at,validation_note,revision,updated_at'

export function validateHabitDraft(draft: Pick<HabitDraft, 'record_date' | 'habits' | 'notes'>, today: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.record_date)) return 'Tanggal kebiasaan tidak valid.'
  if (draft.record_date > today) return 'Catatan untuk tanggal mendatang tidak diperbolehkan.'
  if (!Array.isArray(draft.habits) || draft.habits.length !== 7 || draft.habits.some(value => typeof value !== 'boolean')) return 'Pilih tujuh indikator kebiasaan dengan nilai yang valid.'
  if (typeof draft.notes !== 'string' || Array.from(draft.notes).length > 1000) return 'Catatan tambahan maksimal 1.000 karakter.'
  return ''
}

export async function daftarKebiasaan(client: SupabaseClient, studentId?: string, page = 0): Promise<{ items: HabitRecord[]; hasMore: boolean }> {
  if (!Number.isSafeInteger(page) || page < 0 || page > 10000) throw new Error('Halaman tidak valid.')
  let query = client.from('habit_records').select(columns).order('record_date', { ascending: false }).order('id', { ascending: false }).range(page * 25, page * 25 + 25)
  if (studentId) query = query.eq('student_id', studentId)
  const { data, error } = await query
  if (error) throw error
  const rows = (data ?? []) as HabitRecord[]
  return { items: rows.slice(0, 25), hasMore: rows.length > 25 }
}

export async function ambilKebiasaanHarian(client: SupabaseClient, studentId: string, date: string): Promise<HabitRecord | null> {
  const { data, error } = await client.from('habit_records').select(columns)
    .eq('student_id', studentId).eq('record_date', date).maybeSingle()
  if (error) throw error
  return data as HabitRecord | null
}

export async function simpanKebiasaan(client: SupabaseClient, draft: HabitDraft, today: string, expectedRevision: number | null = null): Promise<HabitRecord> {
  const notes = draft.notes.trim()
  const invalid = validateHabitDraft({ ...draft, notes }, today)
  if (invalid) throw new Error(invalid)
  if (expectedRevision !== null && (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)) {
    throw new Error('Revisi catatan kebiasaan tidak valid.')
  }
  const records = client.from('habit_records')
  const change = expectedRevision === null
    ? records.insert({ student_id: draft.student_id, record_date: draft.record_date, habits: draft.habits, notes })
    : records.update({ habits: draft.habits, notes, revision: expectedRevision + 1 })
      .eq('student_id', draft.student_id).eq('record_date', draft.record_date).eq('revision', expectedRevision)
  const { data, error } = await change.select(columns).single()
  if (error) throw error
  return data as HabitRecord
}

export async function validasiKebiasaan(client: SupabaseClient, id: string, revision: number, note: string): Promise<HabitRecord> {
  if (!id || !Number.isSafeInteger(revision) || revision < 0) throw new Error('Identitas revisi kebiasaan tidak valid.')
  const trimmed = note.trim()
  if (!trimmed || Array.from(trimmed).length > 1000) throw new Error('Catatan validasi harus 1-1.000 karakter.')
  const { data, error } = await client.from('habit_records')
    .update({ validation_status: 'validated', validation_note: trimmed, revision: revision + 1 })
    .eq('id', id).eq('revision', revision).select(columns).single()
  if (error) throw error
  return data as HabitRecord
}

export async function ringkasanKebiasaanMingguan(client: SupabaseClient, weekStart: string, studentId?: string, page = 0): Promise<{ items: HabitWeeklySummary[]; hasMore: boolean }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart) || !Number.isSafeInteger(page) || page < 0 || page > 10000) {
    throw new Error('Rentang atau halaman rekap kebiasaan tidak valid.')
  }
  const { data, error } = await client.rpc('habit_weekly_summary', {
    requested_week: weekStart,
    page_number: page,
    target_student: studentId ?? null,
  })
  if (error) throw error
  const rows = (data ?? []) as HabitWeeklySummary[]
  return { items: rows.slice(0, 25), hasMore: rows.length > 25 }
}
