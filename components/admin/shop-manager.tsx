"use client"

import { useState } from "react"
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react"
import { createShopItem, updateShopItem, deleteShopItem } from "@/app/actions/shop"
import { ShopItem } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { CurrencySymbol } from "@/components/ui/currency-symbol"

export function AdminShopManager({ items }: { items: ShopItem[] }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Digital",
    image_url: "",
    stock: "-1" // Default infinite
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "Digital",
      image_url: "",
      stock: "-1"
    })
    setEditingItem(null)
    setIsEditing(false)
  }

  const handleEdit = (item: ShopItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category: item.category || "Digital",
      image_url: item.image_url || "",
      stock: item.stock?.toString() || "-1"
    })
    setIsEditing(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const data = new FormData()
    data.append("name", formData.name)
    data.append("description", formData.description)
    data.append("price", formData.price)
    data.append("category", formData.category)
    data.append("image_url", formData.image_url)
    data.append("stock", formData.stock)

    try {
      let result
      if (editingItem) {
        result = await updateShopItem(editingItem.id, data)
      } else {
        result = await createShopItem(data)
      }

      if (result.error) {
        toast({ title: "Erreur", description: result.error, variant: "destructive" })
      } else {
        toast({ title: "Succès", description: editingItem ? "Article mis à jour" : "Article créé" })
        resetForm()
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) return
    
    try {
      const result = await deleteShopItem(id)
      if (result.error) {
        toast({ title: "Erreur", description: result.error, variant: "destructive" })
      } else {
        toast({ title: "Succès", description: "Article supprimé" })
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {isEditing ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {isEditing ? "Modifier l'article" : "Ajouter un article"}
          </h2>
          {isEditing && (
            <button onClick={resetForm} className="text-sm text-muted-foreground hover:text-white flex items-center gap-1">
              <X className="w-4 h-4" /> Annuler
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Nom</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary/50 h-24 resize-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Prix (Zeny)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary/50 appearance-none"
                >
                  <option value="Digital">Digital</option>
                  <option value="High-Tech">High-Tech</option>
                  <option value="Experiences">Expériences</option>
                  <option value="Merch">Merch</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Stock (-1 = Infini)</label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Image URL</label>
                <input
                  type="text"
                  placeholder="/images/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm uppercase hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? "Mettre à jour" : "Créer l'article"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Articles existants ({items.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 group relative">
              <div className="w-16 h-16 bg-black/40 rounded-lg overflow-hidden flex-shrink-0">
                {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-white">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-rose-500/20 rounded-md text-muted-foreground hover:text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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
                    {item.stock === -1 ? 'Infini' : `${item.stock} en stock`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
