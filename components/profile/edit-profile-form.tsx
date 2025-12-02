"use client"

import { useState, useRef } from "react"
import { Camera, Loader2, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function EditProfileForm({ onCancel }: { onCancel: () => void }) {
  const { profile, user, isAuthenticated } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const [username, setUsername] = useState(profile?.username || "")
  const [isLoading, setIsLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Fichier trop volumineux",
          description: "L'image ne doit pas dépasser 2MB",
          variant: "destructive"
        })
        return
      }
      setAvatarFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsLoading(true)

    try {
      const supabase = createClient()
      let avatarUrl = profile?.avatar_url

      // 1. Upload Avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        avatarUrl = publicUrl
      }

      // 2. Update Profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      toast({
        title: "Profil mis à jour !",
        description: "Vos modifications ont été enregistrées.",
      })
      
      // Force reload to refresh context
      window.location.reload()
      
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <img
            src={previewUrl || "/images/avatar.jpg"}
            alt="Avatar Preview"
            className="w-24 h-24 rounded-full border-4 border-primary/20 object-cover group-hover:opacity-75 transition-opacity"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-8 h-8 text-white drop-shadow-md" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
        <p className="text-xs text-muted-foreground">Cliquez pour changer (Max 2MB)</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Pseudo</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors"
          placeholder="Votre pseudo..."
          minLength={3}
          required
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-lg bg-white/5 text-muted-foreground font-bold hover:bg-white/10 transition-all"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>
    </form>
  )
}


