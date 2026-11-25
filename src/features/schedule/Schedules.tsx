import { hasMoreReferences, referenceLimit } from '../../utils/references'
import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../components/auth/auth-context'
import { supabase } from '../../lib/supabase'
import { canReadAnnouncements } from '../../lib/announcements'
import { ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { ReferenceNotice } from '../../components/ui/ReferenceNotice'
import { ScheduleProposals } from './ScheduleProposals'
import { ScheduleHistory } from './ScheduleHistory'
import { canReadScheduleHistory, isAdministrator, isStaff, isTeacher } from '../../utils/permissions'

type Schedule = { id: string; assignment_id: string; class_name: string; teacher_name: string; subject_name: string; weekday: number; start_minute: number; end_minute: number; effective_from: string; effective_until: string; is_active: boolean; revision: number }
type Assignment = { id: string; teachers: { name: string }; school_classes: { name: string }; subjects: { name: string } }
type ClassOption = { id: string; name: string; academic_years: { name: string } }
const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const clock = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3))

export function Schedules() {
  const { session } = useAuth()
  return session && <Workspace key={session.user.id} userId={session.user.id} />
}
function Workspace({ userId }: { userId: string }) {
  const [date, setDate] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date()))
  const [all, setAll] = useState(false)
  const [role, setRole] = useState('')
  const [rows, setRows] = useState<Schedule[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [editing, setEditing] = useState<Schedule | 'new' | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [page, setPage] = useState(0)
  const [history, setHistory] = useState<string | null>(null)
  const [classId, setClassId] = useState('')
  const [referencesTruncated, setReferencesTruncated] = useState(false)
  const [classes, setClasses] = useState<ClassOption[]>([])
  useEffect(() => {
    const client = supabase
    if (!client) { setLoading(false); return }
    const controller = new AbortController()
    setLoading(true); setFailed(false); setRows([]); setHistory(null); setReferencesTruncated(false)
    void (async () => {
      try {
        const profile = await client.from('profiles').select('role').eq('id', userId).abortSignal(controller.signal).maybeSingle()
        if (profile.error) throw profile.error
        const nextRole = profile.data?.role ?? ''
        if (controller.signal.aborted) return
        setRole(nextRole)
        if (!canReadAnnouncements(nextRole)) return
        let query = client.from('lesson_schedules').select('*').order('weekday').order('start_minute').order('id')
        if (classId) query = query.eq('class_id', classId)
        if (!(all && canReadScheduleHistory(nextRole))) {
          if (!date) { setRows([]); return }
          query = query.eq('weekday', new Date(`${date}T00:00:00Z`).getUTCDay() || 7).eq('is_active', true).lte('effective_from', date).gte('effective_until', date)
        }
        const [list, options, classOptions] = await Promise.all([
          query.range(page * 25, page * 25 + 25).abortSignal(controller.signal),
          isAdministrator(nextRole) ? client.from('teacher_assignments').select('id,teachers!inner(name),school_classes!inner(name),subjects!inner(name)', { count: 'exact' })
            .eq('is_active', true).eq('teachers.is_active', true).eq('school_classes.is_active', true).eq('subjects.is_active', true)
            .limit(referenceLimit).abortSignal(controller.signal).overrideTypes<Assignment[], { merge: false }>() : null,
          client.from('school_classes').select('id,name,academic_years!inner(name)', { count: 'exact' }).order('name').order('id')
            .limit(referenceLimit).abortSignal(controller.signal).overrideTypes<ClassOption[], { merge: false }>(),
        ])
        if (list.error || options?.error || classOptions.error) throw new Error('Unavailable')
        if (!controller.signal.aborted) {
          setRows(list.data as Schedule[])
          setAssignments(options?.data?.slice(0, referenceLimit) ?? [])
          setClasses(classOptions.data.slice(0, referenceLimit))
          setReferencesTruncated(hasMoreReferences(options) || hasMoreReferences(classOptions))
        }
      } catch { if (!controller.signal.aborted) setFailed(true) }
      finally { if (!controller.signal.aborted) setLoading(false) }
    })()
    return () => controller.abort()
  }, [userId, date, all, attempt, page, classId])
  function reload() { setEditing(null); setError(''); setAttempt(value => value + 1) }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || busy || !editing || !(isAdministrator(role) || isTeacher(role))) return
    const fields = new FormData(event.currentTarget)
    const value = (name: string) => String(fields.get(name) ?? '')
    setBusy(true); setError('')
    try {
      const result = isTeacher(role) && editing !== 'new' ? await supabase.rpc('propose_schedule', {
        p_id: crypto.randomUUID(), p_schedule: editing.id, p_revision: editing.revision,
        p_day: Number(value('weekday')), p_start: minutes(value('start')), p_end: minutes(value('end')),
        p_from: value('from'), p_until: value('until'), p_reason: value('reason').trim(),
      }) : await supabase.rpc('save_lesson_schedule', {
        p_id: editing === 'new' ? crypto.randomUUID() : editing.id,
        p_revision: editing === 'new' ? null : editing.revision,
        p_assignment: editing === 'new' ? value('assignment') : editing.assignment_id,
        p_weekday: Number(value('weekday')), p_start: minutes(value('start')), p_end: minutes(value('end')),
        p_from: value('from'), p_until: value('until'), p_active: fields.has('active'), p_reason: value('reason').trim(),
      })
      if (result.error) {
        setError(result.error.code === '23P01' ? 'Jadwal bentrok dengan kelas atau guru pada waktu yang sama.' : result.error.code === '40001' ? 'Jadwal sudah berubah. Muat ulang sebelum mengedit kembali.' : 'Penyimpanan belum dikonfirmasi. Muat ulang sebelum mencoba lagi. Pastikan rentang tanggal berada dalam tahun ajaran dan memuat hari pilihan, waktu selesai setelah mulai, serta penugasan aktif.')
      } else reload()
    } catch { setError('Penyimpanan belum dikonfirmasi. Muat ulang untuk memeriksa hasil sebelum mencoba lagi.') }
    finally { setBusy(false) }
  }
  const draft = editing && editing !== 'new' ? editing : null
  return <section className="workspace schedule-page"><h1>Jadwal Pelajaran</h1><p>Jadwal mingguan berlaku pada rentang tanggal yang ditetapkan admin. Jam mengikuti waktu lokal sekolah.</p>
    {loading ? <LoadingState /> : failed ? <ErrorNotice onRetry={reload}>Jadwal gagal dimuat.</ErrorNotice> : !canReadAnnouncements(role) ? <p>Akun ini belum memiliki akses jadwal.</p> : <>
      <fieldset disabled={busy}><label>Tanggal jadwal<input type="date" value={date} onChange={event => { setDate(event.target.value); setPage(0); setEditing(null) }} /></label>
        <label>Kelas jadwal<select value={classId} onChange={event => { setClassId(event.target.value); setPage(0); setEditing(null); setError('') }}><option value="">Semua kelas yang dapat diakses</option>{classes.map(item => <option key={item.id} value={item.id}>{item.name} · {item.academic_years.name}</option>)}</select></label>
        <p>Daftar kelas berasal dari data sekolah. Jadwal yang terlihat tetap mengikuti hak akses akun. Filter kelas hanya berlaku pada daftar jadwal; usulan memiliki filter status tersendiri.</p>
        <ReferenceNotice truncated={referencesTruncated}/>
        {canReadScheduleHistory(role) && <label><input type="checkbox" checked={all} onChange={event => { setAll(event.target.checked); setPage(0); setEditing(null) }} /> Semua jadwal (pengelolaan)</label>}
        <button type="button" onClick={reload}>Muat ulang</button>
        {isAdministrator(role) && <button type="button" onClick={() => { setEditing('new'); setError('') }}>Tambah jadwal</button>}
      </fieldset>
      {editing && <form key={draft?.id ?? 'new'} onSubmit={save}><h2>{isTeacher(role) ? 'Usulkan perubahan' : draft ? 'Ubah jadwal' : 'Jadwal baru'}</h2><fieldset disabled={busy}>
        {draft ? <p>{draft.class_name} · {draft.subject_name} · {draft.teacher_name}</p> : <label>Penugasan<select name="assignment" required defaultValue=""><option value="">Pilih penugasan</option>{assignments.map(item => <option key={item.id} value={item.id}>{item.school_classes.name} · {item.subjects.name} · {item.teachers.name}</option>)}</select></label>}
        <label>Hari<select name="weekday" defaultValue={draft?.weekday ?? 1}>{days.map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</select></label>
        <label>Jam mulai<input name="start" type="time" required defaultValue={clock(draft?.start_minute ?? 480)} /></label>
        <label>Jam selesai<input name="end" type="time" required defaultValue={clock(draft?.end_minute ?? 540)} /></label>
        <label>Berlaku mulai<input name="from" type="date" required defaultValue={draft?.effective_from ?? date} /></label>
        <label>Berlaku sampai<input name="until" type="date" required defaultValue={draft?.effective_until ?? date} /></label>
        {isAdministrator(role) && <label><input name="active" type="checkbox" defaultChecked={draft?.is_active ?? true} /> Jadwal aktif</label>}
        <label>Alasan pengaturan<textarea name="reason" required minLength={5} maxLength={500} /></label>
        <p>{isTeacher(role) ? 'Usulan tidak mengubah jadwal sampai admin menyetujuinya. Satu usulan menunggu keputusan diperbolehkan per jadwal. Perubahan mengganti seluruh rentang berlaku jadwal ini.' : 'Jadwal aktif langsung terlihat oleh pengguna yang memiliki akses. Menonaktifkan jadwal menyembunyikannya dari guru, siswa, dan wali.'}</p>
        <button type="submit" disabled={!!error}>{busy ? 'Menyimpan…' : isTeacher(role) ? 'Kirim usulan' : 'Simpan jadwal'}</button><button type="button" onClick={() => { setEditing(null); setError('') }}>Batal</button>
      </fieldset></form>}
      {error && <div role="alert">{error} <button type="button" disabled={busy} onClick={reload}>Muat ulang jadwal</button></div>}
      {!rows.length && <p>Tidak ada jadwal pada pilihan ini.</p>}
      {rows.slice(0, 25).map(row => <article className="tile" key={row.id}><h2>{row.subject_name} · {row.class_name}</h2><p>{days[row.weekday - 1]} · {clock(row.start_minute)}–{clock(row.end_minute)} · {row.teacher_name}</p><p>{row.effective_from} sampai {row.effective_until} · {row.is_active ? 'Aktif' : 'Nonaktif'}</p>{isAdministrator(role) || isTeacher(role) ? <button type="button" disabled={busy} onClick={() => { setEditing(row); setError('') }}>{isTeacher(role) ? 'Usulkan perubahan' : 'Ubah jadwal'} {row.subject_name}</button> : null}{canReadScheduleHistory(role) && <button type="button" disabled={busy} aria-expanded={history === row.id} onClick={() => setHistory(history === row.id ? null : row.id)}>{history === row.id ? 'Tutup riwayat' : 'Lihat riwayat'} {row.subject_name}</button>}{history === row.id && canReadScheduleHistory(role) && <ScheduleHistory key={row.id} scheduleId={row.id} />}</article>)}
      <div className="actions"><button disabled={busy || page === 0} onClick={() => { setPage(value => value - 1); setEditing(null) }}>Sebelumnya</button><span>Halaman {page + 1}</span><button disabled={busy || rows.length <= 25} onClick={() => { setPage(value => value + 1); setEditing(null) }}>Berikutnya</button></div>
      {isStaff(role) && !editing && <ScheduleProposals key={attempt} role={role} onApplied={reload} />}
    </>}
  </section>
}

