import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../components/auth/auth-context'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { schoolToday } from '../../utils/date'
import { supabase } from '../../lib/supabase'
import { daftarKebiasaan, habitLabels, ringkasanKebiasaanMingguan, simpanKebiasaan, validasiKebiasaan, type HabitRecord, type HabitWeeklySummary } from './api'
import { canReadHabits, canSubmitHabits, canValidateHabits, isParent, isStudent, isTeacher } from '../../utils/permissions'

type RosterStudent = { id: string; name: string }

const weeklyKeys = ['bangun_pagi', 'beribadah', 'berolahraga', 'makan_sehat', 'gemar_belajar', 'bermasyarakat', 'tidur_cepat'] as const

function weekStartOf(isoDate: string) {
  const day = new Date(`${isoDate}T00:00:00`)
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7))
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
}

function errorCode(thrown: unknown) {
  return typeof thrown === 'object' && thrown !== null && 'code' in thrown ? String((thrown as { code?: unknown }).code ?? '') : ''
}

function errorMessage(thrown: unknown, fallback: string) {
  return thrown instanceof Error && thrown.message ? thrown.message : fallback
}

export function StudentHabits() {
  const { session } = useAuth()
  return session ? <HabitsWorkspace userId={session.user.id} /> : null
}

function HabitsWorkspace({ userId }: { userId: string }) {
  const [role, setRole] = useState<string | null>(null)
  const [students, setStudents] = useState<RosterStudent[]>([])
  const [studentId, setStudentId] = useState('')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<HabitRecord[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [date, setDate] = useState(schoolToday())
  const [habits, setHabits] = useState<boolean[]>(() => Array(7).fill(false))
  const [notes, setNotes] = useState('')
  const [dirty, setDirty] = useState(false)
  const [pendingId, setPendingId] = useState('')
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [rowsLoading, setRowsLoading] = useState(false)
  const [rosterError, setRosterError] = useState('')
  const [rowsError, setRowsError] = useState('')
  const [actionError, setActionError] = useState('')
  const [denied, setDenied] = useState(false)
  const [message, setMessage] = useState('')
  const [weekly, setWeekly] = useState<HabitWeeklySummary | null>(null)
  const [weeklyState, setWeeklyState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [weeklyAttempt, setWeeklyAttempt] = useState(0)
  const dirtyRef = useRef(false)
  const dateRef = useRef(date)
  dirtyRef.current = dirty
  dateRef.current = date

  const loadRoster = useCallback(async () => {
    if (!supabase) { setRosterError('Supabase belum terkonfigurasi.'); setLoading(false); return }
    setLoading(true); setRosterError(''); setDenied(false)
    try {
      const profile = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
      if (profile.error) throw profile.error
      const currentRole = profile.data ? String(profile.data.role) : ''
      setRole(currentRole)
      if (!canReadHabits(currentRole)) { setDenied(true); setStudents([]); return }
      let list: RosterStudent[] = []
      const roster = await supabase.rpc('habit_students')
      if (!roster.error) {
        list = ((roster.data ?? []) as RosterStudent[]).filter(item => item && typeof item.id === 'string')
      } else if (isStudent(currentRole)) {
        const own = await supabase.from('students').select('id').eq('profile_id', userId).eq('is_active', true).maybeSingle()
        if (own.error) throw own.error
        if (own.data?.id) list = [{ id: own.data.id, name: 'Saya' }]
      } else {
        throw roster.error
      }
      setStudents(list)
      setStudentId(current => list.some(item => item.id === current) ? current : (list[0]?.id ?? ''))
    } catch {
      setRosterError('Daftar murid belum dapat dimuat. Pastikan migration kebiasaan dan tautan akun sudah tersedia.')
    } finally { setLoading(false) }
  }, [userId])

  useEffect(() => { void loadRoster() }, [loadRoster])

  const applyDraft = useCallback((list: HabitRecord[], forDate: string, forStudent: string) => {
    const existing = list.find(row => row.record_date === forDate && row.student_id === forStudent)
    setHabits(existing ? [...existing.habits] : Array(7).fill(false))
    setNotes(existing?.notes ?? '')
  }, [])

  const loadRows = useCallback(async () => {
    if (!supabase) return
    if (!studentId) { setRows([]); setHasMore(false); return }
    setRowsLoading(true); setRowsError('')
    try {
      const result = await daftarKebiasaan(supabase, studentId, page)
      setRows(result.items)
      setHasMore(result.hasMore)
      if (!dirtyRef.current) applyDraft(result.items, dateRef.current, studentId)
    } catch {
      setRowsError('Catatan kebiasaan belum dapat dimuat. Silakan coba lagi.')
    } finally { setRowsLoading(false) }
  }, [studentId, page, applyDraft])

  useEffect(() => { void loadRows() }, [loadRows])

  const loadWeekly = useCallback(async () => {
    if (!supabase || !studentId) { setWeekly(null); setWeeklyState('idle'); return }
    setWeeklyState('loading')
    try {
      const result = await ringkasanKebiasaanMingguan(supabase, weekStartOf(schoolToday()), studentId)
      setWeekly(result.items[0] ?? null)
      setWeeklyState('ready')
    } catch {
      setWeekly(null)
      setWeeklyState('error')
    }
  }, [studentId])

  useEffect(() => { void loadWeekly() }, [loadWeekly, weeklyAttempt])

  function pickDate(next: string) {
    setDate(next)
    setDirty(false)
    applyDraft(rows, next, studentId)
  }

  function pickStudent(next: string) {
    setStudentId(next)
    setPage(0)
    setDirty(false)
  }

  function toggle(index: number) {
    setHabits(value => value.map((item, position) => position === index ? !item : item))
    setDirty(true)
  }

  async function save() {
    if (!supabase || !studentId) return
    setActionError('')
    if (habits.filter(Boolean).length === 0) {
      setActionError('Pilih dulu minimal satu kebiasaan yang sudah dilakukan hari ini. Jika belum ada yang bisa dicatat, biarkan tanggal ini belum diisi.')
      return
    }
    try {
      await simpanKebiasaan(supabase, { student_id: studentId, record_date: date, habits, notes }, schoolToday())
      setMessage('Catatan harian tersimpan dan menunggu validasi guru. Terima kasih sudah mendampingi anak mencatat kebiasaannya.')
      setDirty(false)
      await loadRows()
    } catch (thrown) {
      setMessage('')
      setActionError(errorMessage(thrown, 'Catatan belum tersimpan. Periksa koneksi lalu coba lagi.'))
    }
  }

  async function review(row: HabitRecord) {
    if (!supabase) return
    const note = (reviewNotes[row.id] ?? '').trim()
    if (!note) { setActionError('Catatan validasi wajib diisi sebelum menandai tervalidasi.'); return }
    setPendingId(row.id); setActionError('')
    try {
      await validasiKebiasaan(supabase, row.id, row.revision, note)
      setMessage('Catatan berhasil divalidasi.')
      setReviewNotes(value => ({ ...value, [row.id]: '' }))
      await loadRows()
    } catch (thrown) {
      const code = errorCode(thrown)
      setMessage('')
      setActionError(code === 'PGRST116' || code === '40001'
        ? 'Catatan sudah berubah sejak dimuat. Muat ulang daftar sebelum memvalidasi lagi.'
        : errorMessage(thrown, 'Validasi belum tersimpan. Catatan mungkin sudah berubah.'))
    } finally { setPendingId('') }
  }

  const nameById = new Map(students.map(item => [item.id, item.name]))
  const canWrite = canSubmitHabits(role)
  const canValidate = canValidateHabits(role)
  const marked = habits.filter(Boolean).length
  const existingDraft = rows.some(row => row.record_date === date && row.student_id === studentId)
  const recent = page === 0 ? rows.slice(0, 7) : []

  return <section className="board">
    <div className="board-heading"><div><div className="eyebrow">RUANG KEBIASAAN</div><h1>7 Kebiasaan Anak Indonesia Hebat</h1><p>Wali mencatat kebiasaan anak; guru memvalidasi setelah melakukan konfirmasi.</p></div><Link to="/dashboard">Dashboard</Link></div>
    {message && <p className="status" role="status">{message}</p>}
    {actionError && <p className="error" role="alert">{actionError}</p>}
    {loading ? <LoadingState /> : denied ? <EmptyState>Halaman kebiasaan tidak tersedia untuk peran ini.</EmptyState> : rosterError ? <ErrorNotice onRetry={() => void loadRoster()}>{rosterError}</ErrorNotice> : <>
      <p className="help">Catatan yang sudah tervalidasi dapat dilihat oleh murid, guru, wali, dan kepala sekolah sesuai relasi serta RLS.</p>
      {(isParent(role) || isTeacher(role)) && students.length > 1 && <label className="habit-picker" htmlFor="habit-student">Pilih murid<select id="habit-student" value={studentId} onChange={event => pickStudent(event.target.value)}>{students.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
      {students.length === 0 && <EmptyState>{isTeacher(role) ? 'Belum ada murid pada kelas penugasan Anda.' : 'Belum ada murid yang tertaut ke akun ini.'}</EmptyState>}
      {students.length > 0 && isStudent(role) && <p className="help">Wali mengisi catatan harian untuk anak. Anda dapat melihat catatan milik sendiri dan rekap yang diizinkan.</p>}
      {students.length > 0 && canWrite && <form className="announcement-editor habit-editor" onSubmit={event => { event.preventDefault(); void save() }}>
        <fieldset className="journal-fields"><legend>Catatan harian: {existingDraft ? 'sudah diisi' : 'belum diisi'}</legend>
          <label htmlFor="habit-date">Tanggal</label>
          <input id="habit-date" type="date" max={schoolToday()} value={date} onChange={event => pickDate(event.target.value)} />
          <p className="help" role="status">{existingDraft ? 'Catatan untuk tanggal ini sudah ada. Ketuk kebiasaan yang dilakukan; kebiasaan yang tidak diketuk tidak dihitung sebagai terlaksana.' : 'Tanggal ini belum diisi. Ketuk kebiasaan yang sudah dilakukan; tanggal tanpa catatan berarti belum diisi, bukan berarti tidak dilakukan.'}</p>
          <div className="habit-grid" role="group" aria-label="Pilih kebiasaan yang dilakukan hari ini">
            {habitLabels.map((label, index) => <button key={label} className="habit-choice" type="button" aria-pressed={habits[index]} onClick={() => toggle(index)}>
              <strong>{label}</strong>
              <small>{habits[index] ? 'Sudah dicatat' : 'Ketuk untuk tandai'}</small>
            </button>)}
          </div>
          <p className="help" role="status">{marked} dari 7 kebiasaan ditandai.{existingDraft ? ' Simpan untuk memperbarui catatan tanggal ini.' : ''}</p>
          <label htmlFor="habit-notes">Catatan tambahan</label>
          <textarea id="habit-notes" maxLength={1000} value={notes} onChange={event => { setNotes(event.target.value); setDirty(true) }} />
          <button className="button" type="submit">{existingDraft ? 'Perbarui catatan' : 'Simpan catatan'}</button>
        </fieldset>
      </form>}
      {students.length > 0 && <section className="habit-recap" aria-labelledby="habit-weekly-title">
        <h2 id="habit-weekly-title">Rekap minggu ini</h2>
        {weeklyState === 'loading' && <p className="help" role="status">Memuat rekap minggu ini…</p>}
        {weeklyState === 'error' && <p className="error" role="alert">Rekap minggu ini belum dapat dimuat. <button className="text-button" type="button" onClick={() => setWeeklyAttempt(value => value + 1)}>Coba lagi</button></p>}
        {weeklyState === 'ready' && !weekly && <p className="help">Belum ada rekap untuk minggu ini. Hari tanpa catatan berarti belum diisi, bukan berarti tidak dilakukan.</p>}
        {weeklyState === 'ready' && weekly && <>
          <p className="help">Minggu ini {weekly.days_filled} dari {weekly.days_expected} hari terisi. {weekly.days_missing} hari belum diisi, bukan berarti tidak dilakukan. Rekap untuk melihat perkembangan, bukan peringkat.</p>
          <ul className="habit-recap-list">{habitLabels.map((label, index) => <li key={label}><strong>{label}</strong><span>{weekly[weeklyKeys[index]]} hari</span></li>)}</ul>
        </>}
      </section>}
      {students.length > 0 && !rowsLoading && recent.length > 0 && <section className="habit-recap" aria-labelledby="habit-recap-title">
        <h2 id="habit-recap-title">Rekap {recent.length} catatan terakhir</h2>
        <p className="help">Dihitung dari catatan terbaru yang termuat. Catatan yang belum ditandai tidak dianggap gagal. Rekap ini untuk melihat perkembangan anak, bukan peringkat atau perbandingan antarmurid.</p>
        <ul className="habit-recap-list">{habitLabels.map((label, index) => <li key={label}><strong>{label}</strong><span>{recent.filter(row => row.habits[index]).length} dari {recent.length} catatan</span></li>)}</ul>
      </section>}
      {students.length > 0 && <div className="habit-list-heading"><h2>Riwayat catatan</h2>{rowsError && <p className="error" role="alert">{rowsError} <button className="text-button" type="button" onClick={() => void loadRows()}>Coba lagi</button></p>}</div>}
      {rowsLoading ? <LoadingState>Memuat catatan…</LoadingState> : students.length > 0 && !rows.length ? <EmptyState>Belum ada catatan kebiasaan. Tanggal tanpa catatan berarti belum diisi, bukan berarti tidak dilakukan.</EmptyState> : rows.length > 0 && <div className="announcement-list">{rows.map(row => <article className="announcement habit-record" key={row.id}>
        <div className="announcement-meta">
          <time dateTime={row.record_date}>{new Date(`${row.record_date}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
          <span className={row.validation_status === 'validated' ? 'badge published' : 'badge'}>{row.validation_status === 'validated' ? 'Tervalidasi' : 'Menunggu validasi guru'}</span>
        </div>
        <h3>{nameById.get(row.student_id) ?? 'Murid terhubung'}</h3>
        <ul className="habit-summary">{habitLabels.map((label, index) => <li key={label} className={row.habits[index] ? 'habit-done' : 'habit-missing'}>{label}: {row.habits[index] ? 'dilakukan' : 'belum ditandai'}</li>)}</ul>
        {row.notes && <p className="announcement-body">{row.notes}</p>}
        {row.validation_status === 'validated' && row.validation_note && <p className="help">Catatan guru: {row.validation_note}</p>}
        {canValidate && row.validation_status === 'pending' && <div className="journal-fields habit-review">
          <label htmlFor={`habit-review-${row.id}`}>Catatan validasi</label>
          <textarea id={`habit-review-${row.id}`} maxLength={1000} value={reviewNotes[row.id] ?? ''} onChange={event => { const value = event.target.value; setReviewNotes(items => ({ ...items, [row.id]: value })) }} placeholder="Tuliskan hasil konfirmasi kepada orang tua." />
          <button className="button" type="button" disabled={pendingId === row.id} onClick={() => void review(row)}>{pendingId === row.id ? 'Menyimpan validasi…' : 'Validasi setelah konfirmasi orang tua'}</button>
        </div>}
      </article>)}</div>}
      {students.length > 0 && (page > 0 || hasMore) && <nav className="pagination" aria-label="Halaman catatan kebiasaan">
        <button className="text-button" type="button" disabled={page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>Sebelumnya</button>
        <span aria-live="polite">Halaman {page + 1}</span>
        <button className="text-button" type="button" disabled={!hasMore} onClick={() => setPage(value => value + 1)}>Berikutnya</button>
      </nav>}
    </>}
  </section>
}
