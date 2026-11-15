import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { DEMO_ACCOUNTS, clearDemoSession, isDemoModeEnabled, signInDemo } from '../lib/demo-auth'
import { supabase } from '../lib/supabase'
import { useAuth } from './Auth'
import { Profile } from './Profile'

export function Login() {
  const { session, loading, error: sessionError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    if (!supabase) {
      if (!isDemoModeEnabled()) {
        setError('Konfigurasi Supabase tidak ditemukan. Hubungi administrator sekolah.')
        return
      }
      const demoSession = signInDemo(email, password)
      if (!demoSession) {
        setError('Akun demo tidak valid. Gunakan salah satu akun yang tersedia di panel demo.')
        return
      }
      window.location.assign('/dashboard')
      return
    }

    setBusy(true)
    setError('')
    try {
      const { error: failure } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (failure) setError('Tidak dapat masuk. Periksa email dan kata sandi, lalu coba lagi.')
    } catch { setError('Koneksi bermasalah. Silakan coba lagi.') }
    finally { setBusy(false) }
  }
  if (loading) return <section className="login" role="status">Memuat sesi…</section>
  if (session) return <Navigate to="/dashboard" replace />
  return <section className="login"><h1>Masuk SI STIR HEBAT</h1><p>Gunakan akun yang diberikan oleh administrator sekolah.</p>
    {isDemoModeEnabled() && <div className="status"><p>Mode demo aktif. Gunakan akun berikut:</p><div className="demo-list">{DEMO_ACCOUNTS.map((account) => <button key={account.email} type="button" className="text-button" onClick={() => { setEmail(account.email); setPassword(account.password) }}>{account.full_name} ({account.role})</button>)}</div></div>}
    <form onSubmit={submit}>
      <label htmlFor="email">Email</label><input id="email" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} disabled={busy} />
      <label htmlFor="password">Kata sandi</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />
      {(error || sessionError) && <p className="error" role="alert">{error || sessionError}</p>}
      <button className="button" type="submit" disabled={busy}>{busy ? 'Sedang masuk…' : 'Masuk'}</button>
    </form><p><Link to="/lupa-kata-sandi">Lupa kata sandi?</Link></p><p className="help">Belum memiliki akun? Hubungi administrator sekolah.</p><Link to="/">Kembali ke beranda</Link>
  </section>
}

export function Account() {
  const { session } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function signOut() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      if (isDemoModeEnabled()) {
        clearDemoSession()
        window.location.assign('/')
        return
      }
      if (!supabase) {
        setError('Konfigurasi Supabase tidak ditemukan. Hubungi administrator sekolah.')
        return
      }
      const { error: failure } = await supabase.auth.signOut({ scope: 'local' })
      if (failure) setError('Belum berhasil keluar. Silakan coba lagi.')
    } catch { setError('Koneksi bermasalah. Silakan coba lagi.') }
    finally { setBusy(false) }
  }
  return <section className="login"><div className="eyebrow">AKUN SEKOLAH</div><h1>Selamat datang</h1><p>Anda masuk sebagai <strong>{session?.user.email}</strong>.</p>{supabase && session && <p>ID akun sekolah <code>{session.user.id}</code></p>}{session && <Profile key={session.user.id} userId={session.user.id} />}<p><Link to="/pengumuman">Buka pengumuman sekolah</Link></p><p><Link to="/kata-sandi">Ubah kata sandi</Link></p>{error && <p className="error" role="alert">{error}</p>}<button className="button" disabled={busy} onClick={signOut}>{busy ? 'Sedang keluar…' : 'Keluar'}</button></section>
}
