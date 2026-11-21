import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../components/auth/auth-context'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { TruncationNotice } from '../../components/ui/TruncationNotice'
import { supabase } from '../../lib/supabase'
import { schoolToday } from '../../utils/date'
import { canReadAbsenceReports, isParent, isTeacher } from '../../utils/permissions'
import {
  daftarLaporanKetidakhadiran,
  kirimLaporanKetidakhadiran,
  reviewLaporanKetidakhadiran,
  validateAbsenceReport,
  type GuardianAbsenceReport,
} from '../parents/api/absence-reports'

const statusLabels: Record<GuardianAbsenceReport['status'], string> = {
  submitted: 'Menunggu pemeriksaan guru',
  confirmed: 'Dikonfirmasi',
  rejected: 'Ditolak',
}

type StudentName = { id: string; name: string }
type Role = 'parent' | 'teacher' | 'principal' | 'administrator'

type PageState =
  | { state: 'loading' }
  | { state: 'denied' }
  | { state: 'error'; message: string }
  | { state: 'ready'; role: Role; students: StudentName[]; items: GuardianAbsenceReport[]; hasMore: boolean }

type PendingRequest = { request_id: string; student_id: string; report_date: string; reason: string }

function errorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code ?? '') : ''
}

export function AbsenceReports() {
  const { session } = useAuth()
  const [pageState, setPageState] = useState<PageState>({ state: 'loading' })
  const [page, setPage] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [studentId, setStudentId] = useState('')
  const [reportDate, setReportDate] = useState(schoolToday())
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [reviewing, setReviewing] = useState('')
  const [reviewError, setReviewError] = useState('')

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
        if (!canReadAbsenceReports(role)) {
          if (active) setPageState({ state: 'denied' })
          return
        }

        const [students, reports] = await Promise.all([
          client.rpc('habit_students'),
          daftarLaporanKetidakhadiran(client, undefined, page),
        ])
        if (!active) return
        const studentNames = students.error ? [] : (students.data as StudentName[] ?? [])
        setPageState({ state: 'ready', role: role as Role, students: studentNames, items: reports.items, hasMore: reports.hasMore })
        if (isParent(role) && studentNames.length) {
          setStudentId((previous) => previous || studentNames[0].id)
        }
      } catch {
        if (active) setPageState({ state: 'error', message: 'Laporan ketidakhadiran belum dapat dimuat. Silakan coba lagi.' })
      }
    }

    void load()
    return () => { active = false }
  }, [attempt, page, session])

  function refresh() {
    setPageState({ state: 'loading' })
    setFormError('')
    setReviewError('')
    setSuccess('')
    setAttempt(value => value + 1)
  }

  function changePage(next: number) {
    setPageState({ state: 'loading' })
    setFormError('')
    setReviewError('')
    setSuccess('')
    setPage(next)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const client = supabase
    if (!client || pageState.state !== 'ready' || !isParent(pageState.role)) return
    if (saving) return

    const request: PendingRequest = pendingRequest ?? { request_id: crypto.randomUUID(), student_id: studentId, report_date: reportDate, reason }
    if (!request.student_id) { setFormError('Pilih anak terlebih dahulu.'); return }
    const invalid = validateAbsenceReport(request.report_date, request.reason, schoolToday())
    if (invalid) { setFormError(invalid); return }

    setSaving(true)
    setFormError('')
    setSuccess('')
    setPendingRequest(request)
    try {
      await kirimLaporanKetidakhadiran(client, request, schoolToday())
      setPendingRequest(null)
      setReason('')
      setSuccess('Laporan ketidakhadiran terkirim dan menunggu pemeriksaan guru.')
      setFormError('')
      setAttempt(value => value + 1)
    } catch (error) {
      if (errorCode(error) === '23505') {
        setPendingRequest(null)
        setReason('')
        setSuccess('Laporan untuk anak dan tanggal ini sudah tersimpan. Daftar dimuat ulang untuk pemeriksaan.')
        setAttempt(value => value + 1)
      } else {
        setFormError('Laporan belum terkonfirmasi. Isian dan ID permintaan dipertahankan; coba lagi dengan tombol yang sama.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function review(item: GuardianAbsenceReport, decision: 'confirmed' | 'rejected') {
    const client = supabase
    if (!client || pageState.state !== 'ready' || !isTeacher(pageState.role) || reviewing) return
    const note = (notes[item.id] ?? '').trim()
    if (!note) { setReviewError('Catatan pemeriksa wajib diisi sebelum memutuskan.'); return }

    setReviewing(item.id)
    setReviewError('')
    setSuccess('')
    try {
      const updated = await reviewLaporanKetidakhadiran(client, item.id, item.revision, decision, note)
      setPageState(current => current.state === 'ready'
        ? { ...current, items: current.items.map(row => row.id === updated.id ? updated : row) }
        : current)
      setNotes(current => ({ ...current, [item.id]: '' }))
      setSuccess(decision === 'confirmed' ? 'Laporan dikonfirmasi.' : 'Laporan ditolak; status absensi tidak berubah.')
    } catch (error) {
      const code = errorCode(error)
      setReviewError(code === '40001'
        ? 'Laporan sudah berubah sejak dimuat. Muat ulang daftar sebelum memutuskan lagi.'
        : code === '55000'
          ? 'Tidak ada satu sesi absensi yang cocok untuk tanggal laporan ini. Laporan belum dikonfirmasi dan status absensi tidak berubah. Periksa sesi absensi tanggal tersebut, lalu kembali ke daftar laporan.'
          : 'Keputusan belum tersimpan. Catatan dan laporan tetap di layar; coba lagi.')
    } finally {
      setReviewing('')
    }
  }

  const heading = <div className="board-heading"><div><div className="eyebrow">KETIDAKHADIRAN</div><h1>Laporan ketidakhadiran</h1><p>Wali melaporkan sakit atau izin anak; guru kelas memeriksa dan memberi catatan.</p></div></div>

  if (pageState.state === 'loading') return <section className="board absence-report-page">{heading}<LoadingState /></section>
  if (pageState.state === 'denied') return <section className="board absence-report-page">{heading}<EmptyState>Halaman ini tersedia untuk wali terverifikasi dan guru kelas.</EmptyState></section>
  if (pageState.state === 'error') return <section className="board absence-report-page">{heading}<ErrorNotice onRetry={refresh}>{pageState.message}</ErrorNotice></section>

  const { role, students, items, hasMore } = pageState
  const nameById = new Map(students.map(student => [student.id, student.name]))
  const parentView = isParent(role)
  const canReview = isTeacher(role)

  return <section className="board absence-report-page">
    {heading}
    {parentView && <>
      {students.length === 0
        ? <EmptyState>Belum ada anak tertaut aktif. Hubungi administrator sekolah untuk verifikasi relasi.</EmptyState>
        : <form className="announcement-editor" onSubmit={submit}>
          <label htmlFor="absence-student">Anak</label>
          <select id="absence-student" value={studentId} onChange={event => setStudentId(event.target.value)} disabled={saving || Boolean(pendingRequest)}>
            {students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}
          </select>
          <label htmlFor="absence-date">Tanggal tidak hadir</label>
          <input id="absence-date" type="date" max={schoolToday()} value={reportDate} onChange={event => setReportDate(event.target.value)} disabled={saving || Boolean(pendingRequest)} />
          <label htmlFor="absence-reason">Alasan</label>
          <textarea id="absence-reason" rows={4} maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} disabled={saving || Boolean(pendingRequest)} placeholder="Contoh: sakit demam, izin acara keluarga." />
          <p className="help">Laporan untuk tanggal mendatang ditolak, dan satu anak hanya dapat memiliki satu laporan aktif per tanggal.</p>
          <div className="button-row">
            <button className="button" type="submit" disabled={saving || (!pendingRequest && !reason.trim())}>
              {saving ? 'Mengirim…' : pendingRequest ? 'Kirim ulang laporan' : 'Kirim laporan'}
            </button>
          </div>
          {formError && <p className="error" role="alert">{formError}</p>}
          {success && <p className="status" role="status">{success}</p>}
        </form>}
    </>}
    {!parentView && <>
      {success && <p className="status" role="status">{success}</p>}
      {reviewError && <p className="error" role="alert">{reviewError} <button className="text-button" type="button" onClick={refresh} disabled={Boolean(reviewing)}>Kembali ke daftar laporan</button></p>}
      <p className="help">{canReview ? 'Anda hanya melihat laporan murid pada kelas yang ditugaskan. Catatan pemeriksa wajib diisi 1–1.000 karakter.' : 'Anda melihat seluruh laporan sebagai pembaca. Keputusan pemeriksaan hanya untuk guru kelas.'} <button className="text-button" type="button" onClick={refresh} disabled={Boolean(reviewing)}>Muat ulang daftar</button></p>
    </>}

    <section aria-labelledby="absence-list">
      <h2 id="absence-list">{parentView ? 'Laporan keluarga Anda' : 'Laporan masuk'}</h2>
      {items.length === 0
        ? <EmptyState>{page > 0 ? 'Tidak ada laporan pada halaman ini.' : parentView ? 'Belum ada laporan ketidakhadiran dari akun Anda.' : 'Belum ada laporan ketidakhadiran yang dapat Anda periksa.'}</EmptyState>
        : <div className="announcement-list">{items.map(item => <article className="announcement" key={item.id}>
          <div className="announcement-meta">
            <time dateTime={item.report_date}>{new Date(`${item.report_date}T00:00:00+07:00`).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })}</time>
            <span className="badge">{statusLabels[item.status]}</span>
          </div>
          <h3>{nameById.get(item.student_id) ?? 'Murid terhubung'}</h3>
          <p className="announcement-body">{item.reason}</p>
          {item.teacher_note && <p className="help">Catatan guru: {item.teacher_note}</p>}
          {canReview && item.status === 'submitted' && <div className="announcement-editor">
            <label htmlFor={`note-${item.id}`}>Catatan pemeriksa untuk {nameById.get(item.student_id) ?? 'murid ini'}</label>
            <textarea id={`note-${item.id}`} rows={3} maxLength={1000} value={notes[item.id] ?? ''} onChange={event => setNotes(current => ({ ...current, [item.id]: event.target.value }))} disabled={Boolean(reviewing)} />
            <div className="button-row">
              <button className="button" type="button" disabled={Boolean(reviewing)} onClick={() => void review(item, 'confirmed')}>{reviewing === item.id ? 'Menyimpan…' : 'Konfirmasi laporan'}</button>
              <button className="button secondary" type="button" disabled={Boolean(reviewing)} onClick={() => void review(item, 'rejected')}>Tolak laporan</button>
            </div>
          </div>}
        </article>)}</div>}
      <TruncationNotice hasMore={hasMore}/>
      {(page > 0 || hasMore) && <nav className="pagination" aria-label="Halaman laporan ketidakhadiran">
        <button className="text-button" type="button" disabled={page === 0 || Boolean(reviewing)} onClick={() => changePage(page - 1)}>Sebelumnya</button>
        <span aria-live="polite">Halaman {page + 1}</span>
        <button className="text-button" type="button" disabled={!hasMore || Boolean(reviewing)} onClick={() => changePage(page + 1)}>Berikutnya</button>
      </nav>}
    </section>
  </section>
}
