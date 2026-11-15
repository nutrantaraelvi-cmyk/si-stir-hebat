import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { ErrorNotice, LoadingState, EmptyState } from '../../components/ui/Feedback'
import { createCsv, downloadCsv } from '../../utils/csv'
import { schoolToday } from '../attendance/attendance-model'
import { academicExportCells, academicExportHeaders, developmentPoints, orderAcademicRows, reportLimit, scorePercent, studentChoices, validateAcademicRange,
  type AcademicReportRow, type Choice, type ReportAssessment } from './academic-report-model'

type Request = { start: string; end: string; classId: string; subject: string; status: string }
const headerFields = 'id,class_id,class_name,subject_id,subject_name,title,assessment_type,held_on,maximum_score,status'

function choices(headers: ReportAssessment[], kind: 'class' | 'subject'): Choice[] {
  const options = new Map<string, string>()
  for (const row of headers) options.set(row[`${kind}_id`], row[`${kind}_name`])
  return [...options].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label, 'id') || a.id.localeCompare(b.id))
}

export function AcademicReport({ role }: { role: string }) {
  const [end, setEnd] = useState(schoolToday)
  const [start, setStart] = useState(() => end.slice(0, 8) + '01')
  const [classId, setClassId] = useState('')
  const [subject, setSubject] = useState('')
  const [status, setStatus] = useState('')
  const [student, setStudent] = useState('')
  const [options, setOptions] = useState<ReportAssessment[]>([])
  const [request, setRequest] = useState<Request | null>(null)
  const [result, setResult] = useState<{ rows: AcademicReportRow[]; loaded: string } | null>(null)
  const [error, setError] = useState('')
  const [exportError, setExportError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | null>(null)
  const [page, setPage] = useState(0)
  const staff = ['teacher', 'principal', 'administrator'].includes(role)

  useEffect(() => {
    const client = supabase
    if (!client || !request) return
    const controller = new AbortController()
    void (async () => {
      try {
        let records = client.from('assessment_results').select(`id,student_id,student_code,student_name,score,assessments!inner(${headerFields})`, { count: 'exact' })
          .gte('assessments.held_on', request.start).lte('assessments.held_on', request.end)
        if (request.classId) records = records.eq('assessments.class_id', request.classId)
        if (request.subject) records = records.eq('assessments.subject_id', request.subject)
        if (request.status) records = records.eq('assessments.status', request.status)
        const [headers, values] = await Promise.all([
          client.from('assessments').select(headerFields, { count: 'exact' }).gte('held_on', request.start).lte('held_on', request.end)
            .order('held_on').order('id').limit(reportLimit + 1).abortSignal(controller.signal),
          records.order('id').limit(reportLimit + 1).abortSignal(controller.signal).overrideTypes<AcademicReportRow[], { merge: false }>(),
        ])
        if (controller.signal.aborted) return
        if (headers.error || values.error) throw new Error('Report unavailable')
        if (headers.count === null || headers.count > reportLimit || headers.data.length !== headers.count) {
          setError('Daftar asesmen terlalu besar atau belum lengkap. Persempit rentang tanggal.'); return
        }
        setOptions(headers.data as ReportAssessment[])
        if (values.count === null || values.count > reportLimit || values.data.length !== values.count) {
          setError('Rekap melebihi 500 hasil atau belum lengkap. Persempit tanggal, kelas, atau mata pelajaran, lalu tampilkan kembali.'); return
        }
        setResult({ rows: orderAcademicRows(values.data), loaded: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) })
      } catch {
        if (!controller.signal.aborted) setError('Rekap gagal dimuat lengkap. Tampilkan kembali untuk mencoba lagi.')
      }
    })()
    return () => controller.abort()
  }, [request])

  function reset() { setRequest(null); setResult(null); setError(''); setExportError(''); setStudent(''); setPage(0) }
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    reset()
    const failure = validateAcademicRange(start, end)
    if (failure) { setError(failure); return }
    setRequest({ start, end, classId, subject, status })
  }

  const rows = result?.rows.filter(row => !student || row.student_id === student) ?? []
  const points = developmentPoints(rows, student, subject)
  async function exportExcel() {
    if (!result || !request || exporting || !rows.length) return
    setExporting(true); setExportFormat('excel'); setExportError('')
    try {
      const { default: writeExcelFile } = await import('write-excel-file/browser')
      const cells = [academicExportHeaders, ...rows.map(academicExportCells)].map(row => row.map(value =>
        typeof value === 'number' ? { type: Number, value } : { type: String, value }))
      await writeExcelFile(cells).toFile(`rekap-akademik-${request.start}-${request.end}.xlsx`)
    } catch { setExportError('File Excel gagal dibuat. Silakan ekspor kembali.') }
    finally { setExporting(false); setExportFormat(null) }
  }

  async function exportPdf() {
    if (!result || !request || exporting || !rows.length) return
    setExporting(true); setExportFormat('pdf'); setExportError('')
    try {
      const { downloadAcademicPdf } = await import('./academic-report-pdf')
      await downloadAcademicPdf(rows, {
        start: request.start, end: request.end, loaded: result.loaded,
        classLabel: choices(options, 'class').find(item => item.id === request.classId)?.label ?? 'Semua kelas yang diizinkan',
        subjectLabel: choices(options, 'subject').find(item => item.id === request.subject)?.label ?? 'Semua mata pelajaran',
        studentLabel: studentChoices(result.rows).find(item => item.id === student)?.label ?? 'Semua siswa yang diizinkan',
        statusLabel: request.status === 'draft' ? 'Draf' : request.status === 'published' || !staff ? 'Terbit' : 'Semua status yang diizinkan',
      })
    } catch { setExportError('File PDF gagal dibuat. Silakan ekspor kembali.') }
    finally { setExporting(false); setExportFormat(null) }
  }

  return <section className="announcement-editor" aria-labelledby="academic-report-title">
    <h2 id="academic-report-title">Rekap akademik</h2>
    <p>Hanya hasil yang diizinkan untuk akun Anda. Nilai kosong berarti belum dinilai. Pilihan kelas dan mata pelajaran tersedia setelah pemuatan pertama.</p>
    <form onSubmit={search}><fieldset disabled={exporting}>
      <label htmlFor="academic-start">Tanggal awal rekap akademik</label>
      <input id="academic-start" type="date" value={start} required onChange={event => { reset(); setOptions([]); setClassId(''); setSubject(''); setStart(event.target.value) }} />
      <label htmlFor="academic-end">Tanggal akhir rekap akademik</label>
      <input id="academic-end" type="date" value={end} required onChange={event => { reset(); setOptions([]); setClassId(''); setSubject(''); setEnd(event.target.value) }} />
      <label htmlFor="academic-class">Kelas rekap akademik</label>
      <select id="academic-class" value={classId} onChange={event => { reset(); setClassId(event.target.value) }}>
        <option value="">Semua kelas yang diizinkan</option>{choices(options, 'class').map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <label htmlFor="academic-subject">Mata pelajaran rekap akademik</label>
      <select id="academic-subject" value={subject} onChange={event => { reset(); setSubject(event.target.value) }}>
        <option value="">Semua mata pelajaran</option>{choices(options, 'subject').map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      {staff && <><label htmlFor="academic-status">Publikasi rekap akademik</label>
        <select id="academic-status" value={status} onChange={event => { reset(); setStatus(event.target.value) }}>
          <option value="">Semua status</option><option value="draft">Draf</option><option value="published">Terbit</option>
        </select></>}
      <button className="button" type="submit">Tampilkan rekap akademik</button>
    </fieldset></form>
    {error && <ErrorNotice>{error}</ErrorNotice>}
    {request && !result && !error && <LoadingState>Memuat rekap akademik…</LoadingState>}
    {result && request && <>
      <p role="status">{result.rows.length} hasil dimuat · {request.start} sampai {request.end} · {result.loaded} WIB.</p>
      {!result.rows.length ? <EmptyState>Tidak ada hasil yang dapat diakses pada filter ini.</EmptyState> : <>
        <label htmlFor="academic-student">Siswa rekap akademik</label>
        <select id="academic-student" value={student} disabled={exporting} onChange={event => { setStudent(event.target.value); setPage(0); setExportError('') }}>
          <option value="">Semua siswa yang diizinkan</option>{studentChoices(result.rows).map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <p>{rows.length} hasil sesuai pilihan siswa. Ekspor mencakup seluruh halaman pada pilihan ini.</p>
        <p>Persentase = nilai ÷ nilai maksimum × 100. Angka ini bukan nilai rapor atau rata-rata berbobot. Muat ulang rekap untuk melihat perubahan terbaru.</p>
        <div className="actions">
          <button className="button secondary" type="button" disabled={exporting || !rows.length} onClick={() => downloadCsv(
            `rekap-akademik-${request.start}-${request.end}.csv`, createCsv(academicExportHeaders, rows.map(academicExportCells)),
          )}>Ekspor akademik (CSV)</button>
          <button className="button secondary" type="button" disabled={exporting || !rows.length} onClick={() => void exportExcel()}>
            {exportFormat === 'excel' ? 'Membuat Excel akademik…' : 'Ekspor akademik (Excel)'}
          </button>
          <button className="button secondary" type="button" disabled={exporting || !rows.length} onClick={() => void exportPdf()}>
            {exportFormat === 'pdf' ? 'Membuat PDF akademik…' : 'Ekspor akademik (PDF)'}
          </button>
        </div>
        {exportError && <ErrorNotice>{exportError}</ErrorNotice>}
        <h3>Grafik perkembangan</h3>
        {!student || !subject ? <p>Pilih satu mata pelajaran, tampilkan rekap, lalu pilih satu siswa untuk melihat grafik.</p>
          : !points.length ? <p>Belum ada nilai terbit untuk grafik pada pilihan ini.</p>
            : <>
              <p>Grafik batang menurut urutan tanggal, hanya nilai terbit. Menampilkan {Math.min(points.length, 30)} dari {points.length} asesmen terbaru. Jenis dan tingkat kesulitan asesmen dapat berbeda.</p>
              <ol className="academic-trend" aria-label="Grafik perkembangan nilai terbit">
                {points.slice(-30).map(row => <li key={row.id}>
                  <span>{row.assessments.held_on} · {row.assessments.title}</span>
                  <meter min={0} max={100} value={scorePercent(row.score, row.assessments.maximum_score) ?? 0}
                    aria-label={`${row.assessments.held_on} ${row.assessments.title}`} />
                  <span>{row.score} / {row.assessments.maximum_score} ({scorePercent(row.score, row.assessments.maximum_score)}%)</span>
                </li>)}
              </ol>
            </>}
        <div className="table-scroll" role="region" aria-label="Tabel rekap akademik yang dapat digeser" tabIndex={0}><table>
          <caption>Rincian rekap akademik · halaman {page + 1}</caption>
          <thead><tr>{academicExportHeaders.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead>
          <tbody>{rows.slice(page * 25, page * 25 + 25).map(row => <tr key={row.id}>
            {academicExportCells(row).map((value, index) => <td key={academicExportHeaders[index]}>{value === '' ? 'Belum dinilai' : value}</td>)}
          </tr>)}</tbody>
        </table></div>
        {page > 0 && <button type="button" onClick={() => setPage(page - 1)}>Hasil sebelumnya</button>}
        {(page + 1) * 25 < rows.length && <button type="button" onClick={() => setPage(page + 1)}>Hasil berikutnya</button>}
      </>}
    </>}
  </section>
}
