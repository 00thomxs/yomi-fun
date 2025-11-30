"use client"

import { useState } from "react"
import { Trash2, AlertTriangle } from "lucide-react"
import { resetPlatform } from "@/app/admin/actions"
import { useToast } from "@/hooks/use-toast"

export function ResetPlatformButton() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleReset = async () => {
    console.log("Reset button clicked")
    setIsLoading(true)
    try {
      console.log("Calling resetPlatform action...")
      const result = await resetPlatform()
      console.log("Reset result:", result)
      
      if (result.success) {
        toast({
          title: "Plateforme réinitialisée",
          description: "Toutes les données ont été effacées et les profils remis à zéro.",
          variant: "default",
        })
        setShowConfirm(false)
        // Force reload to clear client cache
        window.location.href = "/"
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Une erreur est survenue",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Reset error:", error)
      toast({
        title: "Erreur critique",
        description: error.message || "Impossible de contacter le serveur",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-rose-500/50 rounded-xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="flex items-center gap-3 text-rose-500 mb-4">
            <AlertTriangle className="w-8 h-8" />
            <h3 className="text-xl font-bold uppercase tracking-tight">Zone de Danger</h3>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Êtes-vous sûr de vouloir <span className="text-white font-bold">TOUT effacer</span> ?
            <br /><br />
            Cette action va :
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Supprimer tous les marchés et paris</li>
              <li>Supprimer toutes les transactions</li>
              <li>Remettre tous les soldes à 10,000 Zeny</li>
              <li>Réinitialiser l'XP et les niveaux de tous les joueurs</li>
            </ul>
            <br />
            <span className="text-rose-400 font-bold uppercase text-sm">Cette action est irréversible.</span>
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isLoading}
              className="flex-1 py-3 rounded-lg bg-white/5 border border-border hover:bg-white/10 font-semibold transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="flex-1 py-3 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Tout Effacer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg font-bold text-sm hover:bg-rose-500/20 transition-all flex items-center gap-2"
    >
      <Trash2 className="w-4 h-4" />
      Reset Platform
    </button>
  )
}

