import { getAllCosmeticItems } from "@/app/actions/cosmetics"
import { CosmeticsManager } from "@/components/admin/cosmetics-manager"

export const revalidate = 0

export default async function AdminShopPage() {
  const items = await getAllCosmeticItems()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestion du Shop</h1>
        <p className="text-muted-foreground">Gérez les cosmétiques disponibles à l'achat</p>
      </div>
      <CosmeticsManager initialItems={items} />
    </div>
  )
}
