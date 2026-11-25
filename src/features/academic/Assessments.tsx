import { hasMoreReferences, referenceLimit } from '../../utils/references'
import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../components/auth/auth-context'
import { supabase } from '../../lib/supabase'
import { ErrorNotice, LoadingState, EmptyState } from '../../components/ui/Feedback'
import { ReferenceNotice } from '../../components/ui/ReferenceNotice'
import { canReadAssessmentData, isTeacher } from '../../utils/permissions'
import { assessmentFields, assessmentTypes, parseScore, type Assessment } from './assessment-model'
import { AssessmentDetail } from './AssessmentDetail'
import { AcademicReport } from './AcademicReport'

type Assignment = { id: string; school_classes: { name: string }; subjects: { name: string } }

export function Assessments() {
  const { session } = useAuth()
  return session && <AssessmentWorkspace key={session.user.id} userId={session.user.id} />
}

function AssessmentWorkspace({ userId }: { userId: string }) {
  const [role, setRole] = useState('')
  const [rows, setRows] = useState<Assessment[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [optionsTruncated, setOptionsTruncated] = useState(false)

  useEffect(() => {
    const client = supabase
    if (!client) { setLoading(false); return }
    const controller = new AbortController()
    setLoading(true)
    setLoadError(false)
    setOptionsTruncated(false)
    void (async () => {
      try {
        const profile = await client.from('profiles').select('role').eq('id', userId).abortSignal(controller.signal).maybeSingle()
        if (profile.error) throw profile.error
        const nextRole = profile.data?.role ?? ''
        if (controller.signal.aborted) return
        setRole(nextRole)
        if (!canReadAssessmentData(nextRole)) return
        const [list, options] = await Promise.all([
          client.from('assessments').select(assessmentFields).order('held_on', { ascending: false }).order('id')
            .range(page * 20, page * 20 + 20).abortSignal(controller.signal),
          isTeacher(nextRole) ? client.from('teacher_assignments').select('id,school_classes!inner(name),subjects!inner(name)', { count: 'exact' })
            .eq('is_active', true).eq('school_classes.is_active', true).eq('subjects.is_active', true)
            .limit(referenceLimit).abortSignal(controller.signal).overrideTypes<Assignment[], { merge: false }>() : null,
        ])
        if (list.error || options?.error) throw new Error('Assessment unavailable')
        if (!controller.signal.aborted) {
          setRows(list.data as Assessment[])
          setAssignments(options?.data?.slice(0, referenceLimit) ?? [])
          setOptionsTruncated(hasMoreReferences(options))
        }
      } catch {
        if (!controller.signal.aborted) setLoadError(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [userId, page, attempt])

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || busy || !isTeacher(role) || !creating) return
    const fields = new FormData(event.currentTarget)
    const title = String(fields.get('title') ?? '').trim()
    const maximum = parseScore(String(fields.get('maximum') ?? ''), 100000)
    if (!title || !maximum) { setError('Isi judul dan nilai maksimum positif, maksimal dua angka desimal.'); return }
    setBusy(true)
    setError('')
    try {
      const result = await supabase.from('assessments').insert({
        id: creating, assignment_id: fields.get('assignment'), title,
        assessment_type: fields.get('type'), held_on: fields.get('date'), maximum_score: maximum,
      }).select('id').single()
      if (result.error || !result.data) throw new Error('Assessment not confirmed')
      setSelected(result.data.id)
      setCreating(null)
    } catch {
      setError('Asesmen belum dikonfirmasi. Periksa daftar sebelum mencoba lagi. Pastikan kelas memiliki siswa aktif dan tanggal berada dalam tahun ajaran.')
    } finally {
      setBusy(false)
    }
  }

  function reload() { setAttempt(value => value + 1); setError(''); setCreating(null) }
  if (selected) return <AssessmentDetail key={selected} id={selected} role={role} onBack={() => { setSelected(null); reload() }} />
  return <section className="workspace assessments-page">
    <h1>Asesmen dan Nilai</h1>
    <p>Skema sementara: nilai maksimum ditentukan per asesmen dan hasil dibagikan setelah guru menerbitkannya. Perhitungan rapor menunggu skema resmi sekolah.</p>
    {loading ? <LoadingState /> : loadError ? <ErrorNotice onRetry={reload}>Asesmen gagal dimuat.</ErrorNotice>
      : !canReadAssessmentData(role) ? <EmptyState>Akun ini belum memiliki akses asesmen.</EmptyState> : <>
        <details><summary>Rekap dan perkembangan akademik</summary><AcademicReport role={role} /></details>
        {isTeacher(role) && <ReferenceNotice truncated={optionsTruncated}/>}
        {error && <ErrorNotice onRetry={reload}>{error}</ErrorNotice>}
        {isTeacher(role) && !creating && <button className="button" type="button"
          onClick={() => setCreating(crypto.randomUUID())}>Buat asesmen</button>}
        {isTeacher(role) && !assignments.length && <p>Belum ada penugasan aktif. Minta administrator menautkan akun guru dan menambahkan penugasan kelas sebelum menyimpan asesmen.</p>}
        {creating && <form className="announcement-editor" onSubmit={create}>
          <h2>Asesmen baru</h2>
          <p>Peserta diambil dari siswa aktif di kelas saat asesmen dibuat. Nilai kosong berarti belum dinilai.</p>
          <fieldset disabled={busy}>
            <label>Penugasan<select name="assignment" required defaultValue=""><option value="">Pilih penugasan</option>
              {assignments.map(item => <option key={item.id} value={item.id}>{item.school_classes.name} · {item.subjects.name}</option>)}
            </select></label>
            <label>Judul asesmen<input name="title" required maxLength={160} /></label>
            <label>Jenis asesmen<select name="type">{Object.entries(assessmentTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Tanggal asesmen<input name="date" type="date" required /></label>
            <label>Nilai maksimum<input name="maximum" type="number" required min="0.01" max="100000" step="0.01" /></label>
            <button className="button" type="submit" disabled={!assignments.length}>Simpan asesmen</button>
            <button className="button secondary" type="button" onClick={() => setCreating(null)}>Batal</button>
          </fieldset>
        </form>}
        {!rows.length && <EmptyState>Belum ada asesmen yang dapat ditampilkan.</EmptyState>}
        {rows.slice(0, 20).map(row => <article className="announcement-editor" key={row.id}>
          <h2>{row.title}</h2>
          <p>{row.class_name} · {row.subject_name} · {assessmentTypes[row.assessment_type]} · {row.held_on}</p>
          <p>{row.status === 'draft' ? 'Draf' : 'Terbit'} · Nilai maksimum {row.maximum_score}</p>
          <button className="button secondary" type="button" onClick={() => setSelected(row.id)}>Buka asesmen</button>
        </article>)}
        {page > 0 && <button type="button" disabled={Boolean(creating)} onClick={() => setPage(page - 1)}>Sebelumnya</button>}
        {rows.length > 20 && <button type="button" disabled={Boolean(creating)} onClick={() => setPage(page + 1)}>Berikutnya</button>}
      </>}
  </section>
}
