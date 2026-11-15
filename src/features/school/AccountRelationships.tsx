import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../app/Auth'
import { supabase } from '../../lib/supabase'

const kinds = { teacher: 'Guru', student: 'Siswa', parent: 'Wali siswa' }
const kindRoleLabels = { teacher: 'guru', student: 'siswa', parent: 'wali siswa' }
type Kind = keyof typeof kinds
type Relationship = {
  kind: Kind
  registryId: string
  profileId: string
  registryName: string
  active: boolean
  reason: string
}

const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i

export function AccountRelationships() {
  const { session } = useAuth()
  return session && <RelationshipForm key={session.user.id} userId={session.user.id} />
}

function RelationshipForm({ userId }: { userId: string }) {
  const [access, setAccess] = useState<'loading' | 'allowed' | 'denied' | 'error'>('loading')
  const [kind, setKind] = useState<Kind>('teacher')
  const [code, setCode] = useState('')
  const [profileId, setProfileId] = useState('')
  const [reason, setReason] = useState('')
  const [active, setActive] = useState(true)
  const [pending, setPending] = useState<Relationship | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const client = supabase
    if (!client) {
      setAccess('denied')
      return
    }
    let mounted = true
    const load = async () => {
      try {
        const result = await client.from('profiles').select('role').eq('id', userId).maybeSingle()
        if (mounted) setAccess(result.error ? 'error' : result.data?.role === 'administrator' ? 'allowed' : 'denied')
      } catch {
        if (mounted) setAccess('error')
      }
    }
    void load()
    return () => { mounted = false }
  }, [userId])

  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || busy || access !== 'allowed') return
    setMessage('')
    setError('')
    const registryCode = code.trim().toUpperCase()
    const target = profileId.trim()
    const note = reason.trim()
    if (!/^[A-Z0-9_-]{1,30}$/.test(registryCode) || !uuid.test(target) || note.length < 5 || note.length > 300) {
      setError('Isi kode registri, ID akun yang valid, dan alasan sepanjang 5–300 karakter.')
      return
    }
    setBusy(true)
    try {
      const profileQuery = await supabase.from('profiles').select('role').eq('id', target).maybeSingle()
      if (profileQuery.error) throw profileQuery.error
      if (!profileQuery.data || profileQuery.data.role !== kind) {
        setError(`ID akun harus berperan sebagai ${kindRoleLabels[kind]} sebelum tautan dibuat.`)
        return
      }

      const { data, error: failure } = await supabase.from(kind === 'teacher' ? 'teachers' : 'students')
        .select('id,name,is_active').eq('code', registryCode).maybeSingle()
      if (failure) throw failure
      if (!data || (active && !data.is_active)) {
        setError('Kode registri tidak ditemukan atau catatannya sudah tidak aktif.')
        return
      }
      setPending({ kind, registryId: data.id, registryName: data.name, profileId: target, active, reason: note })
    } catch {
      setError('Data registri gagal dimuat. Silakan coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (!supabase || busy || !pending || access !== 'allowed') return
    setBusy(true)
    setError('')
    try {
      const { data, error: failure } = await supabase.rpc('set_account_relationship', {
        relationship_kind: pending.kind,
        registry_id: pending.registryId,
        profile_id: pending.profileId,
        active: pending.active,
        reason: pending.reason,
      })
      if (failure) {
        setError(failure.code === '23514' || failure.code === '23505'
          ? 'Peran akun atau tautan yang tersimpan tidak cocok. Periksa kembali data verifikasi.'
          : 'Perubahan gagal disimpan. Silakan coba lagi.')
        return
      }
      setMessage(data ? 'Perubahan tersimpan dan tercatat.' : 'Tautan sudah sesuai. Tidak ada perubahan.')
      setPending(null)
      setProfileId('')
      setReason('')
    } catch {
      setError('Hasil penyimpanan belum diketahui. Coba lagi untuk memastikan.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="workspace">
    <h1>Tautan akun sekolah</h1>
    {access === 'loading' && <p role="status">Memeriksa izin…</p>}
    {access === 'error' && <p role="alert">Izin gagal dimuat. Silakan muat ulang halaman.</p>}
    {access === 'denied' && <p>Halaman ini tersedia untuk administrator sekolah.</p>}
    {access === 'allowed' && <>
      <p>Cocokkan identitas melalui prosedur sekolah sebelum mengaitkan akun guru, siswa, atau wali. Gunakan ID yang ditampilkan di halaman Akun.</p>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
      <form className="announcement-editor" onSubmit={review}>
        <fieldset disabled={busy || Boolean(pending)}>
          <legend>Data tautan</legend>
          <label htmlFor="relationship-kind">Jenis tautan</label>
          <select id="relationship-kind" value={kind} onChange={event => setKind(event.target.value as Kind)}>
            {Object.entries(kinds).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label htmlFor="relationship-action">Tindakan</label>
          <select id="relationship-action" value={active ? 'link' : 'unlink'} onChange={event => setActive(event.target.value === 'link')}>
            <option value="link">Kaitkan akun</option>
            <option value="unlink">Cabut tautan</option>
          </select>
          <label htmlFor="relationship-code">Kode {kind === 'teacher' ? 'guru' : 'siswa'}</label>
          <input id="relationship-code" value={code} onChange={event => setCode(event.target.value)} required maxLength={30} />
          <label htmlFor="relationship-profile">ID akun</label>
          <input id="relationship-profile" value={profileId} onChange={event => setProfileId(event.target.value)} required maxLength={36} />
          <label htmlFor="relationship-reason">Alasan verifikasi atau pencabutan</label>
          <textarea id="relationship-reason" value={reason} onChange={event => setReason(event.target.value)} required minLength={5} maxLength={300} />
          <button className="button" type="submit">{busy ? 'Memeriksa…' : 'Tinjau tautan'}</button>
        </fieldset>
      </form>
      {pending && <div className="confirm-panel" role="alertdialog" aria-labelledby="relationship-confirm">
        <h2 id="relationship-confirm">{pending.active ? 'Kaitkan akun ini?' : 'Cabut tautan ini?'}</h2>
        <p>{kinds[pending.kind]} · {pending.registryName}</p>
        <p>ID akun <code>{pending.profileId}</code></p>
        <button className="button" type="button" disabled={busy} onClick={() => void save()}>{busy ? 'Menyimpan…' : 'Ya, simpan'}</button>
        <button className="button secondary" type="button" disabled={busy} onClick={() => { setPending(null); setError('') }}>Kembali</button>
      </div>}
    </>}
  </section>
}
