"use client"

import { useState } from "react"
import { ShoppingBag, CreditCard, Smartphone, Sparkles, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import {
  SHOP_AIRPODS,
  SHOP_KHALAMITE,
  SHOP_LOL,
  SHOP_MACBOOK,
  SHOP_PSN,
  SHOP_BONNIE,
  SHOP_JAPAN,
  SHOP_NORDVPN,
} from "@/lib/mock-data"

export function ShopView() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const { toast } = useToast()

  const categories = [
    { id: "all", name: "Tout", icon: ShoppingBag },
    { id: "digital", name: "Digital", icon: CreditCard },
    { id: "tech", name: "Tech", icon: Smartphone },
    { id: "experiences", name: "Experiences", icon: Sparkles },
  ]

  const shopItems = [
    {
      id: "psn-20",
      name: "Carte PSN 20EUR",
      category: "digital",
      price: 2500,
      image: SHOP_PSN,
      badge: null,
    },
    {
      id: "lol-skin",
      name: "Skin LoL Mystere",
      category: "digital",
      price: 1000,
      image: SHOP_LOL,
      badge: null,
    },
    {
      id: "nordvpn-1y",
      name: "NordVPN 1 an",
      category: "digital",
      price: 5000,
      image: SHOP_NORDVPN,
      badge: "Free",
    },
    {
      id: "airpods-4",
      name: "AirPods 4",
      category: "tech",
      price: 45000,
      image: SHOP_AIRPODS,
      badge: null,
    },
    {
      id: "macbook-pro",
      name: "MacBook Pro",
      category: "tech",
      price: 900000,
      image: SHOP_MACBOOK,
      badge: null,
    },
    {
      id: "diner-bonnie",
      name: "Diner avec Bonnie Blue",
      category: "experiences",
      price: 250000,
      image: SHOP_BONNIE,
      badge: "VIP",
    },
    {
      id: "journee-khalamite",
      name: "Une journee avec Khalamite",
      category: "experiences",
      price: 300000,
      image: SHOP_KHALAMITE,
      badge: "VIP",
    },
    {
      id: "semaine-japon",
      name: "1 semaine au Japon",
      category: "experiences",
      price: 1500000,
      image: SHOP_JAPAN,
      badge: "Legendary",
    },
  ]

  const filteredItems =
    selectedCategory === "all" ? shopItems : shopItems.filter((item) => item.category === selectedCategory)

  const handleBuyItem = (item: (typeof shopItems)[0]) => {
    toast({
      title: `Achat de ${item.name} (Mockup)`,
      description: (
        <span>
          Prix: <CurrencySymbol /> {item.price.toLocaleString()}
        </span>
      ),
      duration: 3000,
      variant: "default",
    })
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "digital":
        return <CreditCard className="w-3 h-3" />
      case "tech":
        return <Smartphone className="w-3 h-3" />
      case "experiences":
        return <Heart className="w-3 h-3" />
      default:
        return <ShoppingBag className="w-3 h-3" />
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight uppercase">Shop</h2>

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="relative overflow-hidden rounded-xl bg-card border border-border hover:border-white/20 transition-all group"
          >
            {item.badge && (
              <div
                className={`absolute top-3 right-3 z-10 px-2 py-1 rounded-md text-xs font-bold tracking-tight uppercase ${
                  item.badge === "Legendary"
                    ? "bg-amber-500 text-black"
                    : item.badge === "VIP"
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/20 text-white"
                }`}
              >
                {item.badge}
              </div>
            )}

            <div className="relative aspect-square overflow-hidden">
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                {getCategoryIcon(item.category)}
                <span>{item.category}</span>
              </div>
              <p className="font-semibold text-sm tracking-tight leading-snug">{item.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  <CurrencySymbol className="text-primary" />
                  <span className="font-mono font-bold">{item.price.toLocaleString()}</span>
                </span>
              </div>
              <button
                onClick={() => handleBuyItem(item)}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-tight uppercase hover:bg-primary/90 transition-all"
              >
                Acheter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

