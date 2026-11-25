import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { AttendanceStatus } from './attendance-model'
import { classifySync, readQueue, writeQueue, type QueuedAttendance } from './offline-queue'

const stateLabels: Record<QueuedAttendance['state'], string> = {
  pending: 'Belum tersinkron',
  conflict: 'Konflik: data sudah diubah di perangkat lain',
  rejected: 'Ditolak server',
}

export function OfflineAttendanceQueue({ userId, version, onSynced }: { userId: string; version: number; onSynced: () => void }) {
  const [queue, setQueue] = useState<QueuedAttendance[]>(() => readQueue(userId))
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState('')
  const running = useRef(false)

  useEffect(() => { setQueue(readQueue(userId)) }, [userId, version])

  const sync = useCallback(async () => {
    const client = supabase
    if (!client || running.current) return
    const entries = readQueue(userId).filter(entry => entry.state === 'pending')
    if (entries.length === 0) return
    running.current = true
    setSyncing(true)
    setMessage('')
    let synced = 0
    let duplicates = 0
    let problems = 0
    try {
      for (const entry of entries) {
        const { error } = await client.rpc('record_attendance', { target_session: entry.sessionId, changes: entry.changes })
        let current: Record<string, AttendanceStatus | null> | undefined
        if (error?.code === '40001') {
          const { data } = await client.from('attendance_records').select('id,status').in('id', entry.changes.map(change => change.id))
          current = Object.fromEntries(((data ?? []) as { id: string; status: AttendanceStatus | null }[]).map(row => [row.id, row.status]))
        }
        const outcome = classifySync(error, entry.changes, current)
        if (outcome === 'retry') break
        const rest = readQueue(userId)
        if (outcome === 'synced' || outcome === 'duplicate') {
          writeQueue(userId, rest.filter(item => item.id !== entry.id))
          if (outcome === 'synced') synced++
          else duplicates++
        } else {
          writeQueue(userId, rest.map(item => item.id === entry.id ? { ...item, state: outcome } : item))
          problems++
        }
      }
    } finally {
      running.current = false
      setSyncing(false)
      setQueue(readQueue(userId))
    }
    const parts = [
      synced && `${synced} antrean absensi berhasil dikirim`,
      duplicates && `${duplicates} antrean ternyata sudah tersimpan sebelumnya`,
      problems && `${problems} antrean perlu ditinjau`,
    ].filter(Boolean)
    if (parts.length) setMessage(`${parts.join('; ')}.`)
    if (synced || duplicates) onSynced()
  }, [userId, onSynced])

  useEffect(() => {
    const goOnline = () => { setOnline(true); void sync() }
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    if (navigator.onLine) void sync()
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline) }
  }, [sync])

  function discard(id: string) {
    if (!window.confirm('Buang antrean ini? Perubahan absensi yang belum terkirim akan hilang dari perangkat.')) return
    writeQueue(userId, readQueue(userId).filter(item => item.id !== id))
    setQueue(readQueue(userId))
    setMessage('')
  }

  if (queue.length === 0 && online && !message) return null
  return <section className="offline-queue" aria-labelledby="offline-queue-title">
    <h2 id="offline-queue-title">Absensi di perangkat ini</h2>
    {!online && <p className="status" role="status">Perangkat sedang offline. Perubahan yang disimpan akan masuk antrean dan dikirim otomatis saat koneksi kembali.</p>}
    {message && <p className="status" role="status">{message}</p>}
    {queue.length > 0 && <ul className="attendance-history">{queue.map(entry => <li key={entry.id}>
      <strong>{entry.sessionLabel}</strong>
      <span>{entry.changes.length} perubahan · {stateLabels[entry.state]}</span>
      <time dateTime={entry.queuedAt}>Dicatat {new Date(entry.queuedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</time>
      {entry.state !== 'pending' && <p>Muat ulang absensi, periksa status terbaru, lalu catat ulang bila masih perlu. Antrean ini tidak akan dikirim lagi.</p>}
      <div className="actions">
        <button className="text-button" type="button" disabled={syncing} onClick={() => discard(entry.id)}>Buang antrean</button>
      </div>
    </li>)}</ul>}
    {queue.some(entry => entry.state === 'pending') && <button className="button" type="button" disabled={syncing || !online} onClick={() => void sync()}>{syncing ? 'Mengirim…' : 'Kirim sekarang'}</button>}
  </section>
}
