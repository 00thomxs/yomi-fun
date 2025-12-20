"use client"

import { useState } from "react"
import { 
  Mail, Send, Users, AlertTriangle, CheckCircle, 
  Loader2, Eye, TestTube, Megaphone
} from "lucide-react"
import { toast } from "sonner"
import { sendBroadcastEmail } from "@/app/actions/emails"

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
  const [showPreview, setShowPreview] = useState(false)

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
      `⚠️ Tu vas envoyer cet email à ${initialStats.usersWithEmail} utilisateurs.\n\nCette action est irréversible. Continuer ?`
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
      // Reset form
      setSubject("")
      setContent("")
      setCtaText("")
      setCtaUrl("")
    } else {
      toast.error(result.error || "Erreur lors de l'envoi")
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Utilisateurs</span>
          </div>
          <p className="text-2xl font-bold">{initialStats.totalUsers}</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Avec Email</span>
          </div>
          <p className="text-2xl font-bold">{initialStats.usersWithEmail}</p>
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
      </div>

      {/* Compose Email */}
      <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Send className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Composer un Email</h3>
              <p className="text-xs text-zinc-500">Envoyer un email à tous les utilisateurs</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Subject */}
          <div>
            <label className="text-xs text-zinc-500 block mb-2">Sujet de l'email *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="ex: 🎉 Nouvelle fonctionnalité disponible !"
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-xs text-zinc-500 block mb-2">
              Contenu * <span className="text-zinc-600">(utilise **texte** pour le gras)</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écris ton message ici...

Tu peux utiliser **texte en gras** pour mettre en avant certains éléments.

Les retours à la ligne sont automatiquement pris en compte."
              rows={8}
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 resize-none"
            />
          </div>

          {/* CTA (optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 block mb-2">Texte du bouton (optionnel)</label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="ex: Découvrir →"
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-2">URL du bouton (optionnel)</label>
              <input
                type="url"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://y0mi.fun/..."
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Preview Toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Masquer l'aperçu" : "Voir l'aperçu"}
          </button>

          {/* Preview */}
          {showPreview && (
            <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-6 space-y-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Aperçu</div>
              <h2 className="text-xl font-bold">{subject || "Sujet de l'email"}</h2>
              <p className="text-zinc-400">
                Salut <span className="text-cyan-400">Username</span>,
              </p>
              <div className="text-zinc-300 whitespace-pre-wrap">
                {content.split(/\*\*(.*?)\*\*/g).map((part, i) => 
                  i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                ) || "Contenu de l'email..."}
              </div>
              {ctaText && ctaUrl && (
                <div className="pt-4">
                  <span className="inline-block px-6 py-3 bg-cyan-500 text-black font-semibold rounded-lg">
                    {ctaText}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Test Email */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <TestTube className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-400">Teste d'abord !</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Envoie un email de test à ton adresse avant d'envoyer à tout le monde.
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
                    disabled={sending}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Tester
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Send to All */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Sera envoyé à <strong className="text-white">{initialStats.usersWithEmail}</strong> utilisateurs
            </div>
            <button
              onClick={handleSendAll}
              disabled={sending || !subject.trim() || !content.trim()}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-lg shadow-cyan-500/20"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi en cours...
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

      {/* Templates Suggestions */}
      <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Templates suggérés
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => {
              setSubject("🎉 Nouvelle fonctionnalité disponible !")
              setContent("Nous avons ajouté une nouvelle fonctionnalité que tu vas adorer !\n\n**Découvre-la dès maintenant** et dis-nous ce que tu en penses.")
              setCtaText("Découvrir →")
              setCtaUrl("https://y0mi.fun")
            }}
            className="p-3 text-left rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 transition-colors"
          >
            <p className="font-medium text-sm">Nouvelle fonctionnalité</p>
            <p className="text-xs text-zinc-500 mt-1">Annonce une mise à jour</p>
          </button>
          <button
            onClick={() => {
              setSubject("⚠️ Maintenance prévue")
              setContent("Une maintenance est prévue le **[DATE]** de **[HEURE]** à **[HEURE]**.\n\nPendant cette période, la plateforme sera temporairement inaccessible.\n\nNous nous excusons pour la gêne occasionnée.")
              setCtaText("")
              setCtaUrl("")
            }}
            className="p-3 text-left rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 transition-colors"
          >
            <p className="font-medium text-sm">Maintenance</p>
            <p className="text-xs text-zinc-500 mt-1">Prévenir d'une interruption</p>
          </button>
          <button
            onClick={() => {
              setSubject("🏆 Nouveau tournoi ce week-end !")
              setContent("Un **nouveau tournoi** commence ce week-end avec des récompenses exceptionnelles !\n\n**1er prix :** 10 000 Zeny\n**2ème prix :** 5 000 Zeny\n**3ème prix :** 2 500 Zeny\n\nNe rate pas cette opportunité !")
              setCtaText("Participer →")
              setCtaUrl("https://y0mi.fun")
            }}
            className="p-3 text-left rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 transition-colors"
          >
            <p className="font-medium text-sm">Événement spécial</p>
            <p className="text-xs text-zinc-500 mt-1">Annonce un tournoi/promo</p>
          </button>
        </div>
      </div>
    </div>
  )
}

