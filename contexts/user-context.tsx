"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { ActiveBet } from "@/lib/types"
import { placeBet as placeBetAction } from "@/app/actions/betting"

// --- CONFIGURATION ---
// Mettre à true si la connexion Supabase est bloquée (ex: sandbox Cursor)
const IS_MOCK_MODE = false 

// Types
type User = {
  id: string
  username: string
  email: string
  avatar: string
  role?: 'user' | 'admin'
} | null

type Profile = {
  id: string
  username: string
  avatar_url: string | null
  balance: number
  xp: number
  level: number
  streak: number
  total_bets: number
  total_won: number
  win_rate: number
  role?: 'user' | 'admin'
}

type UserContextType = {
  // User state
  user: User
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Auth actions
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, username: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  
  // Balance
  userBalance: number
  setUserBalance: (balance: number) => void
  
  // Bets
  activeBets: ActiveBet[]
  placeBet: (marketId: string, choice: string, amount: number, odds?: number) => Promise<boolean>
  clearBets: () => void
}

// Context
const UserContext = createContext<UserContextType | undefined>(undefined)

// Provider
export function UserProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const supabase = createClient()
  
  // Auth state
  const [user, setUser] = useState<User>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // App state
  const [userBalance, setUserBalance] = useState(10000) // Default starting balance
  const [activeBets, setActiveBets] = useState<ActiveBet[]>([])

  const isAuthenticated = user !== null

  // Fetch active bets
  const fetchActiveBets = useCallback(async (userId: string) => {
    if (IS_MOCK_MODE) return

    const { data: bets, error } = await supabase
      .from('bets')
      .select(`
        id,
        amount,
        odds_at_bet,
        outcome_id,
        status,
        potential_payout,
        markets (
          question
        ),
        outcomes (
          name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching bets:', error)
      return
    }

    if (bets) {
      const formattedBets: ActiveBet[] = bets.map((bet: any) => ({
        id: bet.id,
        market: bet.markets?.question || "Marché inconnu",
        choice: bet.outcomes?.name || "Choix inconnu",
        amount: bet.amount,
        odds: bet.odds_at_bet || 1.0,
        status: bet.status || 'pending',
        potential_payout: bet.potential_payout
      }))
      setActiveBets(formattedBets)
    }
  }, [supabase])

  // Fetch user profile from Supabase
  const fetchProfile = useCallback(async (userId: string) => {
    if (IS_MOCK_MODE) {
      return {
        id: userId,
        username: "AdminTest",
        avatar_url: "/images/avatar.jpg",
        balance: 50000,
        xp: 1200,
        level: 5,
        streak: 10,
        total_bets: 25,
        total_won: 15000,
        win_rate: 65,
        role: 'admin' as const, // Force admin role in mock mode
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    // Fetch active bets in parallel
    fetchActiveBets(userId)

    return data as Profile
  }, [supabase, fetchActiveBets])

  // Convert Supabase user to app user
  const setUserFromSupabase = useCallback(async (supabaseUser: SupabaseUser | null) => {
    if (!supabaseUser) {
      setUser(null)
      setProfile(null)
      setUserBalance(10000)
      setActiveBets([])
      setIsLoading(false)
      return
    }

    // Fetch profile
    const userProfile = await fetchProfile(supabaseUser.id)
    
    if (userProfile) {
      setProfile(userProfile)
      setUserBalance(userProfile.balance)
      setUser({
        id: supabaseUser.id,
        username: userProfile.username,
        email: supabaseUser.email || '',
        avatar: userProfile.avatar_url || '/images/avatar.jpg',
        role: userProfile.role
      })
    } else {
      // Profile not yet created (new user)
      setUser({
        id: supabaseUser.id,
        username: supabaseUser.user_metadata?.username || `user_${supabaseUser.id.slice(0, 8)}`,
        email: supabaseUser.email || '',
        avatar: supabaseUser.user_metadata?.avatar_url || '/images/avatar.jpg',
      })
    }
    
    setIsLoading(false)
  }, [fetchProfile])

  // Listen for auth state changes
  useEffect(() => {
    if (IS_MOCK_MODE) {
      // Restore mock session from localStorage
      const storedUser = localStorage.getItem('mockUser')
      if (storedUser) {
        const mockUser = JSON.parse(storedUser)
        // Small delay to simulate loading
        setTimeout(() => setUserFromSupabase(mockUser), 100)
      } else {
        setIsLoading(false)
      }
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserFromSupabase(session?.user ?? null)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUserFromSupabase(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, setUserFromSupabase])

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    if (IS_MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500)) // Fake delay
      const mockUser = {
        id: "mock-user-id",
        email: email,
        user_metadata: { username: "AdminTest" }
      } as any
      setUserFromSupabase(mockUser)
      localStorage.setItem('mockUser', JSON.stringify(mockUser))
      
      toast({
        title: "Mode Simulation",
        description: "Connecté en tant qu'Admin (Mock)",
        duration: 3000,
      })
      return {}
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      })
      return { error: error.message }
    }

    toast({
      title: "Connexion réussie !",
      description: `Bienvenue !`,
      duration: 3000,
    })

    return {}
  }, [supabase.auth, toast, setUserFromSupabase])

  // Sign up with email/password
  const signUp = useCallback(async (email: string, password: string, username: string) => {
    if (IS_MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500)) // Fake delay
      const mockUser = {
        id: "mock-user-id",
        email: email,
        user_metadata: { username: username }
      } as any
      setUserFromSupabase(mockUser)
      localStorage.setItem('mockUser', JSON.stringify(mockUser))

      toast({
        title: "Mode Simulation",
        description: "Compte créé avec succès (Mock)",
        duration: 3000,
      })
      return {}
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (error) {
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive",
      })
      return { error: error.message }
    }

    toast({
      title: "Compte créé !",
      description: "Vérifie tes emails pour confirmer ton compte.",
      duration: 5000,
    })

    return {}
  }, [supabase.auth, toast, setUserFromSupabase])

  // Sign out
  const signOut = useCallback(async () => {
    if (!IS_MOCK_MODE) {
      await supabase.auth.signOut()
    } else {
      localStorage.removeItem('mockUser')
    }
    setUser(null)
    setProfile(null)
    setActiveBets([])
    
    toast({
      title: "Déconnexion",
      description: "À bientôt !",
      duration: 2000,
    })
  }, [supabase.auth, toast])

  // Place bet
  const placeBet = useCallback(async (marketId: string, choice: string, amount: number, odds?: number): Promise<boolean> => {
    if (IS_MOCK_MODE) {
      // Mock behavior
      if (userBalance < amount) {
        toast({
          title: "Pas assez de Zeny!",
          duration: 2000,
          variant: "destructive",
        })
        return false
      }
      setUserBalance((prev) => prev - amount)
      
      const newBet: ActiveBet = {
        id: `${Date.now()}`,
        market: marketId, // Mock uses marketId as name
        choice,
        amount,
        odds: odds || 1.5,
        status: 'pending'
      }
      setActiveBets((prev) => [...prev, newBet])
      toast({
        title: (
          <span>
            Pari placé: {choice} pour {amount} <CurrencySymbol />
          </span>
        ),
        description: "Simulation",
        duration: 3000,
      })
      return true
    }

    // REAL BETTING LOGIC via Server Action
    try {
      // Extract YES/NO from choice string "OUI" / "NON"
      const outcome = choice.includes("OUI") ? "YES" : "NO"
      
      const result = await placeBetAction(marketId, outcome, amount)
      
      if (result.error) {
        toast({
          title: "Erreur lors du pari",
          description: result.error,
          variant: "destructive",
        })
        return false
      }

      if (result.success && result.newBalance !== undefined) {
        setUserBalance(result.newBalance)
        toast({
          title: (
            <span>
              Pari placé: {choice} pour {amount} <CurrencySymbol />
            </span>
          ),
          description: "Transaction validée !",
          duration: 3000,
        })
        
        // Add to active bets for UI feedback (will be refreshed on page reload)
        // We can fetch the market question if needed, but for now let's use generic
        const newBet: ActiveBet = {
          id: `${Date.now()}`,
          market: "Pari en cours...", // Will be fetched on reload
          choice,
          amount,
          odds: odds || 1.0, // Odds are dynamic now
          status: 'pending'
        }
        setActiveBets((prev) => [...prev, newBet])
        // Re-fetch active bets to have full details
        if (user) fetchActiveBets(user.id)
        
        return true
      }
      
      return false
    } catch (error) {
      console.error("Bet error:", error)
      toast({
        title: "Erreur technique",
        description: "Une erreur est survenue lors du pari.",
        variant: "destructive",
      })
      return false
    }
  }, [userBalance, toast, user, fetchActiveBets])

  // Clear bets
  const clearBets = useCallback(() => {
    setActiveBets([])
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isLoading,
        signIn,
        signUp,
        signOut,
        userBalance,
        setUserBalance,
        activeBets,
        placeBet,
        clearBets,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

// Hook
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
