"use client"

import { useState } from "react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { AVATAR_MAIN } from "@/lib/mock-data"

export function ProfileView() {
  const [pnlTimeframe, setPnlTimeframe] = useState<"24H" | "7J" | "30J">("30J")

  const userStats = {
    totalBets: 147,
    winRate: 78,
    totalWon: 54200,
    currentStreak: 12,
    avgBetSize: 1850,
    bestWin: 21000,
    totalPnL: 42500,
    rank: 1,
  }

  const generatePnLData = (days: number) => {
    const data = []
    let pnl = 0
    for (let i = 0; i <= days; i++) {
      const change = (Math.random() - 0.4) * 8000
      pnl += change
      pnl = Math.max(-5000, pnl)
      if (i === days) pnl = userStats.totalPnL
      data.push({ day: `${i}`, pnl: Math.round(pnl) })
    }
    return data
  }

  const pnlData =
    pnlTimeframe === "24H" ? generatePnLData(24) : pnlTimeframe === "7J" ? generatePnLData(7) : generatePnLData(30)

  const transactionHistory = [
    { date: "24 Nov", event: "Squeezie GP Explorer 3", status: "Win", bet: 2000, gains: 2360 },
    { date: "23 Nov", event: "Karmine Corp vs Vitality", status: "Lose", bet: 1500, gains: 0 },
    { date: "22 Nov", event: "Ninho Album Platine", status: "Win", bet: 3000, gains: 3270 },
    { date: "21 Nov", event: "Le Reglement Artiste FR", status: "Win", bet: 2500, gains: 4750 },
    { date: "20 Nov", event: "Mbappe Clasico", status: "Lose", bet: 1000, gains: 0 },
    { date: "19 Nov", event: "PNL Album 2026", status: "Win", bet: 4000, gains: 66400 },
  ]

  const badges = [
    { icon: "🏆", label: "Champion" },
    { icon: "🔮", label: "Devin" },
    { icon: "🎯", label: "Sniper" },
    { icon: "⚡", label: "Dieu Vivant" },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight uppercase">Profil</h2>

      {/* Profile Header */}
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="flex items-start gap-6">
          <img
            src={AVATAR_MAIN || "/placeholder.svg"}
            alt="User Avatar"
            className="w-20 h-20 rounded-full border-4 border-amber-500/50 ring-4 ring-amber-500/20 object-cover"
          />
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight">@00thomxs</h3>
                <p className="text-sm text-muted-foreground">
                  Rank <span className="font-mono text-amber-400">#{userStats.rank}</span>
                </p>
              </div>
              <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Benefice Net</p>
                <p className="text-xl font-bold text-emerald-400">
                  <span className="font-mono">+{userStats.totalPnL.toLocaleString()}</span>{" "}
                  <CurrencySymbol className="text-primary" />
                </p>
              </div>
            </div>

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
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg. Bet</p>
                <p className="text-lg font-bold font-mono">
                  {userStats.avgBetSize} <CurrencySymbol />
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Best Win</p>
                <p className="text-lg font-bold font-mono text-emerald-400">
                  +{userStats.bestWin} <CurrencySymbol />
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
          <p className="text-sm font-bold tracking-tight uppercase">Historique</p>
        </div>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-white/5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span className="col-span-2">Date</span>
          <span className="col-span-4">Event</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2 text-right">Bet</span>
          <span className="col-span-2 text-right">Gains</span>
        </div>
        <div className="divide-y divide-border">
          {transactionHistory.map((tx, idx) => (
            <div key={idx} className={`grid grid-cols-12 gap-2 px-4 py-3 text-sm ${idx % 2 === 1 ? "bg-white/5" : ""}`}>
              <span className="col-span-2 font-mono text-muted-foreground">{tx.date}</span>
              <span className="col-span-4 font-medium truncate">{tx.event}</span>
              <span className="col-span-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                    tx.status === "Win" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                  }`}
                >
                  {tx.status === "Win" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {tx.status}
                </span>
              </span>
              <span className="col-span-2 text-right font-mono font-bold">
                <CurrencySymbol /> {tx.bet.toLocaleString()}
              </span>
              <span
                className={`col-span-2 text-right font-mono font-bold ${tx.gains > 0 ? "text-emerald-400" : "text-rose-400"}`}
              >
                {tx.gains > 0 ? `+${tx.gains.toLocaleString()}` : "0"} <CurrencySymbol />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

