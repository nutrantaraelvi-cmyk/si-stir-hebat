import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, History, Pin, Settings2, type LucideIcon } from 'lucide-react'
import { MAX_PINNED, greetingFor, loadPreferences, movePinned, pickAllowed, savePreferences, todayLabel, togglePinned, type WorkspacePreferences } from './personalization'
import { useTrackVisit, useWorkspaceIdentity } from './workspace-context'

type ShortcutService = { to: string; icon: LucideIcon; title: string; detail: string }

// Murid disapa dengan "kamu"; peran lain memakai bahasa formal "Anda".
const copy = {
  formal: {
    title: 'Pintasan saya', toggle: 'Atur pintasan', done: 'Selesai mengatur',
    intro: 'Layanan pilihan Anda tampil paling atas. Pilihan ini hanya tersimpan di perangkat ini.',
    empty: 'untuk menyematkan layanan yang sering Anda buka.',
  },
  student: {
    title: 'Pintasanku', toggle: 'Atur pintasanku', done: 'Selesai mengatur',
    intro: 'Pilih kegiatan favoritmu supaya selalu ada di atas. Pilihan ini hanya tersimpan di perangkat ini.',
    empty: 'untuk memilih kegiatan yang sering kamu buka.',
  },
}
type Tone = keyof typeof copy

// Panel "Pintasan saya" untuk ruang guru, kepala sekolah, orang tua, dan admin.
// Pengguna memilih hingga enam layanan yang paling sering dipakai; pilihan
// disimpan di perangkat ini untuk akun tersebut.
export function PersonalizedShortcuts({ services, defaults = [], tone = 'formal' }: { services: ShortcutService[]; defaults?: string[]; tone?: Tone }) {
  const identity = useWorkspaceIdentity()
  return identity ? <ShortcutPanel key={`${identity.role}:${identity.userId}`} userId={identity.userId} role={identity.role} services={services} defaults={defaults} tone={tone}/> : null
}

function ShortcutPanel({ userId, role, services, defaults, tone }: { userId: string; role: string; services: ShortcutService[]; defaults: string[]; tone: Tone }) {
  const text = copy[tone]
  const titleId = useId()
  const editorId = useId()
  const track = useTrackVisit()
  const [now] = useState(() => new Date())
  const [stored, setStored] = useState(() => loadPreferences(userId, role))
  const [editing, setEditing] = useState(false)

  // Pengguna baru mendapat pintasan awal sesuai peran sampai mengatur sendiri.
  const pinnedOrder = stored.custom ? stored.pinned : defaults
  const pinned = pickAllowed(pinnedOrder, services)
  const recent = pickAllowed(stored.recent, services).filter(service => !pinnedOrder.includes(service.to))
  const full = pinned.length >= MAX_PINNED

  const update = (change: (prefs: WorkspacePreferences) => WorkspacePreferences) => {
    // Buang pintasan yang sudah tidak tersedia sebelum mengubah urutan atau batas.
    const current = pickAllowed(pinnedOrder, services).map(service => service.to)
    const next = { ...change({ ...stored, pinned: current }), custom: true }
    setStored(next)
    savePreferences(userId, role, next)
  }

  return <section className="ws-shortcuts" data-reveal aria-labelledby={titleId}>
    <header className="ws-shortcuts-heading">
      <div>
        <p className="ws-shortcuts-greeting">{greetingFor(now)} · <time dateTime={now.toISOString().slice(0, 10)}>{todayLabel(now)}</time></p>
        <h3 id={titleId}><Pin size={18} aria-hidden="true"/> {text.title}</h3>
        <p>{text.intro}</p>
      </div>
      <button type="button" className="ws-shortcuts-toggle" aria-expanded={editing} aria-controls={editing ? editorId : undefined} onClick={() => setEditing(value => !value)}>
        <Settings2 size={17} aria-hidden="true"/> {editing ? text.done : text.toggle}
      </button>
    </header>

    {pinned.length ? <ul className="ws-shortcut-grid" aria-label="Layanan yang disematkan">
      {pinned.map(({ to, icon: Icon, title }, index) => <li key={to}>
        <Link className="ws-shortcut" to={to} onClick={() => track(to)}><span className="ws-shortcut-icon"><Icon size={19} aria-hidden="true"/></span><strong>{title}</strong><ArrowUpRight size={16} aria-hidden="true"/></Link>
        {editing && <span className="ws-shortcut-order">
          <button type="button" aria-label={`Majukan ${title}`} disabled={index === 0} onClick={() => update(prefs => movePinned(prefs, to, -1))}><ArrowLeft size={15} aria-hidden="true"/></button>
          <button type="button" aria-label={`Mundurkan ${title}`} disabled={index === pinned.length - 1} onClick={() => update(prefs => movePinned(prefs, to, 1))}><ArrowRight size={15} aria-hidden="true"/></button>
        </span>}
      </li>)}
    </ul> : <p className="ws-shortcuts-empty">Belum ada pintasan. Pilih <strong>{text.toggle}</strong> {text.empty}</p>}

    {editing && <fieldset className="ws-shortcut-editor" id={editorId}>
      <legend>Pilih hingga {MAX_PINNED} layanan ({pinned.length}/{MAX_PINNED} dipilih)</legend>
      <div className="ws-shortcut-options">{services.map(service => {
        const checked = pinnedOrder.includes(service.to)
        return <label key={service.to} className={checked ? 'is-checked' : undefined}>
          <input type="checkbox" checked={checked} disabled={!checked && full} onChange={() => update(prefs => togglePinned(prefs, service.to))}/>
          <span>{service.title}</span>
        </label>
      })}</div>
      {full && <p className="ws-shortcut-limit" role="status">Batas {MAX_PINNED} pintasan tercapai. Lepas salah satu untuk memilih yang lain.</p>}
    </fieldset>}

    {recent.length > 0 && <div className="ws-recent">
      <p><History size={15} aria-hidden="true"/> Terakhir dibuka</p>
      <ul>{recent.map(({ to, title }) => <li key={to}><Link to={to} onClick={() => track(to)}>{title}</Link></li>)}</ul>
    </div>}
  </section>
}
