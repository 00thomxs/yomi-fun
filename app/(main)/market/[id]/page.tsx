import { createClient } from "@/lib/supabase/server"
import { MarketDetailContainer } from "@/components/containers/market-detail-container"
import { notFound } from "next/navigation"
import { getMarketHistory } from "@/app/actions/history"

type Props = {
  params: Promise<{ id: string }>
}

export default async function MarketPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: market, error } = await supabase
    .from('markets')
    .select(`
      *,
      outcomes:outcomes!market_id (*)
    `)
    .eq('id', id)
    .single()

  if (error || !market) {
    notFound()
  }

  const history = await getMarketHistory(id)

  return <MarketDetailContainer market={market} history={history} />
}
