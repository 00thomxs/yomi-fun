import { getShopItems } from "@/app/actions/shop"
import { AdminShopManager } from "@/components/admin/shop-manager"

export const revalidate = 0

export default async function AdminShopPage() {
  const items = await getShopItems()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Gestion du Shop</h1>
      <AdminShopManager items={items} />
    </div>
  )
}

