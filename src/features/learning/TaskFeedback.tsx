import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'

type Feedback = {
  id: string; student_name: string; feedback: string
  status: 'draft' | 'published'; revision: number
}
const fields = 'id,student_name,feedback,status,revision'

export function TaskFeedback({ taskId, submissionId, role }: { taskId: string; submissionId?: string; role: string }) {
  const [rows, setRows] = useState<Feedback[] | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [page, setPage] = useState(0)
  const editable = role === 'teacher' && Boolean(submissionId)
  const current = rows?.[0]

  useEffect(() => {
    const client = supabase
    if (!client) return
    const controller = new AbortController()
    setRows(null)
    setError('')
    setConfirm(false)
    void (async () => {
      try {
        let query = client.from('task_feedback').select(fields).eq('task_id', taskId)
        if (submissionId) query = query.eq('submission_id', submissionId)
        const result = await query.order('id').range(page * 20, page * 20 + 20).abortSignal(controller.signal)
        if (result.error) throw result.error
        if (!controller.signal.aborted) setRows(result.data as Feedback[])
      } catch {
        if (!controller.signal.aborted) setError('Umpan balik gagal dimuat.')
      }
    })()
    return () => controller.abort()
  }, [taskId, submissionId, page, attempt])

  async function save(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!supabase || !editable || busy || !rows || error) return
    const feedback = event ? String(new FormData(event.currentTarget).get('feedback') ?? '').trim() : current?.feedback
    if (!feedback || (!event && (!confirm || !current))) return
    setBusy(true)
    setMessage('')
    try {
      const result = current
        ? await supabase.from('task_feedback').update(event ? { feedback } : { status: 'published' })
          .eq('id', current.id).eq('revision', current.revision).select(fields).maybeSingle()
        : await supabase.from('task_feedback').insert({ submission_id: submissionId, feedback }).select(fields).single()
      if (result.error || !result.data) throw new Error('Feedback not confirmed')
      setRows([result.data as Feedback])
      setConfirm(false)
      setMessage(event ? 'Draf umpan balik tersimpan.' : 'Umpan balik diterbitkan.')
    } catch {
      setError('Penyimpanan belum dikonfirmasi. Muat ulang untuk memeriksa versi terbaru sebelum mencoba lagi.')
    } finally {
      setBusy(false)
    }
  }

  return <section aria-label="Umpan balik tugas">
    <h4>Umpan balik guru</h4>
    {error && <p role="alert">{error} <button type="button" disabled={busy} onClick={() => setAttempt(value => value + 1)}>Muat ulang umpan balik</button></p>}
    {message && <p role="status">{message}</p>}
    {!rows && !error && <p role="status">Memuat umpan balik…</p>}
    {rows?.slice(0, 20).map(row => <div key={row.id}>
      {role === 'parent' && <h5>{row.student_name}</h5>}
      <p>{row.status === 'draft' ? 'Draf, belum dibagikan' : 'Terbit'}</p>
      <p className="announcement-body">{row.feedback}</p>
    </div>)}
    {rows?.length === 0 && !editable && <p>Belum ada umpan balik yang diterbitkan.</p>}
    {editable && rows && current?.status !== 'published' && !confirm && <form onSubmit={save} key={current?.revision ?? 'new'}>
      <fieldset disabled={busy || Boolean(error)}>
        <label>Catatan umpan balik<textarea name="feedback" required maxLength={6000} defaultValue={current?.feedback} /></label>
        <button className="button" type="submit">Simpan draf umpan balik</button>
        {current && <button className="button secondary" type="button" onClick={() => setConfirm(true)}>Tinjau publikasi</button>}
      </fieldset>
    </form>}
    {confirm && current && <div role="alertdialog" aria-label="Publikasi umpan balik">
      <p>Terbitkan draf tersimpan di atas untuk siswa dan wali terverifikasi? Hasil terbit tidak dapat diubah. Isian yang belum disimpan tidak ikut diterbitkan.</p>
      <button className="button" type="button" disabled={busy || Boolean(error)} onClick={() => void save()}>Ya, terbitkan umpan balik</button>
      <button className="button secondary" type="button" disabled={busy} onClick={() => setConfirm(false)}>Batal</button>
    </div>}
    {page > 0 && <button type="button" onClick={() => setPage(page - 1)}>Umpan balik sebelumnya</button>}
    {(rows?.length ?? 0) > 20 && <button type="button" onClick={() => setPage(page + 1)}>Umpan balik berikutnya</button>}
  </section>
}
