import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Bell, BookHeart, BookOpen, CalendarDays, ClipboardCheck, ClipboardList, Eye, FileText, HeartHandshake as HeartHandshakeIcon, KeyRound, Link2, MessageSquare, PenLine, Search, ShieldCheck, Sparkles, UserCheck, UserRound, X, type LucideIcon } from 'lucide-react'
import { useAuth } from '../components/auth/auth-context'
import { supabase } from '../lib/supabase'
import { canManageAnnouncements, canReadAnnouncements, type Announcement } from '../lib/announcements'
import { schoolRoleLabels } from '../lib/school'
import { canAccessCommunication, canReadAbsenceReports, canReadAssessments, canReadAttendance, canReadDashboardOverview, canReadGuardianPortal, canReadHabits, canReadJournals, canReadLearning, canReadNotifications, canReadSchedules, canReadSchoolDocuments, canReadSupervision, canReadTeacherAttendance, canReadTeachingModules, isAdministrator, isParent, isPrincipal, isStudent, isTeacher } from '../utils/permissions'
import { getDashboardOverview, type DashboardOverview } from '../lib/dashboard-overview'
import { canReadMasterData } from '../features/school/master'
import { habitLabels } from '../features/student-habits/api'

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

type AdminService = { to: string; icon: LucideIcon; title: string; detail: string; group: 'Kelola sekolah' | 'Pantau layanan' | 'Akun' }

function AdminServiceCenter() {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<'Semua' | AdminService['group']>('Semua')
  const services: AdminService[] = [
    ...(canReadMasterData('school_settings', 'administrator') ? [{ to: '/sekolah', icon: ShieldCheck, title: 'Data sekolah', detail: 'Atur tahun ajaran, kelas, data guru dan siswa, serta penugasan.', group: 'Kelola sekolah' as const }] : []),
    { to: '/tautan-akun', icon: Link2, title: 'Tautan akun', detail: 'Periksa dan verifikasi hubungan akun sekolah dengan data warga sekolah.', group: 'Kelola sekolah' },
    { to: '/akun-sekolah', icon: UserCheck, title: 'Akun sekolah', detail: 'Tetapkan peran akun yang sudah memverifikasi email.', group: 'Kelola sekolah' },
    { to: '/pengumuman', icon: Bell, title: 'Pengumuman', detail: 'Buat, terbitkan, dan arsipkan informasi sekolah.', group: 'Kelola sekolah' },
    { to: '/dokumen', icon: FileText, title: 'Dokumen sekolah', detail: 'Lihat dokumen administratif dan status peninjauannya.', group: 'Kelola sekolah' },
    ...(canReadTeachingModules('administrator') ? [{ to: '/modul-ajar', icon: FileText, title: 'Modul ajar', detail: 'Pantau administrasi pembelajaran guru.', group: 'Pantau layanan' as const }] : []),
    { to: '/absensi', icon: UserCheck, title: 'Absensi kelas', detail: 'Lihat catatan kehadiran dan rekap yang tersedia.', group: 'Pantau layanan' },
    { to: '/absensi-guru', icon: ClipboardCheck, title: 'Absensi guru', detail: 'Pantau catatan masuk dan keluar guru.', group: 'Pantau layanan' },
    { to: '/jurnal', icon: PenLine, title: 'Jurnal mengajar', detail: 'Baca catatan kegiatan pembelajaran.', group: 'Pantau layanan' },
    { to: '/jadwal', icon: CalendarDays, title: 'Jadwal', detail: 'Tinjau jadwal pelajaran dan perubahan yang tercatat.', group: 'Pantau layanan' },
    { to: '/laporan-ketidakhadiran', icon: ClipboardList, title: 'Laporan ketidakhadiran', detail: 'Lihat laporan yang dikirim wali murid.', group: 'Pantau layanan' },
    { to: '/notifikasi', icon: Bell, title: 'Notifikasi', detail: 'Periksa pembaruan pada layanan sekolah.', group: 'Pantau layanan' },
    { to: '/kebiasaan', icon: HeartHandshakeIcon, title: '7 Kebiasaan', detail: 'Lihat catatan kebiasaan yang tersedia.', group: 'Pantau layanan' },
    { to: '/akun', icon: UserRound, title: 'Profil saya', detail: 'Periksa identitas dan peran akun Anda.', group: 'Akun' },
    { to: '/kata-sandi', icon: KeyRound, title: 'Keamanan akun', detail: 'Perbarui kata sandi akun sekolah.', group: 'Akun' },
  ]
  const categories: Array<'Semua' | AdminService['group']> = ['Semua', 'Kelola sekolah', 'Pantau layanan', 'Akun']
  const normalizedQuery = query.trim().toLocaleLowerCase('id-ID')
  const visibleServices = services.filter(service => (group === 'Semua' || service.group === group) && (!normalizedQuery || `${service.title} ${service.detail} ${service.group}`.toLocaleLowerCase('id-ID').includes(normalizedQuery)))

  return <div className="admin-service-center" data-reveal>
    <div className="admin-service-toolbar">
      <label className="admin-service-search"><Search size={19} aria-hidden="true"/><span className="sr-only">Cari layanan administrator</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari layanan, misalnya data sekolah" /></label>
      {query && <button className="admin-clear-search" type="button" onClick={() => setQuery('')}><X size={16} aria-hidden="true"/> Hapus pencarian</button>}
    </div>
    <div className="admin-service-filters" role="group" aria-label="Filter kategori layanan">{categories.map(category => <button key={category} type="button" aria-pressed={group === category} onClick={() => setGroup(category)}>{category}</button>)}</div>
    <p className="admin-service-count" aria-live="polite">{visibleServices.length} layanan tersedia{group !== 'Semua' ? ` di ${group.toLocaleLowerCase('id-ID')}` : ''}</p>
    {visibleServices.length ? <div className="admin-service-grid">{visibleServices.map(({ to, icon: Icon, title, detail, group: itemGroup }) => <Link className="admin-service-card" to={to} key={to} data-reveal>
      <span className="admin-service-icon"><Icon size={20} aria-hidden="true"/></span><span className="admin-service-copy"><small>{itemGroup}</small><strong>{title}</strong><span>{detail}</span></span><ArrowUpRight className="admin-service-arrow" size={18} aria-hidden="true"/>
    </Link>)}</div> : <p className="admin-service-empty">Tidak ada layanan yang cocok. Coba kata kunci lain atau pilih kategori “Semua”.</p>}
  </div>
}

type StudentService = { to: string; icon: LucideIcon; title: string; detail: string }

function StudentServiceCard({ to, icon: Icon, title, detail }: StudentService) {
  return <Link className="student-service-card" to={to} data-reveal>
    <span className="student-service-icon"><Icon size={20} aria-hidden="true"/></span>
    <span className="student-service-copy"><strong>{title}</strong><small>{detail}</small></span>
    <ArrowUpRight size={17} aria-hidden="true"/>
  </Link>
}

function StudentWorkspace() {
  const [checkedHabits, setCheckedHabits] = useState<number[]>([])
  const learning: StudentService[] = [
    ...(canReadLearning('student') ? [
      { to: '/materi', icon: BookOpen, title: 'Materi kelas', detail: 'Baca bahan belajar yang dibagikan guru.' },
      { to: '/tugas', icon: ClipboardList, title: 'Tugas kelas', detail: 'Periksa tugas dan umpan balik untukmu.' },
    ] : []),
    ...(canReadSchedules('student') ? [{ to: '/jadwal', icon: CalendarDays, title: 'Jadwal pelajaran', detail: 'Lihat jadwal kelasmu.' }] : []),
    ...(canReadAssessments('student') ? [{ to: '/asesmen', icon: ClipboardCheck, title: 'Asesmen dan hasil', detail: 'Lihat asesmen dan hasil yang sudah dibagikan.' }] : []),
  ]
  const daily: StudentService[] = [
    ...(canReadAttendance('student') ? [{ to: '/absensi', icon: UserCheck, title: 'Kehadiranku', detail: 'Lihat catatan kehadiranmu.' }] : []),
    ...(canReadHabits('student') ? [{ to: '/kebiasaan', icon: HeartHandshakeIcon, title: '7 Kebiasaan', detail: 'Lihat catatan kebiasaanmu.' }] : []),
  ]
  const updates: StudentService[] = [
    ...(canReadNotifications('student') ? [{ to: '/notifikasi', icon: Bell, title: 'Notifikasi', detail: 'Periksa pembaruan untuk akunmu.' }] : []),
    ...(canReadAnnouncements('student') ? [{ to: '/pengumuman', icon: Sparkles, title: 'Kabar sekolah', detail: 'Baca informasi terbaru dari sekolah.' }] : []),
  ]
  const account: StudentService[] = [
    { to: '/akun', icon: UserRound, title: 'Profilku', detail: 'Periksa nama dan akun sekolahmu.' },
    { to: '/kata-sandi', icon: KeyRound, title: 'Keamanan akun', detail: 'Ganti kata sandi akunmu.' },
  ]

  return <div className="student-workspace">
    <section className="student-welcome" data-reveal aria-labelledby="student-welcome-title">
      <div className="student-welcome-copy"><p className="student-kicker"><BookHeart size={16} aria-hidden="true"/> RUANG BELAJAR MURID</p><h2 id="student-welcome-title">Yuk, mulai belajar!</h2><p>Materi, tugas, dan jadwal kelasmu ada di sini. Pilih kegiatan yang ingin kamu buka.</p><div className="student-welcome-actions">
        {canReadLearning('student') && <><Link className="student-primary-action" to="/materi"><BookOpen size={18} aria-hidden="true"/> Buka materi</Link><Link className="student-secondary-action" to="/tugas">Lihat tugasku <ArrowUpRight size={16} aria-hidden="true"/></Link></>}
      </div></div>
      <div className="student-welcome-art" aria-hidden="true"><span className="student-art-spark student-art-spark-a">✦</span><span className="student-art-spark student-art-spark-b">✿</span><span className="student-art-book"><BookOpen size={42}/></span><span className="student-art-note">Ayo belajar!</span></div>
    </section>
    <section className="student-habit-checklist" aria-labelledby="student-habits-title">
      <div className="student-habits-heading"><div><p className="student-kicker"><Sparkles size={16} aria-hidden="true"/> LANGKAH BAIK HARI INI</p><h3 id="student-habits-title">7 Kebiasaan Anak Indonesia Hebat</h3><p>Ketuk kebiasaan yang sudah kamu lakukan hari ini.</p></div><span className="student-habits-count" aria-live="polite">{checkedHabits.length} / 7</span></div>
      <div className="student-habits-progress" aria-hidden="true"><span style={{ width: `${checkedHabits.length / 7 * 100}%` }}/></div>
      <div className="student-habits-list">{habitLabels.map((label, index) => <label key={label} className={`student-habit-item${checkedHabits.includes(index) ? ' is-checked' : ''}`}><input type="checkbox" checked={checkedHabits.includes(index)} onChange={event => setCheckedHabits(current => event.target.checked ? [...current, index] : current.filter(item => item !== index))}/><span className="student-habit-number" aria-hidden="true">{index + 1}</span><span>{label}</span></label>)}</div>
      <p className="student-habits-note">Daftar ini untuk mengingat kegiatanmu selama halaman terbuka. Catatan sekolah diisi oleh orang tua atau wali.</p><Link className="student-secondary-action" to="/kebiasaan">Lihat catatan kebiasaan <ArrowUpRight size={16} aria-hidden="true"/></Link>
    </section>
    {learning.length > 0 && <section className="student-service-group" aria-labelledby="student-learning-title"><header><span className="student-group-number">01</span><div><h3 id="student-learning-title">Belajar</h3><p>Yang kamu perlukan untuk mengikuti pelajaran.</p></div></header><div className="student-service-grid">{learning.map(service => <StudentServiceCard key={service.to} {...service}/>)}</div></section>}
    {daily.length > 0 && <section className="student-service-group" aria-labelledby="student-daily-title"><header><span className="student-group-number">02</span><div><h3 id="student-daily-title">Keseharianku</h3><p>Pantau kehadiran dan kebiasaan baikmu.</p></div></header><div className="student-service-grid">{daily.map(service => <StudentServiceCard key={service.to} {...service}/>)}</div></section>}
    {updates.length > 0 && <section className="student-service-group" aria-labelledby="student-updates-title"><header><span className="student-group-number">03</span><div><h3 id="student-updates-title">Info untukmu</h3><p>Kabar dan pembaruan dari sekolah.</p></div></header><div className="student-service-grid">{updates.map(service => <StudentServiceCard key={service.to} {...service}/>)}</div></section>}
    <section className="student-service-group" aria-labelledby="student-account-title"><header><span className="student-group-number">04</span><div><h3 id="student-account-title">Akun</h3><p>Atur profil dan keamanan akunmu.</p></div></header><div className="student-service-grid">{account.map(service => <StudentServiceCard key={service.to} {...service}/>)}</div></section>
  </div>
}

function TeacherServiceCard({ to, icon: Icon, title, detail }: StudentService) {
  return <Link className="teacher-service-card" to={to} data-reveal>
    <span className="teacher-service-icon"><Icon size={20} aria-hidden="true"/></span>
    <span className="teacher-service-copy"><strong>{title}</strong><small>{detail}</small></span>
    <ArrowUpRight size={17} aria-hidden="true"/>
  </Link>
}

function TeacherWorkspace() {
  const planning: StudentService[] = [
    ...(canReadSchedules('teacher') ? [{ to: '/jadwal', icon: CalendarDays, title: 'Jadwal mengajar', detail: 'Periksa jadwal kelas dan mata pelajaran.' }] : []),
    ...(canReadLearning('teacher') ? [
      { to: '/materi', icon: BookOpen, title: 'Materi kelas', detail: 'Siapkan dan bagikan materi ke kelas tugasmu.' },
      { to: '/tugas', icon: ClipboardList, title: 'Tugas kelas', detail: 'Kelola tugas, jawaban, dan umpan balik.' },
      { to: '/asesmen', icon: ClipboardCheck, title: 'Asesmen dan nilai', detail: 'Susun asesmen dan kelola hasil belajar.' },
    ] : []),
    ...(canReadTeachingModules('teacher') ? [{ to: '/modul-ajar', icon: FileText, title: 'Modul ajar', detail: 'Kelola modul ajar dan pantau status peninjauan.' }] : []),
  ]
  const classroom: StudentService[] = [
    ...(canReadAttendance('teacher') ? [{ to: '/absensi', icon: UserCheck, title: 'Absensi kelas', detail: 'Catat kehadiran siswa pada kelas tugasmu.' }] : []),
    ...(canReadJournals('teacher') ? [{ to: '/jurnal', icon: PenLine, title: 'Jurnal mengajar', detail: 'Catat kegiatan pembelajaran dan tindak lanjut.' }] : []),
    ...(canReadHabits('teacher') ? [{ to: '/kebiasaan', icon: HeartHandshakeIcon, title: '7 Kebiasaan', detail: 'Pantau catatan kebiasaan kelas yang ditugaskan.' }] : []),
    ...(canReadAbsenceReports('teacher') ? [{ to: '/laporan-ketidakhadiran', icon: ClipboardList, title: 'Laporan ketidakhadiran', detail: 'Tinjau laporan wali murid dan beri tindak lanjut.' }] : []),
    ...(canAccessCommunication('teacher') ? [{ to: '/komunikasi', icon: MessageSquare, title: 'Komunikasi keluarga', detail: 'Hubungi wali terkait kelas yang ditugaskan.' }] : []),
    ...(canReadSchoolDocuments('teacher') ? [{ to: '/dokumen', icon: FileText, title: 'Dokumen sekolah', detail: 'Unggah dan kelola dokumen administrasi milikmu.' }] : []),
  ]
  const professional: StudentService[] = [
    ...(canReadTeacherAttendance('teacher') ? [{ to: '/absensi-guru', icon: ClipboardCheck, title: 'Absensi guru', detail: 'Catat waktu masuk/keluar dan ajukan koreksi.' }] : []),
    ...(canReadSupervision('teacher') ? [{ to: '/supervisi', icon: Eye, title: 'Supervisi akademik', detail: 'Lihat jadwal dan hasil supervisi yang tersedia.' }] : []),
    ...(canReadNotifications('teacher') ? [{ to: '/notifikasi', icon: Bell, title: 'Notifikasi', detail: 'Periksa pembaruan untuk akun dan kelasmu.' }] : []),
    ...(canReadAnnouncements('teacher') ? [{ to: '/pengumuman', icon: Sparkles, title: 'Pengumuman sekolah', detail: 'Baca informasi dan kegiatan terbaru.' }] : []),
  ]
  const account: StudentService[] = [
    { to: '/akun', icon: UserRound, title: 'Profil saya', detail: 'Periksa identitas dan peran akun.' },
    { to: '/kata-sandi', icon: KeyRound, title: 'Keamanan akun', detail: 'Perbarui kata sandi akun sekolah.' },
  ]
  const groups = [
    { id: 'teacher-planning-title', number: '01', title: 'Pembelajaran', detail: 'Rencanakan pelajaran dan dukung proses belajar.', services: planning },
    { id: 'teacher-classroom-title', number: '02', title: 'Kegiatan kelas', detail: 'Kelola kehadiran, jurnal, dan komunikasi kelas.', services: classroom },
    { id: 'teacher-professional-title', number: '03', title: 'Kegiatan profesional', detail: 'Pantau tugas sekolah dan pembaruan untukmu.', services: professional },
    { id: 'teacher-account-title', number: '04', title: 'Akun', detail: 'Atur profil dan keamanan akunmu.', services: account },
  ]

  return <div className="teacher-workspace">
    <section className="teacher-welcome" data-reveal aria-labelledby="teacher-welcome-title">
      <div className="teacher-welcome-copy"><p className="teacher-kicker"><ClipboardCheck size={16} aria-hidden="true"/> RUANG KERJA GURU</p><h2 id="teacher-welcome-title">Siap mendampingi kelas?</h2><p>Temukan perangkat mengajar, kegiatan kelas, dan layanan sekolah dari satu tempat.</p><div className="teacher-welcome-actions">
        {canReadAttendance('teacher') && <Link className="teacher-primary-action" to="/absensi"><UserCheck size={18} aria-hidden="true"/> Buka absensi kelas</Link>}
        {canReadJournals('teacher') && <Link className="teacher-secondary-action" to="/jurnal">Isi jurnal mengajar <ArrowUpRight size={16} aria-hidden="true"/></Link>}
      </div></div>
      <div className="teacher-welcome-art" aria-hidden="true"><span className="teacher-art-orbit"/><span className="teacher-art-icon"><BookOpen size={38}/></span><span className="teacher-art-spark">✦</span><span className="teacher-art-note">Ruang untuk berkarya</span></div>
    </section>
    {groups.map(group => group.services.length > 0 && <section className="teacher-service-group" key={group.id} aria-labelledby={group.id}><header><span className="teacher-group-number">{group.number}</span><div><h3 id={group.id}>{group.title}</h3><p>{group.detail}</p></div></header><div className="teacher-service-grid">{group.services.map(service => <TeacherServiceCard key={service.to} {...service}/>)}</div></section>)}
  </div>
}

type PortalServiceGroup = { id: string; number: string; title: string; detail: string; services: StudentService[] }

function PortalServiceCard({ service, audience }: { service: StudentService; audience: 'principal' | 'parent' }) {
  const { to, icon: Icon, title, detail } = service
  return <Link className={`portal-service-card portal-service-card--${audience}`} to={to} data-reveal>
    <span className="portal-service-icon"><Icon size={20} aria-hidden="true"/></span><span className="portal-service-copy"><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={17} aria-hidden="true"/>
  </Link>
}

function PortalServiceGroups({ groups, audience }: { groups: PortalServiceGroup[]; audience: 'principal' | 'parent' }) {
  return <>{groups.map(group => group.services.length > 0 && <section className={`portal-service-group portal-service-group--${audience}`} key={group.id} aria-labelledby={group.id}>
    <header><span className="portal-group-number">{group.number}</span><div><h3 id={group.id}>{group.title}</h3><p>{group.detail}</p></div></header>
    <div className="portal-service-grid">{group.services.map(service => <PortalServiceCard audience={audience} service={service} key={service.to}/>)}</div>
  </section>)}</>
}

function PrincipalWorkspace() {
  const oversight: StudentService[] = [
    ...(canReadSupervision('principal') ? [{ to: '/supervisi', icon: Eye, title: 'Supervisi akademik', detail: 'Susun jadwal, lakukan observasi, dan pantau tindak lanjut.' }] : []),
    ...(canReadTeachingModules('principal') ? [{ to: '/modul-ajar', icon: FileText, title: 'Peninjauan modul ajar', detail: 'Tinjau modul yang diajukan guru dan berikan keputusan.' }] : []),
    ...(canReadSchoolDocuments('principal') ? [{ to: '/dokumen', icon: ClipboardCheck, title: 'Dokumen sekolah', detail: 'Periksa dan tindak lanjuti dokumen yang menunggu peninjauan.' }] : []),
  ]
  const monitoring: StudentService[] = [
    ...(canReadAttendance('principal') ? [{ to: '/absensi', icon: UserCheck, title: 'Kehadiran siswa', detail: 'Pantau catatan absensi kelas yang tersedia.' }] : []),
    ...(canReadTeacherAttendance('principal') ? [{ to: '/absensi-guru', icon: ClipboardCheck, title: 'Kehadiran guru', detail: 'Pantau presensi dan tinjau usulan koreksi.' }] : []),
    ...(canReadSchedules('principal') ? [{ to: '/jadwal', icon: CalendarDays, title: 'Jadwal pelajaran', detail: 'Tinjau jadwal sekolah dan usulan perubahan.' }] : []),
    ...(canReadAbsenceReports('principal') ? [{ to: '/laporan-ketidakhadiran', icon: ClipboardList, title: 'Laporan ketidakhadiran', detail: 'Pantau laporan wali; verifikasi dilakukan oleh guru kelas.' }] : []),
  ]
  const updates: StudentService[] = [
    ...(canReadAnnouncements('principal') ? [{ to: '/pengumuman', icon: Sparkles, title: 'Pengumuman sekolah', detail: 'Kelola dan sampaikan informasi sekolah.' }] : []),
    ...(canReadNotifications('principal') ? [{ to: '/notifikasi', icon: Bell, title: 'Notifikasi', detail: 'Periksa pembaruan layanan sekolah.' }] : []),
  ]
  const account: StudentService[] = [
    { to: '/akun', icon: UserRound, title: 'Profil saya', detail: 'Periksa identitas dan peran akun.' },
    { to: '/kata-sandi', icon: KeyRound, title: 'Keamanan akun', detail: 'Perbarui kata sandi akun sekolah.' },
  ]
  const groups: PortalServiceGroup[] = [
    { id: 'principal-leadership-title', number: '01', title: 'Kepemimpinan pembelajaran', detail: 'Lakukan supervisi dan tinjau perangkat pendidik.', services: oversight },
    { id: 'principal-monitoring-title', number: '02', title: 'Pemantauan sekolah', detail: 'Pantau kehadiran, jadwal, dan laporan yang tersedia.', services: monitoring },
    { id: 'principal-updates-title', number: '03', title: 'Informasi sekolah', detail: 'Sampaikan kabar dan ikuti pembaruan layanan.', services: updates },
    { id: 'principal-account-title', number: '04', title: 'Akun', detail: 'Atur profil dan keamanan akun.', services: account },
  ]
  return <div className="portal-workspace portal-workspace--principal">
    <section className="portal-welcome portal-welcome--principal" data-reveal aria-labelledby="principal-welcome-title">
      <div className="portal-welcome-copy"><p className="portal-kicker"><Eye size={16} aria-hidden="true"/> RUANG KEPEMIMPINAN SEKOLAH</p><h2 id="principal-welcome-title">Pantau, dampingi, tindak lanjuti.</h2><p>Ringkasan supervisi dan layanan sekolah membantu menentukan langkah berikutnya.</p><div className="portal-welcome-actions">
        {canReadSupervision('principal') && <Link className="portal-primary-action" to="/supervisi"><Eye size={18} aria-hidden="true"/> Buka supervisi</Link>}
        {canReadTeachingModules('principal') && <Link className="portal-secondary-action" to="/modul-ajar">Tinjau modul ajar <ArrowUpRight size={16} aria-hidden="true"/></Link>}
      </div></div><div className="portal-welcome-art" aria-hidden="true"><span className="portal-art-orbit"/><span className="portal-art-icon"><ShieldCheck size={38}/></span><span className="portal-art-spark">✦</span><span className="portal-art-note">Arahkan dengan bijak</span></div>
    </section>
    <PortalServiceGroups groups={groups} audience="principal"/>
  </div>
}

function ParentWorkspace() {
  const child: StudentService[] = [
    ...(canReadGuardianPortal('parent') ? [{ to: '/ruang-orang-tua', icon: UserCheck, title: 'Kehadiran anak', detail: 'Pantau catatan kehadiran anak yang sudah tertaut.' }] : []),
    ...(canReadAbsenceReports('parent') ? [{ to: '/laporan-ketidakhadiran', icon: ClipboardList, title: 'Laporan ketidakhadiran', detail: 'Kirim pemberitahuan jika anak berhalangan hadir.' }] : []),
    ...(canReadHabits('parent') ? [{ to: '/kebiasaan', icon: HeartHandshakeIcon, title: '7 Kebiasaan', detail: 'Isi dan pantau kebiasaan anak yang tertaut.' }] : []),
  ]
  const learning: StudentService[] = [
    ...(canReadSchedules('parent') ? [{ to: '/jadwal', icon: CalendarDays, title: 'Jadwal pelajaran', detail: 'Lihat jadwal kelas anak.' }] : []),
    ...(canReadLearning('parent') ? [
      { to: '/materi', icon: BookOpen, title: 'Materi kelas', detail: 'Buka materi yang dibagikan guru.' },
      { to: '/tugas', icon: ClipboardList, title: 'Tugas kelas', detail: 'Dampingi anak melihat tugas dan umpan balik.' },
      { to: '/asesmen', icon: ClipboardCheck, title: 'Asesmen dan hasil', detail: 'Lihat hasil belajar yang sudah dibagikan.' },
    ] : []),
  ]
  const connection: StudentService[] = [
    ...(canAccessCommunication('parent') ? [{ to: '/komunikasi', icon: MessageSquare, title: 'Komunikasi dengan guru', detail: 'Hubungi guru kelas sesuai tautan keluarga.' }] : []),
    ...(canReadAnnouncements('parent') ? [{ to: '/pengumuman', icon: Sparkles, title: 'Kabar sekolah', detail: 'Baca informasi terbaru dari sekolah.' }] : []),
    ...(canReadNotifications('parent') ? [{ to: '/notifikasi', icon: Bell, title: 'Notifikasi', detail: 'Periksa pembaruan untuk akunmu.' }] : []),
  ]
  const account: StudentService[] = [
    { to: '/akun', icon: UserRound, title: 'Profil saya', detail: 'Periksa identitas akun keluarga.' },
    { to: '/kata-sandi', icon: KeyRound, title: 'Keamanan akun', detail: 'Perbarui kata sandi akun.' },
  ]
  const groups: PortalServiceGroup[] = [
    { id: 'parent-child-title', number: '01', title: 'Dampingi keseharian anak', detail: 'Layanan ini hanya menampilkan anak yang telah ditautkan sekolah.', services: child },
    { id: 'parent-learning-title', number: '02', title: 'Dampingi belajar', detail: 'Materi, tugas, jadwal, dan hasil yang tersedia untuk kelas anak.', services: learning },
    { id: 'parent-connection-title', number: '03', title: 'Terhubung dengan sekolah', detail: 'Jalin komunikasi dan ikuti informasi sekolah.', services: connection },
    { id: 'parent-account-title', number: '04', title: 'Akun keluarga', detail: 'Atur profil dan keamanan akun.', services: account },
  ]
  return <div className="portal-workspace portal-workspace--parent">
    <section className="portal-welcome portal-welcome--parent" data-reveal aria-labelledby="parent-welcome-title">
      <div className="portal-welcome-copy"><p className="portal-kicker"><HeartHandshakeIcon size={16} aria-hidden="true"/> RUANG KELUARGA</p><h2 id="parent-welcome-title">Belajar anak, kita dampingi bersama.</h2><p>Pantau informasi anak yang terhubung dan tetap dekat dengan kegiatan sekolah.</p><div className="portal-welcome-actions">
        {canReadGuardianPortal('parent') && <Link className="portal-primary-action" to="/ruang-orang-tua"><UserCheck size={18} aria-hidden="true"/> Kehadiran anak</Link>}
        {canReadAbsenceReports('parent') && <Link className="portal-secondary-action" to="/laporan-ketidakhadiran">Kirim laporan izin <ArrowUpRight size={16} aria-hidden="true"/></Link>}
      </div></div><div className="portal-welcome-art" aria-hidden="true"><span className="portal-art-orbit"/><span className="portal-art-icon"><HeartHandshakeIcon size={38}/></span><span className="portal-art-spark">✿</span><span className="portal-art-note">Dekat dan peduli</span></div>
    </section>
    <PortalServiceGroups groups={groups} audience="parent"/>
  </div>
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
    <section className={`quick-access${isAdministrator(profile?.role) ? ' quick-access--admin' : ''}${isStudent(profile?.role) ? ' quick-access--student' : ''}${isTeacher(profile?.role) ? ' quick-access--teacher' : ''}${isPrincipal(profile?.role) ? ' quick-access--principal' : ''}${isParent(profile?.role) ? ' quick-access--parent' : ''}`} aria-labelledby="quick-access"><h2 id="quick-access">{isAdministrator(profile?.role) ? 'Pusat kendali administrator' : isStudent(profile?.role) ? 'Ruang belajarku' : isTeacher(profile?.role) ? 'Ruang kerja guru' : isPrincipal(profile?.role) ? 'Ruang kepemimpinan sekolah' : isParent(profile?.role) ? 'Ruang keluarga' : 'Akses cepat'}</h2>{isAdministrator(profile?.role) ? <AdminServiceCenter/> : isStudent(profile?.role) ? <StudentWorkspace/> : isTeacher(profile?.role) ? <TeacherWorkspace/> : isPrincipal(profile?.role) ? <PrincipalWorkspace/> : isParent(profile?.role) ? <ParentWorkspace/> : <div className="quick-access-grid">
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
    </div>}</section>
  </section>
}
