import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { createCsv, downloadCsv } from '../../utils/csv'
import { schoolToday } from './attendance-model'
import { summarizeReport, validateReportRange, type ReportRecord } from './report-model'

type Choice = { id: string; label: string }
type Result = { label: string; start: string; end: string; sessions: number; rows: ReturnType<typeof summarizeReport>; loaded: string }

const exportHeaders = ['Kelas', 'Awal', 'Akhir', 'Sesi terlihat', 'Kode siswa', 'Nama snapshot terakhir',
  'Hadir', 'Sakit', 'Izin', 'Alpa', 'Belum diisi', 'Catatan terlihat']

function exportRows(result: Result) {
  return result.rows.map(row => [result.label, result.start, result.end, result.sessions,
    row.code, row.name, row.present, row.sick, row.excused, row.absent, row.unmarked, row.total])
}

export function AttendanceReport({ classes }: { classes: Choice[] }) {
  const [classId,setClassId] = useState('')
  const [start,setStart] = useState(schoolToday)
  const [end,setEnd] = useState(schoolToday)
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState('')
  const [result,setResult] = useState<Result | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const controller = useRef<AbortController | null>(null)
  useEffect(()=>()=>controller.current?.abort(),[])
  async function load() {
    const rangeError = validateReportRange(start,end)
    const choice = classes.find(item=>item.id===classId)
    setResult(null); setError(''); setExportError('')
    if (rangeError || !choice) { setError(rangeError || 'Pilih kelas untuk rekap.'); return }
    if (!supabase || loading) return
    const client = supabase
    const abort = new AbortController(); controller.current = abort
    setLoading(true)
    try {
      const sessions = await client.from('attendance_sessions').select('id,held_on').eq('class_id',classId).gte('held_on',start).lte('held_on',end).order('held_on').order('id').limit(32).abortSignal(abort.signal)
      if (sessions.error || (sessions.data?.length ?? 0)>31) throw new Error('sessions')
      const records: ReportRecord[] = []
      const list = sessions.data ?? []
      // One bounded request per roster avoids the Data API's default 1,000-row cap.
      for (let index=0; index<list.length; index+=4) {
        const batches = await Promise.all(list.slice(index,index+4).map(item=>client.from('attendance_records').select('student_id,student_code,student_name,status').eq('session_id',item.id).order('id').limit(101).abortSignal(abort.signal)))
        for (const batch of batches) {
          if (batch.error || (batch.data?.length ?? 0)>100) throw new Error('records')
          records.push(...(batch.data ?? []) as ReportRecord[])
        }
      }
      if (!abort.signal.aborted) setResult({label:choice.label,start,end,sessions:list.length,rows:summarizeReport(records),loaded:new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})})
    } catch { if (!abort.signal.aborted) setError('Rekap belum dapat dimuat lengkap. Periksa koneksi dan izin, lalu tampilkan kembali. Tidak ada hasil parsial yang diekspor.') }
    finally { if (!abort.signal.aborted) setLoading(false) }
  }
  function exportReport() {
    if (!result) return
    downloadCsv(`rekap-absensi-${result.start}-${result.end}.csv`, createCsv(exportHeaders, exportRows(result)))
  }
  async function exportExcel() {
    if (!result || exporting) return
    setExporting(true)
    setExportError('')
    try {
      const { default: writeExcelFile } = await import('write-excel-file/browser')
      const rows = [exportHeaders, ...exportRows(result)].map(row => row.map(value =>
        typeof value === 'number' ? { type: Number, value } : { type: String, value }))
      await writeExcelFile(rows).toFile(`rekap-absensi-${result.start}-${result.end}.xlsx`)
    } catch {
      setExportError('File Excel gagal dibuat. Coba ekspor kembali.')
    } finally {
      setExporting(false)
    }
  }
  return <section aria-labelledby="report-title" className="announcement-editor attendance-report"><h2 id="report-title">Rekap rentang tanggal</h2><p>Maksimal 31 hari, satu kelas, hanya catatan tersimpan yang diizinkan untuk akun Anda. Hari tanpa sesi tidak dihitung sebagai alpa. Siswa hanya melihat catatan sendiri.</p>
    <form onSubmit={event=>{event.preventDefault();void load()}}><fieldset disabled={loading || exporting}><legend>Filter rekap</legend>
      <label htmlFor="report-class">Kelas rekap</label><select id="report-class" value={classId} onChange={event=>{setClassId(event.target.value);setResult(null)}}><option value="">Pilih kelas</option>{classes.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select>
      <label htmlFor="report-start">Tanggal awal rekap</label><input id="report-start" type="date" required value={start} onChange={event=>{setStart(event.target.value);setResult(null)}}/>
      <label htmlFor="report-end">Tanggal akhir rekap</label><input id="report-end" type="date" required value={end} onChange={event=>{setEnd(event.target.value);setResult(null)}}/>
      <button className="button" disabled={!classId} type="submit">Tampilkan rekap</button>
    </fieldset></form>
    {loading && <LoadingState>Memuat rekap lengkap…</LoadingState>}{error && <ErrorNotice>{error}</ErrorNotice>}
    {result && <><p role="status">{result.label} · {result.start} sampai {result.end} · {result.sessions} sesi terlihat. Dimuat {result.loaded} (Asia/Jakarta).</p><p className="help">Nama/kode mengikuti snapshot terakhir pada rentang ini. Rekap bukan persentase kehadiran atau bukti tidak adanya sesi yang tidak dapat diakses. Perubahan selama pemuatan dapat terlihat pada waktu berbeda; tampilkan kembali untuk memperbarui.</p>
      {!result.rows.length ? <EmptyState>Tidak ada catatan absensi yang dapat Anda akses pada rentang ini.</EmptyState> : <>
        <div className="actions">
          <button className="refresh-button" type="button" onClick={exportReport}>Ekspor rekap (CSV)</button>
          <button className="refresh-button" type="button" disabled={exporting} onClick={() => void exportExcel()}>
            {exporting ? 'Membuat file Excel…' : 'Ekspor rekap (Excel)'}
          </button>
        </div>
        {exportError && <ErrorNotice>{exportError}</ErrorNotice>}
        <div className="table-scroll" role="region" aria-label="Tabel rekap absensi yang dapat digeser" tabIndex={0}><table><caption>Rekap per siswa pada rentang terpilih</caption><thead><tr>{['Kode','Nama snapshot terakhir','Hadir','Sakit','Izin','Alpa','Belum diisi','Catatan terlihat'].map(label=><th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{result.rows.map(row=><tr key={row.id}><td>{row.code}</td><td>{row.name}</td><td>{row.present}</td><td>{row.sick}</td><td>{row.excused}</td><td>{row.absent}</td><td>{row.unmarked}</td><td>{row.total}</td></tr>)}</tbody></table></div>
      </>}
    </>}
  </section>
}
