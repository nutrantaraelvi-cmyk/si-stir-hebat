import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/auth/auth-context'
import { supabase } from '../lib/supabase'
import { IDLE_LIMIT_MS, idleState, markActivity, readLastActivity, recordAuthEvent, setIdleLogoutReason, type IdleState } from '../lib/session-security'

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const
const CHECK_INTERVAL_MS = 15_000
const WRITE_THROTTLE_MS = 15_000

export function IdleSessionGuard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState<IdleState>('active')
  const lastWrite = useRef(0)
  const signingOut = useRef(false)
  const userId = session?.user.id

  useEffect(() => {
    const client = supabase
    if (!userId || !client) { setState('active'); return }
    signingOut.current = false
    if (readLastActivity() === null) markActivity()

    const touch = () => {
      const now = Date.now()
      if (now - lastWrite.current < WRITE_THROTTLE_MS) return
      lastWrite.current = now
      markActivity(now)
    }
    const check = () => {
      const next = idleState(readLastActivity() ?? Date.now(), Date.now())
      setState(next)
      if (next === 'expired' && !signingOut.current) {
        signingOut.current = true
        void (async () => {
          setIdleLogoutReason()
          await recordAuthEvent(client, 'logout')
          // navigate() React Router berjalan sebagai transition, sehingga ProtectedRoute
          // bisa lebih dulu mengalihkan ke /login. Alasan logout disimpan di atas agar
          // pesan tetap tampil di rute mana pun.
          navigate('/login?sesi=berakhir', { replace: true })
          try { await client.auth.signOut({ scope: 'local' }) } catch { /* sesi lokal tetap dibersihkan oleh SDK */ }
        })()
      }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') check() }

    check()
    const timer = window.setInterval(check, CHECK_INTERVAL_MS)
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, touch, { passive: true })
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, touch)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, navigate])

  if (!userId || state !== 'warning') return null
  return <div className="idle-warning" role="alertdialog" aria-labelledby="idle-warning-title" aria-describedby="idle-warning-detail">
    <p id="idle-warning-title"><strong>Sesi hampir berakhir</strong></p>
    <p id="idle-warning-detail">Tidak ada aktivitas selama {Math.round(IDLE_LIMIT_MS / 60000) - 1} menit. Anda akan keluar otomatis dalam 1 menit.</p>
    <button className="button" type="button" autoFocus onClick={() => { markActivity(); lastWrite.current = Date.now(); setState('active') }}>Tetap masuk</button>
  </div>
}
