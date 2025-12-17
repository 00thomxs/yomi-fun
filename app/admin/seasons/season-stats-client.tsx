'use client'

import { useState, useMemo } from 'react'
import { Trophy, Target, TrendingUp, TrendingDown, Zap, Users, BarChart3, Medal, Percent, Clock, ChevronRight } from 'lucide-react'
import { CurrencySymbol } from '@/components/ui/currency-symbol'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts'

type LeaderboardEntry = {
  user_id: string
  points: number
  wins: number
  losses: number
  total_bet_amount: number
  profiles?: {
    id: string
    username: string
    avatar_url: string
  } | null
}

type Event = {
  id: string
  question: string
  status: string
  volume: number
  created_at: string
}

type Bet = {
  id: string
  user_id: string
  market_id: string
  amount: number
  status: string
  potential_payout?: number
  profiles?: {
    id: string
    username: string
  } | null
  markets?: {
    question: string
  } | null
}

type PositionHistory = {
  user_id: string
  captured_at: string
  position: number
  points: number
  profiles?: {
    id: string
    username: string
  } | null
}

type SeasonStatsClientProps = {
  seasonId: string
  leaderboard: LeaderboardEntry[]
  events: Event[]
  bets: Bet[]
  positionHistory: PositionHistory[]
}

const COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16']

// Rank badge component - professional style
function RankBadge({ rank, size = 'sm' }: { rank: number; size?: 'sm' | 'md' }) {
  const colors = {
    1: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    2: 'bg-zinc-400/20 text-zinc-300 border-zinc-400/30',
    3: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
  }
  const cls = colors[rank as 1 | 2 | 3] || 'bg-white/5 text-muted-foreground border-white/10'
  const sizeClass = size === 'md' ? 'w-7 h-7 text-xs' : 'w-5 h-5 text-[10px]'
  
  return (
    <span className={`inline-flex items-center justify-center ${sizeClass} rounded border font-mono font-bold ${cls}`}>
      {rank}
    </span>
  )
}

export function SeasonStatsClient({ 
  seasonId, 
  leaderboard, 
  events, 
  bets,
  positionHistory 
}: SeasonStatsClientProps) {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'stats' | 'events' | 'evolution'>('leaderboard')

  // Calculate all stats
  const stats = useMemo(() => {
    // Top 3 by WR (min 3 paris)
    const topWR = leaderboard
      .filter(e => (e.wins + e.losses) >= 3)
      .map(e => ({ ...e, wr: e.wins / (e.wins + e.losses) * 100 }))
      .sort((a, b) => b.wr - a.wr)
      .slice(0, 3)

    // Top 3 by wins
    const topWins = leaderboard
      .filter(e => e.wins > 0)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 3)

    // Top 3 gainers (PnL)
    const topGainers = leaderboard
      .filter(e => e.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 3)

    // Top 3 losers (worst PnL)
    const topLosers = leaderboard
      .filter(e => e.points < 0)
      .sort((a, b) => a.points - b.points)
      .slice(0, 3)

    // Top 3 by volume (whales)
    const topWhales = [...leaderboard]
      .sort((a, b) => b.total_bet_amount - a.total_bet_amount)
      .slice(0, 3)

    // Top 3 by ROI %
    const topROI = leaderboard
      .filter(e => e.total_bet_amount > 0 && (e.wins + e.losses) >= 3)
      .map(e => ({ ...e, roi: (e.points / e.total_bet_amount) * 100 }))
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 3)

    // Worst ROI %
    const worstROI = leaderboard
      .filter(e => e.total_bet_amount > 0 && (e.wins + e.losses) >= 3)
      .map(e => ({ ...e, roi: (e.points / e.total_bet_amount) * 100 }))
      .sort((a, b) => a.roi - b.roi)
      .slice(0, 3)

    // Top 3 most active
    const betCountByUser = bets.reduce((acc, bet) => {
      acc[bet.user_id] = (acc[bet.user_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const topActive = Object.entries(betCountByUser)
      .map(([userId, count]) => ({
        userId,
        count,
        profile: leaderboard.find(l => l.user_id === userId)?.profiles
      }))
      .filter(e => e.profile)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    // Biggest single bets
    const biggestBets = [...bets]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Biggest single WIN
    const biggestWins = [...bets]
      .filter(b => b.status === 'won' && b.potential_payout)
      .sort((a, b) => (b.potential_payout || 0) - (a.potential_payout || 0))
      .slice(0, 3)

    // Event stats
    const eventBetCounts = bets.reduce((acc, bet) => {
      const marketId = bet.market_id
      if (marketId) {
        acc[marketId] = (acc[marketId] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Most popular events
    const popularEvents = events
      .map(e => ({ ...e, betCount: eventBetCounts[e.id] || 0 }))
      .sort((a, b) => b.betCount - a.betCount)
      .slice(0, 5)

    // Highest volume events
    const highVolumeEvents = [...events]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5)

    // Volume by event for pie chart
    const volumeByEvent = events
      .filter(e => e.volume > 0)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5)
      .map(e => ({
        name: e.question.length > 20 ? e.question.substring(0, 20) + '...' : e.question,
        value: e.volume
      }))

    return {
      topWR, topWins, topGainers, topLosers, topWhales, topROI, worstROI,
      topActive, biggestBets, biggestWins, popularEvents, highVolumeEvents, volumeByEvent,
      totalVolume: events.reduce((sum, e) => sum + (e.volume || 0), 0),
      avgBetSize: bets.length > 0 ? Math.round(bets.reduce((sum, b) => sum + b.amount, 0) / bets.length) : 0,
      totalBets: bets.length,
      uniqueBettors: new Set(bets.map(b => b.user_id)).size
    }
  }, [leaderboard, bets, events])

  // Position history chart data
  const positionChartData = useMemo(() => {
    if (positionHistory.length === 0) return []
    const topUsers = new Set(leaderboard.slice(0, 10).map(l => l.user_id))
    const dates = [...new Set(positionHistory.map(h => h.captured_at.split('T')[0]))].sort()
    
    return dates.map(date => {
      const dayData: any = { date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }
      positionHistory
        .filter(h => h.captured_at.startsWith(date) && topUsers.has(h.user_id) && h.profiles?.username)
        .forEach(h => {
          if (h.profiles?.username) {
            dayData[h.profiles.username] = h.position
          }
        })
      return dayData
    })
  }, [positionHistory, leaderboard])

  // PnL distribution
  const pnlDistribution = useMemo(() => {
    const ranges = [
      { name: '<-10K', min: -Infinity, max: -10000 },
      { name: '-10K/-1K', min: -10000, max: -1000 },
      { name: '-1K/0', min: -1000, max: 0 },
      { name: '0/1K', min: 0, max: 1000 },
      { name: '1K/10K', min: 1000, max: 10000 },
      { name: '>10K', min: 10000, max: Infinity },
    ]
    return ranges.map(range => ({
      name: range.name,
      count: leaderboard.filter(l => l.points > range.min && l.points <= range.max).length
    }))
  }, [leaderboard])

  // Podium duration
  const podiumDuration = useMemo(() => {
    if (positionHistory.length === 0) return []
    const podiumCounts: Record<string, { count: number; username: string }> = {}
    positionHistory.forEach(h => {
      if (h.position <= 3 && h.profiles?.username) {
        if (!podiumCounts[h.user_id]) {
          podiumCounts[h.user_id] = { count: 0, username: h.profiles.username }
        }
        podiumCounts[h.user_id].count++
      }
    })
    return Object.entries(podiumCounts)
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  }, [positionHistory])

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-2 overflow-x-auto">
        {[
          { id: 'leaderboard', label: 'Classement', icon: Trophy },
          { id: 'stats', label: 'Stats Joueurs', icon: Users },
          { id: 'events', label: 'Événements', icon: BarChart3 },
          { id: 'evolution', label: 'Évolution', icon: TrendingUp },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="rounded-lg bg-black/20 border border-border overflow-hidden">
          <div className="px-3 py-2 bg-white/5 border-b border-border flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Classement ({leaderboard.length})
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {stats.uniqueBettors} parieurs • {stats.totalBets} paris
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-white/5 text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 text-left w-12">#</th>
                  <th className="px-3 py-2 text-left">Joueur</th>
                  <th className="px-3 py-2 text-right">PnL</th>
                  <th className="px-3 py-2 text-right">ROI</th>
                  <th className="px-3 py-2 text-right">W/L</th>
                  <th className="px-3 py-2 text-right">Vol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {leaderboard.slice(0, 50).map((entry, i) => {
                  const roi = entry.total_bet_amount > 0 ? (entry.points / entry.total_bet_amount) * 100 : 0
                  return (
                    <tr key={entry.user_id} className="hover:bg-white/5">
                      <td className="px-3 py-2">
                        <RankBadge rank={i + 1} />
                      </td>
                      <td className="px-3 py-2 font-sans font-medium">{entry.profiles?.username || 'Inconnu'}</td>
                      <td className={`px-3 py-2 text-right font-bold ${entry.points >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {entry.points >= 0 ? '+' : ''}{entry.points.toLocaleString()}
                      </td>
                      <td className={`px-3 py-2 text-right ${roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        <span className="text-emerald-400">{entry.wins}</span>/<span className="text-rose-400">{entry.losses}</span>
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {(entry.total_bet_amount / 1000).toFixed(1)}K
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {/* Podium Duration */}
          {podiumDuration.length > 0 && (
            <div className="p-3 rounded-lg bg-black/20 border border-border">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Durée sur le Podium
              </h4>
              <div className="space-y-1.5">
                {podiumDuration.map((p, i) => (
                  <div key={p.userId} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <RankBadge rank={i + 1} />
                      <span className="font-medium">{p.username}</span>
                    </span>
                    <span className="font-mono text-amber-400">{p.count}d</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Top WR */}
            <div className="p-3 rounded-lg bg-black/20 border border-border">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Target className="w-3 h-3 text-blue-400" /> Taux de Victoire
              </h4>
              <div className="space-y-1.5">
                {stats.topWR.map((p, i) => (
                  <div key={p.user_id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <RankBadge rank={i + 1} />
                      <span className="font-medium">{p.profiles?.username}</span>
                    </span>
                    <span className="font-mono font-bold text-blue-400">{p.wr.toFixed(1)}%</span>
                  </div>
                ))}
                {stats.topWR.length === 0 && <p className="text-xs text-muted-foreground">Min. 3 paris requis</p>}
              </div>
            </div>

            {/* Top ROI */}
            <div className="p-3 rounded-lg bg-black/20 border border-border">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Percent className="w-3 h-3 text-emerald-400" /> Meilleur ROI
              </h4>
              <div className="space-y-1.5">
                {stats.topROI.map((p, i) => (
                  <div key={p.user_id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <RankBadge rank={i + 1} />
                      <span className="font-medium">{p.profiles?.username}</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-400">+{p.roi.toFixed(1)}%</span>
                  </div>
                ))}
                {stats.topROI.length === 0 && <p className="text-xs text-muted-foreground">Min. 3 paris requis</p>}
              </div>
            </div>

            {/* Worst ROI */}
            <div className="p-3 rounded-lg bg-black/20 border border-border">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <TrendingDown className="w-3 h-3 text-rose-400" /> Pire ROI
              </h4>
              <div className="space-y-1.5">
                {stats.worstROI.map((p, i) => (
                  <div key={p.user_id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <RankBadge rank={i + 1} />
                      <span className="font-medium">{p.profiles?.username}</span>
                    </span>
                    <span className="font-mono font-bold text-rose-400">{p.roi.toFixed(1)}%</span>
                  </div>
                ))}
                {stats.worstROI.length === 0 && <p className="text-xs text-muted-foreground">Min. 3 paris requis</p>}
              </div>
            </div>

            {/* Top Gainers */}
            <div className="p-3 rounded-lg bg-black/20 border border-border">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-emerald-400" /> Meilleurs Gains
              </h4>
              <div className="space-y-1.5">
                {stats.topGainers.map((p, i) => (
                  <div key={p.user_id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <RankBadge rank={i + 1} />
                      <span className="font-medium">{p.profiles?.username}</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-400 flex items-center gap-0.5">
                      +{p.points.toLocaleString()}<CurrencySymbol className="w-2.5 h-2.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="p-3 rounded-lg bg-black/20 border border-border">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <TrendingDown className="w-3 h-3 text-rose-400" /> Pires Pertes
              </h4>
              <div className="space-y-1.5">
                {stats.topLosers.map((p, i) => (
                  <div key={p.user_id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <RankBadge rank={i + 1} />
                      <span className="font-medium">{p.profiles?.username}</span>
                    </span>
                    <span className="font-mono font-bold text-rose-400 flex items-center gap-0.5">
                      {p.points.toLocaleString()}<CurrencySymbol className="w-2.5 h-2.5" />
                    </span>
                  </div>
                ))}
                {stats.topLosers.length === 0 && <p className="text-xs text-muted-foreground">Aucune perte</p>}
              </div>
            </div>

            {/* Top Whales */}
            <div className="p-3 rounded-lg bg-black/20 border border-border">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-purple-400" /> Plus Gros Volumes
              </h4>
              <div className="space-y-1.5">
                {stats.topWhales.map((p, i) => (
                  <div key={p.user_id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <RankBadge rank={i + 1} />
                      <span className="font-medium">{p.profiles?.username}</span>
                    </span>
                    <span className="font-mono font-bold text-purple-400 flex items-center gap-0.5">
                      {(p.total_bet_amount / 1000).toFixed(1)}K<CurrencySymbol className="w-2.5 h-2.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Active */}
            <div className="p-3 rounded-lg bg-black/20 border border-border">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3 text-orange-400" /> Plus Actifs
              </h4>
              <div className="space-y-1.5">
                {stats.topActive.map((p, i) => (
                  <div key={p.userId} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <RankBadge rank={i + 1} />
                      <span className="font-medium">{p.profile?.username}</span>
                    </span>
                    <span className="font-mono font-bold text-orange-400">{p.count} paris</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Wins */}
            <div className="p-3 rounded-lg bg-black/20 border border-border">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Medal className="w-3 h-3 text-amber-400" /> Plus de Victoires
              </h4>
              <div className="space-y-1.5">
                {stats.topWins.map((p, i) => (
                  <div key={p.user_id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <RankBadge rank={i + 1} />
                      <span className="font-medium">{p.profiles?.username}</span>
                    </span>
                    <span className="font-mono font-bold text-amber-400">{p.wins}W</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Biggest Single Wins */}
          {stats.biggestWins.length > 0 && (
            <div className="p-3 rounded-lg bg-black/20 border border-border">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Trophy className="w-3 h-3 text-amber-400" /> Plus Gros Gains (Pari Unique)
              </h4>
              <div className="space-y-1.5">
                {stats.biggestWins.map((bet, i) => (
                  <div key={bet.id} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{bet.profiles?.username}</span>
                      <p className="text-[10px] text-muted-foreground truncate">{bet.markets?.question || ''}</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 flex items-center gap-0.5 ml-2">
                      +{(bet.potential_payout || 0).toLocaleString()}<CurrencySymbol className="w-2.5 h-2.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Biggest Bets */}
          <div className="p-3 rounded-lg bg-black/20 border border-border">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-purple-400" /> Plus Gros Paris
            </h4>
            <div className="space-y-1.5">
              {stats.biggestBets.map((bet) => (
                <div key={bet.id} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{bet.profiles?.username}</span>
                    <p className="text-[10px] text-muted-foreground truncate">{bet.markets?.question || ''}</p>
                  </div>
                  <span className="font-mono font-bold flex items-center gap-0.5 ml-2">
                    {bet.amount.toLocaleString()}<CurrencySymbol className="w-2.5 h-2.5" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution des PnL */}
          <div className="p-3 rounded-lg bg-black/20 border border-border">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Distribution des PnL</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlDistribution}>
                  <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#666', fontSize: 9 }} />
                  <Tooltip 
                    contentStyle={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '4px', fontSize: '11px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {/* Volume by Event */}
          {stats.volumeByEvent.length > 0 && (
            <div className="p-3 rounded-lg bg-black/20 border border-border">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Distribution du Volume (Top 5)</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.volumeByEvent}
                      cx="50%"
                      cy="45%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {stats.volumeByEvent.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '4px', fontSize: '11px' }}
                      formatter={(value: number) => [`${value.toLocaleString()} Z`, 'Volume']}
                    />
                    <Legend 
                      verticalAlign="bottom"
                      height={40}
                      formatter={(value: string) => <span className="text-[9px] text-muted-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Popular Events */}
            <div className="p-3 rounded-lg bg-black/20 border border-border">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Plus Populaires (par paris)</h4>
              <div className="space-y-1.5">
                {stats.popularEvents.map((event, i) => (
                  <div key={event.id} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <RankBadge rank={i + 1} />
                      <span className="font-medium truncate">{event.question}</span>
                    </div>
                    <span className="font-mono text-orange-400 ml-2">{event.betCount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* High Volume Events */}
            <div className="p-3 rounded-lg bg-black/20 border border-border">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Plus Gros Volume</h4>
              <div className="space-y-1.5">
                {stats.highVolumeEvents.map((event, i) => (
                  <div key={event.id} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <RankBadge rank={i + 1} />
                      <span className="font-medium truncate">{event.question}</span>
                    </div>
                    <span className="font-mono text-primary flex items-center gap-0.5 ml-2">
                      {(event.volume / 1000).toFixed(1)}K<CurrencySymbol className="w-2.5 h-2.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* All Events List */}
          <div className="rounded-lg bg-black/20 border border-border overflow-hidden">
            <div className="px-3 py-2 bg-white/5 border-b border-border">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Tous les Événements ({events.length})
              </span>
            </div>
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {events.map(event => (
                <Link 
                  key={event.id}
                  href={`/market/${event.id}`}
                  className="flex items-center justify-between p-2.5 hover:bg-white/5 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      event.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                      event.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {event.status === 'resolved' ? 'Done' : event.status === 'open' ? 'Live' : event.status}
                    </span>
                    <span className="font-medium truncate">{event.question}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="font-mono text-muted-foreground">
                      {event.volume.toLocaleString()}
                    </span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Evolution Tab */}
      {activeTab === 'evolution' && (
        <div className="space-y-4">
          {/* Position Evolution Chart */}
          {positionChartData.length > 0 ? (
            <div className="p-3 rounded-lg bg-black/20 border border-border">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Évolution des Positions (Top 10)</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={positionChartData}>
                    <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 9 }} />
                    <YAxis 
                      reversed 
                      domain={[1, 10]} 
                      tick={{ fill: '#666', fontSize: 9 }}
                      tickFormatter={(v) => `#${v}`}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '4px', fontSize: '11px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                    {leaderboard.slice(0, 10).map((entry, i) => (
                      <Line
                        key={entry.user_id}
                        type="monotone"
                        dataKey={entry.profiles?.username}
                        stroke={COLORS[i]}
                        strokeWidth={1.5}
                        dot={{ r: 2 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-muted-foreground mt-2 text-center">
                Position #1 = Meilleur. Snapshots pris après chaque résolution d'événement.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-lg bg-black/20 border border-border text-center">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h4 className="font-bold text-sm mb-1">Pas encore d'historique</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Les positions sont enregistrées après chaque résolution d'événement.
              </p>
            </div>
          )}

          {/* Podium Duration */}
          {podiumDuration.length > 0 && (
            <div className="p-3 rounded-lg bg-black/20 border border-border">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Durée sur le Podium (Jours dans le Top 3)</h4>
              <div className="grid grid-cols-3 gap-3">
                {podiumDuration.map((p, i) => (
                  <div key={p.userId} className="text-center p-3 rounded bg-white/5">
                    <RankBadge rank={i + 1} size="md" />
                    <p className="font-bold text-xs mt-2">{p.username}</p>
                    <p className="text-amber-400 font-mono text-lg">{p.count}d</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
