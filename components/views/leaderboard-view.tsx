"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Trophy, ArrowUpRight, ArrowDownRight, Flame, Gift, Calendar, Sparkles, Medal, Target, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { BadgeDisplayCompact, BadgeIcon } from "@/components/ui/badge-display"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/user-context"
import { getSeasonSettings, checkAndDistributeRewards, type SeasonSettings } from "@/app/admin/settings/actions"
import { toast } from "sonner"
import { getAvatarUrl } from "@/lib/utils/avatar"
import type { Badge } from "@/lib/types"

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

type SeasonEvent = {
  id: string
  question: string
  status: string
  closes_at: string
  volume: number
}

// Equipped badges by user ID
type EquippedBadgesMap = Record<string, Badge[]>

export function LeaderboardView({ onBack }: LeaderboardViewProps) {
  const { user } = useUser()
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMetaLoading, setIsMetaLoading] = useState(true) // season settings + activeSeasonId bootstrap
  const [seasonSettings, setSeasonSettings] = useState<SeasonSettings | null>(null)
  const [viewMode, setViewMode] = useState<'season' | 'global'>('season') // Toggle state
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null)
  const [seasonEvents, setSeasonEvents] = useState<SeasonEvent[]>([])
  const [eventsExpanded, setEventsExpanded] = useState(false)
  const [equippedBadges, setEquippedBadges] = useState<EquippedBadgesMap>({})
  const rewardsCheckedRef = useRef(false)

  // Fetch season settings on mount
  useEffect(() => {
    let isMounted = true
    
    const fetchSeasonSettings = async () => {
      if (isMounted) setIsMetaLoading(true)
      try {
        const settings = await getSeasonSettings()
        if (!isMounted) return
        
        setSeasonSettings(settings)
        
        if (settings?.is_active) {
          // Get active season ID from seasons table
          const supabase = createClient()
          const { data: activeSeason, error: activeSeasonError } = await supabase
            .from('seasons')
            .select('id')
            .eq('is_active', true)
            .single()
          
          if (!isMounted) return
          
          if (!activeSeasonError && activeSeason) {
            setActiveSeasonId(activeSeason.id)
            // Ensure we stay in season mode when season is active
            setViewMode('season')
          } else {
            // Season settings says active but no season found in seasons table
            // Fallback to global
            setViewMode('global')
            setActiveSeasonId(null)
          }
        } else {
          // If no active season, default to global view
          setViewMode('global')
          setActiveSeasonId(null)
        }
      } catch (e) {
        console.error("Failed to fetch season settings", e)
        if (isMounted) {
          setViewMode('global')
          setActiveSeasonId(null)
        }
      } finally {
        if (isMounted) setIsMetaLoading(false)
      }
    }
    
    fetchSeasonSettings()
    
    return () => {
      isMounted = false
    }
  }, [])

  // Admin-only: check/distribute rewards (avoid doing this for normal users on every refresh)
  useEffect(() => {
    if (rewardsCheckedRef.current) return
    if (!user?.role || user.role !== 'admin') return
    if (!seasonSettings?.is_active) return

    rewardsCheckedRef.current = true

    const run = async () => {
      try {
        const { distributed, message } = await checkAndDistributeRewards()
        if (distributed) {
          toast.success(message || "Récompenses distribuées !")
          const newSettings = await getSeasonSettings()
          setSeasonSettings(newSettings)
          if (!newSettings?.is_active) {
            setViewMode('global')
            setActiveSeasonId(null)
          }
        }
      } catch (e) {
        console.error("checkAndDistributeRewards failed", e)
      }
    }

    run()
  }, [user?.role, seasonSettings?.is_active])

  // Fetch season events when there's an active season
  useEffect(() => {
    const fetchSeasonEvents = async () => {
      if (!activeSeasonId) {
        setSeasonEvents([])
        return
      }
      
      const supabase = createClient()
      const { data } = await supabase
        .from('markets')
        .select('id, question, status, closes_at, volume')
        .eq('season_id', activeSeasonId)
        .order('closes_at', { ascending: true })
      
      if (data) {
        setSeasonEvents(data)
      }
    }
    
    fetchSeasonEvents()
  }, [activeSeasonId])

  // Fetch leaderboard data based on viewMode
  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Wait for bootstrap (season settings + active season id) to finish
      if (isMetaLoading) return
      
      setIsLoading(true)
      const supabase = createClient()
      
      if (viewMode === 'season' && activeSeasonId) {
        // Fetch from season_leaderboards
        const { data } = await supabase
          .from('season_leaderboards')
          .select(`
            user_id,
            points,
            wins,
            losses,
            total_bet_amount,
            profiles!inner (
              id,
              username,
              avatar_url,
              role
            )
          `)
          .eq('season_id', activeSeasonId)
          .neq('profiles.role', 'admin')
          .order('points', { ascending: false })
          .limit(10)

        if (data) {
          const formatted = data.map((entry: any, idx: number) => {
            const totalBets = entry.wins + entry.losses
            const winRate = totalBets > 0 ? Math.round((entry.wins / totalBets) * 100) : 0
            return {
              rank: idx + 1,
              id: entry.profiles.id,
              username: entry.profiles.username || `User ${entry.profiles.id.slice(0, 4)}`,
              avatar: getAvatarUrl(entry.profiles.avatar_url),
              balance: 0, // Not relevant for season view
              winRate: winRate,
              totalWon: entry.points // points = PnL for the season
            }
          })
          setPlayers(formatted)
        } else {
          // No season data yet, show empty
          setPlayers([])
        }
      } else {
        // Fetch from profiles (global)
        const { data } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, total_won, win_rate, balance, role')
          .neq('role', 'admin')
          .order('total_won', { ascending: false })
          .limit(10)

        if (data) {
          const formatted = data.map((p: any, idx: number) => ({
            rank: idx + 1,
            id: p.id,
            username: p.username || `User ${p.id.slice(0, 4)}`,
            avatar: getAvatarUrl(p.avatar_url),
            balance: p.balance,
            winRate: p.win_rate || 0,
            totalWon: p.total_won || 0
          }))
          setPlayers(formatted)
        }
      }
      
      setIsLoading(false)
    }
    
    fetchLeaderboard()
  }, [viewMode, activeSeasonId, seasonSettings?.is_active, isMetaLoading])

  // Fetch equipped badges for all players
  useEffect(() => {
    const fetchBadges = async () => {
      if (players.length === 0) return
      
      const supabase = createClient()
      const playerIds = players.map(p => p.id)
      
      const { data } = await supabase
        .from('user_badges')
        .select(`
          user_id,
          badge:badges(*)
        `)
        .in('user_id', playerIds)
        .eq('is_equipped', true)
      
      if (data) {
        const badgesMap: EquippedBadgesMap = {}
        for (const entry of data as any[]) {
          const badge = entry.badge
          if (!badge) continue
          if (!badgesMap[entry.user_id]) {
            badgesMap[entry.user_id] = []
          }
          // Handle both single object and array cases from Supabase
          if (Array.isArray(badge)) {
            badgesMap[entry.user_id].push(...badge)
          } else {
            badgesMap[entry.user_id].push(badge)
          }
        }
        setEquippedBadges(badgesMap)
      }
    }
    
    fetchBadges()
  }, [players])

  const top1 = players[0]
  const top2 = players[1]
  const top3 = players[2]
  const rest = players.slice(3)

  // Season Logic
  const hasSeason = seasonSettings?.is_active === true
  const seasonEnd = seasonSettings ? new Date(seasonSettings.season_end) : new Date()
  // Use updated_at as season start (it's set when season is started)
  const seasonStart = seasonSettings?.updated_at ? new Date(seasonSettings.updated_at) : new Date()
  const now = new Date()
  
  // Check if season time has elapsed (even if is_active is still true)
  const isSeasonTimeElapsed = hasSeason && seasonEnd.getTime() < now.getTime()
  
  // Calculate time remaining
  const timeLeftMs = Math.max(0, seasonEnd.getTime() - now.getTime())
  const minutesLeft = Math.floor(timeLeftMs / (1000 * 60))
  const hoursLeftTotal = Math.floor(timeLeftMs / (1000 * 60 * 60))
  const daysLeftTotal = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24))
  
  // Calculate progress correctly (from season start to season end)
  const totalDuration = Math.max(1, seasonEnd.getTime() - seasonStart.getTime())
  const elapsed = now.getTime() - seasonStart.getTime()
  const progressRaw = (elapsed / totalDuration) * 100
  const progress = Math.min(100, Math.max(0, progressRaw))
  
  const getCountdown = () => {
    if (timeLeftMs <= 0) return "Terminée"
    
    if (daysLeftTotal > 0) {
      const hours = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      return `${daysLeftTotal}j ${hours}h`
    }
    
    if (hoursLeftTotal > 0) {
      const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60))
      return `${hoursLeftTotal}h ${minutes}min`
    }
    
    if (minutesLeft > 0) return `${minutesLeft} min`
    return "< 1 min"
  }

  // Zeny Rewards - Rank 1 gets ONLY cash_prize, others get zeny_rewards[rank-1]
  // Only show rewards in season view mode
  const getZenyReward = (rank: number) => {
    if (!hasSeason || viewMode !== 'season') return 0
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2.5 rounded-lg bg-card border border-border hover:border-white/20 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase">Classement</h2>
            {viewMode === 'season' && hasSeason ? (
            <p className={`text-xs font-medium flex items-center gap-1 max-w-[250px] truncate ${isSeasonTimeElapsed ? 'text-muted-foreground' : 'text-primary'}`}>
              <Trophy className="w-3 h-3 shrink-0" /> 
              {seasonSettings?.title || "Saison"} 
              {isSeasonTimeElapsed && <span className="text-[10px] opacity-60">(terminée)</span>}
            </p>
          ) : (
              <p className="text-xs text-muted-foreground">Classement Global (All-time)</p>
          )}
        </div>
        </div>
        
        {/* Toggle Saison / Global */}
        {hasSeason && (
          <div className="flex items-center gap-1 p-1 rounded-lg bg-card border border-white/10">
            <button
              onClick={() => setViewMode('season')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === 'season'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Flame className="w-3 h-3" />
                Saison
              </span>
            </button>
            <button
              onClick={() => setViewMode('global')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === 'global'
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3 h-3" />
                Global
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Last Season Winners Banner - REMOVED: Now redundant since Saison tab stays visible when season ends */}

      {/* Season Banner - Only show in season view mode */}
      {hasSeason && viewMode === 'season' && (
        <div className="space-y-6 flex flex-col items-center">
          {/* Rewards Card - Golden Border Style */}
          <div className="w-full max-w-[95%] rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-500/30 p-6 relative overflow-hidden shadow-2xl shadow-amber-500/5">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Trophy className="w-32 h-32 rotate-12 text-amber-500" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                  <Gift className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold tracking-widest uppercase text-amber-400">Récompenses Saison</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1st Place */}
                  <div className="flex items-center gap-4 bg-amber-500/5 rounded-xl p-3 border border-amber-500/10">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0">
                      <Trophy className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-400">1ère Place</p>
                    <p className="text-sm font-bold text-white leading-tight">{seasonSettings?.top1_prize}</p>
                  </div>
                </div>

                {/* 2nd Place */}
                <div className="flex items-center gap-4 bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg shrink-0">
                    <Medal className="w-5 h-5 text-white/80" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/60">2ème Place</p>
                    <p className="text-sm font-bold text-white leading-tight">{seasonSettings?.top2_prize}</p>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex items-center gap-4 bg-orange-500/5 rounded-xl p-3 border border-orange-500/10">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-lg shrink-0">
                    <Medal className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-500/80">3ème Place</p>
                    <p className="text-sm font-bold text-white leading-tight">{seasonSettings?.top3_prize}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress & Status Bar */}
          <div className={`w-full max-w-[90%] rounded-xl border bg-card p-4 relative overflow-hidden shadow-lg mb-2 ${
            isSeasonTimeElapsed ? 'border-muted-foreground/30' : 'border-white/10'
          }`}>
            {/* Background glow */}
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
              isSeasonTimeElapsed ? 'bg-muted-foreground/10' : 'bg-primary/10'
            }`} />
            
            <div className="flex items-end justify-between mb-3 relative z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  {isSeasonTimeElapsed ? 'Saison terminée' : 'Saison en cours'}
                </p>
                {isSeasonTimeElapsed ? (
                  <p className="text-2xl font-black text-muted-foreground flex items-baseline gap-2 tabular-nums tracking-tight">
                    Terminée
                  </p>
                ) : (
                  <p className="text-2xl font-black text-white flex items-baseline gap-2 tabular-nums tracking-tight">
                    {getCountdown()} <span className="text-sm font-bold text-muted-foreground/50 uppercase">restants</span>
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Cash Prize</p>
                <p className="text-xl font-black text-primary flex items-center justify-end gap-1">
                  {(seasonSettings?.cash_prize || 0).toLocaleString()}<CurrencySymbol className="w-4 h-4" />
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-out rounded-full ${
                  isSeasonTimeElapsed 
                    ? 'bg-gradient-to-r from-muted-foreground/60 to-muted-foreground/40' 
                    : 'bg-gradient-to-r from-rose-600 via-primary to-orange-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]'
                }`}
                style={{ width: `${progress}%` }}
              >
                {!isSeasonTimeElapsed && (
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                )}
              </div>
            </div>
            
            <div className="flex justify-between mt-2 text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider font-bold">
              <span>Début</span>
              <span>Fin</span>
            </div>
          </div>

          {/* Season Events */}
          {seasonEvents.length > 0 && (
            <div className="w-full max-w-[95%] rounded-xl border border-white/10 bg-card p-4 relative overflow-hidden">
              <button 
                onClick={() => setEventsExpanded(!eventsExpanded)}
                className="w-full flex items-center justify-between mb-3"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/80">
                    Events de la saison
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                    {seasonEvents.length}
                  </span>
                </div>
                <span className={`text-xs text-muted-foreground transition-transform ${eventsExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {eventsExpanded && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  {seasonEvents.map((event) => {
                    const isResolved = event.status === 'resolved'
                    const closesAt = new Date(event.closes_at)
                    const now = new Date()
                    const isExpired = closesAt < now && !isResolved
                    
                    return (
                      <Link
                        key={event.id}
                        href={`/market/${event.id}`}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-white/5 ${
                          isResolved 
                            ? 'bg-emerald-500/5 border-emerald-500/20' 
                            : isExpired
                              ? 'bg-amber-500/5 border-amber-500/20'
                              : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {isResolved ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <p className="text-sm font-medium truncate">{event.question}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            {event.volume?.toLocaleString() || 0} vol
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isResolved 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : isExpired
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-primary/10 text-primary'
                          }`}>
                            {isResolved ? 'Terminé' : isExpired ? 'En attente' : 'Live'}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end px-1 sm:px-8 pt-0 pb-0 max-w-5xl mx-auto">
        {/* 2nd Place */}
        <div className="flex flex-col items-center w-full">
          {top2 ? (
            <div className="w-full h-[260px] rounded-xl bg-card border border-white/10 p-4 flex flex-col items-center justify-between relative overflow-hidden shadow-lg group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <span className="text-2xl font-black text-white/20 absolute top-2 left-3">#2</span>
              
              <div className="relative mt-4">
                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity" />
              <img
                src={top2.avatar}
                alt={top2.username}
                  className="w-16 h-16 rounded-full border-4 border-card ring-2 ring-white/20 object-cover relative z-10"
              />
              </div>
              
              <div className="text-center w-full relative z-10">
                <p className="font-bold text-sm truncate px-2">@{top2.username}</p>
                {equippedBadges[top2.id]?.length > 0 && (
                  <div className="flex justify-center gap-1 mt-1">
                    {equippedBadges[top2.id].slice(0, 2).map(badge => (
                      <span key={badge.id}>
                        <BadgeIcon badge={badge} className="sm:hidden w-5 h-5" />
                        <BadgeDisplayCompact badge={badge} className="hidden sm:inline-flex" />
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground font-mono mt-1">{top2.winRate}% WR</p>
              </div>
              
              <div className="w-full pt-3 border-t border-white/5 text-center relative z-10">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">PNL</p>
                <p className={`text-lg font-black font-mono flex items-center justify-center gap-1 ${top2.totalWon >= 0 ? 'text-white' : 'text-rose-400'}`}>
                  {top2.totalWon >= 0 ? '+' : ''}{Math.abs(top2.totalWon).toLocaleString()}
                </p>
                {hasSeason && getZenyReward(2) > 0 && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-white border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                    +{getZenyReward(2).toLocaleString()}<CurrencySymbol className="w-2 h-2" />
                  </span>
                )}
              </div>
            </div>
          ) : <div className="h-[260px] w-full bg-white/5 rounded-xl animate-pulse" />}
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center w-full z-10">
          {top1 ? (
            <div className="w-full h-[300px] rounded-xl bg-black border border-amber-500/50 p-5 flex flex-col items-center justify-between relative overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.15)] group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent opacity-50" />
              
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 bg-amber-500/20 blur-2xl rounded-full" />
              
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <Trophy className="w-8 h-8 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              </div>
              
              <div className="relative mt-10">
                <div className="absolute inset-0 bg-amber-500/30 blur-xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity" />
                <img 
                  src={top1.avatar} 
                  alt={top1.username}
                  className="w-20 h-20 rounded-full border-4 border-amber-500/30 ring-2 ring-amber-500/50 object-cover relative z-10"
                />
              </div>
              
              <div className="text-center w-full relative z-10">
                <p className="font-black text-base truncate px-2 text-amber-100">@{top1.username}</p>
                {equippedBadges[top1.id]?.length > 0 && (
                  <div className="flex justify-center gap-1 mt-1">
                    {equippedBadges[top1.id].slice(0, 2).map(badge => (
                      <span key={badge.id}>
                        <BadgeIcon badge={badge} className="sm:hidden w-5 h-5" />
                        <BadgeDisplayCompact badge={badge} className="hidden sm:inline-flex" />
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-amber-500/80 font-mono mt-1 font-bold">{top1.winRate}% WR</p>
              </div>
              
              <div className="w-full pt-3 border-t border-amber-500/20 text-center relative z-10">
                <p className="text-xs text-amber-500/60 uppercase tracking-wider mb-1">PNL</p>
                <p className={`text-xl sm:text-2xl font-black font-mono flex items-center justify-center gap-1 ${top1.totalWon >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {top1.totalWon >= 0 ? '+' : ''}{Math.abs(top1.totalWon).toLocaleString()}
                </p>
                {hasSeason && getZenyReward(1) > 0 && (
                  <span className="inline-flex items-center gap-1 mt-2 px-3 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    +{getZenyReward(1).toLocaleString()}<CurrencySymbol className="w-2 h-2" />
                  </span>
                )}
              </div>
            </div>
          ) : <div className="h-[300px] w-full bg-white/5 rounded-xl animate-pulse" />}
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center w-full">
          {top3 ? (
            <div className="w-full h-[230px] rounded-xl bg-card border border-orange-500/20 p-4 flex flex-col items-center justify-between relative overflow-hidden shadow-lg group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <span className="text-2xl font-black text-orange-500/20 absolute top-2 left-3">#3</span>
              
              <div className="relative mt-2">
                <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity" />
              <img
                src={top3.avatar}
                alt={top3.username}
                  className="w-16 h-16 rounded-full border-4 border-card ring-2 ring-orange-500/20 object-cover relative z-10"
              />
              </div>
              
              <div className="text-center w-full relative z-10">
                <p className="font-bold text-sm truncate px-2">@{top3.username}</p>
                {equippedBadges[top3.id]?.length > 0 && (
                  <div className="flex justify-center gap-1 mt-1">
                    {equippedBadges[top3.id].slice(0, 2).map(badge => (
                      <span key={badge.id}>
                        <BadgeIcon badge={badge} className="sm:hidden w-5 h-5" />
                        <BadgeDisplayCompact badge={badge} className="hidden sm:inline-flex" />
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground font-mono mt-1">{top3.winRate}% WR</p>
              </div>
              
              <div className="w-full pt-3 border-t border-orange-500/10 text-center relative z-10">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">PNL</p>
                <p className={`text-lg font-black font-mono flex items-center justify-center gap-1 ${top3.totalWon >= 0 ? 'text-orange-400' : 'text-rose-400'}`}>
                  {top3.totalWon >= 0 ? '+' : ''}{Math.abs(top3.totalWon).toLocaleString()}
                </p>
                {hasSeason && getZenyReward(3) > 0 && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-orange-500/10 text-[10px] font-bold text-orange-400 border border-orange-500/20">
                    +{getZenyReward(3).toLocaleString()}<CurrencySymbol className="w-2 h-2" />
                  </span>
                )}
              </div>
            </div>
          ) : <div className="h-[230px] w-full bg-white/5 rounded-xl animate-pulse" />}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-2 mt-4">
        {/* Header */}
        <div className="grid grid-cols-12 gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider sm:tracking-widest">
          <span className="col-span-1">#</span>
          <span className="col-span-5">Trader</span>
          <span className="col-span-2 text-center">WR</span>
          <span className="col-span-4 text-right">PnL</span>
        </div>
        
        {/* List */}
        <div className="space-y-2">
          {rest.map((player, idx) => {
            const actualRank = idx + 4
            const reward = getZenyReward(actualRank)
            const isMe = player.id === user?.id
            
            return (
              <div
                key={player.id}
                className={`grid grid-cols-12 gap-1 sm:gap-2 px-3 sm:px-4 py-3 items-center rounded-xl border transition-all ${
                  isMe 
                    ? "bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(220,38,38,0.1)]" 
                    : "bg-card border-white/5 hover:border-white/10"
                }`}
              >
                <span className="col-span-1 font-mono text-sm font-bold text-muted-foreground/50">#{actualRank}</span>
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <img src={player.avatar} alt={player.username} className="w-8 h-8 rounded-full shrink-0 object-cover bg-white/5" />
                  <div className="flex flex-col min-w-0 gap-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`font-bold text-sm truncate ${isMe ? "text-primary" : "text-foreground"}`}>
                        {player.username}
                      </span>
                      {equippedBadges[player.id]?.slice(0, 2).map(badge => (
                        <span key={badge.id}>
                          <BadgeIcon badge={badge} className="sm:hidden w-5 h-5" />
                          <BadgeDisplayCompact badge={badge} className="hidden sm:inline-flex" />
                        </span>
                      ))}
                    </div>
                    {hasSeason && reward > 0 && (
                      <span className="text-[9px] font-bold text-primary flex items-center gap-0.5">
                        +{reward.toLocaleString()}<CurrencySymbol className="w-2 h-2" />
                      </span>
                    )}
                  </div>
                </div>
                <span className="col-span-2 text-center text-xs font-mono font-medium text-muted-foreground">
                  {player.winRate}%
                </span>
                <span className={`col-span-4 text-right font-mono text-sm font-bold flex items-center justify-end gap-1 ${
                  player.totalWon >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {player.totalWon >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(player.totalWon).toLocaleString()}
                </span>
              </div>
            )
          })}
          {players.length <= 3 && (
            <div className="p-8 text-center text-sm text-muted-foreground italic border border-white/5 rounded-xl bg-card">
              Le classement se remplit...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
