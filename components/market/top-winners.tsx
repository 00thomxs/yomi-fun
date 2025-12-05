import { MarketWinner } from "@/app/actions/market-stats"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { Trophy } from "lucide-react"

export function TopWinners({ winners }: { winners: MarketWinner[] }) {
  if (winners.length === 0) return null

  const top1 = winners[0]
  const top2 = winners[1]
  const top3 = winners[2]

  return (
    <div className="mt-8 mb-8 rounded-xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-6">
      <div className="flex items-center gap-2 mb-8 justify-center">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400">Top Gagnants</h3>
      </div>

      <div className="flex items-end justify-center gap-2 sm:gap-8">
        {/* #2 */}
        <div className="flex flex-col items-center w-1/3 sm:w-auto min-w-[80px]">
          {top2 ? (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <div className="relative mb-3">
                <img 
                  src={top2.avatar} 
                  alt={top2.username}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white/20 object-cover grayscale-[0.3]"
                />
                <div className="absolute -bottom-2 -right-1 w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold border border-white/20 shadow-lg">
                  2
                </div>
              </div>
              <p className="text-xs font-bold truncate w-20 sm:w-24 text-center mb-1 text-zinc-400">{top2.username}</p>
              <p className="text-xs font-mono text-emerald-400 font-bold">
                +<CurrencySymbol className="w-2.5 h-2.5 inline mb-0.5" />{top2.netProfit.toLocaleString()}
              </p>
            </div>
          ) : <div className="w-12 h-12" />}
        </div>

        {/* #1 */}
        <div className="flex flex-col items-center w-1/3 sm:w-auto min-w-[100px] -mb-2">
          {top1 && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700 scale-110 origin-bottom">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-amber-500/30 blur-xl rounded-full opacity-60" />
                <img 
                  src={top1.avatar} 
                  alt={top1.username}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] object-cover relative z-10"
                />
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                  <Trophy className="w-6 h-6 text-amber-400 drop-shadow-lg animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -right-1 w-7 h-7 bg-amber-500 text-black rounded-full flex items-center justify-center text-sm font-black border border-amber-400 shadow-lg z-20">
                  1
                </div>
              </div>
              <p className="text-sm font-bold truncate w-24 sm:w-32 text-center mb-1 text-amber-100">{top1.username}</p>
              <p className="text-sm font-mono text-amber-400 font-black bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                +<CurrencySymbol className="w-3 h-3 inline mb-0.5" />{top1.netProfit.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* #3 */}
        <div className="flex flex-col items-center w-1/3 sm:w-auto min-w-[80px]">
          {top3 ? (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="relative mb-3">
                <img 
                  src={top3.avatar} 
                  alt={top3.username}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-orange-700/30 object-cover grayscale-[0.5]"
                />
                <div className="absolute -bottom-2 -right-1 w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold border border-orange-700/30 text-orange-500 shadow-lg">
                  3
                </div>
              </div>
              <p className="text-xs font-bold truncate w-20 sm:w-24 text-center mb-1 text-zinc-500">{top3.username}</p>
              <p className="text-xs font-mono text-emerald-400 font-bold">
                +<CurrencySymbol className="w-2.5 h-2.5 inline mb-0.5" />{top3.netProfit.toLocaleString()}
              </p>
            </div>
          ) : <div className="w-12 h-12" />}
        </div>
      </div>
    </div>
  )
}

