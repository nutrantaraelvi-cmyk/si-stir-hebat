import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Navigate } from 'react-router-dom'
import { getDemoSession, isDemoModeEnabled } from '../lib/demo-auth'
import { supabase } from '../lib/supabase'

const AuthContext = createContext<{ session: Session | null; loading: boolean; error: string }>({ session: null, loading: true, error: '' })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    const client = supabase
    if (isDemoModeEnabled()) {
      setSession(getDemoSession())
      setLoading(false)
      return
    }

    if (!client) {
      setSession(null)
      setLoading(false)
      return
    }

    let active = true
    let changed = false
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      changed = true
      if (active) { setSession(next); setError(''); setLoading(false) }
    })
    void client.auth.getSession().then(({ data, error: failure }) => {
      if (!active || changed) return
      setSession(data.session)
      setError(failure ? 'Sesi tidak dapat dimuat. Silakan muat ulang halaman.' : '')
      setLoading(false)
    }).catch(() => {
      if (active && !changed) { setError('Sesi tidak dapat dimuat. Silakan muat ulang halaman.'); setLoading(false) }
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])
  return <AuthContext.Provider value={{ session, loading, error }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, error } = useAuth()
  if (loading) return <section className="login" role="status">Memuat sesi…</section>
  if (error) return <section className="login" role="alert">{error}</section>
  return session ? children : <Navigate to="/login" replace />
}
