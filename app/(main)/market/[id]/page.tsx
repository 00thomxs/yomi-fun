"use client"

import { useRouter, useParams } from "next/navigation"
import { MarketDetailView } from "@/components/views/market-detail-view"
import { useUser } from "@/contexts/user-context"
import { MARKETS_DATA } from "@/lib/mock-data"

export default function MarketPage() {
  const router = useRouter()
  const params = useParams()
  const { placeBet, userBalance } = useUser()
  
  const marketId = params.id as string
  const market = MARKETS_DATA.find((m) => m.id === marketId)

  const handleBack = () => {
    router.back()
  }

  const handleBet = (marketQuestion: string, choice: string, amount: number, odds?: number) => {
    placeBet(marketQuestion, choice, amount, odds)
  }

  if (!market) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-2xl font-bold">Marché non trouvé</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold"
        >
          Retour à l'accueil
        </button>
      </div>
    )
  }

  return (
    <MarketDetailView
      market={market}
      onBack={handleBack}
      onBet={handleBet}
      userBalance={userBalance}
    />
  )
}
