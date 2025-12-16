'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Edit, ExternalLink, Gavel, EyeOff, Filter } from 'lucide-react'
import { VisibilityToggle } from './visibility-toggle'
import { DeleteMarket } from './delete-button'
import { CloseMarket } from './close-button'

type Market = {
  id: string
  question: string
  category: string
  volume: number
  status: string
  closes_at: string
  is_visible: boolean
  is_live: boolean
  created_at: string
}

type StatusFilter = 'all' | 'live' | 'pending' | 'resolved'

// Helper to group markets by month
function groupMarketsByMonth(markets: Market[]) {
  const grouped: Record<string, { monthLabel: string; markets: Market[] }> = {}
  
  markets.forEach(market => {
    const date = new Date(market.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = { monthLabel, markets: [] }
    }
    grouped[monthKey].markets.push(market)
  })
  
  return Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, data]) => ({
      monthKey: key,
      monthLabel: data.monthLabel,
      markets: data.markets
    }))
}

export function AdminEventsTable({ markets }: { markets: Market[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  
  const filteredMarkets = useMemo(() => {
    if (statusFilter === 'all') return markets
    if (statusFilter === 'live') return markets.filter(m => m.status === 'open')
    if (statusFilter === 'pending') return markets.filter(m => m.status === 'closed')
    if (statusFilter === 'resolved') return markets.filter(m => m.status === 'resolved')
    return markets
  }, [markets, statusFilter])
  
  const groupedMarkets = useMemo(() => groupMarketsByMonth(filteredMarkets), [filteredMarkets])
  
  const hiddenCount = markets.filter(m => m.is_visible === false).length
  const counts = {
    all: markets.length,
    live: markets.filter(m => m.status === 'open').length,
    pending: markets.filter(m => m.status === 'closed').length,
    resolved: markets.filter(m => m.status === 'resolved').length,
  }

  const filterButtons: { key: StatusFilter; label: string; color: string }[] = [
    { key: 'all', label: 'Tous', color: 'text-white' },
    { key: 'live', label: 'Live', color: 'text-emerald-400' },
    { key: 'pending', label: 'En attente', color: 'text-amber-500' },
    { key: 'resolved', label: 'Terminé', color: 'text-muted-foreground' },
  ]

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Tous les Events</h2>
          <p className="text-xs text-muted-foreground">
            {filteredMarkets.length} event{filteredMarkets.length > 1 ? 's' : ''}
            {statusFilter !== 'all' && ` (filtrés sur ${counts.all})`}
            {hiddenCount > 0 && (
              <span className="ml-2 text-amber-500">
                ({hiddenCount} caché{hiddenCount > 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        
        {/* Filter buttons */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-border">
          <Filter className="w-3.5 h-3.5 text-muted-foreground ml-2" />
          {filterButtons.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                statusFilter === key 
                  ? `${color} bg-white/10` 
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
              <span className="ml-1 opacity-60">({counts[key]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grouped Events */}
      {groupedMarkets.map(({ monthKey, monthLabel, markets: monthMarkets }) => (
        <div key={monthKey} className="rounded-xl bg-card border border-border overflow-hidden">
          {/* Month Header */}
          <div className="px-4 py-2 bg-white/5 border-b border-border">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              {monthLabel}
              <span className="ml-2 font-normal">({monthMarkets.length})</span>
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/5 text-muted-foreground font-medium uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2 w-6"></th>
                  <th className="px-3 py-2">Question</th>
                  <th className="px-3 py-2">Catégorie</th>
                  <th className="px-3 py-2">Volume</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Fin</th>
                  <th className="px-3 py-2 text-right">Actions</th>
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
                    <td className="px-2 py-2">
                      {market.is_visible === false && (
                        <span title="Event caché">
                          <EyeOff className="w-3 h-3 text-muted-foreground" />
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium max-w-xs truncate">
                      {market.question}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10">
                        {market.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {market.volume}
                    </td>
                    <td className="px-3 py-2">
                      {market.status === 'open' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold uppercase">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          Live
                        </span>
                      ) : market.status === 'closed' ? (
                        <span className="inline-flex items-center gap-1 text-amber-500 text-[10px] font-bold uppercase">
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          Attente
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[10px] font-bold uppercase">
                          Résolu
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-[10px]">
                      {new Date(market.closes_at).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        timeZone: 'Europe/Paris' 
                      })}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <VisibilityToggle 
                          marketId={market.id} 
                          isVisible={market.is_visible !== false} 
                        />
                        <Link 
                          href={`/market/${market.id}`}
                          className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-muted-foreground hover:text-foreground"
                          title="Voir"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/admin/edit/${market.id}`}
                          className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-amber-400 hover:text-amber-300"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <CloseMarket marketId={market.id} isLive={market.is_live} />
                        <Link
                          href={`/admin/resolve/${market.id}`}
                          className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-blue-400 hover:text-blue-300"
                          title="Résoudre"
                        >
                          <Gavel className="w-3.5 h-3.5" />
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

      {filteredMarkets.length === 0 && (
        <div className="rounded-xl bg-card border border-border p-6 text-center text-muted-foreground text-sm">
          {statusFilter === 'all' 
            ? "Aucun event trouvé. Créez-en un !"
            : `Aucun event "${filterButtons.find(f => f.key === statusFilter)?.label}" trouvé.`
          }
        </div>
      )}
    </div>
  )
}

