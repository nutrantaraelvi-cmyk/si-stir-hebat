import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Bell, BookHeart, BookOpen, CalendarDays, ClipboardCheck, ClipboardList, HeartHandshake as HeartHandshakeIcon, KeyRound, Sparkles, UserCheck, UserRound } from 'lucide-react'
import { canReadAnnouncements } from '../../lib/announcements'
import { canReadAssessments, canReadAttendance, canReadHabits, canReadLearning, canReadNotifications, canReadSchedules } from '../../utils/permissions'
import { habitLabels } from '../../features/student-habits/api'
import { ServiceCard, type ServiceLink } from './services'
import { PersonalizedShortcuts } from './PersonalizedShortcuts'

export function StudentWorkspace() {
  const [checkedHabits, setCheckedHabits] = useState<number[]>([])
  const learning: ServiceLink[] = [
    ...(canReadLearning('student') ? [
      { to: '/materi', icon: BookOpen, title: 'Materi kelas', detail: 'Baca bahan belajar yang dibagikan guru.' },
      { to: '/tugas', icon: ClipboardList, title: 'Tugas kelas', detail: 'Periksa tugas dan umpan balik untukmu.' },
    ] : []),
    ...(canReadSchedules('student') ? [{ to: '/jadwal', icon: CalendarDays, title: 'Jadwal pelajaran', detail: 'Lihat jadwal kelasmu.' }] : []),
    ...(canReadAssessments('student') ? [{ to: '/asesmen', icon: ClipboardCheck, title: 'Asesmen dan hasil', detail: 'Lihat asesmen dan hasil yang sudah dibagikan.' }] : []),
  ]
  const daily: ServiceLink[] = [
    ...(canReadAttendance('student') ? [{ to: '/absensi', icon: UserCheck, title: 'Kehadiranku', detail: 'Lihat catatan kehadiranmu.' }] : []),
    ...(canReadHabits('student') ? [{ to: '/kebiasaan', icon: HeartHandshakeIcon, title: '7 Kebiasaan', detail: 'Lihat catatan kebiasaanmu.' }] : []),
  ]
  const updates: ServiceLink[] = [
    ...(canReadNotifications('student') ? [{ to: '/notifikasi', icon: Bell, title: 'Notifikasi', detail: 'Periksa pembaruan untuk akunmu.' }] : []),
    ...(canReadAnnouncements('student') ? [{ to: '/pengumuman', icon: Sparkles, title: 'Kabar sekolah', detail: 'Baca informasi terbaru dari sekolah.' }] : []),
  ]
  const account: ServiceLink[] = [
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
    <PersonalizedShortcuts tone="student" services={[...learning, ...daily, ...updates, ...account]} defaults={['/materi', '/tugas', '/jadwal', '/asesmen']}/>
    <section className="student-habit-checklist" aria-labelledby="student-habits-title">
      <div className="student-habits-heading"><div><p className="student-kicker"><Sparkles size={16} aria-hidden="true"/> LANGKAH BAIK HARI INI</p><h3 id="student-habits-title">7 Kebiasaan Anak Indonesia Hebat</h3><p>Ketuk kebiasaan yang sudah kamu lakukan hari ini.</p></div><span className="student-habits-count" aria-live="polite">{checkedHabits.length} / 7</span></div>
      <div className="student-habits-progress" aria-hidden="true"><span style={{ width: `${checkedHabits.length / 7 * 100}%` }}/></div>
      <div className="student-habits-list">{habitLabels.map((label, index) => <label key={label} className={`student-habit-item${checkedHabits.includes(index) ? ' is-checked' : ''}`}><input type="checkbox" checked={checkedHabits.includes(index)} onChange={event => setCheckedHabits(current => event.target.checked ? [...current, index] : current.filter(item => item !== index))}/><span className="student-habit-number" aria-hidden="true">{index + 1}</span><span>{label}</span></label>)}</div>
      <p className="student-habits-note">Daftar ini untuk mengingat kegiatanmu selama halaman terbuka. Catatan sekolah diisi oleh orang tua atau wali.</p><Link className="student-secondary-action" to="/kebiasaan">Lihat catatan kebiasaan <ArrowUpRight size={16} aria-hidden="true"/></Link>
    </section>
    {learning.length > 0 && <section className="student-service-group" aria-labelledby="student-learning-title"><header><span className="student-group-number">01</span><div><h3 id="student-learning-title">Belajar</h3><p>Yang kamu perlukan untuk mengikuti pelajaran.</p></div></header><div className="student-service-grid">{learning.map(service => <ServiceCard key={service.to} service={service} prefix="student"/>)}</div></section>}
    {daily.length > 0 && <section className="student-service-group" aria-labelledby="student-daily-title"><header><span className="student-group-number">02</span><div><h3 id="student-daily-title">Keseharianku</h3><p>Pantau kehadiran dan kebiasaan baikmu.</p></div></header><div className="student-service-grid">{daily.map(service => <ServiceCard key={service.to} service={service} prefix="student"/>)}</div></section>}
    {updates.length > 0 && <section className="student-service-group" aria-labelledby="student-updates-title"><header><span className="student-group-number">03</span><div><h3 id="student-updates-title">Info untukmu</h3><p>Kabar dan pembaruan dari sekolah.</p></div></header><div className="student-service-grid">{updates.map(service => <ServiceCard key={service.to} service={service} prefix="student"/>)}</div></section>}
    <section className="student-service-group" aria-labelledby="student-account-title"><header><span className="student-group-number">04</span><div><h3 id="student-account-title">Akun</h3><p>Atur profil dan keamanan akunmu.</p></div></header><div className="student-service-grid">{account.map(service => <ServiceCard key={service.to} service={service} prefix="student"/>)}</div></section>
  </div>
}
