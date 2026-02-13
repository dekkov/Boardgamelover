import React, { createContext, useContext } from 'react'
import { useAuth, AuthState } from '../hooks/useAuth'
import { User } from '@supabase/supabase-js'

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, username: string) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (updates: { username?: string; display_name?: string; avatar_url?: string }) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
