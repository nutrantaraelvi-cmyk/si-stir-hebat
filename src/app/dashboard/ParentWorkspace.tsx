import { SchoolWhatsAppLink } from '../../components/school/SchoolWhatsAppLink'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Bell, BookOpen, CalendarDays, ClipboardCheck, ClipboardList, HeartHandshake as HeartHandshakeIcon, KeyRound, MessageSquare, Sparkles, UserCheck, UserRound } from 'lucide-react'
import { canReadAnnouncements } from '../../lib/announcements'
import { canAccessCommunication, canReadAbsenceReports, canReadGuardianPortal, canReadHabits, canReadLearning, canReadNotifications, canReadSchedules } from '../../utils/permissions'
import { type ServiceLink, PortalServiceGroups, type PortalServiceGroup } from './services'
import { PersonalizedShortcuts } from './PersonalizedShortcuts'

export function ParentWorkspace() {
  const child: ServiceLink[] = [
    ...(canReadGuardianPortal('parent') ? [{ to: '/ruang-orang-tua', icon: UserCheck, title: 'Kehadiran anak', detail: 'Pantau catatan kehadiran anak yang sudah tertaut.' }] : []),
    ...(canReadAbsenceReports('parent') ? [{ to: '/laporan-ketidakhadiran', icon: ClipboardList, title: 'Laporan ketidakhadiran', detail: 'Kirim pemberitahuan jika anak berhalangan hadir.' }] : []),
    ...(canReadHabits('parent') ? [{ to: '/kebiasaan', icon: HeartHandshakeIcon, title: '7 Kebiasaan', detail: 'Isi dan pantau kebiasaan anak yang tertaut.' }] : []),
  ]
  const learning: ServiceLink[] = [
    ...(canReadSchedules('parent') ? [{ to: '/jadwal', icon: CalendarDays, title: 'Jadwal pelajaran', detail: 'Lihat jadwal kelas anak.' }] : []),
    ...(canReadLearning('parent') ? [
      { to: '/materi', icon: BookOpen, title: 'Materi kelas', detail: 'Buka materi yang dibagikan guru.' },
      { to: '/tugas', icon: ClipboardList, title: 'Tugas kelas', detail: 'Dampingi anak melihat tugas dan umpan balik.' },
      { to: '/asesmen', icon: ClipboardCheck, title: 'Asesmen dan hasil', detail: 'Lihat hasil belajar yang sudah dibagikan.' },
    ] : []),
  ]
  const connection: ServiceLink[] = [
    ...(canAccessCommunication('parent') ? [{ to: '/komunikasi', icon: MessageSquare, title: 'Komunikasi dengan guru', detail: 'Hubungi guru kelas sesuai tautan keluarga.' }] : []),
    ...(canReadAnnouncements('parent') ? [{ to: '/pengumuman', icon: Sparkles, title: 'Kabar sekolah', detail: 'Baca informasi terbaru dari sekolah.' }] : []),
    ...(canReadNotifications('parent') ? [{ to: '/notifikasi', icon: Bell, title: 'Notifikasi', detail: 'Periksa pembaruan untuk akunmu.' }] : []),
  ]
  const account: ServiceLink[] = [
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
        <SchoolWhatsAppLink className="portal-secondary-action"/>
      </div></div><div className="portal-welcome-art" aria-hidden="true"><span className="portal-art-orbit"/><span className="portal-art-icon"><HeartHandshakeIcon size={38}/></span><span className="portal-art-spark">✿</span><span className="portal-art-note">Dekat dan peduli</span></div>
    </section>
    <PersonalizedShortcuts services={groups.flatMap(group => group.services)} defaults={['/ruang-orang-tua', '/laporan-ketidakhadiran', '/tugas', '/komunikasi']}/>
    <PortalServiceGroups groups={groups} audience="parent"/>
  </div>
}
