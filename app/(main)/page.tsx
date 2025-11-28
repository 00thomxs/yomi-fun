import { createClient } from "@/lib/supabase/server"
import { HomeContainer } from "@/components/containers/home-container"

export default async function HomePage() {
  const supabase = await createClient()
  
  const { data: markets } = await supabase
    .from('markets')
    .select(`
      *,
      outcomes:outcomes!market_id (*)
    `)
    .order('created_at', { ascending: false })

  return <HomeContainer initialMarkets={markets || []} />
}
