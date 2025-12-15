'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toggleMarketVisibility } from '@/app/admin/actions'
import { toast } from 'sonner'

type VisibilityToggleProps = {
  marketId: string
  isVisible: boolean
}

export function VisibilityToggle({ marketId, isVisible: initialVisible }: VisibilityToggleProps) {
  const [isVisible, setIsVisible] = useState(initialVisible)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    const result = await toggleMarketVisibility(marketId)
    
    if (result.success) {
      setIsVisible(result.isVisible ?? !isVisible)
      toast.success(result.isVisible ? "Event visible" : "Event caché")
    } else {
      toast.error(result.error || "Erreur")
    }
    
    setIsLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`p-2 rounded-lg transition-colors ${
        isVisible 
          ? 'hover:bg-white/10 text-emerald-400 hover:text-emerald-300' 
          : 'hover:bg-white/10 text-muted-foreground hover:text-white'
      }`}
      title={isVisible ? "Cacher l'event" : "Afficher l'event"}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isVisible ? (
        <Eye className="w-4 h-4" />
      ) : (
        <EyeOff className="w-4 h-4" />
      )}
    </button>
  )
}

