import { useEffect, useState } from 'react'
import { useAuth } from '../../components/auth/auth-context'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { TruncationNotice } from '../../components/ui/TruncationNotice'
import { supabase } from '../../lib/supabase'
import { daftarNotifikasi, tandaiNotifikasiDibaca, type Notification } from './api'

const categoryLabels: Record<Notification['category'], string> = {
  announcement: 'Pengumuman',
  absence_report: 'Laporan ketidakhadiran',
  supervision: 'Supervisi',
  assessment: 'Asesmen',
  document: 'Dokumen sekolah',
  teaching_module: 'Modul ajar',
  communication: 'Komunikasi',
  system: 'Sistem',
}

const priorityLabels: Record<Notification['priority'], string> = {
  normal: 'Biasa',
  important: 'Penting',
  urgent: 'Mendesak',
}

type PageState =
  | { state: 'loading' }
  | { state: 'denied' }
  | { state: 'error'; message: string }
  | { state: 'ready'; items: Notification[]; hasMore: boolean }

function formatTime(value: string) {
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

export function NotificationCenter() {
  const { session } = useAuth()
  const [pageState, setPageState] = useState<PageState>({ state: 'loading' })
  const [page, setPage] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [pendingId, setPendingId] = useState('')
  const [saveError, setSaveError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const client = supabase
    if (!client || !session) {
      setPageState({ state: 'denied' })
      return
    }

    let active = true
    const load = async () => {
      try {
        const result = await daftarNotifikasi(client, page)
        if (!active) return
        setPageState({ state: 'ready', items: result.items, hasMore: result.hasMore })
      } catch {
        if (active) setPageState({ state: 'error', message: 'Pusat notifikasi belum dapat dimuat. Silakan coba lagi.' })
      }
    }

    void load()
    return () => { active = false }
  }, [attempt, page, session])

  function refresh() {
    setPageState({ state: 'loading' })
    setSaveError('')
    setSuccess('')
    setAttempt(value => value + 1)
  }

  function changePage(next: number) {
    setPageState({ state: 'loading' })
    setSaveError('')
    setSuccess('')
    setPage(next)
  }

  async function markRead(item: Notification) {
    const client = supabase
    if (!client || pageState.state !== 'ready' || pendingId) return
    if (item.read_at) return

    setPendingId(item.id)
    setSaveError('')
    setSuccess('')
    try {
      const updated = await tandaiNotifikasiDibaca(client, item.id)
      setPageState(current => current.state === 'ready'
        ? { ...current, items: current.items.map(row => row.id === updated.id ? updated : row) }
        : current)
      setSuccess(`Notifikasi “${item.title}” ditandai sudah dibaca.`)
    } catch {
      setSaveError(`Status baca “${item.title}” belum tersimpan. Notifikasi yang sama dapat dicoba lagi tanpa kehilangan data.`)
    } finally {
      setPendingId('')
    }
  }

  const heading = <div className="board-heading"><div><div className="eyebrow">PESAN PRIBADI</div><h1>Pusat notifikasi</h1><p>Kabar pengumuman, ketidakhadiran, supervisi, dan asesmen yang ditujukan untuk Anda.</p></div></div>

  if (pageState.state === 'loading') return <section className="board notification-page">{heading}<LoadingState /></section>
  if (pageState.state === 'denied') return <section className="board notification-page">{heading}<EmptyState>Pusat notifikasi tersedia setelah Anda masuk dengan akun sekolah yang terhubung.</EmptyState></section>
  if (pageState.state === 'error') return <section className="board notification-page">{heading}<ErrorNotice onRetry={refresh}>{pageState.message}</ErrorNotice></section>

  const { items, hasMore } = pageState
  const unreadCount = items.filter(item => !item.read_at).length

  return <section className="board notification-page">
    {heading}
    <p className="help" role="status">{unreadCount > 0
      ? `${unreadCount} notifikasi belum dibaca pada halaman ini.`
      : items.length > 0 ? 'Semua notifikasi pada halaman ini sudah dibaca.' : ''}</p>
    {success && <p className="status" role="status">{success}</p>}
    {saveError && <p className="error" role="alert">{saveError}</p>}
    {items.length === 0
      ? <EmptyState>{page > 0 ? 'Tidak ada notifikasi pada halaman ini.' : 'Belum ada notifikasi untuk akun Anda.'}</EmptyState>
      : <div className="announcement-list">{items.map(item => <article className="announcement" key={item.id}>
        <div className="announcement-meta">
          <time dateTime={item.created_at}>{formatTime(item.created_at)}</time>
          <span>{priorityLabels[item.priority]}</span>
          <span className="badge">{categoryLabels[item.category]}</span>
          {!item.read_at && <span className="badge">Belum dibaca</span>}
        </div>
        <h2>{item.title}</h2>
        <p className="announcement-body">{item.body}</p>
        {!item.read_at && <button className="text-button" type="button" disabled={Boolean(pendingId)} onClick={() => void markRead(item)}>
          {pendingId === item.id ? 'Menyimpan status…' : 'Tandai sudah dibaca'}
        </button>}
        {item.read_at && <p className="help">Dibaca <time dateTime={item.read_at}>{formatTime(item.read_at)}</time></p>}
      </article>)}</div>}
    <TruncationNotice hasMore={hasMore}/>
    <nav className="pagination" aria-label="Halaman notifikasi">
      <button className="text-button" type="button" disabled={page === 0 || Boolean(pendingId)} onClick={() => changePage(page - 1)}>Sebelumnya</button>
      <span aria-live="polite">Halaman {page + 1}</span>
      <button className="text-button" type="button" disabled={!hasMore || Boolean(pendingId)} onClick={() => changePage(page + 1)}>Berikutnya</button>
    </nav>
  </section>
}
