import { createContext, useCallback, useContext } from 'react'
import { loadPreferences, recordVisit, savePreferences } from './personalization'

export type WorkspaceIdentity = { userId: string; role: string }

export const WorkspaceContext = createContext<WorkspaceIdentity | null>(null)

export const useWorkspaceIdentity = () => useContext(WorkspaceContext)

// Mengembalikan pencatat kunjungan layanan; tidak melakukan apa pun di luar ruang peran.
export function useTrackVisit() {
  const identity = useContext(WorkspaceContext)
  return useCallback((path: string) => {
    if (!identity) return
    savePreferences(identity.userId, identity.role, recordVisit(loadPreferences(identity.userId, identity.role), path))
  }, [identity])
}
