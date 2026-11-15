import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getDemoProfileByEmail, isDemoModeEnabled, updateDemoPassword } from '../lib/demo-auth'
import { supabase } from '../lib/supabase'
import { validateNewPassword } from '../lib/password'
import { useAuth } from './Auth'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || sent) return
    if (isDemoModeEnabled()) {
      const account = getDemoProfileByEmail(email)
      if (!account) {
        setError('Email demo tidak ditemukan. Gunakan salah satu email akun demo yang tersedia pada halaman login.')
        return
      }
      setSent(true)
      return
    }
    const client = supabase
    if (!client) {
      setError('Konfigurasi Supabase belum tersedia. Periksa pengaturan sekolah.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const { error: failure } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: new URL('/kata-sandi', window.location.origin).href,
      })
      if (failure) setError('Permintaan belum dapat diproses. Coba lagi nanti atau hubungi administrator sekolah.')
      else setSent(true)
    } catch { setError('Koneksi bermasalah. Silakan coba lagi.') }
    finally { setBusy(false) }
  }
  return <section className="login"><h1>Lupa kata sandi?</h1><p>Masukkan email akun sekolah untuk meminta tautin pemulihan.</p>
    {isDemoModeEnabled() && <div className="status">Mode demo aktif. Gunakan salah satu akun demo yang terdaftar pada halaman masuk.</div>}
    {sent ? <div className="status" role="status">Jika email terdaftar, Anda akan menerima tautan pemulihan. Periksa kotak masuk dan folder spam. Jika email belum diterima, hubungi administrator sekolah.</div> : <form onSubmit={submit}>
      <label htmlFor="recovery-email">Email akun sekolah</label>
      <input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} disabled={busy} />
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button" disabled={busy} type="submit">{busy ? 'Mengirim…' : 'Kirim tautan pemulihan'}</button>
    </form>}
    <Link to="/login">Kembali ke login</Link>
  </section>
}

export function ChangePassword() {
  const { session, loading, error: sessionError } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [invalidLink] = useState(() => {
    const url = new URL(window.location.href)
    const fragment = new URLSearchParams(url.hash.slice(1))
    return url.searchParams.has('error') || fragment.has('error') || fragment.has('error_code')
  })

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || saved || invalidLink) return
    const validation = validateNewPassword(password, confirmation)
    setError(validation)
    if (validation) return
    setBusy(true)

    if (isDemoModeEnabled()) {
      if (!session) {
        setBusy(false)
        return
      }
      updateDemoPassword(session.user.id, password)
      setPassword('')
      setConfirmation('')
      setSaved(true)
      setBusy(false)
      return
    }

    if (!session) {
      setBusy(false)
      return
    }
    const client = supabase
    if (!client) {
      setError('Konfigurasi Supabase belum tersedia. Periksa pengaturan sekolah.')
      setBusy(false)
      return
    }
    try {
      const { error: failure } = await client.auth.updateUser({ password })
      if (failure) setError('Kata sandi belum dapat diubah. Gunakan kata sandi baru yang memenuhi kebijakan sekolah. Jika sesi kedaluwarsa, minta tautan pemulihan baru.')
      else { setPassword(''); setConfirmation(''); setSaved(true) }
    } catch { setError('Koneksi bermasalah. Silakan coba lagi.') }
    finally { setBusy(false) }
  }

  if (loading) return <section className="login" role="status">Memuat sesi…</section>
  if (invalidLink || sessionError || !session) return <section className="login"><h1>Ubah kata sandi</h1><p role="alert">{sessionError || 'Buka tautan pemulihan yang masih berlaku atau masuk ke akun terlebih dahulu.'}</p><p><Link to="/lupa-kata-sandi">Minta tautan pemulihan baru</Link></p><Link to="/login">Kembali ke login</Link></section>
  return <section className="login"><h1>Ubah kata sandi</h1>
    {saved ? <div className="status" role="status">Kata sandi berhasil diubah. Gunakan kata sandi baru untuk login berikutnya.</div> : <>
      <p>Tetapkan kata sandi baru untuk <strong>{session.user.email}</strong>.</p>
      <form onSubmit={submit}>
        <label htmlFor="new-password">Kata sandi baru</label>
        <input id="new-password" type="password" autoComplete="new-password" minLength={8} required aria-describedby="password-help" value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />
        <p className="help" id="password-help">Minimal 8 karakter. Gunakan kata sandi yang unik dan sulit ditebak.</p>
        <label htmlFor="confirm-password">Konfirmasi kata sandi baru</label>
        <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="button" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan kata sandi'}</button>
      </form>
    </>}
    <Link to="/akun">Kembali ke akun</Link>
  </section>
}
