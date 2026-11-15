import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { canReadMasterData } from '../features/school/master'
import { canReadAnnouncements } from '../lib/announcements'
import { getDemoProfile } from '../lib/demo-auth'
import { canReadAssessments, canReadAttendance, canReadJournals, canReadLearning, canReadSchedules } from '../lib/school'
import { supabase } from '../lib/supabase'
import { useAuth } from './Auth'

function SchoolNavigation({ userId }: { userId: string }) {
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const client = supabase
    if (!client) {
      setRole(getDemoProfile(userId)?.role ?? null)
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

  return <>
    <NavLink to="/dashboard">Dashboard</NavLink>
    {supabase && canReadMasterData('school_settings', role) && <NavLink to="/sekolah">Data sekolah</NavLink>}
    {supabase && canReadAttendance(role) && <NavLink to="/absensi">Absensi</NavLink>}
    {supabase && canReadJournals(role) && <NavLink to="/jurnal">Jurnal</NavLink>}
    {supabase && canReadJournals(role) && <NavLink to="/modul-ajar">Modul Ajar</NavLink>}
    {supabase && canReadLearning(role) && <NavLink to="/materi">Materi Kelas</NavLink>}
    {supabase && canReadLearning(role) && <NavLink to="/tugas">Tugas Kelas</NavLink>}
    {supabase && canReadAssessments(role) && <NavLink to="/asesmen">Asesmen</NavLink>}
    {supabase && canReadSchedules(role) && <NavLink to="/jadwal">Jadwal</NavLink>}
    {supabase && (role === 'principal' || role === 'teacher') && <NavLink to="/supervisi">Supervisi</NavLink>}
    {canReadAnnouncements(role) && <NavLink to="/pengumuman">Pengumuman</NavLink>}
    {supabase && role === 'administrator' && <NavLink to="/tautan-akun">Tautan akun</NavLink>}
    {supabase && role === 'parent' && <NavLink to="/ruang-orang-tua">Ruang Orang Tua</NavLink>}
    <NavLink to="/akun">Akun</NavLink>
  </>
}

export function Header() {
  const { session, loading } = useAuth()

  return <header className="header">
    <Link className="brand" to="/">
      <span className="logo" aria-hidden="true">S</span>
      <span>SI STIR <strong>HEBAT</strong><small>SDN 03 WONOSARI</small></span>
    </Link>
    <nav className="main-nav" aria-label="Navigasi utama">
      <NavLink to="/" end>Beranda</NavLink>
      {!loading && (session
        ? <SchoolNavigation key={session.user.id} userId={session.user.id} />
        : <NavLink to="/login">Masuk</NavLink>)}
    </nav>
  </header>
}
