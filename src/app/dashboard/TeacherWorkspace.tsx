import { Link } from 'react-router-dom'
import { ArrowUpRight, Bell, BookOpen, CalendarDays, ClipboardCheck, ClipboardList, Eye, FileText, HeartHandshake as HeartHandshakeIcon, KeyRound, MessageSquare, PenLine, Sparkles, UserCheck, UserRound } from 'lucide-react'
import { canReadAnnouncements } from '../../lib/announcements'
import { canAccessCommunication, canReadAbsenceReports, canReadAttendance, canReadHabits, canReadJournals, canReadLearning, canReadNotifications, canReadSchedules, canReadSchoolDocuments, canReadSupervision, canReadTeacherAttendance, canReadTeachingModules } from '../../utils/permissions'
import { ServiceCard, type ServiceLink } from './services'

export function TeacherWorkspace() {
  const planning: ServiceLink[] = [
    ...(canReadSchedules('teacher') ? [{ to: '/jadwal', icon: CalendarDays, title: 'Jadwal mengajar', detail: 'Periksa jadwal kelas dan mata pelajaran.' }] : []),
    ...(canReadLearning('teacher') ? [
      { to: '/materi', icon: BookOpen, title: 'Materi kelas', detail: 'Siapkan dan bagikan materi ke kelas tugasmu.' },
      { to: '/tugas', icon: ClipboardList, title: 'Tugas kelas', detail: 'Kelola tugas, jawaban, dan umpan balik.' },
      { to: '/asesmen', icon: ClipboardCheck, title: 'Asesmen dan nilai', detail: 'Susun asesmen dan kelola hasil belajar.' },
    ] : []),
    ...(canReadTeachingModules('teacher') ? [{ to: '/modul-ajar', icon: FileText, title: 'Modul ajar', detail: 'Kelola modul ajar dan pantau status peninjauan.' }] : []),
  ]
  const classroom: ServiceLink[] = [
    ...(canReadAttendance('teacher') ? [{ to: '/absensi', icon: UserCheck, title: 'Absensi kelas', detail: 'Catat kehadiran siswa pada kelas tugasmu.' }] : []),
    ...(canReadJournals('teacher') ? [{ to: '/jurnal', icon: PenLine, title: 'Jurnal mengajar', detail: 'Catat kegiatan pembelajaran dan tindak lanjut.' }] : []),
    ...(canReadHabits('teacher') ? [{ to: '/kebiasaan', icon: HeartHandshakeIcon, title: '7 Kebiasaan', detail: 'Pantau catatan kebiasaan kelas yang ditugaskan.' }] : []),
    ...(canReadAbsenceReports('teacher') ? [{ to: '/laporan-ketidakhadiran', icon: ClipboardList, title: 'Laporan ketidakhadiran', detail: 'Tinjau laporan wali murid dan beri tindak lanjut.' }] : []),
    ...(canAccessCommunication('teacher') ? [{ to: '/komunikasi', icon: MessageSquare, title: 'Komunikasi keluarga', detail: 'Hubungi wali terkait kelas yang ditugaskan.' }] : []),
    ...(canReadSchoolDocuments('teacher') ? [{ to: '/dokumen', icon: FileText, title: 'Dokumen sekolah', detail: 'Unggah dan kelola dokumen administrasi milikmu.' }] : []),
  ]
  const professional: ServiceLink[] = [
    ...(canReadTeacherAttendance('teacher') ? [{ to: '/absensi-guru', icon: ClipboardCheck, title: 'Absensi guru', detail: 'Catat waktu masuk/keluar dan ajukan koreksi.' }] : []),
    ...(canReadSupervision('teacher') ? [{ to: '/supervisi', icon: Eye, title: 'Supervisi akademik', detail: 'Lihat jadwal dan hasil supervisi yang tersedia.' }] : []),
    ...(canReadNotifications('teacher') ? [{ to: '/notifikasi', icon: Bell, title: 'Notifikasi', detail: 'Periksa pembaruan untuk akun dan kelasmu.' }] : []),
    ...(canReadAnnouncements('teacher') ? [{ to: '/pengumuman', icon: Sparkles, title: 'Pengumuman sekolah', detail: 'Baca informasi dan kegiatan terbaru.' }] : []),
  ]
  const account: ServiceLink[] = [
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
    {groups.map(group => group.services.length > 0 && <section className="teacher-service-group" key={group.id} aria-labelledby={group.id}><header><span className="teacher-group-number">{group.number}</span><div><h3 id={group.id}>{group.title}</h3><p>{group.detail}</p></div></header><div className="teacher-service-grid">{group.services.map(service => <ServiceCard key={service.to} service={service} prefix="teacher"/>)}</div></section>)}
  </div>
}
