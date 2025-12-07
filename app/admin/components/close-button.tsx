"use client"

import { useState } from "react"
import { PauseCircle, Loader2 } from "lucide-react"
import { closeMarketManually } from "@/app/admin/actions"
import { useRouter } from "next/navigation"

export function CloseMarket({ marketId, isLive }: { marketId: string; isLive: boolean }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Only show for live markets
  if (!isLive) return null

  const handleClose = async () => {
    if (!confirm("Bloquer cet event ? Il passera en 'En attente' de résolution.")) return

    setIsLoading(true)
    const result = await closeMarketManually(marketId)
    
    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <button
      onClick={handleClose}
      disabled={isLoading}
      className="p-2 hover:bg-amber-500/20 rounded-lg transition-colors text-amber-500 hover:text-amber-400 cursor-pointer disabled:opacity-50"
      title="Bloquer l'event"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <PauseCircle className="w-4 h-4" />
      )}
    </button>
  )
}

