import { lazy, Suspense } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { ArrowRight, BookOpen, ClipboardCheck, GraduationCap, HeartHandshake, ShieldCheck, Sparkles, Star, Users } from 'lucide-react'
import { demoAllowed, isConfigured } from '../lib/config.ts'
import { AuthProvider, ProtectedRoute } from './Auth'
import { ConfigMissing } from './ConfigMissing'
import { Dashboard } from './Dashboard'
import { Header } from './Header'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { Account, Login, Register } from './Account'
import { ChangePassword, ForgotPassword } from './Password'
import { IdleSessionGuard } from './IdleSessionGuard'
const Announcements = lazy(() => import('./Announcements').then(module => ({ default: module.Announcements })))
const MasterData = lazy(() => import('../features/school/MasterData').then(module => ({ default: module.MasterData })))
const AccountRelationships = lazy(() => import('../features/school/AccountRelationships').then(module => ({ default: module.AccountRelationships })))
const SchoolAccounts = lazy(() => import('../features/school/SchoolAccounts').then(module => ({ default: module.SchoolAccounts })))
const GuardianPortal = lazy(() => import('../features/guardian/GuardianPortal').then(module => ({ default: module.GuardianPortal })))
const TeachingModules = lazy(() => import('../features/learning/TeachingModules').then(module => ({ default: module.TeachingModules })))
const ClassMaterials = lazy(() => import('../features/learning/ClassMaterials').then(module => ({ default: module.ClassMaterials })))
const Assessments = lazy(() => import('../features/academic/Assessments').then(module => ({ default: module.Assessments })))
const Schedules = lazy(() => import('../features/schedule/Schedules').then(module => ({ default: module.Schedules })))
const AcademicSupervision = lazy(() => import('../features/supervision/AcademicSupervision').then(module => ({ default: module.AcademicSupervision })))
const Attendance = lazy(() => import('../features/attendance/Attendance').then(module => ({ default: module.Attendance })))
const Journals = lazy(() => import('../features/journals/Journals').then(module => ({ default: module.Journals })))
const Communication = lazy(() => import('../features/komunikasi/Communication').then(module => ({ default: module.Communication })))
const StudentHabits = lazy(() => import('../features/student-habits/StudentHabits').then(module => ({ default: module.StudentHabits })))
const NotificationCenter = lazy(() => import('../features/notifications/NotificationCenter').then(module => ({ default: module.NotificationCenter })))
const AbsenceReports = lazy(() => import('../features/parents/AbsenceReports').then(module => ({ default: module.AbsenceReports })))
const SchoolDocuments = lazy(() => import('../features/school-documents/SchoolDocuments').then(module => ({ default: module.SchoolDocuments })))
const AuditLog = lazy(() => import('../features/audit/AuditLog').then(module => ({ default: module.AuditLog })))
const TeacherAttendance = lazy(() => import('../features/attendance/TeacherAttendance').then(module => ({ default: module.TeacherAttendance })))
const roles = [
  { id: 'student', icon: GraduationCap, title: 'Murid', detail: 'Materi, tugas, jadwal, dan perkembangan belajar' },
  { id: 'parent', icon: Users, title: 'Orang Tua', detail: 'Kehadiran anak dan informasi sekolah' },
  { id: 'teacher', icon: BookOpen, title: 'Guru', detail: 'Materi, absensi, penilaian, dan jurnal' },
  { id: 'principal', icon: ClipboardCheck, title: 'Kepala Sekolah', detail: 'Supervisi akademik dan dokumen sekolah' },
  { id: 'administrator', icon: ShieldCheck, title: 'Administrator', detail: 'Data sekolah, akun, dan pengaturan akses' },
]
const homeServices = [
  { icon: ClipboardCheck, tag: 'SUPERVISI', title: 'Mendukung supervisi berkualitas', detail: 'Mendigitalisasi supervisi kepala sekolah dan mendukung tindak lanjut tenaga pendidik.' },
  { icon: BookOpen, tag: 'PEMBELAJARAN', title: 'Mengorganisasi pembelajaran', detail: 'Mengelola administrasi, materi, tugas, asesmen, dan perkembangan belajar dalam satu sistem.' },
  { icon: HeartHandshake, tag: 'KOLABORASI', title: 'Menguatkan perkembangan dan kolaborasi', detail: 'Memantau karakter peserta didik serta menghubungkan sekolah dan keluarga.' },
]
function Home() { return <div className="home-page">
  <section className="home-hero" aria-labelledby="home-title">
    <div className="home-hero-copy">
      <p className="home-eyebrow"><Sparkles size={15} aria-hidden="true"/> SDN 03 Wonosari <span>Boalemo, Gorontalo</span></p>
      <h1 id="home-title">Ekosistem digital sekolah <span>yang terintegrasi.</span></h1>
      <p className="home-hero-lede">Menghubungkan supervisi berkualitas, pembelajaran terorganisasi, perkembangan karakter peserta didik, serta kolaborasi sekolah dan keluarga.</p>
      <div className="home-hero-actions"><Link to="/login" className="button">Masuk ke aplikasi <ArrowRight size={18} aria-hidden="true"/></Link><a className="home-text-link" href="#ruang-peran">Kenali ruang peran <ArrowRight size={16} aria-hidden="true"/></a></div>
      <p className="home-hero-note">Gunakan akun sekolah. Layanan yang tersedia mengikuti peran pada akun Anda.</p>
    </div>
    <div className="home-hero-art" aria-hidden="true">
      <span className="home-art-sun"/><span className="home-art-orbit home-art-orbit-one"/><span className="home-art-orbit home-art-orbit-two"/>
      <span className="home-art-star home-art-star-one"><Star fill="currentColor"/></span><span className="home-art-star home-art-star-two"><Sparkles/></span>
      <div className="home-art-book"><BookOpen size={42}/><span>Belajar<br/>seru setiap hari</span></div>
      <div className="home-art-note">Yuk, bertumbuh! <span>✿</span></div>
      <span className="home-art-dot home-art-dot-one"/><span className="home-art-dot home-art-dot-two"/><span className="home-art-dot home-art-dot-three"/>
    </div>
  </section>

  <div className="home-service-ribbon">
    <p className="sr-only">Materi dan tugas, jadwal dan asesmen, kehadiran, 7 Kebiasaan, serta kabar sekolah.</p>
    <div className="home-ribbon-track" aria-hidden="true">{[0, 1].map(copy => <span className="home-ribbon-group" key={copy}><span>Materi &amp; tugas</span><Sparkles/><span>Jadwal &amp; asesmen</span><Sparkles/><span>Kehadiran</span><Sparkles/><span>7 Kebiasaan</span><Sparkles/><span>Kabar sekolah</span><Sparkles/></span>)}</div>
  </div>

  <section className="home-section" id="ruang-peran" aria-labelledby="role-entry-title">
    <header className="home-section-heading"><div><p className="home-section-tag">SATU SEKOLAH, LIMA RUANG</p><h2 id="role-entry-title">Mulai dari ruangmu</h2><p>Pilih ruang untuk melihat tampilan yang sesuai. Hak akses tetap ditentukan oleh akun sekolah.</p></div><span className="home-section-mark" aria-hidden="true">01</span></header>
    <div className="home-role-grid">{roles.map(({id,icon: Icon,title,detail},index)=><Link key={id} to={`/login?ruang=${id}`} className={`home-role-card home-role-${id}`}>
      <span className="home-role-card-top"><span className="home-role-icon"><Icon size={23} aria-hidden="true"/></span><span className="home-role-index">{String(index+1).padStart(2,'0')}</span></span>
      <strong>{title}</strong><span className="home-role-detail">{detail}</span><span className="home-role-enter">Masuk ke ruang ini <ArrowRight size={16} aria-hidden="true"/></span>
    </Link>)}</div>
  </section>

  <section className="home-section home-services" aria-labelledby="home-services-title">
    <header className="home-section-heading"><div><p className="home-section-tag">ARAH PENGEMBANGAN</p><h2 id="home-services-title">Visi dan misi SI STIR HEBAT</h2><p><strong>Visi:</strong> Membangun ekosistem digital sekolah yang terintegrasi untuk mendukung supervisi berkualitas, pembelajaran yang terorganisasi, perkembangan karakter peserta didik, serta kolaborasi antara sekolah dan keluarga.</p></div><span className="home-section-mark" aria-hidden="true">02</span></header>
    <div className="home-service-grid">{homeServices.map(({icon: Icon,tag,title,detail})=><article className="home-service-card" key={tag}><span className="home-service-icon"><Icon size={22} aria-hidden="true"/></span><p>{tag}</p><h3>{title}</h3><span>{detail}</span></article>)}</div>
  </section>

  <section className="home-closing"><div><p className="home-section-tag">BERSAMA WUJUDKAN ANAK INDONESIA HEBAT</p><h2>Siap memulai hari belajar?</h2><p>Masuk dengan akun sekolah atau daftar untuk mulai menghubungkan keluarga dengan layanan sekolah.</p></div><div className="home-closing-actions"><Link to="/login" className="button">Masuk ke SI STIR HEBAT <ArrowRight size={18} aria-hidden="true"/></Link><Link to="/daftar" className="button secondary">Buat akun baru</Link></div></section>
</div> }
export default function App() {
  if (!isConfigured && !demoAllowed) return <ErrorBoundary><ConfigMissing/></ErrorBoundary>
  return <ErrorBoundary><BrowserRouter><AuthProvider><IdleSessionGuard/><a className="skip-link" href="#main-content">Langsung ke isi halaman</a><Header/><main id="main-content" className="min-w-0" tabIndex={-1}><Suspense fallback={<section className="board" role="status"><p>Memuat halaman…</p></section>}><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/daftar" element={<Register/>}/>
    <Route path="/lupa-kata-sandi" element={<ForgotPassword/>}/>
    <Route path="/kata-sandi" element={<ChangePassword/>}/>
    <Route path="/akun" element={<ProtectedRoute><Account/></ProtectedRoute>}/>
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
    <Route path="/tautan-akun" element={<ProtectedRoute><AccountRelationships/></ProtectedRoute>}/>
    <Route path="/akun-sekolah" element={<ProtectedRoute><SchoolAccounts/></ProtectedRoute>}/>
    <Route path="/ruang-orang-tua" element={<ProtectedRoute><GuardianPortal/></ProtectedRoute>}/>
    <Route path="/modul-ajar" element={<ProtectedRoute><TeachingModules/></ProtectedRoute>}/>
    <Route path="/materi" element={<ProtectedRoute><ClassMaterials/></ProtectedRoute>}/>
    <Route path="/tugas" element={<ProtectedRoute><ClassMaterials kind="task"/></ProtectedRoute>}/>
    <Route path="/asesmen" element={<ProtectedRoute><Assessments/></ProtectedRoute>}/>
    <Route path="/jadwal" element={<ProtectedRoute><Schedules/></ProtectedRoute>}/>
    <Route path="/supervisi" element={<ProtectedRoute><AcademicSupervision/></ProtectedRoute>}/>
    <Route path="/sekolah/:kind?" element={<ProtectedRoute><MasterData/></ProtectedRoute>}/>
    <Route path="/absensi" element={<ProtectedRoute><Attendance/></ProtectedRoute>}/>
    <Route path="/jurnal" element={<ProtectedRoute><Journals/></ProtectedRoute>}/>
    <Route path="/komunikasi" element={<ProtectedRoute><Communication/></ProtectedRoute>}/>
    <Route path="/kebiasaan" element={<ProtectedRoute><StudentHabits/></ProtectedRoute>}/>
    <Route path="/notifikasi" element={<ProtectedRoute><NotificationCenter/></ProtectedRoute>}/>
    <Route path="/laporan-ketidakhadiran" element={<ProtectedRoute><AbsenceReports/></ProtectedRoute>}/>
    <Route path="/dokumen" element={<ProtectedRoute><SchoolDocuments/></ProtectedRoute>}/>
    <Route path="/absensi-guru" element={<ProtectedRoute><TeacherAttendance/></ProtectedRoute>}/>
    <Route path="/audit" element={<ProtectedRoute><AuditLog/></ProtectedRoute>}/>
    <Route path="/pengumuman" element={<ProtectedRoute><Announcements/></ProtectedRoute>}/>
    <Route path="*" element={<section className="login"><h1>Halaman tidak ditemukan</h1><Link to="/">Kembali</Link></section>}/>
  </Routes></Suspense></main><footer>© SI STIR HEBAT · SDN 03 Wonosari · Tumbuh Bersama</footer></AuthProvider></BrowserRouter></ErrorBoundary>
}

