"use client"

import { useState, useEffect } from "react"
import { ArrowUpRight, ArrowDownRight, Settings, Key, Clock, Flame, Star, UserCog, X, Trophy } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { useUser } from "@/contexts/user-context"
import { createClient } from "@/lib/supabase/client"
import { EditProfileForm } from "@/components/profile/edit-profile-form"
import { ChangePasswordForm } from "@/components/profile/change-password-form"
import { DailyRewardWidget } from "@/components/daily-reward-widget"
import { getUserPnLHistory, PnlPoint } from "@/app/actions/history"

type Transaction = {
  id: string
  created_at: string
  market_question: string
  outcome_name: string
  amount: number
  status: 'pending' | 'won' | 'lost'
  potential_payout: number
  direction?: 'YES' | 'NO'
}

export function ProfileView() {
  const { user, profile, userBalance } = useUser()
  const [pnlTimeframe, setPnlTimeframe] = useState<"1J" | "1S" | "1M" | "TOUT">("TOUT")
  const [showSettings, setShowSettings] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState<'menu' | 'edit' | 'password'>('menu')
  const [history, setHistory] = useState<Transaction[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [pnlHistory, setPnlHistory] = useState<PnlPoint[]>([])
  const [globalRank, setGlobalRank] = useState<number | null>(null)
  const [seasonRank, setSeasonRank] = useState<number | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      
      // 1. Fetch Bets History
      const supabase = createClient()
      const { data: betsData } = await supabase
        .from('bets')
        .select(`
          id,
          created_at,
          amount,
          status,
          potential_payout,
          direction,
          outcome_id,
          markets (question),
          outcomes (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (betsData) {
        const formattedHistory = betsData.map((bet: any) => ({
          id: bet.id,
          created_at: bet.created_at,
          market_question: bet.markets?.question || "Event inconnu",
          outcome_name: bet.outcomes?.name || "?",
          amount: bet.amount,
          status: bet.status,
          potential_payout: bet.potential_payout,
          direction: bet.direction
        }))
        setHistory(formattedHistory)
      }
      setLoadingHistory(false)

      // 2. Fetch PnL History
      const pnlData = await getUserPnLHistory(user.id)
      setPnlHistory(pnlData)

      // 3. Fetch Global Rank (only if profile is loaded)
      if (!profile) return
      
      const { count: higherGlobalCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .neq('role', 'admin')
        .gt('total_won', profile.total_won || 0)

      if (higherGlobalCount !== null) {
        setGlobalRank(higherGlobalCount + 1)
      }

      // 4. Fetch Season Rank (if active season exists)
      const { data: activeSeason } = await supabase
        .from('seasons')
        .select('id')
        .eq('is_active', true)
        .single()

      if (activeSeason) {
        // Check if user is in season leaderboard
        const { data: userSeasonEntry } = await supabase
          .from('season_leaderboards')
          .select('points')
          .eq('user_id', user.id)
          .eq('season_id', activeSeason.id)
          .single()

        if (userSeasonEntry) {
          // Count how many players have more points
          const { count: higherSeasonCount } = await supabase
            .from('season_leaderboards')
            .select('id', { count: 'exact', head: true })
            .eq('season_id', activeSeason.id)
            .gt('points', userSeasonEntry.points)

          if (higherSeasonCount !== null) {
            setSeasonRank(higherSeasonCount + 1)
          }
        } else {
          // User not in season leaderboard yet (N/A)
          setSeasonRank(null)
        }
      } else {
        // No active season
        setSeasonRank(null)
      }
    }

    loadData()
  }, [user, profile])

  // Prepare Chart Data with timeframe filtering
  const now = new Date()
  const getTimeframeCutoff = () => {
    if (pnlTimeframe === "1J") return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    if (pnlTimeframe === "1S") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    if (pnlTimeframe === "1M") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return new Date(0) // TOUT - depuis le début
  }

  const filteredPnlHistory = pnlTimeframe === "TOUT" 
    ? pnlHistory 
    : pnlHistory.filter(p => new Date(p.date) >= getTimeframeCutoff())
  
  // Chart data starts from FIRST BET - empty if no bets
  let chartData = filteredPnlHistory.map(p => ({
    day: new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    fullDate: new Date(p.date),
    ts: new Date(p.date).getTime(),
    pnl: Math.round(p.value) // Ensure integer
  }))

  // Add artificial starting point at 0 just before the first bet
  // This anchors the chart to 0 visually
  if (chartData.length > 0) {
    const firstPoint = chartData[0]
    const startTs = firstPoint.ts - 1000 * 60 * 60 // 1 hour before first bet
    const startPoint = {
      day: new Date(startTs).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      fullDate: new Date(startTs),
      ts: startTs,
      pnl: 0
    }
    chartData = [startPoint, ...chartData]

    // Add 'Now' point to extend the line to current time
    const lastPoint = chartData[chartData.length - 1]
    if (now.getTime() - lastPoint.ts > 1000) {
      const nowPoint = {
        day: now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        fullDate: now,
        ts: now.getTime(),
        pnl: lastPoint.pnl
      }
      chartData.push(nowPoint)
    }
  }

  // Calculate time domain and ticks for X axis
  // Domain starts from our artificial start point (0)
  type TickFormatType = 'time' | 'day' | 'month'

  const getAxisConfig = () => {
    if (chartData.length === 0) {
      // No data - return default config (won't be displayed anyway)
      return { domain: [now.getTime() - 24 * 60 * 60 * 1000, now.getTime()], ticks: [], formatType: 'time' as TickFormatType }
    }

    const firstTs = chartData[0].ts // This is our artificial 0 point
    const lastTs = Math.max(chartData[chartData.length - 1].ts, now.getTime())
    
    // No padding (start at 0, end at Now)
    const domainStart = firstTs
    const domainEnd = lastTs
    const totalRange = domainEnd - domainStart

    // Generate regular ticks based on timeframe
    let tickInterval: number
    let formatType: TickFormatType = 'time'

    if (totalRange <= 24 * 60 * 60 * 1000) {
      // Less than 24h -> Time format
      formatType = 'time'
      if (totalRange <= 3600 * 1000) tickInterval = 15 * 60 * 1000 // 15 min
      else if (totalRange <= 6 * 3600 * 1000) tickInterval = 60 * 60 * 1000 // 1h
      else tickInterval = 4 * 60 * 60 * 1000 // 4h
    } else if (totalRange <= 30 * 24 * 60 * 60 * 1000) {
      // Less than 1 month -> Day format
      formatType = 'day'
      if (totalRange <= 7 * 24 * 60 * 60 * 1000) tickInterval = 24 * 60 * 60 * 1000 // 1 day
      else tickInterval = 5 * 24 * 60 * 60 * 1000 // 5 days
    } else {
      // More than 1 month -> Day or Month format
      if (totalRange <= 365 * 24 * 3600 * 1000) {
        formatType = 'day'
        tickInterval = 7 * 24 * 60 * 60 * 1000 // Weekly
      } else {
        formatType = 'month'
        tickInterval = 30 * 24 * 60 * 60 * 1000 // Monthly
      }
    }

    // Generate ticks at regular intervals
    const ticks: number[] = []
    let tick = Math.ceil(domainStart / tickInterval) * tickInterval // Start at next round interval
    while (tick <= domainEnd) {
      if (tick >= domainStart) {
        ticks.push(tick)
      }
      tick += tickInterval
    }

    // Limit to ~6 ticks max for readability
    while (ticks.length > 6) {
      const newTicks: number[] = []
      // Keep first, take every 2nd, keep last
      if (ticks.length > 0) newTicks.push(ticks[0])
      for (let i = 1; i < ticks.length - 1; i += 2) {
        newTicks.push(ticks[i])
      }
      if (ticks.length > 1) newTicks.push(ticks[ticks.length - 1])
      
      ticks.length = 0
      ticks.push(...newTicks)
    }

    return { domain: [domainStart, domainEnd], ticks, formatType }
  }

  // Explicit tick formatter - clean output without weird locale issues
  const formatTickLabel = (ts: number, formatType: TickFormatType): string => {
    const date = new Date(ts)
    
    if (formatType === 'time') {
      // HH:mm format
      const hours = date.getHours().toString().padStart(2, '0')
      const mins = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${mins}`
    } else if (formatType === 'day') {
      // "5 déc." format - day + short month, NO time
      const day = date.getDate()
      const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
      return `${day} ${months[date.getMonth()]}`
    } else {
      // "déc. 2024" for very long events
      const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
      return `${months[date.getMonth()]} ${date.getFullYear()}`
    }
  }

  const axisConfig = getAxisConfig()
  const formatPnlTick = (ts: number) => formatTickLabel(ts, axisConfig.formatType)

  // Use real PnL from history (last point in filtered data)
  const currentPnL = chartData.length > 0 
    ? chartData[chartData.length - 1].pnl
    : 0

  // Calculate dynamic YAxis domain with smart padding
  // - Adapts to data range in current timeframe
  // - Always includes 0 as reference
  // - Minimum range of 1000 to avoid over-zooming
  // - 20% padding above/below data
  const pnlValues = chartData.length > 0 ? chartData.map(d => d.pnl) : [0]
  const dataMin = Math.min(...pnlValues)
  const dataMax = Math.max(...pnlValues)
  
  // Ensure 0 is always in range
  const rangeMin = Math.min(dataMin, 0)
  const rangeMax = Math.max(dataMax, 0)
  
  // Calculate data range
  const dataRange = rangeMax - rangeMin
  
  // Minimum range to prevent over-zooming (at least 1000 Zeny visible)
  const minRange = 1000
  const effectiveRange = Math.max(dataRange, minRange)
  
  // Add 20% padding
  const yPadding = effectiveRange * 0.2
  
  // Final Y-axis bounds (always include 0)
  const yAxisMin = Math.min(rangeMin - yPadding, -Math.abs(yPadding))
  const yAxisMax = Math.max(rangeMax + yPadding, Math.abs(yPadding))

  // Dynamic gradient color based on current PnL
  const isPositivePnL = currentPnL >= 0
  const pnlColor = isPositivePnL ? "#10b981" : "#f43f5e" // Green or Red

  // Use profile data if available, otherwise use defaults
  const userStats = {
    totalBets: profile?.total_bets ?? 0,
    winRate: profile?.win_rate ?? 0,
    totalWon: profile?.total_won ?? 0,
    currentStreak: profile?.streak ?? 0,
    avgBetSize: profile?.total_bets ? Math.round(userBalance / Math.max(profile.total_bets, 1)) : 0,
    bestWin: 0, 
    totalPnL: currentPnL, // REAL PnL
    rank: 1, 
    xp: profile?.xp ?? 0,
    level: profile?.level ?? 1,
  }

  const badges = profile?.level && profile.level >= 5 
    ? [{ icon: <Star className="w-3 h-3 text-yellow-400" />, label: `Niveau ${profile.level}` }]
    : []

  const toggleSettings = () => {
    setShowSettings(!showSettings)
    setActiveSettingsTab('menu')
  }

  return (
    <div className="space-y-6 relative">
      {/* Settings Overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border bg-white/5">
              <h3 className="font-bold">Paramètres</h3>
              <button onClick={toggleSettings} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {activeSettingsTab === 'menu' && (
                <div className="space-y-3">
                  <button 
                    onClick={() => setActiveSettingsTab('edit')}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-white/5 border border-border hover:bg-white/10 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <UserCog className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <p className="font-bold text-sm">Modifier le profil</p>
                        <p className="text-xs text-muted-foreground">Avatar, Pseudo, Notifications</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={() => setActiveSettingsTab('password')}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-white/5 border border-border hover:bg-white/10 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <p className="font-bold text-sm">Sécurité</p>
                        <p className="text-xs text-muted-foreground">Changer le mot de passe</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {activeSettingsTab === 'edit' && (
                <EditProfileForm onClose={toggleSettings} />
              )}

              {activeSettingsTab === 'password' && (
                <ChangePasswordForm onClose={toggleSettings} />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight uppercase">Profil</h2>
        <button
          onClick={toggleSettings}
          className="p-2 rounded-lg bg-card border border-border hover:border-white/20 transition-all cursor-pointer"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Header */}
      <div className="rounded-xl bg-card border border-border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <img
            src={user?.avatar || "/images/default-avatar.svg"}
            alt="User Avatar"
            className="w-20 h-20 rounded-full border-4 border-primary/50 ring-4 ring-primary/20 object-cover shrink-0"
          />
          <div className="flex-1 space-y-4 w-full">
            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-3">
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-bold tracking-tight">@{user?.username || "Utilisateur"}</h3>
                
                {/* Level & XP Progress */}
                <div className="mt-2 space-y-1.5 min-w-[180px] sm:min-w-[200px]">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Niveau <span className="text-primary">{userStats.level}</span></span>
                    <span className="text-muted-foreground"><span className="text-foreground">{userStats.xp % 1000}</span> / 1000 XP</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(userStats.xp % 1000) / 10}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider text-center">Balance</p>
                <p className="text-xl font-bold text-center">
                  <span className="font-mono">{userBalance.toLocaleString()}</span>{" "}
                  <CurrencySymbol className="text-primary" />
                </p>
              </div>
            </div>

            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-border text-sm font-medium flex items-center gap-1.5"
                  >
                    <span>{badge.icon}</span>
                    <span>{badge.label}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 pt-4 border-t border-border">
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Win Rate</p>
                <p className="text-sm sm:text-base font-bold font-mono">{userStats.winRate}%</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Paris</p>
                <p className="text-sm sm:text-base font-bold font-mono">{userStats.totalBets}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Streak</p>
                <p className="text-sm sm:text-base font-bold font-mono flex items-center justify-center sm:justify-start gap-1">
                  <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" /> {userStats.currentStreak}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">PnL</p>
                <p className={`text-sm sm:text-base font-bold font-mono flex items-center justify-center sm:justify-start gap-0.5 ${userStats.totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {userStats.totalPnL >= 0 ? "+" : ""}{userStats.totalPnL.toLocaleString()}<CurrencySymbol className="w-3 h-3 sm:w-4 sm:h-4" />
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                  <Trophy className="w-3 h-3" /> Global
                </p>
                <p className="text-sm sm:text-base font-bold font-mono text-primary">
                  {globalRank ? `#${globalRank}` : '-'}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                  <Trophy className="w-3 h-3" /> Saison
                </p>
                <p className="text-sm sm:text-base font-bold font-mono text-amber-400">
                  {seasonRank ? `#${seasonRank}` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Reward Widget - Mobile Only (sidebar hidden on mobile) */}
      <div className="lg:hidden">
        <DailyRewardWidget />
      </div>

      {/* P&L Chart */}
      <div className="rounded-xl bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold tracking-tight uppercase">Profit & Loss</p>
            <p className="text-xs text-muted-foreground">
              Performance {pnlTimeframe === "1J" ? "24 heures" : pnlTimeframe === "1S" ? "7 jours" : pnlTimeframe === "1M" ? "30 jours" : "totale"}
            </p>
          </div>
          <div className="flex gap-1">
            {(["1J", "1S", "1M", "TOUT"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setPnlTimeframe(tf)}
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold font-mono transition-all cursor-pointer border ${
                  pnlTimeframe === tf
                    ? "bg-primary/10 text-primary border-primary/30 shadow-[0_0_10px_rgba(220,38,38,0.15)]"
                    : "bg-transparent text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground hover:bg-white/5"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">Aucun pari terminé</p>
              <p className="text-xs mt-1">Le graphique apparaîtra après ton premier pari résolu</p>
            </div>
          </div>
        ) : (
        <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
            <defs>
                <linearGradient id="pnlGradientPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
                <linearGradient id="pnlGradientNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
            </defs>
            <XAxis 
              dataKey="ts" 
              type="number"
              scale="time"
              domain={axisConfig.domain}
              ticks={axisConfig.ticks}
              tickFormatter={formatPnlTick}
              tick={{ fontSize: 10, fill: "#666" }} 
              axisLine={false} 
              tickLine={false} 
              minTickGap={30}
            />
              <YAxis 
                domain={[yAxisMin, yAxisMax]} 
                tick={{ fontSize: 10, fill: "#666" }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => {
                  const absValue = Math.abs(value)
                  if (absValue >= 1000) {
                    return `${Math.round(value / 1000)}k`
                  }
                  return `${Math.round(value)}`
                }}
              />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
              }}
                formatter={(value: number) => [`${Math.round(value).toLocaleString()} Ƶ`, "P&L"]}
                labelFormatter={(label) => new Date(label).toLocaleString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
            />
              <Area 
                type="monotone" 
                dataKey="pnl" 
                stroke={pnlColor} 
                strokeWidth={2} 
                dot={false} 
                fill={isPositivePnL ? "url(#pnlGradientPositive)" : "url(#pnlGradientNegative)"} 
              />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>

      {/* Transaction History */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <p className="text-sm font-bold tracking-tight uppercase">Historique des paris</p>
        </div>
        {loadingHistory ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Aucun pari pour le moment</p>
            <p className="text-sm text-muted-foreground mt-1">Place ton premier pari pour commencer !</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-white/5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span className="col-span-3">Date</span>
              <span className="col-span-4">Event</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-3 text-right">Gain/Perte</span>
            </div>
            <div className="divide-y divide-border">
              {history.map((tx, idx) => {
                const date = new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                const isWin = tx.status === 'won'
                const isLost = tx.status === 'lost'
                const isPending = tx.status === 'pending'
                
                return (
                  <div key={tx.id} className={`grid grid-cols-12 gap-2 px-4 py-3 text-sm ${idx % 2 === 1 ? "bg-white/5" : ""}`}>
                    <span className="col-span-3 font-mono text-muted-foreground text-xs flex items-center">{date}</span>
                    <div className="col-span-4 flex flex-col justify-center">
                      <span className="font-medium truncate text-xs">{tx.market_question}</span>
                      <span className="text-[10px] text-muted-foreground">
                        Choix: <span className={tx.direction === 'NO' ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                          {tx.direction === 'NO' ? "NON " : tx.direction === 'YES' && tx.outcome_name !== 'OUI' && tx.outcome_name !== 'NON' ? "OUI " : ""}
                        </span>
                        {tx.outcome_name} • Mise: {tx.amount}
                      </span>
                    </div>
                    <span className="col-span-2 flex items-center">
                      {isWin && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <ArrowUpRight className="w-3 h-3" />
                          GAGNÉ
                        </span>
                      )}
                      {isLost && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <ArrowDownRight className="w-3 h-3" />
                          PERDU
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          <Clock className="w-3 h-3" />
                          EN COURS
                        </span>
                      )}
                    </span>
                    <span className={`col-span-3 text-right font-mono font-bold flex items-center justify-end ${
                      isWin ? "text-emerald-400" : isLost ? "text-rose-400" : "text-muted-foreground"
                    }`}>
                      {isWin ? `+${Math.round(tx.potential_payout - tx.amount)}` : isLost ? `-${tx.amount}` : "..."} <CurrencySymbol className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
