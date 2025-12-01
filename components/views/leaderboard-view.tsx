"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Trophy, Gift, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/user-context"

type LeaderboardViewProps = {
  onBack: () => void
}

type Player = {
  rank: number
  id: string
  username: string
  avatar: string
  balance: number
  winRate: number
  totalWon: number
}

export function LeaderboardView({ onBack }: LeaderboardViewProps) {
  const { user } = useUser()
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const supabase = createClient()
      
      // Fetch top 50 by total_won (Net Profit)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, total_won, win_rate, balance')
        .order('total_won', { ascending: false })
        .limit(50)

      if (data) {
        const formatted = data.map((p: any, idx: number) => ({
          rank: idx + 1,
          id: p.id,
          username: p.username || `User ${p.id.slice(0, 4)}`,
          avatar: p.avatar_url || "/images/avatar.jpg",
          balance: p.balance,
          winRate: p.win_rate || 0,
          totalWon: p.total_won || 0
        }))
        setPlayers(formatted)
      }
      setIsLoading(false)
    }
    
    fetchLeaderboard()
  }, [])

  const top1 = players[0]
  const top2 = players[1]
  const top3 = players[2]
  const rest = players.slice(3)
  
  const currentUserStats = players.find(p => p.id === user?.id)

  // Dynamic Season Logic (Current Month)
  const TODAY = new Date()
  const currentYear = TODAY.getFullYear()
  const currentMonth = TODAY.getMonth() // 0-11

  const SEASON_START = new Date(currentYear, currentMonth, 1)
  // Day 0 of next month gets the last day of current month
  const SEASON_END = new Date(currentYear, currentMonth + 1, 0)
  
  const totalDuration = SEASON_END.getTime() - SEASON_START.getTime()
  const elapsed = TODAY.getTime() - SEASON_START.getTime()
  const daysLeft = Math.ceil((SEASON_END.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24))
  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
  
  const startLabel = SEASON_START.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  const endLabel = SEASON_END.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

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
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <span className="text-lg">🥇</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-amber-400 font-bold">#1</p>
              <p className="text-sm font-medium truncate">Setup Gaming</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/20">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <span className="text-lg">🥈</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white/60 font-bold">#2</p>
              <p className="text-sm font-medium truncate">iPhone 16 Pro</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-orange-500/30">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
              <span className="text-lg">🥉</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-orange-400 font-bold">#3</p>
              <p className="text-sm font-medium truncate">Pass Festival</p>
            </div>
          </div>
        </div>
      </div>

      {/* Season Progress */}
      <div className="rounded-xl bg-white/5 border border-white/20 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saison 1</p>
            <p className="text-2xl font-bold tracking-tight text-white">
              <span className="font-mono">{daysLeft}</span> jours restants
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
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>{startLabel}</span>
            <span>{endLabel}</span>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 px-4 items-end min-h-[240px]">
        {/* 2nd Place */}
        <div className="flex flex-col items-center w-full">
          {top2 ? (
            <div className="w-full rounded-xl bg-card border border-white/30 p-3 flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)] h-[190px] justify-between">
              <div className="text-xl font-bold text-white/60 font-mono">#2</div>
              <img
                src={top2.avatar}
                alt={top2.username}
                className="w-12 h-12 rounded-full border-4 border-white/30 ring-4 ring-white/10 object-cover"
              />
              <div className="text-center w-full overflow-hidden">
                <p className="font-bold tracking-tight text-xs truncate px-1">{top2.username}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{top2.winRate}% WR</p>
              </div>
              <div className="pt-2 border-t border-white/10 w-full text-center">
                <p className="text-sm font-bold text-white font-mono truncate">
                  +{top2.totalWon.toLocaleString()} <CurrencySymbol className="w-2.5 h-2.5 inline" />
                </p>
              </div>
            </div>
          ) : <div className="h-[190px] w-full bg-white/5 rounded-xl animate-pulse" />}
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center w-full z-10">
          {top1 ? (
            <div className="w-full rounded-xl bg-card border-2 border-amber-500/50 p-4 flex flex-col items-center gap-2 shadow-[0_0_40px_rgba(245,158,11,0.2)] h-[230px] justify-between scale-110 origin-bottom">
              <Trophy className="w-6 h-6 text-amber-400" />
              <img
                src={top1.avatar}
                alt={top1.username}
                className="w-14 h-14 rounded-full border-4 border-amber-500/50 ring-4 ring-amber-500/20 object-cover"
              />
              <div className="text-center w-full overflow-hidden">
                <p className="font-bold tracking-tight text-sm truncate px-1">{top1.username}</p>
                <p className="text-[10px] text-amber-400 font-mono mt-0.5">{top1.winRate}% WR</p>
              </div>
              <div className="pt-2 border-t border-amber-500/20 w-full text-center">
                <p className="text-base font-bold text-amber-400 font-mono truncate">
                  +{top1.totalWon.toLocaleString()} <CurrencySymbol className="w-3 h-3 inline" />
                </p>
              </div>
            </div>
          ) : <div className="h-[230px] w-full bg-white/5 rounded-xl animate-pulse" />}
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center w-full">
          {top3 ? (
            <div className="w-full rounded-xl bg-card border border-orange-500/30 p-3 flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(249,115,22,0.1)] h-[170px] justify-between">
              <div className="text-xl font-bold text-orange-400/60 font-mono">#3</div>
              <img
                src={top3.avatar}
                alt={top3.username}
                className="w-12 h-12 rounded-full border-4 border-orange-500/30 ring-4 ring-orange-500/10 object-cover"
              />
              <div className="text-center w-full overflow-hidden">
                <p className="font-bold tracking-tight text-xs truncate px-1">{top3.username}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{top3.winRate}% WR</p>
              </div>
              <div className="pt-2 border-t border-orange-500/10 w-full text-center">
                <p className="text-sm font-bold text-orange-400 font-mono truncate">
                  +{top3.totalWon.toLocaleString()} <CurrencySymbol className="w-2.5 h-2.5 inline" />
                </p>
              </div>
            </div>
          ) : <div className="h-[170px] w-full bg-white/5 rounded-xl animate-pulse" />}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-white/5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span className="col-span-1">Rank</span>
          <span className="col-span-5">Joueur</span>
          <span className="col-span-3 text-right">Gains Total</span>
          <span className="col-span-3 text-right">Win Rate</span>
        </div>
        <div className="divide-y divide-border">
          {rest.map((player, idx) => (
            <div
              key={player.id}
              className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${idx % 2 === 1 ? "bg-white/5" : ""} ${player.id === user?.id ? "bg-primary/10" : ""}`}
            >
              <span className="col-span-1 font-mono font-bold text-muted-foreground">#{player.rank}</span>
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <img src={player.avatar} alt={player.username} className="w-8 h-8 rounded-full shrink-0 object-cover" />
                <span className={`font-bold tracking-tight text-sm truncate ${player.id === user?.id ? "text-primary" : ""}`}>
                  {player.username} {player.id === user?.id && "(Vous)"}
                </span>
              </div>
              <span className={`col-span-3 text-right font-mono font-bold flex items-center justify-end gap-1 ${player.totalWon >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {player.totalWon >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {player.totalWon.toLocaleString()} <CurrencySymbol className="w-3 h-3" />
              </span>
              <span className="col-span-3 text-right font-mono font-medium text-muted-foreground">{player.winRate}%</span>
            </div>
          ))}
          {rest.length === 0 && players.length > 3 && (
             <div className="p-8 text-center text-muted-foreground">Fin du classement</div>
          )}
          {players.length <= 3 && rest.length === 0 && (
             <div className="p-8 text-center text-muted-foreground">Pas encore assez de joueurs pour remplir le tableau !</div>
          )}
        </div>
      </div>

      {/* Current User Highlight (if not in view) */}
      {currentUserStats && currentUserStats.rank > 50 && (
        <div className="rounded-xl bg-primary/10 border border-primary/20 overflow-hidden sticky bottom-4 shadow-lg backdrop-blur-md">
          <div className="grid grid-cols-12 gap-2 px-4 py-4 items-center">
            <span className="col-span-1 font-mono font-bold text-primary">#{currentUserStats.rank}</span>
            <div className="col-span-5 flex items-center gap-3">
              <img
                src={currentUserStats.avatar}
                alt={currentUserStats.username}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <span className="font-bold tracking-tight text-sm">{currentUserStats.username}</span>
                <span className="ml-2 text-xs text-primary font-semibold uppercase">Vous</span>
              </div>
            </div>
            <span className="col-span-3 text-right font-mono font-bold text-primary">
              {currentUserStats.totalWon.toLocaleString()} <CurrencySymbol className="w-3 h-3 inline" />
            </span>
            <span className="col-span-3 text-right font-mono">{currentUserStats.winRate}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
