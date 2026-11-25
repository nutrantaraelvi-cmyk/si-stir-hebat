import { hasMoreReferences, referenceLimit } from '../../utils/references'
import { canReadJournals, isTeacher } from '../../utils/permissions'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../components/auth/auth-context'
import { supabase } from '../../lib/supabase'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { ReferenceNotice } from '../../components/ui/ReferenceNotice'
import { createCsv, downloadCsv } from '../../utils/csv'
import { schoolToday } from '../../utils/date'
import { journalPayload, validateJournal, validateJournalRange, type JournalDraft } from './journal-model'

type Journal = JournalDraft & { id:string; held_on:string; class_name:string; subject_name:string; teacher_name:string; academic_year_name:string; created_at:string }
type Choice = { id:string; label:string }
type Editor = { id:string; held_on:string; draft:JournalDraft }
const pageSize=20
const columns='id,assignment_id,held_on,topic,activities,reflection,class_name,subject_name,teacher_name,academic_year_name,created_at'

export function Journals() {
  const { session }=useAuth()
  return session ? <JournalWorkspace key={session.user.id} userId={session.user.id}/> : null
}
function JournalWorkspace({userId}:{userId:string}) {
  const [role,setRole]=useState<string|null>(null)
  const [rows,setRows]=useState<Journal[]>([])
  const [choices,setChoices]=useState<Choice[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [saveError,setSaveError]=useState('')
  const [message,setMessage]=useState('')
  const [saving,setSaving]=useState(false)
  const [editor,setEditor]=useState<Editor|null>(null)
  const [confirm,setConfirm]=useState(false)
  const [page,setPage]=useState(0)
  const [hasNext,setHasNext]=useState(false)
  const [attempt,setAttempt]=useState(0)
  const [start,setStart]=useState('')
  const [end,setEnd]=useState('')
  const [range,setRange]=useState({start:'',end:''})
  const [filterError,setFilterError]=useState('')
  const [choicesTruncated,setChoicesTruncated]=useState(false)
  const filterDirty=start!==range.start || end!==range.end
  const allowed=canReadJournals(role)
  useEffect(()=>{
    let active=true
    setLoading(true);setError('');setRows([]);setChoices([]);setChoicesTruncated(false)
    async function load() {
      try {
        if(!supabase) throw new Error('configuration')
        const client=supabase
        const profile=await client.from('profiles').select('role').eq('id',userId).maybeSingle()
        if(profile.error) throw profile.error
        if(!active) return
        const nextRole=profile.data?.role??null
        setRole(nextRole)
        if(!canReadJournals(nextRole)) return
        let query=client.from('teaching_journals').select(columns).order('held_on',{ascending:false}).order('created_at',{ascending:false}).order('id').range(page*pageSize,page*pageSize+pageSize)
        if(range.start && range.end) query=query.gte('held_on',range.start).lte('held_on',range.end)
        const journal=await query
        if(journal.error) throw journal.error
        if(!active) return
        setRows((journal.data??[]).slice(0,pageSize) as Journal[]);setHasNext((journal.data?.length??0)>pageSize)
        if(isTeacher(nextRole)) {
          const [teacher,assignments,classes,subjects,years]=await Promise.all([
            client.from('teachers').select('id').eq('profile_id',userId).eq('is_active',true).maybeSingle(),
            client.from('teacher_assignments').select('id,teacher_id,class_id,subject_id', { count: 'exact' }).eq('is_active',true).limit(referenceLimit),
            client.from('school_classes').select('id,name,academic_year_id', { count: 'exact' }).eq('is_active',true).limit(referenceLimit),
            client.from('subjects').select('id,name', { count: 'exact' }).eq('is_active',true).limit(referenceLimit),
            client.from('academic_years').select('id,name').limit(201),
          ])
          for(const result of [teacher,assignments,classes,subjects,years]) if(result.error) throw result.error
          if(active) setChoicesTruncated([assignments,classes,subjects].some(result=>hasMoreReferences(result)) || (years.data?.length??0)>200)
          const options=(assignments.data??[]).filter(item=>item.teacher_id===teacher.data?.id).flatMap(item=>{
            const classroom=classes.data?.find(row=>row.id===item.class_id)
            const subject=subjects.data?.find(row=>row.id===item.subject_id)
            return classroom && subject ? [{id:item.id,label:`${classroom.name} · ${subject.name} · ${years.data?.find(row=>row.id===classroom.academic_year_id)?.name??'Tahun tidak tersedia'}`}] : []
          })
          if(active) setChoices(options.sort((a,b)=>a.label.localeCompare(b.label,'id')))
        }
      } catch(failure) {
        if(active) setError(typeof failure==='object' && failure && 'code' in failure && failure.code==='PGRST205' ? 'Layanan jurnal sedang disiapkan. Hubungi pengelola aplikasi.' : 'Jurnal atau penugasan belum dapat dimuat. Periksa koneksi lalu coba lagi.')
      } finally { if(active) setLoading(false) }
    }
    void load()
    return ()=>{active=false}
  },[userId,page,attempt,range.start,range.end])

  function applyRange(nextStart:string,nextEnd:string) {
    const invalid=validateJournalRange(nextStart,nextEnd)
    setFilterError(invalid)
    if(invalid || loading || saving || editor) return
    setStart(nextStart);setEnd(nextEnd);setRange({start:nextStart,end:nextEnd})
    setPage(0);setRows([]);setHasNext(false);setLoading(true);setAttempt(value=>value+1)
  }

  function openEditor() {
    setEditor({id:crypto.randomUUID(),held_on:schoolToday(),draft:{assignment_id:'',topic:'',activities:'',reflection:''}})
    setConfirm(false);setSaveError('');setMessage('')
  }
  async function persist() {
    if(!supabase || !editor || saving || !isTeacher(role)) return
    setSaving(true);setSaveError('');setMessage('')
    const payload={id:editor.id,held_on:editor.held_on,...journalPayload(editor.draft)}
    try {
      const saved=await supabase.from('teaching_journals').insert(payload).select('id').single()
      if(saved.error) {
        if(saved.error.code!=='23505') throw saved.error
        // A retry after a lost response may encounter the same client-generated ID.
        const previous=await supabase.from('teaching_journals').select('assignment_id,held_on,topic,activities,reflection').eq('id',payload.id).single()
        const fields=['assignment_id','held_on','topic','activities','reflection'] as const
        if(previous.error || !previous.data || fields.some(key=>previous.data[key]!==payload[key])) throw saved.error
      }
      setEditor(null);setConfirm(false);setMessage('Jurnal mengajar berhasil disimpan.');setPage(0);setAttempt(value=>value+1)
    } catch(failure) {
      const code=typeof failure==='object' && failure && 'code' in failure ? failure.code : ''
      setSaveError(code==='23514' ? 'Periksa isi dan kalender kelas. Jurnal hanya dapat dibuat untuk hari ini; buka catatan baru jika tanggal sudah berganti.' : code==='23505' ? 'ID catatan sudah digunakan dengan isi berbeda. Tutup form dan periksa daftar sebelum membuat catatan baru.' : 'Penyimpanan belum dapat dipastikan. Periksa izin/koneksi. Anda dapat mencoba lagi dengan isi yang sama; ID catatan tetap dipertahankan.')
      setConfirm(false)
    } finally { setSaving(false) }
  }
  function exportRows() {
    if(loading || error || filterDirty || !rows.length) return
    downloadCsv(`jurnal-${range.start ? `${range.start}-${range.end}` : 'semua-tanggal'}-halaman-${page+1}.csv`,createCsv(['Tanggal','Guru snapshot','Kelas snapshot','Mata pelajaran snapshot','Tahun snapshot','Topik','Kegiatan','Refleksi','Dicatat'],rows.map(row=>[row.held_on,row.teacher_name,row.class_name,row.subject_name,row.academic_year_name,row.topic,row.activities,row.reflection,row.created_at])))
  }
  return <section className="board journals-page"><div className="board-heading"><div><div className="eyebrow">KEGIATAN PEMBELAJARAN</div><h1>Jurnal mengajar</h1><p>Catatan kegiatan guru pada penugasan yang berwenang.</p></div><Link to="/dashboard">Dashboard</Link></div>
    {message && <p className="status" role="status">{message}</p>}
    {allowed && <form className="announcement-editor" aria-label="Filter tanggal jurnal" onSubmit={event=>{event.preventDefault();applyRange(start,end)}}><fieldset className="journal-fields" disabled={loading || saving || Boolean(editor)}><legend>Filter tanggal jurnal</legend><p>Tanggal awal dan akhir ikut dihitung. Kosongkan keduanya untuk semua tanggal. CSV hanya memuat halaman hasil yang ditampilkan.</p><label htmlFor="journal-start">Tanggal awal jurnal</label><input id="journal-start" type="date" value={start} onChange={event=>{setStart(event.target.value);setFilterError('')}}/><label htmlFor="journal-end">Tanggal akhir jurnal</label><input id="journal-end" type="date" value={end} onChange={event=>{setEnd(event.target.value);setFilterError('')}}/><div className="actions"><button className="button" type="submit">Terapkan filter jurnal</button><button className="button secondary" type="button" onClick={()=>applyRange('','')}>Semua tanggal</button></div></fieldset>{filterError && <ErrorNotice>{filterError}</ErrorNotice>}{filterDirty && <p className="help">Perubahan filter belum diterapkan. Ekspor dinonaktifkan sampai filter diterapkan atau dikembalikan ke nilai sebelumnya.</p>}</form>}
    {loading ? <LoadingState/> : error ? <ErrorNotice onRetry={()=>setAttempt(value=>value+1)}>{error}</ErrorNotice> : !allowed ? <EmptyState>Jurnal mengajar hanya tersedia bagi guru bertugas, kepala sekolah, dan administrator.</EmptyState> : <>
      <p className="help">Guru membuat catatan hari ini (Asia/Jakarta) sesuai kalender kelas. Catatan tersimpan tidak dapat diedit atau dihapus pada tahap ini. Administrator dan kepala sekolah membaca tanpa menyetujui atau mengubah isi. Nama guru/kelas/mapel/tahun disalin saat pencatatan.</p>
      {isTeacher(role) && <ReferenceNotice truncated={choicesTruncated}/>}
      {isTeacher(role) && !editor && <><button className="button" onClick={openEditor}>Catat jurnal hari ini</button>{!choices.length && <EmptyState>Belum ada penugasan aktif. Minta administrator menautkan akun dan menambahkan penugasan sebelum menyimpan jurnal.</EmptyState>}</>}
      {editor && <form className="announcement-editor" onSubmit={event=>{event.preventDefault();const invalid=validateJournal(editor.draft);setSaveError(invalid);if(!invalid) setConfirm(true)}}><h2>Catatan baru · {editor.held_on}</h2><fieldset className="journal-fields" disabled={saving || confirm}><legend>Isi jurnal</legend><label htmlFor="journal-assignment">Penugasan jurnal</label><select id="journal-assignment" value={editor.draft.assignment_id} onChange={event=>setEditor({...editor,draft:{...editor.draft,assignment_id:event.target.value}})} required><option value="">Pilih kelas dan mata pelajaran</option>{choices.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select>
        <label htmlFor="journal-topic">Topik</label><input id="journal-topic" maxLength={160} required value={editor.draft.topic} onChange={event=>setEditor({...editor,draft:{...editor.draft,topic:event.target.value}})}/>
        <label htmlFor="journal-activities">Kegiatan pembelajaran</label><textarea id="journal-activities" rows={5} maxLength={4000} required value={editor.draft.activities} onChange={event=>setEditor({...editor,draft:{...editor.draft,activities:event.target.value}})}/>
        <label htmlFor="journal-reflection">Refleksi (opsional)</label><textarea id="journal-reflection" rows={3} maxLength={2000} value={editor.draft.reflection} onChange={event=>setEditor({...editor,draft:{...editor.draft,reflection:event.target.value}})}/>
      </fieldset>{saveError && <ErrorNotice>{saveError}</ErrorNotice>}
      {confirm ? <div className="confirm-panel" role="alertdialog" aria-labelledby="journal-confirm"><h3 id="journal-confirm">Simpan jurnal ini?</h3><p>Isi akan tercatat bersama akun dan waktu. Catatan tersimpan tidak dapat diedit atau dihapus melalui aplikasi.</p><button className="button" type="button" disabled={saving} onClick={()=>void persist()}>Ya, simpan jurnal</button><button className="button secondary" type="button" disabled={saving} onClick={()=>setConfirm(false)}>Kembali ke form</button></div> : <button className="button" type="submit" disabled={saving}>Periksa jurnal</button>}
      <button type="button" className="refresh-button" disabled={saving} onClick={()=>{if(window.confirm('Tutup form dan buang isi yang belum tersimpan? Periksa daftar jika respons penyimpanan sebelumnya tidak pasti.')) {setEditor(null);setConfirm(false);setAttempt(value=>value+1)}}}>Tutup form</button></form>}
      <p>Filter aktif: {range.start ? `${range.start} sampai ${range.end}` : 'Semua tanggal'} · Halaman {page+1}</p>
      {!rows.length ? <EmptyState>Belum ada jurnal yang dapat Anda akses untuk filter ini.</EmptyState> : <><button className="refresh-button" onClick={exportRows} disabled={saving || filterDirty}>Ekspor halaman jurnal (CSV)</button><div className="announcement-list">{rows.map(row=><article className="announcement" key={row.id}><time dateTime={row.held_on}>{row.held_on}</time><h2>{row.topic}</h2><p>{row.teacher_name} · {row.class_name} · {row.subject_name} · {row.academic_year_name}</p><h3>Kegiatan</h3><p className="announcement-body">{row.activities}</p>{row.reflection && <><h3>Refleksi</h3><p className="announcement-body">{row.reflection}</p></>}<p className="help">Dicatat {new Date(row.created_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} (Asia/Jakarta).</p></article>)}</div></>}
      <nav className="pagination" aria-label="Halaman jurnal"><button disabled={page===0 || Boolean(editor)} onClick={()=>setPage(value=>value-1)}>Sebelumnya</button><span>Halaman {page+1}</span><button disabled={!hasNext || Boolean(editor)} onClick={()=>setPage(value=>value+1)}>Berikutnya</button></nav>
    </>}
  </section>
}
