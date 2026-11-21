import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../components/auth/auth-context'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { TruncationNotice } from '../../components/ui/TruncationNotice'
import { supabase } from '../../lib/supabase'
import { schoolToday } from '../../utils/date'
import { canCheckInTeacherAttendance, canReadTeacherAttendance, canReviewTeacherAttendance, isPrincipal, isTeacher } from '../../utils/permissions'
import {
  ajukanKoreksiAbsensiGuru,
  catatAbsensiGuru,
  daftarAbsensiGuru,
  daftarKoreksiAbsensiGuru,
  tinjauKoreksiAbsensiGuru,
  type TeacherAttendance,
  type TeacherAttendanceCorrection,
} from './api/teacher-attendance'

const statusLabels: Record<TeacherAttendanceCorrection['status'], string> = {
  pending: 'Menunggu persetujuan',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

function jakartaDate(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

function jakartaIso(value: string) {
  return value ? new Date(`${value}:00+07:00`).toISOString() : null
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00+07:00`).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) : '—'
}

function formatMoment(value: string) {
  return new Date(value).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })
}

type PageState =
  | { state: 'loading' }
  | { state: 'denied' }
  | { state: 'error'; message: string }
  | { state: 'ready'; role: string; items: TeacherAttendance[]; hasMore: boolean; corrections: TeacherAttendanceCorrection[]; correctionsHasMore: boolean }

type CorrectionStatus = TeacherAttendanceCorrection['status']

export function TeacherAttendance() {
  const { session } = useAuth()
  const [pageState, setPageState] = useState<PageState>({ state: 'loading' })
  const [from, setFrom] = useState(jakartaDate(-13))
  const [through, setThrough] = useState(jakartaDate())
  const [appliedFrom, setAppliedFrom] = useState(from)
  const [appliedThrough, setAppliedThrough] = useState(through)
  const [page, setPage] = useState(0)
  const [correctionPage, setCorrectionPage] = useState(0)
  const [correctionStatus, setCorrectionStatus] = useState<CorrectionStatus>('pending')
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState('')
  const [requests, setRequests] = useState<Partial<Record<'check_in' | 'check_out', string>>>({})
  const [correctionRequest, setCorrectionRequest] = useState<{ request_id: string; attendance_on: string; proposed_check_in_at: string; proposed_check_out_at: string; reason: string } | null>(null)
  const [error, setError] = useState('')
  const [rangeError, setRangeError] = useState('')
  const [success, setSuccess] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})

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
        if (!canReadTeacherAttendance(role)) {
          if (active) setPageState({ state: 'denied' })
          return
        }

        const [attendance, corrections] = await Promise.all([
          daftarAbsensiGuru(client, appliedFrom, appliedThrough, page),
          daftarKoreksiAbsensiGuru(client, correctionStatus, correctionPage),
        ])
        if (!active) return
        setPageState({
          state: 'ready', role: role as string,
          items: attendance.items, hasMore: attendance.hasMore,
          corrections: corrections.items, correctionsHasMore: corrections.hasMore,
        })
      } catch {
        if (active) setPageState({ state: 'error', message: 'Absensi guru belum dapat dimuat. Silakan coba lagi.' })
      }
    }

    void load()
    return () => { active = false }
  }, [appliedFrom, appliedThrough, attempt, correctionPage, correctionStatus, page, session])

  function refresh() {
    setPageState({ state: 'loading' })
    setError('')
    setSuccess('')
    setCorrectionPage(0)
    setCorrectionStatus('pending')
    setAttempt(value => value + 1)
  }

  function applyRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!from || !through || from > through) {
      setRangeError('Tanggal awal harus sebelum atau sama dengan tanggal akhir.')
      return
    }
    setRangeError('')
    setError('')
    setSuccess('')
    setPageState({ state: 'loading' })
    setPage(0)
    setAppliedFrom(from)
    setAppliedThrough(through)
  }

  function changePage(next: number) {
    setPageState({ state: 'loading' })
    setError('')
    setPage(next)
  }

  function changeCorrectionView(status: CorrectionStatus) {
    setPageState({ state: 'loading' })
    setError('')
    setCorrectionStatus(status)
    setCorrectionPage(0)
  }

  async function record(action: 'check_in' | 'check_out') {
    const client = supabase
    if (!client || pageState.state !== 'ready' || !canCheckInTeacherAttendance(pageState.role) || busy) return
    const requestId = requests[action] ?? crypto.randomUUID()

    setBusy(action)
    setError('')
    setSuccess('')
    setRequests(current => ({ ...current, [action]: requestId }))
    try {
      const updated = await catatAbsensiGuru(client, action, requestId)
      setRequests(current => ({ ...current, [action]: undefined }))
      setPageState(current => {
        if (current.state !== 'ready') return current
        const exists = current.items.some(row => row.id === updated.id)
        return { ...current, items: exists ? current.items.map(row => row.id === updated.id ? updated : row) : [updated, ...current.items] }
      })
      setSuccess(action === 'check_in' ? 'Absen masuk tercatat.' : 'Absen keluar tercatat.')
    } catch {
      setError(`Absen ${action === 'check_in' ? 'masuk' : 'keluar'} belum terkonfirmasi. ID permintaan dipertahankan; coba lagi dengan tombol yang sama.`)
    } finally {
      setBusy('')
    }
  }

  async function submitCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const client = supabase
    if (!client || pageState.state !== 'ready' || !canCheckInTeacherAttendance(pageState.role) || busy) return
    const request = correctionRequest ?? { request_id: crypto.randomUUID(), attendance_on: '', proposed_check_in_at: '', proposed_check_out_at: '', reason: '' }
    if (!request.attendance_on) { setError('Pilih tanggal absensi yang akan dikoreksi.'); return }
    if (!request.proposed_check_in_at && !request.proposed_check_out_at) { setError('Isi minimal satu usulan jam masuk atau jam keluar.'); return }
    if (request.reason.trim().length < 5) { setError('Alasan koreksi wajib diisi minimal 5 karakter.'); return }

    setBusy('correction')
    setError('')
    setSuccess('')
    setCorrectionRequest(request)
    try {
      await ajukanKoreksiAbsensiGuru(client, {
        request_id: request.request_id,
        attendance_on: request.attendance_on,
        proposed_check_in_at: jakartaIso(request.proposed_check_in_at),
        proposed_check_out_at: jakartaIso(request.proposed_check_out_at),
        reason: request.reason,
      })
      setCorrectionRequest(null)
      setSuccess('Koreksi absensi diajukan dan menunggu persetujuan kepala sekolah.')
      setAttempt(value => value + 1)
    } catch {
      setError('Koreksi belum terkonfirmasi. Isian dan ID permintaan dipertahankan; coba lagi dengan tombol yang sama.')
    } finally {
      setBusy('')
    }
  }

  async function review(item: TeacherAttendanceCorrection, decision: 'approved' | 'rejected') {
    const client = supabase
    if (!client || pageState.state !== 'ready' || !canReviewTeacherAttendance(pageState.role) || busy) return
    const note = (notes[item.id] ?? '').trim()

    setBusy(`review:${item.id}`)
    setError('')
    setSuccess('')
    try {
      const updated = await tinjauKoreksiAbsensiGuru(client, item.id, item.revision, decision, note)
      setPageState(current => current.state === 'ready'
        ? { ...current, corrections: current.corrections.map(row => row.id === updated.id ? updated : row) }
        : current)
      setNotes(current => ({ ...current, [item.id]: '' }))
      setSuccess(decision === 'approved' ? 'Koreksi absensi disetujui.' : 'Koreksi absensi ditolak; absensi tidak berubah.')
    } catch {
      setError('Keputusan belum tersimpan. Muat ulang daftar bila koreksi sudah berubah di tab lain, lalu coba lagi.')
    } finally {
      setBusy('')
    }
  }

  const heading = <div className="board-heading"><div><div className="eyebrow">KEHADIRAN GURU</div><h1>Absensi guru</h1><p>Catat jam masuk dan keluar; koreksi diajukan guru dan disetujui kepala sekolah.</p></div></div>

  if (pageState.state === 'loading') return <section className="board teacher-attendance">{heading}<LoadingState /></section>
  if (pageState.state === 'denied') return <section className="board teacher-attendance">{heading}<EmptyState>Halaman ini tersedia untuk guru, kepala sekolah, dan administrator.</EmptyState></section>
  if (pageState.state === 'error') return <section className="board teacher-attendance">{heading}<ErrorNotice onRetry={refresh}>{pageState.message}</ErrorNotice></section>

  const { role, items, hasMore, corrections, correctionsHasMore } = pageState
  const recorder = canCheckInTeacherAttendance(role)
  const reviewer = canReviewTeacherAttendance(role)
  const today = schoolToday()
  const todayRow = items.find(row => row.attendance_on === today)

  return <section className="board teacher-attendance">
    {heading}
    {success && <p className="status" role="status">{success}</p>}
    {error && <p className="error" role="alert">{error}</p>}

    {recorder && <section aria-labelledby="teacher-today">
      <h2 id="teacher-today">Absensi hari ini</h2>
      <p className="help">{formatDate(today)} — masuk {formatTime(todayRow?.check_in_at ?? null)}, keluar {formatTime(todayRow?.check_out_at ?? null)}.</p>
      <div className="button-row">
        <button className="button" type="button" disabled={Boolean(busy)} onClick={() => void record('check_in')}>
          {busy === 'check_in' ? 'Mencatat…' : requests.check_in ? 'Kirim ulang absen masuk' : 'Absen masuk'}
        </button>
        <button className="button secondary" type="button" disabled={Boolean(busy)} onClick={() => void record('check_out')}>
          {busy === 'check_out' ? 'Mencatat…' : requests.check_out ? 'Kirim ulang absen keluar' : 'Absen keluar'}
        </button>
      </div>
    </section>}

    {recorder && <form className="announcement-editor" onSubmit={submitCorrection}>
      <h2>Ajukan koreksi</h2>
      <label htmlFor="correction-day">Tanggal absensi</label>
      <select id="correction-day" value={correctionRequest?.attendance_on ?? ''} disabled={Boolean(busy)} onChange={event => setCorrectionRequest(current => ({ request_id: current?.request_id ?? crypto.randomUUID(), proposed_check_in_at: current?.proposed_check_in_at ?? '', proposed_check_out_at: current?.proposed_check_out_at ?? '', reason: current?.reason ?? '', attendance_on: event.target.value }))}>
        <option value="">Pilih tanggal</option>
        {items.map(row => <option key={row.id} value={row.attendance_on}>{formatDate(row.attendance_on)}</option>)}
      </select>
      <label htmlFor="correction-in">Usulan jam masuk</label>
      <input id="correction-in" type="datetime-local" value={correctionRequest?.proposed_check_in_at ?? ''} disabled={Boolean(busy)} onChange={event => setCorrectionRequest(current => ({ request_id: current?.request_id ?? crypto.randomUUID(), attendance_on: current?.attendance_on ?? '', proposed_check_out_at: current?.proposed_check_out_at ?? '', reason: current?.reason ?? '', proposed_check_in_at: event.target.value }))} />
      <label htmlFor="correction-out">Usulan jam keluar</label>
      <input id="correction-out" type="datetime-local" value={correctionRequest?.proposed_check_out_at ?? ''} disabled={Boolean(busy)} onChange={event => setCorrectionRequest(current => ({ request_id: current?.request_id ?? crypto.randomUUID(), attendance_on: current?.attendance_on ?? '', proposed_check_in_at: current?.proposed_check_in_at ?? '', reason: current?.reason ?? '', proposed_check_out_at: event.target.value }))} />
      <label htmlFor="correction-reason">Alasan koreksi</label>
      <textarea id="correction-reason" rows={3} maxLength={1000} value={correctionRequest?.reason ?? ''} disabled={Boolean(busy)} onChange={event => setCorrectionRequest(current => ({ request_id: current?.request_id ?? crypto.randomUUID(), attendance_on: current?.attendance_on ?? '', proposed_check_in_at: current?.proposed_check_in_at ?? '', proposed_check_out_at: current?.proposed_check_out_at ?? '', reason: event.target.value }))} placeholder="Contoh: lupa mencatat jam keluar setelah rapat." />
      <div className="button-row">
        <button className="button" type="submit" disabled={Boolean(busy)}>{busy === 'correction' ? 'Mengajukan…' : correctionRequest ? 'Kirim ulang koreksi' : 'Ajukan koreksi'}</button>
      </div>
    </form>}
    {!recorder && <p className="help">{reviewer ? 'Kepala sekolah menyetujui atau menolak koreksi absensi guru di bawah ini.' : 'Administrator melihat catatan absensi guru tanpa tindakan perubahan.'}</p>}

    <section aria-labelledby="teacher-attendance-list">
      <h2 id="teacher-attendance-list">Riwayat absensi</h2>
      <form className="board-heading" onSubmit={applyRange}>
        <label htmlFor="attendance-from">Dari</label>
        <input id="attendance-from" type="date" value={from} max={through} disabled={Boolean(busy)} onChange={event => setFrom(event.target.value)} />
        <label htmlFor="attendance-through">Sampai</label>
        <input id="attendance-through" type="date" value={through} min={from} disabled={Boolean(busy)} onChange={event => setThrough(event.target.value)} />
        <button className="button secondary" type="submit" disabled={Boolean(busy)}>Terapkan rentang</button>
      </form>
      {rangeError && <p className="error" role="alert">{rangeError}</p>}
      {items.length === 0
        ? <EmptyState>{page > 0 ? 'Tidak ada absensi pada halaman ini.' : 'Belum ada absensi guru pada rentang tanggal ini.'}</EmptyState>
        : <div className="announcement-list">{items.map(row => <article className="announcement" key={row.id}>
          <div className="announcement-meta">
            <time dateTime={row.attendance_on}>{formatDate(row.attendance_on)}</time>
            <span className="badge">Masuk {formatTime(row.check_in_at)}</span>
            <span className="badge">Keluar {formatTime(row.check_out_at)}</span>
          </div>
          <p className="help">Revisi {row.revision}. Waktu ditampilkan dalam zona Asia/Jakarta.</p>
        </article>)}</div>}
      <TruncationNotice hasMore={hasMore}/>
      <nav className="pagination" aria-label="Halaman riwayat absensi guru">
        <button className="text-button" type="button" disabled={page === 0 || Boolean(busy)} onClick={() => changePage(page - 1)}>Sebelumnya</button>
        <span aria-live="polite">Halaman {page + 1}</span>
        <button className="text-button" type="button" disabled={!hasMore || Boolean(busy)} onClick={() => changePage(page + 1)}>Berikutnya</button>
      </nav>
    </section>

    <section aria-labelledby="teacher-corrections">
      <h2 id="teacher-corrections">{isTeacher(role) ? 'Koreksi saya' : 'Koreksi masuk'}</h2>
      <label htmlFor="correction-status">Saring status koreksi</label>
      <select id="correction-status" value={correctionStatus} disabled={Boolean(busy)} onChange={event => changeCorrectionView(event.target.value as CorrectionStatus)}>
        <option value="pending">Menunggu persetujuan</option>
        <option value="approved">Disetujui</option>
        <option value="rejected">Ditolak</option>
      </select>
      {corrections.length === 0
        ? <EmptyState>{correctionPage > 0 ? 'Tidak ada koreksi pada halaman ini.' : 'Belum ada koreksi dengan status ini.'}</EmptyState>
        : <div className="announcement-list">{corrections.map(item => <article className="announcement" key={item.id}>
          <div className="announcement-meta">
            <time dateTime={item.created_at}>{formatMoment(item.created_at)}</time>
            <span className="badge">{statusLabels[item.status]}</span>
          </div>
          <p className="announcement-body">{item.reason}</p>
          <p className="help">Usulan masuk {item.proposed_check_in_at ? formatTime(item.proposed_check_in_at) : '—'}, keluar {item.proposed_check_out_at ? formatTime(item.proposed_check_out_at) : '—'}.{item.review_note ? ` Catatan kepala sekolah: ${item.review_note}` : ''}</p>
          {isPrincipal(role) && item.status === 'pending' && <div className="announcement-editor">
            <label htmlFor={`correction-note-${item.id}`}>Catatan keputusan untuk koreksi ini</label>
            <textarea id={`correction-note-${item.id}`} rows={2} maxLength={1000} value={notes[item.id] ?? ''} disabled={Boolean(busy)} onChange={event => setNotes(current => ({ ...current, [item.id]: event.target.value }))} />
            <div className="button-row">
              <button className="button" type="button" disabled={Boolean(busy)} onClick={() => void review(item, 'approved')}>{busy === `review:${item.id}` ? 'Menyimpan…' : 'Setujui koreksi'}</button>
              <button className="button secondary" type="button" disabled={Boolean(busy)} onClick={() => void review(item, 'rejected')}>Tolak koreksi</button>
            </div>
          </div>}
        </article>)}</div>}
      <TruncationNotice hasMore={correctionsHasMore}/>
      <nav className="pagination" aria-label="Halaman koreksi absensi guru">
        <button className="text-button" type="button" disabled={correctionPage === 0 || Boolean(busy)} onClick={() => setCorrectionPage(correctionPage - 1)}>Sebelumnya</button>
        <span aria-live="polite">Halaman {correctionPage + 1}</span>
        <button className="text-button" type="button" disabled={!correctionsHasMore || Boolean(busy)} onClick={() => setCorrectionPage(correctionPage + 1)}>Berikutnya</button>
      </nav>
    </section>
  </section>
}
