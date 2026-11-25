import { useEffect, useState } from 'react'
import { useOwnRole } from '../../components/auth/use-own-role'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { TruncationNotice } from '../../components/ui/TruncationNotice'
import { supabase } from '../../lib/supabase'
import { canReadAuditLog, canRevokeSessions } from '../../utils/permissions'
import { auditModuleLabels, cabutSesi, daftarAudit, namaPelaku, securityActionLabels, type AuditEntry, type AuditModule } from './api'

type PageState =
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'ready'; items: AuditEntry[]; hasMore: boolean; names: Record<string, string> }

const formatTime = (value: string) => new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })
const shortId = (value: string | null) => value ? `${value.slice(0, 8)}…` : '—'

export function AuditLog() {
  const [roleAttempt, setRoleAttempt] = useState(0)
  const roleState = useOwnRole(roleAttempt)
  const role = roleState.state === 'ready' ? roleState.role : undefined
  const allowed = canReadAuditLog(role)
  const [module, setModule] = useState<AuditModule | ''>('')
  const [page, setPage] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [pageState, setPageState] = useState<PageState>({ state: 'loading' })
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; label: string } | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'status' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const client = supabase
    if (!client || !allowed) return
    let active = true
    void (async () => {
      try {
        const result = await daftarAudit(client, page, module)
        const ids = result.items.flatMap(item => [item.actor_id, item.module === 'keamanan' || item.module === 'peran' ? item.record_id : null])
          .filter((id): id is string => Boolean(id))
        const names = await namaPelaku(client, ids).catch(() => ({}))
        if (active) setPageState({ state: 'ready', ...result, names })
      } catch {
        if (active) setPageState({ state: 'error' })
      }
    })()
    return () => { active = false }
  }, [allowed, module, page, attempt])

  const reload = () => { setPageState({ state: 'loading' }); setAttempt(value => value + 1) }

  async function confirmRevoke() {
    const client = supabase
    if (!client || !revokeTarget || revoking) return
    setRevoking(true)
    setNotice(null)
    try {
      const count = await cabutSesi(client, revokeTarget.id)
      setNotice({ tone: 'status', text: `${count} sesi milik ${revokeTarget.label} dicabut. Token yang sudah terbit berakhir paling lama 1 jam lagi.` })
      setRevokeTarget(null)
      reload()
    } catch {
      setNotice({ tone: 'error', text: `Sesi ${revokeTarget.label} belum dapat dicabut. Pastikan migration terbaru sudah diterapkan, lalu coba lagi.` })
    } finally {
      setRevoking(false)
    }
  }

  const heading = <div className="board-heading"><div><div className="eyebrow">PENGAWASAN</div><h1>Audit log</h1><p>Jejak login/logout, perubahan peran, dan perubahan data penting. Isi data (nilai, alasan, catatan) tidak ditampilkan di sini.</p></div></div>

  if (roleState.state === 'loading') return <section className="board audit-page">{heading}<LoadingState /></section>
  if (roleState.state === 'error') return <section className="board audit-page">{heading}<ErrorNotice onRetry={() => setRoleAttempt(value => value + 1)}>Profil akun belum dapat dimuat.</ErrorNotice></section>
  if (!allowed) return <section className="board audit-page">{heading}<EmptyState>Audit log hanya tersedia untuk administrator dan kepala sekolah.</EmptyState></section>

  const label = (id: string | null, names: Record<string, string>) => (id && names[id]) || shortId(id)

  return <section className="board audit-page">
    {heading}
    <div className="toolbar">
      <label htmlFor="audit-module">Modul</label>
      <select id="audit-module" value={module} onChange={event => { setModule(event.target.value as AuditModule | ''); setPage(0); setPageState({ state: 'loading' }) }}>
        <option value="">Semua modul</option>
        {Object.entries(auditModuleLabels).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
      <button className="text-button" type="button" onClick={reload}>Muat ulang</button>
    </div>
    {notice && <p className={notice.tone === 'error' ? 'error' : 'status'} role={notice.tone === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
    {pageState.state === 'loading' && <LoadingState />}
    {pageState.state === 'error' && <ErrorNotice onRetry={reload}>Audit log belum dapat dimuat. Pastikan migration audit sudah diterapkan.</ErrorNotice>}
    {pageState.state === 'ready' && (pageState.items.length === 0
      ? <EmptyState>Belum ada catatan audit untuk pilihan ini.</EmptyState>
      : <table className="data-table">
        <thead><tr><th scope="col">Waktu (WIB)</th><th scope="col">Modul</th><th scope="col">Kejadian</th><th scope="col">Pelaku</th><th scope="col">Objek</th>{canRevokeSessions(role) && <th scope="col">Tindakan</th>}</tr></thead>
        <tbody>{pageState.items.map((item, index) => {
          const isSecurity = item.module === 'keamanan'
          const subject = isSecurity && item.action !== 'sessions_revoked' ? item.actor_id : item.record_id
          const subjectLabel = label(subject, pageState.names)
          return <tr key={`${item.occurred_at}-${index}`}>
            <td data-label="Waktu"><time dateTime={item.occurred_at}>{formatTime(item.occurred_at)}</time></td>
            <td data-label="Modul">{auditModuleLabels[item.module] ?? item.module}</td>
            <td data-label="Kejadian">{isSecurity ? securityActionLabels[item.action] ?? item.action : item.action}</td>
            <td data-label="Pelaku">{label(item.actor_id, pageState.names)}</td>
            <td data-label="Objek">{isSecurity && item.action !== 'sessions_revoked' ? '—' : label(item.record_id, pageState.names)}</td>
            {canRevokeSessions(role) && <td data-label="Tindakan">{isSecurity && item.action === 'login' && subject
              ? <button className="text-button" type="button" onClick={() => setRevokeTarget({ id: subject, label: subjectLabel })}>Cabut sesi akun ini</button>
              : null}</td>}
          </tr>
        })}</tbody>
      </table>)}
    {pageState.state === 'ready' && <TruncationNotice hasMore={pageState.hasMore} />}
    {pageState.state === 'ready' && <nav className="pagination" aria-label="Halaman audit">
      <button className="text-button" type="button" disabled={page === 0} onClick={() => { setPage(page - 1); setPageState({ state: 'loading' }) }}>Sebelumnya</button>
      <span aria-live="polite">Halaman {page + 1}</span>
      <button className="text-button" type="button" disabled={!pageState.hasMore} onClick={() => { setPage(page + 1); setPageState({ state: 'loading' }) }}>Berikutnya</button>
    </nav>}
    <ConfirmDialog
      open={Boolean(revokeTarget)}
      tone="danger"
      title="Cabut semua sesi akun?"
      description={<>Semua perangkat yang masuk dengan akun <strong>{revokeTarget?.label}</strong> akan diminta masuk ulang. Tindakan ini dicatat di audit log.</>}
      confirmLabel={revoking ? 'Mencabut…' : 'Cabut sesi'}
      busy={revoking}
      onConfirm={() => void confirmRevoke()}
      onCancel={() => setRevokeTarget(null)}
    />
  </section>
}
