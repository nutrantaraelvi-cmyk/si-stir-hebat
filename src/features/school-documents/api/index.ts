import type { SupabaseClient } from '@supabase/supabase-js'

export type DocumentCategory = 'ksp' | 'rkt' | 'rkas' | 'sk' | 'administration' | 'other'
export type SchoolDocumentStatus = 'draft' | 'submitted' | 'approved' | 'needs_revision' | 'archived'
export type SchoolDocument = {
  id: string
  owner_profile_id: string
  category: DocumentCategory
  title: string
  description: string
  file_path: string
  mime_type: string
  file_size: number
  status: SchoolDocumentStatus
  review_note: string
  revision: number
  created_at: string
  updated_at: string
}
export type SchoolDocumentVersion = {
  id: string
  document_id: string
  version_number: number
  file_path: string
  mime_type: string
  file_size: number
  uploaded_by: string
  created_at: string
}
export type SchoolDocumentReview = {
  id: string
  document_id: string
  reviewer_profile_id: string
  from_status: SchoolDocumentStatus
  to_status: SchoolDocumentStatus
  note: string
  created_at: string
}

const documentColumns = 'id,owner_profile_id,category,title,description,file_path,mime_type,file_size,status,review_note,revision,created_at,updated_at'
const documentMimeTypes = new Set([
  'application/pdf', 'image/jpeg', 'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

export type SchoolDocumentCategory = { key: DocumentCategory; label: string; is_active: boolean }

function validateDocumentFile(file: File) {
  if (!file || file.size < 1 || file.size > 10 * 1024 * 1024 || !documentMimeTypes.has(file.type)) {
    throw new Error('Berkas harus PDF, JPEG, PNG, DOCX, atau XLSX dengan ukuran maksimal 10 MB.')
  }
}

function createFilePath(documentId: string, file: File) {
  const safeName = (file.name.split(/[\\/]/).pop() ?? '')
    .replace(/[^A-Za-z0-9_.-]/g, '_').replace(/^\.+/, '').slice(0, 100) || 'dokumen'
  return `${documentId}/${globalThis.crypto.randomUUID()}-${safeName}`
}

function validatePage(page: number) {
  if (!Number.isSafeInteger(page) || page < 0 || page > 10000) throw new Error('Halaman dokumen tidak valid.')
}

export async function unduhBerkasDokumen(client: SupabaseClient, documentId: string, filePath: string): Promise<Blob> {
  const [folder, objectName, ...extra] = filePath.split('/')
  if (!documentId.trim() || documentId.includes('/') || folder !== documentId
    || !objectName || objectName === '.' || objectName === '..' || extra.length > 0) {
    throw new Error('Lokasi berkas dokumen tidak valid.')
  }
  const { data, error } = await client.storage.from('school-documents').download(filePath, {}, { cache: 'no-store' })
  if (error) throw error
  return data
}

export async function daftarDokumenSekolah(client: SupabaseClient, page = 0, status?: SchoolDocumentStatus): Promise<{ items: SchoolDocument[]; hasMore: boolean }> {
  validatePage(page)
  let query = client.from('school_documents').select(documentColumns).order('updated_at', { ascending: false }).order('id', { ascending: false }).range(page * 25, page * 25 + 25)
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  const rows = (data ?? []) as SchoolDocument[]
  return { items: rows.slice(0, 25), hasMore: rows.length > 25 }
}

export async function daftarKategoriDokumen(client: SupabaseClient): Promise<SchoolDocumentCategory[]> {
  const { data, error } = await client.from('document_categories').select('key,label,is_active').eq('is_active', true).order('key')
  if (error) throw error
  return (data ?? []) as SchoolDocumentCategory[]
}

export async function buatDrafDokumenSekolah(client: SupabaseClient, input: {
  category: DocumentCategory
  title: string
  description?: string
  file: File
}): Promise<SchoolDocument> {
  const title = input.title.trim()
  const description = input.description?.trim() ?? ''
  if (!['ksp', 'rkt', 'rkas', 'sk', 'administration', 'other'].includes(input.category)
    || !title || Array.from(title).length > 160 || Array.from(description).length > 2000) {
    throw new Error('Kategori, judul, atau keterangan dokumen tidak valid.')
  }
  validateDocumentFile(input.file)
  const id = globalThis.crypto.randomUUID()
  const filePath = createFilePath(id, input.file)
  const { data: draftData, error: draftError } = await client.from('school_documents').insert({
    id, category: input.category, title, description, file_path: filePath, mime_type: input.file.type, file_size: input.file.size,
  }).select(documentColumns).single()
  if (draftError) throw draftError
  const draft = draftData as SchoolDocument
  const { error: uploadError } = await client.storage.from('school-documents').upload(filePath, input.file, { contentType: input.file.type, upsert: false })
  if (uploadError) {
    const { error: cleanupError } = await client.rpc('discard_unuploaded_school_document_draft', { target_id: draft.id, expected_revision: draft.revision })
    if (cleanupError) throw new Error('Upload gagal dan pembersihan draf belum dapat dikonfirmasi; hubungi operator.')
    throw uploadError
  }
  return draft
}

export async function tambahVersiDokumenSekolah(client: SupabaseClient, documentId: string, expectedRevision: number, file: File): Promise<SchoolDocument> {
  if (!documentId.trim() || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('Identitas revisi dokumen tidak valid.')
  validateDocumentFile(file)
  const { data: currentData, error: currentError } = await client.from('school_documents').select(documentColumns).eq('id', documentId).single()
  if (currentError) throw currentError
  const current = currentData as SchoolDocument
  const filePath = createFilePath(current.id, file)
  const { error: uploadError } = await client.storage.from('school-documents').upload(filePath, file, { contentType: file.type, upsert: false })
  if (uploadError) throw uploadError
  const { data, error } = await client.from('school_documents')
    .update({ file_path: filePath, mime_type: file.type, file_size: file.size, revision: expectedRevision + 1 })
    .eq('id', documentId).eq('revision', expectedRevision).select(documentColumns).single()
  if (error) {
    const { error: cleanupError } = await client.storage.from('school-documents').remove([filePath])
    if (cleanupError) throw new Error('Penyimpanan versi gagal dan berkas sementara tidak dapat dibersihkan; hubungi operator.')
    throw error
  }
  return data as SchoolDocument
}

export async function riwayatVersiDokumen(client: SupabaseClient, documentId: string): Promise<SchoolDocumentVersion[]> {
  if (!documentId.trim()) throw new Error('Identitas dokumen tidak valid.')
  const { data, error } = await client.from('document_versions').select('id,document_id,version_number,file_path,mime_type,file_size,uploaded_by,created_at')
    .eq('document_id', documentId).order('version_number', { ascending: false })
  if (error) throw error
  return (data ?? []) as SchoolDocumentVersion[]
}

export async function riwayatTinjauanDokumen(client: SupabaseClient, documentId: string): Promise<SchoolDocumentReview[]> {
  if (!documentId.trim()) throw new Error('Identitas dokumen tidak valid.')
  const { data, error } = await client.from('document_reviews').select('id,document_id,reviewer_profile_id,from_status,to_status,note,created_at')
    .eq('document_id', documentId).order('created_at', { ascending: false }).order('id', { ascending: false })
  if (error) throw error
  return (data ?? []) as SchoolDocumentReview[]
}

export async function tindakLanjutDokumen(client: SupabaseClient, documentId: string, revision: number, status: 'submitted' | 'approved' | 'needs_revision' | 'archived', reviewNote = ''): Promise<SchoolDocument> {
  if (!documentId.trim() || !Number.isSafeInteger(revision) || revision < 0) throw new Error('Identitas revisi dokumen tidak valid.')
  const trimmed = reviewNote.trim()
  if (status === 'needs_revision' && (trimmed.length < 5 || Array.from(trimmed).length > 2000)) {
    throw new Error('Catatan revisi wajib diisi, minimal 5 karakter dan maksimal 2.000 karakter.')
  }
  const patch: { status: SchoolDocumentStatus; revision: number; review_note?: string } = { status, revision: revision + 1 }
  if (status === 'approved' || status === 'needs_revision') patch.review_note = trimmed
  const { data, error } = await client.from('school_documents').update(patch)
    .eq('id', documentId).eq('revision', revision).select(documentColumns).single()
  if (error) throw error
  return data as SchoolDocument
}
