"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingBag, CreditCard, Gamepad2, Sparkles, Heart, Loader2, Mail, Tag, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { ShopItem } from "@/lib/types"
import { purchaseItem } from "@/app/actions/shop"
import { useUser } from "@/contexts/user-context"

interface ShopViewProps {
  initialItems: ShopItem[]
}

export function ShopView({ initialItems }: ShopViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [deliveryInfo, setDeliveryInfo] = useState("")
  
  const { toast } = useToast()
  const { userBalance, setUserBalance } = useUser()

  const categories = [
    { id: "all", name: "Tout", icon: ShoppingBag },
    { id: "gaming", name: "Gaming", icon: Gamepad2 },
    { id: "giftcards", name: "Cartes Cadeaux", icon: CreditCard },
    { id: "experiences", name: "Expériences", icon: Sparkles },
    { id: "deals", name: "Bons Plans", icon: Tag },
  ]

  const filteredItems =
    selectedCategory === "all" 
      ? initialItems 
      : initialItems.filter((item) => {
          const itemCat = item.category?.toLowerCase() || ""
          const filterCat = selectedCategory.toLowerCase()
          
          // Mapping spécial pour les catégories composées
          if (filterCat === "giftcards") return itemCat.includes("carte") || itemCat.includes("gift")
          if (filterCat === "deals") return itemCat.includes("bon") || itemCat.includes("deal") || itemCat.includes("shop")
          if (filterCat === "experiences") return itemCat.includes("exp")
          
          // Fallback simple
          return itemCat.includes(filterCat)
        })

  const handlePurchaseClick = (item: ShopItem) => {
    setSelectedItem(item)
    setDeliveryInfo("")
  }

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    setIsPurchasing(true)
    try {
      const result = await purchaseItem(selectedItem.id, deliveryInfo)
      
      if (result.error) {
        toast({ title: "Erreur", description: result.error, variant: "destructive" })
      } else {
        toast({ 
          title: "Commande validée !", 
          description: `Vous avez acheté ${selectedItem.name}. Vous recevrez bientôt des nouvelles.`
        })
        if (result.newBalance !== undefined) {
          setUserBalance(result.newBalance)
        }
        setSelectedItem(null) // Close modal on success
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" })
    } finally {
      setIsPurchasing(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    const lowerCat = category?.toLowerCase() || ""
    if (lowerCat.includes("gaming")) return <Gamepad2 className="w-3 h-3" />
    if (lowerCat.includes("carte") || lowerCat.includes("gift")) return <CreditCard className="w-3 h-3" />
    if (lowerCat.includes("deal") || lowerCat.includes("shopping")) return <Tag className="w-3 h-3" />
    if (lowerCat.includes("experience")) return <Sparkles className="w-3 h-3" />
    return <ShoppingBag className="w-3 h-3" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight uppercase">Shop</h2>
        <Link 
          href="/orders"
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-white/5 hover:border-white/20 transition-all"
        >
          <Package className="w-4 h-4" />
          Mes Commandes
        </Link>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm tracking-tight whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? "bg-white/10 text-white border border-white/20"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.name}
            </button>
          )
        })}
      </div>

      {/* Shop Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun article disponible dans cette catégorie pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-xl bg-card border border-border hover:border-white/20 transition-all group flex flex-col"
            >
              <div className="relative aspect-square overflow-hidden bg-black/20">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ShoppingBag className="w-12 h-12 opacity-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                  {getCategoryIcon(item.category)}
                  <span>{item.category}</span>
                </div>
                <p className="font-semibold text-sm tracking-tight leading-snug flex-1">{item.name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-primary text-sm font-bold flex items-center gap-1">
                    {item.price.toLocaleString()} <CurrencySymbol />
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    item.stock === 0 
                      ? 'bg-rose-500/10 text-rose-500' 
                      : item.stock === -1 
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-green-500/10 text-green-500'
                  }`}>
                    {item.stock === -1 ? 'Infini' : `${item.stock} dispo`}
                  </span>
                </div>
                <button
                  onClick={() => handlePurchaseClick(item)}
                  disabled={isPurchasing || item.stock === 0}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-tight uppercase hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {item.stock === 0 ? "Rupture" : "Acheter"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4">
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-bold">Confirmer l'achat</h3>
              <p className="text-muted-foreground text-sm">
                Vous êtes sur le point d'acheter <span className="text-white font-semibold">{selectedItem.name}</span>
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 flex justify-between items-center border border-white/10">
              <span className="text-sm font-medium">Prix total</span>
              <span className="text-xl font-bold text-primary flex items-center gap-1">
                {selectedItem.price.toLocaleString()} <CurrencySymbol />
              </span>
            </div>
            
            {selectedItem.stock !== -1 && (
              <p className="text-center text-xs text-amber-400 font-bold uppercase tracking-widest">
                Attention : Plus que {selectedItem.stock} exemplaires !
              </p>
            )}

            {userBalance < selectedItem.price && (
              <p className="text-center text-xs text-rose-400 font-bold uppercase tracking-widest">
                ⚠️ Solde insuffisant ! Il vous manque {(selectedItem.price - userBalance).toLocaleString()} Zeny
              </p>
            )}

            <form onSubmit={handleConfirmPurchase} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  Email de réception
                </label>
                <input
                  type="email"
                  required
                  value={deliveryInfo}
                  onChange={(e) => setDeliveryInfo(e.target.value)}
                  placeholder="exemple@email.com"
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-primary/50 transition-all"
                />
                <p className="text-xs text-muted-foreground">
                  L'article sera envoyé à cette adresse email.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  disabled={isPurchasing}
                  className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 font-semibold transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPurchasing || !deliveryInfo.trim() || userBalance < selectedItem.price}
                  className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPurchasing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {userBalance < selectedItem.price ? "Solde insuffisant" : "Confirmer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
