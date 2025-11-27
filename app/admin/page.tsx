"use client"

import { MARKETS_DATA } from "@/lib/mock-data"
import { CurrencySymbol } from "@/components/ui/currency-symbol"
import { MoreHorizontal, Edit, Trash, ExternalLink, PlayCircle, StopCircle } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  // Use Mock Data for now
  const markets = MARKETS_DATA

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de la plateforme YOMI.fun
          </p>
        </div>
        <Link
          href="/admin/create"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <PlayCircle className="w-4 h-4" />
          Nouveau Marché
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Volume Total", value: "12.5M", suffix: <CurrencySymbol /> },
          { label: "Marchés Actifs", value: "12", suffix: "" },
          { label: "Utilisateurs", value: "1,240", suffix: "" },
          { label: "Revenus (Est.)", value: "4,500", suffix: "€" },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {stat.label}
            </p>
            <p className="text-2xl font-bold mt-2 flex items-center gap-1">
              {stat.value} {stat.suffix}
            </p>
          </div>
        ))}
      </div>

      {/* Markets Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-bold">Marchés Récents</h2>
          <div className="flex gap-2">
            <select className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none">
              <option>Tous les status</option>
              <option>Live</option>
              <option>Fermé</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-muted-foreground font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Question</th>
                <th className="px-6 py-3">Catégorie</th>
                <th className="px-6 py-3">Volume</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Fin</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {markets.map((market) => (
                <tr key={market.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium max-w-md truncate">
                    {market.question}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10">
                      {market.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {market.volume}
                  </td>
                  <td className="px-6 py-4">
                    {market.isLive ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs font-bold uppercase">
                        Fermé
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {market.countdown}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                        <Edit className="w-4 h-4" />
                      </button>
                      <Link 
                        href={`/market/${market.id}`}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
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

