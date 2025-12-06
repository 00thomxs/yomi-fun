"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { deletePastSeason } from "./actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function DeleteSeasonButton({ id }: { id: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette archive de saison ?")) return

    setIsLoading(true)
    try {
      const result = await deletePastSeason(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Saison supprimée")
        router.refresh()
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isLoading}
      className="p-2 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-all cursor-pointer"
      title="Supprimer l'archive"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}

