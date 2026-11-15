import { useEffect, useState, type FormEvent } from 'react'
import { getDemoProfile, isDemoModeEnabled, updateDemoProfile } from '../lib/demo-auth'
import { supabase } from '../lib/supabase'
import { schoolRoleLabels } from '../lib/school'

type ProfileData = { id: string; full_name: string; role: string }

export function Profile({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    const client = supabase
    if (isDemoModeEnabled()) {
      const demoProfile = getDemoProfile(userId)
      if (active) {
        setProfile(demoProfile ? { id: demoProfile.id, full_name: demoProfile.full_name, role: demoProfile.role } : null)
        setName(demoProfile?.full_name ?? '')
        setLoading(false)
      }
      return () => { active = false }
    }

    const load = async () => {
      if (!client) {
        if (active) setLoading(false)
        return
      }
      try {
        const { data, error: failure } = await client.from('profiles').select('id, full_name, role').eq('id', userId).maybeSingle()
        if (failure) throw failure
        if (active) {
          setProfile(data)
          setName(data?.full_name ?? '')
          if (!data) setError('Profil belum tersedia. Hubungi administrator sekolah.')
        }
      } catch {
        if (active) setError('Profil tidak dapat dimuat. Coba lagi atau hubungi administrator untuk memeriksa database.')
      } finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [userId, attempt])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const fullName = name.trim()
    if (!fullName || fullName.length > 120) { setError('Isi nama antara 1 dan 120 karakter.'); return }
    setSaving(true)
    setError('')
    setMessage('')

    if (isDemoModeEnabled()) {
      try {
        updateDemoProfile(userId, fullName)
        const nextProfile = getDemoProfile(userId)
        if (!nextProfile) {
          setError('Nama belum berhasil disimpan. Silakan coba lagi.')
          return
        }
        setProfile({ id: nextProfile.id, full_name: nextProfile.full_name, role: nextProfile.role })
        setName(nextProfile.full_name)
        setMessage('Nama berhasil disimpan.')
      } catch {
        setError('Nama belum berhasil disimpan. Silakan coba lagi.')
      } finally { setSaving(false) }
      return
    }

    const client = supabase
    if (!client) {
      setError('Konfigurasi Supabase belum tersedia. Periksa pengaturan sekolah.')
      setSaving(false)
      return
    }
    try {
      const { data, error: failure } = await client.from('profiles').update({ full_name: fullName }).eq('id', userId).select('id, full_name, role').single()
      if (failure) throw failure
      setProfile(data)
      setName(data.full_name)
      setMessage('Nama berhasil disimpan.')
    } catch { setError('Nama belum berhasil disimpan. Silakan coba lagi.') }
    finally { setSaving(false) }
  }

  if (loading) return <p role="status">Memuat profil…</p>
  return <div>
    {error && <p className="error" role="alert">{error}</p>}
    {!profile ? <button className="button" onClick={() => setAttempt(value => value + 1)}>Coba muat profil</button> : <>
      <div className="status">Peran: <strong>{schoolRoleLabels[profile.role] ?? 'Belum tersedia'}</strong>{profile.role === 'pending' && <p>Administrator perlu menetapkan peran Anda sebelum layanan sekolah dapat digunakan.</p>}</div>
      <form onSubmit={save}>
        <label htmlFor="full-name">Nama lengkap</label>
        <input id="full-name" autoComplete="name" required maxLength={120} value={name} disabled={saving} onChange={event => { setName(event.target.value); setMessage('') }} />
        <button className="button" disabled={saving || name.trim() === profile.full_name} type="submit">{saving ? 'Menyimpan…' : 'Simpan nama'}</button>
        {message && <p role="status">{message}</p>}
      </form>
    </>}
  </div>
}
