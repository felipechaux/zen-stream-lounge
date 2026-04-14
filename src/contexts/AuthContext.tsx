'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { Database } from '@/types/supabase'

type UserRole = Database['public']['Tables']['profiles']['Row']['role']
type Profile  = Database['public']['Tables']['profiles']['Row']

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: Profile | null
  role: UserRole | null
  // loading is true during initial session check AND during sign-in/out operations
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, role?: UserRole, fullName?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`fetchProfile timed out after ${ms}ms`)), ms)
    ),
  ])
}

async function fetchProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await withTimeout(
      supabase.from('profiles').select('*').eq('id', userId).single(),
      5000
    )

    if (!error) return data

    // PGRST116 = no row — trigger may not have run yet, create it now
    if (error.code === 'PGRST116') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data: created } = await withTimeout(
        supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: user.email,
            full_name: user.user_metadata?.full_name ?? null,
            avatar_url: user.user_metadata?.avatar_url ?? null,
            role: user.user_metadata?.role ?? 'user',
          })
          .select('*')
          .single(),
        5000
      )
      return created ?? null
    }

    return null
  } catch (err) {
    console.error('[Auth] fetchProfile error:', err)
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  // loading covers: initial auth check + sign-in/out operations + profile fetching
  const [loading, setLoading] = useState(true)

  const [supabase] = useState(() => createClient())

  // Core state update function - single source of truth
  const updateAuthState = useCallback(async (newSession: Session | null) => {
    setSession(newSession)
    setUser(newSession?.user ?? null)

    if (newSession?.user) {
      const p = await fetchProfile(supabase, newSession.user.id)
      setProfile(p)
    } else {
      setProfile(null)
    }
  }, [supabase])

  useEffect(() => {
    // onAuthStateChange is the single source of truth for all auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] Event:', event, newSession?.user?.email ?? 'no user')

        // Set loading true at start of auth operation (except INITIAL_SESSION which is the first load)
        if (event !== 'INITIAL_SESSION') {
          setLoading(true)
        }

        try {
          await updateAuthState(newSession)
        } catch (err) {
          console.error('[Auth] updateAuthState error:', err)
        } finally {
          // Always unblock loading — even if profile fetch fails or throws
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, updateAuthState])

  // signIn only triggers the auth flow - onAuthStateChange handles state updates
  const signIn = async (email: string, password: string) => {
    // Don't set loading here - onAuthStateChange will set it when SIGNED_IN fires
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, role?: UserRole, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, full_name: fullName } },
    })
    // With auto-confirm enabled, this triggers SIGNED_IN and onAuthStateChange handles the rest
    return { error }
  }

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    // SIGNED_OUT event will trigger onAuthStateChange, but we proactively clear state
    await updateAuthState(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      role: profile?.role ?? null,
      signIn, signUp, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
