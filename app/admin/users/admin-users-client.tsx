"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Users, TrendingUp, Activity, UserPlus, Ban, DollarSign, 
  Search, Filter, ChevronDown, ChevronUp, Eye, Edit2, 
  ShieldOff, X, Check, Loader2, RefreshCw, Trophy, AlertTriangle
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
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
        <div className={`p-1.5 rounded ${colorClasses[color]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {trend && (
          <span className={`text-xs ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  )
}

// ============================================
// TOP PLAYERS TABLE
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
  
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-sm">Top 10 PNL</h3>
        </div>
        <div className="flex gap-1">
          {timeframes.map(tf => (
            <button
              key={tf.id}
              onClick={() => onTimeframeChange(tf.id)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                timeframe === tf.id
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-xs border-b border-zinc-800">
                <th className="text-left py-2 px-4 font-medium">#</th>
                <th className="text-left py-2 px-4 font-medium">Joueur</th>
                <th className="text-right py-2 px-4 font-medium">PNL</th>
                <th className="text-right py-2 px-4 font-medium">Balance</th>
                <th className="text-right py-2 px-4 font-medium">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, i) => (
                <tr key={player.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-2 px-4 text-zinc-400">{i + 1}</td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <img 
                        src={player.avatar_url || '/placeholder-avatar.png'} 
                        alt="" 
                        className="w-6 h-6 rounded-full"
                      />
                      <span className={player.is_banned ? 'text-red-400 line-through' : 'text-white'}>
                        {player.username}
                      </span>
                      {player.is_banned && <Ban className="w-3 h-3 text-red-400" />}
                    </div>
                  </td>
                  <td className={`py-2 px-4 text-right font-mono ${
                    player.total_won >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {player.total_won >= 0 ? '+' : ''}{player.total_won.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-zinc-300">
                    {player.balance.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 text-right text-zinc-400">
                    {player.win_rate}%
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
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
    const newOrder = filters.sortBy === column && filters.sortOrder === 'desc' ? 'asc' : 'desc'
    const newFilters = { ...filters, query, sortBy: column, sortOrder: newOrder, offset: 0 }
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
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-zinc-800 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Rechercher par username..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Rechercher
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              showFilters ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>
        
        {/* Expandable Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-zinc-800">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">PNL Min</label>
              <input
                type="number"
                value={filters.minPnl || ''}
                onChange={(e) => handleFilterChange('minPnl', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0"
                className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">PNL Max</label>
              <input
                type="number"
                value={filters.maxPnl || ''}
                onChange={(e) => handleFilterChange('maxPnl', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="∞"
                className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Balance Min</label>
              <input
                type="number"
                value={filters.minBalance || ''}
                onChange={(e) => handleFilterChange('minBalance', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0"
                className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Statut</label>
              <select
                value={filters.isBanned === undefined ? '' : filters.isBanned ? 'banned' : 'active'}
                onChange={(e) => handleFilterChange('isBanned', e.target.value === '' ? undefined : e.target.value === 'banned')}
                className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm"
              >
                <option value="">Tous</option>
                <option value="active">Actifs</option>
                <option value="banned">Bannis</option>
              </select>
            </div>
            <div className="col-span-2 md:col-span-4 flex gap-2">
              <button
                onClick={applyFilters}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm"
              >
                Appliquer
              </button>
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{total} utilisateur{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}</span>
          <button onClick={() => doSearch(filters)} className="flex items-center gap-1 hover:text-white">
            <RefreshCw className="w-3 h-3" />
            Actualiser
          </button>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
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
                <th className="text-center py-3 px-4 font-medium whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatar_url || '/placeholder-avatar.png'} 
                        alt="" 
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <span className={`font-medium ${user.is_banned ? 'text-red-400 line-through' : 'text-white'}`}>
                          {user.username}
                        </span>
                        <p className="text-xs text-zinc-500">Lvl {user.level}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-zinc-300 hidden sm:table-cell">
                    {user.balance.toLocaleString()}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono ${
                    user.total_won >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {user.total_won >= 0 ? '+' : ''}{user.total_won.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-400 hidden md:table-cell">
                    {user.total_bets}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {user.is_banned ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">
                        <Ban className="w-3 h-3" /> Banni
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs">
                        <Check className="w-3 h-3" /> Actif
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-500 text-xs hidden lg:table-cell">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onSelectUser(user)}
                        className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-zinc-500">
                    Aucun utilisateur trouvé
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
          <div className="flex items-center gap-3">
            <img 
              src={user.avatar_url || '/placeholder-avatar.png'} 
              alt="" 
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h2 className="font-bold text-lg">{user.username}</h2>
              <p className="text-xs text-zinc-500">ID: {user.id.slice(0, 8)}...</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status Banner */}
          {user.is_banned && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Utilisateur banni</p>
                <p className="text-xs text-zinc-400">
                  {user.ban_reason || 'Aucune raison spécifiée'}
                </p>
                {user.banned_at && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Banni le {new Date(user.banned_at).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-xs text-zinc-500">Balance</p>
              <p className="text-lg font-bold font-mono">{user.balance.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-xs text-zinc-500">PNL Total</p>
              <p className={`text-lg font-bold font-mono ${user.total_won >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {user.total_won >= 0 ? '+' : ''}{user.total_won.toLocaleString()}
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-xs text-zinc-500">Win Rate</p>
              <p className="text-lg font-bold">{user.win_rate}%</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-xs text-zinc-500">Paris</p>
              <p className="text-lg font-bold">{user.total_bets}</p>
            </div>
          </div>
          
          {/* Edit Section */}
          {editMode ? (
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                Modifier les données
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Username</label>
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => setEditData(d => ({ ...d, username: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Balance</label>
                  <input
                    type="number"
                    value={editData.balance}
                    onChange={(e) => setEditData(d => ({ ...d, balance: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : banMode ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-sm flex items-center gap-2 text-red-400">
                <Ban className="w-4 h-4" />
                Bannir cet utilisateur
              </h3>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Raison du bannissement..."
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm resize-none h-20"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleBan}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer le ban'}
                </button>
                <button
                  onClick={() => setBanMode(false)}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(true)}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
              {user.is_banned ? (
                <button
                  onClick={handleUnban}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldOff className="w-4 h-4" /> Débannir</>}
                </button>
              ) : (
                <button
                  onClick={() => setBanMode(true)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Bannir
                </button>
              )}
            </div>
          )}
          
          {/* Recent Bets */}
          <div className="border-t border-zinc-800 pt-4">
            <h3 className="font-medium text-sm mb-3">Derniers paris</h3>
            {loadingBets ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
              </div>
            ) : bets.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {bets.map(bet => (
                  <div key={bet.id} className="bg-zinc-800/50 rounded-lg p-2 flex items-center justify-between text-xs">
                    <div className="truncate flex-1 mr-2">
                      <p className="text-zinc-300 truncate">{bet.markets?.question || 'Event'}</p>
                      <p className="text-zinc-500">{new Date(bet.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono">{bet.amount.toLocaleString()}</p>
                      <span className={`${
                        bet.status === 'won' ? 'text-emerald-400' :
                        bet.status === 'lost' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {bet.status === 'won' ? 'Gagné' : bet.status === 'lost' ? 'Perdu' : 'En cours'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm text-center py-4">Aucun pari récent</p>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard 
            label="Utilisateurs" 
            value={stats.totalUsers} 
            icon={Users}
            subtitle={`${stats.bannedUsers} banni${stats.bannedUsers !== 1 ? 's' : ''}`}
            color="cyan"
          />
          <StatCard 
            label="Actifs aujourd'hui" 
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
      
      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Players */}
        <div className="lg:col-span-1">
          <TopPlayersTable 
            players={topPlayers}
            timeframe={topPlayersTimeframe}
            onTimeframeChange={handleTimeframeChange}
            loading={loadingTopPlayers}
          />
        </div>
        
        {/* User Search */}
        <div className="lg:col-span-2">
          <UserSearchTable 
            initialUsers={initialUsers}
            initialTotal={initialTotal}
            onSelectUser={setSelectedUser}
          />
        </div>
      </div>
      
      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal 
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={() => {
            // Refresh will happen via revalidatePath
            setSelectedUser(null)
          }}
        />
      )}
    </div>
  )
}

