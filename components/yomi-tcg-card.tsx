"use client"

import type React from "react"
import { useState, useRef, forwardRef, type MouseEvent } from "react"
import { cn } from "@/lib/utils"
import { Target, Crown, Zap, Trophy, Crosshair, Eye, TrendingUp, Medal, Diamond, Swords, Gamepad2, Brain, Award, Skull, Rocket, Drama, Sprout, BadgeCheck, Star, HelpCircle } from "lucide-react"
import type { Badge } from "@/lib/types"

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
  Eye,
  TrendingUp,
  Trophy,
  Medal,
  Diamond,
  Swords,
  Gamepad2,
  Crosshair,
  Brain,
  Crown,
  Award,
  Skull,
  Zap,
  Rocket,
  Drama,
  Sprout,
  BadgeCheck,
  Star,
  Target,
}

const rankStyles: Record<
  CardRank,
  {
    borderColor: string
    glowColor: string
    accentColor: string
    secondaryGlow: string
    bgBase: string
    gridColor: string
    label: string
  }
> = {
  iron: {
    borderColor: "#52525b",
    glowColor: "rgba(82, 82, 91, 0.4)",
    accentColor: "#71717a",
    secondaryGlow: "rgba(113, 113, 122, 0.3)",
    bgBase: "rgba(39, 39, 42, 0.95)",
    gridColor: "rgba(82, 82, 91, 0.15)",
    label: "FER",
  },
  bronze: {
    borderColor: "#ea580c",
    glowColor: "rgba(234, 88, 12, 0.5)",
    accentColor: "#f97316",
    secondaryGlow: "rgba(249, 115, 22, 0.4)",
    bgBase: "rgba(30, 20, 15, 0.95)",
    gridColor: "rgba(234, 88, 12, 0.12)",
    label: "BRONZE",
  },
  gold: {
    borderColor: "#eab308",
    glowColor: "rgba(234, 179, 8, 0.5)",
    accentColor: "#facc15",
    secondaryGlow: "rgba(250, 204, 21, 0.4)",
    bgBase: "rgba(28, 25, 15, 0.95)",
    gridColor: "rgba(234, 179, 8, 0.12)",
    label: "OR",
  },
  diamond: {
    borderColor: "#06b6d4",
    glowColor: "rgba(6, 182, 212, 0.5)",
    accentColor: "#22d3ee",
    secondaryGlow: "rgba(34, 211, 238, 0.4)",
    bgBase: "rgba(15, 25, 30, 0.95)",
    gridColor: "rgba(6, 182, 212, 0.1)",
    label: "DIAMANT",
  },
  holographic: {
    borderColor: "linear-gradient(135deg, #ffffff, #e8e8e8, #d4d4d8, #ffffff)",
    glowColor: "rgba(255, 255, 255, 0.7)",
    accentColor: "#ffffff",
    secondaryGlow: "rgba(228, 228, 231, 0.6)",
    bgBase: "rgba(30, 30, 40, 0.9)",
    gridColor: "rgba(255, 255, 255, 0.08)",
    label: "HOLOGRAPHIQUE",
  },
}

function StreakBadge({ streak }: { streak: number }) {
  const getFlameColor = () => {
    if (streak >= 20) return "#a855f7" // purple
    if (streak >= 10) return "#f97316" // orange
    if (streak >= 5) return "#ef4444" // red
    if (streak >= 1) return "#06b6d4" // cyan
    return "#52525b" // gray
  }

  if (streak === 0) return null

  const color = getFlameColor()

  return (
    <div
      className="absolute -bottom-2 -right-3 z-20 flex items-center gap-0.5"
      style={{ filter: `drop-shadow(0 0 8px ${color})` }}
    >
      <svg width="18" height="22" viewBox="0 0 24 28" fill="none">
        <path
          d="M12 0C12 0 15 5 15 9C15 11 16 12 17.5 11C19 10 21 12 21 15C21 21 17 26 12 26C7 26 3 21 3 15C3 12 5 10 6.5 11C8 12 9 11 9 9C9 5 12 0 12 0Z"
          fill={color}
        />
      </svg>
      <span className="font-black text-sm" style={{ color: color }}>
        {streak}+
      </span>
    </div>
  )
}

export const YomiTCGCard = forwardRef<HTMLDivElement, YomiTCGCardProps>(({
  rank,
  seasonNumber,
  seasonTitle,
  username,
  level,
  pnl,
  totalBets,
  streak,
  equippedBadges,
  avatarUrl = "/placeholder-avatar.png",
}, ref) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState("")
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 })

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const element = cardRef.current || (ref as React.RefObject<HTMLDivElement>)?.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 12
    const rotateY = (centerX - x) / 12

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`)
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25,
    })
  }

  const handleMouseLeave = () => {
    setTransform("")
    setGlarePos({ x: 50, y: 50, opacity: 0 })
  }

  const styles = rankStyles[rank]
  const isHolo = rank === "holographic"
  const isHighRank = rank === "holographic" || rank === "diamond" || rank === "gold"
  const pnlColor = pnl >= 0 ? "#22c55e" : "#ef4444"
  const pnlPrefix = pnl >= 0 ? "+" : ""

  // Get badges to display (max 2)
  const displayBadges = equippedBadges.slice(0, 2)

  return (
    <div
      ref={ref || cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative cursor-pointer transition-transform duration-200 ease-out group"
      style={{ transform, transformStyle: "preserve-3d" }}
    >
      {/* Flames for high ranks */}
      {isHighRank && (
        <div className="absolute -inset-4 z-0 pointer-events-none overflow-visible">
          <svg
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[140%] h-28"
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`flame-grad-${rank}`} x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#ef4444" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
              <filter id="flame-blur">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>
            <path
              className="animate-[flameWave_1.5s_ease-in-out_infinite]"
              d="M0,100 Q50,60 80,80 Q110,40 140,70 Q170,30 200,55 Q230,25 260,60 Q290,35 320,75 Q350,50 380,85 Q400,70 400,100 Z"
              fill={`url(#flame-grad-${rank})`}
              filter="url(#flame-blur)"
            />
          </svg>
        </div>
      )}

      {/* Outer glow */}
      <div
        className="absolute -inset-1 rounded-2xl transition-all duration-300"
        style={{
          background: isHolo
            ? `linear-gradient(135deg, #ffffff, #e4e4e7, #a1a1aa, #e4e4e7, #ffffff)`
            : styles.borderColor,
          filter: isHolo ? "blur(20px)" : "blur(15px)",
          opacity: isHolo ? 0.9 : 0.7,
        }}
      />

      {isHolo ? (
        <div
          className="absolute -inset-[4px] rounded-2xl z-10 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, #ffffff 0%, #e4e4e7 25%, #a1a1aa 50%, #e4e4e7 75%, #ffffff 100%)`,
            backgroundSize: "200% 200%",
            animation: "shimmer 3s ease-in-out infinite",
            boxShadow: `0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(228, 228, 231, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)`,
          }}
        />
      ) : (
        <div
          className="absolute -inset-[4px] rounded-2xl z-10"
          style={{
            background: styles.borderColor,
            boxShadow: `0 0 30px ${styles.glowColor}, 0 0 60px ${styles.secondaryGlow}`,
          }}
        />
      )}

      {/* Card body */}
      <div
        className="relative w-[320px] aspect-[2/3] rounded-xl overflow-hidden z-20"
        style={{ background: styles.bgBase }}
      >
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% 100%, ${styles.glowColor}50 0%, transparent 70%)`,
          }}
        />

        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 80% 10%, ${styles.glowColor}30 0%, transparent 60%)`,
          }}
        />

        {/* Grid background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(${styles.gridColor} 1px, transparent 1px),
              linear-gradient(90deg, ${styles.gridColor} 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />

        {/* Ambient glow effects */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${styles.glowColor}10 0%, transparent 70%)`,
            opacity: 0.15,
          }}
        />

        {/* Holographic foil overlay */}
        {isHolo && (
          <div
            className="absolute inset-0 z-30 pointer-events-none opacity-20"
            style={{
              background: `linear-gradient(
                135deg,
                rgba(255,255,255,0.15) 0%,
                rgba(255,255,255,0) 40%,
                rgba(255,255,255,0) 60%,
                rgba(255,255,255,0.1) 100%
              )`,
            }}
          />
        )}

        {/* Glare effect */}
        <div
          className="absolute inset-0 pointer-events-none z-40 transition-opacity duration-150"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}) 0%, transparent 50%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-20 h-full flex flex-col p-4">
          {/* Header - Logo left, Level right */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="flex items-baseline">
                {isHolo ? (
                  <>
                    <span
                      className="font-black text-xl tracking-tight"
                      style={{
                        background:
                          "linear-gradient(135deg, #ff3333 0%, #ff9500 15%, #00d4ff 35%, #ff00ff 55%, #0066ff 75%, #8b00ff 90%, #ff3333 100%)",
                        backgroundSize: "200% 200%",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        filter: "drop-shadow(0 0 10px rgba(255,255,255,0.7))",
                      }}
                    >
                      YOMI
                    </span>
                    <span
                      className="font-semibold text-sm"
                      style={{
                        background: "linear-gradient(135deg, #00d4ff 0%, #ff00ff 50%, #ff3333 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      .fun
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className="font-black text-xl tracking-tight"
                      style={{ color: "#ef4444", textShadow: "0 0 20px rgba(239, 68, 68, 0.9)" }}
                    >
                      YOMI
                    </span>
                    <span className="font-semibold text-sm text-white">.fun</span>
                  </>
                )}
              </div>
              {/* Season tag */}
              <div
                className="mt-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider"
                style={{
                  background: `${styles.accentColor}15`,
                  border: `1px solid ${styles.accentColor}40`,
                  color: styles.accentColor,
                }}
              >
                Saison {seasonNumber} : {seasonTitle}
              </div>
            </div>
            <div className="flex flex-col items-end" style={{ filter: `drop-shadow(0 0 10px ${styles.glowColor})` }}>
              <span className="text-[10px] font-semibold font-mono uppercase tracking-wider text-zinc-400">Niveau</span>
              <span
                className="font-black text-3xl font-mono"
                style={{
                  color: styles.accentColor,
                  textShadow: `0 0 15px ${styles.glowColor}`,
                }}
              >
                {level}
              </span>
            </div>
          </div>

          {/* Avatar section */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative mb-4">
              <div
                className="absolute -inset-4 rounded-full"
                style={{
                  background: isHolo
                    ? `conic-gradient(from 180deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #8b5cf6, #ec4899, #ef4444)`
                    : `radial-gradient(circle, ${styles.accentColor} 0%, ${styles.accentColor} 40%, transparent 70%)`,
                  filter: "blur(10px)",
                  opacity: isHolo ? 0.7 : 0.9,
                  animation: "pulse-glow 3s ease-in-out infinite",
                }}
              />
              <div
                className="absolute -inset-2 rounded-full"
                style={{
                  background: isHolo
                    ? `radial-gradient(circle, ${styles.accentColor}40 0%, ${styles.accentColor}20 50%, transparent 70%)`
                    : `radial-gradient(circle, ${styles.accentColor}90 0%, ${styles.accentColor}60 40%, transparent 70%)`,
                  filter: "blur(6px)",
                }}
              />
              {/* Avatar image */}
              <div
                className="relative w-28 h-28 rounded-full overflow-hidden bg-zinc-900"
                style={{
                  boxShadow: isHolo
                    ? `0 0 20px ${styles.glowColor}, 0 0 40px ${styles.glowColor}50, inset 0 0 20px rgba(0,0,0,0.5)`
                    : `0 0 25px ${styles.accentColor}, 0 0 50px ${styles.glowColor}, 0 0 70px ${styles.glowColor}80, inset 0 0 20px rgba(0,0,0,0.5)`,
                }}
              >
                <img src={avatarUrl || "/placeholder.svg"} alt={username} className="w-full h-full object-cover" />
              </div>
              {/* Streak badge */}
              <StreakBadge streak={streak} />
            </div>

            {/* Username */}
            <h2
              className="text-white font-black text-xl tracking-tight mb-3"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}
            >
              @{username}
            </h2>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <span className="text-zinc-400 text-[10px] font-semibold font-mono uppercase block">PnL</span>
                <span
                  className="font-mono font-black text-lg block"
                  style={{ color: pnlColor, textShadow: `0 0 10px ${pnlColor}60` }}
                >
                  {pnlPrefix}
                  {Math.abs(pnl).toLocaleString()} Ƶ
                </span>
              </div>
              <div
                className="w-px h-8"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${styles.accentColor}50, transparent)`,
                }}
              />
              <div className="text-center">
                <span className="text-zinc-400 text-[10px] font-semibold font-mono uppercase block">Paris</span>
                <span
                  className="font-mono font-black text-lg block"
                  style={{
                    color: styles.accentColor,
                    textShadow: `0 0 8px ${styles.glowColor}`,
                  }}
                >
                  {totalBets}
                </span>
              </div>
            </div>
          </div>

          {/* Badges section */}
          <div className="space-y-2 mb-4">
            {displayBadges.length > 0 ? (
              displayBadges.map((badge, i) => {
                const IconComponent = ICON_MAP[badge.iconName] || HelpCircle
                return (
                  <div
                    key={i}
                    className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 overflow-hidden"
                    style={{
                      background: `linear-gradient(90deg, ${styles.accentColor}15 0%, transparent 100%)`,
                      border: `1px solid ${styles.accentColor}40`,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                      style={{
                        background: `${styles.accentColor}20`,
                        border: `1px solid ${styles.accentColor}60`,
                      }}
                    >
                      <IconComponent className="h-4 w-4" style={{ color: styles.accentColor }} />
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                      <span
                        className="font-black text-sm uppercase tracking-wide shrink-0"
                        style={{
                          color: styles.accentColor,
                          textShadow: `0 0 10px ${styles.glowColor}`,
                        }}
                      >
                        {badge.name}
                      </span>
                      <span className="text-zinc-300 text-[10px] text-right leading-tight truncate">{badge.description}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              // Placeholder for no badges
              <div
                className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 opacity-50"
                style={{
                  background: `linear-gradient(90deg, ${styles.accentColor}10 0%, transparent 100%)`,
                  border: `1px dashed ${styles.accentColor}30`,
                }}
              >
                <span className="text-zinc-500 text-xs italic">Aucun badge équipé</span>
              </div>
            )}
          </div>
        </div>

        {/* Scan lines */}
        <div
          className="absolute inset-0 pointer-events-none z-30 opacity-[0.015]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)",
          }}
        />
      </div>
    </div>
  )
})

YomiTCGCard.displayName = "YomiTCGCard"

// Export rank styles for external use
export { rankStyles }
