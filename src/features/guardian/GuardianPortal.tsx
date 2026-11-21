import { useEffect, useState } from 'react'
import { useAuth } from '../../components/auth/auth-context'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { supabase } from '../../lib/supabase'
import { attendanceLabels, type AttendanceStatus } from '../attendance/attendance-model'
import { isParent } from '../../utils/permissions'

type Child = {
  id: string
  name: string
  attendance: { id: string; date: string; status: AttendanceStatus | null }[]
}

type Result = { state: 'loading' | 'error' | 'denied' } | { state: 'ready'; children: Child[] }

export function GuardianPortal() {
  const { session } = useAuth()
  return session && <GuardianAttendance key={session.user.id} userId={session.user.id} />
}

function GuardianAttendance({ userId }: { userId: string }) {
  const [result, setResult] = useState<Result>({ state: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const client = supabase
    if (!client) {
      setResult({ state: 'denied' })
      return
    }

    const controller = new AbortController()
    const load = async () => {
      try {
        const profile = await client.from('profiles').select('role').eq('id', userId)
          .abortSignal(controller.signal).maybeSingle()
        if (profile.error) throw profile.error
        if (controller.signal.aborted) return
        if (!isParent(profile.data?.role)) {
          setResult({ state: 'denied' })
          return
        }

        const response = await client.rpc('guardian_attendance').abortSignal(controller.signal)
        if (response.error || !Array.isArray(response.data)) throw new Error('Attendance unavailable')
        if (!controller.signal.aborted) setResult({ state: 'ready', children: response.data })
      } catch {
        if (!controller.signal.aborted) setResult({ state: 'error' })
      }
    }
    void load()
    return () => controller.abort()
  }, [userId, attempt])

  function refresh() {
    setResult({ state: 'loading' })
    setAttempt(value => value + 1)
  }

  return <section className="workspace guardian-page">
    <h1>Ruang Orang Tua</h1>
    {result.state === 'loading' && <LoadingState />}
    {result.state === 'error' && <ErrorNotice onRetry={refresh}>Kehadiran gagal dimuat.</ErrorNotice>}
    {result.state === 'denied' && <EmptyState>Halaman ini tersedia untuk akun orang tua atau wali.</EmptyState>}
    {result.state === 'ready' && <>
      <button className="button secondary" type="button" onClick={refresh}>Muat ulang kehadiran</button>
      {result.children.length === 0 && <EmptyState>Belum ada tautan anak aktif. Hubungi administrator sekolah untuk verifikasi.</EmptyState>}
      {result.children.map(child => <section key={child.id} className="announcement-editor">
        <h2>{child.name}</h2>
        {child.attendance.length === 0
          ? <EmptyState>Belum ada catatan kehadiran.</EmptyState>
          : <div className="table-scroll" role="region" aria-label="Tabel kehadiran anak yang dapat digeser" tabIndex={0}>
            <table>
              <caption>Hingga 30 catatan kehadiran terbaru</caption>
              <thead><tr><th scope="col">Tanggal</th><th scope="col">Status</th></tr></thead>
              <tbody>{child.attendance.map(record => <tr key={record.id}>
                <td><time dateTime={record.date}>{record.date}</time></td>
                <td>{record.status ? attendanceLabels[record.status] : 'Belum diisi'}</td>
              </tr>)}</tbody>
            </table>
          </div>}
      </section>)}
    </>}
  </section>
}
