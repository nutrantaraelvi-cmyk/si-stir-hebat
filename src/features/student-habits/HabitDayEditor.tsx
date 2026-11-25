import { useEffect, useState, type FormEvent } from 'react'
import { ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { supabase } from '../../lib/supabase'
import { schoolToday } from '../../utils/date'
import { ambilKebiasaanHarian, habitLabels, simpanKebiasaan, type HabitRecord } from './api'

export function HabitDayEditor({ studentId, onSaved }: { studentId: string; onSaved: () => void }) {
  const [date, setDate] = useState(schoolToday)
  const [saving, setSaving] = useState(false)
  return <section className="announcement-editor habit-editor" aria-label="Catatan harian">
    <label htmlFor="habit-date">Tanggal</label>
    <input id="habit-date" type="date" max={schoolToday()} disabled={saving} value={date} onChange={event => setDate(event.target.value)} />
    {date && date <= schoolToday()
      ? <DayForm key={date} studentId={studentId} date={date} saving={saving} onSaving={setSaving} onSaved={onSaved} />
      : <p role="status">Pilih tanggal hari ini atau sebelumnya.</p>}
  </section>
}

function DayForm({ studentId, date, saving, onSaving, onSaved }: {
  studentId: string; date: string; saving: boolean; onSaving: (value: boolean) => void; onSaved: () => void
}) {
  const [record, setRecord] = useState<HabitRecord | null>(null)
  const [habits, setHabits] = useState<boolean[]>([])
  const [notes, setNotes] = useState('')
  const [allFalseConfirmed, setAllFalseConfirmed] = useState(false)
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'conflict'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setState('loading')
    setError('')
    setMessage('')
    async function load() {
      try {
        if (!supabase) throw new Error()
        const row = await ambilKebiasaanHarian(supabase, studentId, date)
        if (!active) return
        setRecord(row)
        setHabits(row?.habits ?? Array(7).fill(false))
        setNotes(row?.notes ?? '')
        setAllFalseConfirmed(Boolean(row && !row.habits.some(Boolean)))
        setState('ready')
      } catch {
        if (active) setState('error')
      }
    }
    void load()
    return () => { active = false }
  }, [studentId, date, attempt])

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!supabase || saving || state !== 'ready') return
    setMessage('')
    if (!habits.some(Boolean) && !allFalseConfirmed) {
      setError('Tandai kebiasaan yang dilakukan atau konfirmasi bahwa belum ada yang dilakukan.')
      return
    }
    onSaving(true)
    setError('')
    try {
      const next = await simpanKebiasaan(supabase, { student_id: studentId, record_date: date, habits, notes }, schoolToday(), record?.revision ?? null)
      setRecord(next)
      setNotes(next.notes)
      setMessage(next.validation_status === 'validated' ? 'Catatan tetap tervalidasi.' : 'Catatan harian tersimpan dan menunggu validasi guru.')
      onSaved()
    } catch (failure) {
      const code = failure && typeof failure === 'object' && 'code' in failure ? failure.code : ''
      if (code === '23505' || code === '40001' || code === 'PGRST116') setState('conflict')
      else setError('Catatan belum dapat disimpan. Periksa koneksi lalu coba lagi.')
    } finally { onSaving(false) }
  }

  if (state === 'loading') return <LoadingState>Memuat catatan tanggal ini…</LoadingState>
  if (state === 'error' || state === 'conflict') return <ErrorNotice onRetry={() => setAttempt(value => value + 1)}>
    {state === 'conflict' ? 'Catatan sudah berubah. Muat ulang untuk memeriksa isinya sebelum mengubahnya.' : 'Catatan tanggal ini belum dapat dimuat.'}
  </ErrorNotice>
  const marked = habits.filter(Boolean).length
  return <form onSubmit={save}>
    <fieldset className="journal-fields" disabled={saving}>
      <legend>Catatan harian: {record ? 'sudah diisi' : 'belum diisi'}</legend>
      <div className="habit-grid" role="group" aria-label="Pilih kebiasaan yang dilakukan hari ini">
        {habitLabels.map((label, index) => <button key={label} className="habit-choice" type="button" aria-pressed={habits[index]} onClick={() => {
          setAllFalseConfirmed(false)
          setHabits(current => current.map((value, i) => i === index ? !value : value))
        }}><strong>{label}</strong><small>{habits[index] ? 'Sudah dicatat' : 'Ketuk untuk tandai'}</small></button>)}
      </div>
      <p className="help" role="status">{marked} dari 7 kebiasaan ditandai.</p>
      {marked === 0 && <label><input type="checkbox" checked={allFalseConfirmed} onChange={event => setAllFalseConfirmed(event.target.checked)} /> Belum ada kebiasaan yang dilakukan pada tanggal ini</label>}
      <label htmlFor="habit-notes">Catatan tambahan</label>
      <textarea id="habit-notes" maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} />
      <button className="button" type="submit">{saving ? 'Menyimpan…' : record ? 'Perbarui catatan' : 'Simpan catatan'}</button>
    </fieldset>
    {message && <p className="status" role="status">{message}</p>}
    {error && <p className="error" role="alert">{error}</p>}
  </form>
}
