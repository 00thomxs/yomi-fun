"use client"

import { useState, useRef } from "react"
import { Camera, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"

export function EditProfileForm({ onClose }: { onClose: () => void }) {
  const { profile, user, setUser } = useUser()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState(profile?.username || "")
  const [notifWin, setNotifWin] = useState(profile?.email_notif_win ?? true) // Need to update Profile type first
  const [notifMarketing, setNotifMarketing] = useState(profile?.email_notif_marketing ?? true)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const supabase = createClient()

    try {
      let avatarUrl = profile?.avatar_url

      // 1. Upload Avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user?.id}-${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
        avatarUrl = urlData.publicUrl
      }

      // 2. Update Profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username,
          avatar_url: avatarUrl,
          email_notif_win: notifWin,
          email_notif_marketing: notifMarketing
        })
        .eq('id', user?.id)

      if (updateError) throw updateError

      // Update local context if possible or force reload
      toast({ title: "Profil mis à jour !" })
      window.location.reload() // Simple way to refresh everything
      
    } catch (error: any) {
      console.error(error)
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de mettre à jour le profil", 
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Upload */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <img 
            src={avatarPreview || "/images/avatar.jpg"} 
            alt="Avatar" 
            className="w-24 h-24 rounded-full object-cover border-4 border-white/10 group-hover:border-primary/50 transition-all"
          />
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
          />
        </div>
        <p className="text-xs text-muted-foreground">Clique pour changer</p>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pseudo</label>
        <input 
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 outline-none focus:border-primary/50 transition-all"
          required
          minLength={3}
        />
      </div>

      {/* Notifications (Mocked UI until DB migration run) */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <p className="text-sm font-bold">Notifications Email</p>
        
        <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer">
          <span className="text-sm">Gains de paris</span>
          <input 
            type="checkbox" 
            checked={notifWin}
            onChange={(e) => setNotifWin(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-transparent text-primary focus:ring-offset-0"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer">
          <span className="text-sm">Promos & Cadeaux</span>
          <input 
            type="checkbox" 
            checked={notifMarketing}
            onChange={(e) => setNotifMarketing(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-transparent text-primary focus:ring-offset-0"
          />
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button 
          type="button" 
          onClick={onClose}
          className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 font-semibold transition-all"
        >
          Annuler
        </button>
        <button 
          type="submit" 
          disabled={isLoading}
          className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Enregistrer
        </button>
      </div>
    </form>
  )
}
