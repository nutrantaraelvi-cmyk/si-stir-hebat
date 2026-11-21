import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../components/auth/auth-context'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { ReferenceNotice } from '../../components/ui/ReferenceNotice'
import { supabase } from '../../lib/supabase'
import { canReadLearningData, isParent, isStudent, isTeacher } from '../../utils/permissions'
import { TaskSubmissions } from './TaskSubmissions'
import { TaskFeedback } from './TaskFeedback'

const statuses = { draft: 'Draf', published: 'Terbit', archived: 'Diarsipkan' }
type Assignment = { id: string; school_classes: { name: string }; subjects: { name: string } }
type Material = {
  id: string; class_name: string; subject_name: string; title: string; body: string
  status: keyof typeof statuses; revision: number
  due_on: string | null
}
type Kind = 'material' | 'task'

export function ClassMaterials({ kind = 'material' }: { kind?: Kind }) {
  const { session } = useAuth()
  return session && <MaterialWorkspace key={`${session.user.id}:${kind}`} userId={session.user.id} kind={kind} />
}

function MaterialWorkspace({ userId, kind }: { userId: string; kind: Kind }) {
  const task = kind === 'task'
  const itemLabel = task ? 'tugas' : 'materi'
  const heading = task ? 'Tugas Kelas' : 'Materi Kelas'
  const [role, setRole] = useState('')
  const [rows, setRows] = useState<Material[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [draftId, setDraftId] = useState('')
  const [confirm, setConfirm] = useState<{ row: Material; status: 'published' | 'archived' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [optionsTruncated, setOptionsTruncated] = useState(false)
  const [openTask, setOpenTask] = useState<string | null>(null)

  useEffect(() => {
    const client = supabase
    if (!client) { setLoading(false); return }
    const controller = new AbortController()
    setLoading(true)
    setLoadError(false)
    setOptionsTruncated(false)
    const load = async () => {
      try {
        const profile = await client.from('profiles').select('role').eq('id', userId).abortSignal(controller.signal).maybeSingle()
        if (profile.error) throw profile.error
        if (controller.signal.aborted) return
        const nextRole = profile.data?.role ?? ''
        setRole(nextRole)
        if (!canReadLearningData(nextRole)) return
        const [materials, options] = await Promise.all([
          client.from('class_materials').select('id,class_name,subject_name,title,body,status,revision,due_on').eq('kind', kind)
            .order('updated_at', { ascending: false }).order('id').range(page * 20, page * 20 + 20)
            .abortSignal(controller.signal).overrideTypes<Material[], { merge: false }>(),
          isTeacher(nextRole) ? client.from('teacher_assignments').select('id,school_classes!inner(name),subjects!inner(name)')
            .eq('is_active', true).eq('school_classes.is_active', true).eq('subjects.is_active', true)
            .limit(1001).abortSignal(controller.signal).overrideTypes<Assignment[], { merge: false }>() : null,
        ])
        if (materials.error || options?.error) throw new Error('Materials unavailable')
        if (!controller.signal.aborted) {
          setRows(materials.data ?? [])
          setAssignments(options?.data?.slice(0, 1000) ?? [])
          setOptionsTruncated((options?.data?.length ?? 0) > 1000)
        }
      } catch {
        if (!controller.signal.aborted) setLoadError(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [userId, kind, page, attempt])

  const draft = rows.find(row => row.id === editing)
  function reload() {
    setPage(0)
    setAttempt(value => value + 1)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !isTeacher(role) || busy) return
    const fields = new FormData(event.currentTarget)
    const title = String(fields.get('title') ?? '').trim()
    const body = String(fields.get('body') ?? '').trim()
    const due = task ? String(fields.get('due') ?? '') : null
    if (!title || !body || (task && !due)) { setError(task ? 'Isi judul, instruksi, dan tenggat tugas.' : 'Isi judul dan materi.'); return }
    const content = { title, body, ...(task ? { due_on: due } : {}) }
    setBusy(true)
    setError('')
    try {
      const result = draft
        ? await supabase.from('class_materials').update(content).eq('id', draft.id)
          .eq('revision', draft.revision).select('id').maybeSingle()
        : await supabase.from('class_materials').insert({ ...content, id: draftId, assignment_id: fields.get('assignment'), kind })
          .select('id').single()
      if (result.error || !result.data) throw new Error('Draft not confirmed')
      setEditing(null)
      setMessage(`Draf ${itemLabel} tersimpan.`)
      reload()
    } catch {
      setError('Penyimpanan belum dikonfirmasi. Periksa versi terbaru sebelum mencoba lagi.')
    } finally {
      setBusy(false)
    }
  }

  async function changeStatus() {
    if (!supabase || !isTeacher(role) || busy || !confirm) return
    setBusy(true)
    setError('')
    try {
      const { error: failure, data } = await supabase.from('class_materials').update({ status: confirm.status })
        .eq('id', confirm.row.id).eq('revision', confirm.row.revision).select('id').maybeSingle()
      if (failure?.code === '23514' && task && confirm.status === 'published') {
        setError('Tenggat tugas harus hari ini atau setelahnya untuk dapat diterbitkan.')
        return
      }
      if (failure || !data) throw new Error('Status not confirmed')
      setMessage(`${task ? 'Tugas' : 'Materi'} ${confirm.status === 'published' ? 'diterbitkan' : 'diarsipkan'}.`)
      setConfirm(null)
      reload()
    } catch {
      setError('Perubahan belum dikonfirmasi. Periksa versi terbaru sebelum mencoba lagi.')
    } finally {
      setBusy(false)
    }
  }

  return <section className={`workspace class-materials class-materials--${kind}`}>
    <h1>{heading}</h1>
    {loading ? <LoadingState /> : loadError ? <ErrorNotice onRetry={reload}>{heading} gagal dimuat.</ErrorNotice>
      : !canReadLearningData(role) ? <EmptyState>Akun ini belum memiliki akses ke {itemLabel} kelas.</EmptyState> : <>
        {message && <p role="status">{message}</p>}
        {error && <ErrorNotice onRetry={() => { setError(''); setEditing(null); setConfirm(null); reload() }}>{error}</ErrorNotice>}
        {isTeacher(role) && <ReferenceNotice truncated={optionsTruncated}/>}
        {isTeacher(role) && !editing && !confirm && <button className="button" type="button"
          disabled={!assignments.length} onClick={() => { setDraftId(crypto.randomUUID()); setEditing('new'); setMessage(''); setError('') }}>
          Buat {itemLabel}
        </button>}
        {isTeacher(role) && !assignments.length && <p>Belum ada penugasan aktif untuk membuat {itemLabel}.</p>}
        {editing && <form className="announcement-editor" onSubmit={save} key={editing}>
          <h2>{draft ? 'Edit draf' : task ? 'Tugas baru' : 'Materi baru'}</h2>
          <fieldset disabled={busy}>
            {!draft && <>
              <label htmlFor="material-assignment">Penugasan</label>
              <select id="material-assignment" name="assignment" defaultValue="" required>
                <option value="">Pilih penugasan</option>
                {assignments.map(item => <option key={item.id} value={item.id}>{item.school_classes.name} · {item.subjects.name}</option>)}
              </select>
            </>}
            <label htmlFor="material-title">Judul {itemLabel}</label>
            <input id="material-title" name="title" defaultValue={draft?.title} maxLength={160} required />
            <label htmlFor="material-body">{task ? 'Instruksi tugas' : 'Isi materi'}</label>
            <textarea id="material-body" name="body" defaultValue={draft?.body} maxLength={12000} required />
            {task && <>
              <label htmlFor="material-due">Tenggat tugas</label>
              <input id="material-due" name="due" type="date" defaultValue={draft?.due_on ?? ''} required />
            </>}
            <button className="button" type="submit">Simpan draf</button>
            <button className="button secondary" type="button" onClick={() => setEditing(null)}>Batal</button>
          </fieldset>
        </form>}
        {rows.length === 0 && <EmptyState>Belum ada {itemLabel} yang dapat ditampilkan.</EmptyState>}
        {rows.slice(0, 20).map(row => <article key={row.id} className="announcement-editor">
          <h2>{row.title}</h2>
          <p>{row.class_name} · {row.subject_name} · {statuses[row.status]}</p>
          {row.due_on && <p>Tenggat <time dateTime={row.due_on}>{row.due_on}</time></p>}
          <p className="announcement-body">{row.body}</p>
          {task && isParent(role) && <>
            <button type="button" className="button secondary" aria-expanded={openTask === row.id}
              onClick={() => setOpenTask(openTask === row.id ? null : row.id)}>Lihat umpan balik anak</button>
            {openTask === row.id && <TaskFeedback key={row.id} taskId={row.id} role={role} />}
          </>}
          {task && row.due_on && (isTeacher(role) || isStudent(role)) && row.status !== 'draft' && <>
            <button type="button" className="button secondary" aria-expanded={openTask === row.id}
              onClick={() => setOpenTask(openTask === row.id ? null : row.id)}>
              {isTeacher(role) ? 'Lihat jawaban siswa' : 'Buka jawaban saya'}
            </button>
            {openTask === row.id && <TaskSubmissions key={row.id} taskId={row.id} role={role} due={row.due_on} />}
          </>}
          {isTeacher(role) && !editing && !confirm && row.status === 'draft' && <>
            <button className="button secondary" type="button" onClick={() => { setEditing(row.id); setMessage(''); setError('') }}>Edit draf</button>
            <button className="button" type="button" onClick={() => { setConfirm({ row, status: 'published' }); setMessage(''); setError('') }}>Terbitkan {itemLabel}</button>
          </>}
          {isTeacher(role) && !editing && !confirm && row.status === 'published' && <button className="button secondary" type="button"
            onClick={() => { setConfirm({ row, status: 'archived' }); setMessage(''); setError('') }}>Arsipkan {itemLabel}</button>}
          {confirm?.row.id === row.id && <div className="confirm-panel" role="alertdialog" aria-labelledby="material-confirm">
            <h3 id="material-confirm">{confirm.status === 'published' ? 'Terbitkan untuk siswa dan wali kelas terkait?' : `Arsipkan ${itemLabel} ini?`}</h3>
            <button className="button" type="button" disabled={busy} onClick={() => void changeStatus()}>Ya, lanjutkan</button>
            <button className="button secondary" type="button" disabled={busy} onClick={() => setConfirm(null)}>Batal</button>
          </div>}
        </article>)}
        {page > 0 && <button className="button secondary" type="button" disabled={Boolean(editing || confirm)} onClick={() => setPage(page - 1)}>Sebelumnya</button>}
        {rows.length > 20 && <button className="button secondary" type="button" disabled={Boolean(editing || confirm)} onClick={() => setPage(page + 1)}>Berikutnya</button>}
      </>}
  </section>
}
