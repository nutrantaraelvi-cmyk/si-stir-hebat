import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { BookOpen, GraduationCap, Users, ClipboardCheck, ShieldCheck } from 'lucide-react'
import { AuthProvider, ProtectedRoute } from './Auth'
import { Announcements } from './Announcements'
import { Dashboard } from './Dashboard'
import { Header } from './Header'
import { MasterData } from '../features/school/MasterData'
import { AccountRelationships } from '../features/school/AccountRelationships'
import { GuardianPortal } from '../features/guardian/GuardianPortal'
import { TeachingModules } from '../features/learning/TeachingModules'
import { ClassMaterials } from '../features/learning/ClassMaterials'
import { Assessments } from '../features/academic/Assessments'
import { Schedules } from '../features/schedule/Schedules'
import { AcademicSupervision } from '../features/supervision/AcademicSupervision'
import { Attendance } from '../features/attendance/Attendance'
import { Journals } from '../features/journals/Journals'
import { Communication } from '../features/komunikasi/Communication'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { Account, Login } from './Account'
import { ChangePassword, ForgotPassword } from './Password'
const roles = [
  { icon: ShieldCheck, title: 'Administrator', detail: 'Data sekolah, akun, dan pengaturan akses' },
  { icon: ClipboardCheck, title: 'Kepala Sekolah', detail: 'Supervisi, dokumen, dan laporan' },
  { icon: BookOpen, title: 'Ruang Guru', detail: 'Kelas, absensi, jurnal, dan asesmen' },
  { icon: GraduationCap, title: 'Ruang Murid', detail: 'Materi, tugas, dan asesmen' },
  { icon: Users, title: 'Ruang Orang Tua', detail: 'Kehadiran anak dan informasi sekolah' },
]
function Home() { return <section className="hero" aria-labelledby="home-title">
  <div className="hero-copy">
    <p className="hero-context">SDN 03 Wonosari</p>
    <h1 id="home-title">Ruang untuk <span>tumbuh bersama.</span></h1>
    <p>Materi, tugas, asesmen, jadwal, dan kabar sekolah dalam satu pintu masuk sesuai peran Anda.</p>
    <div className="hero-actions"><Link to="/login" className="button">Masuk ke aplikasi</Link></div>
    <p className="notice">Gunakan akun sekolah yang diberikan administrator. Setiap peran hanya melihat layanan yang menjadi kewenangannya.</p>
  </div>
  <aside className="role-ledger" aria-labelledby="role-ledger-title">
    <h2 id="role-ledger-title">Pintu masuk sesuai peran</h2>
    <p>Lima peran, satu lingkungan sekolah.</p>
    <ol>{roles.map(({icon: Icon,title,detail},index)=><li key={title}><span className="role-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><Icon size={20} aria-hidden="true"/><div><strong>{title}</strong><span>{detail}</span></div></li>)}</ol>
  </aside>
</section> }
export default function App() {
  return <ErrorBoundary><BrowserRouter><AuthProvider><a className="skip-link" href="#main-content">Langsung ke isi halaman</a><Header/><main id="main-content" tabIndex={-1}><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/lupa-kata-sandi" element={<ForgotPassword/>}/>
    <Route path="/kata-sandi" element={<ChangePassword/>}/>
    <Route path="/akun" element={<ProtectedRoute><Account/></ProtectedRoute>}/>
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
    <Route path="/tautan-akun" element={<ProtectedRoute><AccountRelationships/></ProtectedRoute>}/>
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
    <Route path="/pengumuman" element={<ProtectedRoute><Announcements/></ProtectedRoute>}/>
    <Route path="*" element={<section className="login"><h1>Halaman tidak ditemukan</h1><Link to="/">Kembali</Link></section>}/>
  </Routes></main><footer>© SI STIR HEBAT · SDN 03 Wonosari · Tumbuh Bersama</footer></AuthProvider></BrowserRouter></ErrorBoundary>
}

