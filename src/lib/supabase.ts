import { createClient } from '@supabase/supabase-js'
import { getPublicSupabaseConfig } from './config.ts'

const env: Record<string, string | undefined> = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env as Record<string, string | undefined> : {}
const config = getPublicSupabaseConfig(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_PUBLISHABLE_KEY'])
export const supabase = config ? createClient(config.url, config.key) : null
export const isSupabaseConfigured = Boolean(supabase)
