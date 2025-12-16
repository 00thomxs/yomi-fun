'use client'

import { useMemo } from 'react'
import { Trophy, Target, Flame, TrendingUp, TrendingDown, Zap, BarChart3, Medal } from 'lucide-react'
import { CurrencySymbol } from '@/components/ui/currency-symbol'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'

type LeaderboardEntry = {
  user_id: string
  points: number
  wins: number
  losses: number
  total_bet_amount: number
  profiles: {
    id: string
    username: string
    avatar_url: string
  }
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
  amount: number
  status: string
  profiles: {
    id: string
    username: string
  }
  markets: {
    question: string
  }
}

type PositionHistory = {
  user_id: string
  captured_at: string
  position: number
  points: number
  profiles: {
    id: string
    username: string
  }
}

type SeasonRecapStatsProps = {
  seasonId: string
  leaderboard: LeaderboardEntry[]
  events: Event[]
  bets: Bet[]
  positionHistory: PositionHistory[]
}

const COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16']

export function SeasonRecapStats({ 
  seasonId, 
  leaderboard, 
  events, 
  bets,
  positionHistory 
}: SeasonRecapStatsProps) {
  // Calculate stats
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
    const topWhales = leaderboard
      .sort((a, b) => b.total_bet_amount - a.total_bet_amount)
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
    const biggestBets = bets
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Most popular events
    const eventBetCounts = bets.reduce((acc, bet) => {
      const marketId = (bet as any).market_id
      acc[marketId] = (acc[marketId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const popularEvents = events
      .map(e => ({
        ...e,
        betCount: eventBetCounts[e.id] || 0
      }))
      .sort((a, b) => b.betCount - a.betCount)
      .slice(0, 3)

    return {
      topWR,
      topWins,
      topGainers,
      topLosers,
      topWhales,
      topActive,
      biggestBets,
      popularEvents,
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
        .filter(h => h.captured_at.startsWith(date) && topUsers.has(h.user_id))
        .forEach(h => {
          dayData[h.profiles.username] = h.position
        })
      
      return dayData
    })
  }, [positionHistory, leaderboard])

  // PnL distribution
  const pnlDistribution = useMemo(() => {
    const ranges = [
      { name: '< -10K', min: -Infinity, max: -10000 },
      { name: '-10K/-1K', min: -10000, max: -1000 },
      { name: '-1K/0', min: -1000, max: 0 },
      { name: '0/1K', min: 0, max: 1000 },
      { name: '1K/10K', min: 1000, max: 10000 },
      { name: '> 10K', min: 10000, max: Infinity },
    ]

    return ranges.map(range => ({
      name: range.name,
      count: leaderboard.filter(l => l.points > range.min && l.points <= range.max).length
    }))
  }, [leaderboard])

  return (
    <div className="space-y-6">
      {/* Stats Cards Grid */}
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

      {/* Position Evolution Chart */}
      {positionChartData.length > 0 && (
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
                <Legend />
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
        </div>
      )}

      {/* Biggest Bets + PnL Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Biggest Bets */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4" /> Plus Grosses Mises
          </h4>
          <div className="space-y-2">
            {stats.biggestBets.map((bet, i) => (
              <div key={bet.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-sm">{bet.profiles?.username}</span>
                  <p className="text-xs text-muted-foreground truncate">{bet.markets?.question}</p>
                </div>
                <span className="font-bold font-mono flex items-center gap-0.5 ml-2">
                  {bet.amount.toLocaleString()}<CurrencySymbol className="w-3 h-3" />
                </span>
              </div>
            ))}
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

      {/* Most Popular Events */}
      {stats.popularEvents.length > 0 && (
        <div className="p-4 rounded-xl bg-card border border-border">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-400" /> Events les Plus Populaires
          </h4>
          <div className="space-y-2">
            {stats.popularEvents.map((event, i) => (
              <div key={event.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  {i === 0 && '🥇'}{i === 1 && '🥈'}{i === 2 && '🥉'}
                  <span className="font-medium text-sm">{event.question}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold font-mono flex items-center gap-0.5 justify-end">
                    {event.volume.toLocaleString()}<CurrencySymbol className="w-3 h-3" />
                  </span>
                  <span className="text-xs text-muted-foreground">{event.betCount} paris</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 bg-white/5 border-b border-border">
          <h3 className="font-bold text-sm">Classement Final Complet</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Joueur</th>
                <th className="px-4 py-2 text-right">PnL</th>
                <th className="px-4 py-2 text-right">W/L</th>
                <th className="px-4 py-2 text-right">WR</th>
                <th className="px-4 py-2 text-right">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leaderboard.map((entry, i) => (
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
                  <td className="px-4 py-2 text-right text-muted-foreground">
                    <span className="text-emerald-400">{entry.wins}</span>
                    /
                    <span className="text-rose-400">{entry.losses}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {entry.wins + entry.losses > 0 
                      ? `${Math.round(entry.wins / (entry.wins + entry.losses) * 100)}%`
                      : '-'
                    }
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-muted-foreground">
                    {entry.total_bet_amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

