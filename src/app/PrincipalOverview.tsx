import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const metrics = [
  { table: 'academic_supervisions', field: 'stage', value: 1, label: 'Pra-observasi', tone: 'supervision' },
  { table: 'academic_supervisions', field: 'stage', value: 2, label: 'Observasi', tone: 'supervision' },
  { table: 'academic_supervisions', field: 'stage', value: 3, label: 'Pasca-observasi', tone: 'supervision' },
  { table: 'academic_supervisions', field: 'stage', value: 4, label: 'Tindak lanjut', tone: 'supervision' },
  { table: 'teaching_modules', field: 'status', value: 'submitted', label: 'Perlu ditinjau', tone: 'submitted' },
  { table: 'teaching_modules', field: 'status', value: 'returned', label: 'Dikembalikan', tone: 'returned' },
] as const

export function PrincipalOverview() {
  const [counts, setCounts] = useState<(number | null)[]>(metrics.map(() => null))
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const failed = counts.some(count => count === null)

  useEffect(() => {
    const client = supabase
    if (!client) return
    const controller = new AbortController()
    setCounts(metrics.map(() => null))
    setLoading(true)
    void (async () => {
      const results = await Promise.allSettled(metrics.map(metric => client.from(metric.table)
        .select('id', { count: 'exact', head: true }).eq(metric.field, metric.value).abortSignal(controller.signal)))
      if (controller.signal.aborted) return
      const values = results.map(result => {
        const count = result.status === 'fulfilled' && !result.value.error ? result.value.count : null
        return Number.isSafeInteger(count) && (count ?? -1) >= 0 ? count : null
      })
      setCounts(values)
      setLoading(false)
    })()
    return () => controller.abort()
  }, [attempt])

  if (!supabase) return null
  return <section className="principal-overview" aria-labelledby="principal-overview-title">
    <h2 id="principal-overview-title">Ringkasan kepala sekolah</h2>
    <p>Jumlah sesi menurut tahap terakhir dan modul ajar yang dapat ditinjau. Draf pribadi guru tidak dihitung.</p>
    {loading && <p role="status">Memuat ringkasan supervisi dan perangkat…</p>}
    <div className="principal-metrics">
      {metrics.map((metric, index) => <article className={`principal-metric ${metric.tone}`} key={`${metric.table}-${metric.value}`} aria-label={metric.label}>
        <span>{metric.label}</span>
        <strong>{counts[index] ?? 'N/A'}</strong>
      </article>)}
    </div>
    {!loading && failed && <p className="principal-error" role="alert">Sebagian ringkasan belum dapat dimuat. Angka yang tidak tersedia ditandai N/A.</p>}
    <div className="principal-links"><Link to="/supervisi">Buka supervisi</Link><Link to="/modul-ajar">Buka modul ajar</Link></div>
    <button className="principal-refresh" type="button" disabled={loading} onClick={() => setAttempt(value => value + 1)}>Muat ulang ringkasan kepala sekolah</button>
  </section>
}
