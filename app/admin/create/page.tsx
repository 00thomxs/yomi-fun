"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Image as ImageIcon, Type, List, Plus, X } from "lucide-react"

import { createMarket } from "@/app/admin/actions"
import { useToast } from "@/hooks/use-toast"

export default function CreateMarketPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [outcomes, setOutcomes] = useState([{ name: "OUI", color: "#10b981" }, { name: "NON", color: "#f43f5e" }])
  
  const addOutcome = () => {
    setOutcomes([...outcomes, { name: "", color: "#3b82f6" }])
  }

  const removeOutcome = (index: number) => {
    setOutcomes(outcomes.filter((_, i) => i !== index))
  }

  const updateOutcome = (index: number, field: 'name' | 'color', value: string) => {
    const newOutcomes = [...outcomes]
    newOutcomes[index] = { ...newOutcomes[index], [field]: value }
    setOutcomes(newOutcomes)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    formData.append('outcomes', JSON.stringify(outcomes))
    
    const result = await createMarket(formData)
    
    if (result.error) {
      toast({
        title: "Erreur",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Succès",
        description: result.message,
        variant: "default"
      })
      router.push("/admin")
    }
    
    setIsLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nouveau Marché</h1>
        <p className="text-muted-foreground mt-1">
          Créez un événement de prédiction
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="space-y-4 p-6 rounded-xl bg-card border border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Type className="w-4 h-4 text-primary" />
            Informations Générales
          </h2>
          
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Question</label>
            <input 
              type="text"
              placeholder="Ex: Squeezie va-t-il gagner le GP Explorer ?"
              className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 outline-none focus:border-primary/50 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Catégorie</label>
              <select className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 outline-none focus:border-primary/50 transition-all">
                <option>YouTube</option>
                <option>Twitch</option>
                <option>Musique</option>
                <option>Sport</option>
                <option>Cinéma</option>
                <option>Politique</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date de fin</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="datetime-local"
                  className="w-full bg-white/5 border border-border rounded-lg pl-11 pr-4 py-3 outline-none focus:border-primary/50 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Image URL</label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="url"
                placeholder="https://..."
                className="w-full bg-white/5 border border-border rounded-lg pl-11 pr-4 py-3 outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Outcomes */}
        <div className="space-y-4 p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <List className="w-4 h-4 text-primary" />
              Réponses Possibles
            </h2>
            <button 
              type="button"
              onClick={addOutcome}
              className="text-xs font-bold text-primary hover:underline uppercase"
            >
              + Ajouter
            </button>
          </div>

          <div className="space-y-3">
            {outcomes.map((outcome, idx) => (
              <div key={idx} className="flex gap-3">
                <input 
                  type="color"
                  value={outcome.color}
                  onChange={(e) => updateOutcome(idx, 'color', e.target.value)}
                  className="w-12 h-12 rounded-lg bg-transparent border-0 p-0 cursor-pointer"
                />
                <input 
                  type="text"
                  value={outcome.name}
                  onChange={(e) => updateOutcome(idx, 'name', e.target.value)}
                  placeholder={`Réponse ${idx + 1}`}
                  className="flex-1 bg-white/5 border border-border rounded-lg px-4 outline-none focus:border-primary/50 transition-all"
                  required
                />
                {outcomes.length > 2 && (
                  <button 
                    type="button"
                    onClick={() => removeOutcome(idx)}
                    className="p-3 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button 
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg font-medium hover:bg-white/5 transition-all"
          >
            Annuler
          </button>
          <button 
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Créer le Marché
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

