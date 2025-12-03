import { getOrders, updateOrderStatus } from "@/app/actions/shop"
import { ShopOrdersTable } from "@/components/admin/shop-orders-table"

export const revalidate = 0

export default async function AdminOrdersPage() {
  const orders = await getOrders()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Commandes ({orders.length})</h1>
      </div>
      <ShopOrdersTable initialOrders={orders} />
    </div>
  )
}
