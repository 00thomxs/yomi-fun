"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getRecentActivity, type ActivityItem } from "@/app/actions/activity"
import { CurrencySymbol } from "@/components/ui/currency-symbol"

const REFRESH_MS = 20_000

function timeAgo(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return "à l'instant"
  const m = Math.round(s / 60)
  if (m < 60) return `il y a ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `il y a ${h} h`
  return `il y a ${Math.round(h / 24)} j`
}

function choiceLabel(item: ActivityItem) {
  const side = item.direction === "NO" ? "NON" : "OUI"
  // Binary markets name their outcomes OUI/NON already
  return item.outcome && item.outcome !== "OUI" && item.outcome !== "NON" ? `${side} ${item.outcome}` : side
}

export function ActivityFeed({ marketId, limit = 8, title = "En direct" }: { marketId?: string; limit?: number; title?: string }) {
  const [items, setItems] = useState<ActivityItem[] | null>(null)

  useEffect(() => {
    let alive = true
    const load = () => getRecentActivity(marketId, limit).then(r => alive && setItems(r)).catch(() => alive && setItems([]))
    load()
    const id = setInterval(() => document.visibilityState === "visible" && load(), REFRESH_MS)
    return () => { alive = false; clearInterval(id) }
  }, [marketId, limit])

  if (items && items.length === 0) return null

  return (
    <section className="space-y-3" aria-live="polite">
      <h3 className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <span className="relative flex w-1.5 h-1.5" aria-hidden>
          <span className="absolute inset-0 rounded-full bg-brand animate-ping opacity-60" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-brand" />
        </span>
        {title}
      </h3>
      <ul className="divide-y divide-border border-y border-border">
        {items === null
          ? Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="py-2.5"><div className="h-8 rounded bg-white/5 animate-pulse" /></li>
            ))
          : items.map(item => {
              const no = item.direction === "NO"
              const body = (
                <>
                  <img src={item.avatar} alt="" className="w-7 h-7 rounded object-cover shrink-0 bg-muted" />
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="truncate">
                      <span className="font-semibold">{item.username}</span>
                      <span className="text-muted-foreground"> a misé </span>
                      <span className="font-mono font-semibold">{item.amount.toLocaleString()}</span>
                      <CurrencySymbol className="text-brand ml-0.5" />
                      <span className="text-muted-foreground"> sur </span>
                      <span className={`font-semibold ${no ? "text-no" : "text-yes"}`}>{choiceLabel(item)}</span>
                    </p>
                    <p className="truncate text-muted-foreground mt-0.5">
                      {!marketId && <>{item.question} · </>}
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>
                </>
              )
              return (
                <li key={item.id} className="animate-in fade-in duration-300">
                  {marketId ? (
                    <div className="flex items-center gap-2.5 py-2.5">{body}</div>
                  ) : (
                    <Link href={`/market/${item.marketId}`} className="flex items-center gap-2.5 py-2.5 hover:bg-surface-hover transition-colors">
                      {body}
                    </Link>
                  )}
                </li>
              )
            })}
      </ul>
    </section>
  )
}
