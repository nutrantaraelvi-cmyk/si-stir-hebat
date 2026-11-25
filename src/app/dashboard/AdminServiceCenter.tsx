import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Bell, CalendarDays, ClipboardCheck, ClipboardList, FileText, HeartHandshake as HeartHandshakeIcon, KeyRound, Link2, PenLine, Search, ShieldCheck, UserCheck, UserRound, X, type LucideIcon } from 'lucide-react'
import { canReadTeachingModules } from '../../utils/permissions'
import { canReadMasterData } from '../../features/school/master'
import { PersonalizedShortcuts } from './PersonalizedShortcuts'
import { useTrackVisit } from './workspace-context'

type AdminService = { to: string; icon: LucideIcon; title: string; detail: string; group: 'Kelola sekolah' | 'Pantau layanan' | 'Akun' }

export function AdminServiceCenter() {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<'Semua' | AdminService['group']>('Semua')
  const track = useTrackVisit()
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
    <PersonalizedShortcuts services={services} defaults={['/akun-sekolah', '/tautan-akun', '/sekolah', '/pengumuman']}/>
    <div className="admin-service-toolbar">
      <label className="admin-service-search"><Search size={19} aria-hidden="true"/><span className="sr-only">Cari layanan administrator</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari layanan, misalnya data sekolah" /></label>
      {query && <button className="admin-clear-search" type="button" onClick={() => setQuery('')}><X size={16} aria-hidden="true"/> Hapus pencarian</button>}
    </div>
    <div className="admin-service-filters" role="group" aria-label="Filter kategori layanan">{categories.map(category => <button key={category} type="button" aria-pressed={group === category} onClick={() => setGroup(category)}>{category}</button>)}</div>
    <p className="admin-service-count" aria-live="polite">{visibleServices.length} layanan tersedia{group !== 'Semua' ? ` di ${group.toLocaleLowerCase('id-ID')}` : ''}</p>
    {visibleServices.length ? <div className="admin-service-grid">{visibleServices.map(({ to, icon: Icon, title, detail, group: itemGroup }) => <Link className="admin-service-card" to={to} key={to} onClick={() => track(to)} data-reveal>
      <span className="admin-service-icon"><Icon size={20} aria-hidden="true"/></span><span className="admin-service-copy"><small>{itemGroup}</small><strong>{title}</strong><span>{detail}</span></span><ArrowUpRight className="admin-service-arrow" size={18} aria-hidden="true"/>
    </Link>)}</div> : <p className="admin-service-empty">Tidak ada layanan yang cocok. Coba kata kunci lain atau pilih kategori “Semua”.</p>}
  </div>
}
