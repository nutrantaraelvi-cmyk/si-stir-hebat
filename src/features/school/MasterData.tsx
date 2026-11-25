import { hasMoreReferences, referenceLimit } from '../../utils/references'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { useAuth } from '../../components/auth/auth-context'
import { supabase } from '../../lib/supabase'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { ReferenceNotice } from '../../components/ui/ReferenceNotice'
import { canReadMasterData, masterDefinitions, masterPayload, validateMaster, type MasterKind, type MasterRow, type ReferenceTable } from './master'
import { createCsv, downloadCsv } from '../../utils/csv'
import { isAdministrator, isPending, isPrincipal, isTeacher } from '../../utils/permissions'

const pageSize = 20

export function MasterData() {
  const { session } = useAuth()
  const { kind = 'school_settings' } = useParams()
  if (!Object.hasOwn(masterDefinitions, kind)) return <section className="board"><h1>Data master tidak ditemukan</h1><Link to="/sekolah">Kembali ke data sekolah</Link></section>
  return session ? <MasterManager key={`${session.user.id}:${kind}`} userId={session.user.id} kind={kind as MasterKind}/> : null
}

function MasterManager({ userId, kind }: { userId: string; kind: MasterKind }) {
  const definition = masterDefinitions[kind]
  const [role, setRole] = useState<string | null>(null)
  const [rows, setRows] = useState<MasterRow[]>([])
  const [years, setYears] = useState<MasterRow[]>([])
  const [references, setReferences] = useState<Partial<Record<ReferenceTable, MasterRow[]>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [editing, setEditing] = useState<MasterRow | 'new' | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [confirming, setConfirming] = useState(false)
  const [referencesTruncated, setReferencesTruncated] = useState(false)
  const canWrite = isAdministrator(role)
  const requiresYear = definition.fields.some(field => field.type === 'year' || field.reference === 'school_classes')
  const referenceTables = definition.fields.flatMap(field => field.reference ? [field.reference] : [])
  const missingReferences = referenceTables.some(table => !references[table]?.some(row => row.is_active))

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setRole(null)
    setRows([])
    setReferencesTruncated(false)
    async function load() {
      try {
        if (!supabase) throw new Error('configuration')
        const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
        if (profileError) throw profileError
        if (!active) return
        setRole(profile?.role ?? null)
        if (!canReadMasterData(kind, profile?.role ?? null)) return
        const columns = ['id', ...definition.fields.map(field => field.key)].join(',')
        const requests: PromiseLike<{ data: unknown; error: unknown }>[] = [supabase.from(kind).select(columns).order('created_at', { ascending: false }).order('id').range(page * pageSize, page * pageSize + pageSize)]
        if (requiresYear) requests.push(supabase.from('academic_years').select('id,name,starts_on,ends_on').order('starts_on', { ascending: false }).limit(201))
        const results = await Promise.all(requests)
        for (const result of results) if (result.error) throw result.error
        if (!active) return
        const data = results[0].data as unknown as MasterRow[]
        setRows(data.slice(0, pageSize))
        setHasNext(data.length > pageSize)
        const yearRows = (results[1]?.data ?? []) as unknown as MasterRow[]
        const yearsTruncated = yearRows.length > 200
        setYears(yearRows.slice(0, 200))
        const tables = definition.fields.flatMap(field => field.reference ? [field.reference] : [])
        if (tables.length) {
          let truncated = yearsTruncated
          const choices = await Promise.all(tables.map(async table => {
            const columns = table === 'school_classes' ? 'id,name,is_active,academic_year_id' : 'id,name,is_active,code'
            const result = await supabase!.from(table).select(columns, { count: 'exact' }).order('name').limit(referenceLimit)
            if (result.error) throw result.error
            if (hasMoreReferences(result)) truncated = true
            return [table, result.data.slice(0, referenceLimit) as unknown as MasterRow[]] as const
          }))
          if (active) {
            setReferences(Object.fromEntries(choices))
            setReferencesTruncated(truncated)
          }
        } else if (active && yearsTruncated) setReferencesTruncated(true)
      } catch (failure) {
        if (active) setError(typeof failure === 'object' && failure && 'code' in failure && failure.code === 'PGRST205'
          ? 'Layanan data sekolah sedang disiapkan. Silakan hubungi pengelola aplikasi.'
          : 'Data sekolah belum dapat dimuat. Periksa koneksi atau coba lagi.')
      } finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [userId, kind, definition, requiresYear, page, attempt])

  function openEditor(row: MasterRow | 'new') {
    const initial: Record<string, string> = {}
    definition.fields.forEach(field => { initial[field.key] = row === 'new' ? field.type === 'checkbox' ? 'false' : '' : String(row[field.key] ?? '') })
    setValues(initial)
    setEditing(row)
    setSaveError('')
    setMessage('')
  }

  async function persist() {
    if (!supabase || !canWrite || !editing || saving) return
    setSaving(true)
    setSaveError('')
    setMessage('')
    try {
      const payload = masterPayload(kind, values)
      const updates = referenceTables.length && editing !== 'new' ? { is_active: payload.is_active } : payload
      const query = editing === 'new'
        ? supabase.from(kind).insert(kind === 'school_settings' ? { ...payload, id: true } : payload)
        : supabase.from(kind).update(updates).eq('id', editing.id)
      const { error: failure } = await query.select('id').single()
      if (failure) throw failure
      setEditing(null)
      setConfirming(false)
      setMessage(`${definition.label} berhasil disimpan.`)
      setPage(0)
      setAttempt(value => value + 1)
    } catch (failure) {
      const code = typeof failure === 'object' && failure && 'code' in failure ? failure.code : ''
      setSaveError(code === '23505' ? 'Data sudah ada atau ada keanggotaan/periode aktif lain. Periksa duplikasi dan nonaktifkan data lama sebelum memindahkan atau mengaktifkan yang baru.'
        : code === '23514' ? 'Data belum memenuhi aturan sekolah. Periksa tanggal, kapasitas kelas, serta status aktif siswa/guru/kelas/mata pelajaran.'
        : 'Data belum berhasil disimpan. Periksa koneksi dan izin akun, lalu coba lagi.')
      setConfirming(false)
    } finally { setSaving(false) }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const validation = validateMaster(kind, values)
    if (validation) { setSaveError(validation); return }
    const parentYear = years.find(year => year.id === values.academic_year_id)
    if (kind === 'semesters' && parentYear && (values.starts_on < String(parentYear.starts_on) || values.ends_on > String(parentYear.ends_on))) {
      setSaveError('Tanggal semester harus berada dalam tahun ajaran yang dipilih.'); return
    }
    if ((kind === 'class_enrollments' || kind === 'teacher_assignments') || (values.is_active === 'true' && (kind === 'academic_years' || kind === 'semesters') && (editing === 'new' || !editing?.is_active))) setConfirming(true)
    else void persist()
  }

  function cell(row: MasterRow, key: string) {
    const value = row[key]
    if (key === 'academic_year_id') return String(years.find(year => year.id === value)?.name ?? 'Tahun ajaran tidak tersedia')
    const reference = definition.fields.find(field => field.key === key)?.reference
    if (reference) {
      const target = references[reference]?.find(item => item.id === value)
      return target ? referenceLabel(target, reference) : 'Data terkait tidak tersedia'
    }
    if (typeof value === 'boolean') return value ? 'Aktif' : 'Nonaktif'
    return String(value ?? '') || '-'
  }

  function referenceLabel(row: MasterRow, table: ReferenceTable) {
    return table === 'school_classes'
      ? `${row.name} · ${years.find(year => year.id === row.academic_year_id)?.name ?? 'Tahun tidak tersedia'}`
      : `${row.code} · ${row.name}`
  }

  function rowTitle(row: MasterRow) {
    if (row.name) return String(row.name)
    if (row.number) return `Semester ${row.number}`
    return definition.fields.filter(field => field.reference).map(field => cell(row, field.key)).join(' / ')
  }

  function exportPage() {
    const fields = definition.fields
    downloadCsv(`${kind}-halaman-${page + 1}.csv`, createCsv(fields.map(field => field.label), rows.map(row => fields.map(field => cell(row, field.key)))))
  }

  return <section className="board master-data"><div className="board-heading"><div><div className="eyebrow">ADMINISTRASI SEKOLAH</div><h1>Data sekolah</h1><p>Identitas dan pengaturan dasar kegiatan sekolah.</p></div><Link to="/dashboard">Dashboard</Link></div>
    <nav className="master-tabs" aria-label="Jenis data sekolah">{Object.entries(masterDefinitions).filter(([key]) => canReadMasterData(key as MasterKind, role)).map(([key, item]) => <NavLink key={key} to={`/sekolah/${key}`}>{item.label}</NavLink>)}</nav>
    <h2>{definition.label}</h2>
    {message && <p className="status" role="status">{message}</p>}
    <ReferenceNotice truncated={referencesTruncated}/>
    {loading ? <LoadingState/> : error ? <ErrorNotice onRetry={() => setAttempt(value => value + 1)}>{error}</ErrorNotice> : !canReadMasterData(kind, role) ? <EmptyState>{isPending(role) ? 'Peran sekolah Anda belum ditetapkan. Hubungi administrator untuk akses data sekolah.' : 'Anda tidak memiliki izin untuk membuka jenis data ini.'}</EmptyState> : <>
      {(kind === 'teachers' || kind === 'students') && <p className="status">{canWrite ? 'Catat data resmi sekolah menggunakan kode internal yang unik. Pencatatan ini tidak membuat akun login atau mengubah peran pengguna.' : isPrincipal(role) ? 'Daftar ini hanya dapat dibaca. Perubahan dilakukan oleh administrator.' : isTeacher(role) && kind === 'students' ? 'Hanya siswa aktif dalam kelas yang ditugaskan kepada Anda yang ditampilkan.' : 'Hanya data yang telah dihubungkan dengan akun Anda yang ditampilkan.'}</p>}
      {canWrite && !editing && (kind !== 'school_settings' || rows.length === 0) && <button className="button" onClick={() => openEditor('new')} disabled={(requiresYear && years.length === 0) || missingReferences}>Tambah {definition.singular}</button>}
      {canWrite && missingReferences && <p className="status">Lengkapi data siswa/guru, kelas dan mata pelajaran yang aktif sebelum menambahkan relasi ini.</p>}
      {referenceTables.length > 0 && <p className="help">Untuk perpindahan atau perubahan penugasan, nonaktifkan relasi lama lalu tambahkan relasi baru. Pilihan pada relasi yang sudah disimpan tetap dipertahankan.</p>}
      {requiresYear && years.length === 0 && <p className="status">Tahun ajaran perlu ditambahkan terlebih dahulu. <Link to="/sekolah/academic_years">Buka tahun ajaran</Link></p>}
      {rows.length > 0 && <p><button className="refresh-button" onClick={exportPage}>Ekspor halaman ini (CSV)</button></p>}
      {editing && canWrite && <form className="announcement-editor" onSubmit={submit}>
        <h3>{editing === 'new' ? 'Tambah' : 'Ubah'} {definition.singular}</h3>
        {definition.fields.map(field => <div className="master-field" key={field.key}><label htmlFor={`master-${field.key}`}>{field.label}</label>{field.type === 'year' ? <select id={`master-${field.key}`} required value={values[field.key]} disabled={saving || confirming} onChange={event => setValues({ ...values, [field.key]: event.target.value })}><option value="">Pilih tahun ajaran</option>{years.map(year => <option key={String(year.id)} value={String(year.id)}>{String(year.name)}</option>)}</select>
          : field.type === 'reference' ? <select id={`master-${field.key}`} required value={values[field.key]} disabled={saving || confirming || editing !== 'new'} onChange={event => setValues({ ...values, [field.key]: event.target.value })}><option value="">Pilih {field.label.toLowerCase()}</option>{(references[field.reference!] ?? []).filter(row => row.is_active || row.id === values[field.key]).map(row => <option key={String(row.id)} value={String(row.id)}>{referenceLabel(row, field.reference!)}{!row.is_active ? ' (nonaktif)' : ''}</option>)}</select>
          : field.type === 'textarea' ? <textarea id={`master-${field.key}`} maxLength={field.maxLength} rows={3} value={values[field.key]} disabled={saving || confirming} onChange={event => setValues({ ...values, [field.key]: event.target.value })}/>
          : field.type === 'checkbox' ? <input id={`master-${field.key}`} type="checkbox" checked={values[field.key] === 'true'} disabled={saving || confirming} onChange={event => setValues({ ...values, [field.key]: String(event.target.checked) })}/>
          : <input id={`master-${field.key}`} type={field.type} required={field.required} min={field.min} max={field.max} maxLength={field.maxLength} value={values[field.key]} disabled={saving || confirming} onChange={event => setValues({ ...values, [field.key]: event.target.value })}/>}</div>)}
        {saveError && <ErrorNotice>{saveError}</ErrorNotice>}
        {confirming ? <div className="confirm-panel" role="alertdialog" aria-modal="false" aria-labelledby="confirm-period"><h3 id="confirm-period">{referenceTables.length ? 'Simpan relasi ini?' : 'Aktifkan periode ini?'}</h3><p>{referenceTables.length ? 'Pastikan pilihan dan status aktif benar. Relasi aktif dapat memengaruhi akses guru ke data siswa.' : 'Pastikan periode lama sudah dinonaktifkan dan kalender telah diperiksa.'}</p><div className="actions"><button className="button" type="button" disabled={saving} onClick={() => void persist()}>{saving ? 'Menyimpan…' : referenceTables.length ? 'Ya, simpan relasi' : 'Ya, aktifkan'}</button><button className="button secondary" type="button" disabled={saving} onClick={() => setConfirming(false)}>Kembali periksa</button></div></div>
          : <div className="actions"><button className="button" type="submit" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan data'}</button><button className="button secondary" type="button" disabled={saving} onClick={() => setEditing(null)}>Batal</button></div>}
      </form>}
      {!rows.length ? <EmptyState>Belum ada data {definition.singular} yang dapat ditampilkan untuk akun Anda.</EmptyState> : <div className="table-scroll" role="region" aria-label={`Tabel ${definition.label} yang dapat digeser`} tabIndex={0}><table><caption>{definition.label}</caption><thead><tr>{definition.fields.map(field => <th scope="col" key={field.key}>{field.label}</th>)}{canWrite && <th scope="col">Tindakan</th>}</tr></thead><tbody>{rows.map(row => <tr key={String(row.id)}>{definition.fields.map(field => <td key={field.key}>{cell(row, field.key)}</td>)}{canWrite && <td><button className="text-button" disabled={Boolean(editing) || saving} onClick={() => openEditor(row)}>Ubah<span className="sr-only"> {rowTitle(row)}</span></button></td>}</tr>)}</tbody></table></div>}
      <nav className="pagination" aria-label="Halaman data sekolah"><button disabled={page === 0 || Boolean(editing)} onClick={() => setPage(value => value - 1)}>Sebelumnya</button><span>Halaman {page + 1}</span><button disabled={!hasNext || Boolean(editing)} onClick={() => setPage(value => value + 1)}>Berikutnya</button></nav>
    </>}
  </section>
}
