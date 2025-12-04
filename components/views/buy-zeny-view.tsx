'use client'

import { useState } from 'react'
import { Check, Zap, Sparkles, Crown, Star } from 'lucide-react'
import { ZENY_PACKS } from '@/lib/constants'
import { CurrencySymbol } from '@/components/ui/currency-symbol'
import { useToast } from '@/hooks/use-toast'
import { createStripeCheckoutSession } from '@/app/actions/stripe'

export function BuyZenyView() {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleBuy = async (packId: string) => {
    setLoadingId(packId)
    try {
      const { url, error } = await createStripeCheckoutSession(packId)
      
      if (error) {
        toast({
          title: "Erreur",
          description: error,
          variant: "destructive"
        })
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion à Stripe.",
        variant: "destructive"
      })
    } finally {
      setLoadingId(null)
    }
  }

  const getIcon = (id: string) => {
    switch (id) {
      case 'pack_little_player': return <Star className="w-6 h-6" />
      case 'pack_degen': return <Zap className="w-6 h-6" />
      case 'pack_trader': return <Sparkles className="w-6 h-6" />
      case 'pack_whale': return <Crown className="w-6 h-6" />
      default: return <Star className="w-6 h-6" />
    }
  }

  const getGradient = (id: string) => {
    switch (id) {
      case 'pack_little_player': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
      case 'pack_degen': return 'from-amber-500/20 to-orange-500/20 border-amber-500/30' // Populaire
      case 'pack_trader': return 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
      case 'pack_whale': return 'from-yellow-400/20 to-amber-200/20 border-yellow-400/30'
      default: return 'from-slate-800 to-slate-900'
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
          Recharge tes Zeny
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Achète des Zeny pour parier sur tes sujets préférés et grimper dans le classement.
          Plus le pack est gros, plus le bonus est important !
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ZENY_PACKS.map((pack) => {
          const isPopular = pack.popular
          const gradient = getGradient(pack.id)
          
          return (
            <div 
              key={pack.id}
              className={`relative rounded-xl border p-6 flex flex-col bg-gradient-to-b ${gradient} transition-all hover:scale-105 hover:shadow-xl group`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                  Populaire
                </div>
              )}

              <div className="mb-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {getIcon(pack.id)}
                </div>
                <h3 className="font-bold text-lg">{pack.name}</h3>
                <div className="mt-2 flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-bold">{pack.price}€</span>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="p-4 rounded-lg bg-black/20 text-center border border-white/5">
                  <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                    {pack.amount.toLocaleString()} <CurrencySymbol />
                  </div>
                  {pack.bonus > 0 && (
                    <div className="text-xs font-semibold text-green-400 mt-1">
                      dont {pack.bonus.toLocaleString()} offerts
                    </div>
                  )}
                </div>

                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Paiement sécurisé</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Crédit instantané</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleBuy(pack.id)}
                disabled={!!loadingId}
                className={`mt-6 w-full py-3 rounded-lg font-bold transition-all relative overflow-hidden
                  ${isPopular 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                  }
                `}
              >
                {loadingId === pack.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Chargement...
                  </span>
                ) : (
                  "Acheter"
                )}
              </button>
            </div>
          )
        })}
      </div>
      
      <div className="text-center text-xs text-muted-foreground mt-8">
        Paiement sécurisé par Stripe. En achetant, vous acceptez nos conditions générales de vente.
        <br />
        Les Zeny sont une monnaie virtuelle utilisable uniquement sur YOMI.
      </div>
    </div>
  )
}

