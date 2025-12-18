"use client"

import type React from "react"
import { useState, useRef, forwardRef, useEffect, type MouseEvent } from "react"
import { cn } from "@/lib/utils"
import { Target, Crown, Zap, Trophy, Crosshair, Eye, TrendingUp, Medal, Diamond, Swords, Gamepad2, Brain, Award, Skull, Rocket, Drama, Sprout, BadgeCheck, Star, HelpCircle } from "lucide-react"

// Types
export type CardRank = "iron" | "bronze" | "gold" | "diamond" | "holographic"

export interface CardBadge {
  name: string
  description: string
  iconName: string
}

export interface YomiTCGCardProps {
  rank: CardRank
  seasonNumber: string
  seasonTitle: string
  username: string
  level: number
  pnl: number
  totalBets: number
  streak: number
  equippedBadges: CardBadge[]
  avatarUrl?: string
}

// Icon mapping for badges
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Eye, TrendingUp, Trophy, Medal, Diamond, Swords, Gamepad2, Crosshair, Brain, Crown, Award, Skull, Zap, Rocket, Drama, Sprout, BadgeCheck, Star, Target,
}

const rankStyles: Record<CardRank, {
  borderColor: string
  glowColor: string
  accentColor: string
  bgBase: string
  auraColor1: string
  auraColor2: string
  label: string
}> = {
  iron: {
    borderColor: "#52525b",
    glowColor: "rgba(82, 82, 91, 0.5)",
    accentColor: "#71717a",
    bgBase: "#18181b",
    auraColor1: "rgba(82, 82, 91, 0.3)",
    auraColor2: "rgba(82, 82, 91, 0.1)",
    label: "FER",
  },
  bronze: {
    borderColor: "#ea580c",
    glowColor: "rgba(234, 88, 12, 0.6)",
    accentColor: "#f97316",
    bgBase: "#1c1410",
    auraColor1: "rgba(234, 88, 12, 0.5)",
    auraColor2: "rgba(249, 115, 22, 0.2)",
    label: "BRONZE",
  },
  gold: {
    borderColor: "#eab308",
    glowColor: "rgba(234, 179, 8, 0.6)",
    accentColor: "#facc15",
    bgBase: "#1c1a10",
    auraColor1: "rgba(234, 179, 8, 0.6)",
    auraColor2: "rgba(250, 204, 21, 0.3)",
    label: "OR",
  },
  diamond: {
    borderColor: "#06b6d4",
    glowColor: "rgba(6, 182, 212, 0.6)",
    accentColor: "#22d3ee",
    bgBase: "#0f1a1e",
    auraColor1: "rgba(6, 182, 212, 0.6)",
    auraColor2: "rgba(34, 211, 238, 0.3)",
    label: "DIAMANT",
  },
  holographic: {
    borderColor: "#ffffff",
    glowColor: "rgba(255, 255, 255, 0.8)",
    accentColor: "#ffffff",
    bgBase: "#1a1a24",
    auraColor1: "rgba(255, 255, 255, 0.7)",
    auraColor2: "rgba(200, 200, 255, 0.4)",
    label: "HOLO",
  },
}

function StreakBadge({ streak }: { streak: number }) {
  const color = streak >= 20 ? "#a855f7" : streak >= 10 ? "#f97316" : streak >= 5 ? "#ef4444" : streak >= 1 ? "#06b6d4" : "#52525b"
  return (
    <div className="absolute -bottom-1 -right-2 z-20 flex items-center gap-0.5" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
      <svg width="16" height="20" viewBox="0 0 24 28" fill="none">
        <path d="M12 0C12 0 15 5 15 9C15 11 16 12 17.5 11C19 10 21 12 21 15C21 21 17 26 12 26C7 26 3 21 3 15C3 12 5 10 6.5 11C8 12 9 11 9 9C9 5 12 0 12 0Z" fill={color}/>
      </svg>
      <span className="font-black text-xs" style={{ color }}>{streak}+</span>
    </div>
  )
}

export const YomiTCGCard = forwardRef<HTMLDivElement, YomiTCGCardProps>(({
  rank, seasonNumber, seasonTitle, username, level, pnl, totalBets, streak, equippedBadges, avatarUrl = "/placeholder-avatar.png",
}, ref) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState("")
  const [gyroEnabled, setGyroEnabled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) return
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (!isMobile) return

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return
      const gamma = Math.max(-25, Math.min(25, e.gamma))
      const beta = Math.max(-25, Math.min(25, e.beta - 45))
      setTransform(`perspective(1000px) rotateX(${-beta / 3}deg) rotateY(${gamma / 3}deg) scale3d(1.02, 1.02, 1.02)`)
    }

    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission()
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation)
            setGyroEnabled(true)
          }
        } catch {}
      } else {
        window.addEventListener('deviceorientation', handleOrientation)
        setGyroEnabled(true)
      }
    }
    requestPermission()
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [])

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (gyroEnabled) return
    const element = cardRef.current || (ref as React.RefObject<HTMLDivElement>)?.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    const rotateX = ((e.clientY - rect.top) - rect.height / 2) / 15
    const rotateY = (rect.width / 2 - (e.clientX - rect.left)) / 15
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`)
  }

  const handleMouseLeave = () => {
    if (!gyroEnabled) setTransform("")
  }

  const styles = rankStyles[rank]
  const isHighRank = rank === "gold" || rank === "diamond" || rank === "holographic"
  const isHolo = rank === "holographic"
  const displayBadges = equippedBadges.slice(0, 2)

  return (
    <div
      ref={ref || cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative cursor-pointer transition-transform duration-200 ease-out"
      style={{ transform, transformStyle: "preserve-3d" }}
    >
      {/* AURA EFFECT - Super Saiyan style */}
      {isHighRank && (
        <div className="absolute -inset-3 z-0 pointer-events-none">
          {/* Main animated aura */}
          <div 
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `
                radial-gradient(ellipse 120% 80% at 50% 100%, ${styles.auraColor1} 0%, transparent 60%),
                radial-gradient(ellipse 100% 60% at 50% 0%, ${styles.auraColor2} 0%, transparent 50%)
              `,
              animation: 'auraPulse 2s ease-in-out infinite',
            }}
          />
          {/* Rising energy particles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 rounded-full"
              style={{
                height: 8 + Math.random() * 16,
                left: `${10 + (i / 12) * 80}%`,
                bottom: 0,
                background: `linear-gradient(to top, ${styles.accentColor}, transparent)`,
                animation: `auraParticle ${1 + Math.random()}s ease-out infinite`,
                animationDelay: `${i * 0.1}s`,
                opacity: 0.7,
              }}
            />
          ))}
          {/* Outer glow ring */}
          <div 
            className="absolute -inset-1 rounded-2xl"
            style={{
              border: `2px solid ${styles.accentColor}40`,
              boxShadow: `0 0 20px ${styles.glowColor}, 0 0 40px ${styles.auraColor2}`,
              animation: 'auraGlow 1.5s ease-in-out infinite alternate',
            }}
          />
        </div>
      )}

      {/* Card border glow */}
      <div
        className="absolute -inset-[3px] rounded-2xl z-10"
        style={{
          background: isHolo 
            ? `linear-gradient(135deg, #fff, #e4e4e7, #a1a1aa, #e4e4e7, #fff)`
            : styles.borderColor,
          boxShadow: `0 0 25px ${styles.glowColor}`,
          backgroundSize: isHolo ? '200% 200%' : undefined,
          animation: isHolo ? 'shimmer 3s ease-in-out infinite' : undefined,
        }}
      />

      {/* Card body */}
      <div
        className="relative w-[320px] aspect-[2/3] rounded-xl overflow-hidden z-20"
        style={{ background: styles.bgBase }}
      >
        {/* Inner glow gradients */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 100%, ${styles.glowColor}40 0%, transparent 60%)`
        }}/>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 60% 40% at 80% 10%, ${styles.glowColor}20 0%, transparent 50%)`
        }}/>

        {/* Tactical grid */}
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: `linear-gradient(${styles.accentColor}40 1px, transparent 1px), linear-gradient(90deg, ${styles.accentColor}40 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}/>

        {/* Header */}
        <div className="relative p-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-lg overflow-hidden border-2" style={{ borderColor: styles.accentColor }}>
                <img src={avatarUrl} alt={username} className="w-full h-full object-cover"/>
              </div>
              {streak > 0 && <StreakBadge streak={streak}/>}
            </div>
            <div>
              <p className="font-black text-base truncate max-w-[140px]">{username}</p>
              <p className="text-xs font-bold" style={{ color: styles.accentColor }}>Niveau {level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: styles.accentColor }}>Saison {seasonNumber}</p>
            <p className="text-xs text-zinc-400 truncate max-w-[80px]">{seasonTitle}</p>
          </div>
        </div>

        {/* YOMI Logo */}
        <div className="flex justify-center py-4">
          <div className="flex items-baseline">
            <span className="font-black text-4xl tracking-tighter" style={{ color: styles.accentColor, textShadow: `0 0 30px ${styles.glowColor}` }}>YOMI</span>
            <span className="font-semibold text-lg text-white">.fun</span>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 space-y-3">
          <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: `${styles.accentColor}10`, border: `1px solid ${styles.accentColor}20` }}>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">PnL Saison</span>
            <span className="font-black text-lg" style={{ color: pnl >= 0 ? '#22c55e' : '#ef4444' }}>
              {pnl >= 0 ? '+' : ''}{pnl.toLocaleString()} Ƶ
            </span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 p-2 rounded-lg text-center" style={{ background: `${styles.accentColor}08`, border: `1px solid ${styles.accentColor}15` }}>
              <p className="text-[10px] text-zinc-500 uppercase">Paris</p>
              <p className="font-bold" style={{ color: styles.accentColor }}>{totalBets}</p>
            </div>
            <div className="flex-1 p-2 rounded-lg text-center" style={{ background: `${styles.accentColor}08`, border: `1px solid ${styles.accentColor}15` }}>
              <p className="text-[10px] text-zinc-500 uppercase">Tier</p>
              <p className="font-bold" style={{ color: styles.accentColor }}>{styles.label}</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="px-4 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: styles.accentColor }}>Badges équipés</p>
          {displayBadges.length > 0 ? (
            <div className="space-y-2">
              {displayBadges.map((badge, i) => {
                const IconComponent = ICON_MAP[badge.iconName] || HelpCircle
                return (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: `${styles.accentColor}10`, border: `1px solid ${styles.accentColor}20` }}>
                    <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: `${styles.accentColor}20` }}>
                      <IconComponent className="w-4 h-4" style={{ color: styles.accentColor }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{badge.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{badge.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-3 rounded-lg text-center" style={{ border: `1px dashed ${styles.accentColor}30` }}>
              <span className="text-zinc-500 text-xs italic">Aucun badge équipé</span>
            </div>
          )}
        </div>

        {/* Scan lines */}
        <div className="absolute inset-0 pointer-events-none z-30 opacity-[0.02]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)',
        }}/>
      </div>

      <style jsx>{`
        @keyframes auraPulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
        @keyframes auraParticle {
          0% { transform: translateY(0) scaleY(1); opacity: 0.7; }
          100% { transform: translateY(-60px) scaleY(1.5); opacity: 0; }
        }
        @keyframes auraGlow {
          0% { opacity: 0.4; }
          100% { opacity: 0.8; }
        }
        @keyframes shimmer {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: 0% 0; }
        }
      `}</style>
    </div>
  )
})

YomiTCGCard.displayName = "YomiTCGCard"
export { rankStyles }
