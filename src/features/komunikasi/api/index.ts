import type { SupabaseClient } from '@supabase/supabase-js'

export type PesanKomunikasi = {
  id: string
  assignment_id: string
  student_id: string
  parent_profile_id: string
  body: string
  author_id: string
  created_at: string
}

export type PesanBaru = Pick<PesanKomunikasi, 'id' | 'assignment_id' | 'student_id' | 'parent_profile_id' | 'body'>

const columns = 'id,assignment_id,student_id,parent_profile_id,body,author_id,created_at'
const pageSize = 25

// RLS enforces access; caller-provided IDs do not grant permission.
export async function daftarPesan(client: SupabaseClient, page = 0): Promise<{ items: PesanKomunikasi[]; hasMore: boolean }> {
  if (!Number.isSafeInteger(page) || page < 0 || page > 10000) throw new Error('Halaman tidak valid.')
  const { data, error } = await client.from('communication_messages').select(columns)
    .order('created_at', { ascending: false }).order('id', { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize)
  if (error) throw error
  const rows = data as PesanKomunikasi[]
  return { items: rows.slice(0, pageSize), hasMore: rows.length > pageSize }
}

// Check a client-generated message ID after a lost response before retrying.
export async function cariPesan(client: SupabaseClient, id: string): Promise<PesanKomunikasi | null> {
  const { data, error } = await client.from('communication_messages').select(columns).eq('id', id).maybeSingle()
  if (error) throw error
  return data as PesanKomunikasi | null
}

export async function kirimPesan(client: SupabaseClient, pesan: PesanBaru): Promise<PesanKomunikasi> {
  const body = pesan.body.trim()
  if (!body || Array.from(body).length > 4000) throw new Error('Isi pesan harus 1-4.000 karakter.')
  const { data, error } = await client.from('communication_messages')
    .insert({ id: pesan.id, assignment_id: pesan.assignment_id, student_id: pesan.student_id, parent_profile_id: pesan.parent_profile_id, body })
    .select(columns).single()
  if (error) throw error
  return data as PesanKomunikasi
}

export type PenerimaKomunikasi = {
  assignment_id: string
  student_id: string
  parent_profile_id: string
  teacher_name: string
  student_name: string
  parent_name: string
}

export async function daftarPenerima(client: SupabaseClient, page = 0): Promise<{ items: PenerimaKomunikasi[]; hasMore: boolean }> {
  if (!Number.isSafeInteger(page) || page < 0 || page > 10000) throw new Error('Halaman tidak valid.')
  const { data, error } = await client.rpc('communication_recipients', { page_number: page })
  if (error) throw error
  const items = data as PenerimaKomunikasi[]
  return { items: items.slice(0, pageSize), hasMore: items.length > pageSize }
}
