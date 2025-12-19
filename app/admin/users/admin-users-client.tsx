"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Users, TrendingUp, Activity, UserPlus, Ban, DollarSign, 
  Search, Filter, ChevronDown, ChevronUp, Eye, Edit2, 
  ShieldOff, X, Check, Loader2, RefreshCw, Trophy, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Zap
} from "lucide-react"
import { toast } from "sonner"
import {
  type PlatformStats,
  type TopPlayer,
  type AdminUser,
  type UserSearchFilters,
  searchUsers,
  getTopPlayersByPnl,
  banUser,
  unbanUser,
  updateUserData,
  getUserBets
} from "@/app/actions/admin-users"

// ============================================
// STAT CARD COMPONENT
// ============================================
function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  subtitle,
  color = "cyan"
}: { 
  label: string
  value: string | number
  icon: React.ElementType
  trend?: { value: number; positive: boolean }
  subtitle?: string
  color?: "cyan" | "green" | "amber" | "red" | "purple"
}) {
  const colorClasses = {
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  }
  
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{label}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        {trend && (
          <span className={`text-xs flex items-center gap-0.5 ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.value}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-zinc-500 mt-2">{subtitle}</p>}
    </div>
  )
}

// ============================================
// TOP PLAYERS TABLE (Enhanced)
// ============================================
function TopPlayersTable({ 
  players, 
  timeframe, 
  onTimeframeChange,
  loading 
}: { 
  players: TopPlayer[]
  timeframe: string
  onTimeframeChange: (tf: string) => void
  loading: boolean
}) {
  const timeframes = [
    { id: 'day', label: '24h' },
    { id: 'week', label: '7j' },
    { id: 'month', label: '30j' },
    { id: 'all', label: 'All-time' },
  ]
  
  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'text-amber-400'
    if (rank === 2) return 'text-zinc-300'
    if (rank === 3) return 'text-amber-600'
    return 'text-zinc-500'
  }
  
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Top 10 PNL</h3>
              <p className="text-xs text-zinc-500">Meilleurs performers</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-lg">
          {timeframes.map(tf => (
            <button
              key={tf.id}
              onClick={() => onTimeframeChange(tf.id)}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                timeframe === tf.id
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-xs border-b border-zinc-800">
                <th className="text-left py-3 px-4 font-medium w-12">#</th>
                <th className="text-left py-3 px-4 font-medium">Joueur</th>
                <th className="text-right py-3 px-4 font-medium">PNL</th>
                <th className="text-right py-3 px-4 font-medium hidden sm:table-cell">Balance</th>
                <th className="text-right py-3 px-4 font-medium hidden md:table-cell">WR</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, i) => (
                <tr key={player.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className={`py-3 px-4 font-bold ${getMedalColor(i + 1)}`}>
                    {i + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <img 
                        src={player.avatar_url || '/placeholder-avatar.png'} 
                        alt="" 
                        className="w-7 h-7 rounded-full ring-2 ring-zinc-700"
                      />
                      <span className={`font-medium truncate max-w-[120px] ${player.is_banned ? 'text-red-400 line-through' : 'text-white'}`}>
                        {player.username}
                      </span>
                      {player.is_banned && <Ban className="w-3 h-3 text-red-400 shrink-0" />}
                    </div>
                  </td>
                  <td className={`py-3 px-4 text-right font-mono font-medium ${
                    player.total_won >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {player.total_won >= 0 ? '+' : ''}{player.total_won.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-zinc-400 hidden sm:table-cell">
                    {player.balance.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-400 hidden md:table-cell">
                    {player.win_rate}%
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    Aucun joueur trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ============================================
// USER SEARCH & TABLE
// ============================================
function UserSearchTable({
  initialUsers,
  initialTotal,
  onSelectUser
}: {
  initialUsers: AdminUser[]
  initialTotal: number
  onSelectUser: (user: AdminUser) => void
}) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<UserSearchFilters>({
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 20,
    offset: 0
  })
  
  const doSearch = useCallback(async (newFilters: UserSearchFilters) => {
    setLoading(true)
    const result = await searchUsers(newFilters)
    setUsers(result.users)
    setTotal(result.total)
    setLoading(false)
  }, [])
  
  const handleSearch = () => {
    const newFilters = { ...filters, query, offset: 0 }
    setFilters(newFilters)
    doSearch(newFilters)
  }
  
  const handleSort = (column: UserSearchFilters['sortBy']) => {
    const newOrder: 'asc' | 'desc' = filters.sortBy === column && filters.sortOrder === 'desc' ? 'asc' : 'desc'
    const newFilters: UserSearchFilters = { ...filters, query, sortBy: column, sortOrder: newOrder, offset: 0 }
    setFilters(newFilters)
    doSearch(newFilters)
  }
  
  const handleFilterChange = (key: keyof UserSearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value === '' ? undefined : value, offset: 0 }
    setFilters(newFilters)
  }
  
  const applyFilters = () => {
    doSearch({ ...filters, query, offset: 0 })
  }
  
  const clearFilters = () => {
    const newFilters: UserSearchFilters = {
      sortBy: 'created_at',
      sortOrder: 'desc',
      limit: 20,
      offset: 0
    }
    setFilters(newFilters)
    setQuery("")
    doSearch(newFilters)
  }
  
  const SortIcon = ({ column }: { column: UserSearchFilters['sortBy'] }) => {
    if (filters.sortBy !== column) return null
    return filters.sortOrder === 'desc' 
      ? <ChevronDown className="w-3 h-3" />
      : <ChevronUp className="w-3 h-3" />
  }
  
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Search className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Recherche Utilisateurs</h3>
              <p className="text-xs text-zinc-500">{total} joueur{total !== 1 ? 's' : ''} au total</p>
            </div>
          </div>
          <button 
            onClick={() => doSearch(filters)} 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualiser
          </button>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Rechercher par username..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-500/20"
          >
            Rechercher
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              showFilters ? 'bg-cyan-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>
        
        {/* Expandable Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-zinc-800">
            <div>
              <label className="text-xs text-zinc-500 block mb-1.5">PNL Min</label>
              <input
                type="number"
                value={filters.minPnl || ''}
                onChange={(e) => handleFilterChange('minPnl', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1.5">PNL Max</label>
              <input
                type="number"
                value={filters.maxPnl || ''}
                onChange={(e) => handleFilterChange('maxPnl', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="∞"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1.5">Balance Min</label>
              <input
                type="number"
                value={filters.minBalance || ''}
                onChange={(e) => handleFilterChange('minBalance', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1.5">Statut</label>
              <select
                value={filters.isBanned === undefined ? '' : filters.isBanned ? 'banned' : 'active'}
                onChange={(e) => handleFilterChange('isBanned', e.target.value === '' ? undefined : e.target.value === 'banned')}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:border-cyan-500"
              >
                <option value="">Tous</option>
                <option value="active">Actifs</option>
                <option value="banned">Bannis</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={applyFilters}
                className="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium"
              >
                Appliquer
              </button>
              <button
                onClick={clearFilters}
                className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-xs border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left py-3 px-4 font-medium whitespace-nowrap">Joueur</th>
                <th 
                  className="text-right py-3 px-4 font-medium cursor-pointer hover:text-white whitespace-nowrap hidden sm:table-cell"
                  onClick={() => handleSort('balance')}
                >
                  <span className="flex items-center justify-end gap-1">
                    Balance <SortIcon column="balance" />
                  </span>
                </th>
                <th 
                  className="text-right py-3 px-4 font-medium cursor-pointer hover:text-white whitespace-nowrap"
                  onClick={() => handleSort('total_won')}
                >
                  <span className="flex items-center justify-end gap-1">
                    PNL <SortIcon column="total_won" />
                  </span>
                </th>
                <th 
                  className="text-right py-3 px-4 font-medium cursor-pointer hover:text-white whitespace-nowrap hidden md:table-cell"
                  onClick={() => handleSort('total_bets')}
                >
                  <span className="flex items-center justify-end gap-1">
                    Paris <SortIcon column="total_bets" />
                  </span>
                </th>
                <th className="text-center py-3 px-4 font-medium whitespace-nowrap">Statut</th>
                <th 
                  className="text-right py-3 px-4 font-medium cursor-pointer hover:text-white whitespace-nowrap hidden lg:table-cell"
                  onClick={() => handleSort('created_at')}
                >
                  <span className="flex items-center justify-end gap-1">
                    Inscrit <SortIcon column="created_at" />
                  </span>
                </th>
                <th className="text-center py-3 px-4 font-medium whitespace-nowrap w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatar_url || '/placeholder-avatar.png'} 
                        alt="" 
                        className="w-9 h-9 rounded-full ring-2 ring-zinc-700"
                      />
                      <div>
                        <span className={`font-medium block ${user.is_banned ? 'text-red-400 line-through' : 'text-white'}`}>
                          {user.username}
                        </span>
                        <span className="text-xs text-zinc-500">Lvl {user.level}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-zinc-300 hidden sm:table-cell">
                    {user.balance.toLocaleString()}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono font-medium ${
                    user.total_won >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {user.total_won >= 0 ? '+' : ''}{user.total_won.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-400 hidden md:table-cell">
                    {user.total_bets}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {user.is_banned ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-medium">
                        <Ban className="w-3 h-3" /> Banni
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium">
                        <Zap className="w-3 h-3" /> Actif
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-500 text-xs hidden lg:table-cell">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => onSelectUser(user)}
                        className="p-2 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-lg transition-colors group"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-zinc-600" />
                      <span>Aucun utilisateur trouvé</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ============================================
// USER DETAIL MODAL
// ============================================
function UserDetailModal({
  user,
  onClose,
  onUpdate
}: {
  user: AdminUser
  onClose: () => void
  onUpdate: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [banMode, setBanMode] = useState(false)
  const [editData, setEditData] = useState({
    username: user.username,
    balance: user.balance
  })
  const [banReason, setBanReason] = useState("")
  const [bets, setBets] = useState<any[]>([])
  const [loadingBets, setLoadingBets] = useState(true)
  
  useEffect(() => {
    getUserBets(user.id, 10).then(data => {
      setBets(data)
      setLoadingBets(false)
    })
  }, [user.id])
  
  const handleBan = async () => {
    if (!banReason.trim()) {
      toast.error("Veuillez indiquer une raison")
      return
    }
    setLoading(true)
    const result = await banUser(user.id, banReason)
    setLoading(false)
    if (result.success) {
      toast.success("Utilisateur banni")
      onUpdate()
      onClose()
    } else {
      toast.error(result.error)
    }
  }
  
  const handleUnban = async () => {
    setLoading(true)
    const result = await unbanUser(user.id)
    setLoading(false)
    if (result.success) {
      toast.success("Utilisateur débanni")
      onUpdate()
      onClose()
    } else {
      toast.error(result.error)
    }
  }
  
  const handleSave = async () => {
    setLoading(true)
    const result = await updateUserData(user.id, {
      username: editData.username !== user.username ? editData.username : undefined,
      balance: editData.balance !== user.balance ? editData.balance : undefined
    })
    setLoading(false)
    if (result.success) {
      toast.success("Modifications enregistrées")
      onUpdate()
      setEditMode(false)
    } else {
      toast.error(result.error)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
          <div className="flex items-center gap-4">
            <img 
              src={user.avatar_url || '/placeholder-avatar.png'} 
              alt="" 
              className="w-14 h-14 rounded-full ring-4 ring-zinc-700"
            />
            <div>
              <h2 className="font-bold text-xl">{user.username}</h2>
              <p className="text-xs text-zinc-500 font-mono">ID: {user.id.slice(0, 12)}...</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Status Banner */}
          {user.is_banned && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold">Utilisateur banni</p>
                <p className="text-sm text-zinc-400 mt-1">
                  {user.ban_reason || 'Aucune raison spécifiée'}
                </p>
                {user.banned_at && (
                  <p className="text-xs text-zinc-500 mt-2">
                    Banni le {new Date(user.banned_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">Balance</p>
              <p className="text-xl font-bold font-mono">{user.balance.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">PNL Total</p>
              <p className={`text-xl font-bold font-mono ${user.total_won >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {user.total_won >= 0 ? '+' : ''}{user.total_won.toLocaleString()}
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">Win Rate</p>
              <p className="text-xl font-bold">{user.win_rate}%</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">Paris Total</p>
              <p className="text-xl font-bold">{user.total_bets}</p>
            </div>
          </div>
          
          {/* Edit Section */}
          {editMode ? (
            <div className="bg-zinc-800/50 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                Modifier les données
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 block mb-2">Username</label>
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => setEditData(d => ({ ...d, username: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-2">Balance</label>
                  <input
                    type="number"
                    value={editData.balance}
                    onChange={(e) => setEditData(d => ({ ...d, balance: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm focus:border-cyan-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Enregistrer
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : banMode ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-red-400">
                <Ban className="w-4 h-4" />
                Bannir cet utilisateur
              </h3>
              <p className="text-xs text-zinc-400">
                L&apos;utilisateur ne pourra plus se connecter et sera exclu de tous les classements.
              </p>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Raison du bannissement (obligatoire)..."
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-sm resize-none h-24 focus:border-red-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleBan}
                  disabled={loading}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  Confirmer le ban
                </button>
                <button
                  onClick={() => setBanMode(false)}
                  className="px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setEditMode(true)}
                className="flex-1 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
              {user.is_banned ? (
                <button
                  onClick={handleUnban}
                  disabled={loading}
                  className="flex-1 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldOff className="w-4 h-4" /> Débannir</>}
                </button>
              ) : (
                <button
                  onClick={() => setBanMode(true)}
                  className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Ban className="w-4 h-4" />
                  Bannir
                </button>
              )}
            </div>
          )}
          
          {/* Recent Bets */}
          <div className="border-t border-zinc-800 pt-5">
            <h3 className="font-semibold text-sm mb-4">Derniers paris</h3>
            {loadingBets ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
              </div>
            ) : bets.length > 0 ? (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {bets.map(bet => (
                  <div key={bet.id} className="bg-zinc-800/50 rounded-lg p-3 flex items-center justify-between text-sm">
                    <div className="truncate flex-1 mr-3">
                      <p className="text-zinc-300 truncate font-medium">{bet.markets?.question || 'Event'}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{new Date(bet.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-medium">{bet.amount.toLocaleString()}</p>
                      <span className={`text-xs font-medium ${
                        bet.status === 'won' ? 'text-emerald-400' :
                        bet.status === 'lost' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {bet.status === 'won' ? '✓ Gagné' : bet.status === 'lost' ? '✗ Perdu' : '⏳ En cours'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm text-center py-8">Aucun pari récent</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN CLIENT COMPONENT
// ============================================
export function AdminUsersClient({
  initialStats,
  initialTopPlayers,
  initialUsers,
  initialTotal
}: {
  initialStats: PlatformStats | null
  initialTopPlayers: TopPlayer[]
  initialUsers: AdminUser[]
  initialTotal: number
}) {
  const [stats] = useState(initialStats)
  const [topPlayers, setTopPlayers] = useState(initialTopPlayers)
  const [topPlayersTimeframe, setTopPlayersTimeframe] = useState('all')
  const [loadingTopPlayers, setLoadingTopPlayers] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  
  const handleTimeframeChange = async (tf: string) => {
    setTopPlayersTimeframe(tf)
    setLoadingTopPlayers(true)
    const data = await getTopPlayersByPnl(tf as any, 10)
    setTopPlayers(data)
    setLoadingTopPlayers(false)
  }
  
  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return n.toLocaleString()
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard 
            label="Utilisateurs" 
            value={stats.totalUsers} 
            icon={Users}
            subtitle={`${stats.bannedUsers} banni${stats.bannedUsers !== 1 ? 's' : ''}`}
            color="cyan"
          />
          <StatCard 
            label="Actifs (24h)" 
            value={stats.activeToday} 
            icon={Activity}
            color="green"
          />
          <StatCard 
            label="Nouveaux (7j)" 
            value={stats.newWeek} 
            icon={UserPlus}
            subtitle={`${stats.newToday} aujourd'hui`}
            color="purple"
          />
          <StatCard 
            label="Volume 24h" 
            value={formatNumber(stats.volumeToday)} 
            icon={DollarSign}
            color="amber"
          />
          <StatCard 
            label="Total distribué" 
            value={formatNumber(stats.totalDistributed)} 
            icon={TrendingUp}
            color="green"
          />
        </div>
      )}
      
      {/* Stacked Layout: Top Players then User Search */}
      <div className="space-y-6">
        {/* Top Players */}
        <TopPlayersTable 
          players={topPlayers}
          timeframe={topPlayersTimeframe}
          onTimeframeChange={handleTimeframeChange}
          loading={loadingTopPlayers}
        />
        
        {/* User Search */}
        <UserSearchTable 
          initialUsers={initialUsers}
          initialTotal={initialTotal}
          onSelectUser={setSelectedUser}
        />
      </div>
      
      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal 
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={() => {
            setSelectedUser(null)
          }}
        />
      )}
    </div>
  )
}
