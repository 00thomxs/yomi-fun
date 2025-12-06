"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react"
import { YomiLogo } from "@/components/ui/yomi-logo"
import { useUser } from "@/contexts/user-context"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signUp, isAuthenticated, isLoading: authLoading } = useUser()
  
  const [isLogin, setIsLogin] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/")
    }
  }, [isAuthenticated, authLoading, router])

  // Don't show anything while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      if (isLogin) {
        const result = await signIn(email, password)
        if (result.error) {
          setError(result.error)
        } else {
          router.push("/")
        }
      } else {
        if (password.length < 6) {
          setError("Le mot de passe doit contenir au moins 6 caractères")
          setIsLoading(false)
          return
        }

        // Check username availability
        const supabase = createClient()
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .ilike('username', username)
        
        if (count && count > 0) {
          setError("Ce pseudo est déjà pris. Veuillez en choisir un autre.")
          setIsLoading(false)
          return
        }

        const result = await signUp(email, password, username)
        if (result.error) {
          setError(result.error)
        } else {
          setSuccess("Compte créé ! Vérifie tes emails pour confirmer.")
          setEmail("")
          setPassword("")
          setUsername("")
        }
      }
    } catch (err) {
      setError("Une erreur est survenue")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (!email) {
      setError("Entre ton adresse email")
      setIsLoading(false)
      return
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://yomi-fun.vercel.app')
    
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess("Email envoyé ! Vérifie ta boîte de réception pour réinitialiser ton mot de passe.")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground tactical-grid flex items-center justify-center p-4">
      {/* Noise Overlay */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none z-0 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <YomiLogo className="text-4xl justify-center" />
          </Link>
          <p className="text-muted-foreground mt-2 text-sm">
            {isLogin ? "Content de te revoir !" : "Rejoins la communauté"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-card border border-border p-8 space-y-6">
          {/* Toggle Login/Register - hide when in forgot password mode */}
          {!showForgotPassword && (
            <div className="flex rounded-lg bg-white/5 p-1">
              <button
                onClick={() => { setIsLogin(true); setError(null); setSuccess(null) }}
                className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(null); setSuccess(null) }}
                className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  !isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Inscription
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
              <span>✓</span>
              <span>{success}</span>
            </div>
          )}

          {/* Forgot Password Form */}
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Entre ton email et nous t'enverrons un lien pour réinitialiser ton mot de passe.
              </p>
              
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    className="w-full pl-11 pr-4 py-3 rounded-lg bg-white/5 border border-border focus:border-primary/50 outline-none text-sm transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  "Envoyer le lien"
                )}
              </button>

              <button
                type="button"
                onClick={() => { setShowForgotPassword(false); setError(null); setSuccess(null) }}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Retour à la connexion
              </button>
            </form>
          ) : (
            /* Login/Register Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Pseudo
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ton_pseudo"
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-border focus:border-primary/50 outline-none text-sm transition-all"
                      required={!isLogin}
                      minLength={3}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    className="w-full pl-11 pr-4 py-3 rounded-lg bg-white/5 border border-border focus:border-primary/50 outline-none text-sm transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 rounded-lg bg-white/5 border border-border focus:border-primary/50 outline-none text-sm transition-all"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="text-right">
                  <button 
                    type="button" 
                    onClick={() => { setShowForgotPassword(true); setError(null); setSuccess(null) }}
                    className="text-xs text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Se connecter" : "Créer mon compte"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider - hide when in forgot password mode */}
          {!showForgotPassword && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground">ou</span>
              </div>
            </div>
          )}

          {/* Terms - hide when in forgot password mode */}
          {!isLogin && !showForgotPassword && (
            <p className="text-xs text-center text-muted-foreground">
              En créant un compte, tu acceptes nos{" "}
              <button className="text-primary hover:underline">CGU</button> et notre{" "}
              <button className="text-primary hover:underline">Politique de confidentialité</button>
            </p>
          )}
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
