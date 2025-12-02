"use client"

import { useState } from "react"
import { Loader2, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function ChangePasswordForm({ onCancel }: { onCancel: () => void }) {
  const { toast } = useToast()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      })
      return
    }
    if (password.length < 6) {
       toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Succès",
        description: "Votre mot de passe a été mis à jour",
      })
      onCancel()
    }
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Nouveau mot de passe</label>
        <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-primary transition-colors"
            placeholder="******"
            required
            />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Confirmer</label>
         <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-primary transition-colors"
            placeholder="******"
            required
            />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-lg bg-white/5 text-muted-foreground font-bold hover:bg-white/10 transition-all"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Modifier"}
        </button>
      </div>
    </form>
  )
}


