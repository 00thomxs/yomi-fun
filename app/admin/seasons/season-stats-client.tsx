'use client'

import { useState, useMemo } from 'react'
import { Trophy, Target, Flame, TrendingUp, TrendingDown, Zap, Users, BarChart3, Medal, Percent, Star, Clock } from 'lucide-react'
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
    // Top 3 by WR (min 3 bets)
    const topWR = leaderboard
      .filter(e => (e.wins + e.losses) >= 3)
      .map(e => ({
        ...e,
        wr: e.wins / (e.wins + e.losses) * 100
      }))
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

    // Top 3 by ROI % (PnL / total_bet_amount * 100)
    const topROI = leaderboard
      .filter(e => e.total_bet_amount > 0 && (e.wins + e.losses) >= 3)
      .map(e => ({
        ...e,
        roi: (e.points / e.total_bet_amount) * 100
      }))
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 3)

    // Worst ROI %
    const worstROI = leaderboard
      .filter(e => e.total_bet_amount > 0 && (e.wins + e.losses) >= 3)
      .map(e => ({
        ...e,
        roi: (e.points / e.total_bet_amount) * 100
      }))
      .sort((a, b) => a.roi - b.roi)
      .slice(0, 3)

    // Top 3 most active (by number of bets)
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

    // Biggest single WIN (potential_payout on won bets)
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

    // Most popular events (by bet count)
    const popularEvents = events
      .map(e => ({
        ...e,
        betCount: eventBetCounts[e.id] || 0
      }))
      .sort((a, b) => b.betCount - a.betCount)
      .slice(0, 3)

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
        name: e.question.length > 25 ? e.question.substring(0, 25) + '...' : e.question,
        value: e.volume
      }))

    return {
      topWR,
      topWins,
      topGainers,
      topLosers,
      topWhales,
      topROI,
      worstROI,
      topActive,
      biggestBets,
      biggestWins,
      popularEvents,
      highVolumeEvents,
      volumeByEvent,
      totalVolume: events.reduce((sum, e) => sum + (e.volume || 0), 0),
      avgBetSize: bets.length > 0 
        ? Math.round(bets.reduce((sum, b) => sum + b.amount, 0) / bets.length)
        : 0,
      totalBets: bets.length,
      uniqueBettors: new Set(bets.map(b => b.user_id)).size
    }
  }, [leaderboard, bets, events])

  // Position history chart data
  const positionChartData = useMemo(() => {
    if (positionHistory.length === 0) return []

    const topUsers = new Set(
      leaderboard.slice(0, 10).map(l => l.user_id)
    )

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

  // Podium duration (who stayed longest in top 3)
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
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
        {[
          { id: 'leaderboard', label: 'Classement', icon: Trophy },
          { id: 'stats', label: 'Stats Joueurs', icon: Users },
          { id: 'events', label: 'Events', icon: BarChart3 },
          { id: 'evolution', label: 'Évolution', icon: TrendingUp },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 bg-white/5 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-sm">Classement Live ({leaderboard.length} participants)</h3>
            <div className="text-xs text-muted-foreground">
              {stats.uniqueBettors} parieurs • {stats.totalBets} paris
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Joueur</th>
                  <th className="px-4 py-2 text-right">PnL</th>
                  <th className="px-4 py-2 text-right">ROI</th>
                  <th className="px-4 py-2 text-right">W/L</th>
                  <th className="px-4 py-2 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaderboard.slice(0, 50).map((entry, i) => {
                  const roi = entry.total_bet_amount > 0 ? (entry.points / entry.total_bet_amount) * 100 : 0
                  return (
                    <tr key={entry.user_id} className="hover:bg-white/5">
                      <td className="px-4 py-2">
                        {i === 0 && <span className="text-amber-400">🥇</span>}
                        {i === 1 && <span className="text-gray-400">🥈</span>}
                        {i === 2 && <span className="text-amber-700">🥉</span>}
                        {i > 2 && <span className="text-muted-foreground">{i + 1}</span>}
                      </td>
                      <td className="px-4 py-2 font-medium">{entry.profiles?.username || 'Unknown'}</td>
                      <td className={`px-4 py-2 text-right font-mono font-bold ${entry.points >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {entry.points >= 0 ? '+' : ''}{entry.points.toLocaleString()}
                      </td>
                      <td className={`px-4 py-2 text-right font-mono text-xs ${roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">
                        <span className="text-emerald-400">{entry.wins}</span>
                        /
                        <span className="text-rose-400">{entry.losses}</span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-xs">
                        {entry.total_bet_amount.toLocaleString()}
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
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-400" /> Plus Longtemps sur le Podium
              </h4>
              <div className="space-y-2">
                {podiumDuration.map((p, i) => (
                  <div key={p.userId} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {i === 0 && '🥇'}{i === 1 && '🥈'}{i === 2 && '🥉'}
                      <span className="font-medium text-sm">{p.username}</span>
                    </span>
                    <span className="font-bold text-amber-400">{p.count} jour{p.count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Top WR */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-blue-400" /> Meilleur Win Rate
              </h4>
              <div className="space-y-2">
                {stats.topWR.map((p, i) => (
                  <div key={p.user_id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {i === 0 && '🥇'}{i === 1 && '🥈'}{i === 2 && '🥉'}
                      <span className="font-medium text-sm">{p.profiles?.username}</span>
                    </span>
                    <span className="font-bold text-blue-400">{p.wr.toFixed(1)}%</span>
                  </div>
                ))}
                {stats.topWR.length === 0 && <p className="text-sm text-muted-foreground">Min. 3 paris requis</p>}
              </div>
            </div>

            {/* Top ROI % */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <Percent className="w-4 h-4 text-emerald-400" /> Meilleur ROI
              </h4>
              <div className="space-y-2">
                {stats.topROI.map((p, i) => (
                  <div key={p.user_id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {i === 0 && '🥇'}{i === 1 && '🥈'}{i === 2 && '🥉'}
                      <span className="font-medium text-sm">{p.profiles?.username}</span>
                    </span>
                    <span className="font-bold text-emerald-400">+{p.roi.toFixed(1)}%</span>
                  </div>
                ))}
                {stats.topROI.length === 0 && <p className="text-sm text-muted-foreground">Min. 3 paris requis</p>}
              </div>
            </div>

            {/* Worst ROI % */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-rose-400" /> Pire ROI
              </h4>
              <div className="space-y-2">
                {stats.worstROI.map((p, i) => (
                  <div key={p.user_id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {i === 0 && '💀'}{i === 1 && '😵'}{i === 2 && '😢'}
                      <span className="font-medium text-sm">{p.profiles?.username}</span>
                    </span>
                    <span className="font-bold text-rose-400">{p.roi.toFixed(1)}%</span>
                  </div>
                ))}
                {stats.worstROI.length === 0 && <p className="text-sm text-muted-foreground">Min. 3 paris requis</p>}
              </div>
            </div>

            {/* Top Gainers */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Meilleurs Gains
              </h4>
              <div className="space-y-2">
                {stats.topGainers.map((p, i) => (
                  <div key={p.user_id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {i === 0 && '🥇'}{i === 1 && '🥈'}{i === 2 && '🥉'}
                      <span className="font-medium text-sm">{p.profiles?.username}</span>
                    </span>
                    <span className="font-bold text-emerald-400 flex items-center gap-0.5">
                      +{p.points.toLocaleString()}<CurrencySymbol className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-rose-400" /> Pires Pertes
              </h4>
              <div className="space-y-2">
                {stats.topLosers.map((p, i) => (
                  <div key={p.user_id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {i === 0 && '💀'}{i === 1 && '😵'}{i === 2 && '😢'}
                      <span className="font-medium text-sm">{p.profiles?.username}</span>
                    </span>
                    <span className="font-bold text-rose-400 flex items-center gap-0.5">
                      {p.points.toLocaleString()}<CurrencySymbol className="w-3 h-3" />
                    </span>
                  </div>
                ))}
                {stats.topLosers.length === 0 && <p className="text-sm text-muted-foreground">Aucune perte</p>}
              </div>
            </div>

            {/* Top Whales */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-purple-400" /> Plus Gros Volumes
              </h4>
              <div className="space-y-2">
                {stats.topWhales.map((p, i) => (
                  <div key={p.user_id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {i === 0 && '🐋'}{i === 1 && '🦈'}{i === 2 && '🐠'}
                      <span className="font-medium text-sm">{p.profiles?.username}</span>
                    </span>
                    <span className="font-bold text-purple-400 flex items-center gap-0.5">
                      {p.total_bet_amount.toLocaleString()}<CurrencySymbol className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Active */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-orange-400" /> Plus Actifs
              </h4>
              <div className="space-y-2">
                {stats.topActive.map((p, i) => (
                  <div key={p.userId} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {i === 0 && '🔥'}{i === 1 && '⚡'}{i === 2 && '💪'}
                      <span className="font-medium text-sm">{p.profile?.username}</span>
                    </span>
                    <span className="font-bold text-orange-400">{p.count} paris</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Wins */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <Medal className="w-4 h-4 text-amber-400" /> Plus de Victoires
              </h4>
              <div className="space-y-2">
                {stats.topWins.map((p, i) => (
                  <div key={p.user_id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {i === 0 && '🥇'}{i === 1 && '🥈'}{i === 2 && '🥉'}
                      <span className="font-medium text-sm">{p.profiles?.username}</span>
                    </span>
                    <span className="font-bold text-amber-400">{p.wins} wins</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Biggest Single Wins */}
          {stats.biggestWins.length > 0 && (
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-400" /> Plus Gros Gains (single bet)
              </h4>
              <div className="space-y-2">
                {stats.biggestWins.map((bet, i) => {
                  const question = bet.markets?.question || ''
                  const truncatedQuestion = question.length > 35 ? question.substring(0, 35) + '...' : question
                  return (
                    <div key={bet.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-sm">{bet.profiles?.username}</span>
                        <p className="text-[10px] text-muted-foreground truncate">{truncatedQuestion}</p>
                      </div>
                      <span className="font-bold font-mono text-emerald-400 flex items-center gap-0.5 ml-2">
                        +{(bet.potential_payout || 0).toLocaleString()}<CurrencySymbol className="w-3 h-3" />
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Biggest Bets */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-purple-400" /> Plus Gros Paris
            </h4>
            <div className="space-y-2">
              {stats.biggestBets.map((bet, i) => {
                const question = bet.markets?.question || ''
                const truncatedQuestion = question.length > 35 ? question.substring(0, 35) + '...' : question
                return (
                  <div key={bet.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-sm">{bet.profiles?.username}</span>
                      <p className="text-[10px] text-muted-foreground truncate">{truncatedQuestion}</p>
                    </div>
                    <span className="font-bold font-mono flex items-center gap-0.5 ml-2">
                      {bet.amount.toLocaleString()}<CurrencySymbol className="w-3 h-3" />
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* PnL Distribution */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Distribution des PnL</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlDistribution}>
                  <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#888', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {/* Volume by Event Pie Chart - Fixed */}
          {stats.volumeByEvent.length > 0 && (
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
                Volume par Event (Top 5)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.volumeByEvent}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {stats.volumeByEvent.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`${value.toLocaleString()} Z`, 'Volume']}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Most Popular Events */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-orange-400" /> Events les Plus Populaires
              </h4>
              <div className="space-y-2">
                {stats.popularEvents.map((event, i) => {
                  const truncatedQuestion = event.question.length > 35 ? event.question.substring(0, 35) + '...' : event.question
                  return (
                    <div key={event.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {i === 0 && '🥇'}{i === 1 && '🥈'}{i === 2 && '🥉'}
                        <span className="font-medium text-sm truncate">{truncatedQuestion}</span>
                      </div>
                      <span className="font-bold text-orange-400 ml-2">{event.betCount} paris</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Highest Volume Events */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-primary" /> Plus Gros Volume
              </h4>
              <div className="space-y-2">
                {stats.highVolumeEvents.map((event, i) => {
                  const truncatedQuestion = event.question.length > 35 ? event.question.substring(0, 35) + '...' : event.question
                  return (
                    <div key={event.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {i < 3 && ['🥇', '🥈', '🥉'][i]}
                        <span className="font-medium text-sm truncate">{truncatedQuestion}</span>
                      </div>
                      <span className="font-bold font-mono text-primary flex items-center gap-0.5 ml-2">
                        {event.volume.toLocaleString()}<CurrencySymbol className="w-3 h-3" />
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* All Events List */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 bg-white/5 border-b border-border">
              <h3 className="font-bold text-sm">Tous les Events ({events.length})</h3>
            </div>
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {events.map(event => {
                const truncatedQuestion = event.question.length > 50 ? event.question.substring(0, 50) + '...' : event.question
                return (
                  <Link 
                    key={event.id}
                    href={`/market/${event.id}`}
                    className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        event.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                        event.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {event.status === 'resolved' ? 'Terminé' : event.status === 'open' ? 'Live' : event.status}
                      </span>
                      <span className="font-medium text-sm truncate">{truncatedQuestion}</span>
                    </div>
                    <span className="font-mono text-sm flex items-center gap-0.5">
                      {event.volume.toLocaleString()}<CurrencySymbol className="w-3 h-3" />
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Evolution Tab */}
      {activeTab === 'evolution' && (
        <div className="space-y-4">
          {/* Position Evolution Chart */}
          {positionChartData.length > 0 ? (
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
                Évolution des Positions (Course au Titre)
              </h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={positionChartData}>
                    <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} />
                    <YAxis 
                      reversed 
                      domain={[1, 10]} 
                      tick={{ fill: '#888', fontSize: 10 }}
                      tickFormatter={(v) => `#${v}`}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    {leaderboard.slice(0, 10).map((entry, i) => (
                      <Line
                        key={entry.user_id}
                        type="monotone"
                        dataKey={entry.profiles?.username}
                        stroke={COLORS[i]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Position 1 = meilleur. Les snapshots sont créés après chaque résolution d'event.
              </p>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-card border border-border text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-bold text-lg mb-2">Pas encore d'historique</h4>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Les positions du classement sont enregistrées automatiquement après chaque résolution d'event de la saison. 
                Revenez après quelques events pour voir l'évolution du Top 10 !
              </p>
            </div>
          )}

          {/* Podium Duration */}
          {podiumDuration.length > 0 && (
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-400" /> Durée sur le Podium (Top 3)
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {podiumDuration.map((p, i) => (
                  <div key={p.userId} className="text-center p-3 rounded-xl bg-white/5">
                    <div className="text-2xl mb-1">
                      {i === 0 && '🥇'}{i === 1 && '🥈'}{i === 2 && '🥉'}
                    </div>
                    <p className="font-bold text-sm">{p.username}</p>
                    <p className="text-amber-400 font-mono text-lg">{p.count}j</p>
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
