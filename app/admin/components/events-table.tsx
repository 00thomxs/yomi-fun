'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Edit, ExternalLink, Gavel, EyeOff, Eye, Search, Trophy, X, ChevronDown, BarChart3, Tag, Layers } from 'lucide-react'
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
  season_id?: string | null
}

type StatusFilter = 'all' | 'live' | 'pending' | 'resolved'
type VisibilityFilter = 'all' | 'visible' | 'hidden'
type VolumeFilter = 'all' | 'high' | 'medium' | 'low' | 'zero'
type SeasonFilter = 'all' | 'season' | 'no-season'

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
  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all')
  const [volumeFilter, setVolumeFilter] = useState<VolumeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(markets.map(m => m.category))
    return Array.from(cats).sort()
  }, [markets])

  // Apply all filters
  const filteredMarkets = useMemo(() => {
    return markets.filter(m => {
      // Search query
      if (searchQuery && !m.question.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Status
      if (statusFilter === 'live' && m.status !== 'open') return false
      if (statusFilter === 'pending' && m.status !== 'closed') return false
      if (statusFilter === 'resolved' && m.status !== 'resolved') return false
      // Visibility
      if (visibilityFilter === 'visible' && m.is_visible === false) return false
      if (visibilityFilter === 'hidden' && m.is_visible !== false) return false
      // Volume
      if (volumeFilter === 'high' && m.volume < 10000) return false
      if (volumeFilter === 'medium' && (m.volume < 1000 || m.volume >= 10000)) return false
      if (volumeFilter === 'low' && (m.volume <= 0 || m.volume >= 1000)) return false
      if (volumeFilter === 'zero' && m.volume !== 0) return false
      // Category
      if (categoryFilter !== 'all' && m.category !== categoryFilter) return false
      // Season
      if (seasonFilter === 'season' && !m.season_id) return false
      if (seasonFilter === 'no-season' && m.season_id) return false
      
      return true
    })
  }, [markets, searchQuery, statusFilter, visibilityFilter, volumeFilter, categoryFilter, seasonFilter])
  
  const groupedMarkets = useMemo(() => groupMarketsByMonth(filteredMarkets), [filteredMarkets])
  
  // Counts for status filter
  const counts = {
    all: markets.length,
    live: markets.filter(m => m.status === 'open').length,
    pending: markets.filter(m => m.status === 'closed').length,
    resolved: markets.filter(m => m.status === 'resolved').length,
  }

  // Check if any filter is active (besides 'all')
  const hasActiveFilters = statusFilter !== 'all' || visibilityFilter !== 'all' || 
    volumeFilter !== 'all' || categoryFilter !== 'all' || seasonFilter !== 'all' || searchQuery !== ''

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setVisibilityFilter('all')
    setVolumeFilter('all')
    setCategoryFilter('all')
    setSeasonFilter('all')
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold">Tous les Events</h2>
          <p className="text-xs text-muted-foreground">
            {filteredMarkets.length} event{filteredMarkets.length > 1 ? 's' : ''}
            {hasActiveFilters && ` (sur ${counts.all})`}
          </p>
        </div>
        
        {/* Status filter (always visible) */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-border">
          {[
            { key: 'all' as StatusFilter, label: 'Tous', color: 'text-white' },
            { key: 'live' as StatusFilter, label: 'Live', color: 'text-emerald-400' },
            { key: 'pending' as StatusFilter, label: 'Attente', color: 'text-amber-500' },
            { key: 'resolved' as StatusFilter, label: 'Terminé', color: 'text-muted-foreground' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
                statusFilter === key 
                  ? `${color} bg-white/10` 
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
              <span className="ml-1 opacity-50">{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search + Advanced filters toggle */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white/5 border border-border focus:border-primary/50 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Toggle advanced filters */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-white/5 border-border text-muted-foreground hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Filtres
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-[10px]">
              {[statusFilter !== 'all', visibilityFilter !== 'all', volumeFilter !== 'all', categoryFilter !== 'all', seasonFilter !== 'all', searchQuery !== ''].filter(Boolean).length}
            </span>
          )}
          <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Reset filters */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="p-3 rounded-xl bg-white/5 border border-border space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Visibility filter */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                <Eye className="w-3 h-3" /> Visibilité
              </label>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as VisibilityFilter)}
                className="w-full px-2 py-1.5 text-xs rounded-lg bg-background border border-border focus:border-primary/50 focus:outline-none"
              >
                <option value="all">Tous</option>
                <option value="visible">Visible</option>
                <option value="hidden">Caché</option>
              </select>
            </div>

            {/* Volume filter */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                <BarChart3 className="w-3 h-3" /> Volume
              </label>
              <select
                value={volumeFilter}
                onChange={(e) => setVolumeFilter(e.target.value as VolumeFilter)}
                className="w-full px-2 py-1.5 text-xs rounded-lg bg-background border border-border focus:border-primary/50 focus:outline-none"
              >
                <option value="all">Tous</option>
                <option value="high">Élevé (&gt;10K)</option>
                <option value="medium">Moyen (1K-10K)</option>
                <option value="low">Faible (&lt;1K)</option>
                <option value="zero">Aucun (0)</option>
              </select>
            </div>

            {/* Category filter */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                <Tag className="w-3 h-3" /> Catégorie
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded-lg bg-background border border-border focus:border-primary/50 focus:outline-none"
              >
                <option value="all">Toutes</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Season filter */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                <Trophy className="w-3 h-3" /> Saison
              </label>
              <select
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value as SeasonFilter)}
                className="w-full px-2 py-1.5 text-xs rounded-lg bg-background border border-border focus:border-primary/50 focus:outline-none"
              >
                <option value="all">Tous</option>
                <option value="season">En saison</option>
                <option value="no-season">Hors saison</option>
              </select>
            </div>
          </div>
        </div>
      )}

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
                  <th className="px-2 py-2 w-6"></th>
                  <th className="px-2 py-2">Question</th>
                  <th className="px-2 py-2">Cat.</th>
                  <th className="px-2 py-2">Vol.</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Fin</th>
                  <th className="px-2 py-2 text-right">Actions</th>
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
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-0.5">
                        {market.is_visible === false && (
                          <span title="Event caché">
                            <EyeOff className="w-3 h-3 text-muted-foreground" />
                          </span>
                        )}
                        {market.season_id && (
                          <span title="Event de saison">
                            <Trophy className="w-3 h-3 text-amber-400" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 font-medium max-w-[200px] truncate" title={market.question}>
                      {market.question}
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10">
                        {market.category}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[10px]">
                      {market.volume >= 1000 
                        ? `${(market.volume / 1000).toFixed(market.volume >= 10000 ? 0 : 1)}K`
                        : market.volume
                      }
                    </td>
                    <td className="px-2 py-1.5">
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
                    <td className="px-2 py-1.5 text-muted-foreground text-[10px]">
                      {new Date(market.closes_at).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        timeZone: 'Europe/Paris' 
                      })}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <VisibilityToggle 
                          marketId={market.id} 
                          isVisible={market.is_visible !== false} 
                        />
                        <Link 
                          href={`/market/${market.id}`}
                          className="p-1 hover:bg-white/10 rounded transition-colors text-muted-foreground hover:text-foreground"
                          title="Voir"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/admin/edit/${market.id}`}
                          className="p-1 hover:bg-white/10 rounded transition-colors text-amber-400 hover:text-amber-300"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <CloseMarket marketId={market.id} isLive={market.is_live} />
                        <Link
                          href={`/admin/resolve/${market.id}`}
                          className="p-1 hover:bg-white/10 rounded transition-colors text-blue-400 hover:text-blue-300"
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
          {hasActiveFilters 
            ? "Aucun event ne correspond à ces filtres."
            : "Aucun event trouvé. Créez-en un !"
          }
        </div>
      )}
    </div>
  )
}
