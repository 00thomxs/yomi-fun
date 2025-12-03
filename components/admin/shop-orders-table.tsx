"use client"

import { useState } from "react"
import { ShopOrder } from "@/lib/types"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { updateOrderStatus } from "@/app/actions/shop"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Check, X } from "lucide-react"

export function ShopOrdersTable({ initialOrders }: { initialOrders: ShopOrder[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleStatusUpdate = async (orderId: string, newStatus: 'completed' | 'cancelled') => {
    if (!confirm(`Êtes-vous sûr de vouloir passer cette commande en ${newStatus} ?`)) return

    setLoadingId(orderId)
    try {
      const result = await updateOrderStatus(orderId, newStatus)
      if (result.error) {
        toast({ title: "Erreur", description: result.error, variant: "destructive" })
      } else {
        toast({ title: "Succès", description: "Statut mis à jour" })
        // Optimistic update
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Erreur", description: "Impossible de mettre à jour", variant: "destructive" })
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

  return (
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
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {formatDate(order.created_at)}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-white">{order.profiles?.username || "Inconnu"}</div>
                <div className="text-xs text-muted-foreground">{order.profiles?.email}</div>
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
                  {order.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {order.status === 'pending' && (
                  <div className="flex justify-end gap-1">
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
                  </div>
                )}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                Aucune commande pour le moment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

