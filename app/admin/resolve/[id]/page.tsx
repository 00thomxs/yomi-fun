import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ResolveButton from './resolve-button'

export default async function ResolvePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
    
  // Check Admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: market } = await supabase
    .from('markets')
    .select(`
      *,
      outcomes (
        id,
        name,
        probability
      )
    `)
    .eq('id', params.id)
    .single()

  if (!market) notFound()

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

      <h3 className="text-lg font-semibold mb-4">Choisir le résultat gagnant</h3>
      <p className="text-yellow-500 mb-6 text-sm bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
        ⚠️ Attention : Cette action est irréversible. Tous les gains seront immédiatement versés aux gagnants.
      </p>

      <div className="grid gap-4">
        {market.outcomes?.map((outcome: any) => (
          <div key={outcome.id} className="flex items-center justify-between bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div>
              <span className="text-xl font-bold">{outcome.name}</span>
              <span className="ml-4 text-sm text-gray-400">Probabilité finale : {Math.round(outcome.probability)}%</span>
            </div>
            <ResolveButton 
              marketId={market.id} 
              outcomeId={outcome.id} 
              outcomeName={outcome.name} 
            />
          </div>
        ))}
      </div>
    </div>
  )
}

