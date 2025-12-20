"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Mail, Send, Users, AlertTriangle, CheckCircle, 
  Loader2, Eye, EyeOff, TestTube, Megaphone, 
  Sparkles, Type, Link2, Search, User, X, AtSign
} from "lucide-react"
import { toast } from "sonner"
import { sendBroadcastEmail, sendPersonalizedEmail, searchUsersForEmail, type UserForEmail } from "@/app/actions/emails"
import { getAvatarUrl } from "@/lib/utils/avatar"

interface EmailStats {
  totalUsers: number
  usersWithEmail: number
}

export function AdminEmailsClient({
  initialStats
}: {
  initialStats: EmailStats
}) {
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [ctaText, setCtaText] = useState("")
  const [ctaUrl, setCtaUrl] = useState("")
  const [sending, setSending] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [showPreview, setShowPreview] = useState(true)
  
  // Personalized email state
  const [emailMode, setEmailMode] = useState<'broadcast' | 'personal'>('broadcast')
  const [userSearch, setUserSearch] = useState("")
  const [searchResults, setSearchResults] = useState<UserForEmail[]>([])
  const [selectedUser, setSelectedUser] = useState<UserForEmail | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Debounced user search
  useEffect(() => {
    if (emailMode !== 'personal' || userSearch.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      const results = await searchUsersForEmail(userSearch)
      setSearchResults(results)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [userSearch, emailMode])

  const handleSendTest = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Remplis le sujet et le contenu")
      return
    }
    if (!testEmail.trim()) {
      toast.error("Entre ton email pour le test")
      return
    }

    setSending(true)
    const result = await sendBroadcastEmail(
      subject,
      content,
      ctaText || undefined,
      ctaUrl || undefined,
      true,
      testEmail
    )
    setSending(false)

    if (result.success) {
      toast.success(`Email de test envoyé à ${testEmail}`)
    } else {
      toast.error(result.error || "Erreur lors de l'envoi")
    }
  }

  const handleSendAll = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Remplis le sujet et le contenu")
      return
    }

    const confirmed = window.confirm(
      `Tu vas envoyer cet email à ${initialStats.usersWithEmail} utilisateurs.\n\nCette action est irréversible. Continuer ?`
    )
    if (!confirmed) return

    setSending(true)
    const result = await sendBroadcastEmail(
      subject,
      content,
      ctaText || undefined,
      ctaUrl || undefined,
      false
    )
    setSending(false)

    if (result.success) {
      toast.success(`Email envoyé à ${result.sentCount} utilisateurs !`)
      setSubject("")
      setContent("")
      setCtaText("")
      setCtaUrl("")
    } else {
      toast.error(result.error || "Erreur lors de l'envoi")
    }
  }

  const handleSendPersonalized = async () => {
    if (!selectedUser) {
      toast.error("Sélectionne un utilisateur")
      return
    }
    if (!selectedUser.email) {
      toast.error("Cet utilisateur n'a pas d'email")
      return
    }
    if (!subject.trim() || !content.trim()) {
      toast.error("Remplis le sujet et le contenu")
      return
    }

    setSending(true)
    const result = await sendPersonalizedEmail(
      selectedUser.id,
      subject,
      content,
      ctaText || undefined,
      ctaUrl || undefined
    )
    setSending(false)

    if (result.success) {
      toast.success(`Email envoyé à ${selectedUser.username} !`)
      setSelectedUser(null)
      setUserSearch("")
      setSubject("")
      setContent("")
      setCtaText("")
      setCtaUrl("")
    } else {
      toast.error(result.error || "Erreur lors de l'envoi")
    }
  }

  const selectUser = (user: UserForEmail) => {
    setSelectedUser(user)
    setUserSearch("")
    setSearchResults([])
  }

  // Parse content for preview (bold text)
  const renderFormattedContent = (text: string) => {
    if (!text) return <span className="text-zinc-500 italic">Ton message apparaîtra ici...</span>
    
    return text.split('\n').map((line, lineIndex) => (
      <span key={lineIndex}>
        {line.split(/\*\*(.*?)\*\*/g).map((part, i) => 
          i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part
        )}
        {lineIndex < text.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-zinc-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Total Users</span>
          </div>
          <p className="text-2xl font-bold">{initialStats.totalUsers}</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Avec Email</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{initialStats.usersWithEmail}</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Portée</span>
          </div>
          <p className="text-2xl font-bold">
            {initialStats.totalUsers > 0 
              ? Math.round((initialStats.usersWithEmail / initialStats.totalUsers) * 100) 
              : 0}%
          </p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-red-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Expéditeur</span>
          </div>
          <p className="text-sm font-medium text-zinc-300 truncate">noreply@y0mi.fun</p>
        </div>
      </div>

      {/* Email Mode Selector */}
      <div className="flex gap-2 p-1 bg-zinc-900/50 border border-zinc-800 rounded-xl w-fit">
        <button
          onClick={() => {
            setEmailMode('broadcast')
            setSelectedUser(null)
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            emailMode === 'broadcast' 
              ? 'bg-red-600 text-white' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Broadcast
        </button>
        <button
          onClick={() => setEmailMode('personal')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            emailMode === 'personal' 
              ? 'bg-cyan-600 text-white' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          Personnalisé
        </button>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column - Editor */}
        <div className="space-y-4">
          <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${emailMode === 'personal' ? 'bg-cyan-500/10' : 'bg-red-500/10'}`}>
                  {emailMode === 'personal' ? (
                    <User className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Send className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {emailMode === 'personal' ? 'Email Personnalisé' : 'Composer'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {emailMode === 'personal' ? 'Envoyer à un utilisateur' : 'Crée ton email'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* User Search (only in personal mode) */}
              {emailMode === 'personal' && (
                <div>
                  <label className="text-xs text-zinc-400 flex items-center gap-1.5 mb-2">
                    <AtSign className="w-3 h-3" />
                    Destinataire *
                  </label>
                  
                  {selectedUser ? (
                    <div className="flex items-center gap-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <img 
                        src={getAvatarUrl(selectedUser.avatar_url)} 
                        alt="" 
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-white truncate">{selectedUser.username}</p>
                        <p className="text-xs text-cyan-400 truncate">{selectedUser.email}</p>
                      </div>
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Rechercher un utilisateur..."
                        className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                      />
                      
                      {/* Search Results Dropdown */}
                      {(searchResults.length > 0 || isSearching) && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                          {isSearching ? (
                            <div className="p-4 text-center text-zinc-500 text-sm">
                              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                              Recherche...
                            </div>
                          ) : (
                            searchResults.map(user => (
                              <button
                                key={user.id}
                                onClick={() => selectUser(user)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800 transition-colors text-left"
                              >
                                <img 
                                  src={getAvatarUrl(user.avatar_url)} 
                                  alt="" 
                                  className="w-8 h-8 rounded-full"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-white truncate">{user.username}</p>
                                  {user.email ? (
                                    <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                                  ) : (
                                    <p className="text-xs text-red-400">Pas d'email</p>
                                  )}
                                </div>
                                {user.is_banned && (
                                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">Banni</span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="text-xs text-zinc-400 flex items-center gap-1.5 mb-2">
                  <Type className="w-3 h-3" />
                  Sujet *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={emailMode === 'personal' ? "Message important pour toi" : "Nouvelle fonctionnalité disponible !"}
                  className={`w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none transition-all ${
                    emailMode === 'personal' 
                      ? 'focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20' 
                      : 'focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                  }`}
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-xs text-zinc-400 flex items-center gap-1.5 mb-2">
                  <Mail className="w-3 h-3" />
                  Message *
                  <span className="text-zinc-600 ml-1">(**gras**)</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={emailMode === 'personal' 
                    ? "Salut ! Je voulais te contacter personnellement..."
                    : "Écris ton message ici...\n\nTu peux utiliser **texte en gras** pour mettre en avant."
                  }
                  rows={6}
                  className={`w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none resize-none transition-all ${
                    emailMode === 'personal' 
                      ? 'focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20' 
                      : 'focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                  }`}
                />
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3 h-3" />
                    Bouton
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Découvrir →"
                    className={`w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none ${
                      emailMode === 'personal' ? 'focus:border-cyan-500' : 'focus:border-red-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 flex items-center gap-1.5 mb-2">
                    <Link2 className="w-3 h-3" />
                    URL
                  </label>
                  <input
                    type="url"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="https://y0mi.fun/..."
                    className={`w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none ${
                      emailMode === 'personal' ? 'focus:border-cyan-500' : 'focus:border-red-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Test Section (only for broadcast) */}
          {emailMode === 'broadcast' && (
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
              <div className="flex items-start gap-3">
                <TestTube className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-400">Teste d'abord !</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Envoie un email de test avant d'envoyer à tous.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="ton@email.com"
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm focus:border-amber-500"
                    />
                    <button
                      onClick={handleSendTest}
                      disabled={sending || !subject.trim() || !content.trim()}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                {emailMode === 'personal' ? (
                  selectedUser ? (
                    <>
                      <User className="w-4 h-4 text-cyan-400" />
                      Envoyer à <strong className="text-white">{selectedUser.username}</strong>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 text-zinc-500" />
                      Sélectionne un utilisateur
                    </>
                  )
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Envoyer à <strong className="text-white">{initialStats.usersWithEmail}</strong> utilisateurs
                  </>
                )}
              </div>
              <button
                onClick={emailMode === 'personal' ? handleSendPersonalized : handleSendAll}
                disabled={
                  sending || 
                  !subject.trim() || 
                  !content.trim() || 
                  (emailMode === 'personal' && (!selectedUser || !selectedUser.email))
                }
                className={`px-5 py-2.5 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors ${
                  emailMode === 'personal' 
                    ? 'bg-cyan-600 hover:bg-cyan-500' 
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi...
                  </>
                ) : emailMode === 'personal' ? (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer
                  </>
                ) : (
                  <>
                    <Megaphone className="w-4 h-4" />
                    Envoyer à tous
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-4">
          <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-zinc-700/50 rounded-lg">
                  <Eye className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Aperçu Email</h3>
                  <p className="text-xs text-zinc-500">Rendu en temps réel</p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showPreview ? "Masquer" : "Afficher"}
              </button>
            </div>

            {showPreview && (
              <div className="p-4">
                {/* Email Preview - Mimics actual email template */}
                <div 
                  className="rounded-xl overflow-hidden border border-zinc-700"
                  style={{ 
                    background: '#0a0a0a',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M40 0v40M0 40h40' stroke='%23ffffff' stroke-opacity='0.03' stroke-width='1'/%3E%3C/svg%3E")`
                  }}
                >
                  {/* Header */}
                  <div className="p-6 text-center bg-[#0a0a0a] border-b border-zinc-800">
                    <span className="text-3xl font-black text-red-600 tracking-tight">YOMI</span>
                    <span className="text-xl text-white">.fun</span>
                  </div>

                  {/* Content */}
                  <div 
                    className="p-6 space-y-4"
                    style={{ 
                      background: '#111111',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M40 0v40M0 40h40' stroke='%23ffffff' stroke-opacity='0.03' stroke-width='1'/%3E%3C/svg%3E")`
                    }}
                  >
                    {/* Subject as Title */}
                    <h2 className="text-xl font-bold text-white">
                      {subject || <span className="text-zinc-500">Sujet de l'email</span>}
                    </h2>

                    {/* Greeting */}
                    <p className="text-[#d4d4d4] text-sm">
                      Salut <span className="text-red-500 font-semibold">
                        {emailMode === 'personal' && selectedUser ? selectedUser.username : 'Username'}
                      </span>,
                    </p>

                    {/* Message Content */}
                    <div className="text-[#d4d4d4] text-sm leading-relaxed">
                      {renderFormattedContent(content)}
                    </div>

                    {/* CTA Button */}
                    {ctaText && (
                      <div className="pt-2">
                        <span className="inline-block px-6 py-3 bg-red-600 text-white font-semibold rounded-lg text-sm">
                          {ctaText}
                        </span>
                      </div>
                    )}

                    {/* Signature */}
                    <p className="text-zinc-500 text-sm pt-2">
                      — L'équipe YOMI.fun
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="p-4 text-center bg-[#0a0a0a] border-t border-zinc-800">
                    <p className="text-zinc-600 text-xs">
                      © 2025 YOMI.fun
                    </p>
                    <p className="text-zinc-600 text-xs mt-1">
                      Site • Mon Profil • Support
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Templates (only for broadcast) */}
          {emailMode === 'broadcast' && (
            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Templates rapides
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => {
                    setSubject("Nouvelle fonctionnalité disponible !")
                    setContent("Nous avons ajouté une nouvelle fonctionnalité que tu vas adorer !\n\n**Découvre-la dès maintenant** et dis-nous ce que tu en penses.")
                    setCtaText("Découvrir →")
                    setCtaUrl("https://y0mi.fun")
                  }}
                  className="p-3 text-left rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-colors"
                >
                  <p className="font-medium text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Nouvelle fonctionnalité
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 ml-6">Annonce une mise à jour</p>
                </button>
                <button
                  onClick={() => {
                    setSubject("Maintenance prévue")
                    setContent("Une maintenance est prévue le **[DATE]** de **[HEURE]** à **[HEURE]**.\n\nPendant cette période, la plateforme sera temporairement inaccessible.\n\nNous nous excusons pour la gêne occasionnée.")
                    setCtaText("")
                    setCtaUrl("")
                  }}
                  className="p-3 text-left rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-colors"
                >
                  <p className="font-medium text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Maintenance
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 ml-6">Prévenir d'une interruption</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
