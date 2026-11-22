import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, ErrorNotice, LoadingState } from '../../components/ui/Feedback'
import { supabase } from '../../lib/supabase'

type PendingAccount = { profile_id: string; full_name: string; email: string; created_at: string }
const roleOptions = [
  { value: 'teacher', label: 'Guru' },
  { value: 'principal', label: 'Kepala Sekolah' },
  { value: 'student', label: 'Murid' },
  { value: 'parent', label: 'Orang Tua/Wali' },
]

export function SchoolAccounts() {
  const [accounts, setAccounts] = useState<PendingAccount[]>([])
  const [roles, setRoles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [confirming, setConfirming] = useState<PendingAccount | null>(null)
  const [query, setQuery] = useState('')
  const [identityChecked, setIdentityChecked] = useState(false)
  const visibleAccounts = accounts.filter(account => `${account.full_name} ${account.email}`.toLocaleLowerCase('id-ID').includes(query.trim().toLocaleLowerCase('id-ID')))

  const load = useCallback(async () => {
    if (!supabase) {
      setError('Fitur ini memerlukan koneksi Supabase yang dikonfigurasi.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    const { data, error: failure } = await supabase.rpc('list_pending_school_accounts')
    if (failure) {
      setError('Daftar akun menunggu gagal dimuat. Pastikan migration terbaru sudah diterapkan dan akun Anda administrator.')
      setAccounts([])
    } else {
      setAccounts((data ?? []) as PendingAccount[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load, attempt])

  async function assign(account: PendingAccount) {
    const role = roles[account.profile_id]
    if (!supabase || !role) return
    setBusy(account.profile_id)
    setError('')
    setMessage('')
    const { error: failure } = await supabase.rpc('assign_school_role', {
      target_profile_id: account.profile_id,
      next_role: role,
    })
    setBusy(null)
    setConfirming(null)
    if (failure) {
      setError('Peran belum dapat ditetapkan. Akun mungkin sudah ditangani admin lain; muat ulang daftar.')
      return
    }
    setMessage(`Peran ${roleOptions.find(option => option.value === role)?.label} ditetapkan untuk ${account.email}.`)
    setRoles(current => { const next = { ...current }; delete next[account.profile_id]; return next })
    setAttempt(value => value + 1)
  }

  return <section className="board workspace">
    <PageHeader title="Akun sekolah" description="Tetapkan peran untuk akun yang sudah memverifikasi emailnya." />
    <p className="status">Cara memeriksa: cari nama atau email, cocokkan identitas dengan data sekolah, pilih peran, lalu konfirmasi.</p>
    <div className="actions"><label htmlFor="account-search">Cari nama atau email</label><input id="account-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nama atau email" /><button type="button" className="refresh-button" disabled={loading || Boolean(busy)} onClick={() => setAttempt(value => value + 1)}>Muat ulang daftar</button></div>
    {message && <p className="status" role="status">{message}</p>}
    {error ? <ErrorNotice onRetry={() => setAttempt(value => value + 1)}>{error}</ErrorNotice> : loading ? <LoadingState/> : !accounts.length ? <EmptyState>Belum ada akun terverifikasi yang menunggu penetapan peran. Jika akun belum muncul, minta pemiliknya membuka email verifikasi, lalu muat ulang daftar.</EmptyState> : !visibleAccounts.length ? <EmptyState>Tidak ada akun yang cocok. Periksa kata pencarian atau hapus pencarian.</EmptyState> : <>
      <p className="status">Periksa nama dan email dengan data sekolah sebelum menetapkan akses. Peran Administrator tidak dapat diberikan dari halaman ini.</p>
      <div className="table-scroll" role="region" aria-label="Daftar akun menunggu" tabIndex={0}>
        <table><caption>Akun menunggu verifikasi sekolah</caption><thead><tr><th scope="col">Nama</th><th scope="col">Email terverifikasi</th><th scope="col">Terdaftar</th><th scope="col">Peran</th><th scope="col">Tindakan</th></tr></thead>
          <tbody>{visibleAccounts.map(account => <tr key={account.profile_id}>
            <td>{account.full_name || 'Nama belum diisi'}</td><td>{account.email}</td><td>{new Date(account.created_at).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}</td>
            <td><label className="sr-only" htmlFor={`role-${account.profile_id}`}>Peran untuk {account.email}</label><select id={`role-${account.profile_id}`} value={roles[account.profile_id] ?? ''} disabled={Boolean(busy)} onChange={event => setRoles(current => ({ ...current, [account.profile_id]: event.target.value }))}><option value="">Pilih peran</option>{roleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
            <td><button className="button" type="button" disabled={!roles[account.profile_id] || Boolean(busy)} onClick={() => { setIdentityChecked(false); setConfirming(account) }}>Tetapkan peran</button></td>
          </tr>)}</tbody>
        </table>
      </div>
    </>}
    {confirming && <div className="confirm-panel" role="alertdialog" aria-modal="false" aria-labelledby="assign-school-role"><h2 id="assign-school-role">Periksa sebelum menetapkan</h2><p>Nama: <strong>{confirming.full_name || 'Belum diisi'}</strong><br />Email: <strong>{confirming.email}</strong><br />Peran: <strong>{roleOptions.find(option => option.value === roles[confirming.profile_id])?.label}</strong></p><label><input type="checkbox" checked={identityChecked} onChange={event => setIdentityChecked(event.target.checked)} disabled={Boolean(busy)} /> Saya sudah mencocokkan identitas dan peran dengan data sekolah.</label><div className="actions"><button className="button" type="button" disabled={!identityChecked || Boolean(busy)} onClick={() => void assign(confirming)}>Ya, tetapkan</button><button className="button secondary" type="button" disabled={Boolean(busy)} onClick={() => setConfirming(null)}>Periksa lagi</button></div></div>}
  </section>
}
