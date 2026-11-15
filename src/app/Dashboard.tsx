import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BookOpen, CalendarDays, ClipboardCheck, ClipboardList, Eye, FileText, KeyRound, Link2, MessageSquare, PenLine, ShieldCheck, UserCheck, UserRound, type LucideIcon } from 'lucide-react'
import { useAuth } from './Auth'
import { getDemoAnnouncements, getDemoProfile } from '../lib/demo-auth'
import { supabase } from '../lib/supabase'
import { canManageAnnouncements, canReadAnnouncements, type Announcement } from '../lib/announcements'
import { canAccessCommunication, canReadAssessments, canReadLearning, canReadSchedules, schoolRoleLabels } from '../lib/school'
import { SchoolOverview } from './SchoolOverview'
import { PrincipalOverview } from './PrincipalOverview'

type SchoolProfile = { full_name: string; role: string }

function QuickLink({ to, icon: Icon, title, detail }: { to: string; icon: LucideIcon; title: string; detail: string }) {
  return <Link to={to}><Icon size={20} aria-hidden="true"/><span className="quick-copy"><strong>{title}</strong><small>{detail}</small></span></Link>
}

export function Dashboard() {
  const { session } = useAuth()
  return session ? <SchoolDashboard key={session.user.id} userId={session.user.id}/> : null
}

function SchoolDashboard({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<SchoolProfile | null>(null)
  const [recent, setRecent] = useState<Announcement[]>([])
  const [publishedCount, setPublishedCount] = useState<number | null>(null)
  const [draftCount, setDraftCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [newsError, setNewsError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setProfileError('')
    setNewsError('')
    setProfile(null)
    setRecent([])
    setPublishedCount(null)
    setDraftCount(null)

    const client = supabase
    if (!client) {
      const demoProfile = getDemoProfile(userId)
      const demoAnnouncements = getDemoAnnouncements()
      if (active) {
        setProfile(demoProfile ? { full_name: demoProfile.full_name, role: demoProfile.role } : { full_name: 'Pengguna Demo', role: 'pending' })
        setRecent(demoAnnouncements.filter((item) => item.status === 'published').slice(0, 3) as Announcement[])
        setPublishedCount(demoAnnouncements.filter((item) => item.status === 'published').length)
        setDraftCount(demoAnnouncements.filter((item) => item.status === 'draft').length)
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
  return <section className="board dashboard">
    <div className="board-heading"><div><h1>{profile?.full_name ? `Halo, ${profile.full_name}` : 'Selamat datang'}</h1><p>Kabar sekolah, ringkasan kelas, dan layanan akun Anda.</p></div><button className="refresh-button" disabled={loading} onClick={() => setAttempt(value => value + 1)}>{loading ? 'Memuat…' : 'Muat ulang'}</button></div>
    {loading ? <p role="status">Menyiapkan dashboard…</p> : <>
      {profileError && <p className="error" role="alert">{profileError}</p>}
      {profile && <p className="role-strip"><span>Anda masuk sebagai</span><strong>{schoolRoleLabels[profile.role] ?? 'Belum tersedia'}</strong></p>}
      {profile && !canRead && <p className="status">Akun Anda menunggu penetapan peran sekolah. Anda tetap dapat melengkapi nama dan mengubah kata sandi melalui menu akun.</p>}
      {profile && !profile.full_name.trim() && <p className="status">Lengkapi nama agar akun Anda mudah dikenali. <Link to="/akun">Lengkapi profil</Link></p>}
      {canRead && <>
        {profile && <SchoolOverview key={`${profile.role}-${attempt}`} role={profile.role} />}
        {profile?.role === 'principal' && <PrincipalOverview />}
        <div className="dashboard-stats"><article><span>Pengumuman terbit</span><strong>{publishedCount ?? 'N/A'}</strong></article>{canManage && <article><span>Draf pengumuman</span><strong>{draftCount ?? 'N/A'}</strong></article>}</div>
        {newsError && <p className="error" role="alert">{newsError}</p>}
        <section className="dashboard-news" aria-labelledby="latest-news"><div className="board-heading"><h2 id="latest-news">Kabar terbaru</h2><Link to="/pengumuman">Lihat semua</Link></div>
          {recent.length ? recent.map(item => <article className="news-preview" key={item.id}><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })}</time><h3>{item.title}</h3><p>{item.body.length > 220 ? `${item.body.slice(0, 220)}…` : item.body}</p></article>) : !newsError && <p className="empty">Belum ada pengumuman terbit. Kabar sekolah akan tampil di sini.</p>}
        </section>
      </>}
    </>}
    <section className="quick-access" aria-labelledby="quick-access"><h2 id="quick-access">Akses cepat</h2><div className="quick-access-grid">
      {!loading && canRead && <>
        {canReadSchedules(profile?.role ?? null) && <QuickLink to="/jadwal" icon={CalendarDays} title="Jadwal pelajaran" detail="Lihat jadwal sesuai kelas dan tanggal."/>}
        {canReadLearning(profile?.role ?? null) && <QuickLink to="/materi" icon={BookOpen} title="Materi kelas" detail="Buka bahan pembelajaran yang tersedia."/>}
        {canReadLearning(profile?.role ?? null) && <QuickLink to="/tugas" icon={ClipboardList} title="Tugas kelas" detail="Kelola tugas, pengumpulan, dan umpan balik."/>}
        {canReadAssessments(profile?.role ?? null) && <QuickLink to="/asesmen" icon={ClipboardCheck} title="Asesmen dan nilai" detail="Lihat hasil terbit atau kelola asesmen sesuai peran."/>}
        {profile?.role !== 'parent' && <QuickLink to="/absensi" icon={UserCheck} title="Absensi kelas" detail="Catatan kehadiran dan rekap yang dapat Anda akses."/>}
        {profile?.role === 'parent' && <QuickLink to="/ruang-orang-tua" icon={UserRound} title="Kehadiran anak" detail="Pantau anak yang telah ditautkan oleh sekolah."/>}
        {canAccessCommunication(profile?.role ?? null) && <QuickLink to="/komunikasi" icon={MessageSquare} title="Komunikasi" detail="Pesan wali kelas dan keluarga sesuai tautan akun."/>}
        {['administrator', 'principal', 'teacher'].includes(profile?.role ?? '') && <QuickLink to="/modul-ajar" icon={FileText} title="Modul ajar" detail="Dokumen perencanaan dan proses peninjauan."/>}
        {['principal', 'teacher'].includes(profile?.role ?? '') && <QuickLink to="/supervisi" icon={Eye} title="Supervisi akademik" detail="Jadwal, observasi, tindak lanjut, dan laporan."/>}
        {['teacher','administrator','principal'].includes(profile?.role??'') && <QuickLink to="/jurnal" icon={PenLine} title="Jurnal mengajar" detail="Catatan kegiatan pembelajaran sesuai penugasan."/>}
        {profile?.role === 'administrator' && <>
          <QuickLink to="/sekolah" icon={ShieldCheck} title="Siapkan data sekolah" detail="Tahun ajaran, kelas, guru, siswa, dan penugasan."/>
          <QuickLink to="/tautan-akun" icon={Link2} title="Tautan akun" detail="Verifikasi hubungan akun guru, siswa, dan wali."/>
        </>}
        <QuickLink to="/pengumuman" icon={Bell} title={canManage ? 'Kelola pengumuman' : 'Pengumuman sekolah'} detail={canManage ? 'Tulis kabar baru, terbitkan, atau arsipkan.' : 'Baca informasi dan kegiatan sekolah.'}/>
      </>}
      <QuickLink to="/akun" icon={UserRound} title="Profil saya" detail="Lengkapi nama dan periksa peran akun."/>
      <QuickLink to="/kata-sandi" icon={KeyRound} title="Keamanan akun" detail="Perbarui kata sandi akun sekolah."/>
    </div></section>
  </section>
}
