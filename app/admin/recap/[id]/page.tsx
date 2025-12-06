import { getPastSeason } from "@/app/admin/settings/actions"
import { ArrowLeft, Share2, Crown } from "lucide-react"
import Link from "next/link"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { YomiLogo } from "@/components/ui/yomi-logo"

export default async function SeasonRecapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const season = await getPastSeason(id)

  if (!season) {
    return <div className="p-8 text-center">Saison introuvable</div>
  }

  // Sort winners by rank
  const winners = (season.winners || []).sort((a: any, b: any) => a.rank - b.rank)
  const top1 = winners.find((w: any) => w.rank === 1)
  const top2 = winners.find((w: any) => w.rank === 2)
  const top3 = winners.find((w: any) => w.rank === 3)
  const others = winners.filter((w: any) => w.rank >= 4 && w.rank <= 10)

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Récapitulatif Saison</h1>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 transition-all cursor-pointer">
          <Share2 className="w-4 h-4" />
          Partager
        </button>
      </div>

      {/* The "Shareable" Card Container */}
      <div className="relative overflow-hidden rounded-3xl border-4 border-primary/20 bg-[#0a0a0a] shadow-2xl">
        
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

        {/* Card Content */}
        <div className="relative z-10 p-6 md:p-10">
          
          {/* Season Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
              {season.title || "Saison"}
            </h2>
            <p className="text-primary font-bold tracking-widest uppercase text-sm mt-2">
              Classement Final
            </p>
          </div>

          {/* Podium - Top 3 */}
          <div className="grid grid-cols-3 gap-2 md:gap-8 items-end max-w-2xl mx-auto mb-8">
            
            {/* 2nd Place */}
            <div className="flex flex-col items-center pt-8">
              <div className="relative mb-2">
                <div className="absolute -inset-1 bg-gray-400/20 rounded-full blur-md" />
                <img 
                  src={top2?.avatar || "/images/avatar.jpg"} 
                  alt={top2?.username} 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-gray-400 object-cover relative z-10"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-700 border border-gray-500 text-gray-200 text-xs font-bold px-2 py-0.5 rounded-full z-20">
                  #2
                </div>
              </div>
              <p className="font-bold text-sm md:text-base text-gray-200 truncate max-w-[100px] text-center mt-3">
                {top2?.username || "N/A"}
              </p>
              <p className="text-xs font-mono text-gray-400 flex items-center gap-0.5">
                +{top2?.reward?.toLocaleString() || 0}<CurrencySymbol className="w-2.5 h-2.5 ml-0.5" />
              </p>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                  <Crown className="w-8 h-8 text-amber-400 fill-amber-400/30" />
                </div>
                <div className="absolute -inset-2 bg-amber-500/30 rounded-full blur-xl" />
                <img 
                  src={top1?.avatar || "/images/avatar.jpg"} 
                  alt={top1?.username} 
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full border-[5px] border-amber-400 object-cover relative z-10 shadow-[0_0_30px_rgba(251,191,36,0.3)]"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-black px-2.5 py-0.5 rounded-full z-20 shadow-lg">
                  #1
                </div>
              </div>
              <p className="font-black text-lg md:text-xl text-amber-400 truncate max-w-[120px] text-center mt-3">
                {top1?.username || "N/A"}
              </p>
              <p className="text-sm font-mono font-bold text-amber-400 flex items-center gap-0.5">
                +{top1?.reward?.toLocaleString() || 0}<CurrencySymbol className="w-3 h-3 ml-0.5" />
              </p>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center pt-8">
              <div className="relative mb-2">
                <div className="absolute -inset-1 bg-orange-600/20 rounded-full blur-md" />
                <img 
                  src={top3?.avatar || "/images/avatar.jpg"} 
                  alt={top3?.username} 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-orange-600 object-cover relative z-10"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-800 border border-orange-600 text-orange-300 text-xs font-bold px-2 py-0.5 rounded-full z-20">
                  #3
                </div>
              </div>
              <p className="font-bold text-sm md:text-base text-orange-200 truncate max-w-[100px] text-center mt-3">
                {top3?.username || "N/A"}
              </p>
              <p className="text-xs font-mono text-orange-300/70 flex items-center gap-0.5">
                +{top3?.reward?.toLocaleString() || 0}<CurrencySymbol className="w-2.5 h-2.5 ml-0.5" />
              </p>
            </div>

          </div>

          {/* Positions 4-10 */}
          {others.length > 0 && (
            <div className="border-t border-white/10 pt-6 mt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-widest text-center mb-4">
                Autres Gagnants
              </p>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                {others.map((player: any) => (
                  <div key={player.rank} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground font-mono">#{player.rank}</span>
                    <span className="font-medium text-white/80">{player.username}</span>
                    <span className="text-xs font-mono text-emerald-400/70 flex items-center gap-0.5">
                      +{player.reward?.toLocaleString() || 0}<CurrencySymbol className="w-2 h-2 ml-0.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-end mt-8 pt-4 border-t border-white/5">
            <div className="opacity-50">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Saison terminée le</p>
              <p className="text-sm font-mono text-white">{new Date(season.end_date).toLocaleDateString('fr-FR')}</p>
            </div>
            <YomiLogo className="opacity-70" />
          </div>
        </div>
      </div>
    </div>
  )
}
