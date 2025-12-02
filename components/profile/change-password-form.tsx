"use client"

import { useState } from "react"
import { Lock, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" })
      return
    }

    if (password.length < 6) {
      toast({ title: "Erreur", description: "6 caractères minimum", variant: "destructive" })
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    setIsLoading(false)

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Succès", description: "Mot de passe mis à jour !" })
      onClose()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nouveau mot de passe</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-border rounded-lg pl-11 pr-4 py-3 outline-none focus:border-primary/50 transition-all"
            required
            minLength={6}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirmer</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white/5 border border-border rounded-lg pl-11 pr-4 py-3 outline-none focus:border-primary/50 transition-all"
            required
            minLength={6}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button 
          type="button" 
          onClick={onClose}
          className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 font-semibold transition-all"
        >
          Annuler
        </button>
        <button 
          type="submit" 
          disabled={isLoading}
          className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Confirmer
        </button>
      </div>
    </form>
  )
}
