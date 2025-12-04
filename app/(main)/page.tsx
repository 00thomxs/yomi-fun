import { createClient } from "@/lib/supabase/server"
import { HomeContainer } from "@/components/containers/home-container"
import { getMarketsHistory } from "@/app/actions/history"

export default async function HomePage() {
  const supabase = await createClient()
  
  const { data: markets } = await supabase
    .from('markets')
    .select(`
      *,
      outcomes:outcomes!market_id (*)
    `)
    .order('created_at', { ascending: false })

  // Load history for all binary markets
  const binaryMarketIds = (markets || [])
    .filter(m => m.type === 'binary')
    .map(m => m.id)
  
  const historyMap = await getMarketsHistory(binaryMarketIds)
  
  // Convert Map to serializable object for client
  const historyData: Record<string, any[]> = {}
  historyMap.forEach((points, marketId) => {
    historyData[marketId] = points
  })

  return <HomeContainer initialMarkets={markets || []} marketsHistory={historyData} />
}
