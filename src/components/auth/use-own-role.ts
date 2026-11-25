import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { SchoolRole } from '../../utils/permissions'
import { useAuth } from './auth-context'

export type OwnRoleState =
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'ready'; role: SchoolRole }

// Peran hanya untuk menentukan tampilan; otorisasi tetap di RLS.
export async function fetchOwnRole(client: SupabaseClient, userId: string, signal?: AbortSignal): Promise<SchoolRole> {
  let query = client.from('profiles').select('role').eq('id', userId)
  if (signal) query = query.abortSignal(signal)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return ((data as { role?: string } | null)?.role ?? 'pending') as SchoolRole
}

export function useOwnRole(attempt = 0): OwnRoleState {
  const { session } = useAuth()
  const userId = session?.user.id
  const [result, setResult] = useState<{ key: string; value: OwnRoleState } | null>(null)
  const key = `${userId ?? ''}:${attempt}`

  useEffect(() => {
    const client = supabase
    if (!client || !userId) return
    const controller = new AbortController()
    fetchOwnRole(client, userId, controller.signal)
      .then(role => setResult({ key, value: { state: 'ready', role } }))
      .catch(() => { if (!controller.signal.aborted) setResult({ key, value: { state: 'error' } }) })
    return () => controller.abort()
  }, [key, userId])

  if (!supabase || !userId) return { state: 'ready', role: 'pending' }
  return result?.key === key ? result.value : { state: 'loading' }
}
