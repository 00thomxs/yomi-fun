'use client'

import { useState } from 'react'
import { ShoppingBag, Package, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CurrencySymbol } from '@/components/ui/currency-symbol'
import { ShopOrder } from '@/lib/types'

interface UserOrdersViewProps {
  initialOrders: ShopOrder[]
}

const statusConfig = {
  pending: {
    label: 'En cours',
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  completed: {
    label: 'Livrée',
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
  },
  cancelled: {
    label: 'Annulée (Remboursée)',
    icon: XCircle,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
}

export function UserOrdersView({ initialOrders }: UserOrdersViewProps) {
  const [orders] = useState(initialOrders)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/shop"
            className="p-2 hover:bg-card border border-transparent hover:border-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <ShoppingBag className="w-7 h-7 text-primary" />
              Mes Commandes
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Historique de tes achats
            </p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
          <p className="text-muted-foreground mb-6">
            Tu n&apos;as pas encore effectué d&apos;achat dans le shop.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary border border-primary/20 rounded-lg font-medium hover:bg-primary/20 transition-all"
          >
            <ShoppingBag className="w-5 h-5" />
            Découvrir le Shop
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const config = statusConfig[order.status]
            const StatusIcon = config.icon

            return (
              <div
                key={order.id}
                className={`bg-card border ${config.border} rounded-xl p-5 transition-all hover:shadow-lg`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Item Image */}
                  {order.shop_items?.image_url && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-black/20 flex-shrink-0">
                      <img
                        src={order.shop_items.image_url}
                        alt={order.shop_items.name || 'Article'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Order Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {order.shop_items?.name || 'Article supprimé'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Commandé le {formatDate(order.created_at)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Envoyé à : <span className="text-foreground">{order.delivery_info}</span>
                    </p>
                  </div>

                  {/* Price & Status */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-3">
                    <div className="flex items-center gap-1 text-xl font-bold text-primary">
                      {order.price_paid.toLocaleString()} <CurrencySymbol />
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} ${config.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                  </div>
                </div>

                {/* Additional info based on status */}
                {order.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm text-amber-500/80 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Ta commande est en cours de traitement. Tu recevras ton article par email sous 24-48h.
                    </p>
                  </div>
                )}

                {order.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm text-green-500/80 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Ta commande a été livrée ! Vérifie tes emails.
                    </p>
                  </div>
                )}

                {order.status === 'cancelled' && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm text-rose-500/80 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Cette commande a été annulée. Les {order.price_paid.toLocaleString()} Zeny ont été recrédités sur ton compte.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Summary */}
      {orders.length > 0 && (
        <div className="bg-card/50 border border-border rounded-xl p-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Total commandes :</span>{' '}
              <span className="font-semibold">{orders.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">En attente :</span>{' '}
              <span className="font-semibold text-amber-500">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Livrées :</span>{' '}
              <span className="font-semibold text-green-500">
                {orders.filter(o => o.status === 'completed').length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Dépensé :</span>{' '}
              <span className="font-semibold text-primary flex items-center gap-1 inline-flex">
                {orders
                  .filter(o => o.status !== 'cancelled')
                  .reduce((sum, o) => sum + o.price_paid, 0)
                  .toLocaleString()}{' '}
                <CurrencySymbol />
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

