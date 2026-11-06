import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { PlayCircle, Gavel, Coins, Flame, TrendingUp, TrendingDown, Users, Activity, Wallet, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getAdminMonetaryMetrics } from "@/app/admin/actions"
import { getAdminMonetarySnapshots } from "@/app/admin/actions"
import { MonetaryChart } from "@/components/admin/monetary-chart"
import { AdminEventsTable } from "@/app/admin/components/events-table"

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

  // Calculate additional stats
  const activeEvents = markets?.filter(m => m.status === 'open').length || 0
  const closedEvents = markets?.filter(m => m.status === 'closed').length || 0
  const resolvedEvents = markets?.filter(m => m.resolved_at).length || 0
  const avgVolumePerEvent = activeEvents > 0 ? Math.round(totalVolume / (activeEvents + resolvedEvents)) : 0

  const stats = [
    { label: "Volume Total", value: totalVolume.toLocaleString('fr-FR'), suffix: <CurrencySymbol />, sub: `Moy: ${avgVolumePerEvent.toLocaleString('fr-FR')}/event` },
    { label: "Events", value: activeEvents.toString(), suffix:" actifs", sub: `${closedEvents} fermés • ${resolvedEvents} résolus` },
    { label: "Utilisateurs", value: (userCount || 0).toString(), suffix: "", sub: metrics ? `Moy: ${metrics.avg_balance.toLocaleString('fr-FR')} Z/joueur` : '' },
    { label: "Revenus (Est.)", value: estimatedRevenue.toLocaleString('fr-FR'), suffix: <CurrencySymbol />, sub: `Fees: ${metrics?.total_burned_fees.toLocaleString('fr-FR') || 0} Z` },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de la plateforme YOMI.fun
          </p>
        </div>
        <Link
          href="/admin/create"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <PlayCircle className="w-4 h-4" />
          Créer un event
        </Link>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="p-4 rounded-lg bg-card border border-border">
            <p className="text-xs text-muted-foreground font-medium">
              {stat.label}
            </p>
            <p className="font-display text-xl font-bold mt-1 flex items-center gap-1 tabular">
              {stat.value}{stat.suffix}
            </p>
            {stat.sub && (
              <p className="text-[11px] text-muted-foreground mt-1 truncate">{stat.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Monetary Health */}
      {(metrics || monetaryError) && (
        <div className="rounded-lg bg-card border border-border p-5 space-y-4">
          {/* Header with Health Signal */}
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Coins className="w-5 h-5 text-brand" />
              Masse monétaire (Zeny)
            </h2>
            {metrics && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                metrics.health_signal === 'healthy' ? 'bg-yes/10 text-yes border border-yes/20' :
                metrics.health_signal === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {metrics.health_signal === 'healthy' ? <CheckCircle className="w-3.5 h-3.5" /> :
                 metrics.health_signal === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                 <XCircle className="w-3.5 h-3.5" />}
                <span>{metrics.health_message}</span>
                <span className="opacity-60">({metrics.health_score}/100)</span>
              </div>
            )}
          </div>

          {metrics ? (
            <>
              {/* Main Stats - 4 columns compact */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-lg bg-white/5 border border-border">
                  <p className="text-xs text-muted-foreground font-medium">Supply joueurs</p>
                  <p className="text-lg font-semibold mt-1 font-mono flex items-center gap-1">
                  {metrics.total_supply.toLocaleString('fr-FR')} <CurrencySymbol />
                </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {metrics.player_count} joueurs • Moy: {metrics.avg_balance.toLocaleString('fr-FR')}
                </p>
              </div>

                <div className="p-4 rounded-lg bg-white/5 border border-border">
                  <p className="text-xs text-muted-foreground font-medium">Total burned</p>
                  <p className="text-lg font-semibold mt-1 font-mono flex items-center gap-1 text-amber-400">
                  {metrics.total_burned.toLocaleString('fr-FR')} <CurrencySymbol />
                </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                  Fees: {metrics.total_burned_fees.toLocaleString('fr-FR')} • Shop: {metrics.total_burned_shop.toLocaleString('fr-FR')}
                </p>
              </div>

                <div className="p-4 rounded-lg bg-white/5 border border-border">
                  <p className="text-xs text-muted-foreground font-medium">Inflation (7j)</p>
                  <p className={`text-lg font-black mt-1 font-mono flex items-center gap-1.5 ${
                    metrics.weekly_inflation_rate_pct === null ? '' :
                    metrics.weekly_inflation_rate_pct > 10 ? 'text-red-400' :
                    metrics.weekly_inflation_rate_pct > 5 ? 'text-amber-400' :
                    metrics.weekly_inflation_rate_pct >= 0 ? 'text-yes' : 'text-blue-400'
                  }`}>
                    {metrics.weekly_inflation_rate_pct === null ? (
                      <>—</>
                    ) : metrics.weekly_inflation_rate_pct >= 0 ? (
                      <><TrendingUp className="w-4 h-4" />+{metrics.weekly_inflation_rate_pct.toFixed(1)}%</>
                    ) : (
                      <><TrendingDown className="w-4 h-4" />{metrics.weekly_inflation_rate_pct.toFixed(1)}%</>
                    )}
                </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {metrics.supply_7d_ago ? `7j avant: ${metrics.supply_7d_ago.toLocaleString('fr-FR')}` : 'Pas assez de données'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-border">
                  <p className="text-xs text-muted-foreground font-medium">Réserve admin</p>
                  <p className="text-lg font-semibold mt-1 font-mono flex items-center gap-1 text-muted-foreground">
                    {metrics.admin_balance.toLocaleString('fr-FR')} <CurrencySymbol />
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Non compté dans la supply
                  </p>
                </div>
              </div>

              {/* Burn Rate Indicator */}
              {metrics.total_supply > 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/5 border border-border">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Burn rate</span>
                      <span className="font-mono font-medium">
                        {((metrics.total_burned / (metrics.total_supply + metrics.total_burned)) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (metrics.total_burned / (metrics.total_supply + metrics.total_burned)) * 100 * 5)}%` }}
                      />
                    </div>
              </div>
            </div>
              )}
            </>
          ) : (
            <div className="p-4 rounded-lg bg-no/10 border border-no/20">
              <p className="text-sm font-semibold text-no">Impossible de charger les métriques monétaires</p>
              <p className="text-xs text-muted-foreground mt-1">{monetaryError}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Vérifie que les migrations sont exécutées (fix_monetary_totals_exclude_admin).
              </p>
            </div>
          )}

          {/* Graph */}
          {metrics ? (
            <>
              {snapshotsError ? (
                <div className="p-4 rounded-lg bg-no/10 border border-no/20 text-xs text-muted-foreground">
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
        <div className="rounded-lg bg-card border border-amber-500/40 overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gavel className="w-4 h-4 text-amber-400" aria-hidden />
              <div>
                <h2 className="text-base font-semibold">Action requise</h2>
                <p className="text-xs text-muted-foreground">{pendingResolutionMarkets.length} event(s) en attente de résolution</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {pendingResolutionMarkets.map((market) => (
              <div key={market.id} className="px-4 py-3 flex items-center justify-between hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-muted-foreground">
                    {new Date(market.closes_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}
                  </span>
                  <span className="font-medium text-sm">{market.question}</span>
                </div>
                <Link
                  href={`/admin/resolve/${market.id}`}
                  className="h-9 px-4 inline-flex items-center rounded-md bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
                >
                  Résoudre
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Markets Table with Filters */}
      <AdminEventsTable markets={markets || []} />
    </div>
  )
}
