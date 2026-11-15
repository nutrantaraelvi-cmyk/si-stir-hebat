import { createDemoAuth, isDemoAllowed } from './demo-auth-core'
import { supabase } from './supabase'

export type { DemoAccount, DemoRole } from './demo-auth-core'
export { DEMO_ACCOUNTS } from './demo-auth-core'

const developmentMode = typeof import.meta.env !== 'undefined' && import.meta.env.DEV === true
const demoEnabled = isDemoAllowed(developmentMode, Boolean(supabase))
const storage = typeof window === 'undefined' ? undefined : window.localStorage
const demoAuth = createDemoAuth(demoEnabled, storage)

export function isDemoModeEnabled() {
  return demoEnabled
}

export const {
  getDemoProfiles,
  getDemoProfile,
  getDemoProfileByEmail,
  signInDemo,
  getDemoSession,
  clearDemoSession,
  updateDemoProfile,
  updateDemoPassword,
  getDemoAnnouncements,
} = demoAuth
