import { useState, useEffect, useCallback, useRef } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AuthState {
  user: User | null
  loading: boolean
  profile: { username: string; display_name: string | null; avatar_url: string | null } | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthState['profile']>(null)
  const [loading, setLoading] = useState(true)
  const lastFetchedUserId = useRef<string | null>(null)

  const fetchProfile = useCallback(async (userId: string) => {
    console.log('🔍 fetchProfile: Starting fetch for user:', userId)

    let timeoutId: NodeJS.Timeout | null = null

    try {
      console.log('🔍 fetchProfile: Creating query...')

      // Add timeout wrapper - 5 second timeout
      const fetchPromise = supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('id', userId)
        .single()

      console.log('🔍 fetchProfile: Query created, executing with 5s timeout...')

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          console.error('⏱️ TIMEOUT: Profile fetch took longer than 5 seconds')
          reject(new Error('Profile fetch timeout after 5s'))
        }, 5000)
      })

      const result = await Promise.race([fetchPromise, timeoutPromise])

      // Clear timeout if fetch succeeded first
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      const { data, error } = result as any

      console.log('📥 fetchProfile: Response received!')
      console.log('   Data:', data)
      console.log('   Error:', error)

      if (error) {
        // PGRST116 means "0 rows" - profile doesn't exist yet (happens during signup)
        if (error.code === 'PGRST116') {
          console.warn('⚠️ fetchProfile: Profile not found yet (0 rows), will retry...')
          setProfile(null)
          return null // Don't throw, let retry logic handle it
        }
        console.error('❌ fetchProfile: Supabase error:', error)
        throw error
      }

      if (!data) {
        console.warn('⚠️ fetchProfile: No profile data returned for user:', userId)
        setProfile(null)
        return null
      }

      console.log('✅ fetchProfile: SUCCESS! Profile:', data)
      setProfile(data)
      console.log('🎯 Profile state updated, triggering re-render')
      lastFetchedUserId.current = userId
      return data
    } catch (err: any) {
      // Clear timeout on error too
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      console.error('💥 fetchProfile: Exception caught:', err)
      console.error('   Message:', err.message)
      console.error('   Code:', err.code)
      console.error('   Details:', err.details)
      setProfile(null)
      return null
    }
  }, [])

  useEffect(() => {
    console.log('useAuth: Initializing, checking for existing session...')
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('useAuth: Error getting session:', error)
      }
      const currentUser = session?.user ?? null
      console.log('useAuth: Session check complete, user:', currentUser?.id || 'none')
      setUser(currentUser)
      if (currentUser) {
        console.log('useAuth: Fetching profile for user:', currentUser.id)
        fetchProfile(currentUser.id).catch(err => {
          console.error('useAuth: Failed to fetch profile on init:', err)
        })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('useAuth: Auth state changed, event:', _event, 'user:', session?.user?.id || 'none')
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          // Only fetch if we haven't already fetched for this user (prevents redundant fetches)
          if (lastFetchedUserId.current !== currentUser.id) {
            console.log('useAuth: Fetching profile after auth change')
            await fetchProfile(currentUser.id).catch(err => {
              console.error('useAuth: Failed to fetch profile on auth change:', err)
            })
          } else {
            console.log('useAuth: Profile already loaded for this user, skipping fetch')
          }
        } else {
          console.log('useAuth: No user, clearing profile')
          setProfile(null)
          lastFetchedUserId.current = null
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    console.log('Starting signup for:', email, username)

    // Step 1: Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: undefined // Disable email confirmation for testing
      }
    })
    if (error) {
      console.error('Auth signup error:', error)
      throw error
    }
    if (!data.user) throw new Error('No user returned from signup')

    console.log('Auth user created:', data.user.id)

    // Step 2: Manually create profile with retry
    let profileCreated = false
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`Attempting to create profile (attempt ${attempt + 1})`)
        const { data: insertData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username,
            display_name: username,
          })
          .select()
          .single()

        if (profileError) {
          // If profile already exists (duplicate key), that's fine
          if (profileError.code === '23505' || profileError.message.includes('duplicate')) {
            console.log('Profile already exists (duplicate key)')
            profileCreated = true
            break
          }
          console.error('Profile creation error:', profileError)
          if (attempt === 2) throw profileError // Throw on last attempt
        } else {
          console.log('Profile created successfully:', insertData)
          profileCreated = true
          break
        }
      } catch (err: any) {
        console.error(`Profile creation attempt ${attempt + 1} failed:`, err)
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)))
        } else {
          throw new Error(`Failed to create profile after 3 attempts: ${err.message}`)
        }
      }
    }

    if (!profileCreated) {
      throw new Error('Failed to create profile')
    }

    // Step 3: Fetch the profile with retry to confirm it exists
    let profile = null
    for (let attempt = 0; attempt < 5; attempt++) {
      // Start with 500ms delay, then increase: 500, 700, 900, 1100, 1300ms
      await new Promise(resolve => setTimeout(resolve, 500 + (200 * attempt)))
      console.log(`Fetching profile (attempt ${attempt + 1})`)
      profile = await fetchProfile(data.user.id)
      if (profile) {
        console.log('Profile fetched successfully')
        break
      }
    }

    if (!profile) {
      console.warn('Profile not fetched after signup, but continuing...')
    }

    return data
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }, [])

  const updateProfile = useCallback(async (updates: { username?: string; display_name?: string; avatar_url?: string }) => {
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error

    // Refresh profile state so header updates immediately
    await fetchProfile(user.id)
  }, [user, fetchProfile])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    await fetchProfile(user.id)
  }, [user, fetchProfile])

  return { user, profile, loading, signUp, signIn, signOut, updateProfile, refreshProfile }
}
