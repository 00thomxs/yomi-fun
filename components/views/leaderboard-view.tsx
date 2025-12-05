"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Trophy, Gift, ArrowUpRight, ArrowDownRight, Coins, Calendar, Sparkles } from "lucide-react"
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
      
      // 1. Fetch Season Settings
      try {
        const settings = await getSeasonSettings()
        setSeasonSettings(settings)
        
        // 2. Check if season ended and auto-distribute rewards
        if (settings?.is_active) {
          const { distributed, message } = await checkAndDistributeRewards()
          if (distributed) {
            toast.success(message || "Récompenses distribuées !")
            // Refresh settings after distribution
            const newSettings = await getSeasonSettings()
            setSeasonSettings(newSettings)
            // Page will need to be refreshed to see new balance
            window.location.reload()
          }
        }
      } catch (e) {
        console.error("Failed to fetch season settings", e)
      }
      
      // 3. Fetch top 50 by total_won (Net Profit)
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
    
    fetchData()
  }, [])

  const top1 = players[0]
  const top2 = players[1]
  const top3 = players[2]
  const rest = players.slice(3)
  
  const currentUserStats = players.find(p => p.id === user?.id)

  // Season Logic - Only show season info if is_active is true
  const hasSeason = seasonSettings?.is_active === true
  const seasonEnd = seasonSettings ? new Date(seasonSettings.season_end) : new Date()
  const now = new Date()
  const daysLeft = Math.max(0, Math.ceil((seasonEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const hoursLeft = Math.max(0, Math.ceil((seasonEnd.getTime() - now.getTime()) / (1000 * 60 * 60)))
  
  // Format countdown
  const getCountdown = () => {
    if (daysLeft > 0) return `${daysLeft} jour${daysLeft > 1 ? 's' : ''}`
    if (hoursLeft > 0) return `${hoursLeft} heure${hoursLeft > 1 ? 's' : ''}`
    return "Bientôt terminée"
  }

  // Zeny Rewards - Rank 1 gets cash_prize + zeny_rewards[0], others get zeny_rewards[rank-1]
  const getZenyReward = (rank: number) => {
    if (!seasonSettings?.zeny_rewards) return 0
    if (rank === 1) {
      return (seasonSettings.cash_prize || 0) + (seasonSettings.zeny_rewards[0] || 0)
    }
    return seasonSettings.zeny_rewards[rank - 1] || 0
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
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase">Classement</h2>
          {hasSeason ? (
            <p className="text-xs text-primary font-medium flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Saison en cours
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Classement Global (Hors Saison)</p>
          )}
        </div>
      </div>

      {/* Season Info & Rewards */}
      {hasSeason && (
        <>
          <div className="rounded-xl bg-gradient-to-r from-amber-500/20 via-primary/20 to-amber-500/20 border border-amber-500/30 p-5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Trophy className="w-32 h-32 rotate-12" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold tracking-tight uppercase text-amber-400">Récompenses Saison</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/10">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-mono font-bold text-white">Fin dans {getCountdown()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1st Place - Grand Prize */}
                <div className="col-span-1 md:col-span-3 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/30 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                      🥇
                    </div>
                    <div>
                      <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">1ère Place</p>
                      <p className="text-lg font-black text-white">{seasonSettings?.top1_prize}</p>
                      <p className="text-xs text-muted-foreground mt-1">+ Prix physique exclusif</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Récompense Totale</p>
                    <p className="text-xl font-mono font-bold text-amber-400 flex items-center justify-end gap-1">
                      <Sparkles className="w-4 h-4" />
                      +{getZenyReward(1).toLocaleString()} <CurrencySymbol />
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      ({seasonSettings?.cash_prize?.toLocaleString()} Cash + {seasonSettings?.zeny_rewards?.[0]?.toLocaleString()} Bonus)
                    </p>
                  </div>
                </div>

                {/* 2nd Place */}
                <div className="flex flex-col gap-2 p-4 rounded-lg bg-black/30 border border-white/20">
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">🥈</span>
                    <span className="text-xs font-bold text-white/60">#2</span>
                  </div>
                  <p className="font-bold text-sm truncate">{seasonSettings?.top2_prize || 'Prix physique'}</p>
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-lg font-mono font-bold text-primary">
                      +{getZenyReward(2).toLocaleString()} Z
                    </p>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col gap-2 p-4 rounded-lg bg-black/30 border border-orange-500/30">
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">🥉</span>
                    <span className="text-xs font-bold text-orange-400">#3</span>
                  </div>
                  <p className="font-bold text-sm truncate">{seasonSettings?.top3_prize || 'Prix physique'}</p>
                  <div className="pt-2 border-t border-orange-500/10">
                    <p className="text-lg font-mono font-bold text-orange-400">
                      +{getZenyReward(3).toLocaleString()} Z
                    </p>
                  </div>
                </div>
              </div>

              {/* Ranks 4-10 Rewards Summary */}
              <div className="mt-4 p-3 rounded-lg bg-black/20 border border-white/5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bonus Zeny (Top 4-10)</p>
                <div className="flex flex-wrap gap-2">
                  {[4, 5, 6, 7, 8, 9, 10].map(rank => {
                    const reward = getZenyReward(rank)
                    if (reward <= 0) return null
                    return (
                      <span key={rank} className="px-2 py-1 rounded bg-white/5 text-xs font-mono">
                        #{rank}: <span className="text-primary font-bold">+{reward.toLocaleString()}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 px-4 items-end min-h-[240px]">
        {/* 2nd Place */}
        <div className="flex flex-col items-center w-full">
          {top2 ? (
            <div className="w-full rounded-xl bg-card border border-white/30 p-3 flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)] h-[190px] justify-between relative overflow-hidden">
              <div className="text-xl font-bold text-white/60 font-mono">#2</div>
              <img
                src={top2.avatar}
                alt={top2.username}
                className="w-12 h-12 rounded-full border-4 border-white/30 ring-4 ring-white/10 object-cover relative z-10"
              />
              <div className="text-center w-full overflow-hidden relative z-10">
                <p className="font-bold tracking-tight text-xs truncate px-1">{top2.username}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{top2.winRate}% WR</p>
              </div>
              <div className="pt-2 border-t border-white/10 w-full text-center relative z-10">
                <p className="text-sm font-bold text-white font-mono truncate">
                  +{top2.totalWon.toLocaleString()} <CurrencySymbol className="w-2.5 h-2.5 inline" />
                </p>
                {hasSeason && getZenyReward(2) > 0 && (
                  <div className="mt-1 px-2 py-0.5 rounded-full bg-primary/20 text-[9px] text-primary font-bold inline-block">
                    +{getZenyReward(2).toLocaleString()} Z
                  </div>
                )}
              </div>
            </div>
          ) : <div className="h-[190px] w-full bg-white/5 rounded-xl animate-pulse" />}
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center w-full z-10">
          {top1 ? (
            <div className="w-full rounded-xl bg-card border-2 border-amber-500/50 p-4 flex flex-col items-center gap-2 shadow-[0_0_40px_rgba(245,158,11,0.2)] h-[230px] justify-between scale-110 origin-bottom relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />
              <Trophy className="w-6 h-6 text-amber-400 relative z-10" />
              <img
                src={top1.avatar}
                alt={top1.username}
                className="w-14 h-14 rounded-full border-4 border-amber-500/50 ring-4 ring-amber-500/20 object-cover relative z-10"
              />
              <div className="text-center w-full overflow-hidden relative z-10">
                <p className="font-bold tracking-tight text-sm truncate px-1">{top1.username}</p>
                <p className="text-[10px] text-amber-400 font-mono mt-0.5">{top1.winRate}% WR</p>
              </div>
              <div className="pt-2 border-t border-amber-500/20 w-full text-center relative z-10">
                <p className="text-base font-bold text-amber-400 font-mono truncate">
                  +{top1.totalWon.toLocaleString()} <CurrencySymbol className="w-3 h-3 inline" />
                </p>
                {hasSeason && getZenyReward(1) > 0 && (
                  <div className="mt-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-[9px] text-amber-400 font-bold inline-block border border-amber-500/30">
                    +{getZenyReward(1).toLocaleString()} Z
                  </div>
                )}
              </div>
            </div>
          ) : <div className="h-[230px] w-full bg-white/5 rounded-xl animate-pulse" />}
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center w-full">
          {top3 ? (
            <div className="w-full rounded-xl bg-card border border-orange-500/30 p-3 flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(249,115,22,0.1)] h-[170px] justify-between relative overflow-hidden">
              <div className="text-xl font-bold text-orange-400/60 font-mono">#3</div>
              <img
                src={top3.avatar}
                alt={top3.username}
                className="w-12 h-12 rounded-full border-4 border-orange-500/30 ring-4 ring-orange-500/10 object-cover relative z-10"
              />
              <div className="text-center w-full overflow-hidden relative z-10">
                <p className="font-bold tracking-tight text-xs truncate px-1">{top3.username}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{top3.winRate}% WR</p>
              </div>
              <div className="pt-2 border-t border-orange-500/10 w-full text-center relative z-10">
                <p className="text-sm font-bold text-orange-400 font-mono truncate">
                  +{top3.totalWon.toLocaleString()} <CurrencySymbol className="w-2.5 h-2.5 inline" />
                </p>
                {hasSeason && getZenyReward(3) > 0 && (
                  <div className="mt-1 px-2 py-0.5 rounded-full bg-primary/20 text-[9px] text-primary font-bold inline-block">
                    +{getZenyReward(3).toLocaleString()} Z
                  </div>
                )}
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
          <span className="col-span-3 text-right">Gains</span>
          <span className="col-span-3 text-right">Reward</span>
        </div>
        <div className="divide-y divide-border">
          {rest.map((player, idx) => {
            const actualRank = idx + 4 // Because we sliced 3
            const reward = getZenyReward(actualRank)
            
            return (
              <div
                key={player.id}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${idx % 2 === 1 ? "bg-white/5" : ""} ${player.id === user?.id ? "bg-primary/10" : ""}`}
              >
                <span className="col-span-1 font-mono font-bold text-muted-foreground">#{actualRank}</span>
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <img src={player.avatar} alt={player.username} className="w-8 h-8 rounded-full shrink-0 object-cover" />
                  <span className={`font-bold tracking-tight text-sm truncate ${player.id === user?.id ? "text-primary" : ""}`}>
                    {player.username} {player.id === user?.id && "(Moi)"}
                  </span>
                </div>
                <span className={`col-span-3 text-right font-mono font-bold flex items-center justify-end gap-1 ${player.totalWon >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {player.totalWon >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {player.totalWon.toLocaleString()}
                </span>
                <span className="col-span-3 text-right font-mono font-medium">
                  {hasSeason && reward > 0 ? (
                    <span className="text-primary text-xs bg-primary/10 px-2 py-1 rounded-full">
                      +{reward.toLocaleString()} Z
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </span>
              </div>
            )
          })}
          {rest.length === 0 && players.length > 3 && (
             <div className="p-8 text-center text-muted-foreground">Fin du classement</div>
          )}
          {players.length <= 3 && rest.length === 0 && (
             <div className="p-8 text-center text-muted-foreground">Pas encore assez de joueurs pour remplir le tableau !</div>
          )}
        </div>
      </div>
    </div>
  )
}
