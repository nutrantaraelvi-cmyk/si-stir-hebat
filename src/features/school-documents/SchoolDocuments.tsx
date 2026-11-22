import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../components/auth/auth-context'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { TruncationNotice } from '../../components/ui/TruncationNotice'
import { supabase } from '../../lib/supabase'
import { canReadSchoolDocuments, canReviewSchoolDocuments, canUploadSchoolDocuments, isPrincipal, isTeacher } from '../../utils/permissions'
import {
  buatDrafDokumenSekolah,
  daftarDokumenSekolah,
  daftarKategoriDokumen,
  riwayatTinjauanDokumen,
  riwayatVersiDokumen,
  tambahVersiDokumenSekolah,
  tindakLanjutDokumen,
  unduhBerkasDokumen,
  type DocumentCategory,
  type SchoolDocument,
  type SchoolDocumentCategory,
  type SchoolDocumentReview,
  type SchoolDocumentStatus,
  type SchoolDocumentVersion,
} from './api'

const statusLabels: Record<SchoolDocumentStatus, string> = {
  draft: 'Draf',
  submitted: 'Menunggu persetujuan',
  approved: 'Disetujui',
  needs_revision: 'Perlu revisi',
  archived: 'Diarsipkan',
}

const fallbackCategories: SchoolDocumentCategory[] = [
  { key: 'ksp', label: 'Kurikulum Satuan Pendidikan (KSP)', is_active: true },
  { key: 'rkt', label: 'Rencana Kerja Tahunan (RKT)', is_active: true },
  { key: 'rkas', label: 'Rencana Kegiatan dan Anggaran (RKAS)', is_active: true },
  { key: 'sk', label: 'Surat Keputusan (SK)', is_active: true },
  { key: 'administration', label: 'Administrasi sekolah', is_active: true },
  { key: 'other', label: 'Dokumen lain', is_active: true },
]

const acceptedFiles = '.pdf,.jpg,.jpeg,.png,.docx,.xlsx'
const maxFileHelp = 'PDF, JPEG, PNG, DOCX, atau XLSX; maksimal 10 MB.'

type PageState =
  | { state: 'loading' }
  | { state: 'denied' }
  | { state: 'error'; message: string }
  | { state: 'ready'; role: string; categories: SchoolDocumentCategory[]; items: SchoolDocument[]; hasMore: boolean }

type HistoryState = { versions: SchoolDocumentVersion[]; reviews: SchoolDocumentReview[] }

function formatDate(value: string) {
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function originalFileName(filePath: string) {
  return (filePath.split('/').pop() ?? 'dokumen').replace(/^[0-9a-f-]{36}-/i, '') || 'dokumen'
}

function categoryLabel(categories: SchoolDocumentCategory[], key: DocumentCategory) {
  return categories.find(category => category.key === key)?.label ?? key.toUpperCase()
}

export function SchoolDocuments() {
  const { session } = useAuth()
  const [pageState, setPageState] = useState<PageState>({ state: 'loading' })
  const [page, setPage] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'' | SchoolDocumentStatus>('')
  const [category, setCategory] = useState<DocumentCategory>('ksp')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState('')
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [success, setSuccess] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [versionFiles, setVersionFiles] = useState<Record<string, File | null>>({})
  const [history, setHistory] = useState<Record<string, HistoryState>>({})
  const [historyLoading, setHistoryLoading] = useState('')
  const [archiveTarget, setArchiveTarget] = useState<SchoolDocument | null>(null)

  useEffect(() => {
    const client = supabase
    if (!client || !session) {
      setPageState({ state: 'denied' })
      return
    }

    let active = true
    const load = async () => {
      try {
        const profile = await client.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
        if (profile.error) throw profile.error
        const role = profile.data?.role
        if (!canReadSchoolDocuments(role)) {
          if (active) setPageState({ state: 'denied' })
          return
        }

        const [categories, documents] = await Promise.all([
          daftarKategoriDokumen(client).catch(() => fallbackCategories),
          daftarDokumenSekolah(client, page, statusFilter || undefined),
        ])
        if (!active) return
        setPageState({ state: 'ready', role: role as string, categories, items: documents.items, hasMore: documents.hasMore })
        setHistory({})
      } catch {
        if (active) setPageState({ state: 'error', message: 'Dokumen sekolah belum dapat dimuat. Silakan coba lagi.' })
      }
    }

    void load()
    return () => { active = false }
  }, [attempt, page, session, statusFilter])

  function refresh() {
    setPageState({ state: 'loading' })
    setActionError('')
    setFormError('')
    setSuccess('')
    setAttempt(value => value + 1)
  }

  function changePage(next: number) {
    setPageState({ state: 'loading' })
    setActionError('')
    setSuccess('')
    setPage(next)
  }

  function changeFilter(next: '' | SchoolDocumentStatus) {
    setPageState({ state: 'loading' })
    setActionError('')
    setSuccess('')
    setPage(0)
    setStatusFilter(next)
  }

  async function uploadDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const client = supabase
    if (!client || pageState.state !== 'ready' || !canUploadSchoolDocuments(pageState.role) || busy) return
    if (!file) { setFormError('Pilih berkas dokumen terlebih dahulu.'); return }

    setBusy('draft')
    setFormError('')
    setSuccess('')
    try {
      await buatDrafDokumenSekolah(client, { category, title, description, file })
      setTitle('')
      setDescription('')
      setFile(null)
      setSuccess('Draf dokumen tersimpan. Ajukan persetujuan setelah berkas siap diperiksa kepala sekolah.')
      setAttempt(value => value + 1)
    } catch {
      setFormError('Draf belum tersimpan. Berkas dan isian tetap di layar; periksa format lalu coba lagi.')
    } finally {
      setBusy('')
    }
  }

  async function advance(item: SchoolDocument, status: 'submitted' | 'approved' | 'needs_revision' | 'archived') {
    const client = supabase
    if (!client || pageState.state !== 'ready' || busy) return
    const note = (notes[item.id] ?? '').trim()
    if (status === 'needs_revision' && note.length < 5) {
      setActionError(`Catatan revisi untuk “${item.title}” wajib diisi minimal 5 karakter.`)
      setSuccess('')
      return
    }

    setBusy(`${status}:${item.id}`)
    setActionError('')
    setSuccess('')
    try {
      const updated = await tindakLanjutDokumen(client, item.id, item.revision, status, note)
      setPageState(current => current.state === 'ready'
        ? { ...current, items: current.items.map(row => row.id === updated.id ? updated : row) }
        : current)
      setNotes(current => ({ ...current, [item.id]: '' }))
      setHistory(current => { const next = { ...current }; delete next[item.id]; return next })
      setSuccess(status === 'submitted'
        ? 'Dokumen diajukan untuk persetujuan kepala sekolah.'
        : status === 'approved'
          ? 'Dokumen disetujui.'
          : status === 'needs_revision'
            ? 'Dokumen dikembalikan dengan catatan revisi.'
            : 'Dokumen diarsipkan.')
    } catch {
      setActionError(`Tindakan untuk “${item.title}” belum tersimpan. Muat ulang daftar bila dokumen sudah berubah di tab lain, lalu coba lagi.`)
    } finally {
      setBusy('')
    }
  }

  async function uploadVersion(item: SchoolDocument) {
    const client = supabase
    if (!client || busy) return
    const nextFile = versionFiles[item.id]
    if (!nextFile) { setActionError(`Pilih berkas pengganti untuk “${item.title}” terlebih dahulu.`); return }

    setBusy(`version:${item.id}`)
    setActionError('')
    setSuccess('')
    try {
      const updated = await tambahVersiDokumenSekolah(client, item.id, item.revision, nextFile)
      setPageState(current => current.state === 'ready'
        ? { ...current, items: current.items.map(row => row.id === updated.id ? updated : row) }
        : current)
      setVersionFiles(current => ({ ...current, [item.id]: null }))
      setHistory(current => { const next = { ...current }; delete next[item.id]; return next })
      setSuccess(`Versi baru untuk “${item.title}” tersimpan.`)
    } catch {
      setActionError(`Versi baru untuk “${item.title}” belum tersimpan. Berkas pengganti tetap dipilih; coba lagi.`)
    } finally {
      setBusy('')
    }
  }

  async function toggleHistory(item: SchoolDocument) {
    const client = supabase
    if (!client || historyLoading) return
    if (history[item.id]) {
      setHistory(current => { const next = { ...current }; delete next[item.id]; return next })
      return
    }

    setHistoryLoading(item.id)
    setActionError('')
    try {
      const [versions, reviews] = await Promise.all([
        riwayatVersiDokumen(client, item.id),
        riwayatTinjauanDokumen(client, item.id),
      ])
      setHistory(current => ({ ...current, [item.id]: { versions, reviews } }))
    } catch {
      setActionError(`Riwayat “${item.title}” belum dapat dimuat. Coba lagi.`)
    } finally {
      setHistoryLoading('')
    }
  }

  async function downloadFile(item: SchoolDocument, filePath: string) {
    const client = supabase
    if (!client || busy) return
    setBusy(`download:${item.id}`)
    setActionError('')
    try {
      const blob = await unduhBerkasDokumen(client, item.id, filePath)
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = originalFileName(filePath)
      anchor.hidden = true
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch {
      setActionError(`Berkas “${item.title}” tidak dapat diunduh. Periksa akses dokumen atau coba lagi.`)
    } finally {
      setBusy('')
    }
  }

  const heading = <div className="board-heading"><div><div className="eyebrow">ADMINISTRASI DOKUMEN</div><h1>Dokumen sekolah</h1><p>Guru mengunggah dokumen miliknya; kepala sekolah memeriksa dan menyetujui.</p></div></div>

  if (pageState.state === 'loading') return <section className="board">{heading}<LoadingState /></section>
  if (pageState.state === 'denied') return <section className="board">{heading}<EmptyState>Halaman ini tersedia untuk guru, kepala sekolah, dan administrator.</EmptyState></section>
  if (pageState.state === 'error') return <section className="board">{heading}<ErrorNotice onRetry={refresh}>{pageState.message}</ErrorNotice></section>

  const { role, categories, items, hasMore } = pageState
  const uploader = canUploadSchoolDocuments(role)
  const reviewer = canReviewSchoolDocuments(role)
  const principal = isPrincipal(role)

  return <section className="board">
    {heading}
    {uploader && <form className="announcement-editor" onSubmit={uploadDraft}>
      <label htmlFor="document-category">Kategori</label>
      <select id="document-category" value={category} onChange={event => setCategory(event.target.value as DocumentCategory)} disabled={Boolean(busy)}>
        {categories.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
      </select>
      <label htmlFor="document-title">Judul dokumen</label>
      <input id="document-title" maxLength={160} value={title} onChange={event => setTitle(event.target.value)} disabled={Boolean(busy)} placeholder="Contoh: RKT 2026/2027" />
      <label htmlFor="document-description">Keterangan (opsional)</label>
      <textarea id="document-description" rows={3} maxLength={2000} value={description} onChange={event => setDescription(event.target.value)} disabled={Boolean(busy)} />
      <label htmlFor="document-file">Berkas</label>
      <input id="document-file" type="file" accept={acceptedFiles} disabled={Boolean(busy)} onChange={event => setFile(event.target.files?.[0] ?? null)} />
      <p className="help">{maxFileHelp}</p>
      <div className="button-row">
        <button className="button" type="submit" disabled={Boolean(busy) || !title.trim() || !file}>
          {busy === 'draft' ? 'Menyimpan…' : 'Simpan draf'}
        </button>
      </div>
      {formError && <p className="error" role="alert">{formError}</p>}
    </form>}
    {!uploader && <p className="help">{principal
      ? 'Anda memeriksa dokumen yang diajukan guru: setujui, kembalikan dengan catatan, atau arsipkan dokumen terbit.'
      : 'Administrator hanya melihat metadata teknis; persetujuan dokumen menjadi kewenangan kepala sekolah.'}</p>}
    {success && <p className="status" role="status">{success}</p>}
    {actionError && <p className="error" role="alert">{actionError}</p>}

    <section aria-labelledby="document-list">
      <h2 id="document-list">{isTeacher(role) ? 'Dokumen Anda' : 'Dokumen masuk'}</h2>
      <label htmlFor="document-status-filter">Saring status</label>
      <select id="document-status-filter" value={statusFilter} disabled={Boolean(busy)} onChange={event => changeFilter(event.target.value as '' | SchoolDocumentStatus)}>
        <option value="">Semua status</option>
        <option value="draft">Draf</option>
        <option value="submitted">Menunggu persetujuan</option>
        <option value="needs_revision">Perlu revisi</option>
        <option value="approved">Disetujui</option>
        <option value="archived">Diarsipkan</option>
      </select>
      {items.length === 0
        ? <EmptyState>{page > 0 ? 'Tidak ada dokumen pada halaman ini.' : statusFilter ? 'Tidak ada dokumen dengan status ini.' : 'Belum ada dokumen sekolah yang dapat Anda lihat.'}</EmptyState>
        : <div className="announcement-list">{items.map(item => {
          const busyRow = busy.endsWith(item.id)
          const note = notes[item.id] ?? ''
          const isOwner = isTeacher(role) && item.owner_profile_id === session?.user.id
          return <article className="announcement" key={item.id}>
            <div className="announcement-meta">
              <span className="badge">{categoryLabel(categories, item.category)}</span>
              <span className="badge">{statusLabels[item.status]}</span>
              <span>{formatSize(item.file_size)}</span>
              <time dateTime={item.updated_at}>{formatDate(item.updated_at)}</time>
            </div>
            <h3>{item.title}</h3>
            {item.description && <p className="announcement-body">{item.description}</p>}
            {item.review_note && <p className="help">Catatan pemeriksa: {item.review_note}</p>}
            <button className="text-button" type="button" disabled={Boolean(busy)} onClick={() => void downloadFile(item, item.file_path)}>
              {busy === `download:${item.id}` ? 'Mengunduh…' : 'Unduh berkas dokumen'}
            </button>
            {isOwner && (item.status === 'draft' || item.status === 'needs_revision') && <div className="announcement-editor">
              <label htmlFor={`version-file-${item.id}`}>Ganti berkas dengan versi baru</label>
              <input id={`version-file-${item.id}`} type="file" accept={acceptedFiles} disabled={Boolean(busy)} onChange={event => setVersionFiles(current => ({ ...current, [item.id]: event.target.files?.[0] ?? null }))} />
              <div className="button-row">
                <button className="button secondary" type="button" disabled={Boolean(busy)} onClick={() => void uploadVersion(item)}>
                  {busy === `version:${item.id}` ? 'Mengunggah…' : 'Unggah versi baru'}
                </button>
                <button className="button" type="button" disabled={Boolean(busy)} onClick={() => void advance(item, 'submitted')}>
                  {busy === `submitted:${item.id}` ? 'Mengajukan…' : 'Ajukan persetujuan'}
                </button>
              </div>
            </div>}
            {reviewer && item.status === 'submitted' && <div className="announcement-editor">
              <label htmlFor={`note-${item.id}`}>Catatan pemeriksa untuk {item.title}</label>
              <textarea id={`note-${item.id}`} rows={3} maxLength={2000} value={note} onChange={event => setNotes(current => ({ ...current, [item.id]: event.target.value }))} disabled={Boolean(busy)} placeholder="Wajib untuk pengembalian revisi (minimal 5 karakter)." />
              <div className="button-row">
                <button className="button" type="button" disabled={Boolean(busy)} onClick={() => void advance(item, 'approved')}>
                  {busy === `approved:${item.id}` ? 'Menyetujui…' : 'Setujui dokumen'}
                </button>
                <button className="button secondary" type="button" disabled={Boolean(busy)} onClick={() => void advance(item, 'needs_revision')}>
                  {busy === `needs_revision:${item.id}` ? 'Mengembalikan…' : 'Kembalikan dengan catatan'}
                </button>
              </div>
            </div>}
            {reviewer && item.status === 'approved' && <div className="button-row">
              <button className="button secondary" type="button" disabled={Boolean(busy)} onClick={() => setArchiveTarget(item)}>
                Arsipkan dokumen
              </button>
            </div>}
            <button className="text-button" type="button" disabled={Boolean(historyLoading) || busyRow} onClick={() => void toggleHistory(item)}>
              {historyLoading === item.id ? 'Memuat riwayat…' : history[item.id] ? 'Sembunyikan riwayat' : 'Lihat riwayat versi & tinjauan'}
            </button>
            {history[item.id] && <div className="help">
              <p>Versi berkas:</p>
              {history[item.id].versions.length === 0 ? <p>Belum ada catatan versi.</p> : <ul>
                {history[item.id].versions.map(version => <li key={version.id}>
                  Versi {version.version_number} ({formatSize(version.file_size)}, {formatDate(version.created_at)}){' '}
                  <button className="text-button" type="button" disabled={Boolean(busy)} onClick={() => void downloadFile(item, version.file_path)}>
                    Unduh versi {version.version_number}
                  </button>
                </li>)}
              </ul>}
              <p>Tinjauan: {history[item.id].reviews.length === 0 ? 'belum ada keputusan pemeriksaan.' : history[item.id].reviews.map(review => `${statusLabels[review.from_status]} → ${statusLabels[review.to_status]} (${formatDate(review.created_at)})${review.note ? `: ${review.note}` : ''}`).join('; ')}</p>
            </div>}
          </article>
        })}</div>}
      <TruncationNotice hasMore={hasMore}/>
      <nav className="pagination" aria-label="Halaman dokumen sekolah">
        <button className="text-button" type="button" disabled={page === 0 || Boolean(busy)} onClick={() => changePage(page - 1)}>Sebelumnya</button>
        <span aria-live="polite">Halaman {page + 1}</span>
        <button className="text-button" type="button" disabled={!hasMore || Boolean(busy)} onClick={() => changePage(page + 1)}>Berikutnya</button>
      </nav>
    </section>
    <ConfirmDialog
      open={Boolean(archiveTarget)}
      title="Arsipkan dokumen ini?"
      description={archiveTarget ? `“${archiveTarget.title}” akan berstatus Diarsipkan dan tidak dapat diajukan kembali.` : ''}
      confirmLabel="Ya, arsipkan"
      tone="danger"
      busy={Boolean(busy)}
      onCancel={() => setArchiveTarget(null)}
      onConfirm={() => {
        const target = archiveTarget
        if (!target) return
        void advance(target, 'archived').finally(() => setArchiveTarget(null))
      }}
    />
  </section>
}
