"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"

type Stage = "idle" | "crack" | "shatter" | "revealed"

export function YomiCardPack({
  children,
  onReveal,
}: {
  children: React.ReactNode
  onReveal?: () => void
}) {
  const [stage, setStage] = useState<Stage>("idle")

  // Simplified shards - only 20 for performance
  const shards = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => {
      const angle = (i / 20) * 360 + Math.random() * 18
      const distance = 120 + Math.random() * 100
      
      return {
        id: i,
        startX: 50 + (Math.random() - 0.5) * 40,
        startY: 50 + (Math.random() - 0.5) * 60,
        endX: Math.cos((angle * Math.PI) / 180) * distance,
        endY: Math.sin((angle * Math.PI) / 180) * distance,
        size: 20 + Math.random() * 30,
        rotation: (Math.random() - 0.5) * 360,
        delay: i * 0.02,
      }
    })
  }, [])

  // Simple cracks
  const cracks = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => {
      const angle = (i / 8) * 360
      return {
        id: i,
        angle,
        length: 35 + Math.random() * 25,
        delay: i * 0.03,
      }
    })
  }, [])

  const triggerOpen = () => {
    if (stage !== "idle") return
    
    setStage("crack")
    setTimeout(() => setStage("shatter"), 300)
    setTimeout(() => {
      setStage("revealed")
      onReveal?.()
    }, 900)
  }

  if (stage === "revealed") {
    return (
      <div className="animate-in zoom-in-95 fade-in duration-500">
        {children}
      </div>
    )
  }

  return (
    <div
      onClick={triggerOpen}
      className={cn(
        "relative w-[320px] aspect-[2/3] cursor-pointer select-none",
        stage === "idle" && "hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
      )}
    >
      {/* Glow */}
      <div
        className={cn(
          "absolute -inset-8 rounded-2xl pointer-events-none transition-all duration-300",
          stage === "idle" && "opacity-40",
          stage === "crack" && "opacity-100",
          stage === "shatter" && "opacity-0",
        )}
        style={{
          background: 'radial-gradient(ellipse, rgba(239, 68, 68, 0.5) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Cracks */}
      {(stage === "crack" || stage === "shatter") && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {cracks.map((c) => {
            const cx = 160, cy = 240
            const ex = cx + Math.cos((c.angle * Math.PI) / 180) * c.length * 3
            const ey = cy + Math.sin((c.angle * Math.PI) / 180) * c.length * 4
            return (
              <g key={c.id}>
                <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="#ef4444" strokeWidth="4" filter="url(#glow)"
                  style={{ strokeDasharray: 200, strokeDashoffset: 200, animation: `crack 0.15s ease-out forwards ${c.delay}s` }}/>
                <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="white" strokeWidth="1.5"
                  style={{ strokeDasharray: 200, strokeDashoffset: 200, animation: `crack 0.15s ease-out forwards ${c.delay}s` }}/>
              </g>
            )
          })}
        </svg>
      )}

      {/* Shards */}
      {stage === "shatter" && shards.map((s) => (
        <div
          key={s.id}
          className="absolute pointer-events-none z-30"
          style={{
            left: `${s.startX}%`,
            top: `${s.startY}%`,
            width: s.size,
            height: s.size * 1.3,
            background: 'linear-gradient(145deg, #1a1a1f, #0d0d12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            clipPath: 'polygon(15% 0%, 90% 10%, 100% 60%, 70% 100%, 0% 85%)',
            animation: `shardFly 0.6s ease-out forwards`,
            animationDelay: `${s.delay}s`,
            // @ts-ignore
            '--x': `${s.endX}px`,
            '--y': `${s.endY}px`,
            '--r': `${s.rotation}deg`,
          }}
        />
      ))}

      {/* Flash */}
      {stage === "shatter" && (
        <div 
          className="absolute -inset-20 pointer-events-none z-40 rounded-3xl"
          style={{
            background: 'radial-gradient(circle, white 0%, transparent 50%)',
            animation: 'flash 0.3s ease-out forwards',
          }}
        />
      )}

      {/* Pack */}
      <div
        className={cn(
          "relative w-full h-full rounded-xl overflow-hidden transition-all",
          stage === "shatter" && "opacity-0 scale-90",
        )}
        style={{
          background: 'linear-gradient(145deg, #0d0d12 0%, #1a1a22 50%, #0d0d12 100%)',
          boxShadow: '0 0 40px rgba(239, 68, 68, 0.4), 0 10px 40px rgba(0,0,0,0.5)',
          transitionDuration: '0.15s',
        }}
      >
        {/* Border */}
        <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-br from-primary via-primary/50 to-primary opacity-70"/>
        <div className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(145deg, #0d0d12, #1a1a22, #0d0d12)' }}/>

        {/* Grid */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(239,68,68,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.4) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}/>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
          <div className="flex items-baseline">
            <span className="font-black text-5xl tracking-tighter italic text-primary" style={{ textShadow: '0 0 40px rgba(239,68,68,0.8)' }}>YOMI</span>
            <span className="font-semibold text-2xl text-white">.fun</span>
          </div>
          <div className="w-20 h-20 rounded-xl border-2 border-primary/50 flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)', boxShadow: '0 0 30px rgba(239,68,68,0.3)' }}>
            <span className="text-4xl font-black text-primary">?</span>
          </div>
          <span className={cn("text-xs font-bold uppercase tracking-widest text-zinc-500", stage !== "idle" && "opacity-0")}>
            Cliquez pour ouvrir
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes crack { to { stroke-dashoffset: 0; } }
        @keyframes shardFly {
          to { transform: translate(var(--x), var(--y)) rotate(var(--r)) scale(0.3); opacity: 0; }
        }
        @keyframes flash {
          0% { opacity: 0; transform: scale(0.5); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.5); }
        }
      `}</style>
    </div>
  )
}
