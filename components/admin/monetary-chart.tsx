"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Line } from "recharts"
import { CurrencySymbol } from "@/components/ui/currency-symbol"

export type MonetarySnapshotPoint = {
  captured_at: string
  total_supply: number
  total_burned: number
}

function formatDayLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

export function MonetaryChart({ points }: { points: MonetarySnapshotPoint[] }) {
  if (!points || points.length < 2) {
    return (
      <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground italic">
        Pas assez de snapshots pour afficher un graphe (il faut au moins 2 jours).
      </div>
    )
  }

  const data = points.map((p) => ({
    date: p.captured_at,
    label: formatDayLabel(p.captured_at),
    supply: Number(p.total_supply || 0),
    burned: Number(p.total_burned || 0),
  }))

  const maxY = Math.max(...data.map((d) => d.supply), ...data.map((d) => d.burned))

  return (
    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Tendance (30j)</p>
          <p className="text-sm text-muted-foreground">
            <span className="text-white/80 font-bold">Supply</span> vs{" "}
            <span className="text-amber-400 font-bold">Burn</span>
          </p>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {data.length} pts
        </div>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="supplyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="burnFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={18}
            />
            <YAxis
              domain={[0, Math.ceil(maxY * 1.05)]}
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(0,0,0,0.9)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
              }}
              labelStyle={{ color: "rgba(255,255,255,0.7)" }}
              formatter={(value: any, name: string) => {
                const v = Number(value || 0).toLocaleString("fr-FR")
                const label = name === "supply" ? "Supply" : "Burn"
                return [
                  <span key={name} className="font-mono font-bold text-white/90 flex items-center gap-1">
                    {v} <CurrencySymbol />
                  </span>,
                  label,
                ]
              }}
            />

            <Area type="monotone" dataKey="supply" stroke="#ffffff" strokeOpacity={0.55} strokeWidth={2} fill="url(#supplyFill)" />
            <Line type="monotone" dataKey="burned" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="burned" stroke="#f59e0b" strokeOpacity={0.5} strokeWidth={1} fill="url(#burnFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


