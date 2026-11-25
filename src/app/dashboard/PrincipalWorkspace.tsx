import { Link } from 'react-router-dom'
import { ArrowUpRight, Bell, CalendarDays, ClipboardCheck, ClipboardList, Eye, FileText, KeyRound, ShieldCheck, Sparkles, UserCheck, UserRound } from 'lucide-react'
import { canReadAnnouncements } from '../../lib/announcements'
import { canReadAbsenceReports, canReadAttendance, canReadNotifications, canReadSchedules, canReadSchoolDocuments, canReadSupervision, canReadTeacherAttendance, canReadTeachingModules } from '../../utils/permissions'
import { type ServiceLink, PortalServiceGroups, type PortalServiceGroup } from './services'

export function PrincipalWorkspace() {
  const oversight: ServiceLink[] = [
    ...(canReadSupervision('principal') ? [{ to: '/supervisi', icon: Eye, title: 'Supervisi akademik', detail: 'Susun jadwal, lakukan observasi, dan pantau tindak lanjut.' }] : []),
    ...(canReadTeachingModules('principal') ? [{ to: '/modul-ajar', icon: FileText, title: 'Peninjauan modul ajar', detail: 'Tinjau modul yang diajukan guru dan berikan keputusan.' }] : []),
    ...(canReadSchoolDocuments('principal') ? [{ to: '/dokumen', icon: ClipboardCheck, title: 'Dokumen sekolah', detail: 'Periksa dan tindak lanjuti dokumen yang menunggu peninjauan.' }] : []),
  ]
  const monitoring: ServiceLink[] = [
    ...(canReadAttendance('principal') ? [{ to: '/absensi', icon: UserCheck, title: 'Kehadiran siswa', detail: 'Pantau catatan absensi kelas yang tersedia.' }] : []),
    ...(canReadTeacherAttendance('principal') ? [{ to: '/absensi-guru', icon: ClipboardCheck, title: 'Kehadiran guru', detail: 'Pantau presensi dan tinjau usulan koreksi.' }] : []),
    ...(canReadSchedules('principal') ? [{ to: '/jadwal', icon: CalendarDays, title: 'Jadwal pelajaran', detail: 'Tinjau jadwal sekolah dan usulan perubahan.' }] : []),
    ...(canReadAbsenceReports('principal') ? [{ to: '/laporan-ketidakhadiran', icon: ClipboardList, title: 'Laporan ketidakhadiran', detail: 'Pantau laporan wali; verifikasi dilakukan oleh guru kelas.' }] : []),
  ]
  const updates: ServiceLink[] = [
    ...(canReadAnnouncements('principal') ? [{ to: '/pengumuman', icon: Sparkles, title: 'Pengumuman sekolah', detail: 'Kelola dan sampaikan informasi sekolah.' }] : []),
    ...(canReadNotifications('principal') ? [{ to: '/notifikasi', icon: Bell, title: 'Notifikasi', detail: 'Periksa pembaruan layanan sekolah.' }] : []),
  ]
  const account: ServiceLink[] = [
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
