"use client"

import { useState, useRef } from "react"
import { Camera, Loader2, Trash2, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { deleteAccount } from "@/app/auth/actions"
import { useRouter } from "next/navigation"
import { SuccessPopup } from "@/components/ui/success-popup"
import { getAvatarUrl } from "@/lib/utils/avatar"

export function EditProfileForm({ onClose }: { onClose: () => void }) {
  const { profile, user, setUser } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState(profile?.username || "")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(getAvatarUrl(profile?.avatar_url) || null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [notifWin, setNotifWin] = useState(profile?.email_notif_win ?? true)
  const [notifMarketing, setNotifMarketing] = useState(profile?.email_notif_marketing ?? true)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  
  // Delete Account State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const objectUrl = URL.createObjectURL(file)
      setAvatarPreview(objectUrl)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsLoading(true)

    const supabase = createClient()
    let avatarUrl = profile?.avatar_url

    try {
      // 1. Upload Avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const { error: uploadError, data } = await supabase.storage
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
          email_notif_win: notifWin,
          email_notif_marketing: notifMarketing,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // 3. Update Context
      if (profile) {
        // Refresh logic or optimistic update
        // ideally we should reload the profile from server or update context fully
        // simplified update for context user object:
        setUser({
          ...user,
          username,
          avatar: avatarUrl || user.avatar
        })
      }

      // Show success popup instead of toast
      setShowSuccessPopup(true)
    } catch (error: any) {
      console.error(error)
      if (error.code === '23505') {
        toast({ title: "Pseudo indisponible", description: "Ce nom d'utilisateur est déjà pris. Veuillez en choisir un autre.", variant: "destructive" })
      } else {
      toast({ title: "Erreur", description: error.message, variant: "destructive" })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsDeleting(true)
    
    try {
      const result = await deleteAccount(deletePassword)
      
      if (result.error) {
        toast({ title: "Erreur", description: result.error, variant: "destructive" })
      } else {
        toast({ title: "Compte supprimé", description: "Au revoir !" })
        // Force logout and redirect
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.href = "/login"
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Erreur critique", description: "Impossible de supprimer le compte", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  if (showDeleteConfirm) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-3 text-rose-500 mb-2">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="font-bold text-lg">Suppression du compte</h3>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Cette action est <span className="font-bold text-white">irréversible</span>. Toutes vos données (paris, historique, solde) seront effacées définitivement.
        </p>

        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirmez votre mot de passe</label>
            <input 
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full bg-white/5 border border-rose-500/30 rounded-lg px-4 py-3 outline-none focus:border-rose-500 transition-all text-rose-200"
              required
              placeholder="Votre mot de passe actuel"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 font-semibold transition-all"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={isDeleting || !deletePassword}
              className="flex-1 py-3 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Supprimer définitivement
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img 
              src={avatarPreview || "/images/default-avatar.svg"} 
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

        {/* Notifications */}
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

      {/* Delete Account Button */}
      <div className="pt-6 border-t border-white/10">
        <button 
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-all font-semibold text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer le compte
        </button>
      </div>

      {/* Profile Update Success Popup */}
      <SuccessPopup
        type="profile"
        isOpen={showSuccessPopup}
        onClose={() => {
          setShowSuccessPopup(false)
          onClose() // Close the edit form after popup closes
        }}
      />
    </div>
  )
}
