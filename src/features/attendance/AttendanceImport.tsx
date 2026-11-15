import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { EmptyState, ErrorNotice } from '../../components/ui/Feedback'
import { attendanceLabels, type AttendanceRecord } from './attendance-model'
import { templateRows, validateImportFile, validateImportRows, type ImportPlan } from './import-model'
import { parseAttendanceFile } from './xlsx-client'

type ImportHistory={id:string;source_name:string;row_count:number;changed_count:number;created_at:string}
type Prepared={plan:ImportPlan;requestId:string;name:string;sha:string}
type Props={sessionId:string;sessionLabel:string;sessionDate:string;records:AttendanceRecord[];canWrite:boolean;hasDraftChanges:boolean;busy:boolean;onBusyChange:(busy:boolean)=>void;onImported:(count:number)=>void}

export function AttendanceImport({sessionId,sessionLabel,sessionDate,records,canWrite,hasDraftChanges,busy,onBusyChange,onImported}:Props) {
  const [prepared,setPrepared]=useState<Prepared|null>(null)
  const [error,setError]=useState('')
  const [processing,setProcessing]=useState(false)
  const [confirming,setConfirming]=useState(false)
  const [conflicted,setConflicted]=useState(false)
  const [history,setHistory]=useState<ImportHistory[]>([])
  const [historyError,setHistoryError]=useState('')
  const [ready,setReady]=useState(false)
  const [attempt,setAttempt]=useState(0)
  const controller=useRef<AbortController|null>(null)
  useEffect(()=>()=>controller.current?.abort(),[])
  useEffect(()=>{
    let active=true
    setReady(false);setHistoryError('')
    async function load() {
      try {
        if(!supabase) throw new Error('configuration')
        const {data,error}=await supabase.from('attendance_imports').select('id,source_name,row_count,changed_count,created_at').eq('session_id',sessionId).order('created_at',{ascending:false}).limit(20)
        if(error) throw error
        if(active) {setHistory(data ?? []);setReady(true)}
      } catch {if(active) setHistoryError('Riwayat impor belum dapat dimuat. Silakan coba lagi atau hubungi pengelola aplikasi.')}
    }
    void load()
    return ()=>{active=false}
  },[sessionId,attempt])

  async function downloadTemplate() {
    if(busy) return
    setError('');onBusyChange(true)
    try {
      const {default:writeExcelFile}=await import('write-excel-file/browser')
      await writeExcelFile(templateRows(records,sessionLabel).map(row=>row.map(value=>({type:String,value})))).toFile(`template-absensi-${sessionDate}.xlsx`)
    } catch {setError('Template belum dapat dibuat. Silakan coba lagi.')}
    finally {onBusyChange(false)}
  }
  async function chooseFile(event:ChangeEvent<HTMLInputElement>) {
    const file=event.target.files?.[0]
    event.target.value=''
    if(!file || busy || !canWrite || hasDraftChanges) return
    setPrepared(null);setConfirming(false);setConflicted(false);setError('')
    const invalid=validateImportFile(file.name,file.size)
    if(invalid) {setError(invalid);return}
    controller.current?.abort()
    const aborter=new AbortController()
    controller.current=aborter
    setProcessing(true);onBusyChange(true)
    try {
      const buffer=await file.arrayBuffer()
      const digest=await crypto.subtle.digest('SHA-256',buffer)
      const sha=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')
      const rows=await parseAttendanceFile(buffer,aborter.signal)
      if(!aborter.signal.aborted) setPrepared({plan:validateImportRows(rows,records,sessionLabel),requestId:crypto.randomUUID(),name:file.name,sha})
    } catch(failure) {if(!aborter.signal.aborted) setError(failure instanceof Error ? failure.message : 'File belum dapat diproses.')}
    finally {if(!aborter.signal.aborted) {setProcessing(false);onBusyChange(false)}}
  }
  async function saveImport() {
    if(!supabase || !prepared || !canWrite || hasDraftChanges || busy || conflicted || prepared.plan.errors.length || !prepared.plan.changes.length) return
    onBusyChange(true);setProcessing(true);setError('')
    try {
      const {data,error}=await supabase.rpc('import_attendance',{
        target_session:sessionId,changes:prepared.plan.changes,request_id:prepared.requestId,
        source_name:prepared.name,source_sha256:prepared.sha,source_rows:prepared.plan.rows.length,
      })
      if(error) throw error
      setPrepared(null);setConfirming(false);setAttempt(value=>value+1)
      onImported(Number(data))
    } catch(failure) {
      setConfirming(false)
      if(typeof failure==='object' && failure && 'code' in failure && failure.code==='40001') {
        setConflicted(true);setError('Data berubah setelah preview dibuat. Tutup preview, muat ulang absensi, lalu baca file lagi.')
      } else setError('Impor belum dapat dikonfirmasi. Periksa koneksi dan izin penugasan, lalu coba lagi pada preview yang sama agar pengiriman ulang tidak menggandakan impor.')
    } finally {setProcessing(false);onBusyChange(false)}
  }
  const statusLabel=(status:keyof typeof attendanceLabels|null)=>status ? attendanceLabels[status] : 'Belum diisi'
  return <section className="attendance-import"><h2>Impor Excel</h2>
    {canWrite && <><p>Gunakan template sesi ini, maksimal 2 MB dan 100 peserta. Status kosong tidak menghapus catatan tersimpan. Rumus, makro, dan workbook dengan banyak sheet tidak didukung.</p>
      <div className="actions"><button className="refresh-button" disabled={busy} onClick={()=>void downloadTemplate()}>Unduh template Excel</button><label className="file-label">Pilih file Excel<input type="file" accept=".xlsx" disabled={busy || hasDraftChanges || !ready} onChange={event=>void chooseFile(event)}/></label></div>
      {hasDraftChanges && <p className="status">Simpan atau batalkan perubahan manual sebelum membaca file impor.</p>}
      {processing && <p role="status">Memproses impor Excel…</p>}
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {prepared && <div className="import-preview"><h3>Preview impor</h3><p>{prepared.name} · {sessionLabel}</p>
        {!!prepared.plan.errors.length && <div className="error" role="alert"><p>File belum dapat disimpan. Perbaiki seluruh kesalahan berikut:</p><ul>{prepared.plan.errors.map((issue,index)=><li key={index}>{issue}</li>)}</ul></div>}
        <p>{prepared.plan.rows.length} baris valid, {prepared.plan.changes.length} perubahan. Peserta yang tidak ada pada file tidak diubah.</p>
        {prepared.plan.rows.length>0 && <div className="table-scroll" role="region" aria-label="Tabel perubahan impor yang dapat digeser" tabIndex={0}><table><caption>Perubahan dari file Excel</caption><thead><tr><th scope="col">Baris</th><th scope="col">Kode / nama</th><th scope="col">Tersimpan</th><th scope="col">Dari file</th><th scope="col">Alasan</th></tr></thead><tbody>{prepared.plan.rows.map(row=><tr key={row.code}><td>{row.line}</td><td>{row.code} · {row.name}</td><td>{statusLabel(row.before)}</td><td>{statusLabel(row.after)}{!row.changed && ' (tetap)'}</td><td>{row.reason || '-'}</td></tr>)}</tbody></table></div>}
        {!prepared.plan.changes.length && !prepared.plan.errors.length && <p className="status">Tidak ada perubahan status untuk disimpan.</p>}
        {confirming ? <div className="confirm-panel" role="alertdialog" aria-modal="false" aria-labelledby="confirm-import"><h3 id="confirm-import">Impor {prepared.plan.changes.length} perubahan ke sesi ini?</h3><p>{sessionLabel}. Seluruh perubahan dan riwayat impor disimpan bersama atau dibatalkan seluruhnya.</p><div className="actions"><button className="button" disabled={busy || hasDraftChanges} onClick={()=>void saveImport()}>Ya, impor absensi</button><button className="button secondary" disabled={busy} onClick={()=>setConfirming(false)}>Kembali periksa</button></div></div>
          : <button className="button" disabled={busy || hasDraftChanges || conflicted || !!prepared.plan.errors.length || !prepared.plan.changes.length} onClick={()=>setConfirming(true)}>Konfirmasi impor</button>}
        <button className="button secondary" disabled={busy} onClick={()=>{setPrepared(null);setConfirming(false);setError('');setConflicted(false)}}>Tutup preview</button>
      </div>}
    </>}
    <h3>Riwayat impor sesi ini</h3><p className="help">Menampilkan 20 impor terbaru. File asli tidak disimpan di server.</p>
    {historyError ? <ErrorNotice onRetry={()=>setAttempt(value=>value+1)}>{historyError}</ErrorNotice> : !ready ? <p role="status">Memuat riwayat impor…</p> : !history.length ? <EmptyState>Belum ada impor pada sesi ini.</EmptyState> : <ul className="attendance-history">{history.map(item=><li key={item.id}><strong>{item.source_name}</strong><span>{item.changed_count} perubahan dari {item.row_count} baris</span><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})}</time></li>)}</ul>}
  </section>
}
