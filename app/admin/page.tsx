import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { Edit, ExternalLink, PlayCircle, Gavel, EyeOff, Coins, Flame } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { DeleteMarket } from "@/app/admin/components/delete-button"
import { CloseMarket } from "@/app/admin/components/close-button"
import { VisibilityToggle } from "@/app/admin/components/visibility-toggle"
import { getAdminMonetaryMetrics } from "@/app/admin/actions"
import { getAdminMonetarySnapshots } from "@/app/admin/actions"
import { MonetaryChart } from "@/components/admin/monetary-chart"

// Helper to group markets by month
function groupMarketsByMonth(markets: any[]) {
  const grouped: Record<string, any[]> = {}
  
  markets.forEach(market => {
    const date = new Date(market.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = []
    }
    grouped[monthKey].push({ ...market, monthLabel })
  })
  
  // Sort by date descending
  return Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => ({
      monthKey: key,
      monthLabel: items[0].monthLabel,
      markets: items
    }))
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { metrics, error: monetaryError } = await getAdminMonetaryMetrics()
  const { snapshots, error: snapshotsError } = await getAdminMonetarySnapshots(30)
  
  // Fetch real markets
  const { data: markets, error } = await supabase
    .from('markets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching markets:", error)
  }

  // Fetch real stats
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Calculate total volume from all markets
  const totalVolume = markets?.reduce((sum, m) => sum + (m.volume || 0), 0) || 0

  // Estimate revenue (fallback): 5% fee on volume (real fee revenue is shown below via burned fees)
  const estimatedRevenue = Math.round(totalVolume * 0.05)

  // Filter markets pending resolution
  const pendingResolutionMarkets = markets?.filter(m => m.status === 'closed' && !m.resolved_at) || []

  const stats = [
    { label: "Volume Total", value: totalVolume.toLocaleString('fr-FR'), suffix: <CurrencySymbol /> },
    { label: "Events Actifs", value: markets?.filter(m => m.status === 'open').length.toString() || "0", suffix: "" },
    { label: "Utilisateurs", value: (userCount || 0).toString(), suffix: "" },
    { label: "Revenus (Est.)", value: estimatedRevenue.toLocaleString('fr-FR'), suffix: <CurrencySymbol /> },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de la plateforme YOMI.fun
          </p>
        </div>
        <Link
          href="/admin/create"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <PlayCircle className="w-4 h-4" />
          Créer un Event
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {stat.label}
            </p>
            <p className="text-2xl font-bold mt-2 flex items-center gap-1">
              {stat.value} {stat.suffix}
            </p>
          </div>
        ))}
      </div>

      {/* Monetary Health */}
      {(metrics || monetaryError) && (
        <div className="rounded-xl bg-card border border-border p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-bold flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              Masse Monétaire (Zeny)
            </h2>
            <p className="text-xs text-muted-foreground">
              Snapshot hebdo basé sur historiques (si pas assez de snapshots, l’inflation affichera “—”)
            </p>
          </div>

          {metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Circulating Supply</p>
                <p className="text-2xl font-black mt-2 font-mono flex items-center gap-1">
                  {metrics.total_supply.toLocaleString('fr-FR')} <CurrencySymbol />
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Somme des balances de tous les profils.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Zeny Burned</p>
                <p className="text-2xl font-black mt-2 font-mono flex items-center gap-1 text-amber-400">
                  {metrics.total_burned.toLocaleString('fr-FR')} <CurrencySymbol />
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Fees: {metrics.total_burned_fees.toLocaleString('fr-FR')} • Shop: {metrics.total_burned_shop.toLocaleString('fr-FR')}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Inflation Rate (7j)</p>
                <p className="text-2xl font-black mt-2 font-mono flex items-center gap-2">
                  <Flame className="w-5 h-5 text-primary" />
                  {metrics.weekly_inflation_rate_pct === null
                    ? "—"
                    : `${metrics.weekly_inflation_rate_pct >= 0 ? "+" : ""}${metrics.weekly_inflation_rate_pct.toFixed(2)}%`}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Basé sur la variation du supply vs snapshot d’il y a 7 jours.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <p className="text-sm font-bold text-rose-400">Impossible de charger les métriques monétaires</p>
              <p className="text-xs text-muted-foreground mt-1">
                {monetaryError}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Vérifie que ton compte a bien <span className="font-mono text-white/80">profiles.role = 'admin'</span> et que les migrations monétaires sont exécutées
                (<span className="font-mono">add_bet_fee_tracking</span>, <span className="font-mono">create_monetary_snapshots</span>, <span className="font-mono">create_get_monetary_totals_rpc</span>, <span className="font-mono">harden_get_monetary_totals_rpc</span>).
              </p>
            </div>
          )}

          {/* Graph */}
          {metrics ? (
            <>
              {snapshotsError ? (
                <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-muted-foreground">
                  Erreur snapshots: {snapshotsError}
                </div>
              ) : (
                <MonetaryChart points={snapshots || []} />
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Pending Resolution Alert */}
      {pendingResolutionMarkets.length > 0 && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 overflow-hidden">
          <div className="p-4 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 animate-pulse">
                <Gavel className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-amber-500">Action Requise</h2>
                <p className="text-xs text-amber-500/80">{pendingResolutionMarkets.length} event(s) en attente de résolution</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-amber-500/10">
            {pendingResolutionMarkets.map((market) => (
              <div key={market.id} className="p-4 flex items-center justify-between hover:bg-amber-500/5 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-amber-500/60">
                    {new Date(market.closes_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}
                  </span>
                  <span className="font-medium text-sm">{market.question}</span>
                </div>
                <Link
                  href={`/admin/resolve/${market.id}`}
                  className="px-4 py-2 bg-amber-500 text-black rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                >
                  Résoudre
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Markets Grouped by Month */}
      {(() => {
        const groupedMarkets = groupMarketsByMonth(markets || [])
        const hiddenCount = markets?.filter(m => m.is_visible === false).length || 0
        
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Tous les Events</h2>
                <p className="text-sm text-muted-foreground">
                  {markets?.length || 0} events au total
                  {hiddenCount > 0 && (
                    <span className="ml-2 text-amber-500">
                      ({hiddenCount} caché{hiddenCount > 1 ? 's' : ''})
                    </span>
                  )}
                </p>
          </div>
            </div>

            {/* Grouped Events */}
            {groupedMarkets.map(({ monthKey, monthLabel, markets: monthMarkets }) => (
              <div key={monthKey} className="rounded-xl bg-card border border-border overflow-hidden">
                {/* Month Header */}
                <div className="px-6 py-3 bg-white/5 border-b border-border">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                    {monthLabel}
                    <span className="ml-2 text-xs font-normal">({monthMarkets.length} events)</span>
                  </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-muted-foreground font-medium uppercase text-xs">
              <tr>
                        <th className="px-6 py-3 w-8"></th>
                <th className="px-6 py-3">Question</th>
                <th className="px-6 py-3">Catégorie</th>
                <th className="px-6 py-3">Volume</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Fin</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
                      {monthMarkets.map((market) => (
                        <tr 
                          key={market.id} 
                          className={`hover:bg-white/5 transition-colors ${
                            market.is_visible === false ? 'opacity-50' : ''
                          }`}
                        >
                          <td className="px-4 py-4">
                            {market.is_visible === false && (
                              <span title="Event caché">
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              </span>
                            )}
                          </td>
                  <td className="px-6 py-4 font-medium max-w-md truncate">
                    {market.question}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10">
                      {market.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {market.volume}
                  </td>
                  <td className="px-6 py-4">
                    {market.status === 'open' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    ) : market.status === 'closed' ? (
                      <span className="inline-flex items-center gap-1.5 text-amber-500 text-xs font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        En attente
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs font-bold uppercase">
                        {market.status === 'resolved' ? 'Résolu' : market.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(market.closes_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <VisibilityToggle 
                                marketId={market.id} 
                                isVisible={market.is_visible !== false} 
                              />
                      <Link 
                        href={`/market/${market.id}`}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        title="Voir"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                              <Link
                                href={`/admin/edit/${market.id}`}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-amber-400 hover:text-amber-300"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                      <CloseMarket marketId={market.id} isLive={market.is_live} />
                      <Link
                        href={`/admin/resolve/${market.id}`}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                        title="Résoudre"
                      >
                        <Gavel className="w-4 h-4" />
                      </Link>
                      <DeleteMarket marketId={market.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
            ))}

            {(!markets || markets.length === 0) && (
              <div className="rounded-xl bg-card border border-border p-8 text-center text-muted-foreground">
                Aucun marché trouvé. Créez-en un !
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
