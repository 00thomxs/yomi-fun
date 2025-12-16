import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { PlayCircle, Gavel, Coins, Flame } from "lucide-react"
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

      {/* Markets Table with Filters */}
      <AdminEventsTable markets={markets || []} />
    </div>
  )
}
