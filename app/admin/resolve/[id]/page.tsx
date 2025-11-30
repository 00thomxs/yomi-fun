import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResolveForm from './resolve-form' // Updated import

export default async function ResolvePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
    
  // Check Admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: market, error } = await supabase
    .from('markets')
    .select(`
      *,
      outcomes:outcomes!market_id (
        id,
        name,
        probability
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    return (
      <div className="p-8 bg-red-900/20 text-red-200 border border-red-500 rounded">
        <h2 className="text-xl font-bold">Erreur Supabase</h2>
        <pre className="mt-4 p-4 bg-black/50 rounded overflow-auto">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    )
  }

  if (!market) return <div className="p-8">Marché introuvable</div>

  return (
    <div className="container max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Résolution du Marché</h1>
      
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 mb-8">
        <h2 className="text-xl font-semibold mb-2">{market.question}</h2>
        <p className="text-gray-400 mb-4">ID: {market.id}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <span className="block text-sm text-gray-400">Volume</span>
            <span className="text-xl font-mono">{market.volume} Zeny</span>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
             <span className="block text-sm text-gray-400">Status actuel</span>
             <span className={`text-xl font-bold ${market.isLive ? 'text-green-500' : 'text-red-500'}`}>
                {market.isLive ? 'EN COURS' : 'TERMINÉ'}
             </span>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-4">Définir les résultats</h3>
      <p className="text-yellow-500 mb-6 text-sm bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
        ⚠️ Définissez le résultat (Vrai ou Faux) pour chaque proposition. Cela calculera les gains pour tous les paris (OUI et NON).
      </p>

      <ResolveForm 
        marketId={market.id} 
        outcomes={market.outcomes} 
      />
    </div>
  )
}

