import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BookOpen, CalendarDays, ClipboardCheck, ClipboardList, Eye, FileText, KeyRound, Link2, MessageSquare, PenLine, ShieldCheck, UserCheck, UserRound, type LucideIcon } from 'lucide-react'
import { useAuth } from '../components/auth/auth-context'
import { supabase } from '../lib/supabase'
import { canManageAnnouncements, canReadAnnouncements, type Announcement } from '../lib/announcements'
import { schoolRoleLabels } from '../lib/school'
import { canAccessCommunication, canReadAbsenceReports, canReadAssessments, canReadAttendance, canReadDashboardOverview, canReadGuardianPortal, canReadHabits, canReadJournals, canReadLearning, canReadNotifications, canReadSchedules, canReadSchoolDocuments, canReadSupervision, canReadTeacherAttendance, canReadTeachingModules, isAdministrator, isPrincipal } from '../utils/permissions'
import { getDashboardOverview, type DashboardOverview } from '../lib/dashboard-overview'

type SchoolProfile = { full_name: string; role: string }
const roleSpaces: Record<string, { title: string; description: string }> = {
  administrator: { title: 'Ruang Admin', description: 'Ringkasan sekolah, data master, dan tautan akun yang tersedia untuk dikelola.' },
  teacher: { title: 'Ruang Guru', description: 'Akses absensi, jurnal, modul ajar, materi, tugas, asesmen, dan jadwal sesuai penugasan.' },
  student: { title: 'Ruang Murid', description: 'Temukan materi, tugas, jadwal, dan hasil belajar yang tersedia untuk Anda.' },
  parent: { title: 'Ruang Orang Tua', description: 'Pantau kehadiran anak yang terhubung, pengumuman, jadwal, dan informasi belajar.' },
  principal: { title: 'Ruang Kepala Sekolah', description: 'Pantau supervisi, modul ajar yang perlu ditinjau, pengumuman, dan jadwal sekolah.' },
}

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
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
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
  return <section className="board dashboard">
    <div className="board-heading"><div><h1>{profile?.full_name ? `Halo, ${profile.full_name}` : 'Selamat datang'}</h1><p>Kabar sekolah, ringkasan kelas, dan layanan akun Anda.</p></div><button className="refresh-button" type="button" disabled={loading} onClick={() => setAttempt(value => value + 1)}>{loading ? 'Memuat…' : 'Muat ulang'}</button></div>
    {loading ? <p role="status">Menyiapkan dashboard…</p> : <>
      {profileError && <p className="error" role="alert">{profileError}</p>}
      {profile && <p className="role-strip"><span>Anda masuk sebagai</span><strong>{schoolRoleLabels[profile.role] ?? 'Belum tersedia'}</strong></p>}
      {profile && roleSpaces[profile.role] && <section className={`role-space role-space--${profile.role}`} aria-labelledby="role-space-title">
        <p className="role-space-label">SDN 03 Wonosari</p>
        <h2 id="role-space-title">{roleSpaces[profile.role].title}</h2>
        <p>{roleSpaces[profile.role].description}</p>
        <a href="#quick-access">Lihat layanan Anda</a>
      </section>}
      {profile && !canRead && <p className="status">Akun Anda menunggu penetapan peran sekolah. Anda tetap dapat melengkapi nama dan mengubah kata sandi melalui menu akun.</p>}
      {profile && !profile.full_name.trim() && <p className="status">Lengkapi nama agar akun Anda mudah dikenali. <Link to="/akun">Lengkapi profil</Link></p>}
      {canRead && <>
        {overview && <section aria-labelledby="school-overview">
          <h2 id="school-overview">Ringkasan data sekolah</h2>
          <p>Jumlah registri aktif dari layanan ringkasan dashboard.</p>
          <div className="dashboard-stats">
            <article aria-label="Siswa aktif"><span>Siswa aktif</span><strong>{overview.active.students}</strong><Link to="/sekolah/students">Lihat siswa aktif</Link></article>
            <article aria-label="Guru aktif"><span>Guru aktif</span><strong>{overview.active.teachers}</strong><Link to="/sekolah/teachers">Lihat guru aktif</Link></article>
            <article aria-label="Kelas aktif"><span>Kelas aktif</span><strong>{overview.active.classes}</strong><Link to="/sekolah/school_classes">Lihat kelas aktif</Link></article>
          </div>
        </section>}
        {overview && isPrincipal(profile?.role) && <section className="principal-overview" aria-labelledby="principal-overview-title">
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
        {canReadAttendance(profile?.role ?? null) && <QuickLink to="/absensi" icon={UserCheck} title="Absensi kelas" detail="Catatan kehadiran dan rekap yang dapat Anda akses."/>}
        {canReadTeacherAttendance(profile?.role ?? null) && <QuickLink to="/absensi-guru" icon={ClipboardCheck} title="Absensi guru" detail="Catat jam masuk/keluar dan ajukan koreksi."/>}
        {canReadGuardianPortal(profile?.role ?? null) && <QuickLink to="/ruang-orang-tua" icon={UserRound} title="Kehadiran anak" detail="Pantau anak yang telah ditautkan oleh sekolah."/>}
        {canAccessCommunication(profile?.role ?? null) && <QuickLink to="/komunikasi" icon={MessageSquare} title="Komunikasi" detail="Pesan wali kelas dan keluarga sesuai tautan akun."/>}
        {canReadAbsenceReports(profile?.role) && <QuickLink to="/laporan-ketidakhadiran" icon={ClipboardList} title="Laporan ketidakhadiran" detail="Kirim atau tinjau laporan sesuai peran Anda."/>}
        {canReadHabits(profile?.role) && <QuickLink to="/kebiasaan" icon={ClipboardCheck} title="7 Kebiasaan" detail="Buka catatan kebiasaan yang dapat Anda akses."/>}
        {canReadNotifications(profile?.role) && <QuickLink to="/notifikasi" icon={Bell} title="Notifikasi" detail="Periksa pembaruan untuk akun Anda."/>}
        {canReadTeachingModules(profile?.role ?? null) && <QuickLink to="/modul-ajar" icon={FileText} title="Modul ajar" detail="Dokumen perencanaan dan proses peninjauan."/>}
        {canReadSchoolDocuments(profile?.role ?? null) && <QuickLink to="/dokumen" icon={FileText} title="Dokumen sekolah" detail="Unggah, periksa, dan arsipkan dokumen administrasi."/>}
        {canReadSupervision(profile?.role ?? null) && <QuickLink to="/supervisi" icon={Eye} title="Supervisi akademik" detail="Jadwal, observasi, tindak lanjut, dan laporan."/>}
        {canReadJournals(profile?.role ?? null) && <QuickLink to="/jurnal" icon={PenLine} title="Jurnal mengajar" detail="Catatan kegiatan pembelajaran sesuai penugasan."/>}
        {isAdministrator(profile?.role) && <>
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
