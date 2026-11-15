import { useEffect, useState, type FormEvent } from 'react'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { supabase } from '../../lib/supabase'
import { createCsv, downloadCsv } from '../../utils/csv'
import { schoolToday } from '../attendance/attendance-model'
import { followUp, stages } from './supervision-labels'

type ReportRow = {
  id: string
  scheduled_on: string
  teachers: { name: string } | null
  stage: number
  target_on: string | null
  follow_up_status: keyof typeof followUp
  published_at: string | null
}
const maxRows = 500
const headers = ['Tanggal observasi', 'Guru', 'Tahap', 'Target tindak lanjut', 'Tindak lanjut', 'Publikasi']
function cells(row: ReportRow) {
  return [row.scheduled_on, row.teachers?.name ?? 'Guru tidak tersedia', stages[row.stage - 1],
    row.target_on ?? '', followUp[row.follow_up_status], row.published_at ? 'Dipublikasikan' : 'Draf']
}

export function SupervisionReport() {
  const [end, setEnd] = useState(schoolToday)
  const [start, setStart] = useState(() => end.slice(0, 8) + '01')
  const [request, setRequest] = useState<{ start: string; end: string } | null>(null)
  const [result, setResult] = useState<ReportRow[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const client = supabase
    if (!client || !request) return
    const controller = new AbortController()
    const load = async () => {
      try {
        const { data, error: failure } = await client.from('academic_supervisions')
          .select('id,scheduled_on,teachers(name),stage,target_on,follow_up_status,published_at')
          .gte('scheduled_on', request.start).lte('scheduled_on', request.end)
          .order('scheduled_on', { ascending: false }).order('id').limit(maxRows + 1)
          .abortSignal(controller.signal).overrideTypes<ReportRow[], { merge: false }>()
        if (controller.signal.aborted) return
        if (failure) throw failure
        if (data.length > maxRows) {
          setError('Ada lebih dari 500 sesi. Persempit rentang tanggal sebelum mengekspor.')
          return
        }
        setResult(data)
      } catch {
        if (!controller.signal.aborted) setError('Laporan gagal dimuat. Silakan coba lagi.')
      }
    }
    void load()
    return () => controller.abort()
  }, [request])

  function reset() {
    setRequest(null)
    setResult(null)
    setError('')
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    reset()
    if (!start || !end || start > end) {
      setError('Tanggal akhir harus sama dengan atau setelah tanggal mulai.')
      return
    }
    setRequest({ start, end })
  }

  return <section className="announcement-editor" aria-labelledby="supervision-report-title">
    <h2 id="supervision-report-title">Laporan Supervisi</h2>
    <form onSubmit={search}>
      <label htmlFor="supervision-report-start">Tanggal mulai</label>
      <input id="supervision-report-start" type="date" value={start} required onChange={event => { reset(); setStart(event.target.value) }} />
      <label htmlFor="supervision-report-end">Tanggal akhir</label>
      <input id="supervision-report-end" type="date" value={end} required onChange={event => { reset(); setEnd(event.target.value) }} />
      <button className="button" type="submit">Tampilkan laporan</button>
    </form>
    {error && <ErrorNotice>{error}</ErrorNotice>}
    {request && result === null && !error && <LoadingState />}
    {result?.length === 0 && <EmptyState>Tidak ada sesi pada rentang tanggal ini.</EmptyState>}
    {result && result.length > 0 && request && <>
      <p role="status">{result.length} sesi supervisi</p>
      <button className="button secondary" type="button" onClick={() => downloadCsv(
        `supervisi-${request.start}-${request.end}.csv`, createCsv(headers, result.map(cells)),
      )}>Unduh CSV laporan</button>
      <div className="table-scroll" role="region" aria-label="Tabel laporan supervisi yang dapat digeser" tabIndex={0}>
        <table>
          <caption>Jadwal dan progres supervisi</caption>
          <thead><tr>{headers.map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{result.map(row => <tr key={row.id}>
            {cells(row).map((value, index) => <td key={headers[index]}>{value || '-'}</td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </>}
  </section>
}
