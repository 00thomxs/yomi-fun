"use client"

import { ArrowLeft, Trophy, Gift, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { AVATAR_MAIN, AVATAR_2, AVATAR_3 } from "@/lib/mock-data"

type LeaderboardViewProps = {
  onBack: () => void
}

export function LeaderboardView({ onBack }: LeaderboardViewProps) {
  const topPlayers = [
    {
      rank: 1,
      username: "@00thomxs",
      points: 54200,
      avatar: AVATAR_MAIN,
      winRate: 78,
      pnl: 42500,
    },
    {
      rank: 2,
      username: "@K1rkgambl3r",
      points: 112000,
      avatar: AVATAR_2,
      winRate: 72,
      pnl: 31800,
    },
    {
      rank: 3,
      username: "@Icantbr3athh",
      points: 108000,
      avatar: AVATAR_3,
      winRate: 69,
      pnl: 29400,
    },
    {
      rank: 4,
      username: "@MarketGuru",
      points: 95000,
      avatar: "https://i.pravatar.cc/150?img=45",
      winRate: 65,
      pnl: 18200,
    },
    {
      rank: 5,
      username: "@TrendSetter",
      points: 92000,
      avatar: "https://i.pravatar.cc/150?img=32",
      winRate: 63,
      pnl: 15400,
    },
    {
      rank: 6,
      username: "@AlphaTrader",
      points: 89000,
      avatar: "https://i.pravatar.cc/150?img=18",
      winRate: 61,
      pnl: 12800,
    },
    {
      rank: 7,
      username: "@BetaHunter",
      points: 86000,
      avatar: "https://i.pravatar.cc/150?img=22",
      winRate: 59,
      pnl: 9800,
    },
    {
      rank: 8,
      username: "@DeltaForce",
      points: 83000,
      avatar: "https://i.pravatar.cc/150?img=41",
      winRate: 58,
      pnl: -1200,
    },
    {
      rank: 9,
      username: "@GammaRay",
      points: 80000,
      avatar: "https://i.pravatar.cc/150?img=37",
      winRate: 56,
      pnl: -3400,
    },
    {
      rank: 10,
      username: "@ThetaWave",
      points: 77000,
      avatar: "https://i.pravatar.cc/150?img=29",
      winRate: 54,
      pnl: -5800,
    },
  ]

  const currentUser = topPlayers[0]
  const seasonProgress = ((90 - 23) / 90) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2.5 rounded-lg bg-card border border-border hover:border-white/20 transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold tracking-tight uppercase">Classement</h2>
      </div>

      {/* Season Rewards */}
      <div className="rounded-xl bg-gradient-to-r from-amber-500/20 via-primary/20 to-amber-500/20 border border-amber-500/30 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold tracking-tight uppercase text-amber-400">Recompenses Saison 1</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-amber-500/30">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-lg">🥇</span>
            </div>
            <div>
              <p className="text-xs text-amber-400 font-bold">#1</p>
              <p className="text-sm font-medium">Setup Gaming Razer</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/20">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-lg">🥈</span>
            </div>
            <div>
              <p className="text-xs text-white/60 font-bold">#2</p>
              <p className="text-sm font-medium">iPhone 16 Pro</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-orange-500/30">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
              <span className="text-lg">🥉</span>
            </div>
            <div>
              <p className="text-xs text-orange-400 font-bold">#3</p>
              <p className="text-sm font-medium">Pass Festival Yardland</p>
            </div>
          </div>
        </div>
      </div>

      {/* Season Progress */}
      <div className="rounded-xl bg-white/5 border border-white/20 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Season 1</p>
            <p className="text-2xl font-bold tracking-tight text-white">
              <span className="font-mono">23</span> jours restants
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Prize Pool</p>
            <p className="text-lg font-bold text-primary font-mono">
              1,000,000 <CurrencySymbol />
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
              style={{ width: `${seasonProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>Day 67</span>
            <span>Day 90</span>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 px-4">
        {/* 2nd Place */}
        <div className="flex flex-col items-center">
          <div className="w-full rounded-xl bg-card border border-white/30 p-4 flex flex-col items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)] h-full">
            <div className="text-2xl font-bold text-white/60 font-mono">#2</div>
            <img
              src={topPlayers[1].avatar || "/placeholder.svg"}
              alt={topPlayers[1].username}
              className="w-16 h-16 rounded-full border-4 border-white/30 ring-4 ring-white/10 object-cover"
            />
            <div className="text-center">
              <p className="font-bold tracking-tight text-sm">{topPlayers[1].username}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">{topPlayers[1].winRate}% WR</p>
            </div>
            <div className="mt-auto pt-3 border-t border-white/10 w-full text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Total <CurrencySymbol />
              </p>
              <p className="text-lg font-bold text-white font-mono">{topPlayers[1].points.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center -mt-4">
          <div className="w-full rounded-xl bg-card border-2 border-amber-500/50 p-5 flex flex-col items-center gap-3 shadow-[0_0_40px_rgba(245,158,11,0.2)] h-full">
            <Trophy className="w-8 h-8 text-amber-400" />
            <img
              src={topPlayers[0].avatar || "/placeholder.svg"}
              alt={topPlayers[0].username}
              className="w-20 h-20 rounded-full border-4 border-amber-500/50 ring-4 ring-amber-500/20 object-cover"
            />
            <div className="text-center">
              <p className="font-bold tracking-tight">{topPlayers[0].username}</p>
              <p className="text-xs text-amber-400 font-mono mt-1">{topPlayers[0].winRate}% WR</p>
            </div>
            <div className="mt-auto pt-3 border-t border-amber-500/20 w-full text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Total <CurrencySymbol />
              </p>
              <p className="text-xl font-bold text-amber-400 font-mono">{topPlayers[0].points.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center">
          <div className="w-full rounded-xl bg-card border border-orange-500/30 p-4 flex flex-col items-center gap-3 shadow-[0_0_30px_rgba(249,115,22,0.1)] h-full">
            <div className="text-2xl font-bold text-orange-400/60 font-mono">#3</div>
            <img
              src={topPlayers[2].avatar || "/placeholder.svg"}
              alt={topPlayers[2].username}
              className="w-16 h-16 rounded-full border-4 border-orange-500/30 ring-4 ring-orange-500/10 object-cover"
            />
            <div className="text-center">
              <p className="font-bold tracking-tight text-sm">{topPlayers[2].username}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">{topPlayers[2].winRate}% WR</p>
            </div>
            <div className="mt-auto pt-3 border-t border-orange-500/10 w-full text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Total <CurrencySymbol />
              </p>
              <p className="text-lg font-bold text-orange-400 font-mono">{topPlayers[2].points.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-white/5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span className="col-span-1">Rank</span>
          <span className="col-span-4">Trader</span>
          <span className="col-span-3 text-right">
            Total <CurrencySymbol />
          </span>
          <span className="col-span-2 text-right">Win Rate</span>
          <span className="col-span-2 text-right">P&L (7D)</span>
        </div>
        <div className="divide-y divide-border">
          {topPlayers.slice(3).map((player, idx) => (
            <div
              key={player.rank}
              className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${idx % 2 === 1 ? "bg-white/5" : ""}`}
            >
              <span className="col-span-1 font-mono font-bold text-muted-foreground">{player.rank}</span>
              <div className="col-span-4 flex items-center gap-3">
                <img src={player.avatar || "/placeholder.svg"} alt={player.username} className="w-8 h-8 rounded-full" />
                <span className="font-bold tracking-tight text-sm">{player.username}</span>
              </div>
              <span className="col-span-3 text-right font-mono font-semibold">{player.points.toLocaleString()}</span>
              <span className="col-span-2 text-right font-mono">{player.winRate}%</span>
              <span className="col-span-2 text-right font-mono font-bold flex items-center justify-end gap-1">
                {player.pnl >= 0 ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">+{player.pnl.toLocaleString()}</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-400">{player.pnl.toLocaleString()}</span>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current User Highlight */}
      <div className="rounded-xl bg-primary/10 border border-primary/20 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-4 items-center">
          <span className="col-span-1 font-mono font-bold text-primary">{currentUser.rank}</span>
          <div className="col-span-4 flex items-center gap-3">
            <img
              src={currentUser.avatar || "/placeholder.svg"}
              alt={currentUser.username}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <span className="font-bold tracking-tight text-sm">{currentUser.username}</span>
              <span className="ml-2 text-xs text-primary font-semibold uppercase">You</span>
            </div>
          </div>
          <span className="col-span-3 text-right font-mono font-semibold text-primary">
            {currentUser.points.toLocaleString()}
          </span>
          <span className="col-span-2 text-right font-mono">{currentUser.winRate}%</span>
          <span className="col-span-2 text-right font-mono font-bold flex items-center justify-end gap-1">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">+{currentUser.pnl.toLocaleString()}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

