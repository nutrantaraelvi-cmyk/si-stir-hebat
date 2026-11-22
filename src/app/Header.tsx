import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { canReadMasterData } from '../features/school/master'
import { canReadAnnouncements } from '../lib/announcements'
import { supabase } from '../lib/supabase'
import { canAccessCommunication, canReadAbsenceReports, canReadAccountLinks, canReadAssessments, canReadAttendance, canReadGuardianPortal, canReadHabits, canReadJournals, canReadLearning, canReadNotifications, canReadSchedules, canReadSchoolDocuments, canReadSupervision, canReadTeacherAttendance, canReadTeachingModules } from '../utils/permissions'
import { useAuth } from '../components/auth/auth-context'

type NavItem = { to: string; label: string }

function navItems(role: string | null): NavItem[] {
  const items: NavItem[] = [
    { to: '/', label: 'Beranda' },
    { to: '/dashboard', label: 'Dashboard' },
  ]
  if (canReadMasterData('school_settings', role)) items.push({ to: '/sekolah', label: 'Data sekolah' })
  if (role === 'administrator') items.push({ to: '/akun-sekolah', label: 'Akun sekolah' })
  if (canReadAttendance(role)) items.push({ to: '/absensi', label: 'Absensi' })
  if (canReadTeacherAttendance(role)) items.push({ to: '/absensi-guru', label: 'Absensi guru' })
  if (canReadJournals(role)) items.push({ to: '/jurnal', label: 'Jurnal' })
  if (canReadTeachingModules(role)) items.push({ to: '/modul-ajar', label: 'Modul Ajar' })
  if (canReadLearning(role)) items.push({ to: '/materi', label: 'Materi Kelas' })
  if (canReadLearning(role)) items.push({ to: '/tugas', label: 'Tugas Kelas' })
  if (canReadAssessments(role)) items.push({ to: '/asesmen', label: 'Asesmen' })
  if (canReadSchedules(role)) items.push({ to: '/jadwal', label: 'Jadwal' })
  if (canAccessCommunication(role)) items.push({ to: '/komunikasi', label: 'Komunikasi' })
  if (canReadSupervision(role)) items.push({ to: '/supervisi', label: 'Supervisi' })
  if (canReadAnnouncements(role)) items.push({ to: '/pengumuman', label: 'Pengumuman' })
  if (canReadSchoolDocuments(role)) items.push({ to: '/dokumen', label: 'Dokumen sekolah' })
  if (canReadAccountLinks(role)) items.push({ to: '/tautan-akun', label: 'Tautan akun' })
  if (canReadGuardianPortal(role)) items.push({ to: '/ruang-orang-tua', label: 'Ruang Orang Tua' })
  if (canReadAbsenceReports(role)) items.push({ to: '/laporan-ketidakhadiran', label: 'Laporan ketidakhadiran' })
  if (canReadNotifications(role)) items.push({ to: '/notifikasi', label: 'Notifikasi' })
  if (canReadHabits(role)) items.push({ to: '/kebiasaan', label: '7 Kebiasaan' })
  items.push({ to: '/akun', label: 'Akun' })
  return items
}

function useRole(userId: string | null) {
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setRole(null)
      return
    }
    const client = supabase
    if (!client) {
      setRole(null)
      return
    }

    let active = true
    const loadRole = async () => {
      try {
        const { data, error } = await client.from('profiles').select('role').eq('id', userId).maybeSingle()
        if (active) setRole(error ? null : data?.role ?? null)
      } catch {
        if (active) setRole(null)
      }
    }
    void loadRole()
    return () => { active = false }
  }, [userId])

  return role
}

function NavLinks({ items }: { items: NavItem[] }) {
  return <>{items.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'}>{item.label}</NavLink>)}</>
}

function SessionNavigation({ userId }: { userId: string }) {
  const role = useRole(userId)
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const items = navItems(role)
  const primary = items.slice(0, 4)
  const overflow = items.slice(4)

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return <>
    <nav className="main-nav" aria-label="Navigasi utama">
      <NavLinks items={items} />
    </nav>
    <nav className="bottom-nav" aria-label="Navigasi cepat">
      {primary.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'}>{item.label}</NavLink>)}
      <button ref={toggleRef} type="button" aria-expanded={open} aria-controls="nav-drawer" onClick={() => setOpen(value => !value)}>
        Lainnya
      </button>
    </nav>
    {open && <div className="nav-drawer" id="nav-drawer" role="dialog" aria-label="Menu lainnya" onClick={() => { setOpen(false); toggleRef.current?.focus() }}>
      <div className="nav-drawer-panel" onClick={event => event.stopPropagation()}>
        <div className="nav-drawer-head">
          <h2>Menu lainnya</h2>
          <button ref={closeRef} type="button" onClick={() => { setOpen(false); toggleRef.current?.focus() }}>Tutup</button>
        </div>
        <nav aria-label="Menu tambahan">
          <NavLinks items={overflow} />
        </nav>
      </div>
    </div>}
  </>
}

export function Header() {
  const { session, loading } = useAuth()

  return <header className="header">
    <Link className="brand" to="/">
      <span className="logo" aria-hidden="true">S</span>
      <span>SI STIR <strong>HEBAT</strong><small>SDN 03 WONOSARI</small></span>
    </Link>
    {!loading && (session
      ? <SessionNavigation key={session.user.id} userId={session.user.id} />
      : <nav className="guest-nav" aria-label="Navigasi utama"><NavLink to="/" end>Beranda</NavLink><NavLink to="/login">Masuk</NavLink></nav>)}
  </header>
}
