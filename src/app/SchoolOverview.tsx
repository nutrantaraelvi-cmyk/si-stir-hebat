import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const metrics = [
  { table: 'students', label: 'Siswa aktif', href: '/sekolah/students' },
  { table: 'teachers', label: 'Guru aktif', href: '/sekolah/teachers' },
  { table: 'school_classes', label: 'Kelas aktif', href: '/sekolah/school_classes' },
]
export function SchoolOverview({ role }: { role: string }) {
  const [counts, setCounts] = useState<(number | null)[]>([null, null, null])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const allowed = role === 'administrator' || role === 'principal'
  useEffect(() => {
    const client = supabase
    if (!client || !allowed) return
    const controller = new AbortController()
    setCounts([null, null, null]); setLoading(true); setFailed(false)
    void (async () => {
      const results = await Promise.allSettled(metrics.map(metric => client.from(metric.table)
        .select('id', { count: 'exact', head: true }).eq('is_active', true).abortSignal(controller.signal)))
      if (controller.signal.aborted) return
      const values = results.map(result => result.status === 'fulfilled' && !result.value.error
        && Number.isSafeInteger(result.value.count) && result.value.count! >= 0 ? result.value.count : null)
      setCounts(values); setFailed(values.some(value => value === null)); setLoading(false)
    })()
    return () => controller.abort()
  }, [allowed, attempt])
  if (!allowed || !supabase) return null
  return <section aria-labelledby="school-overview"><h2 id="school-overview">Ringkasan data sekolah</h2>
    <p>Jumlah registri berstatus aktif. Kelas mencakup semua tahun ajaran; angka siswa bukan jumlah keanggotaan kelas.</p>
    {loading && <p role="status">Memuat ringkasan sekolah…</p>}
    <div className="dashboard-stats">{metrics.map((metric, index) => <article key={metric.table} aria-label={metric.label}>
      <span>{metric.label}</span><strong>{counts[index] ?? 'N/A'}</strong><Link to={metric.href}>Lihat {metric.label.toLowerCase()}</Link>
    </article>)}</div>
    {failed && <p className="error" role="alert">Sebagian jumlah belum dapat dimuat. Angka yang tidak tersedia ditandai N/A.</p>}
    <button className="refresh-button" disabled={loading} onClick={() => setAttempt(n => n + 1)}>Muat ulang ringkasan</button>
    {!loading && counts.every(value => value === 0) && role === 'administrator' && <p className="status">Data aktif belum tersedia. <Link to="/sekolah">Mulai isi data sekolah</Link>, lalu tambahkan guru, siswa dan kelas.</p>}
  </section>
}
