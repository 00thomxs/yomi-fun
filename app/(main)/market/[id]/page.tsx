import { createClient } from "@/lib/supabase/server"
import { MarketDetailContainer } from "@/components/containers/market-detail-container"
import { notFound } from "next/navigation"

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
      outcomes (*)
    `)
    .eq('id', id)
    .single()

  if (error || !market) {
    notFound()
  }

  return <MarketDetailContainer market={market} />
}
