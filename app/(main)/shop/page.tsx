import { ShopView } from "@/components/views/shop-view"
import { getShopItems } from "@/app/actions/shop"

export const revalidate = 60 // Revalidate every minute

export default async function ShopPage() {
  const items = await getShopItems()
  return <ShopView initialItems={items} />
}
