import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, UserRound, type LucideIcon } from 'lucide-react'
import { useAuth } from '../components/auth/auth-context'
import { supabase } from '../lib/supabase'
import { canManageAnnouncements, canReadAnnouncements, type Announcement } from '../lib/announcements'
import { schoolRoleLabels } from '../lib/school'
import { canReadDashboardOverview, isParent, isPrincipal, isStudent, isTeacher } from '../utils/permissions'
import { getDashboardOverview, type DashboardOverview } from '../lib/dashboard-overview'
import { AdminServiceCenter } from './dashboard/AdminServiceCenter'
import { StudentWorkspace } from './dashboard/StudentWorkspace'
import { TeacherWorkspace } from './dashboard/TeacherWorkspace'
import { PrincipalWorkspace } from './dashboard/PrincipalWorkspace'
import { ParentWorkspace } from './dashboard/ParentWorkspace'

type SchoolProfile = { full_name: string; role: string }
const roleSpaces: Record<string, { title: string; description: string }> = {
  administrator: { title: 'Ruang Admin', description: 'Ringkasan sekolah, data master, dan tautan akun yang tersedia untuk dikelola.' },
  teacher: { title: 'Ruang Guru', description: 'Akses absensi, jurnal, modul ajar, materi, tugas, asesmen, dan jadwal sesuai penugasan.' },
  student: { title: 'Ruang Murid', description: 'Temukan materi, tugas, jadwal, dan hasil belajar yang tersedia untuk Anda.' },
  parent: { title: 'Ruang Orang Tua', description: 'Pantau kehadiran anak yang terhubung, pengumuman, jadwal, dan informasi belajar.' },
  principal: { title: 'Ruang Kepala Sekolah', description: 'Pantau supervisi, modul ajar yang perlu ditinjau, pengumuman, dan jadwal sekolah.' },
}

function QuickLink({ to, icon: Icon, title, detail }: { to: string; icon: LucideIcon; title: string; detail: string }) {
  return <Link to={to} data-reveal><Icon size={20} aria-hidden="true"/><span className="quick-copy"><strong>{title}</strong><small>{detail}</small></span></Link>
}

const workspaces = [
  { role: 'administrator', variant: 'admin', title: 'Pusat kendali administrator', view: AdminServiceCenter },
  { role: 'student', variant: 'student', title: 'Ruang belajarku', view: StudentWorkspace },
  { role: 'teacher', variant: 'teacher', title: 'Ruang kerja guru', view: TeacherWorkspace },
  { role: 'principal', variant: 'principal', title: 'Ruang kepemimpinan sekolah', view: PrincipalWorkspace },
  { role: 'parent', variant: 'parent', title: 'Ruang keluarga', view: ParentWorkspace },
]

function DashboardServices({ role }: { role?: string }) {
  const workspace = workspaces.find(item => item.role === role)
  const Workspace = workspace?.view
  return <section className={workspace ? `quick-access quick-access--${workspace.variant}` : 'quick-access'} aria-labelledby="quick-access">
    <h2 id="quick-access">{workspace?.title ?? 'Akses cepat'}</h2>
    {Workspace ? <Workspace/> : <div className="quick-access-grid">
      <QuickLink to="/akun" icon={UserRound} title="Profil saya" detail="Lengkapi nama dan periksa peran akun."/>
      <QuickLink to="/kata-sandi" icon={KeyRound} title="Keamanan akun" detail="Perbarui kata sandi akun sekolah."/>
    </div>}
  </section>
}

export function Dashboard() {
  const { session } = useAuth()
  return session ? <SchoolDashboard key={session.user.id} userId={session.user.id}/> : null
}

function SchoolDashboard({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<SchoolProfile | null>(null)
  const [recent, setRecent] = useState<Announcement[]>([])
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [publishedCount, setPublishedCount] = useState<number | null>(null)
  const [draftCount, setDraftCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [newsError, setNewsError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (loading || !profile || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    const targets = document.querySelectorAll<HTMLElement>('.dashboard [data-reveal]')
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' })
    targets.forEach((target, index) => {
      target.classList.add('reveal-ready')
      target.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 45}ms`)
      observer.observe(target)
    })
    return () => observer.disconnect()
  }, [loading, profile])

  useEffect(() => {
    let active = true
    setLoading(true)
    setProfileError('')
    setNewsError('')
    setProfile(null)
    setRecent([])
    setOverview(null)
    setPublishedCount(null)
    setDraftCount(null)

    const client = supabase
    if (!client) {
      if (active) {
        setProfileError('Konfigurasi Supabase belum tersedia. Periksa pengaturan sekolah.')
        setLoading(false)
      }
      return () => { active = false }
    }

    const load = async () => {
      try {
        const { data, error } = await client.from('profiles').select('full_name, role').eq('id', userId).maybeSingle()
        if (error) throw error
        if (!active) return
        setProfile(data)
        if (!data) { setProfileError('Profil sekolah belum tersedia. Hubungi administrator sekolah.'); return }
        if (canReadDashboardOverview(data.role)) {
          try {
            const snapshot = await getDashboardOverview(client)
            if (!active) return
            setOverview(snapshot)
            setRecent(snapshot.announcements.recent)
            setPublishedCount(snapshot.announcements.published_count)
            setDraftCount(snapshot.announcements.draft_count)
          } catch {
            if (active) setNewsError('Ringkasan dashboard belum dapat dimuat. Pilih Muat ulang untuk mencoba lagi.')
          }
          return
        }
        if (!canReadAnnouncements(data.role)) return

        const requests = [
          client.from('announcements').select('id, title, body, status, created_at')
            .eq('status', 'published').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(3),
          client.from('announcements').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        ]
        if (canManageAnnouncements(data.role)) requests.push(client.from('announcements').select('id', { count: 'exact', head: true }).eq('status', 'draft'))
        const results = await Promise.allSettled(requests)
        if (!active) return
        let failed = false
        results.forEach((result, index) => {
          if (result.status === 'rejected' || result.value.error) { failed = true; return }
          if (index === 0) setRecent(result.value.data as Announcement[] ?? [])
          else if (index === 1) setPublishedCount(result.value.count ?? null)
          else setDraftCount(result.value.count ?? null)
        })
        if (failed) setNewsError('Sebagian informasi pengumuman belum dapat dimuat. Silakan coba lagi.')
      } catch { if (active) setProfileError('Profil belum dapat dimuat. Periksa koneksi atau hubungi administrator sekolah.') }
      finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [userId, attempt])

  const canRead = canReadAnnouncements(profile?.role ?? null)
  const canManage = canManageAnnouncements(profile?.role ?? null)
  return <section className={`board dashboard${isStudent(profile?.role) ? ' dashboard--student' : ''}${isTeacher(profile?.role) ? ' dashboard--teacher' : ''}${isPrincipal(profile?.role) ? ' dashboard--principal' : ''}${isParent(profile?.role) ? ' dashboard--parent' : ''}`}>
    <div className="board-heading"><div><h1>{profile?.full_name ? `${isStudent(profile.role) ? 'Hai' : 'Halo'}, ${profile.full_name}` : 'Selamat datang'}</h1><p>{isStudent(profile?.role) ? 'Selamat datang di ruang belajarmu. Pilih kegiatan yang ingin kamu lanjutkan.' : isTeacher(profile?.role) ? 'Selamat datang di ruang kerja guru. Kelola kegiatan mengajar dan kelasmu di sini.' : isPrincipal(profile?.role) ? 'Pantau supervisi dan layanan sekolah, lalu tindak lanjuti sesuai kewenangan.' : isParent(profile?.role) ? 'Akses layanan keluarga dan informasi sekolah dari sini.' : 'Kabar sekolah, ringkasan kelas, dan layanan akun Anda.'}</p></div><button className="refresh-button" type="button" disabled={loading} onClick={() => setAttempt(value => value + 1)}>{loading ? 'Memuat…' : 'Muat ulang'}</button></div>
    {loading ? <p role="status">Menyiapkan dashboard…</p> : <>
      {profileError && <p className="error" role="alert">{profileError}</p>}
      {profile && <p className="role-strip"><span>Anda masuk sebagai</span><strong>{schoolRoleLabels[profile.role] ?? 'Belum tersedia'}</strong></p>}
      {profile && roleSpaces[profile.role] && <section className={`role-space role-space--${profile.role}`} data-reveal aria-labelledby="role-space-title">
        <p className="role-space-label">SDN 03 Wonosari</p>
        <h2 id="role-space-title">{roleSpaces[profile.role].title}</h2>
        <p>{profile.role === 'administrator' ? 'Kelola data dasar, periksa tautan akun, dan pantau layanan sekolah dari satu tempat.' : profile.role === 'student' ? 'Materi, tugas, jadwal, dan catatan belajarmu tersusun di satu tempat yang mudah dijelajahi.' : profile.role === 'teacher' ? 'Siapkan materi dan perangkat ajar, lalu lanjutkan kegiatan kelas sesuai penugasanmu.' : profile.role === 'principal' ? 'Lihat ringkasan supervisi, tinjau perangkat ajar, dan pantau layanan sekolah.' : profile.role === 'parent' ? 'Akses layanan untuk mendampingi anak dan terhubung dengan sekolah.' : roleSpaces[profile.role].description}</p>
        <a href="#quick-access">{profile.role === 'administrator' ? 'Buka pusat kendali' : profile.role === 'student' ? 'Lihat kegiatan belajar' : profile.role === 'teacher' ? 'Buka ruang guru' : profile.role === 'principal' ? 'Buka ruang kepsek' : profile.role === 'parent' ? 'Buka ruang keluarga' : 'Lihat layanan Anda'}</a>
      </section>}
      {profile && !canRead && <p className="status">Akun Anda menunggu penetapan peran sekolah. Anda tetap dapat melengkapi nama dan mengubah kata sandi melalui menu akun.</p>}
      {profile && !profile.full_name.trim() && <p className="status">Lengkapi nama agar akun Anda mudah dikenali. <Link to="/akun">Lengkapi profil</Link></p>}
      {canRead && <>
        {overview && <section aria-labelledby="school-overview">
          <h2 id="school-overview">Ringkasan data sekolah</h2>
          <p>Jumlah registri aktif dari layanan ringkasan dashboard.</p>
          <div className="dashboard-stats">
            <article data-reveal aria-label="Siswa aktif"><span>Siswa aktif</span><strong>{overview.active.students}</strong><Link to="/sekolah/students">Lihat siswa aktif</Link></article>
            <article data-reveal aria-label="Guru aktif"><span>Guru aktif</span><strong>{overview.active.teachers}</strong><Link to="/sekolah/teachers">Lihat guru aktif</Link></article>
            <article data-reveal aria-label="Kelas aktif"><span>Kelas aktif</span><strong>{overview.active.classes}</strong><Link to="/sekolah/school_classes">Lihat kelas aktif</Link></article>
          </div>
        </section>}
        {overview && isPrincipal(profile?.role) && <section className="principal-overview" data-reveal aria-labelledby="principal-overview-title">
          <h2 id="principal-overview-title">Ringkasan kepala sekolah</h2>
          <p>Jumlah sesi menurut tahap terakhir dan modul ajar yang perlu ditinjau. Draf pribadi guru tidak dihitung.</p>
          <div className="principal-metrics">
            <article className="principal-metric supervision" aria-label="Pra-observasi"><span>Pra-observasi</span><strong>{overview.supervision_stages['1']}</strong></article>
            <article className="principal-metric supervision" aria-label="Observasi"><span>Observasi</span><strong>{overview.supervision_stages['2']}</strong></article>
            <article className="principal-metric supervision" aria-label="Pasca-observasi"><span>Pasca-observasi</span><strong>{overview.supervision_stages['3']}</strong></article>
            <article className="principal-metric supervision" aria-label="Tindak lanjut"><span>Tindak lanjut</span><strong>{overview.supervision_stages['4']}</strong></article>
            <article className="principal-metric submitted" aria-label="Perlu ditinjau"><span>Perlu ditinjau</span><strong>{overview.teaching_modules.submitted}</strong></article>
            <article className="principal-metric returned" aria-label="Dikembalikan"><span>Dikembalikan</span><strong>{overview.teaching_modules.returned}</strong></article>
          </div>
          <div className="principal-links"><Link to="/supervisi">Buka supervisi</Link><Link to="/modul-ajar">Buka modul ajar</Link></div>
        </section>}
        <div className="dashboard-stats"><article><span>Pengumuman terbit</span><strong>{publishedCount ?? 'N/A'}</strong></article>{canManage && <article><span>Draf pengumuman</span><strong>{draftCount ?? 'N/A'}</strong></article>}</div>
        {newsError && <p className="error" role="alert">{newsError}</p>}
        <section className="dashboard-news" aria-labelledby="latest-news"><div className="board-heading"><h2 id="latest-news">Kabar terbaru</h2><Link to="/pengumuman">Lihat semua</Link></div>
          {recent.length ? recent.map(item => <article className="news-preview" data-reveal key={item.id}><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })}</time><h3>{item.title}</h3><p>{item.body.length > 220 ? `${item.body.slice(0, 220)}…` : item.body}</p></article>) : !newsError && <p className="empty">Belum ada pengumuman terbit. Kabar sekolah akan tampil di sini.</p>}
        </section>
      </>}
    </>}
    <DashboardServices role={profile?.role}/>
  </section>
}
