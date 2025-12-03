import { getUserOrders } from '@/app/actions/shop'
import { UserOrdersView } from '@/components/views/user-orders-view'

export default async function OrdersPage() {
  const orders = await getUserOrders()
  
  return <UserOrdersView initialOrders={orders} />
}

