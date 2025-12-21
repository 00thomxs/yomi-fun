import { createClient } from "@/lib/supabase/server"
import { MarketDetailContainer } from "@/components/containers/market-detail-container"
import { notFound } from "next/navigation"
import { getMarketHistory } from "@/app/actions/history"
import { getUserMarketBets } from "@/app/actions/betting"
import { getMarketTopWinners } from "@/app/actions/market-stats"
import { Metadata } from "next"

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = {
  params: Promise<{ id: string }>
}

// Generate dynamic metadata for social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: market } = await supabase
    .from('markets')
    .select(`
      question,
      volume,
      outcomes:outcomes!market_id (name, probability)
    `)
    .eq('id', id)
    .single()

  if (!market) {
    return {
      title: 'Événement introuvable - YOMI.fun',
    }
  }

  // Find OUI probability for display
  const ouiOutcome = market.outcomes?.find((o: any) => o.name === 'OUI')
  const probability = ouiOutcome?.probability || 50

  const title = market.question
  const description = `${probability}% OUI • Volume: ${market.volume?.toLocaleString('fr-FR') || 0} Zeny • Parie maintenant sur YOMI.fun`
  
  const ogImageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://y0mi.fun'}/api/og/market/${id}`

  return {
    title: `${title} - YOMI.fun`,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'YOMI.fun',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function MarketPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: market, error } = await supabase
    .from('markets')
    .select(`
      *,
      outcomes:outcomes!market_id (*),
      season:seasons!season_id (id, name)
    `)
    .eq('id', id)
    .single()

  if (error || !market) {
    notFound()
  }

  const history = await getMarketHistory(id)
  const userBets = await getUserMarketBets(id)
  // Always fetch - the function handles the resolved check internally
  const topWinners = await getMarketTopWinners(id)

  return <MarketDetailContainer market={market} history={history} userBets={userBets} topWinners={topWinners} />
}
