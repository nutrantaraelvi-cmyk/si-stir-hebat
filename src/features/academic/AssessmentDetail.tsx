import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { labelKetuntasan } from '../../lib/kkm.ts'
import { ErrorNotice, LoadingState, EmptyState } from '../../components/ui/Feedback'
import { isStaff, isTeacher } from '../../utils/permissions'
import { assessmentFields, assessmentTypes, parseScore, resultFields, type Assessment, type AssessmentResult } from './assessment-model'
import { AssessmentHistory } from './AssessmentHistory'

export function AssessmentDetail({ id, role, onBack }: { id: string; role: string; onBack: () => void }) {
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [rows, setRows] = useState<AssessmentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState<AssessmentResult | null>(null)
  const [metadata, setMetadata] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [history, setHistory] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const staff = isStaff(role)
  const teacher = isTeacher(role)

  useEffect(() => {
    const client = supabase
    if (!client) { setLoading(false); return }
    const controller = new AbortController()
    setLoading(true)
    setLoadError(false)
    void (async () => {
      try {
        const [header, results] = await Promise.all([
          client.from('assessments').select(assessmentFields).eq('id', id).abortSignal(controller.signal).maybeSingle(),
          client.from('assessment_results').select(resultFields).eq('assessment_id', id)
            .order('student_name').order('id').range(page * 20, page * 20 + 20).abortSignal(controller.signal),
        ])
        if (header.error || results.error) throw new Error('Assessment unavailable')
        if (!controller.signal.aborted) { setAssessment(header.data as Assessment | null); setRows(results.data as AssessmentResult[]) }
      } catch {
        if (!controller.signal.aborted) setLoadError(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [id, page, attempt])

  function reload() {
    setEditing(null); setMetadata(false); setConfirm(false); setError(''); setHistory(null)
    setAttempt(value => value + 1)
  }

  async function save(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!supabase || !assessment || !teacher || busy || error) return
    const form = event ? new FormData(event.currentTarget) : null
    let payload: Record<string, unknown>
    if (editing && form) {
      const score = parseScore(String(form.get('score') ?? ''), assessment.maximum_score)
      const reason = String(form.get('reason') ?? '').trim()
      if (score === undefined || (assessment.status === 'published' && (score === null || reason.length < 5))) {
        setMessage('Isi nilai dalam rentang yang diizinkan. Koreksi hasil terbit memerlukan alasan minimal 5 karakter.'); return
      }
      payload = { score, feedback: String(form.get('feedback') ?? '').trim(), change_reason: reason }
    } else if (metadata && form) {
      const maximum = parseScore(String(form.get('maximum') ?? ''), 100000)
      const title = String(form.get('title') ?? '').trim()
      if (!maximum || !title) { setMessage('Isi judul dan nilai maksimum positif.'); return }
      payload = { title, assessment_type: form.get('type'), held_on: form.get('date'), maximum_score: maximum }
    } else if (confirm && !event) {
      payload = { status: 'published' }
    } else return
    setBusy(true)
    setMessage('')
    try {
      const result = editing
        ? await supabase.from('assessment_results').update(payload).eq('id', editing.id).eq('revision', editing.revision).select('id').maybeSingle()
        : await supabase.from('assessments').update(payload).eq('id', assessment.id).eq('revision', assessment.revision).select('id').maybeSingle()
      if (result.error || !result.data) throw new Error('Assessment not confirmed')
      setMessage(confirm ? 'Hasil asesmen diterbitkan.' : 'Perubahan tersimpan.')
      reload()
    } catch {
      setError('Perubahan belum dikonfirmasi. Muat ulang untuk memeriksa versi terbaru. Periksa kelengkapan nilai, nilai maksimum, tanggal, dan alasan koreksi.')
    } finally {
      setBusy(false)
    }
  }

  const formOpen = Boolean(editing || metadata || confirm)
  return <section className="workspace assessment-detail">
    <button className="button secondary" type="button" disabled={busy} onClick={onBack}>Kembali ke asesmen</button>
    {loading ? <LoadingState /> : loadError ? <ErrorNotice onRetry={reload}>Hasil asesmen gagal dimuat.</ErrorNotice>
      : !assessment ? <EmptyState>Asesmen tidak tersedia untuk akun ini.</EmptyState> : <>
        <h1>{assessment.title}</h1>
        <p>{assessment.class_name} · {assessment.subject_name} · {assessmentTypes[assessment.assessment_type]} · {assessment.held_on}</p>
        <p>Nilai maksimum {assessment.maximum_score} · {assessment.status === 'draft' ? 'Draf, belum dibagikan' : 'Terbit'}</p>
        {staff && <p>{assessment.graded_count} dari {assessment.student_count} peserta sudah dinilai.</p>}
        {message && <p role="status">{message}</p>}
        {error && <ErrorNotice onRetry={reload}>{error}</ErrorNotice>}
        {teacher && assessment.status === 'draft' && !formOpen && <>
          <button className="button secondary" type="button" onClick={() => { setMetadata(true); setMessage('') }}>Edit asesmen</button>
          <button className="button" type="button" disabled={!assessment.student_count || assessment.graded_count !== assessment.student_count}
            onClick={() => setConfirm(true)}>Tinjau publikasi nilai</button>
        </>}
        {metadata && <form className="announcement-editor" onSubmit={save}>
          <fieldset disabled={busy || Boolean(error)}>
            <label>Judul asesmen<input name="title" required maxLength={160} defaultValue={assessment.title} /></label>
            <label>Jenis asesmen<select name="type" defaultValue={assessment.assessment_type}>{Object.entries(assessmentTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Tanggal asesmen<input name="date" type="date" required defaultValue={assessment.held_on} /></label>
            <label>Nilai maksimum<input name="maximum" type="number" min="0.01" max="100000" step="0.01" required defaultValue={assessment.maximum_score} /></label>
            <button className="button" type="submit">Simpan perubahan asesmen</button>
            <button type="button" onClick={() => setMetadata(false)}>Batal</button>
          </fieldset>
        </form>}
        {confirm && <div className="confirm-panel" role="alertdialog" aria-label="Publikasi nilai">
          <p>Terbitkan hasil {assessment.student_count} peserta? Siswa dan wali terverifikasi akan melihat hasil masing-masing. Koreksi berikutnya wajib disertai alasan.</p>
          <button className="button" type="button" disabled={busy || Boolean(error)} onClick={() => void save()}>Ya, terbitkan nilai</button>
          <button className="button secondary" type="button" disabled={busy} onClick={() => setConfirm(false)}>Batal</button>
        </div>}
        {!rows.length && <EmptyState>Belum ada hasil yang dapat ditampilkan pada halaman ini.</EmptyState>}
        {rows.slice(0, 20).map(row => <article key={row.id} className="announcement-editor">
          <h2>{row.student_name}</h2>
          <p>{row.student_code} · {row.score === null ? 'Belum dinilai' : `Nilai ${row.score} / ${assessment.maximum_score} · ${labelKetuntasan(row.score, assessment.maximum_score)}`}</p>
          {row.feedback && <p className="announcement-body">{row.feedback}</p>}
          {teacher && !formOpen && <button className="button secondary" type="button" onClick={() => { setEditing(row); setMessage('') }}>
            {assessment.status === 'published' ? 'Koreksi nilai' : 'Isi nilai'}
          </button>}
          {editing?.id === row.id && <form onSubmit={save}>
            <fieldset disabled={busy || Boolean(error)}>
              <label>Nilai<input name="score" type="number" min="0" max={assessment.maximum_score} step="0.01"
                required={assessment.status === 'published'} defaultValue={row.score ?? ''} /></label>
              <p>Kosong berarti belum dinilai; nol adalah nilai yang sah.</p>
              <label>Catatan guru<textarea name="feedback" maxLength={3000} defaultValue={row.feedback} /></label>
              {assessment.status === 'published' && <label>Alasan koreksi<textarea name="reason" required minLength={5} maxLength={1000} /></label>}
              <button className="button" type="submit">Simpan nilai</button>
              <button type="button" onClick={() => setEditing(null)}>Batal</button>
            </fieldset>
          </form>}
          {staff && !formOpen && <button type="button" className="button secondary" aria-expanded={history === row.id}
            onClick={() => setHistory(history === row.id ? null : row.id)}>Riwayat nilai</button>}
          {history === row.id && <AssessmentHistory key={row.id} resultId={row.id} />}
        </article>)}
        {page > 0 && <button type="button" disabled={formOpen || busy} onClick={() => setPage(page - 1)}>Peserta sebelumnya</button>}
        {rows.length > 20 && <button type="button" disabled={formOpen || busy} onClick={() => setPage(page + 1)}>Peserta berikutnya</button>}
      </>}
  </section>
}
