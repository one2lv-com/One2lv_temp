import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithSteam: () => Promise<void>
  signInWithDiscord: () => Promise<void>
  signInAsGuest: () => Promise<void>
  signOut: () => Promise<void>
  updateUser: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUser(session.user.id)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        await fetchUser(authUser.id)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUser = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setUser(data)
    }
  }

  const createGuestUser = async () => {
    const guestUser: User = {
      id: crypto.randomUUID(),
      username: `Guest_${Math.random().toString(36).substr(2, 9)}`,
      is_guest: true,
      created_at: new Date().toISOString()
    }

    await supabase.from('users').insert(guestUser)
    setUser(guestUser)
    return guestUser
  }

  const signInWithSteam = async () => {
    // Steam OAuth would be implemented here
    // For demo, create a guest user
    await createGuestUser()
  }

  const signInWithDiscord = async () => {
    // Discord OAuth would be implemented here
    // For demo, create a guest user
    await createGuestUser()
  }

  const signInAsGuest = async () => {
    await createGuestUser()
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const updateUser = async (data: Partial<User>) => {
    if (!user) return

    await supabase
      .from('users')
      .update(data)
      .eq('id', user.id)

    setUser(prev => prev ? { ...prev, ...data } : null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithSteam,
      signInWithDiscord,
      signInAsGuest,
      signOut,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Re-export supabase for convenience
import { supabase } from '../lib/supabase'
