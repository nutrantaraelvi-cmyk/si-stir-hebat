import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../components/auth/auth-context'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { ReferenceNotice } from '../../components/ui/ReferenceNotice'
import { canReadTeachingModules, isPrincipal, isTeacher } from '../../utils/permissions'
import { supabase } from '../../lib/supabase'

const labels = { draft: 'Draf', submitted: 'Diajukan', returned: 'Perlu revisi', approved: 'Disetujui', archived: 'Diarsipkan' }
type Status = keyof typeof labels
type Content = { title: string; objectives: string; activities: string }
type Assignment = { id: string; school_classes: { name: string } | null; subjects: { name: string } | null }
type Module = Content & { id: string; revision: number; status: Status; review_note: string; teacher_assignments: Assignment | null }
type Editor = Content & { id: string; assignmentId: string; revision?: number }
const pageSize = 20
const moduleColumns = 'id,title,objectives,activities,status,review_note,revision,teacher_assignments(id,school_classes(name),subjects(name))'

function assignmentLabel(assignment: Assignment | null) {
  return assignment ? [assignment.school_classes?.name, assignment.subjects?.name].filter(Boolean).join(' · ') || 'Penugasan' : 'Penugasan tidak tersedia'
}

export function TeachingModules() {
  const { session } = useAuth()
  return session && <ModuleWorkspace key={session.user.id} userId={session.user.id} />
}

function ModuleWorkspace({ userId }: { userId: string }) {
  const [role, setRole] = useState<string | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [editor, setEditor] = useState<Editor | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [optionsTruncated, setOptionsTruncated] = useState(false)
  const current = modules.find(row => row.id === selected)

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
        const nextRole = profile.data?.role ?? null
        setRole(nextRole)
        if (!canReadTeachingModules(nextRole)) return
        const [records, options] = await Promise.all([
          client.from('teaching_modules').select(moduleColumns).order('updated_at', { ascending: false }).order('id')
            .range(page * pageSize, page * pageSize + pageSize).abortSignal(controller.signal).overrideTypes<Module[], { merge: false }>(),
          isTeacher(nextRole) ? client.from('teacher_assignments').select('id,school_classes!inner(name),subjects!inner(name)')
            .eq('is_active', true).eq('school_classes.is_active', true).eq('subjects.is_active', true)
            .limit(1001).abortSignal(controller.signal).overrideTypes<Assignment[], { merge: false }>() : null,
        ])
        if (records.error || options?.error) throw new Error('Module list unavailable')
        if (!controller.signal.aborted) {
          setModules(records.data ?? [])
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
  }, [userId, page, attempt])

  function reload() { setAttempt(value => value + 1) }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !editor || busy) return
    setError('')
    setMessage('')
    const content = { title: editor.title.trim(), objectives: editor.objectives.trim(), activities: editor.activities.trim() }
    if (!content.title || !content.objectives || !content.activities) {
      setError('Isi judul, tujuan, dan kegiatan pembelajaran.')
      return
    }
    setBusy(true)
    try {
      const result = editor.revision === undefined
        ? await supabase.from('teaching_modules').insert({ ...content, id: editor.id, assignment_id: editor.assignmentId }).select('id').single()
        : await supabase.from('teaching_modules').update(content).eq('id', editor.id).eq('revision', editor.revision).select('id').maybeSingle()
      if (result.error || !result.data) throw new Error('Draft write not confirmed')
      setEditor(null)
      setPage(0)
      setMessage('Modul ajar tersimpan.')
      reload()
    } catch {
      setError('Penyimpanan belum dikonfirmasi. Muat ulang daftar untuk memeriksa perubahan.')
    } finally {
      setBusy(false)
    }
  }

  async function transition(status: Status) {
    if (!supabase || !current || busy) return
    setError('')
    setMessage('')
    if (status === 'returned' && note.trim().length < 5) {
      setError('Isi catatan revisi dengan minimal lima karakter.')
      return
    }
    const change = status === 'returned' || status === 'approved' ? { status, review_note: note.trim() } : { status }
    setBusy(true)
    try {
      const { data, error: failure } = await supabase.from('teaching_modules').update(change).eq('id', current.id)
        .eq('revision', current.revision).select('id').maybeSingle()
      if (failure || !data) throw new Error('Transition not confirmed')
      setSelected(null)
      setNote('')
      setPage(0)
      setMessage('Status modul diperbarui.')
      reload()
    } catch {
      setError('Perubahan belum dikonfirmasi. Muat ulang daftar untuk memeriksa status terbaru.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="workspace teaching-modules">
    <h1>Modul Ajar</h1>
    {loading ? <LoadingState /> : loadError ? <ErrorNotice onRetry={reload}>Modul gagal dimuat.</ErrorNotice>
      : !canReadTeachingModules(role) ? <EmptyState>Halaman ini tersedia untuk guru dan staf sekolah yang berwenang.</EmptyState>
      : <>
        {message && <p role="status">{message}</p>}
        {error && <ErrorNotice onRetry={() => { setError(''); setEditor(null); setSelected(null); reload() }}>{error}</ErrorNotice>}
        {isTeacher(role) && <ReferenceNotice truncated={optionsTruncated}/>}
        {isTeacher(role) && !editor && <button className="button" type="button" disabled={!assignments.length || busy}
          onClick={() => { setSelected(null); setEditor({ id: crypto.randomUUID(), assignmentId: '', title: '', objectives: '', activities: '' }) }}>Buat modul</button>}
        {isTeacher(role) && !assignments.length && <p>Belum ada penugasan aktif untuk membuat modul.</p>}
        {editor && <form className="announcement-editor" onSubmit={saveDraft}>
          <h2>{editor.revision === undefined ? 'Modul baru' : 'Edit modul'}</h2>
          <fieldset disabled={busy}>
            {editor.revision === undefined && <>
              <label htmlFor="module-assignment">Penugasan</label>
              <select id="module-assignment" value={editor.assignmentId} onChange={event => setEditor({ ...editor, assignmentId: event.target.value })} required>
                <option value="">Pilih penugasan</option>
                {assignments.map(item => <option value={item.id} key={item.id}>{assignmentLabel(item)}</option>)}
              </select>
            </>}
            <label htmlFor="module-title">Judul</label>
            <input id="module-title" value={editor.title} maxLength={160} required onChange={event => setEditor({ ...editor, title: event.target.value })} />
            <label htmlFor="module-objectives">Tujuan pembelajaran</label>
            <textarea id="module-objectives" value={editor.objectives} maxLength={4000} required onChange={event => setEditor({ ...editor, objectives: event.target.value })} />
            <label htmlFor="module-activities">Kegiatan pembelajaran</label>
            <textarea id="module-activities" value={editor.activities} maxLength={8000} required onChange={event => setEditor({ ...editor, activities: event.target.value })} />
            <button className="button" type="submit">Simpan modul</button>
            <button className="button secondary" type="button" onClick={() => setEditor(null)}>Batal</button>
          </fieldset>
        </form>}
        <h2>Daftar modul</h2>
        {modules.length === 0 ? <EmptyState>Belum ada modul.</EmptyState> : <ul>
          {modules.slice(0, pageSize).map(item => <li key={item.id}>
            <button className="text-button" type="button" disabled={busy || Boolean(editor)} aria-pressed={selected === item.id}
              onClick={() => { setSelected(item.id); setNote(''); setError(''); setMessage('') }}>{item.title}</button>
            {' · '}{labels[item.status]}{' · '}{assignmentLabel(item.teacher_assignments)}
          </li>)}
        </ul>}
        <div className="actions">
          {page > 0 && <button className="button secondary" disabled={busy || Boolean(editor)} onClick={() => { setSelected(null); setPage(page - 1) }}>Sebelumnya</button>}
          {modules.length > pageSize && <button className="button secondary" disabled={busy || Boolean(editor)} onClick={() => { setSelected(null); setPage(page + 1) }}>Berikutnya</button>}
        </div>
        {current && !editor && <article className="announcement-editor">
          <h2>{current.title}</h2>
          <p>{labels[current.status]} · {assignmentLabel(current.teacher_assignments)}</p>
          <h3>Tujuan pembelajaran</h3><p className="announcement-body">{current.objectives}</p>
          <h3>Kegiatan pembelajaran</h3><p className="announcement-body">{current.activities}</p>
          {current.review_note && <><h3>Catatan pemeriksaan</h3><p className="announcement-body">{current.review_note}</p></>}
          {isTeacher(role) && (current.status === 'draft' || current.status === 'returned') && <>
            <button className="button secondary" disabled={busy} onClick={() => setEditor({
              id: current.id, revision: current.revision, assignmentId: '',
              title: current.title, objectives: current.objectives, activities: current.activities,
            })}>Edit modul</button>
            <button className="button" disabled={busy} onClick={() => void transition('submitted')}>Ajukan untuk diperiksa</button>
          </>}
          {isPrincipal(role) && current.status === 'submitted' && <>
            <label htmlFor="module-note">Catatan pemeriksaan</label>
            <textarea id="module-note" value={note} maxLength={2000} disabled={busy} onChange={event => setNote(event.target.value)} />
            <button className="button secondary" disabled={busy} onClick={() => void transition('returned')}>Kembalikan untuk revisi</button>
            <button className="button" disabled={busy} onClick={() => void transition('approved')}>Setujui modul</button>
          </>}
          {isPrincipal(role) && current.status === 'approved' && <button className="button secondary" disabled={busy} onClick={() => void transition('archived')}>Arsipkan modul</button>}
        </article>}
      </>}
  </section>
}
