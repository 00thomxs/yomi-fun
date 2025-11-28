import { createClient } from "@/lib/supabase/server"

export default async function DebugMarketsPage() {
  const supabase = await createClient()
  
  const { data: markets, error } = await supabase
    .from('markets')
    .select(`
      *,
      outcomes (*)
    `)

  return (
    <div className="p-8 bg-black text-white min-h-screen font-mono text-xs">
      <h1 className="text-2xl font-bold mb-4">Debug Markets</h1>
      
      {error && (
        <div className="bg-red-900/50 p-4 border border-red-500 rounded mb-4">
          <h2 className="font-bold text-red-200">Erreur Supabase</h2>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">Résumé</h2>
        <p>Nombre de marchés trouvés : {markets?.length ?? 0}</p>
      </div>

      <div className="space-y-8">
        {markets?.map(market => (
          <div key={market.id} className="border border-gray-700 p-4 rounded">
            <h3 className="text-lg font-bold text-green-400">{market.question}</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <h4 className="font-bold text-gray-500 mb-1">Champs DB</h4>
                <ul className="space-y-1">
                  <li>id: {market.id}</li>
                  <li>status: {market.status}</li>
                  <li>is_live: {String(market.is_live)} <span className="text-gray-500">(Attendu: true)</span></li>
                  <li>is_featured: {String(market.is_featured)}</li>
                  <li>is_headline: {String(market.is_headline)}</li>
                  <li>type: {market.type}</li>
                  <li>closes_at: {market.closes_at}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-500 mb-1">Outcomes ({market.outcomes?.length})</h4>
                <pre className="bg-gray-900 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(market.outcomes, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

