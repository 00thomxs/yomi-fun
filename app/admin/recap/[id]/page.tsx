import { getPastSeason } from "@/app/admin/settings/actions"
import { ArrowLeft, Trophy, Calendar, Share2, Crown, Coins } from "lucide-react"
import Link from "next/link"
import { CurrencySymbol } from "@/components/ui/currency-symbol"

export default async function SeasonRecapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const season = await getPastSeason(id)

  if (!season) {
    return <div className="p-8 text-center">Saison introuvable</div>
  }

  // Sort winners by rank just in case
  const winners = (season.winners || []).sort((a: any, b: any) => a.rank - b.rank)
  const top1 = winners.find((w: any) => w.rank === 1)
  const top2 = winners.find((w: any) => w.rank === 2)
  const top3 = winners.find((w: any) => w.rank === 3)

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Récapitulatif Saison</h1>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 transition-all">
          <Share2 className="w-4 h-4" />
          Partager
        </button>
      </div>

      {/* The "Shareable" Card Container */}
      <div className="relative overflow-hidden rounded-3xl border-4 border-primary/20 bg-[#0a0a0a] shadow-2xl aspect-[4/5] md:aspect-video flex flex-col">
        
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-black/0 to-black/80 pointer-events-none" />
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

        {/* Card Content */}
        <div className="relative z-10 flex-1 flex flex-col p-8 md:p-12 items-center justify-between">
          
          {/* Season Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-mono text-muted-foreground uppercase tracking-widest">
              <Calendar className="w-3 h-3" />
              {new Date(season.end_date).getFullYear()}
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter text-shadow-glow">
              {season.title}
            </h2>
            <p className="text-primary font-bold tracking-widest uppercase text-sm md:text-base">
              Classement Final
            </p>
          </div>

          {/* Podium */}
          <div className="grid grid-cols-3 gap-4 md:gap-12 items-end w-full max-w-2xl mx-auto mb-8">
            
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className="relative mb-4 group">
                <div className="absolute -inset-1 bg-gray-400/20 rounded-full blur-md" />
                <img 
                  src={top2?.avatar || "/images/avatar.jpg"} 
                  alt={top2?.username} 
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-gray-400 object-cover relative z-10"
                />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-600 text-gray-200 text-xs font-bold px-2 py-0.5 rounded-full z-20">
                  #2
                </div>
              </div>
              <p className="font-bold text-lg text-gray-200 truncate w-full text-center">{top2?.username || "N/A"}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-1">
                +{top2?.reward?.toLocaleString() || 0} <CurrencySymbol className="w-2 h-2" />
              </p>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center -mt-8">
              <div className="relative mb-6">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-bounce">
                  <Crown className="w-10 h-10 text-amber-400 fill-amber-400/20" />
                </div>
                <div className="absolute -inset-2 bg-amber-500/20 rounded-full blur-xl" />
                <img 
                  src={top1?.avatar || "/images/avatar.jpg"} 
                  alt={top1?.username} 
                  className="w-28 h-28 md:w-36 md:h-36 rounded-full border-[6px] border-amber-400 object-cover relative z-10 shadow-[0_0_30px_rgba(251,191,36,0.3)]"
                />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-sm font-black px-3 py-1 rounded-full z-20 shadow-lg">
                  #1
                </div>
              </div>
              <p className="font-black text-2xl md:text-3xl text-amber-400 truncate w-full text-center text-shadow-sm">
                {top1?.username || "N/A"}
              </p>
              <div className="mt-2 px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm md:text-lg font-mono font-bold text-amber-400 flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  +{top1?.reward?.toLocaleString() || 0} <CurrencySymbol className="w-3 h-3" />
                </p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="absolute -inset-1 bg-orange-600/20 rounded-full blur-md" />
                <img 
                  src={top3?.avatar || "/images/avatar.jpg"} 
                  alt={top3?.username} 
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-orange-600 object-cover relative z-10"
                />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-900/80 border border-orange-600 text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full z-20">
                  #3
                </div>
              </div>
              <p className="font-bold text-lg text-orange-200 truncate w-full text-center">{top3?.username || "N/A"}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-1">
                +{top3?.reward?.toLocaleString() || 0} <CurrencySymbol className="w-2 h-2" />
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="w-full pt-8 border-t border-white/5 flex justify-between items-end opacity-50">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Saison terminée le</p>
              <p className="text-sm font-mono text-white">{new Date(season.end_date).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black tracking-tighter">YOMI.fun</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

