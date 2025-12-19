import { ShopView } from "@/components/views/shop-view"
import { getCosmeticItems } from "@/app/actions/cosmetics"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export const revalidate = 60

export default async function ShopPage() {
  const items = await getCosmeticItems()
  
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
