"use client"

import { useState, useEffect } from "react"
import { ArrowUpRight, ArrowDownRight, Settings, Key, Clock } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { useUser } from "@/contexts/user-context"
import { createClient } from "@/lib/supabase/client"

type Transaction = {
  id: string
  created_at: string
  market_question: string
  outcome_name: string
  amount: number
  status: 'pending' | 'won' | 'lost'
  potential_payout: number
}

export function ProfileView() {
  const { user, profile, userBalance } = useUser()
  const [pnlTimeframe, setPnlTimeframe] = useState<"24H" | "7J" | "30J">("30J")
  const [showSettings, setShowSettings] = useState(false)
  const [history, setHistory] = useState<Transaction[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('bets')
        .select(`
          id,
          created_at,
          amount,
          status,
          potential_payout,
          outcome_id,
          markets (question),
          outcomes (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        const formattedHistory = data.map((bet: any) => ({
          id: bet.id,
          created_at: bet.created_at,
          market_question: bet.markets?.question || "Marché inconnu",
          outcome_name: bet.outcomes?.name || "?",
          amount: bet.amount,
          status: bet.status,
          potential_payout: bet.potential_payout
        }))
        setHistory(formattedHistory)
      }
      setLoadingHistory(false)
    }

    fetchHistory()
  }, [user])

  // Use profile data if available, otherwise use defaults
  const userStats = {
    totalBets: profile?.total_bets ?? 0,
    winRate: profile?.win_rate ?? 0,
    totalWon: profile?.total_won ?? 0,
    currentStreak: profile?.streak ?? 0,
    avgBetSize: profile?.total_bets ? Math.round(userBalance / Math.max(profile.total_bets, 1)) : 0,
    bestWin: 0, // Not tracked yet
    totalPnL: (profile?.total_won ?? 0) - (userBalance - 10000), // Approximate P&L
    rank: 1, // TODO: Calculate from leaderboard
    xp: profile?.xp ?? 0,
    level: profile?.level ?? 1,
  }

  const generatePnLData = (days: number) => {
    const data = []
    let pnl = 0
    for (let i = 0; i <= days; i++) {
      const change = (Math.random() - 0.4) * 2000
      pnl += change
      pnl = Math.max(-5000, pnl)
      if (i === days) pnl = userStats.totalPnL
      data.push({ day: `${i}`, pnl: Math.round(pnl) })
    }
    return data
  }

  const pnlData =
    pnlTimeframe === "24H" ? generatePnLData(24) : pnlTimeframe === "7J" ? generatePnLData(7) : generatePnLData(30)

  const badges = profile?.level && profile.level >= 5 
    ? [{ icon: "⭐", label: `Niveau ${profile.level}` }]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight uppercase">Profil</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg bg-card border border-border hover:border-white/20 transition-all"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="rounded-xl bg-card border border-border p-6 space-y-4">
          <h3 className="text-lg font-bold">Paramètres du compte</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-border">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Changer le mot de passe</p>
                  <p className="text-xs text-muted-foreground">Modifier votre mot de passe</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all">
                Modifier
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <div>
                <p className="text-sm font-medium text-rose-400">Supprimer le compte</p>
                <p className="text-xs text-muted-foreground">Cette action est irréversible</p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-rose-500/20 text-rose-400 text-sm font-semibold hover:bg-rose-500/30 transition-all">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="flex items-start gap-6">
          <img
            src={user?.avatar || "/images/avatar.jpg"}
            alt="User Avatar"
            className="w-20 h-20 rounded-full border-4 border-primary/50 ring-4 ring-primary/20 object-cover"
          />
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight">@{user?.username || "Utilisateur"}</h3>
                <p className="text-sm text-muted-foreground">
                  Niveau <span className="font-mono text-primary">{userStats.level}</span>
                  <span className="mx-2">•</span>
                  <span className="font-mono">{userStats.xp} XP</span>
                </p>
              </div>
              <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Balance</p>
                <p className="text-xl font-bold">
                  <span className="font-mono">{userBalance.toLocaleString()}</span>{" "}
                  <CurrencySymbol className="text-primary" />
                </p>
              </div>
            </div>

            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
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

            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Win Rate</p>
                <p className="text-lg font-bold font-mono">{userStats.winRate}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Bets</p>
                <p className="text-lg font-bold font-mono">{userStats.totalBets}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Streak</p>
                <p className="text-lg font-bold font-mono">🔥 {userStats.currentStreak}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Won</p>
                <p className="text-lg font-bold font-mono text-emerald-400">
                  +{userStats.totalWon} <CurrencySymbol />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* P&L Chart */}
      <div className="rounded-xl bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold tracking-tight uppercase">Profit & Loss</p>
            <p className="text-xs text-muted-foreground">
              Performance {pnlTimeframe === "24H" ? "24 heures" : pnlTimeframe === "7J" ? "7 jours" : "30 jours"}
            </p>
          </div>
          <div className="flex gap-2">
            {(["24H", "7J", "30J"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setPnlTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  pnlTimeframe === tf
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/5 border border-border hover:border-white/20"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={pnlData}>
            <defs>
              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`${value.toLocaleString()} Ƶ`, "P&L"]}
            />
            <Area type="monotone" dataKey="pnl" stroke="#10b981" strokeWidth={2} dot={false} fill="url(#pnlGradient)" />
          </AreaChart>
        </ResponsiveContainer>
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
                      <span className="text-[10px] text-muted-foreground">Choix: {tx.outcome_name} • Mise: {tx.amount}</span>
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
