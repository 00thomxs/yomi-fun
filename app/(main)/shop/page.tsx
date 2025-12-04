import { ShopView } from "@/components/views/shop-view"
import { getShopItems } from "@/app/actions/shop"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export const revalidate = 60 // Revalidate every minute

export default async function ShopPage() {
  const items = await getShopItems()
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ShopView initialItems={items} />
    </Suspense>
  )
}
