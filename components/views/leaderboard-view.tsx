"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Trophy, ArrowUpRight, ArrowDownRight, Flame } from "lucide-react"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/user-context"
import { getSeasonSettings, checkAndDistributeRewards, type SeasonSettings } from "@/app/admin/settings/actions"
import { toast } from "sonner"

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
  const [seasonSettings, setSeasonSettings] = useState<SeasonSettings | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      try {
        const settings = await getSeasonSettings()
        setSeasonSettings(settings)
        
        if (settings?.is_active) {
          const { distributed, message } = await checkAndDistributeRewards()
          if (distributed) {
            toast.success(message || "Récompenses distribuées !")
            const newSettings = await getSeasonSettings()
            setSeasonSettings(newSettings)
            window.location.reload()
          }
        }
      } catch (e) {
        console.error("Failed to fetch season settings", e)
      }
      
      const { data } = await supabase
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
    
    fetchData()
  }, [])

  const top1 = players[0]
  const top2 = players[1]
  const top3 = players[2]
  const rest = players.slice(3)

  // Season Logic
  const hasSeason = seasonSettings?.is_active === true
  const seasonEnd = seasonSettings ? new Date(seasonSettings.season_end) : new Date()
  const seasonStart = seasonSettings ? new Date(seasonSettings.created_at || Date.now()) : new Date()
  const now = new Date()
  const totalDuration = seasonEnd.getTime() - seasonStart.getTime()
  const elapsed = now.getTime() - seasonStart.getTime()
  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
  const daysLeft = Math.max(0, Math.ceil((seasonEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  // Zeny Rewards - Rank 1 gets ONLY cash_prize, others get zeny_rewards[rank-1]
  const getZenyReward = (rank: number) => {
    if (!hasSeason) return 0
    if (rank === 1) {
      return seasonSettings?.cash_prize || 0
    }
    return seasonSettings?.zeny_rewards?.[rank - 1] || 0
  }

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
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase">Classement</h2>
          <p className="text-xs text-muted-foreground">
            {hasSeason ? "Saison en cours" : "Classement Global"}
          </p>
        </div>
      </div>

      {/* Season Progress Bar */}
      {hasSeason && (
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">Saison Active</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {daysLeft > 0 ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}` : 'Dernières heures !'}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
            {/* Cash Prize at the end */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
              <div className="px-2 py-1 rounded-full bg-amber-500 text-black text-[10px] font-bold whitespace-nowrap shadow-lg">
                {(seasonSettings?.cash_prize || 0).toLocaleString()} Z
              </div>
            </div>
          </div>
          
          {/* Physical Prizes */}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span><span className="text-amber-400 font-bold">1er</span> {seasonSettings?.top1_prize}</span>
            <span className="text-white/20">|</span>
            <span><span className="text-white/60 font-bold">2e</span> {seasonSettings?.top2_prize}</span>
            <span className="text-white/20">|</span>
            <span><span className="text-orange-400/60 font-bold">3e</span> {seasonSettings?.top3_prize}</span>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-3 items-end">
        {/* 2nd Place */}
        <div className="flex flex-col items-center">
          {top2 ? (
            <div className="w-full rounded-xl bg-card border border-white/10 p-3 flex flex-col items-center gap-2">
              <span className="text-lg font-bold text-white/40 font-mono">2</span>
              <img
                src={top2.avatar}
                alt={top2.username}
                className="w-14 h-14 rounded-full border-2 border-white/20 object-cover"
              />
              <div className="text-center w-full">
                <p className="font-bold text-sm truncate">{top2.username}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{top2.winRate}% WR</p>
              </div>
              <div className="w-full pt-2 border-t border-white/5 text-center">
                <p className={`text-sm font-bold font-mono ${top2.totalWon >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {top2.totalWon >= 0 ? '+' : ''}{top2.totalWon.toLocaleString()} Z
                </p>
                {hasSeason && getZenyReward(2) > 0 && (
                  <p className="text-[10px] text-primary mt-1">+{getZenyReward(2).toLocaleString()} Z</p>
                )}
              </div>
            </div>
          ) : <div className="h-40 w-full bg-white/5 rounded-xl animate-pulse" />}
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center -mt-4">
          {top1 ? (
            <div className="w-full rounded-xl bg-card border-2 border-amber-500/30 p-4 flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <Trophy className="w-5 h-5 text-amber-400" />
              <img
                src={top1.avatar}
                alt={top1.username}
                className="w-16 h-16 rounded-full border-2 border-amber-500/50 object-cover"
              />
              <div className="text-center w-full">
                <p className="font-bold text-sm truncate">{top1.username}</p>
                <p className="text-[10px] text-amber-400/80 font-mono">{top1.winRate}% WR</p>
              </div>
              <div className="w-full pt-2 border-t border-amber-500/20 text-center">
                <p className={`text-base font-bold font-mono ${top1.totalWon >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {top1.totalWon >= 0 ? '+' : ''}{top1.totalWon.toLocaleString()} Z
                </p>
                {hasSeason && getZenyReward(1) > 0 && (
                  <p className="text-[10px] text-amber-400 mt-1 font-bold">+{getZenyReward(1).toLocaleString()} Z</p>
                )}
              </div>
            </div>
          ) : <div className="h-48 w-full bg-white/5 rounded-xl animate-pulse" />}
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center">
          {top3 ? (
            <div className="w-full rounded-xl bg-card border border-orange-500/20 p-3 flex flex-col items-center gap-2">
              <span className="text-lg font-bold text-orange-400/40 font-mono">3</span>
              <img
                src={top3.avatar}
                alt={top3.username}
                className="w-14 h-14 rounded-full border-2 border-orange-500/20 object-cover"
              />
              <div className="text-center w-full">
                <p className="font-bold text-sm truncate">{top3.username}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{top3.winRate}% WR</p>
              </div>
              <div className="w-full pt-2 border-t border-orange-500/10 text-center">
                <p className={`text-sm font-bold font-mono ${top3.totalWon >= 0 ? 'text-orange-400' : 'text-rose-400'}`}>
                  {top3.totalWon >= 0 ? '+' : ''}{top3.totalWon.toLocaleString()} Z
                </p>
                {hasSeason && getZenyReward(3) > 0 && (
                  <p className="text-[10px] text-primary mt-1">+{getZenyReward(3).toLocaleString()} Z</p>
                )}
              </div>
            </div>
          ) : <div className="h-36 w-full bg-white/5 rounded-xl animate-pulse" />}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-white/5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          <span className="col-span-1">#</span>
          <span className="col-span-4">Joueur</span>
          <span className="col-span-2 text-center">WR</span>
          <span className="col-span-3 text-right">Gains</span>
          <span className="col-span-2 text-right">Reward</span>
        </div>
        <div className="divide-y divide-border/50">
          {rest.map((player, idx) => {
            const actualRank = idx + 4
            const reward = getZenyReward(actualRank)
            const isMe = player.id === user?.id
            
            return (
              <div
                key={player.id}
                className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center transition-colors ${
                  isMe ? "bg-primary/10" : idx % 2 === 1 ? "bg-white/[0.02]" : ""
                }`}
              >
                <span className="col-span-1 font-mono text-xs text-muted-foreground">{actualRank}</span>
                <div className="col-span-4 flex items-center gap-2 min-w-0">
                  <img src={player.avatar} alt={player.username} className="w-7 h-7 rounded-full shrink-0 object-cover" />
                  <span className={`font-medium text-sm truncate ${isMe ? "text-primary" : ""}`}>
                    {player.username}
                  </span>
                </div>
                <span className="col-span-2 text-center text-xs text-muted-foreground font-mono">
                  {player.winRate}%
                </span>
                <span className={`col-span-3 text-right font-mono text-sm font-medium flex items-center justify-end gap-1 ${
                  player.totalWon >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {player.totalWon >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(player.totalWon).toLocaleString()}
                </span>
                <span className="col-span-2 text-right">
                  {hasSeason && reward > 0 ? (
                    <span className="text-primary text-[10px] font-mono font-bold">
                      +{reward.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-white/20">-</span>
                  )}
                </span>
              </div>
            )
          })}
          {players.length <= 3 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Pas encore assez de joueurs
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
