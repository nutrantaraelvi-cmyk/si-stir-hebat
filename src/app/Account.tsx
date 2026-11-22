import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bell, BookHeart, ClipboardCheck, KeyRound, LogOut, ShieldCheck, Sparkles, UserRound, UsersRound, type LucideIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/auth/auth-context'
import { Profile } from './Profile'

const loginRoles: { id: string; label: string; title: string; detail: string; icon: LucideIcon }[] = [
  { id: 'student', label: 'Murid', title: 'Hai, teman hebat!', detail: 'Siap belajar, bermain, dan tumbuh hari ini?', icon: BookHeart },
  { id: 'parent', label: 'Orang tua', title: 'Selamat datang, Ayah/Bunda', detail: 'Temani tumbuh kembang anak melalui ruang sekolah.', icon: UsersRound },
  { id: 'teacher', label: 'Guru', title: 'Selamat datang, Bapak/Ibu Guru', detail: 'Lanjutkan kegiatan belajar dan pendampingan kelas.', icon: ClipboardCheck },
  { id: 'principal', label: 'Kepala sekolah', title: 'Selamat datang, Kepala Sekolah', detail: 'Pantau kegiatan dan layanan sekolah.', icon: ShieldCheck },
  { id: 'administrator', label: 'Administrator', title: 'Selamat datang, Administrator', detail: 'Kelola layanan sekolah sesuai kewenangan akun.', icon: Sparkles },
]

function ActiveSessionNotice({ destination }: { destination: 'login' | 'daftar' }) {
  const { session } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function switchAccount() {
    if (busy) return
    const client = supabase
    if (!client) { setError('Konfigurasi Supabase belum tersedia.'); return }
    setBusy(true)
    setError('')
    try {
      const { error: failure } = await client.auth.signOut({ scope: 'local' })
      if (failure) setError('Belum berhasil keluar. Silakan coba lagi.')
    } catch { setError('Koneksi bermasalah. Silakan coba lagi.') }
    finally { setBusy(false) }
  }

  return <section className="login active-session-notice" aria-labelledby="active-session-title">
    <h1 id="active-session-title">Sesi akun masih aktif</h1>
    <p><strong>{session?.user.email}</strong> masih masuk di perangkat ini.</p>
    <p>Keluar dulu untuk memakai akun lain. Peran layanan mengikuti profil akun sekolah, bukan pilihan tampilan di halaman masuk.</p>
    {error && <p className="error" role="alert">{error}</p>}
    <button className="button" type="button" disabled={busy} onClick={() => void switchAccount()}>{busy ? 'Sedang keluar…' : `Keluar dan ${destination === 'login' ? 'masuk' : 'daftar'} dengan akun lain`}</button>
    <p><Link to="/dashboard">Kembali ke dashboard akun ini</Link></p>
  </section>
}

function registrationErrorMessage(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('signup is disabled') || normalized.includes('signups not allowed')) return 'Pendaftaran akun sedang dinonaktifkan pada layanan sekolah. Hubungi administrator.'
  if (normalized.includes('already registered') || normalized.includes('user already exists')) return 'Email ini sudah terdaftar. Coba masuk atau gunakan fitur lupa kata sandi.'
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) return 'Terlalu banyak permintaan pendaftaran. Tunggu sebentar sebelum mencoba lagi.'
  if (normalized.includes('password')) return 'Kata sandi belum memenuhi ketentuan. Gunakan minimal 8 karakter.'
  if (normalized.includes('invalid email')) return 'Format email belum benar. Periksa kembali alamat email.'
  return 'Pendaftaran belum berhasil. Periksa koneksi dan data yang diisi, lalu coba lagi.'
}

export function Login() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { session, loading, error: sessionError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState(() => loginRoles.some(role => role.id === searchParams.get('ruang')) ? searchParams.get('ruang')! : 'student')
  const activeRole = loginRoles.find(role => role.id === selectedRole) ?? loginRoles[0]
  const RoleIcon = activeRole.icon
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const client = supabase
    if (!client) {
      setError('Konfigurasi Supabase belum tersedia. Periksa pengaturan sekolah.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const { error: failure } = await client.auth.signInWithPassword({ email: email.trim(), password })
      if (failure) setError('Tidak dapat masuk. Periksa email dan kata sandi, lalu coba lagi.')
    } catch { setError('Koneksi bermasalah. Silakan coba lagi.') }
    finally { setBusy(false) }
  }
  if (loading) return <section className="login" role="status">Memuat sesi…</section>
  if (session) return <ActiveSessionNotice destination="login" />
  return <section className={`login login-page login-role-${activeRole.id}`} aria-labelledby="login-title" data-role={activeRole.id}>
    <div className="login-intro">
      <p className="login-kicker">SDN 03 Wonosari</p>
      <h1 id="login-title">{activeRole.title}</h1>
      <p>{activeRole.detail}</p>
      <div className="login-role-art" aria-hidden="true">
        <span className="login-art-orbit" />
        <span className="login-art-icon"><RoleIcon /></span>
        {activeRole.id === 'student' && <><span className="login-art-spark login-art-spark-one">✦</span><span className="login-art-spark login-art-spark-two">✿</span><span className="login-art-doodle">Ayo belajar!</span></>}
      </div>
      <fieldset className="login-role-picker">
        <legend>Masuk sebagai</legend>
        <div className="login-role-options">{loginRoles.map(role => {
          const Icon = role.icon
          return <button key={role.id} type="button" className="login-role-option" aria-pressed={selectedRole === role.id} onClick={() => { setSelectedRole(role.id); setSearchParams({ ruang: role.id }, { replace: true }) }}>
            <Icon aria-hidden="true"/><span>{role.label}</span>
          </button>
        })}</div>
      </fieldset>
      <p className="login-role-note">Pilihan ini mengubah tampilan saja. Layanan dan hak akses mengikuti peran pada akun sekolah Anda.</p>
    </div>
    <div className="login-panel">
    <h2>Masuk sebagai {activeRole.label}</h2><p>Gunakan email dan kata sandi akun sekolah Anda.</p>
    <form onSubmit={submit}>
      <label htmlFor="email">Email</label><input id="email" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} disabled={busy} />
      <label htmlFor="password">Kata sandi</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />
      {(error || sessionError) && <p className="error" role="alert">{error || sessionError}</p>}
      <button className="button" type="submit" disabled={busy}>{busy ? 'Sedang masuk…' : 'Masuk'}</button>
    </form><p><Link to="/lupa-kata-sandi">Lupa kata sandi?</Link></p><p className="help">Belum punya akun? <Link to={`/daftar?ruang=${activeRole.id}`}>Daftar sebagai {activeRole.label}</Link></p><Link to="/">Kembali ke beranda</Link>
    </div>
  </section>
}

export function Register() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { session, loading } = useAuth()
  const [selectedRole, setSelectedRole] = useState(() => loginRoles.some(role => role.id === searchParams.get('ruang')) ? searchParams.get('ruang')! : 'parent')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const client = supabase
    const name = fullName.trim()
    if (!client) { setError('Konfigurasi Supabase belum tersedia.'); return }
    if (Array.from(name).length < 2 || Array.from(name).length > 120) { setError('Nama harus terdiri dari 2 sampai 120 karakter.'); return }
    if (password.length < 8) { setError('Kata sandi minimal 8 karakter.'); return }

    setBusy(true)
    setError('')
    setMessage('')
    try {
      const { data, error: failure } = await client.auth.signUp({
        email: email.trim(), password,
        options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/login` },
      })
      if (failure) setError(registrationErrorMessage(failure.message))
      else if (data.session) setMessage('Akun berhasil dibuat dan menunggu verifikasi sekolah sebelum layanan dibuka.')
      else setMessage('Pendaftaran diterima. Periksa email untuk verifikasi. Akun tetap menunggu verifikasi sekolah sebelum layanan dibuka.')
      setPassword('')
    } catch { setError('Koneksi bermasalah. Silakan coba lagi.') }
    finally { setBusy(false) }
  }

  if (loading) return <section className="login" role="status">Memuat sesi…</section>
  if (session) return <ActiveSessionNotice destination="daftar" />
  return <section className="login login-page" aria-labelledby="register-title">
    <div className="login-intro">
      <p className="login-kicker">SDN 03 Wonosari</p>
      <h1 id="register-title">Buat akun SI STIR HEBAT</h1>
      <p>Daftar satu kali. Sekolah akan memeriksa identitas dan menghubungkan akun dengan data yang sesuai.</p>
      <p className="login-role-note">Pilih peran yang sesuai. Sekolah akan memeriksa identitas dan menetapkan akses sebelum layanan dibuka.</p>
    </div>
    <div className="login-panel">
      <fieldset className="login-role-picker" aria-label="Pilih peran pendaftaran">
        <legend>Daftar sebagai</legend>
        <div className="login-role-options">{loginRoles.map(role => {
          const Icon = role.icon
          return <button key={role.id} type="button" className="login-role-option" aria-pressed={selectedRole === role.id} onClick={() => { setSelectedRole(role.id); setSearchParams({ ruang: role.id }, { replace: true }) }}>
            <Icon aria-hidden="true"/><span>{role.label}</span>
          </button>
        })}</div>
      </fieldset>
      <h2>Daftar sebagai {loginRoles.find(role => role.id === selectedRole)?.label}</h2>
      <form onSubmit={submit}>
        <label htmlFor="register-name">Nama lengkap</label>
        <input id="register-name" autoComplete="name" minLength={2} maxLength={120} required value={fullName} onChange={event => setFullName(event.target.value)} disabled={busy} />
        <label htmlFor="register-email">Email</label>
        <input id="register-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} disabled={busy} />
        <label htmlFor="register-password">Kata sandi</label>
        <input id="register-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />
        {error && <p className="error" role="alert">{error}</p>}
        {message && <p className="help" role="status">{message}</p>}
        <button className="button" type="submit" disabled={busy}>{busy ? 'Mendaftarkan…' : 'Buat akun'}</button>
      </form>
      <p>Sudah punya akun? <Link to={`/login?ruang=${selectedRole}`}>Masuk sebagai {loginRoles.find(role => role.id === selectedRole)?.label}</Link></p>
      <Link to="/">Kembali ke beranda</Link>
    </div>
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
      const client = supabase
      if (!client) {
        setError('Konfigurasi Supabase belum tersedia.')
        return
      }
      const { error: failure } = await client.auth.signOut({ scope: 'local' })
      if (failure) setError('Belum berhasil keluar. Silakan coba lagi.')
    } catch { setError('Koneksi bermasalah. Silakan coba lagi.') }
    finally { setBusy(false) }
  }
  return (
    <section className="board account-page" aria-labelledby="account-title">
      <header className="account-heading">
        <div>
          <p className="account-kicker">Pengaturan akun</p>
          <h1 id="account-title">Akun sekolah</h1>
          <p>Kelola identitas dan keamanan akun yang digunakan di SI STIR HEBAT.</p>
        </div>
        <span className="account-avatar" aria-hidden="true"><UserRound /></span>
      </header>

      <div className="account-grid">
        <article className="account-card account-profile">
          <div className="account-card-heading">
            <span className="account-card-icon" aria-hidden="true"><UserRound /></span>
            <div>
              <h2>Profil saya</h2>
              <p>Identitas yang ditampilkan pada layanan sekolah.</p>
            </div>
          </div>
          {session && <dl className="account-meta">
            <div>
              <dt>Email akun</dt>
              <dd>{session.user.email}</dd>
            </div>
            {supabase && <div>
              <dt>ID akun</dt>
              <dd><code>{session.user.id}</code></dd>
            </div>}
          </dl>}
          {session && <Profile key={session.user.id} userId={session.user.id} />}
        </article>

        <aside className="account-card account-actions" aria-label="Tindakan akun">
          <div className="account-card-heading">
            <span className="account-card-icon" aria-hidden="true"><ShieldCheck /></span>
            <div>
              <h2>Keamanan dan akses</h2>
              <p>Lanjutan pengaturan akun.</p>
            </div>
          </div>
          <nav className="account-links" aria-label="Layanan akun">
            <Link to="/kata-sandi">
              <KeyRound aria-hidden="true" />
              <span><strong>Ubah kata sandi</strong><small>Perbarui kredensial akun</small></span>
            </Link>
            <Link to="/pengumuman">
              <Bell aria-hidden="true" />
              <span><strong>Pengumuman sekolah</strong><small>Buka kabar terbaru</small></span>
            </Link>
          </nav>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="button account-sign-out" disabled={busy} onClick={signOut}>
            <LogOut aria-hidden="true" />
            {busy ? 'Sedang keluar…' : 'Keluar'}
          </button>
        </aside>
      </div>
    </section>
  )
}
