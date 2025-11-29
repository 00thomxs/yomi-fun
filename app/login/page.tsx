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

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      setError(error.message)
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

          {/* Social Login - hide when in forgot password mode */}
          {!showForgotPassword && (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-white/5 border border-border hover:border-white/20 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuer avec Google
            </button>
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
