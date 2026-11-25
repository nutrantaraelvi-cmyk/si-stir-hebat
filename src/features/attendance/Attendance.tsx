import { hasMoreReferences, referenceLimit } from '../../utils/references'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../components/auth/auth-context'
import { supabase } from '../../lib/supabase'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { ReferenceNotice } from '../../components/ui/ReferenceNotice'
import { createCsv, downloadCsv } from '../../utils/csv'
import { canReadAttendance, canWriteAttendance, isStudent, isTeacher } from '../../utils/permissions'
import { schoolToday } from '../../utils/date'
import { attendanceLabels, attendanceSummary, prepareAttendanceChanges, type AttendanceChange, type AttendanceDraft, type AttendanceRecord } from './attendance-model'
import { AttendanceImport } from './AttendanceImport'
import { AttendanceReport } from './AttendanceReport'
import { OfflineAttendanceQueue } from './OfflineAttendanceQueue'
import { enqueueAttendance, isNetworkFailure } from './offline-queue'

type Session = { id: string; class_id: string; held_on: string }
type ClassChoice = { id: string; name: string; academic_year_id: string; is_active: boolean }
type History = { id: string; record_id: string; old_status: keyof typeof attendanceLabels | null; new_status: keyof typeof attendanceLabels; reason: string; created_at: string }
const pageSize = 20

export function Attendance() {
  const { session } = useAuth()
  return session ? <AttendanceWorkspace key={session.user.id} userId={session.user.id}/> : null
}

function AttendanceWorkspace({ userId }: { userId: string }) {
  const [queueVersion, setQueueVersion] = useState(0)
  const [role, setRole] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [classes, setClasses] = useState<ClassChoice[]>([])
  const [years, setYears] = useState<Record<string, string>>({})
  const [allowedClasses, setAllowedClasses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [selected, setSelected] = useState('')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [history, setHistory] = useState<History[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState('')
  const [recordsAttempt, setRecordsAttempt] = useState(0)
  const [draft, setDraft] = useState<AttendanceDraft>({})
  const [saveError, setSaveError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmChanges, setConfirmChanges] = useState<AttendanceChange[] | null>(null)
  const [newClass, setNewClass] = useState('')
  const [confirmCreate, setConfirmCreate] = useState(false)
  const [referencesTruncated, setReferencesTruncated] = useState(false)
  const [historyTruncated, setHistoryTruncated] = useState(false)
  const allowed = canReadAttendance(role)
  const current = sessions.find(item => item.id === selected)
  const canWrite = canWriteAttendance(role) && Boolean(current && allowedClasses.includes(current.class_id))
  const dirty = records.some(record => draft[record.id] && draft[record.id].status !== (record.status ?? ''))

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setAllowedClasses([])
    setReferencesTruncated(false)
    async function load() {
      try {
        if (!supabase) throw new Error('configuration')
        const client = supabase
        const profile = await client.from('profiles').select('role').eq('id', userId).maybeSingle()
        if (profile.error) throw profile.error
        const nextRole = profile.data?.role ?? null
        if (!active) return
        setRole(nextRole)
        if (!canReadAttendance(nextRole)) return
        const [sessionResult, classResult, yearResult] = await Promise.all([
          client.from('attendance_sessions').select('id,class_id,held_on').order('held_on', { ascending: false }).order('created_at', { ascending: false }).order('id').range(page * pageSize, page * pageSize + pageSize),
          client.from('school_classes').select('id,name,academic_year_id,is_active', { count: 'exact' }).order('name').limit(referenceLimit),
          client.from('academic_years').select('id,name').limit(201),
        ])
        for (const result of [sessionResult,classResult,yearResult]) if (result.error) throw result.error
        if (!active) return
        setClasses(classResult.data ?? [])
        setReferencesTruncated(hasMoreReferences(classResult) || (yearResult.data?.length ?? 0) > 200)
        setYears(Object.fromEntries((yearResult.data ?? []).map(year => [year.id,year.name])))
        const sessionRows = (sessionResult.data ?? []).slice(0,pageSize)
        setSessions(sessionRows)
        setHasNext((sessionResult.data ?? []).length > pageSize)
        setSelected(previous => sessionRows.some(item => item.id === previous) ? previous : sessionRows[0]?.id ?? '')
        if (isTeacher(nextRole)) {
          const [teacher,assignments,subjects] = await Promise.all([
            client.from('teachers').select('id').eq('profile_id',userId).eq('is_active',true).maybeSingle(),
            client.from('teacher_assignments').select('teacher_id,class_id,subject_id', { count: 'exact' }).eq('is_active',true).limit(referenceLimit),
            client.from('subjects').select('id', { count: 'exact' }).eq('is_active',true).limit(referenceLimit),
          ])
          for (const result of [teacher,assignments,subjects]) if (result.error) throw result.error
          if (active) {
            if (hasMoreReferences(assignments) || hasMoreReferences(subjects)) setReferencesTruncated(true)
            setAllowedClasses([...new Set((assignments.data ?? []).filter(item => item.teacher_id === teacher.data?.id && subjects.data?.some(subject => subject.id === item.subject_id)).map(item => item.class_id))])
          }
        }
      } catch (failure) {
        if (active) setError(typeof failure === 'object' && failure && 'code' in failure && failure.code === 'PGRST205' ? 'Layanan absensi sedang disiapkan. Hubungi pengelola aplikasi.' : 'Absensi belum dapat dimuat. Periksa koneksi atau coba lagi.')
      } finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [userId,page,attempt])

  useEffect(() => {
    let active = true
    setRecords([]); setHistory([]); setDraft({}); setRecordsError(''); setSaveError(''); setConfirmChanges(null); setHistoryTruncated(false)
    if (!selected) return
    setRecordsLoading(true)
    async function load() {
      try {
        if (!supabase) throw new Error('configuration')
        const result = await supabase.from('attendance_records').select('id,session_id,student_code,student_name,status,revision').eq('session_id',selected).order('student_name').limit(101)
        if (result.error) throw result.error
        if ((result.data?.length ?? 0)>100) throw new Error('Roster too large')
        if (!active) return
        const data = (result.data ?? []) as AttendanceRecord[]
        setRecords(data)
        setDraft(Object.fromEntries(data.map(record => [record.id,{ status: record.status ?? '', reason: '' }])))
        if (!isStudent(role) && data.length) {
          const audit = await supabase.from('attendance_changes').select('id,record_id,old_status,new_status,reason,created_at').in('record_id',data.map(record => record.id)).order('created_at',{ ascending: false }).limit(201)
          if (audit.error) throw audit.error
          if (active) {
            setHistory(((audit.data ?? []) as History[]).slice(0, 200))
            setHistoryTruncated((audit.data?.length ?? 0) > 200)
          }
        }
      } catch { if (active) setRecordsError('Daftar hadir atau riwayat belum dapat dimuat. Silakan coba lagi.') }
      finally { if (active) setRecordsLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [selected,recordsAttempt,role])

  const refreshRecords = useCallback(() => setRecordsAttempt(value => value + 1), [])
  function discardChanges() {
    return !dirty || window.confirm('Perubahan belum disimpan. Buang perubahan dan lanjutkan?')
  }
  function askSave() {
    const prepared = prepareAttendanceChanges(records,draft)
    setSaveError(prepared.error)
    if (!prepared.error) setConfirmChanges(prepared.changes)
  }
  async function save() {
    if (!supabase || !canWrite || !confirmChanges || saving) return
    setSaving(true); setSaveError(''); setMessage('')
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) throw new TypeError('offline')
      const { data,error } = await supabase.rpc('record_attendance',{ target_session: selected, changes: confirmChanges })
      if (error) throw error
      setConfirmChanges(null)
      setMessage(`${data} catatan kehadiran berhasil disimpan.`)
      setRecordsAttempt(value => value+1)
    } catch (failure) {
      const offline = failure instanceof TypeError || isNetworkFailure(failure as { code?: unknown; message?: unknown })
      if (offline && current) {
        try {
          enqueueAttendance(userId, { sessionId: selected, sessionLabel: `${current.held_on} · ${classLabel(current.class_id)}`, changes: confirmChanges })
          setConfirmChanges(null)
          setQueueVersion(value => value + 1)
          setMessage(`${confirmChanges.length} perubahan disimpan di perangkat dan belum tersinkron. Data akan dikirim otomatis saat koneksi kembali.`)
          return
        } catch (queueFailure) {
          setConfirmChanges(null)
          setSaveError(queueFailure instanceof Error ? queueFailure.message : 'Absensi belum tersimpan di perangkat.')
          return
        }
      }
      setConfirmChanges(null)
      setSaveError(typeof failure === 'object' && failure && 'code' in failure && failure.code === '40001' ? 'Data telah diubah pada sesi lain. Muat ulang absensi sebelum menyimpan kembali.' : 'Absensi belum tersimpan. Periksa izin penugasan, status, dan alasan koreksi, lalu coba lagi.')
    } finally { setSaving(false) }
  }
  async function createSession() {
    if (!supabase || !isTeacher(role) || !allowedClasses.includes(newClass) || saving) return
    setSaving(true); setSaveError(''); setMessage('')
    try {
      const { data, error } = await supabase.from('attendance_sessions').insert({ class_id: newClass, held_on: schoolToday() }).select('id').single()
      if (error) throw error
      setConfirmCreate(false); setSelected(data.id); setPage(0); setAttempt(value => value+1)
      setMessage('Sesi hari ini dibuat. Seluruh peserta masih berstatus belum diisi.')
    } catch (failure) {
      setConfirmCreate(false)
      setSaveError(typeof failure === 'object' && failure && 'code' in failure && failure.code === '23505' ? 'Sesi kelas hari ini sudah ada. Pilih sesi tersebut pada daftar.' : 'Sesi belum dapat dibuat. Pastikan kelas memiliki siswa aktif, kalender tahun ajaran sesuai hari ini, dan penugasan Anda masih berlaku.')
    } finally { setSaving(false) }
  }
  function classLabel(id: string) {
    const classroom = classes.find(item => item.id===id)
    return classroom ? `${classroom.name} · ${years[classroom.academic_year_id] ?? ''}` : 'Kelas tidak tersedia'
  }
  function exportRecords() {
    if(!current) return
    downloadCsv(`absensi-${current?.held_on ?? 'kelas'}.csv`,createCsv(['Kelas','Tanggal','Kode siswa','Nama','Status'],records.map(record => [classLabel(current!.class_id),current!.held_on,record.student_code,record.student_name,record.status ? attendanceLabels[record.status] : 'Belum diisi'])))
  }
  const summary = attendanceSummary(records)

  return <section className="board attendance"><div className="board-heading"><div><div className="eyebrow">KEHADIRAN SEKOLAH</div><h1>Absensi</h1><p>Sesi harian kelas dan catatan kehadiran yang dapat Anda akses.</p></div><Link to="/dashboard">Dashboard</Link></div>
    {message && <p className="status" role="status">{message}</p>}
    <ReferenceNotice truncated={referencesTruncated}/>
    {canWrite && <OfflineAttendanceQueue userId={userId} version={queueVersion} onSynced={refreshRecords}/>}
    {saveError && <ErrorNotice>{saveError}</ErrorNotice>}
    {loading ? <LoadingState/> : error ? <ErrorNotice onRetry={() => setAttempt(value => value+1)}>{error}</ErrorNotice> : !allowed ? <EmptyState>Anda belum memiliki akses absensi. Akses orang tua menunggu relasi wali yang terverifikasi.</EmptyState> : <>
      <AttendanceReport classes={classes.map(item=>({id:item.id,label:classLabel(item.id)}))}/>
      {isTeacher(role) && <div className="announcement-editor"><h2>Mulai absensi hari ini</h2><p>Tanggal {schoolToday()} (Asia/Jakarta). Peserta mengikuti anggota kelas aktif saat sesi dibuat; tidak ada status hadir otomatis. Pembuatan sesi lampau belum tersedia.</p><label htmlFor="attendance-class">Kelas penugasan</label><select id="attendance-class" value={newClass} disabled={saving || confirmCreate || dirty} onChange={event=>setNewClass(event.target.value)}><option value="">Pilih kelas</option>{classes.filter(item=>item.is_active && allowedClasses.includes(item.id)).map(item=><option key={item.id} value={item.id}>{classLabel(item.id)}</option>)}</select>
        {!allowedClasses.length && <p className="help">Belum ada penugasan aktif yang terhubung dengan akun Anda.</p>}
        {confirmCreate ? <div role="alertdialog" aria-modal="false" aria-labelledby="create-attendance"><h3 id="create-attendance">Buat sesi dengan peserta aktif kelas ini?</h3><button className="button" disabled={saving} onClick={()=>void createSession()}>Ya, buat sesi</button><button className="button secondary" disabled={saving} onClick={()=>setConfirmCreate(false)}>Batal</button></div> : <button className="button" disabled={!newClass || saving || dirty} onClick={()=>setConfirmCreate(true)}>Mulai sesi hari ini</button>}
      </div>}
      {!sessions.length ? <EmptyState>Belum ada sesi absensi yang dapat ditampilkan.</EmptyState> : <><label htmlFor="attendance-session">Sesi absensi</label><select className="session-picker" id="attendance-session" value={selected} disabled={saving || Boolean(confirmChanges)} onChange={event=>{ if(discardChanges()) { setSelected(event.target.value); setMessage('') } }}>{sessions.map(item=><option key={item.id} value={item.id}>{item.held_on} · {classLabel(item.class_id)}</option>)}</select>
        <nav className="pagination" aria-label="Halaman sesi absensi"><button disabled={page===0 || saving} onClick={()=>{ if(discardChanges()) setPage(value=>value-1) }}>Sebelumnya</button><span>Halaman {page+1}</span><button disabled={!hasNext || saving} onClick={()=>{ if(discardChanges()) setPage(value=>value+1) }}>Berikutnya</button></nav>
        {recordsLoading ? <LoadingState>Memuat daftar hadir…</LoadingState> : recordsError ? <ErrorNotice onRetry={()=>setRecordsAttempt(value=>value+1)}>{recordsError}</ErrorNotice> : !records.length ? <EmptyState>Tidak ada catatan yang dapat ditampilkan untuk akun Anda.</EmptyState> : <>
          <h2>Rekap data yang dapat Anda akses</h2><div className="attendance-summary">{Object.entries(attendanceLabels).map(([key,label])=><span key={key}>{label}: <strong>{summary[key as keyof typeof attendanceLabels]}</strong></span>)}<span>Belum diisi: <strong>{summary.unmarked}</strong></span></div>
          <div className="actions"><button className="refresh-button" onClick={exportRecords} disabled={saving}>Ekspor data tersimpan (CSV)</button><button className="refresh-button" disabled={saving} onClick={()=>{ if(discardChanges()) setRecordsAttempt(value=>value+1) }}>Muat ulang absensi</button></div>
          <div className="table-scroll" role="region" aria-label="Tabel daftar hadir yang dapat digeser" tabIndex={0}><table><caption>Daftar hadir {current?.held_on}</caption><thead><tr><th scope="col">Kode</th><th scope="col">Nama siswa</th><th scope="col">Status</th>{canWrite && <th scope="col">Alasan koreksi</th>}</tr></thead><tbody>{records.map(record=><tr key={record.id}><td>{record.student_code}</td><td>{record.student_name}</td><td>{canWrite ? <><label className="sr-only" htmlFor={`status-${record.id}`}>Status {record.student_name}</label><select id={`status-${record.id}`} disabled={saving || Boolean(confirmChanges)} value={draft[record.id]?.status ?? ''} onChange={event=>setDraft({...draft,[record.id]:{...draft[record.id],status:event.target.value}})}><option value="" disabled={record.status!==null}>Belum diisi</option>{Object.entries(attendanceLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></> : record.status ? attendanceLabels[record.status] : 'Belum diisi'}</td>{canWrite && <td>{record.status!==null && draft[record.id]?.status!==record.status ? <><label className="sr-only" htmlFor={`reason-${record.id}`}>Alasan koreksi {record.student_name}</label><input id={`reason-${record.id}`} minLength={5} maxLength={300} disabled={saving || Boolean(confirmChanges)} value={draft[record.id]?.reason ?? ''} onChange={event=>setDraft({...draft,[record.id]:{...draft[record.id],reason:event.target.value}})}/></> : '-'}</td>}</tr>)}</tbody></table></div>
          {canWrite && (confirmChanges ? <div className="confirm-panel" role="alertdialog" aria-modal="false" aria-labelledby="save-attendance"><h3 id="save-attendance">Simpan {confirmChanges.length} perubahan?</h3><p>Perubahan dan pelakunya akan tercatat. Jika satu catatan gagal, seluruh perubahan ini tidak disimpan.</p><div className="actions"><button className="button" disabled={saving} onClick={()=>void save()}>{saving ? 'Menyimpan…' : 'Ya, simpan absensi'}</button><button className="button secondary" disabled={saving} onClick={()=>setConfirmChanges(null)}>Batal</button></div></div> : <button className="button" disabled={saving || !dirty} onClick={askSave}>Simpan absensi</button>)}
          {!isStudent(role) && current && <AttendanceImport key={`${selected}:${recordsAttempt}`} sessionId={selected} sessionLabel={`${current.held_on} · ${classLabel(current.class_id)}`} sessionDate={current.held_on} records={records} canWrite={canWrite} hasDraftChanges={dirty} busy={saving} onBusyChange={setSaving} onImported={count=>{setMessage(`${count} catatan kehadiran berhasil diimpor.`);setRecordsAttempt(value=>value+1)}}/>}
          {!isStudent(role) && <section><h2>Riwayat pencatatan dan koreksi</h2><p className="help">Menampilkan paling banyak 200 perubahan terbaru. Pelaku dan waktu dicatat otomatis.</p>{historyTruncated && <p className="status" role="status">Riwayat dipotong pada 200 perubahan terbaru; perubahan yang lebih lama tidak dimuat di sini.</p>}{!history.length ? <EmptyState>Belum ada riwayat pencatatan.</EmptyState> : <ul className="attendance-history">{history.map(item=><li key={item.id}><strong>{records.find(record=>record.id===item.record_id)?.student_name ?? 'Siswa'}</strong><span>{item.old_status ? attendanceLabels[item.old_status] : 'Belum diisi'} → {attendanceLabels[item.new_status]}</span><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})}</time>{item.reason && <p>{item.reason}</p>}</li>)}</ul>}</section>}
        </>}
      </>}
    </>}
  </section>
}
