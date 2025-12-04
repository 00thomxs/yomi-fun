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

  const getTheme = (id: string) => {
    switch (id) {
      case 'pack_little_player': return { 
        bg: 'bg-card',
        border: 'border-border',
        iconBg: 'bg-white/5',
        iconColor: 'text-muted-foreground',
        accent: 'text-white',
        popular: false
      }
      case 'pack_degen': return { 
        bg: 'bg-gradient-to-b from-primary/10 to-card',
        border: 'border-primary/50',
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
        accent: 'text-primary',
        popular: true
      }
      case 'pack_trader': return { 
        bg: 'bg-card',
        border: 'border-purple-500/30',
        iconBg: 'bg-purple-500/10',
        iconColor: 'text-purple-400',
        accent: 'text-purple-400',
        popular: false
      }
      case 'pack_whale': return { 
        bg: 'bg-card',
        border: 'border-amber-400/30',
        iconBg: 'bg-amber-400/10',
        iconColor: 'text-amber-400',
        accent: 'text-amber-400',
        popular: false
      }
      default: return { bg: 'bg-card', border: 'border-border', iconBg: 'bg-white/5', iconColor: 'text-white', accent: 'text-white', popular: false }
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground uppercase tracking-tight">
          Recharge tes <span className="text-primary">Zeny</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Achète des Zeny pour parier sur tes sujets préférés et grimper dans le classement.
          Plus le pack est gros, plus le bonus est important !
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ZENY_PACKS.map((pack) => {
          const theme = getTheme(pack.id)
          
          return (
            <div 
              key={pack.id}
              className={`relative rounded-xl border ${theme.border} ${theme.bg} p-6 flex flex-col h-full transition-all hover:scale-[1.02] hover:shadow-xl group`}
            >
              {theme.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/20">
                  Populaire
                </div>
              )}

              {/* Header Section - Fixed Height to align Amounts */}
              <div className="mb-6 text-center flex flex-col items-center justify-between min-h-[140px]">
                <div className={`w-12 h-12 rounded-full ${theme.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <div className={theme.iconColor}>{getIcon(pack.id)}</div>
                </div>
                <div className="flex-1 flex flex-col justify-end w-full space-y-2">
                  <h3 className="font-bold text-lg tracking-tight uppercase">{pack.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-foreground">{pack.price}€</span>
                  </div>
                </div>
              </div>

              {/* Amount Section */}
              <div className="mb-6">
                <div className="p-4 rounded-lg bg-black/40 text-center border border-white/5 h-[85px] flex flex-col items-center justify-center">
                  <div className={`text-2xl font-bold ${theme.accent} flex items-center justify-center gap-1`}>
                    {pack.amount.toLocaleString()} <CurrencySymbol />
                  </div>
                  {pack.bonus > 0 ? (
                    <div className="text-xs font-bold text-emerald-400 mt-1 uppercase tracking-wide">
                      +{pack.bonus.toLocaleString()} offerts
                    </div>
                  ) : (
                    <div className="text-xs font-medium text-muted-foreground/50 mt-1">
                      Pas de bonus
                    </div>
                  )}
                </div>
              </div>

              {/* Features List - Flex 1 to push button down */}
              <div className="flex-1">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <div className="p-1 rounded-full bg-green-500/10">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span>Paiement sécurisé</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="p-1 rounded-full bg-green-500/10">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span>Crédit instantané</span>
                  </li>
                  {theme.popular && (
                    <li className="flex items-center gap-3">
                      <div className="p-1 rounded-full bg-primary/10">
                        <Star className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-primary font-medium">Meilleure offre</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Button - Always at bottom */}
              <button
                onClick={() => handleBuy(pack.id)}
                disabled={!!loadingId}
                className={`mt-8 w-full py-3 rounded-lg font-bold uppercase tracking-wide text-sm transition-all relative overflow-hidden
                  ${theme.popular
                    ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20' 
                    : 'bg-white/5 hover:bg-white/10 text-foreground border border-white/5 hover:border-white/10'
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

