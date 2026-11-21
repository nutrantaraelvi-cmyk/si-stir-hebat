import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../../components/auth/auth-context'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { ReferenceNotice } from '../../components/ui/ReferenceNotice'
import { supabase } from '../../lib/supabase'
import { schoolToday } from '../../utils/date'
import { SupervisionReport } from './SupervisionReport'
import { SupervisionEvidence } from './SupervisionEvidence'
import { followUp, stages } from './supervision-labels'
import { canReadSupervision, isPrincipal, isTeacher } from '../../utils/permissions'

const scores = ['Perlu pembinaan intensif', 'Mulai berkembang', 'Berkembang sesuai harapan', 'Sangat baik']
const indicators = {
  planning_score: 'Perencanaan pembelajaran',
  instruction_score: 'Pelaksanaan pembelajaran',
  assessment_score: 'Asesmen pembelajaran',
} as const
type Teacher = { id: string; name: string }
type Session = {
  id: string; stage: number; revision: number; teachers: { name: string } | null
  scheduled_on: string; focus: string; preparation: string
  planning_score: number | null; instruction_score: number | null; assessment_score: number | null
  observation_notes: string; reflection: string; feedback: string; follow_up_plan: string
  target_on: string | null; follow_up_status: keyof typeof followUp
  follow_up_evaluation: string; published_at: string | null
}

const columns = 'id,stage,revision,teachers(name),scheduled_on,focus,preparation,planning_score,instruction_score,assessment_score,observation_notes,reflection,feedback,follow_up_plan,target_on,follow_up_status,follow_up_evaluation,published_at'

function readForm(form: HTMLFormElement) {
  const payload: Record<string, string | number | null> = {}
  for (const [key, value] of new FormData(form)) {
    if (typeof value !== 'string') continue
    payload[key] = key.endsWith('_score') ? (value ? Number(value) : null)
      : key === 'target_on' ? value || null : value.trim()
  }
  return payload
}

export function AcademicSupervision() {
  const { session } = useAuth()
  return session && <SupervisionWorkspace key={session.user.id} userId={session.user.id} />
}

function SupervisionWorkspace({ userId }: { userId: string }) {
  const [role, setRole] = useState<string | null>(null)
  const [rows, setRows] = useState<Session[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [evidenceBusy, setEvidenceBusy] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [teachersTruncated, setTeachersTruncated] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [page, setPage] = useState(0)
  const [observationDraft, setObservationDraft] = useState<ReturnType<typeof readForm> | null>(null)
  const [autosaving, setAutosaving] = useState(false)
  const [autosaveFailed, setAutosaveFailed] = useState(false)
  const writing = useRef(false)
  const current = rows.find(row => row.id === selected)
  const principal = isPrincipal(role)

  useEffect(() => {
    const client = supabase
    if (!client) { setLoading(false); return }
    const controller = new AbortController()
    setLoading(true)
    setLoadError(false)
    setTeachersTruncated(false)
    const load = async () => {
      try {
        const profile = await client.from('profiles').select('role').eq('id', userId)
          .abortSignal(controller.signal).maybeSingle()
        if (profile.error) throw profile.error
        if (controller.signal.aborted) return
        const nextRole = profile.data?.role ?? null
        setRole(nextRole)
        if (!canReadSupervision(nextRole)) return
        const [sessions, options] = await Promise.all([
          client.from('academic_supervisions').select(columns).order('updated_at', { ascending: false }).order('id')
            .range(page * 20, page * 20 + 20).abortSignal(controller.signal).overrideTypes<Session[], { merge: false }>(),
          isPrincipal(nextRole) ? client.from('teachers').select('id,name').eq('is_active', true)
            .order('name').order('id').limit(1001).abortSignal(controller.signal) : null,
        ])
        if (sessions.error || options?.error) throw new Error('Unable to load supervision')
        if (!controller.signal.aborted) {
          setRows(sessions.data ?? [])
          setTeachers(options?.data?.slice(0, 1000) ?? [])
          setTeachersTruncated((options?.data?.length ?? 0) > 1000)
        }
      } catch {
        if (!controller.signal.aborted) setLoadError(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [userId, attempt, page])

  useEffect(() => {
    const client = supabase
    if (!client || !principal || current?.stage !== 2 || !observationDraft || busy || autosaving || autosaveFailed) return

    const timer = window.setTimeout(async () => {
      if (writing.current) return
      writing.current = true
      setAutosaving(true)
      try {
        const { data, error: failure } = await client.from('academic_supervisions').update(observationDraft)
          .eq('id', current.id).eq('revision', current.revision).select('revision').maybeSingle()
        if (failure || !data) throw new Error('Observation save not confirmed')
        setRows(previous => previous.map(row => row.id === current.id
          ? { ...row, ...observationDraft, revision: data.revision } : row))
        setObservationDraft(previous => previous === observationDraft ? null : previous)
        setMessage('Draf observasi tersimpan otomatis.')
      } catch {
        setAutosaveFailed(true)
      } finally {
        writing.current = false
        setAutosaving(false)
      }
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [principal, current, observationDraft, busy, autosaving, autosaveFailed])

  function reload() { setAttempt(value => value + 1) }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !principal || writing.current || evidenceBusy) return
    const submitter = (event.nativeEvent as SubmitEvent).submitter
    const action = submitter instanceof HTMLButtonElement ? submitter.value : ''
    const payload = readForm(event.currentTarget)
    if (action === 'advance' && current) payload.stage = current.stage + 1
    if (action === 'publish' && current) {
      for (const key of Object.keys(payload)) delete payload[key]
      payload.published_at = new Date().toISOString()
    }
    writing.current = true
    setBusy(true)
    setMessage('')
    setError('')
    try {
      const result = draftId
        ? await supabase.from('academic_supervisions').insert({ id: draftId, ...payload }).select('id').single()
        : current
          ? await supabase.from('academic_supervisions').update(payload).eq('id', current.id)
            .eq('revision', current.revision).select('id').maybeSingle()
          : null
      if (result?.error?.code === '23514') {
        setError('Periksa tanggal dan lengkapi seluruh isian tahap sebelum melanjutkan.')
        return
      }
      if (result?.error || !result?.data) {
        setError('Penyimpanan belum dikonfirmasi. Periksa daftar dan versi terbaru sebelum mencoba lagi.')
        return
      }
      setDraftId(null)
      setObservationDraft(null)
      setAutosaveFailed(false)
      setPage(0)
      setSelected(result.data.id)
      setMessage(action === 'publish' ? 'Hasil supervisi dipublikasikan.' : 'Supervisi tersimpan.')
      reload()
    } catch {
      setError('Koneksi gagal. Periksa daftar sebelum mencoba lagi.')
    } finally {
      writing.current = false
      setBusy(false)
    }
  }

  const hasPendingObservation = Boolean(observationDraft)
  const navigationLocked = busy || autosaving || hasPendingObservation || evidenceBusy

  return <section className="workspace supervision-page">
    <h1>Supervisi Akademik</h1>
    {loading ? <LoadingState /> : loadError ? <ErrorNotice onRetry={reload}>Supervisi gagal dimuat.</ErrorNotice>
      : !principal && !isTeacher(role) ? <EmptyState>Halaman ini tersedia untuk kepala sekolah dan guru.</EmptyState>
      : <>
        {message && !hasPendingObservation && <p role="status">{message}</p>}
        {error && <p role="alert" className="error">{error}</p>}
        {principal && <details><summary>Laporan supervisi</summary><SupervisionReport key={attempt} /></details>}
        {principal && <ReferenceNotice truncated={teachersTruncated}/>}
        {principal && !draftId && <button className="button" type="button" disabled={!teachers.length || navigationLocked}
          onClick={() => { setSelected(null); setDraftId(crypto.randomUUID()); setError(''); setMessage('') }}>Jadwalkan supervisi</button>}
        {principal && !teachers.length && <p>Belum ada guru aktif untuk dijadwalkan.</p>}
        {rows.length === 0 ? <EmptyState>Belum ada sesi supervisi yang dapat ditampilkan.</EmptyState> : <ul>
          {rows.slice(0, 20).map(item => <li key={item.id}>
            <button className="text-button" type="button" disabled={navigationLocked || Boolean(draftId)} aria-pressed={selected === item.id}
              onClick={() => { setSelected(item.id); setMessage(''); setError('') }}>
              {item.scheduled_on} · {item.teachers?.name ?? 'Guru'} · {item.focus}
            </button>
            {' · '}{item.published_at ? 'Dipublikasikan' : stages[item.stage - 1]}
          </li>)}
        </ul>}
        <div className="actions">
          {page > 0 && <button className="button secondary" disabled={navigationLocked || Boolean(draftId)} onClick={() => { setSelected(null); setPage(page - 1) }}>Sebelumnya</button>}
          {rows.length > 20 && <button className="button secondary" disabled={navigationLocked || Boolean(draftId)} onClick={() => { setSelected(null); setPage(page + 1) }}>Berikutnya</button>}
        </div>
        {current?.published_at && <PublishedResult session={current} />}
        {principal && (draftId || (current && !current.published_at)) && <form className="announcement-editor" onSubmit={save}
          key={draftId ?? (current && `${current.id}:${current.stage}:${attempt}`)}
          onChange={event => {
            if (current?.stage !== 2) return
            setMessage('')
            setObservationDraft(readForm(event.currentTarget))
          }}>
          <h2>{stages[(current?.stage ?? 1) - 1]}</h2>
          <fieldset disabled={busy || evidenceBusy}>
            {draftId && <>
              <label htmlFor="teacher_id">Guru</label>
              <select id="teacher_id" name="teacher_id" defaultValue="" required>
                <option value="">Pilih guru</option>
                {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
              </select>
            </>}
            {(!current || current.stage === 1) && <>
              <label htmlFor="scheduled_on">Tanggal observasi</label>
              <input id="scheduled_on" name="scheduled_on" type="date" required defaultValue={current?.scheduled_on ?? schoolToday()} />
              <label htmlFor="focus">Fokus observasi</label>
              <input id="focus" name="focus" maxLength={500} required defaultValue={current?.focus} />
              <Notes name="preparation" label="Diskusi awal dan persiapan" value={current?.preparation} />
            </>}
            {current?.stage === 2 && <>
              <p>Indikator dan skala berikut masih berupa usulan untuk ditinjau sekolah.</p>
              {autosaveFailed ? <>
                <ErrorNotice onRetry={() => setAutosaveFailed(false)}>
                  Draf belum tersimpan. Jika versi berubah di tab lain, muat ulang untuk membuka versi terbaru.
                </ErrorNotice>
                <button className="button secondary" type="button" onClick={() => {
                  setObservationDraft(null)
                  setAutosaveFailed(false)
                  setMessage('')
                  setError('')
                  reload()
                }}>Buang perubahan dan muat ulang</button>
              </> : hasPendingObservation && <p role="status">{autosaving ? 'Menyimpan draf…' : 'Draf menunggu penyimpanan otomatis.'}</p>}
              {Object.entries(indicators).map(([key, label]) => <div key={key}>
                <label htmlFor={key}>{label}</label>
                <select name={key} id={key} defaultValue={current[key as keyof typeof indicators] ?? ''}>
                  <option value="">Belum dinilai</option>
                  {scores.map((score, index) => <option key={score} value={index + 1}>{index + 1} · {score}</option>)}
                </select>
              </div>)}
              <Notes name="observation_notes" label="Catatan observasi" value={current.observation_notes} />
            </>}
            {current?.stage === 3 && <>
              <Notes name="reflection" label="Refleksi guru" value={current.reflection} />
              <Notes name="feedback" label="Hasil diskusi dan umpan balik" value={current.feedback} />
              <Notes name="follow_up_plan" label="Rencana tindak lanjut yang disepakati" value={current.follow_up_plan} />
              <label htmlFor="target_on">Target tanggal tindak lanjut</label>
              <input name="target_on" id="target_on" type="date" min={current.scheduled_on} defaultValue={current.target_on ?? ''} />
            </>}
            {current?.stage === 4 && <>
              <p>Rencana tindak lanjut: {current.follow_up_plan}</p>
              <p>Target: {current.target_on}</p>
              <label htmlFor="follow_up_status">Status tindak lanjut</label>
              <select name="follow_up_status" id="follow_up_status" defaultValue={current.follow_up_status}>
                {Object.entries(followUp).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <Notes name="follow_up_evaluation" label="Evaluasi tindak lanjut" value={current.follow_up_evaluation} />
            </>}
            <button className="button" type="submit" value="save" disabled={autosaving}>{busy ? 'Menyimpan…' : 'Simpan draf'}</button>
            {draftId && <button className="button secondary" type="button" onClick={() => setDraftId(null)}>Batal</button>}
            {current && current.stage < 4 && <button className="button secondary" type="submit" value="advance" disabled={autosaving}>Simpan dan lanjutkan</button>}
            {current?.stage === 4 && current.follow_up_status === 'complete' && <>
              <p>Publikasi membagikan hasil tersimpan kepada guru yang disupervisi dan mengunci sesi.</p>
              <button className="button secondary" type="submit" value="publish">Publikasikan hasil tersimpan</button>
            </>}
          </fieldset>
        </form>}
        {current?.stage === 4 && (principal || current.published_at) && <SupervisionEvidence
          key={current.id} sessionId={current.id} editable={principal && !current.published_at && !busy}
          onBusyChange={setEvidenceBusy} />}
      </>}
  </section>
}

function Notes({ name, label, value }: { name: string; label: string; value?: string }) {
  return <>
    <label htmlFor={name}>{label}</label>
    <textarea id={name} name={name} defaultValue={value} maxLength={4000} />
  </>
}

function PublishedResult({ session }: { session: Session }) {
  return <article className="announcement-editor">
    <h2>{session.focus}</h2>
    <p>{session.scheduled_on} · {session.teachers?.name ?? 'Guru'}</p>
    <h3>Observasi</h3>
    <dl>{Object.entries(indicators).map(([key, label]) => <div key={key}>
      <dt>{label}</dt><dd>{session[key as keyof typeof indicators]} dari 4</dd>
    </div>)}</dl>
    <p className="announcement-body">{session.observation_notes}</p>
    <h3>Refleksi dan umpan balik</h3>
    <p className="announcement-body">{session.reflection}</p>
    <p className="announcement-body">{session.feedback}</p>
    <h3>Tindak lanjut</h3>
    <p className="announcement-body">{session.follow_up_plan}</p>
    <p>Target {session.target_on} · {followUp[session.follow_up_status]}</p>
    <p className="announcement-body">{session.follow_up_evaluation}</p>
  </article>
}
