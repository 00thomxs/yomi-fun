"use client"

import { useState } from "react"
import { 
  Plus, Trash2, Edit2, Eye, EyeOff, Loader2, X, 
  Palette, Sparkles, Type, Clock, Check, AlertCircle,
  ChevronDown
} from "lucide-react"
import { toast } from "sonner"
import { 
  type CosmeticItem, 
  type CosmeticType, 
  type CosmeticRarity,
  RARITY_INFO,
  createCosmeticItem,
  updateCosmeticItem,
  deleteCosmeticItem,
  toggleCosmeticAvailability
} from "@/app/actions/cosmetics"
import { CurrencySymbol } from "@/components/ui/currency-symbol"

const TYPE_INFO: Record<CosmeticType, { label: string; icon: typeof Palette; color: string }> = {
  background: { label: 'Fond de Carte', icon: Palette, color: '#22d3ee' },
  aura: { label: 'Aura d\'Avatar', icon: Sparkles, color: '#a855f7' },
  nametag: { label: 'Effet de Pseudo', icon: Type, color: '#f59e0b' },
}

interface CosmeticsManagerProps {
  initialItems: CosmeticItem[]
}

export function CosmeticsManager({ initialItems }: CosmeticsManagerProps) {
  const [items, setItems] = useState<CosmeticItem[]>(initialItems)
  const [selectedType, setSelectedType] = useState<CosmeticType | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<CosmeticItem | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: 'background' as CosmeticType,
    rarity: 'common' as CosmeticRarity,
    price: 5000,
    preview_data: '{}',
    is_available: true,
    is_limited: false,
    sort_order: 0,
  })
  
  const filteredItems = selectedType === 'all' 
    ? items 
    : items.filter(i => i.type === selectedType)
  
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      type: 'background',
      rarity: 'common',
      price: 5000,
      preview_data: '{}',
      is_available: true,
      is_limited: false,
      sort_order: 0,
    })
    setEditingItem(null)
  }
  
  const handleOpenCreate = () => {
    resetForm()
    setShowForm(true)
  }
  
  const handleOpenEdit = (item: CosmeticItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      type: item.type,
      rarity: item.rarity,
      price: item.price,
      preview_data: JSON.stringify(item.preview_data, null, 2),
      is_available: item.is_available,
      is_limited: item.is_limited,
      sort_order: item.sort_order,
    })
    setShowForm(true)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading('form')
    
    try {
      const data = {
        name: formData.name,
        slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description: formData.description || undefined,
        type: formData.type,
        rarity: formData.rarity,
        price: formData.price,
        preview_data: JSON.parse(formData.preview_data),
        is_available: formData.is_available,
        is_limited: formData.is_limited,
        sort_order: formData.sort_order,
      }
      
      if (editingItem) {
        const result = await updateCosmeticItem(editingItem.id, data)
        if (result.error) {
          toast.error('Erreur', { description: result.error })
        } else {
          toast.success('Cosmétique mis à jour !')
          setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...data } as CosmeticItem : i))
          setShowForm(false)
          resetForm()
        }
      } else {
        const result = await createCosmeticItem(data)
        if (result.error) {
          toast.error('Erreur', { description: result.error })
        } else {
          toast.success('Cosmétique créé !')
          // Refresh the page to get new item
          window.location.reload()
        }
      }
    } catch (err) {
      toast.error('Erreur JSON', { description: 'Le format des données de preview est invalide' })
    } finally {
      setLoading(null)
    }
  }
  
  const handleToggleAvailability = async (id: string) => {
    setLoading(id)
    const result = await toggleCosmeticAvailability(id)
    if (result.error) {
      toast.error('Erreur', { description: result.error })
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_available: !i.is_available } : i))
      toast.success('Disponibilité modifiée')
    }
    setLoading(null)
  }
  
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return
    
    setLoading(id)
    const result = await deleteCosmeticItem(id)
    if (result.error) {
      toast.error('Erreur', { description: result.error })
    } else {
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Cosmétique supprimé')
    }
    setLoading(null)
  }
  
  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Cosmétiques</h2>
          <p className="text-sm text-muted-foreground">{items.length} cosmétiques au total</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>
      
      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedType === 'all'
              ? 'bg-white/10 text-white border border-white/20'
              : 'bg-card border border-border text-muted-foreground hover:text-white'
          }`}
        >
          Tous ({items.length})
        </button>
        {(Object.keys(TYPE_INFO) as CosmeticType[]).map(type => {
          const info = TYPE_INFO[type]
          const count = items.filter(i => i.type === type).length
          const Icon = info.icon
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedType === type
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-card border border-border text-muted-foreground hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" style={{ color: info.color }} />
              {info.label} ({count})
            </button>
          )
        })}
      </div>
      
      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          const typeInfo = TYPE_INFO[item.type]
          const rarityInfo = RARITY_INFO[item.rarity]
          const TypeIcon = typeInfo.icon
          const isLoading = loading === item.id
          
          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 space-y-3 transition-all ${
                item.is_available 
                  ? 'bg-card border-border' 
                  : 'bg-card/50 border-border/50 opacity-60'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${typeInfo.color}20`, border: `1px solid ${typeInfo.color}40` }}
                  >
                    <TypeIcon className="w-4 h-4" style={{ color: typeInfo.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{typeInfo.label}</p>
                  </div>
                </div>
                <div 
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${rarityInfo.bgColor} ${rarityInfo.borderColor} border`}
                  style={{ color: rarityInfo.color }}
                >
                  {rarityInfo.label}
                </div>
              </div>
              
              {/* Description */}
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              )}
              
              {/* Price & Status */}
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-primary flex items-center gap-1">
                  {item.price.toLocaleString()} <CurrencySymbol />
                </span>
                <div className="flex items-center gap-2">
                  {item.is_limited && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase">
                      <Clock className="w-3 h-3" />
                      Limité
                    </span>
                  )}
                  {item.is_available ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase">
                      <Check className="w-3 h-3" />
                      Actif
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase">
                      <EyeOff className="w-3 h-3" />
                      Masqué
                    </span>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Modifier
                </button>
                <button
                  onClick={() => handleToggleAvailability(item.id)}
                  disabled={isLoading}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                  title={item.is_available ? 'Masquer' : 'Activer'}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : item.is_available ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  disabled={isLoading}
                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
      
      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucun cosmétique dans cette catégorie.
        </div>
      )}
      
      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
              <h3 className="font-bold text-lg">
                {editingItem ? 'Modifier le cosmétique' : 'Nouveau cosmétique'}
              </h3>
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Nom
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      name: e.target.value,
                      slug: editingItem ? prev.slug : generateSlug(e.target.value)
                    }))
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-primary/50"
                  placeholder="Carbon Fiber"
                />
              </div>
              
              {/* Slug */}
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-primary/50 font-mono"
                  placeholder="carbon-fiber"
                />
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Description (optionnel)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-primary/50 resize-none"
                  rows={2}
                  placeholder="Description courte..."
                />
              </div>
              
              {/* Type & Rarity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CosmeticType }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-primary/50"
                  >
                    {(Object.keys(TYPE_INFO) as CosmeticType[]).map(type => (
                      <option key={type} value={type}>{TYPE_INFO[type].label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Rareté
                  </label>
                  <select
                    value={formData.rarity}
                    onChange={(e) => setFormData(prev => ({ ...prev, rarity: e.target.value as CosmeticRarity }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-primary/50"
                  >
                    {(Object.keys(RARITY_INFO) as CosmeticRarity[]).map(rarity => (
                      <option key={rarity} value={rarity}>{RARITY_INFO[rarity].label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Price & Sort Order */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Prix (Zeny)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-primary/50 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-primary/50 font-mono"
                  />
                </div>
              </div>
              
              {/* Preview Data */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Données de preview (JSON)
                  </label>
                  <div className="flex gap-1">
                    {formData.type === 'background' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, preview_data: JSON.stringify({ type: 'pattern', pattern: 'carbon', colors: ['#1a1a1a', '#2d2d2d'] }, null, 2) }))}
                          className="px-2 py-0.5 text-[10px] rounded bg-white/5 hover:bg-white/10 text-muted-foreground"
                        >
                          Pattern
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, preview_data: JSON.stringify({ type: 'animated', effect: 'electric', colors: ['#00d4ff', '#0066ff', '#000033'] }, null, 2) }))}
                          className="px-2 py-0.5 text-[10px] rounded bg-white/5 hover:bg-white/10 text-muted-foreground"
                        >
                          Animé
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, preview_data: JSON.stringify({ type: 'gradient', effect: 'shimmer', colors: ['#ffd700', '#ffb800', '#cc9900'] }, null, 2) }))}
                          className="px-2 py-0.5 text-[10px] rounded bg-white/5 hover:bg-white/10 text-muted-foreground"
                        >
                          Dégradé
                        </button>
                      </>
                    )}
                    {formData.type === 'aura' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, preview_data: JSON.stringify({ type: 'rotating', effect: 'radar', color: '#00ff00', speed: '3s' }, null, 2) }))}
                          className="px-2 py-0.5 text-[10px] rounded bg-white/5 hover:bg-white/10 text-muted-foreground"
                        >
                          Rotation
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, preview_data: JSON.stringify({ type: 'floating', effect: 'halo', color: '#ffffff', glow: true }, null, 2) }))}
                          className="px-2 py-0.5 text-[10px] rounded bg-white/5 hover:bg-white/10 text-muted-foreground"
                        >
                          Flottant
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, preview_data: JSON.stringify({ type: 'animated', effect: 'flame', colors: ['#ff4500', '#ff8c00', '#ffd700'] }, null, 2) }))}
                          className="px-2 py-0.5 text-[10px] rounded bg-white/5 hover:bg-white/10 text-muted-foreground"
                        >
                          Animé
                        </button>
                      </>
                    )}
                    {formData.type === 'nametag' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, preview_data: JSON.stringify({ type: 'glow', effect: 'neon', useRankColor: true, intensity: 15 }, null, 2) }))}
                          className="px-2 py-0.5 text-[10px] rounded bg-white/5 hover:bg-white/10 text-muted-foreground"
                        >
                          Glow
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, preview_data: JSON.stringify({ type: 'font', fontFamily: 'pixel' }, null, 2) }))}
                          className="px-2 py-0.5 text-[10px] rounded bg-white/5 hover:bg-white/10 text-muted-foreground"
                        >
                          Police
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, preview_data: JSON.stringify({ type: 'gradient', colors: ['#00d4ff', '#ff00ff'], direction: 'to right' }, null, 2) }))}
                          className="px-2 py-0.5 text-[10px] rounded bg-white/5 hover:bg-white/10 text-muted-foreground"
                        >
                          Gradient
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, preview_data: JSON.stringify({ type: 'animated', effect: 'shine', color: '#ffffff', interval: '3s' }, null, 2) }))}
                          className="px-2 py-0.5 text-[10px] rounded bg-white/5 hover:bg-white/10 text-muted-foreground"
                        >
                          Shine
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <textarea
                  value={formData.preview_data}
                  onChange={(e) => setFormData(prev => ({ ...prev, preview_data: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-primary/50 font-mono resize-none"
                  rows={4}
                  placeholder='{"type": "pattern", "colors": ["#000", "#111"]}'
                />
                <p className="text-[10px] text-muted-foreground">
                  Cliquez sur les templates ci-dessus pour pré-remplir selon le type de cosmétique.
                </p>
              </div>
              
              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                    className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Disponible à l'achat</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_limited}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_limited: e.target.checked }))}
                    className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Édition limitée</span>
                </label>
              </div>
              
              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 font-medium transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading === 'form'}
                  className="flex-1 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading === 'form' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

