"use client"

import { useState, useMemo } from "react"
import { ShopOrder } from "@/lib/types"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { updateOrderStatus, deleteOrder } from "@/app/actions/shop"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, Check, X, Trash2, Clock, CheckCircle, XCircle, List,
  ChevronLeft, ChevronRight, Calendar, ShoppingCart, Users, Coins
} from "lucide-react"

type StatusFilter = 'all' | 'pending' | 'completed' | 'cancelled'

export function ShopOrdersTable({ initialOrders }: { initialOrders: ShopOrder[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const { toast } = useToast()

  // Get available months from orders
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    orders.forEach(order => {
      const date = new Date(order.created_at)
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
    })
    // Add current month if not present
    const now = new Date()
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    return Array.from(months).sort().reverse()
  }, [orders])

  // Filter orders by month and status
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.created_at)
      const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
      const matchesMonth = orderMonth === selectedMonth
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      return matchesMonth && matchesStatus
    })
  }, [orders, selectedMonth, statusFilter])

  // Stats for current month (all statuses)
  const monthlyStats = useMemo(() => {
    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at)
      const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
      return orderMonth === selectedMonth
    })

    // Only count non-cancelled orders for revenue
    const validOrders = monthOrders.filter(o => o.status !== 'cancelled')
    const cancelledOrdersList = monthOrders.filter(o => o.status === 'cancelled')
    
    const totalZeny = validOrders.reduce((sum, o) => sum + o.price_paid, 0)
    const refundedZeny = cancelledOrdersList.reduce((sum, o) => sum + o.price_paid, 0)
    const uniqueUsers = new Set(validOrders.map(o => o.user_id)).size
    const completedOrders = monthOrders.filter(o => o.status === 'completed').length
    const pendingOrders = monthOrders.filter(o => o.status === 'pending').length
    const cancelledOrders = cancelledOrdersList.length

    return {
      totalOrders: monthOrders.length,
      totalZeny,
      refundedZeny,
      uniqueUsers,
      completedOrders,
      pendingOrders,
      cancelledOrders,
    }
  }, [orders, selectedMonth])

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    const currentIndex = availableMonths.indexOf(selectedMonth)
    if (direction === 'prev' && currentIndex < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[currentIndex + 1])
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedMonth(availableMonths[currentIndex - 1])
    }
  }

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  const handleStatusUpdate = async (orderId: string, newStatus: 'completed' | 'cancelled') => {
    const statusLabel = newStatus === 'completed' ? 'terminée' : 'annulée'
    if (!confirm(`Marquer cette commande comme ${statusLabel} ?`)) return

    setLoadingId(orderId)
    try {
      const result = await updateOrderStatus(orderId, newStatus)
      if (result.error) {
        toast({ title: "Erreur", description: result.error, variant: "destructive" })
      } else {
        toast({ title: "Succès", description: "Statut mis à jour" })
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Erreur", description: "Impossible de mettre à jour", variant: "destructive" })
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (orderId: string) => {
    if (!confirm("Supprimer définitivement cette commande ?")) return

    setLoadingId(orderId)
    try {
      const result = await deleteOrder(orderId)
      if (result.error) {
        toast({ title: "Erreur", description: result.error, variant: "destructive" })
      } else {
        toast({ title: "Succès", description: "Commande supprimée" })
        setOrders(orders.filter(o => o.id !== orderId))
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" })
    } finally {
      setLoadingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusFilters: { id: StatusFilter; label: string; icon: typeof List; color: string }[] = [
    { id: 'all', label: 'Toutes', icon: List, color: 'text-white' },
    { id: 'pending', label: 'En attente', icon: Clock, color: 'text-yellow-500' },
    { id: 'completed', label: 'Terminées', icon: CheckCircle, color: 'text-green-500' },
    { id: 'cancelled', label: 'Annulées', icon: XCircle, color: 'text-red-500' },
  ]

  const currentMonthIndex = availableMonths.indexOf(selectedMonth)
  const canGoNext = currentMonthIndex > 0
  const canGoPrev = currentMonthIndex < availableMonths.length - 1

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
        <button
          onClick={() => navigateMonth('prev')}
          disabled={!canGoPrev}
          className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold capitalize">{formatMonthLabel(selectedMonth)}</span>
        </div>

        <button
          onClick={() => navigateMonth('next')}
          disabled={!canGoNext}
          className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map(f => {
          const Icon = f.icon
          const count = f.id === 'all' 
            ? monthlyStats.totalOrders 
            : f.id === 'pending' 
              ? monthlyStats.pendingOrders 
              : f.id === 'completed' 
                ? monthlyStats.completedOrders 
                : monthlyStats.cancelledOrders
          return (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${
                statusFilter === f.id
                  ? 'bg-white/10 border border-white/20 text-white'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-4 h-4 ${statusFilter === f.id ? f.color : ''}`} />
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                statusFilter === f.id ? 'bg-white/20' : 'bg-white/5'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 text-xs uppercase font-bold text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Info (Livraison)</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDate(order.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{order.profiles?.username || "Inconnu"}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {order.shop_items?.image_url && (
                      <img src={order.shop_items.image_url} className="w-8 h-8 rounded object-cover bg-black/20" alt="" />
                    )}
                    <span className="font-medium">{order.shop_items?.name || "Article supprimé"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-primary">
                  {order.price_paid.toLocaleString()} <CurrencySymbol />
                </td>
                <td className="px-4 py-3 max-w-xs truncate" title={order.delivery_info || ""}>
                  {order.delivery_info}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase ${
                    order.status === 'completed' 
                      ? 'bg-green-500/10 text-green-500' 
                      : order.status === 'cancelled'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {order.status === 'pending' ? 'En attente' : order.status === 'completed' ? 'Terminée' : 'Annulée'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'completed')}
                          disabled={loadingId === order.id}
                          className="p-1.5 hover:bg-green-500/20 rounded-md text-muted-foreground hover:text-green-500 transition-colors"
                          title="Marquer comme terminé"
                        >
                          {loadingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          disabled={loadingId === order.id}
                          className="p-1.5 hover:bg-red-500/20 rounded-md text-muted-foreground hover:text-red-500 transition-colors"
                          title="Annuler la commande"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(order.id)}
                      disabled={loadingId === order.id}
                      className="p-1.5 hover:bg-rose-500/20 rounded-md text-muted-foreground hover:text-rose-500 transition-colors"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Aucune commande pour {formatMonthLabel(selectedMonth)}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Monthly Stats Summary */}
      <div className="bg-gradient-to-r from-primary/10 via-card to-primary/10 border border-primary/20 rounded-xl p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Récapitulatif - {formatMonthLabel(selectedMonth)}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-xs font-medium">Commandes</span>
            </div>
            <p className="text-2xl font-bold text-white">{monthlyStats.totalOrders}</p>
          </div>
          
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <Coins className="w-4 h-4" />
              <span className="text-xs font-medium">Revenus</span>
            </div>
            <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
              {monthlyStats.totalZeny.toLocaleString()} <CurrencySymbol />
            </p>
          </div>
          
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Acheteurs</span>
            </div>
            <p className="text-2xl font-bold text-white">{monthlyStats.uniqueUsers}</p>
          </div>
          
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Livrées</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{monthlyStats.completedOrders}</p>
          </div>

          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Remboursés</span>
            </div>
            <p className="text-2xl font-bold text-rose-500 flex items-center justify-center gap-1">
              {monthlyStats.refundedZeny.toLocaleString()} <CurrencySymbol />
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
